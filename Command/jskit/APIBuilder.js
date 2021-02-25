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

var http = require('http');
var child_process = require("child_process");

JSClass("APIBuilder", Builder, {

    bundleType: "api",

    options: {
        "service": {default: "awslambda", options: ["awslambda"], help: "The service on which the api will run"},
        "http-port": {valueType: "integer", default: null, help: "Start a debug server on this port"},
        "debug-env": {default: ".env", help: "Use this env file for debug server requests"}
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
        if (this.debug && this.arguments["http-port"]){
            this.startDebugServer(this.arguments["http-port"]);
        }
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
            let projectPath = file.url.encodedStringRelativeTo(this.project.url);
            let bundledURL = JSURL.initWithString(projectPath, this.apiURL);
            let bundledPath = bundledURL.encodedStringRelativeTo(this.bundleURL);
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

        if (this.debug){
            var debugURL = this.bundleURL.appendingPathComponent("debugrequesthandler.js");
            lines = [];
            lines.push("var index = require('./index.js');");
            lines.push("process.on('message', function(event){");
            lines.push("  index.handler(event).then(function(response){");
            lines.push("    process.send(response);");
            lines.push("  }, function(error){");
            lines.push("    process.send({statusCode: 500, body: JSON.stringify({message: error.message, stack: error.stack})});");
            lines.push("  });");
            lines.push("});");
            var debug = lines.join("\n").utf8();
            await this.fileManager.createFileAtURL(debugURL, debug);
        }
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
    },

    // -----------------------------------------------------------------------
    // MARK: - Debug Server

    startDebugServer: async function(port){
        var cwd = this.fileManager.pathForURL(this.bundleURL);
        var moduleName = "debugrequesthandler.js";
        var envURL = this.workingDirectoryURL.appendingPathComponent(this.arguments["debug-env"]);
        var fileManager = this.fileManager;
        var handleRequest = function(request, response){
            var url = JSURL.initWithString(request.url);
            var lambdaEvent = {
                version: "1.0",
                httpMethod: request.method,
                path: url.path,
                multiValueQueryStringParameters: {},
                multiValueHeaders: {},
                body: null,
                isBase64Encoded: true
            };
            var chunks = [];
            for (let i = 0, l = request.rawHeaders.length; i < l - 1; i += 2){
                let name = request.rawHeaders[i];
                let value = request.rawHeaders[i + 1];
                if (!(name in lambdaEvent.multiValueHeaders)){
                    lambdaEvent.multiValueHeaders[name] = [];
                }
                lambdaEvent.multiValueHeaders[name].push(value);
            }
            for (let field of url.query.fields){
                if (!(field.name in lambdaEvent.multiValueQueryStringParameters)){
                    lambdaEvent.multiValueQueryStringParameters[field.name] = [];
                }
                lambdaEvent.multiValueQueryStringParameters[field.name].push(field.value);
            }
            request.on("data", function(buffer){
                chunks.push(JSData.initWithNodeBuffer(buffer));
            });
            request.on("end", function(){
                if (chunks.length > 0){
                    var data  = JSData.initWithChuncks(chunks);
                    lambdaEvent.body = data.base64StringRepresentation();
                }
                var envData = fileManager.contentsAtURL(envURL, function(envData){
                    var env = {};
                    if (envData !== null){
                        env = JSEnvironment.initWithData(envData).getAll();
                    }
                    var child = child_process.fork(moduleName, {
                        cwd: cwd,
                        env: env
                    });
                    child.on("message", function(lambdaResponse){
                        for (let name in lambdaResponse.multiValueHeaders){
                            response.setHeader(name, lambdaResponse.multiValueHeaders[name]);
                        }
                        response.writeHead(lambdaResponse.statusCode);
                        if (lambdaResponse.body){
                            let data;
                            if (lambdaResponse.isBase64Encoded){
                                data = lambdaResponse.body.dataByDecodingBase64();
                            }else{
                                data = lambdaResponse.body.utf8();
                            }
                            response.write(data.nodeBuffer());
                        }
                        response.end();
                        child.kill();
                    });
                    child.send(lambdaEvent);
                });
            });
        };

        var server = http.createServer(handleRequest);

        port = await new Promise(function(resolve, reject){
            server.listen(port, '127.0.0.1', function(){
                resolve(server.address().port);
            });
        });

        var url = JSURL.initWithString("http://localhost/");
        url.port = port;
        this.printer.print("Local debug api at %s\n".sprintf(url.encodedString));
    }

});