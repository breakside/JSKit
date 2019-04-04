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

    needsDockerBuild: false,
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
        this.isJSKit = this.project.info.JSBundleIdentifier == "io.breakside.jskit";
        this.executableRequires = [];
        this.bundleURL = this.buildURL.appendingPathComponent(this.executableName, true);
        this.resourcesURL = this.bundleURL.appendingPathComponent("Resources", true);
        this.frameworksURL = this.bundleURL.appendingPathComponent("Frameworks", true);
        this.nodeURL = this.bundleURL.appendingPathComponent("Node", true);
        this.executableURL = this.nodeURL.appendingPathComponent(this.executableName);
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
        await this.fileManager.createDirectoryAtURL(this.nodeURL);
    },

    build: async function(){
        await this.setup();
        await this.findImports();
        await this.bundleFrameworks();
        await this.bundleResources();
        await this.bundleJavascript();
        await this.buildExecutable();
        if (this.hasLinkedDispatchFramework){
            await this.buildWorker();
        }
        if (this.needsDockerBuild){
            await this.buildDocker();
        }
        if (this.isJSKit){
            await this.bundleJSKitRoot();
        }
        await this.buildNPM();
        await this.copyLicense();
        await this.copyInfo();
    },

    findImports: async function(){
        this.printer.setStatus("Finding code...");
        var entryPoint = this.project.entryPoint;
        var includeDirectoryURLs = await this.project.findIncludeDirectoryURLs();
        this.imports = await this.project.findJavascriptImports([entryPoint.path], includeDirectoryURLs);
    },

    // ----------------------------------------------------------------------
    // MARK: - Frameworks

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
        await this.fileManager.copyItemAtURL(framework.url, bundledURL);
        await this.addFrameworkSources(framework, 'generic');
        await this.addFrameworkSources(framework, 'node');
        await this.addBundleJS(bundledURL, bundledURL.appendingPathComponent("Resources", true), framework.info, framework.resources);
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

    bundleResources: async function(){
        var blacklist = {
            names: new Set(["Info.yaml", "Info.json", this.project.licenseFilename]),
            extensions: new Set(['.js'])
        };
        this.printer.setStatus("Finding resources...");
        var resourceURLs = this.project.findResourceURLs(blacklist);
        var resources = Resources.init();
        for (let i = 0, l = resourceURLs.length; i < l; ++i){
            let url = resourceURLs[i];
            resources.addResourceAtURL(url);
        }
        for (let i = 0, l = resources.metadata.length; i < l; ++i){
            let metadata = resources.metadata[i];
            let url = resources.sourcesURLs[i];
            let bundledURL = JSURL.initWithString(metadata.path, this.resourcesURL);
            this.printer.setStatus("Copying resource %s...".sprintf(url.lastPathComponent));
            await this.fileManager.copyItemAtURL(url, bundledURL);
        }
        this.addBundleJS(this.nodeURL, this.resourcesURL, this.project.info, resources, true);
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
        var json = JSON.stringify(bundle);
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
        // TODO: make sure executable permissions are set on file
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
        packageJSON = JSON.stringify(pkg);
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
        await this.fileManager.copyItemAtURL(originalURL, licenseURL);
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
            await this.fileManager.createSymbolicLinkAtURL(bundledRootURL, jskitURL);
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