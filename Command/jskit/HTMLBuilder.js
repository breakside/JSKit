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
        'docker-image': {default: null, help: "The name to use when building a docker image"},
        'docker-tag': {default: null, help: "An optional docker tag for the built image"},
        'no-docker': {kind: "flag", help: "Don't build the docker image"},
        'env': {default: null, help: "A file with environmental variables for this build"},
        'tls-cert': {default: null, help: "The SSL cert to use for the debug build"},
        'tls-key': {default: null, help: "The SSL key to use for the debug build"},
        'zoneinfo': {default: null, help: "The build host path to timezone data files"}
    },

    needsDockerBuild: true,

    bundleURL: null,
    wwwURL: null,
    confURL: null,
    s3URL: null,
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
        this.s3URL = this.bundleURL.appendingPathComponent('s3', true);
        this.logsURL = this.bundleURL.appendingPathComponent('logs', true);
        this.tzURL = this.bundleURL.appendingPathComponent('tz', true);
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
        await this.fileManager.createDirectoryAtURL(this.tzURL);
        await this.fileManager.createDirectoryAtURL(this.cacheBustingURL);
        await this.fileManager.createDirectoryAtURL(this.sourcesURL);
        await this.fileManager.createDirectoryAtURL(this.frameworksURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
    },

    build: async function(){
        await this.setup();
        await this.populateEnvironment();
        await this.findResources();
        await this.buildZoneInfo();
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
        await this.bundleS3DeployScript();
        await this.copyLicense();
        await this.bundleInfo();
        await this.buildDocker();
        await this.finish();
    },

    findImports: async function(){
        this.printer.setStatus("Finding code...");
        this.imports = await this.project.findJavascriptImports();
    },

    // -----------------------------------------------------------------------
    // MARK: - Environment

    _buildEnvironment: null,

    setupEnvironment: async function(){
        this._buildEnvironment = JSEnvironment.init();
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
                this._buildEnvironment = JSEnvironment.initWithData(contents);
            }
        }catch(e){
        }
    },

    getEnvironment: function(name, defaultValue){
        if (this._buildEnvironment){
            return this._buildEnvironment.get(name, getenv(name, defaultValue));
        }
        return getenv(name, defaultValue);
    },

    populateEnvironment: async function(){
        await this.setupEnvironment();
        this.project.info.HTMLApplicationEnvironment = this._buildEnvironment.getAll();
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
        if (framework.resources){
            for (let i = 0, l = framework.resources.metadata.length; i < l; ++i){
                let metadata = framework.resources.metadata[i];
                let url = resourcesBase.appendingPathComponent(metadata.path);
                sourceURLs.push(url);
            }
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
    // MARK: - TimeZone Info

    buildZoneInfo: async function(){
        if (this.project.info.JSTimeZoneInfo){
            return;
        }
        var url = this.tzURL.appendingPathComponent("tz.zoneinfo");
        var contentsURL = url.appendingPathComponent("Contents.json");
        var exists = await this.fileManager.itemExistsAtURL(contentsURL);
        if (exists){
            var attributes = await this.fileManager.attributesOfItemAtURL(contentsURL);
            if (JSDate.now.timeIntervalSince1970 - attributes.created < JSTimeInterval.hours(24 * 14)){
                // Don't bother rebuilding zone info if it's less than two weeks old
                // (only applies to debug builds that build over the same folder)
                await this.resources.addResourceAtURL(url);
                return;
            }
        }
        var tzifURL = url.appendingPathComponent("tzif");
        var contents = {
            tzif: tzifURL.lastPathComponent,
            map: {}
        };
        var chunks = [];
        var offset = 0;
        var path = this.arguments.zoneinfo;
        if (path === null){
            path = "/usr/share/zoneinfo";
        }
        var root = JSURL.initWithString(path, this.workingDirectoryURL).settingHasDirectoryPath(true);
        exists = await this.fileManager.itemExistsAtURL(root);
        if (!exists){
            if (this.arguments.zoneinfo === null){
                return;
            }
            throw new Error("Unable to find zoneinfo, no such directory: %s".sprintf(path));
        }
        var links = {};
        var builder = this;
        var visit = async function(directoryURL){
            var entries = await builder.fileManager.contentsOfDirectoryAtURL(directoryURL);
            var entry;
            for (let i = 0, l = entries.length; i < l; ++i){
                entry = entries[i];
                let name = entry.url.encodedStringRelativeTo(root);
                if (entry.name.startsWith(".")) continue;
                if (entry.name[0].toLowerCase() == entry.name[0]) continue;
                if (entry.itemType === JSFileManager.ItemType.directory){
                    await visit(entry.url);
                }else if (entry.itemType === JSFileManager.ItemType.file){
                    let tzif = await builder.fileManager.contentsAtURL(entry.url);
                    if (tzif.length >= 44 && tzif[0] == 0x54 && tzif[1] == 0x5A && tzif[2] == 0x69 && tzif[3] == 0x66){
                        tzif = builder._modifiedTzif(tzif);
                        if (tzif.length >= 44 && tzif[0] == 0x54 && tzif[1] == 0x5A && tzif[2] == 0x69 && tzif[3] == 0x66){
                            let zone = JSTimeZone.initWithData(tzif, name);
                            if (zone !== null){
                                chunks.push(tzif);
                                contents.map[name] = [offset, tzif.length];
                                offset += tzif.length;
                            }
                        }
                    }
                }else if (entry.itemType === JSFileManager.ItemType.symbolicLink){
                    let destination = await builder.fileManager.destinationOfSymbolicLinkAtURL(entry.url);
                    links[name] = destination.encodedStringRelativeTo(root);
                }
            }
        };
        this.printer.setStatus("Packaging time zone data");
        await visit(root);
        for (let name in links){
            let destination = links[name];
            if (destination in contents.map){
                contents.map[name] = contents.map[destination];
            }
        }
        var tzif = JSData.initWithChunks(chunks);
        var json = JSON.stringify(contents);
        await this.fileManager.createFileAtURL(contentsURL, json.utf8());
        await this.fileManager.createFileAtURL(tzifURL, tzif);
        await this.resources.addResourceAtURL(url);
    },

    _modifiedTzif: function(tzif){
        // Strip the v1 header+data and set the version to a custom value
        // JSTimeZone knows to look for this modified version
        var offset = 20;
        var dataView = tzif.dataView();
        var counts = {
            universal: dataView.getUint32(offset),
            standard: dataView.getUint32(offset + 4),
            leap: dataView.getUint32(offset + 8),
            transition: dataView.getUint32(offset + 12), 
            type: dataView.getUint32(offset + 16),
            abbreviation: dataView.getUint32(offset + 20)
        };
        offset += 24;
        offset += 4 * counts.transition;
        offset += 1 * counts.transition;
        offset += 6 * counts.type;
        offset += counts.abbreviation;
        offset += 8 * counts.leap;
        offset += 1 * counts.standard;
        offset += 1 * counts.universal;
        if (offset + 44 > tzif.length){
            return tzif;
        }
        var modified = JSData.initWithCopyOfData(tzif.subdataInRange(JSRange(offset, tzif.length - offset)));
        modified[4] = 0x6A; // version "j" for jskit
        return modified;
    },

    // ----------------------------------------------------------------------
    // MARK: - Resources

    resources: null,
    wwwResourcePaths: null,

    findResources: async function(){
        this.printer.setStatus("Finding resources...");
        await this.project.loadResources(this.printer);
        this.resources = this.project.resources;
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
                let hashedPath = metadata.hash + metadata.ext;
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
        var copyright  = this.project.getInfoString("JSCopyright", this.resources);
        var licenseString = await this.project.licenseNoticeString();
        if (licenseString.startsWith("Copyright")){
            copyright = "";
        }else{
            copyright += "\n\n";
        }
        var header = "%s (%s)\n----\n%s%s".sprintf(this.project.info.JSBundleIdentifier, this.project.info.JSBundleVersion, copyright, licenseString);
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
            if (entry.name.startsWith('.') && entry.name != ".well-known"){
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

    indexURL: null,

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
                            environment: this.project.info.HTMLApplicationEnvironment,
                            buildId: this.buildId,
                            bundleId: this.project.info.JSBundleIdentifier,
                            bundleVersion: this.project.info.JSBundleVersion,
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
        this.indexURL = toURL;
    },

    buildCSS: async function(){
        // We used to add fonts in a CSS file, but now use the FontFace interface
        // during application startup.
        // Preserving for reference in case we need to add other kinds of css in the future
        // var fonts = [];
        // for (let i = 0, l = this.resources.metadata.length; i < l; ++i){
        //     let metadata = this.resources.metadata[i];
        //     if (metadata.font){
        //         fonts.push(metadata);
        //     }
        // }
        // if (fonts.length === 0){
        //     return;
        // }
        // var lines = [];
        // let fontsCSSURL = this.cacheBustingURL.appendingPathComponent("fonts.css");
        // for (let i = 0, l = fonts.length; i < l; ++i){
        //     let metadata = fonts[i];
        //     let bundledURL = this.resourcesURL.appendingPathComponent(metadata.hash + metadata.ext);
        //     lines.push('@font-face {');
        //     lines.push('  font-family: "%s";'.sprintf(metadata.font.family));
        //     lines.push('  font-style: %s;'.sprintf(metadata.font.style));
        //     // TTF weights can be 1 to 1000, CSS weights can on be multiples of 100
        //     lines.push('  font-weight: %s;'.sprintf(Math.floor((metadata.font.weight / 100) * 100)));
        //     lines.push('  src: url("%s");'.sprintf(bundledURL.encodedStringRelativeTo(fontsCSSURL)));
        //     lines.push('  font-display: block;');
        //     lines.push('}');
        // }
        // let css = lines.join("\n");
        // await this.fileManager.createFileAtURL(fontsCSSURL, css.utf8());
        // let path = fontsCSSURL.encodedStringRelativeTo(this.wwwURL);
        // this.wwwCSSPaths.push(path);
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
        var sources = {'./': {required: true, cache: "no-store"}};
        for (let i = 0, l = this.wwwPaths.length; i < l; ++i){
            sources[this.wwwPaths[i]] = {required: true, cache: "no-store"};
        }
        for (let i = 0, l = this.wwwJavascriptPaths.length; i < l; ++i){
            sources[this.wwwJavascriptPaths[i]] = {required: true, cache: "no-store"};
        }
        if (this.preflightURL !== null){
            let path = this.preflightURL.encodedStringRelativeTo(this.wwwURL);
            sources[path] = {required: true, cache: "default"};
        }
        if (this.workerURL !== null && this.hasLinkedDispatchFramework){
            let path = this.workerURL.encodedStringRelativeTo(this.wwwURL);
            sources[path] = {required: true, cache: "no-store"};
        }
        for (let i = 0, l = this.wwwResourcePaths.length; i < l; ++i){
            sources[this.wwwResourcePaths[i]] = {required: true, cache: "default"};
        }
        for (let i = 0, l = this.wwwCSSPaths.length; i < l; ++i){
            sources[this.wwwCSSPaths[i]] = {required: true, cache: "no-store"};
        }
        for (let i = 0, l = this.uncachedWWWPaths.length; i < l; ++i){
            sources[this.uncachedWWWPaths[i]] = {required: false, cache: "default"};
        }
        var params = {
            JSKIT_APP: JSON.stringify({
                buildId: this.buildId,
                environment: this.project.info.HTMLApplicationEnvironment,
                sources: sources,
                debug: this.debug
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
                let bundledURL = this.resourcesURL.appendingPathComponent(metadata.hash + metadata.ext);
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
        if (this.arguments['tls-cert']){
            let fromURL = JSURL.initWithString(this.arguments['tls-cert'], this.workingDirectoryURL);
            let toURL = this.confURL.appendingPathComponent("tls.crt");
            await this.fileManager.copyItemAtURL(fromURL, toURL);
            if (this.arguments['tls-key']){
                let fromURL = JSURL.initWithString(this.arguments['tls-key'], this.workingDirectoryURL);
                let toURL = this.confURL.appendingPathComponent("tls.key");
                await this.fileManager.copyItemAtURL(fromURL, toURL);
            }
        }
        var params = {
            BUILD_ID: this.buildId,
            WORKER_PROCESSES: this.arguments.workers,
            WORKER_CONNECTIONS: this.arguments.connections,
            HTTP_PORT: this.arguments['http-port'],
            SSL_LISTEN: this.arguments['tls-cert'] ? " ssl" : "",
            SSL_CERT: this.arguments['tls-cert'] ? "ssl_certificate tls.crt;" : "",
            SSL_KEY: this.arguments['tls-key'] ? "ssl_certificate_key tls.key;" : ""
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
    // MARK: - S3 Deploy

    bundleS3DeployScript: async function(){
        this.printer.setStatus("Creating s3 deploy script...");
        var emptyURL = this.s3URL.appendingPathComponent("empty");
        await this.fileManager.createFileAtURL(emptyURL, JSData.initWithLength(0));
        var scriptURL = this.s3URL.appendingPathComponent("deploy.sh");
        var localRootPath = this.fileManager.pathForURL(this.wwwURL.settingHasDirectoryPath(false));
        var lines = [];
        lines.push("#!/bin/sh");
        lines.push("");
        lines.push("S3_BUCKET=$1");
        lines.push("S3_PREFIX=$2");
        lines.push("S3_ROOT=s3://${S3_BUCKET}${S3_PREFIX}");
        lines.push("LOCAL_ROOT=%s".sprintf(localRootPath));
        lines.push("");
        lines.push("if [ -z \"$S3_ROOT\" ]; then");
        lines.push("  echo \"Usage: deploy.sh s3-bucket [s3-prefix]\"");
        lines.push("  exit 1");
        lines.push("fi");
        lines.push("");
        let resourcesPath = this.resourcesURL.settingHasDirectoryPath(true).encodedStringRelativeTo(this.wwwURL);
        let cacheBustingPath = this.cacheBustingURL.settingHasDirectoryPath(true).encodedStringRelativeTo(this.wwwURL);
        let indexPath = this.indexURL.encodedStringRelativeTo(this.wwwURL);
        let preflightPath = this.preflightURL.encodedStringRelativeTo(this.wwwURL);
        let manifestPath = null;
        let serviceWorkerPath = null;
        let bootstrapperPath = "HTMLAppBootstrapper.js";
        let excludes = [
            cacheBustingPath + "*",
            resourcesPath + "*",
            preflightPath,
            indexPath,
            bootstrapperPath
        ];
        if (this.manifestURL !== null){
            manifestPath = this.manifestURL.encodedStringRelativeTo(this.wwwURL);
            excludes.push(manifestPath);
        }
        if (this.serviceWorkerURL !== null){
            serviceWorkerPath = this.serviceWorkerURL.encodedStringRelativeTo(this.wwwURL);
            excludes.push(serviceWorkerPath);
        }
        lines.push("aws s3 sync ${LOCAL_ROOT} ${S3_ROOT} %s || exit 1".sprintf(excludes.map(e => "--exclude '" + e + "'").join(" ")));
        lines.push("aws s3 sync ${LOCAL_ROOT}/%1$s ${S3_ROOT}/%1$s --cache-control='max-age=315360000' --expires 'Thu, 31 Dec 2037 23:55:55 GMT' || exit 1".sprintf(cacheBustingPath));
        lines.push("aws s3 sync ${LOCAL_ROOT}/%1$s ${S3_ROOT}/%1$s --size-only --cache-control='max-age=315360000' --expires 'Thu, 31 Dec 2037 23:55:55 GMT' || exit 1".sprintf(resourcesPath));
        lines.push("aws s3 cp ${LOCAL_ROOT}/%1$s ${S3_ROOT}/%1$s --cache-control='max-age=315360000' --expires 'Thu, 31 Dec 2037 23:55:55 GMT' || exit 1".sprintf(preflightPath));
        lines.push("aws s3 cp ${LOCAL_ROOT}/%1$s ${S3_ROOT}/%1$s --cache-control='no-cache' --expires 'Thu, 01 Jan 1970 00:00:01 GMT' || exit 1".sprintf(bootstrapperPath));
        lines.push("aws s3 cp ${LOCAL_ROOT}/%1$s ${S3_ROOT}/%1$s --cache-control='no-cache' --expires 'Thu, 01 Jan 1970 00:00:01 GMT' || exit 1".sprintf(indexPath));
        if (manifestPath !== null){
            lines.push("aws s3 cp ${LOCAL_ROOT}/%1$s ${S3_ROOT}/%1$s --cache-control='no-cache' --expires 'Thu, 01 Jan 1970 00:00:01 GMT' --content-type='text/cache-manifest' || exit 1".sprintf(manifestPath));
        }
        if (serviceWorkerPath !== null){
            lines.push("aws s3 cp ${LOCAL_ROOT}/%1$s ${S3_ROOT}/%1$s --cache-control='no-cache' --expires 'Thu, 01 Jan 1970 00:00:01 GMT' || exit 1".sprintf(serviceWorkerPath));
        }
        lines.push("");
        var contents = lines.join("\n").utf8();
        await this.fileManager.createFileAtURL(scriptURL, contents);
        await this.fileManager.makeExecutableAtURL(scriptURL);
    },

    // -----------------------------------------------------------------------
    // MARK: - Info & License

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

        if (this.arguments['no-docker']){
            return;
        }

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
                if (code === 1 && err.startsWith("Cannot connect to the Docker daemon")){
                    builder.printer.print("Warning: Docker not running, skipping `docker build`.  Please start docker to use this feature.\n");
                    resolve();
                    return;
                }
                if (code !== 0){
                    reject(new Error("Failed to build docker image\n" + err));
                    return;
                }
                var localWWWPath = builder.fileManager.pathForURL(builder.wwwURL);
                var remoteWWWPath = builder.wwwURL.encodedStringRelativeTo(builder.bundleURL.removingLastPathComponent());
                var cmd = [
                    "docker run",
                    "--rm",
                    "--name " + name,
                    "-p%d:%d".sprintf(builder.arguments['http-port'], builder.arguments['http-port']),
                ];
                if (builder.debug){    
                    cmd.push("--mount type=bind,source=%s,target=/%s".sprintf(localWWWPath, remoteWWWPath));
                }
                cmd.push(identifier);
                builder.commands.push(cmd.join(" \\\n    "));
                resolve();
            });
            docker.on('error',function(){
                builder.printer.print("Warning: Docker not available, skipping `docker build`.  You'll need to install docker to use this feature.\n");
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