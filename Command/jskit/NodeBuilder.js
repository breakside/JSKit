// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "Builder.js"
// #import "Resources.js"
'use strict';

// buildURL
//   - Dockerfile
//   - {ProjectName}
//     - Resources
//     - Frameworks
//     - Node
//       - {ExecutableName}
//       - ...javascript...

JSClass("NodeBuilder", Builder, {

    bundleType: "node",

    options: {
        'debug-port':   {valueType: "integer", default: 8081,   help: "The port on which to bind during local debugging"},
        'docker-owner': {default: null,                         help: "The docker repo prefix to use when building a docker image"},
        'docker-image': {default: null,                         help: "The name to use when building a docker image"},
        'docker-tag':   {default: null,                         help: "An optional docker tag for the built image"},
        'no-docker':    {kind: "flag",                          help: "Don't build the docker image"}
    },

    needsDockerBuild: true,
    hasLinkedDispatchFramework: false,

    // -----------------------------------------------------------------------
    // MARK: - Building


    bundleURL: null,
    resourcesURL: null,
    frameworksURL: null,
    nodeURL: null,
    executableURL: null,

    setup: async function(){
        await NodeBuilder.$super.setup.call(this);
        this.buildURL = this.buildsRootURL.appendingPathComponents([this.project.info.JSBundleIdentifier, this.debug ? "debug" : this.buildLabel], true);
        this.watchlist.push(this.project.url);
        this.isJSKit = this.project.info.JSBundleIdentifier == "io.breakside.jskit";
        this.executableRequires = [];
        this.bundleURL = this.buildURL.appendingPathComponent(this.executableName, true);
        this.resourcesURL = this.bundleURL.appendingPathComponent("Resources", true);
        this.frameworksURL = this.bundleURL.appendingPathComponent("Frameworks", true);
        this.nodeURL = this.bundleURL.appendingPathComponent("Node", true);
        this.executableURL = this.nodeURL.appendingPathComponent(this.executableName);
        this.workerURL = this.nodeURL.appendingPathComponent("JSDispatch-worker.js");
        var exists = await this.fileManager.itemExistsAtURL(this.bundleURL);
        if (exists){
            this.printer.setStatus("Cleaning old build...");
            var entries = await this.fileManager.contentsOfDirectoryAtURL(this.bundleURL);
            for (let i = 0, l = entries.length; i < l; ++i){
                let entry = entries[i];
                if (this.isJSKit && entry.itemType == JSFileManager.ItemType.symbolicLink){
                    // don't delete dev symlinks out from under us
                    continue;
                }
                await this.fileManager.removeItemAtURL(entry.url);
            }
        }
        await this.fileManager.createDirectoryAtURL(this.bundleURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
        await this.fileManager.createDirectoryAtURL(this.frameworksURL);
        await this.fileManager.createDirectoryAtURL(this.nodeURL);
    },

    build: async function(){
        await this.setup();
        await this.findResources();
        await this.findImports();
        await this.bundleFrameworks();
        await this.bundleResources();
        await this.bundleJavascript();
        await this.buildExecutable();
        if (this.hasLinkedDispatchFramework){
            await this.buildWorker();
        }
        if (this.isJSKit){
            await this.bundleJSKitRoot();
        }
        await this.buildNPM();
        await this.copyLicense();
        await this.copyReadme();
        await this.bundleInfo();
        await this.buildDocker();
        await this.finish();
    },

    findImports: async function(){
        this.printer.setStatus("Finding code...");
        this.imports = await this.project.findJavascriptImports();
    },

    // ----------------------------------------------------------------------
    // MARK: - Frameworks

    buildFramework: async function(url){
        let result = await NodeBuilder.$super.buildFramework.call(this, url);
        this.watchlist.push(url);
        return result;
    },

    bundleFrameworks: async function(){
        var frameworks = await this.buildFrameworks(this.imports.frameworks, 'node');
        for (let i = 0, l = frameworks.length; i < l; ++i){
            let framework = frameworks[i];
            if (framework.url){
                await this.bundleFramework(framework);
            }
        }
    },

    bundleFramework: async function(framework){
        var bundledURL = this.frameworksURL.appendingPathComponent(framework.url.lastPathComponent, true);
        this.printer.setStatus("Copying %s...".sprintf(bundledURL.lastPathComponent));
        await this.fileManager.copyItemAtURL(framework.url, bundledURL);
        await this.addFrameworkSources(framework, 'generic');
        await this.addFrameworkSources(framework, 'node');
        await this.addBundleJS(bundledURL, bundledURL.appendingPathComponent("Resources", true), framework.info, framework.resources);
        if (framework.info.JSBundleIdentifier == 'io.breakside.JSKit.Dispatch'){
            this.hasLinkedDispatchFramework = true;
        }
    },

    addFrameworkSources: async function(framework, env){
        let environments = framework.sources;
        if (!environments){
            return;
        }
        let sources = environments[env];
        if (!sources){
            return;
        }
        if (!sources.files){
            return;
        }
        let directory = framework.url.lastPathComponent;
        for (let i = 0, l = sources.files.length; i < l; ++i){
            let path = "../Frameworks/" + directory + "/JS/" + sources.files[i];
            this.executableRequires.push(path);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Resources

    resources: null,

    findResources: async function(){
        this.printer.setStatus("Finding resources...");
        await this.project.loadResources(this.printer);
        this.resources = this.project.resources;
    },

    bundleResources: async function(){
        for (let i = 0, l = this.resources.metadata.length; i < l; ++i){
            let metadata = this.resources.metadata[i];
            let url = this.resources.sourceURLs[i];
            let bundledURL = JSURL.initWithString(metadata.path, this.resourcesURL);
            this.printer.setStatus("Copying %s...".sprintf(url.lastPathComponent));
            await this.fileManager.copyItemAtURL(url, bundledURL);
        }
        await this.addBundleJS(this.nodeURL, this.resourcesURL, this.project.info, this.resources, true);
    },

    addBundleJS: async function(parentURL, resourcesURL, info, resources, isMain){
        var bundle = {
            Info: info,
            Resources: [],
            ResourceLookup: {},
            Fonts: []
        };
        if (isMain){
            if (this.hasLinkedDispatchFramework){
                bundle.Info = JSCopy(bundle.Info);
                bundle.Info.JSNodeDispatchQueueWorkerModule = this.workerURL.lastPathComponent;
            }
        }
        if (resources){
            for (let i = 0, l = resources.metadata.length; i < l; ++i){
                let metadata = JSCopy(resources.metadata[i]);
                let url = resourcesURL.appendingPathComponent(metadata.path);
                metadata.nodeBundlePath = url.encodedStringRelativeTo(this.bundleURL);
                bundle.Resources.push(metadata);
                if (metadata.font){
                    bundle.Fonts.push(i);
                }
            }
            if (resources.lookup){
                bundle.ResourceLookup = resources.lookup;
            }
        }
        var json = JSON.stringify(bundle, null, 2);
        var js = "'use strict';\nJSBundle.bundles['%s'] = %s;\n".sprintf(info.JSBundleIdentifier, json);
        if (isMain){
            js += 'JSBundle.mainBundleIdentifier = "%s";\n'.sprintf(info.JSBundleIdentifier);
            js += 'var path = require("path");\n';
            js += 'JSBundle.nodeRootPath = path.dirname(path.dirname(__filename));\n';
        }
        var jsURL = parentURL.appendingPathComponent("%s-bundle.js".sprintf(info.JSBundleIdentifier));
        await this.fileManager.createFileAtURL(jsURL, js.utf8());
        var path = jsURL.encodedStringRelativeTo(this.executableURL);
        this.executableRequires.push(path);
    },

    // -----------------------------------------------------------------------
    // MARK: - Javscript Code from Project

    bundleJavascript: async function(){
        for (let i = 0, l = this.imports.files.length; i < l; ++i){
            let file = this.imports.files[i];
            let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
            let bundledURL = JSURL.initWithString(bundledPath, this.nodeURL);
            await this.fileManager.copyItemAtURL(file.url, bundledURL);
            this.executableRequires.push(bundledPath);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Executable
    
    executableRequires: null,
    executableName: JSReadOnlyProperty(),

    getExecutableName: function(){
        return this.project.info.JSExecutableName;
    },

    buildExecutable: async function(){
        var lines = [
            "#!/usr/bin/env node",
            "'use strict';",
            "",
            "global.JSGlobalObject = global;",
            ""
        ];
        var entryPoint = this.project.entryPoint;
        var path;
        var hasEntry = false;
        for (let i = 0, l = this.executableRequires.length; i < l; ++i){
            path = this.executableRequires[i];
            if (path == entryPoint.path){
                if (hasEntry){
                    throw new Error("Entry point matches multiple files");
                }
                lines.push('var entry = require("./%s").%s;'.sprintf(path, entryPoint.fn));
                hasEntry = true;
            }else{
                lines.push('require("./%s");'.sprintf(path));
            }
        }
        if (!hasEntry){
            throw new Error("Entry point not found in code");
        }
        if (this.isJSKit){
            lines.push("");
            lines.push('var path = require("path");');
            lines.push('global.JSKitRootDirectoryPath = path.join(path.dirname(path.dirname(__filename)), "Root");');
        }
        lines.push("");
        lines.push("entry();");
        lines.push("");
        var exe = lines.join("\n").utf8();
        await this.fileManager.createFileAtURL(this.executableURL, exe);
        await this.fileManager.makeExecutableAtURL(this.executableURL);

        let localPath = this.fileManager.relativePathFromURL(this.workingDirectoryURL, this.executableURL);
        let packagePath = this.fileManager.relativePathFromURL(this.workingDirectoryURL, this.bundleURL);
        if (this.debug){
            this.commands.push("node --inspect-brk " + localPath);
        }else{
            this.commands.push(localPath);
            this.commands.push("npm publish --access public " + packagePath);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Worker

    buildWorker: async function(){
        this.printer.setStatus("Creating worker.js...");
        var lines = [
            "'use strict';",
            "",
            "global.JSGlobalObject = global;",
            ""
        ];
        for (let i = 0, l = this.executableRequires.length; i < l; ++i){
            let path = this.executableRequires[i];
            lines.push('require("./%s");'.sprintf(path));
        }
        lines.push("var queueWorker = JSNodeDispatchQueueWorker.init();\n");
        var js = lines.join("\n").utf8();
        await this.fileManager.createFileAtURL(this.workerURL, js);
    },

    // -----------------------------------------------------------------------
    // MARK: - Node Package Manager (npm)

    buildNPM: async function(){
        await this.buildPackageJSON();
        await this.copyPackageLock();
        await this.linkNodeModules();
    },

    buildPackageJSON: async function(){
        var packageURL = this.project.url.appendingPathComponent("package.json");
        var exists = await this.fileManager.itemExistsAtURL(packageURL);
        if (!exists){
            return;
        }
        var packageJSON = await this.fileManager.contentsAtURL(packageURL);
        var pkg = JSON.parse(packageJSON.stringByDecodingUTF8());
        pkg.name = this.project.info.JSExecutableName;
        if (this.project.info.NPMOrganization){
            pkg.name = "@%s/%s".sprintf(this.project.info.NPMOrganization, pkg.name);
        }
        pkg.version = this.project.info.JSBundleVersion;
        var licenseName = this.project.licenseFilename;
        pkg.license = "SEE LICENSE IN %s".sprintf(licenseName);
        pkg.files = ["*"];
        pkg.bin = "./" + this.executableURL.encodedStringRelativeTo(this.bundleURL);
        var outputPackageURL = this.bundleURL.appendingPathComponent("package.json");
        packageJSON = JSON.stringify(pkg, null, 2);
        await this.fileManager.createFileAtURL(outputPackageURL, packageJSON.utf8());
    },

    copyPackageLock: async function(){
        var packageURL = this.project.url.appendingPathComponent("package-lock.json");
        var exists = await this.fileManager.itemExistsAtURL(packageURL);
        if (!exists){
            return;
        }
        var toURL = this.bundleURL.appendingPathComponent("package-lock.json");
        await this.fileManager.copyItemAtURL(packageURL, toURL);
    },

    linkNodeModules: async function(){
        var modulesURL = this.project.url.appendingPathComponent('node_modules');
        var exists = await this.fileManager.itemExistsAtURL(modulesURL);
        if (!exists){
            return;
        }
        var linkURL = this.buildURL.appendingPathComponent('node_modules');
        var relativeURL = JSURL.initWithString(modulesURL.encodedStringRelativeTo(linkURL));
        exists = await this.fileManager.itemExistsAtURL(linkURL);
        if (exists){
            await this.fileManager.removeItemAtURL(linkURL);
        }
        await this.fileManager.createSymbolicLinkAtURL(linkURL, relativeURL);
    },

    // -----------------------------------------------------------------------
    // MARK: - Info & License

    copyLicense: async function(){
        var licenseName = this.project.licenseFilename;
        var originalURL = this.project.url.appendingPathComponent(licenseName);
        var licenseURL = this.bundleURL.appendingPathComponent(licenseName);
        var exists = await this.fileManager.itemExistsAtURL(originalURL);
        if (exists){
            await this.fileManager.copyItemAtURL(originalURL, licenseURL);   
        }
    },

    copyReadme: async function(){
        var readmeName = "README.md";
        var originalURL = this.project.url.appendingPathComponent(readmeName);
        var licenseURL = this.bundleURL.appendingPathComponent(readmeName);
        var exists = await this.fileManager.itemExistsAtURL(originalURL);
        if (exists){
            await this.fileManager.copyItemAtURL(originalURL, licenseURL);   
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Docker

    buildDocker: async function(){
        if (this.arguments['no-docker']){
            return;
        }
        if (!this.needsDockerBuild){
            return;
        }
        this.needsDockerBuild = false;
        var dockerfileURL = this.project.url.appendingPathComponent("Dockerfile");
        var exists = await this.fileManager.itemExistsAtURL(dockerfileURL);
        if (!exists){
            return;
        }
        var contents = await this.fileManager.contentsAtURL(dockerfileURL);
        var dockerfile = contents.stringByDecodingUTF8();
        var params = {
            BUILD_ID: this.buildId,
            PORT: 80
        };
        dockerfile = dockerfile.replacingTemplateParameters(params);
        var url = this.buildURL.appendingPathComponent("Dockerfile");
        await this.fileManager.createFileAtURL(url, dockerfile);

        var makeTag = function(tag){
            return "%s%s:%s".sprintf(prefix ? prefix + '/' : '', image, tag).toLowerCase();
        };

        var prefix = this.arguments['docker-owner'] || this.project.info.DockerOwner;
        var image = this.arguments['docker-image'] || this.project.lastIdentifierPart;
        var tag;
        if (this.arguments["docker-tag"] !== null){
            tag = this.arguments["docker-tag"];
        }else if (this.debug){
            tag = "debug";
        }else{
            tag = this.project.info.JSBundleVersion;
        }
        var identifier = makeTag(tag);
        var name = this.project.info.JSBundleIdentifier.replace('/\./g', '_');

        this.printer.setStatus("Building docker image %s...".sprintf(identifier));

        const { spawn } = require('child_process');
        var args = ["build", "-t", identifier, "."];
        var cwd = this.fileManager.pathForURL(this.buildURL);
        var docker = spawn("docker", args, {cwd: cwd});
        var err = "";
        docker.stderr.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });
        var builder = this;
        return new Promise(function(resolve, reject){
            docker.on('close', function(code){
                if (code === 1 && err.startsWith("Cannot connect to the Docker daemon")){
                    builder.printer.print("Warning: Docker not running, skipping `docker build`.  Please start docker to use this feature.\n");
                    resolve();
                    return;
                }
                if (code !== 0){
                    reject(new Error("Failed to build docker image\n" + err));
                    return;
                }

                var bundleName = builder.bundleURL.lastPathComponent;
                var bundlePath = builder.fileManager.pathForURL(builder.bundleURL);
                builder.commands.push([
                    "docker run",
                    "--rm",
                    "--name " + name,
                    "-p%d:80".sprintf(builder.arguments['debug-port']),
                    identifier
                ].join(" \\\n    "));
                resolve();
            });
            docker.on('error', function(){
                builder.printer.print("Warning: Docker not available, skipping `docker build`.  You'll need to install docker to use this feature.\n");
                resolve();
            });
        });
    },

    // -----------------------------------------------------------------------
    // MARK: - Special resource copying for jskit

    bundleJSKitRoot: async function(){
        let bundledRootURL = this.bundleURL.appendingPathComponent("Root");
        if (this.debug){
            // A debug build is only done within a local JSKit development environment,
            // so we can a link back to JSKit based on known directory structure
            // JSKit/builds/io.breakside.jskit/debug/jskit/Root
            let jskitURL = JSURL.initWithString("../../../../");
            let exists = await this.fileManager.itemExistsAtURL(bundledRootURL);
            if (!exists){
                await this.fileManager.createSymbolicLinkAtURL(bundledRootURL, jskitURL);
            }
        }else{
            // A release build should copy JSKit/Frameworks and JSKit/Templates to bundle/Root/.
            // so they're available to the packaged jskit command
            let jskitURL = this.fileManager.urlForPath(JSKitRootDirectoryPath);
            let folders = ["Frameworks", "Templates"];
            for (let i = 0, l = folders.length; i < l; ++i){
                let folder = folders[i];
                let fromURL = jskitURL.appendingPathComponent(folder, true);
                let toURL = bundledRootURL.appendingPathComponent(folder, true);
                await this.fileManager.copyItemAtURL(fromURL, toURL);
            }
        }
    }

});