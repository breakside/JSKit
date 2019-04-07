// #import "Builder.js"
// #import "Resources.js"
// #import Hash
/* global JSClass, JSObject, JSCopy, JSReadOnlyProperty, JSURL, Builder, NodeBuilder, JSSHA1Hash, Resources */
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
        'port':         {valueType: "integer", default: 8081,   help: "The port on which the node application will be available"},
        'docker-owner': {default: null,                         help: "The docker repo prefix to use when building a docker image"}
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
        await this.copyInfo();
        await this.buildDocker();
        await this.finish();
    },

    findImports: async function(){
        this.printer.setStatus("Finding code...");
        var entryPoint = this.project.entryPoint;
        var includeDirectoryURLs = await this.project.findIncludeDirectoryURLs();
        var roots = [entryPoint.path];
        var resourceImportPaths = await this.resources.getImportPaths(includeDirectoryURLs);
        roots = roots.concat(resourceImportPaths);
        if (!this.project.info.SKMainSpec && this.project.info.SKApplicationDelegate){
            roots.push(this.project.info.SKApplicationDelegate + ".js");
        }
        this.imports = await this.project.findJavascriptImports(roots, includeDirectoryURLs);
    },

    // ----------------------------------------------------------------------
    // MARK: - Frameworks

    buildFramework: async function(url){
        let builtURL = await NodeBuilder.$super.buildFramework.call(this, url);
        this.watchlist.push(url);
        return builtURL;
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
        var blacklist = {
            names: new Set(["Info.yaml", "Info.json", "package.json", "Dockerfile", this.project.licenseFilename])
        };
        this.printer.setStatus("Finding resources...");
        var resourceURLs = await this.project.findResourceURLs(blacklist);
        var resources = Resources.initWithFileManager(this.fileManager);
        for (let i = 0, l = resourceURLs.length; i < l; ++i){
            let url = resourceURLs[i];
            this.printer.setStatus("Inspecting %s...".sprintf(url.lastPathComponent));
            await resources.addResourceAtURL(url);
        }
        this.resources = resources;
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
        var json = JSON.stringify(bundle, null, this.debug ? 2 : 0);
        var js = "'use strict';\nJSBundle.bundles['%s'] = %s;\n".sprintf(info.JSBundleIdentifier, json);
        if (isMain){
            js += 'JSBundle.mainBundleIdentifier = "%s";\n'.sprintf(info.JSBundleIdentifier);
            js += 'var path = require("path");\n';
            js += 'JSBundle.nodeRootPath = path.dirname(path.dirname(__filename));\n';
        }
        var jsURL = parentURL.appendingPathComponent("node-bundle.js");
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
        if (this.debug){
            this.commands.push("node --inspect-brk " + localPath);
        }else{
            this.commands.push(localPath);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Worker

    buildWorker: async function(){
        this.printer.updateStatus("Creating worker.js...");
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
        var packageURL = this.project.url.appendingPathComponent("package.json");
        var exists = await this.fileManager.itemExistsAtURL(packageURL);
        if (!exists){
            return;
        }
        var mainjs = "// cannot be included as a module, only usable as a command line tool\n";
        var mainURL = this.bundleURL.appendingPathComponent("npmmain.js");
        await this.fileManager.createFileAtURL(mainURL, mainjs.utf8());
        var packageJSON = await this.fileManager.contentsAtURL(packageURL);
        var pkg = JSON.parse(packageJSON.stringByDecodingUTF8());
        pkg.name = this.project.info.JSExecutableName;
        pkg.version = this.project.info.JSBundleVersion;
        var licenseName = this.project.licenseFilename;
        pkg.license = "SEE LICENSE IN %s" % licenseName;
        pkg.files = ["*"];
        pkg.main = 'npmmain.js';
        pkg.bin = "./" + this.executableURL.encodedStringRelativeTo(this.bundleURL);
        var outputPackageURL = this.bundleURL.appendingPathComponent("package.json");
        packageJSON = JSON.stringify(pkg, null, this.debug ? 2 : 0);
        await this.fileManager.createFileAtURL(outputPackageURL, packageJSON.utf8());
    },

    // -----------------------------------------------------------------------
    // MARK: - Info & License

    copyInfo: async function(){
        var infoName = this.project.infoURL.lastPathComponent;
        var infoURL = this.bundleURL.appendingPathComponent(infoName);
        await this.fileManager.copyItemAtURL(this.project.infoURL, infoURL);
    },

    copyLicense: async function(){
        var licenseName = this.project.licenseFilename;
        var originalURL = this.project.url.appendingPathComponent(licenseName);
        var licenseURL = this.bundleURL.appendingPathComponent(licenseName);
        var exists = await this.fileManager.itemExistsAtURL(originalURL);
        if (exists){
            await this.fileManager.copyItemAtURL(originalURL, licenseURL);   
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Docker

    buildDocker: async function(){
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
            PORT: this.arguments.port
        };
        dockerfile = dockerfile.replacingTemplateParameters(params);
        var url = this.buildURL.appendingPathComponent("Dockerfile");
        await this.fileManager.createFileAtURL(url, dockerfile);

        var prefix = this.arguments['docker-owner'] || this.project.info.DockerOwner;
        var image = this.project.lastIdentifierPart;
        var tag = this.debug ? 'debug' : this.buildLabel;
        var identifier = "%s%s:%s".sprintf(prefix ? prefix + '/' : '', image, tag).toLowerCase();
        var name = this.project.info.JSBundleIdentifier.replace('/\./g', '_');

        this.printer.setStatus("Building docker image %s...".sprintf(identifier));

        const { spawn } = require('child_process');
        var args = ["build", "-t", identifier, '.'];
        var cwd = this.fileManager.pathForURL(this.buildURL);
        var docker = spawn("docker", args, {cwd: cwd});
        var err = "";
        docker.stderr.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });

        var bundleName = this.bundleURL.lastPathComponent;
        var bundlePath = this.fileManager.pathForURL(this.bundleURL);
        this.commands.push([
            "docker run",
            "--rm",
            "--name " + name,
            "-p%d:%d".sprintf(this.arguments.port, this.arguments.port),
            "--mount type=bind,source=%s,target=/%s".sprintf(bundlePath, bundleName),
            identifier
        ].join(" \\\n    "));
        return new Promise(function(resolve, reject){
            docker.on('close', function(code){
                if (code !== 0){
                    reject(new Error("Error building docker: " + err));
                }
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