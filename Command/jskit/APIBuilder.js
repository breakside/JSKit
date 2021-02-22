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
//   - {ProjectName}
//     - index.js
//     - Resources
//     - Frameworks
//     - API
//       - ...javascript...

JSClass("APIBuilder", Builder, {

    bundleType: "api",

    options: {
        "service": {default: "awslambda", options: ["awslambda"], help: "The service on which the api will run"},
    },

    // -----------------------------------------------------------------------
    // MARK: - Building


    bundleURL: null,
    resourcesURL: null,
    frameworksURL: null,
    apiURL: null,
    zipPaths: null,

    setup: async function(){
        await APIBuilder.$super.setup.call(this);
        this.buildURL = this.buildsRootURL.appendingPathComponents([this.project.info.JSBundleIdentifier, this.debug ? "debug" : this.buildLabel], true);
        this.watchlist.push(this.project.url);
        this.executableRequires = [];
        this.bundleURL = this.buildURL.appendingPathComponent(this.project.name, true);
        this.resourcesURL = this.bundleURL.appendingPathComponent("Resources", true);
        this.frameworksURL = this.bundleURL.appendingPathComponent("Frameworks", true);
        this.apiURL = this.bundleURL.appendingPathComponent("API", true);
        var exists = await this.fileManager.itemExistsAtURL(this.bundleURL);
        if (exists){
            this.printer.setStatus("Cleaning old build...");
            var entries = await this.fileManager.contentsOfDirectoryAtURL(this.bundleURL);
            for (let i = 0, l = entries.length; i < l; ++i){
                let entry = entries[i];
                await this.fileManager.removeItemAtURL(entry.url);
            }
        }
        await this.fileManager.createDirectoryAtURL(this.bundleURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
        await this.fileManager.createDirectoryAtURL(this.frameworksURL);
        await this.fileManager.createDirectoryAtURL(this.apiURL);
        this.zipPaths = [
            this.resourcesURL.lastPathComponent,
            this.frameworksURL.lastPathComponent,
            this.apiURL.lastPathComponent
        ];
        this.project.info.APIService = this.arguments.service;
        this.shouldTag = false;
    },

    build: async function(){
        await this.setup();
        await this.findResources();
        await this.findImports();
        await this.bundleFrameworks();
        await this.bundleResources();
        await this.bundleJavascript();
        switch (this.arguments.service){
            case "awslambda":
                await this.buildAWSLambda();
                break;
        }
        await this.bundleDependencies();
        await this.bundleInfo();
        if (!this.debug){
            await this.zipBundle();
        }
        await this.finish();
    },

    findImports: async function(){
        this.printer.setStatus("Finding code...");
        this.imports = await this.project.findJavascriptImports();
    },

    // ----------------------------------------------------------------------
    // MARK: - Frameworks

    buildFramework: async function(url){
        let result = await APIBuilder.$super.buildFramework.call(this, url);
        this.watchlist.push(url);
        return result;
    },

    bundleFrameworks: async function(){
        var frameworks = await this.buildFrameworks(this.imports.frameworks, "node");
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
        await this.addFrameworkSources(framework, "generic");
        await this.addFrameworkSources(framework, "node");
        await this.addFrameworkSources(framework, "awslambda");
        await this.addBundleJS(bundledURL, bundledURL.appendingPathComponent("Resources", true), framework.info, framework.resources);
        if (framework.info.JSBundleIdentifier == 'io.breakside.JSKit.Dispatch'){
            throw new Error("Cannot use Dispatch in api projects");
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
            let path = "Frameworks/" + directory + "/JS/" + sources.files[i];
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
        await this.addBundleJS(this.apiURL, this.resourcesURL, this.project.info, this.resources, true);
    },

    addBundleJS: async function(parentURL, resourcesURL, info, resources, isMain){
        var bundle = {
            Info: info,
            Resources: [],
            ResourceLookup: {},
            Fonts: []
        };
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
        var path = jsURL.encodedStringRelativeTo(this.bundleURL);
        this.executableRequires.push(path);
    },

    // -----------------------------------------------------------------------
    // MARK: - Javscript Code from Project

    bundleJavascript: async function(){
        for (let i = 0, l = this.imports.files.length; i < l; ++i){
            let file = this.imports.files[i];
            let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
            let bundledURL = JSURL.initWithString(bundledPath, this.apiURL);
            await this.fileManager.copyItemAtURL(file.url, bundledURL);
            this.executableRequires.push(bundledPath);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Executable
    
    executableRequires: null,

    buildAWSLambda: async function(){
        var lines = [
            "'use strict';",
            "",
            "global.JSGlobalObject = global;",
            ""
        ];
        var indexURL = this.bundleURL.appendingPathComponent("index.js");
        for (let i = 0, l = this.executableRequires.length; i < l; ++i){
            let path = this.executableRequires[i];
            lines.push('require("./%s");'.sprintf(path));
        }
        lines.push("exports.handler = async (event) => {");
        lines.push("  return await APILambda(event);");
        lines.push("};");
        var index = lines.join("\n").utf8();
        await this.fileManager.createFileAtURL(indexURL, index);

        let localPath = this.fileManager.relativePathFromURL(this.workingDirectoryURL, indexURL);
        let packagePath = this.fileManager.relativePathFromURL(this.workingDirectoryURL, this.bundleURL);
        if (this.debug){
            this.commands.push("node --inspect-brk " + localPath);
        }
        this.zipPaths.push(indexURL.lastPathComponent);
    },

    bundleDependencies: async function(){
        var packageURL = this.project.url.appendingPathComponent("package.json");
        var exists = await this.fileManager.itemExistsAtURL(packageURL);
        if (!exists){
            return;
        }
        var toURL = this.bundleURL.appendingPathComponent("package.json");
        await this.fileManager.copyItemAtURL(packageURL, toURL);

        const { spawn } = require('child_process');
        var cwd = this.fileManager.pathForURL(this.bundleURL);
        var args = ["install"];
        var npm = spawn("npm", args, {cwd: cwd});
        var err = "";
        var builder = this;
        npm.stderr.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });
        return new Promise(function(resolve, reject){
            npm.on('close', function(code){
                if (code !== 0){
                    reject(new Error("Failed to install dependencies\n" + err));
                    return;
                }
                resolve();
            });
            npm.on('error',function(){
                builder.printer.print("Warning: npm not available, skipping bundle archive\n");
                resolve();
            });
        });
    },

    zipBundle: async function(){
        const { spawn } = require('child_process');
        var cwd = this.fileManager.pathForURL(this.bundleURL);
        var path = "%s.zip".sprintf(cwd.substr(0, cwd.length - 1));
        var args = ["-r", path].concat(this.zipPaths);
        var zip = spawn("zip", args, {cwd: cwd});
        var err = "";
        var builder = this;
        zip.stderr.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });
        return new Promise(function(resolve, reject){
            zip.on('close', function(code){
                if (code !== 0){
                    reject(new Error("Failed to zip api bundle\n" + err));
                    return;
                }
                resolve();
            });
            zip.on('error',function(){
                builder.printer.print("Warning: zip not available, skipping bundle archive\n");
                resolve();
            });
        });
    }

});