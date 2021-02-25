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

// #import DOM
// #import "Builder.js"
// #import "Resources.js"
// #import "Project.js"
'use strict';

// buildURL
//   - {PROJECT_NAME}
//     - http
//       - www
//         - tests.html
//         - tests.css
//         - JS -> ../../JS/
//         - Resources -> ../../Resources/
//         - Frameworks -> ../../Frameworks/
//     - JS
//     - Resources
//     - Frameworks
//     - tests

JSClass("TestBuilder", Builder, {

    bundleType: "tests",

    options: {
    },

    hasLinkedDispatchFramework: false,

    // -----------------------------------------------------------------------
    // MARK: - Building


    bundleURL: null,
    sourcesURL: null,
    resourcesURL: null,
    frameworksURL: null,
    executableURL: null,
    httpURL: null,
    wwwURL: null,

    setup: async function(){
        this.debug = true;
        await TestBuilder.$super.setup.call(this);
        this.buildURL = this.buildsRootURL.appendingPathComponent(this.project.info.JSBundleIdentifier, true);
        this.watchlist.push(this.project.url);
        this.nodeExecutableRequires = [];
        this.htmlScripts = [];
        this.bundleURL = this.buildURL;
        this.sourcesURL = this.bundleURL.appendingPathComponent("JS", true);
        this.resourcesURL = this.bundleURL.appendingPathComponent("Resources", true);
        this.frameworksURL = this.bundleURL.appendingPathComponent("Frameworks", true);
        this.executableURL = this.bundleURL.appendingPathComponent("tests");
        this.nodeWorkerURL = this.bundleURL.appendingPathComponent("JSDispatch-worker.js");
        this.httpURL = this.bundleURL.appendingPathComponent('http', true);
        this.wwwURL = this.httpURL.appendingPathComponent('www', true);
        this.htmlWorkerURL = this.wwwURL.appendingPathComponent('JSDispatch-worker.js');
        var exists = await this.fileManager.itemExistsAtURL(this.bundleURL);
        if (exists){
            this.printer.setStatus("Cleaning old build...");
            var entries = await this.fileManager.contentsOfDirectoryAtURL(this.bundleURL);
            for (let i = 0, l = entries.length; i < l; ++i){
                let entry = entries[i];
                if (entry.name != "nginx"){
                    await this.fileManager.removeItemAtURL(entry.url);
                }
            }
        }
        await this.fileManager.createDirectoryAtURL(this.bundleURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
        await this.fileManager.createDirectoryAtURL(this.frameworksURL);
        await this.fileManager.createDirectoryAtURL(this.sourcesURL);
        await this.fileManager.createDirectoryAtURL(this.httpURL);        
        await this.fileManager.createDirectoryAtURL(this.wwwURL);
    },

    build: async function(){
        await this.setup();
        await this.findResources();
        await this.findImports();
        await this.bundleFrameworks();
        await this.bundleResources();
        await this.bundleJavascript();
        await this.buildNode();
        await this.buildWWW();
        await this.copyLicense();
        await this.bundleInfo();
    },

    findImports: async function(){
        this.printer.setStatus("Finding code...");
        this.imports = await this.project.findJavascriptImports();
    },

    // ----------------------------------------------------------------------
    // MARK: - Frameworks

    buildFramework: async function(url){
        let result = await TestBuilder.$super.buildFramework.call(this, url);
        this.watchlist.push(url);
        return result;
    },

    bundleFrameworks: async function(){
        var frameworks = await this.buildFrameworks(this.imports.frameworks, ['node', 'html']);
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
        await this.addFrameworkSources(framework);
        await this.addBundleJS(bundledURL, bundledURL.appendingPathComponent("Resources", true), framework.info, framework.resources);
        if (framework.info.JSBundleIdentifier == 'io.breakside.JSKit.Dispatch'){
            this.hasLinkedDispatchFramework = true;
        }
    },

    addFrameworkSources: async function(framework){
        let environments = framework.sources;
        if (!environments){
            return;
        }
        let directory = framework.url.lastPathComponent;
        if (environments.generic && environments.generic.files){
            let files = environments.generic.files;
            for (let i = 0, l = files.length; i < l; ++i){
                let path = "Frameworks/" + directory + "/JS/" + files[i];
                this.nodeExecutableRequires.push(path);
                this.htmlScripts.push(path);
            }
        }
        if (environments.node && environments.node.files){
            let files = environments.node.files;
            for (let i = 0, l = files.length; i < l; ++i){
                let path = "Frameworks/" + directory + "/JS/" + files[i];
                this.nodeExecutableRequires.push(path);
            }
        }
        if (environments.html && environments.html.files){
            let files = environments.html.files;
            for (let i = 0, l = files.length; i < l; ++i){
                let path = "Frameworks/" + directory + "/JS/" + files[i];
                this.htmlScripts.push(path);
            }
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
        await this.addBundleJS(this.sourcesURL, this.resourcesURL, this.project.info, this.resources, true);
    },

    addBundleJS: async function(parentURL, resourcesURL, info, resources, isTestBundle){
        var bundle = {
            Info: info,
            Resources: [],
            ResourceLookup: {},
            Fonts: []
        };
        if (isTestBundle){
            if (this.hasLinkedDispatchFramework){
                bundle.Info = JSCopy(bundle.Info);
                bundle.Info.JSNodeDispatchQueueWorkerModule = this.nodeWorkerURL.lastPathComponent;
                bundle.Info.JSHTMLDispatchQueueWorkerScript = this.htmlWorkerURL.encodedStringRelativeTo(this.wwwURL);
            }
        }
        if (resources){
            for (let i = 0, l = resources.metadata.length; i < l; ++i){
                let metadata = JSCopy(resources.metadata[i]);
                let url = resourcesURL.appendingPathComponent(metadata.path);
                metadata.nodeBundlePath = url.encodedStringRelativeTo(this.bundleURL);
                metadata.htmlURL = metadata.nodeBundlePath;
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
        if (info.JSBundleType == "html" || info.JSBundleType == "node" || info.JSBundleType == "api"){
            js += 'JSBundle.mainBundleIdentifier = "%s";\n'.sprintf(info.JSBundleIdentifier);
        }
        if (isTestBundle){
            js += 'JSBundle.testBundle = JSBundle.initWithIdentifier("%s");\n'.sprintf(info.JSBundleIdentifier);
        }

        var jsURL = parentURL.appendingPathComponent("%s-bundle.js".sprintf(info.JSBundleIdentifier));
        await this.fileManager.createFileAtURL(jsURL, js.utf8());
        var path = jsURL.encodedStringRelativeTo(this.executableURL);
        this.htmlScripts.push(path);
        this.nodeExecutableRequires.push(path);

        if (isTestBundle){
            jsURL = parentURL.appendingPathComponent("node-bundle.js");
            js = 'var path = require("path");\n';
            js += 'JSBundle.nodeRootPath = path.dirname(path.dirname(__filename));\n';
            await this.fileManager.createFileAtURL(jsURL, js.utf8());
            path = jsURL.encodedStringRelativeTo(this.executableURL);
            this.nodeExecutableRequires.push(path);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Javscript Code from Project

    bundleJavascript: async function(){
        for (let i = 0, l = this.imports.files.length; i < l; ++i){
            let file = this.imports.files[i];
            let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
            let bundledURL = JSURL.initWithString(bundledPath, this.sourcesURL);
            await this.fileManager.copyItemAtURL(file.url, bundledURL);
            this.nodeExecutableRequires.push('JS/' + bundledPath);
            this.htmlScripts.push('JS/' + bundledPath);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Node Executable
    
    nodeExecutableRequires: null,
    nodeWorkerURL: null,

    buildNode: async function(){
        await this.buildNodeExecutable();
        if (this.hasLinkedDispatchFramework){
            await this.buildNodeWorker();
        }
    },

    buildNodeExecutable: async function(){
        var lines = [
            "#!/usr/bin/env node",
            "'use strict';",
            "",
            "global.JSGlobalObject = global;",
            ""
        ];
        for (let i = 0, l = this.nodeExecutableRequires.length; i < l; ++i){
            let path = this.nodeExecutableRequires[i];
            lines.push('require("./%s");'.sprintf(path));
        }

        let runnerURL = this.executableURL.removingLastPathComponent().appendingPathComponent("NodeTestRunner.js");
        let metadata = JSBundle.mainBundle.metadataForResourceName("NodeTestRunner", "js");
        let js = await JSBundle.mainBundle.getResourceData(metadata);
        await this.fileManager.createFileAtURL(runnerURL, js);
        lines.push('var entry = require("./%s").run;'.sprintf(runnerURL.lastPathComponent));
        lines.push("");
        lines.push("entry();");
        lines.push("");
        var exe = lines.join("\n").utf8();
        await this.fileManager.createFileAtURL(this.executableURL, exe);
        await this.fileManager.makeExecutableAtURL(this.executableURL);
        var exePath = this.fileManager.relativePathFromURL(this.workingDirectoryURL, this.executableURL);
        this.commands.push(exePath);
    },

    buildNodeWorker: async function(){
        this.printer.setStatus("Creating node worker.js...");
        var lines = [
            "'use strict';",
            "",
            "global.JSGlobalObject = global;",
            ""
        ];
        for (let i = 0, l = this.nodeExecutableRequires.length; i < l; ++i){
            let path = this.nodeExecutableRequires[i];
            lines.push('require("./%s");'.sprintf(path));
        }
        lines.push("var queueWorker = JSNodeDispatchQueueWorker.init();\n");
        var js = lines.join("\n").utf8();
        await this.fileManager.createFileAtURL(this.nodeWorkerURL, js);
    },

    // -----------------------------------------------------------------------
    // MARK: - HTML index

    htmlScripts: null,
    htmlWorkerURL: null,

    buildWWW: async function(){
        await this.linkWWW();
        await this.buildHTMLIndex();
        if (this.hasLinkedDispatchFramework){
            await this.buildHTMLWorker();
        }
        var path = this.fileManager.relativePathFromURL(this.workingDirectoryURL, this.httpURL);
        this.commands.push('nginx -p %s && open http://localhost:8088/'.sprintf(path));
    },

    linkWWW: async function(){
        let wwwSourcesURL = this.wwwURL.appendingPathComponent('JS');
        var exists = await this.fileManager.itemExistsAtURL(wwwSourcesURL);
        if (!exists){
            let url = JSURL.initWithString(this.sourcesURL.encodedStringRelativeTo(wwwSourcesURL));
            await this.fileManager.createSymbolicLinkAtURL(wwwSourcesURL, url);
        }
        let wwwResourcesURL = this.wwwURL.appendingPathComponent('Resources');
        exists = await this.fileManager.itemExistsAtURL(wwwResourcesURL);
        if (!exists){
            let url = JSURL.initWithString(this.resourcesURL.encodedStringRelativeTo(wwwResourcesURL));
            await this.fileManager.createSymbolicLinkAtURL(wwwResourcesURL, url);
        }
        let wwwFrameworksURL = this.wwwURL.appendingPathComponent('Frameworks');
        exists = await this.fileManager.itemExistsAtURL(wwwFrameworksURL);
        if (!exists){
            let url = JSURL.initWithString(this.frameworksURL.encodedStringRelativeTo(wwwFrameworksURL));
            await this.fileManager.createSymbolicLinkAtURL(wwwFrameworksURL, url);
        }
    },

    buildHTMLIndex: async function(){
        this.printer.setStatus("Creating tests.html...");
        var indexURL = this.wwwURL.appendingPathComponent("tests.html");
        var cssURL = this.wwwURL.appendingPathComponent("tests.css");
        var exists = await this.fileManager.itemExistsAtURL(indexURL);
        if (exists){
            await this.fileManager.removeItemAtURL(indexURL);
        }
        exists = await this.fileManager.itemExistsAtURL(cssURL);
        if (exists){
            await this.fileManager.removeItemAtURL(cssURL);
        }

        var metadata = JSBundle.mainBundle.metadataForResourceName("tests", "css");
        var css = await JSBundle.mainBundle.getResourceData(metadata);
        await this.fileManager.createFileAtURL(cssURL, css);

        var document = DOM.createDocument();
        var doctype = document.implementation.createDocumentType("html", "", "");
        document.appendChild(doctype);
        var html = document.appendChild(document.createElement("html"));
        var head = html.appendChild(document.createElement("head"));
        var meta = head.appendChild(document.createElement("meta"));
        meta.setAttribute("content", "text/html; charset=utf-8");
        meta.setAttribute("http-equiv", "Content-Type");
        var title = head.appendChild(document.createElement("title"));
        title.appendChild(document.createTextNode(this.project.info.JSBundleDisplayName));
        var link = head.appendChild(document.createElement("link"));
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", cssURL.encodedStringRelativeTo(indexURL));
        var body = html.appendChild(document.createElement("body"));
        var script = body.appendChild(document.createElement("script"));
        script.setAttribute("type", "text/javascript");
        script.appendChild(document.createTextNode("'use strict';window.JSGlobalObject = window;"));
        for (let i = 0, l = this.htmlScripts.length; i < l; ++i){
            let src = this.htmlScripts[i];
            let script = body.appendChild(document.createElement("script"));
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", src);
        }

        var runnerURL = this.wwwURL.appendingPathComponent("HTMLTestRunner.js");
        metadata = JSBundle.mainBundle.metadataForResourceName("HTMLTestRunner", "js");
        let js = await JSBundle.mainBundle.getResourceData(metadata);
        await this.fileManager.createFileAtURL(runnerURL, js);
        script = body.appendChild(document.createElement("script"));
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", runnerURL.encodedStringRelativeTo(indexURL));
        script = body.appendChild(document.createElement("script"));
        script.setAttribute("type", "text/javascript");
        script.appendChild(document.createTextNode("main();"));
        var serializer = new XMLSerializer();
        var htmlString = serializer.serializeToString(document);
        await this.fileManager.createFileAtURL(indexURL, htmlString.utf8());
    },

    buildHTMLWorker: async function(){
        this.printer.setStatus("Creating html worker.js...");
        var workerPaths = [];
        for (let i = 0, l = this.htmlScripts.length; i < l; ++i){
            let path = this.htmlScripts[i];
            let url = JSURL.initWithString(path, this.wwwURL);
            let workerPath = url.encodedStringRelativeTo(this.htmlWorkerURL);
            workerPaths.push(workerPath);
        }
        var js = [
            "'use strict';",
            "self.JSGlobalObject = self;",
            "importScripts.apply(undefined, %s);".sprintf(JSON.stringify(workerPaths, null, 2)),
            "var queueWorker = JSHTMLDispatchQueueWorker.init();",
            ""
        ].join("\n");
        await this.fileManager.createFileAtURL(this.htmlWorkerURL, js.utf8());
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

});