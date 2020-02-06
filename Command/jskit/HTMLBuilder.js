// #import DOM
// #import "Builder.js"
// #import "Resources.js"
// #import "JavascriptCompilation.js"
'use strict';

// buildURL
//   - Dockerfile
//   - {ProjectName}
//     - www
//       - index.html
//       - preflight-{hash}.js
//       - {buildId}
//         - ... javascript ...
//       - Resources
//         - ... {hash}.xyz
//     - conf
//       - nginx.conf
//     - logs

JSClass("HTMLBuilder", Builder, {

    bundleType: "html",

    options: {
        'http-port': {valueType: "integer", default: null, help: "The port on which the static http server will be configured (defaults: debug=8080, release=Info.HTTPPort [80])"},
        'workers': {valueType: "integer", default: null, help: "The port on which the static http server will be configured (defaults: debug=1, release=Info.HTTPWorkerCount [3])"},
        'connections': {valueType: "integer", default: 1024, help: "The port on which the static http server will be configured"},
        'docker-owner': {default: null, help: "The docker repo prefix to use when building a docker image"},
        'no-docker': {kind: "flag", help: "Don't build the docker image"},
        'env': {default: null, help: "A file with environmental variables for this build"}
    },

    needsDockerBuild: true,

    bundleURL: null,
    wwwURL: null,
    confURL: null,
    logsURL: null,
    cacheBustingURL: null,
    sourcesURL: null,
    frameworksURL: null,
    resourcesURL: null,

    setup: async function(){
        await HTMLBuilder.$super.setup.call(this);
        this.buildURL = this.buildsRootURL.appendingPathComponents([this.project.info.JSBundleIdentifier, this.debug ? "debug" : this.buildLabel], true);
        this.watchlist.push(this.project.url);
        if (this.arguments.workers === null){
            if (this.debug){
                this.arguments.workers = 1;
            }else{
                this.arguments.workers = this.project.info.HTTPWorkerCount || 3;
            }
        }
        if (this.arguments['http-port'] === null){
            if (this.debug){
                this.arguments['http-port'] = 8080;
            }else{
                this.arguments['http-port'] = this.project.info.HTTPPort || 80;
            }
        }
        this.wwwJavascriptPaths = [];
        this.wwwResourcePaths = [];
        this.preflightFeatures = new Set();
        this.bundleURL = this.buildURL.appendingPathComponent(this.project.name, true);
        this.wwwURL = this.bundleURL.appendingPathComponent('www', true);
        this.confURL = this.bundleURL.appendingPathComponent('conf', true);
        this.logsURL = this.bundleURL.appendingPathComponent('logs', true);
        this.cacheBustingURL = this.wwwURL.appendingPathComponent(this.debug ? 'debug' : this.buildId);
        this.sourcesURL = this.cacheBustingURL.appendingPathComponent("JS", true);
        this.frameworksURL = this.cacheBustingURL.appendingPathComponent("Frameworks");
        this.resourcesURL = this.wwwURL.appendingPathComponent('Resources', true);
        this.workerURL = this.cacheBustingURL.appendingPathComponent("JSDispatch-worker.js");
        var exists = await this.fileManager.itemExistsAtURL(this.wwwURL);
        if (exists){
            this.printer.setStatus("Cleaning old build...");
            var entries = await this.fileManager.contentsOfDirectoryAtURL(this.wwwURL);
            for (let i = 0, l = entries.length; i < l; ++i){
                let entry = entries[i];
                await this.fileManager.removeItemAtURL(entry.url);
            }
        }
        await this.fileManager.createDirectoryAtURL(this.bundleURL);
        await this.fileManager.createDirectoryAtURL(this.confURL);
        await this.fileManager.createDirectoryAtURL(this.wwwURL);
        await this.fileManager.createDirectoryAtURL(this.logsURL);
        await this.fileManager.createDirectoryAtURL(this.cacheBustingURL);
        await this.fileManager.createDirectoryAtURL(this.sourcesURL);
        await this.fileManager.createDirectoryAtURL(this.frameworksURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
    },

    build: async function(){
        await this.setup();
        await this.populateEnvironment();
        await this.findResources();
        await this.findImports();
        await this.bundleFrameworks();
        await this.bundleResources();
        await this.bundleJavascript();
        if (this.hasLinkedDispatchFramework){
            await this.buildWorker();
        }
        await this.bundleWWW();
        await this.buildServiceWorker();
        await this.bundleConf();
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
        if (!this.project.info.UIMainSpec && this.project.info.UIApplicationDelegate){
            roots.push(this.project.info.UIApplicationDelegate + ".js");
        }
        this.imports = await this.project.findJavascriptImports(roots, includeDirectoryURLs);
    },

    // -----------------------------------------------------------------------
    // MARK: - Environment

    _workingDirectoryEnvironment: null,

    setupEnvironment: async function(){
        this._workingDirectoryEnvironment = {};
        var url;
        if (this.arguments.env){
            url = this.workingDirectoryURL.appendingPathComponent(this.arguments.env);
        }else{
            if (this.debug){
                url = this.workingDirectoryURL.appendingPathComponent('.env');
            }else{
                url = this.project.url.appendingPathComponent(this.project.info.HTMLProductionEnvironment || 'production.env');
            }
        }
        try{
            var contents = await this.fileManager.contentsAtURL(url);
            if (contents !== null){
                this._workingDirectoryEnvironment = EnvironmentFile.initWithData(contents);
            }
        }catch(e){
        }
    },

    getEnvironment: function(name, defaultValue){
        if (this._workingDirectoryEnvironment){
            return this._workingDirectoryEnvironment.get(name, getenv(name, defaultValue));
        }
        return getenv(name, defaultValue);
    },

    populateEnvironment: async function(){
        await this.setupEnvironment();
        var envs = this.project.info.UIApplicationEnvironment;
        this.project.info.UIApplicationEnvironment = {};
        if (envs){
            for (var i = 0, l = envs.length; i < l; ++i){
                this.project.info.UIApplicationEnvironment[envs[i]] = this.getEnvironment(envs[i]);
            }
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Frameworks

    buildFramework: async function(url){
        let result = await HTMLBuilder.$super.buildFramework.call(this, url);
        this.watchlist.push(url);
        return result;
    },

    bundleFrameworks: async function(){
        var frameworks = await this.buildFrameworks(this.imports.frameworks, 'html');
        for (let i = 0, l = frameworks.length; i < l; ++i){
            let framework = frameworks[i];
            if (framework.url){
                await this.bundleFramework(framework);
            }
        }
    },

    bundleFramework: async function(framework){
        var bundledURL = this.frameworksURL.appendingPathComponent(framework.name, true);
        this.printer.setStatus("Copying %s...".sprintf(framework.url.lastPathComponent));
        await this.fileManager.copyItemAtURL(framework.sourcesURL, bundledURL);
        await this.addFrameworkSources(framework, 'generic', bundledURL);
        await this.addFrameworkSources(framework, 'html', bundledURL);
        let sourceURLs = [];
        let resourcesBase = framework.url.appendingPathComponent("Resources");
        for (let i = 0, l = framework.resources.metadata.length; i < l; ++i){
            let metadata = framework.resources.metadata[i];
            let url = resourcesBase.appendingPathComponent(metadata.path);
            sourceURLs.push(url);
        }
        await this.addBundleJS(bundledURL, framework.info, framework.resources, sourceURLs);
        if (framework.info.JSBundleIdentifier == 'io.breakside.JSKit.Dispatch'){
            this.hasLinkedDispatchFramework = true;
        }
    },

    addFrameworkSources: async function(framework, env, toURL){
        let environments = framework.sources;
        if (!environments){
            return;
        }
        let sources = environments[env];
        if (!sources){
            return;
        }
        if (sources.files){
            let prefix = toURL.encodedStringRelativeTo(this.wwwURL);
            for (let i = 0, l = sources.files.length; i < l; ++i){
                let path = prefix + sources.files[i];
                this.wwwJavascriptPaths.push(path);
            }
        }
        if (sources.features){
            for (let i = 0, l = sources.features.length; i < l; ++i){
                this.preflightFeatures.add(sources.features[i]);
            }
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Resources

    resources: null,
    wwwResourcePaths: null,

    findResources: async function(){
        var blacklist = {
            names: new Set(["Info.yaml", "Info.json", "Dockerfile", "conf", "www", this.project.licenseFilename])
        };
        this.printer.setStatus("Finding resources...");
        var resourceURLs = await this.project.findResourceURLs(blacklist);
        var resources = Resources.initWithFileManager(this.fileManager);
        for (let i = 0, l = resourceURLs.length; i < l; ++i){
            let url = resourceURLs[i];
            this.printer.setStatus("Inspecting %s...".sprintf(url.lastPathComponent));
            try{
                await resources.addResourceAtURL(url);
            }catch (e){
                throw e;
            }
        }
        this.resources = resources;
    },

    bundleResources: async function(){
        await this.addBundleJS(this.sourcesURL, this.project.info, this.resources, this.resources.sourceURLs, true);
    },

    addBundleJS: async function(parentURL, info, resources, sourceURLs, isMain){
        var bundle = {
            Info: info,
            Resources: [],
            ResourceLookup: {},
            Fonts: []
        };
        if (isMain){
            if (this.hasLinkedDispatchFramework){
                bundle.Info = JSCopy(bundle.Info);
                bundle.Info.JSHTMLDispatchQueueWorkerScript = this.workerURL.encodedStringRelativeTo(this.wwwURL);
            }
        }
        if (resources){
            for (let i = 0, l = resources.metadata.length; i < l; ++i){
                let metadata = JSCopy(resources.metadata[i]);
                let hashedPath = metadata.hash + metadata.path.fileExtension;
                let url = this.resourcesURL.appendingPathComponent(hashedPath);
                let sourceURL = sourceURLs[i];
                metadata.htmlURL = url.encodedStringRelativeTo(this.wwwURL);
                bundle.Resources.push(metadata);
                if (metadata.font){
                    bundle.Fonts.push(i);
                }
                let exists = await this.fileManager.itemExistsAtURL(url);
                if (!exists){
                    this.printer.setStatus("Copying %s...".sprintf(sourceURL.lastPathComponent));
                    await this.fileManager.copyItemAtURL(sourceURL, url);
                }
                this.wwwResourcePaths.push(metadata.htmlURL);
            }
            if (resources.lookup){
                bundle.ResourceLookup = resources.lookup;
            }
        }
        var json = JSON.stringify(bundle, null, this.debug ? 2 : 0);
        var js = "'use strict';\nJSBundle.bundles['%s'] = %s;\n".sprintf(info.JSBundleIdentifier, json);
        if (isMain){
            js += 'JSBundle.mainBundleIdentifier = "%s";\n'.sprintf(info.JSBundleIdentifier);
        }
        var jsURL = parentURL.appendingPathComponent("%s-bundle.js".sprintf(info.JSBundleIdentifier));
        await this.fileManager.createFileAtURL(jsURL, js.utf8());
        var path = jsURL.encodedStringRelativeTo(this.wwwURL);
        this.wwwJavascriptPaths.push(path);
    },

    // -----------------------------------------------------------------------
    // MARK: - Javscript Code from Project

    bundleJavascript: async function(){
        if (this.debug){
            this.printer.setStatus("Copying code...");
            await this.copyDebugJavascript();
        }else{
            this.printer.setStatus("Minifying code...");
            await this.minifyReleaseJavascript();
        }
    },

    copyDebugJavascript: async function(){
        for (let i = 0, l = this.imports.files.length; i < l; ++i){
            let file = this.imports.files[i];
            let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
            let bundledURL = JSURL.initWithString(bundledPath, this.sourcesURL);
            let wwwPath = bundledURL.encodedStringRelativeTo(this.wwwURL);
            await this.fileManager.copyItemAtURL(file.url, bundledURL);
            this.wwwJavascriptPaths.push(wwwPath);
        }
        for (let i = 0, l = this.imports.features.length; i < l; ++i){
            this.preflightFeatures.add(this.imports.features[i]);
        }
    },

    minifyReleaseJavascript: async function(){
        let compilation = JavascriptCompilation.initWithName("%s.js".sprintf(this.project.name), this.sourcesURL, this.fileManager);
        var licenseString = await this.project.licenseString();
        var header = "%s (%s)\n----\n%s".sprintf(this.project.info.JSBundleIdentifier, this.project.info.JSBundleVersion, licenseString);
        var fullSourcesURL = this.sourcesURL.appendingPathComponent("_debug", true);
        compilation.sourceRoot = fullSourcesURL.encodedStringRelativeTo(this.sourcesURL);
        compilation.writeComment(header);
        for (let i = 0, l = this.imports.files.length; i < l; ++i){
            let file = this.imports.files[i];
            let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
            let bundledURL = JSURL.initWithString(bundledPath, fullSourcesURL);
            compilation.sources.push(bundledPath);
            await this.fileManager.copyItemAtURL(file.url, bundledURL);
            await compilation.writeJavascriptAtURL(file.url);
        }
        await compilation.finish();
        for (let i = 0, l = compilation.files.length; i < l; ++i){
            let url = this.sourcesURL.appendingPathComponent(compilation.files[i]);
            let wwwPath = url.encodedStringRelativeTo(this.wwwURL);
            this.wwwJavascriptPaths.push(wwwPath);
        }
        for (let i = 0, l = this.imports.features.length; i < l; ++i){
            this.preflightFeatures.add(this.imports.features[i]);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - WWW

    wwwJavascriptPaths: null,
    wwwCSSPaths:  null,
    wwwPaths: null,
    uncachedWWWPaths: null,
    manifestURL: null,
    preflightId: null,
    preflightURL: null,
    preflightFeatures: null,
    workerURL: null,

    bundleWWW: async function(){
        this.wwwCSSPaths = [];
        this.wwwPaths = [];
        this.uncachedWWWPaths = [];
        // As of Dec 2019...
        // Browsers are in the process of removing the appcache API soon (Chrome
        // says it'll be gone by April 2020), so there's no point to contunue
        // supporting it.  Keeping this `manifestURL` `null` will disable the
        // appcache behavior in the built application, but has the advantage of
        // keeping our builder code otherwise as-is should we need to reference
        // it or turn it back on (like for IE 11 support).  The way we use
        // service workers (the appcache replacement API) is to essentially
        // mimic the way appcache worked because although others didn't like it,
        // appcache was perfect for our use case.
        // this.manifestURL = this.wwwURL.appendingPathComponent("manifest.appcache");

        await this.buildCSS();
        await this.buildPreflight();

        var manifestConfiguration = {};
        var configFiles = this.project.info.HMTLManifestConfiguration || [];
        if (!(configFiles instanceof Array)){
            configFiles = [configFiles];
        }

        for (let i = 0, l = configFiles.length; i < l; ++i){
            let config = configFiles[i];
            if (typeof(config) == "string"){
                let url = this.project.url.appendingPathComponent(configFiles[i]);
                let contents = await this.fileManager.contentsAtURL(url);
                let json = contents.stringByDecodingUTF8();
                config = JSON.parse(json);
            }
            for (var k in config){
                manifestConfiguration[k] = config[k];
            }
        }

        var projectWWWURL = this.project.url.appendingPathComponent('www');
        var entries = await this.fileManager.contentsOfDirectoryAtURL(projectWWWURL);
        var indexName = this.project.info.UIApplicationHTMLIndexFile || 'index.html';
        var serviceWorkerName = this.project.info.UIApplicationHTMLServiceWorkerFile || 'service-worker.js';
        this.serviceWorkerSourceURL = projectWWWURL.appendingPathComponent(serviceWorkerName);
        var serviceWorkerExists = await this.fileManager.itemExistsAtURL(this.serviceWorkerSourceURL);
        if (serviceWorkerExists){
            this.serviceWorkerURL = this.wwwURL.appendingPathComponent(serviceWorkerName);
        }
        for (let i = 0, l = entries.length; i < l; ++i){
            let entry = entries[i];
            if (entry.name.startsWith('.')){
                continue;
            }
            let toURL = this.wwwURL.appendingPathComponent(entry.url.lastPathComponent);
            if (entry.name == indexName){
                await this.buildIndex(entry.url, toURL);
            }else if (entry.name == serviceWorkerName){
                // do nothing...will build service worker afer all of www has been inspected
            }else{
                await this._copyWWWEntry(entry, entry.name, manifestConfiguration);
            }
        }

        await this.buildManifest();
    },

    _copyWWWEntry: async function(entry, wwwPath, manifestConfiguration){
        let toURL = this.wwwURL.appendingPathComponent(wwwPath);
        this.printer.setStatus("Copying %s...".sprintf(toURL.lastPathComponent));
        if (entry.itemType == JSFileManager.ItemType.directory){
            let entries = await this.fileManager.contentsOfDirectoryAtURL(entry.url);
            for (let i = 0, l = entries.length; i < l; ++i){
                let child = entries[i];
                if (child.name.startsWith('.')){
                    continue;
                }
                await this._copyWWWEntry(child, wwwPath + '/' + child.name, manifestConfiguration);
            }
        }else{
            if (wwwPath in manifestConfiguration){
                let config = manifestConfiguration[wwwPath];
                if (config.path){
                    wwwPath = config.path;
                }
                if (config.required === false){
                    this.uncachedWWWPaths.push(wwwPath);
                }else{
                    this.wwwPaths.push(wwwPath);
                }
            }else{
                this.wwwPaths.push(wwwPath);
            }
            await this.fileManager.copyItemAtURL(entry.url, toURL);
        }
    },

    buildIndex: async function(sourceURL, toURL){
        let contents = await this.fileManager.contentsAtURL(sourceURL);
        let html = contents.stringByDecodingUTF8();
        let parser = new DOMParser();
        let document = parser.parseFromString(html, "text/html");
        let stack = [document.documentElement];
        while (stack.length > 0){
            let element = stack.shift();
            if (element.localName == 'head'){
                let icons = this.applicationIcons();
                for (let i = 0, l = icons.length; i < l; ++i){
                    let icon = icons[i];
                    if (icon.rel == 'mask-icon'){
                        continue;
                    }
                    let link = document.createElement("link");
                    link.setAttribute("rel", icon.rel);
                    link.setAttribute("href", icon.href);
                    link.setAttribute("type", icon.type);
                    link.setAttribute("sizes", icon.sizes);
                    element.appendChild(link);
                }
            }else if (element.localName == 'title' && element.parentNode.localName == 'head'){
                let title = this.project.getInfoString('UIApplicationTitle', this.resources);
                element.appendChild(document.createTextNode(title));
            }else if (element.localName == 'script' && element.getAttribute('type') == 'text/javascript'){
                if (element.hasAttribute("jskit")){
                    let params = {
                        JSKIT_APP: JSON.stringify({
                            appSrc: this.wwwJavascriptPaths,
                            appCss: this.wwwCSSPaths,
                            preflightId: this.preflightId,
                            preflightSrc: this.preflightURL.encodedStringRelativeTo(this.wwwURL),
                            serviceWorkerSrc: this.serviceWorkerURL ? this.serviceWorkerURL.encodedStringRelativeTo(this.wwwURL) : null,
                            environment: this.project.info.UIApplicationEnvironment,
                            buildId: this.buildId,
                            bundleId: this.project.info.JSBundleIdentifier,
                            gitRevision: this.project.info.GitRevision,
                            debug: this.debug
                        }, null, 2)
                    };
                    element.removeAttribute("jskit");
                    var js = "";
                    for (let i = 0, l = element.childNodes.length; i < l; ++i){
                        let child = element.childNodes[i];
                        js += child.data;
                    }
                    js = js.replacingTemplateParameters(params, '{TEMPLATE: "', '"}');
                    for (let i = element.childNodes.length - 1; i > 0; --i){
                        let child = element.childNodes[i];
                        element.removeChild(child);
                    }
                    if (element.childNodes.length === 0){
                        element.appendChild(document.createTextNode(""));
                    }
                    element.childNodes[0].data = js;
                }
            }
            for (let i = 0, l = element.childNodes.length; i < l; ++i){
                let child = element.childNodes[i];
                if (child.nodeType == DOM.Node.ELEMENT_NODE){
                    stack.push(child);
                }
            }
        }
        if (this.manifestURL){
            document.documentElement.setAttribute('manifest', this.manifestURL.encodedStringRelativeTo(this.wwwURL));
        }
        let serializer = new XMLSerializer();
        html = serializer.serializeToString(document);
        await this.fileManager.createFileAtURL(toURL, html.utf8());
    },

    buildCSS: async function(){
        var fonts = [];
        for (let i = 0, l = this.resources.metadata.length; i < l; ++i){
            let metadata = this.resources.metadata[i];
            if (metadata.font){
                fonts.push(metadata);
            }
        }
        if (fonts.length === 0){
            return;
        }
        var lines = [];
        let fontsCSSURL = this.cacheBustingURL.appendingPathComponent("fonts.css");
        for (let i = 0, l = fonts.length; i < l; ++i){
            let metadata = fonts[i];
            let bundledURL = this.resourcesURL.appendingPathComponent(metadata.hash + metadata.path.fileExtension);
            lines.push('@font-face {');
            lines.push('  font-family: "%s";'.sprintf(metadata.font.family));
            lines.push('  font-style: %s;'.sprintf(metadata.font.style));
            // TTF weights can be 1 to 1000, CSS weights can on be multiples of 100
            lines.push('  font-weight: %s;'.sprintf(Math.floor((metadata.font.weight / 100) * 100)));
            lines.push('  src: url("%s");'.sprintf(bundledURL.encodedStringRelativeTo(fontsCSSURL)));
            lines.push('  font-display: block;');
            lines.push('}');
        }
        let css = lines.join("\n");
        await this.fileManager.createFileAtURL(fontsCSSURL, css.utf8());
        let path = fontsCSSURL.encodedStringRelativeTo(this.wwwURL);
        this.wwwCSSPaths.push(path);
    },

    buildWorker: async function(){
        this.printer.setStatus("Creating worker.js...");
        var workerPaths = [];
        for (let i = 0, l = this.wwwJavascriptPaths.length; i < l; ++i){
            let path = this.wwwJavascriptPaths[i];
            let url = JSURL.initWithString(path, this.wwwURL);
            let workerPath = url.encodedStringRelativeTo(this.workerURL);
            workerPaths.push(workerPath);
        }
        var js = [
            "'use strict';",
            "self.JSGlobalObject = self;",
            "importScripts.apply(undefined, %s);".sprintf(JSON.stringify(workerPaths, null, 2)),
            "var queueWorker = JSHTMLDispatchQueueWorker.init();",
            ""
        ].join("\n");
        await this.fileManager.createFileAtURL(this.workerURL, js.utf8());
    },

    serviceWorkerSourceURL: null,

    buildServiceWorker: async function(){
        if (!this.serviceWorkerURL || !this.serviceWorkerSourceURL){
            return;
        }
        this.printer.setStatus("Creating service worker...");
        var sources = {'./': {required: true}};
        for (let i = 0, l = this.wwwPaths.length; i < l; ++i){
            sources[this.wwwPaths[i]] = {required: true};
        }
        for (let i = 0, l = this.wwwJavascriptPaths.length; i < l; ++i){
            sources[this.wwwJavascriptPaths[i]] = {required: true};
        }
        if (this.preflightURL !== null){
            let path = this.preflightURL.encodedStringRelativeTo(this.wwwURL);
            sources[path] = {required: true};
        }
        if (this.workerURL !== null && this.hasLinkedDispatchFramework){
            let path = this.workerURL.encodedStringRelativeTo(this.wwwURL);
            sources[path] = {required: true};
        }
        for (let i = 0, l = this.wwwResourcePaths.length; i < l; ++i){
            sources[this.wwwResourcePaths[i]] = {required: true};
        }
        for (let i = 0, l = this.wwwCSSPaths.length; i < l; ++i){
            sources[this.wwwCSSPaths[i]] = {required: true};
        }
        for (let i = 0, l = this.uncachedWWWPaths.length; i < l; ++i){
            sources[this.uncachedWWWPaths[i]] = {required: false};
        }
        var params = {
            JSKIT_APP: JSON.stringify({
                buildId: this.buildId,
                sources: sources
            }, null, 2)
        };
        var workerConents = await this.fileManager.contentsAtURL(this.serviceWorkerSourceURL);
        var js = String.initWithData(workerConents, String.Encoding.utf8);
        js = js.replacingTemplateParameters(params, '{TEMPLATE: "', '"}');
        await this.fileManager.createFileAtURL(this.serviceWorkerURL, js.utf8());
    },

    buildPreflight: async function(){
        this.printer.setStatus("Creating preflight js...");
        var features = Array.from(this.preflightFeatures.values()).sort();
        var checks = [];
        var lines = [
            "'use strict';",
            "(function(context){",
            "  if (!context) return;",
            "  context.preflightChecks = [",
        ];
        for (let i = 0, l = features.length; i < l; ++i){
            let feature = features[i];
            let name = JSON.stringify("feature %s".sprintf(feature));
            lines.push('    {name: %s, fn: function(){ return !!(%s); }},'.sprintf(name, feature));
        }
        lines.push("  ];");
        lines.push("})(JSKIT_PREFLIGHT_CONTEXT)");
        lines.push("");
        var js = lines.join("\n");
        var contents = js.utf8();
        this.preflightId = JSSHA1Hash(contents).hexStringRepresentation();
        this.preflightURL = this.wwwURL.appendingPathComponent('preflight-%s.js'.sprintf(this.preflightId));
        await this.fileManager.createFileAtURL(this.preflightURL, contents);
    },

    buildManifest: async function(){
        if (!this.manifestURL){
            return;
        }
        this.printer.setStatus("Creating manifest.appcache...");
        let lines = [
            "CACHE MANIFEST",
            "# build %s".sprintf(this.buildId),
        ];
        lines.push("");
        lines.push("# index related");
        for (let i = 0, l = this.wwwPaths.length; i < l; ++i){
            lines.push(this.wwwPaths[i]);
        }
        lines.push("");
        lines.push("# Javascript");
        for (let i = 0, l = this.wwwJavascriptPaths.length; i < l; ++i){
            lines.push(this.wwwJavascriptPaths[i]);
        }
        if (this.preflightURL !== null){
            let path = this.preflightURL.encodedStringRelativeTo(this.wwwURL);
            lines.push(path);
        }
        if (this.workerURL !== null && this.hasLinkedDispatchFramework){
            let path = this.workerURL.encodedStringRelativeTo(this.wwwURL);
            lines.push(path);
        }
        lines.push("");
        lines.push("# Resources");
        for (let i = 0, l = this.wwwResourcePaths.length; i < l; ++i){
            lines.push(this.wwwResourcePaths[i]);
        }
        lines.push("");
        lines.push("# CSS");
        for (let i = 0, l = this.wwwCSSPaths.length; i < l; ++i){
            lines.push(this.wwwCSSPaths[i]);
        }
        lines.push("");
        lines.push("NETWORK:");
        lines.push("*");
        lines.push("");
        let txt = lines.join("\n");
        await this.fileManager.createFileAtURL(this.manifestURL, txt.utf8());
    },

    applicationIcons: function(){
        var icons = [];
        let setName = this.project.info.UIApplicationIcon;
        if (setName){
            setName += '.imageset';
            let metadata = this.resources.getMetadata('Contents.json', setName);
            let contents = metadata.value;
            let images = contents.images;
            for (let i = 0, l = images.length; i < l; ++i){
                let image = images[i];
                let metadata = this.resources.getMetadata(image.filename, setName);
                let bundledURL = this.resourcesURL.appendingPathComponent(metadata.hash + metadata.path.fileExtension);
                icons.push({
                    rel: image.mask ? "mask-icon" : "icon",
                    href: bundledURL.encodedStringRelativeTo(this.wwwURL),
                    type: metadata.mimetype,
                    sizes: image.vector ? "any" : '%dx%d'.sprintf(metadata.image.width, metadata.image.height),
                    color: image.color || null
                });
            }
        }
        return icons;
    },

    // -----------------------------------------------------------------------
    // MARK: - Nginx Conf

    bundleConf: async function(){
        this.printer.setStatus("Copying nginx conf...");
        var params = {
            BUILD_ID: this.buildId,
            WORKER_PROCESSES: this.arguments.workers,
            WORKER_CONNECTIONS: this.arguments.connections,
            HTTP_PORT: this.arguments['http-port']
        };
        var projectConfURL = this.project.url.appendingPathComponents(["conf", this.debug ? "debug" : "release"], true);
        var entries = await this.fileManager.contentsOfDirectoryAtURL(projectConfURL);
        for (let i = 0, l = entries.length; i < l; ++i){
            let entry = entries[i];
            if (entry.name.startsWith('.')){
                continue;
            }
            let toURL = this.confURL.appendingPathComponent(entry.name);
            this.printer.setStatus("Copying %s...".sprintf(entry.name));
            if (entry.name.fileExtension == '.conf'){
                let contents = await this.fileManager.contentsAtURL(entry.url);
                let conf = contents.stringByDecodingUTF8();
                conf = conf.replacingTemplateParameters(params);
                await this.fileManager.createFileAtURL(toURL, conf.utf8());
            }else{
                await this.fileManager.copyItemAtURL(entry.url, toURL);
            }
        }
        let bundlePath = this.fileManager.relativePathFromURL(this.workingDirectoryURL, this.bundleURL);
        this.commands.push("nginx -p %s".sprintf(bundlePath));
    },

    // -----------------------------------------------------------------------
    // MARK: - Info & License

    copyInfo: async function(){
        this.printer.setStatus("Copying Info...");
        var infoName = this.project.infoURL.lastPathComponent;
        var infoURL = this.bundleURL.appendingPathComponent(infoName);
        await this.fileManager.copyItemAtURL(this.project.infoURL, infoURL);
    },

    copyLicense: async function(){
        this.printer.setStatus("Copying license...");
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
            HTTP_PORT: this.arguments['http-port']
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
        var docker;
        docker = spawn("docker", args, {cwd: cwd});
        var err = "";
        docker.stderr.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });
        var builder = this;
        return new Promise(function(resolve, reject){
            docker.on('close', function(code){
                if (code !== 0){
                    reject(new Error("Error building docker: " + err));
                }
                var localWWWPath = builder.fileManager.pathForURL(builder.wwwURL);
                var remoteWWWPath = builder.wwwURL.encodedStringRelativeTo(builder.bundleURL.removingLastPathComponent());
                builder.commands.push([
                    "docker run",
                    "--rm",
                    "--name " + name,
                    "-p%d:%d".sprintf(builder.arguments['http-port'], builder.arguments['http-port']),
                    "--mount type=bind,source=%s,target=/%s".sprintf(localWWWPath, remoteWWWPath),
                    identifier
                ].join(" \\\n    "));
                resolve();
            });
            docker.on('error',function(){
                resolve();
            });
        });
    },

});

var getenv = function(name, defaultValue){
    if (name in process.env){
        return process.env[name];
    }
    return defaultValue;
};