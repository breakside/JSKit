// #import "Builder.js"
// #import "Resources.js"
// #import "JavascriptCompilation.js"
/* global JSClass, JSObject, JSCopy, JSURL, Builder, HTMLBuilder, Resources, JavascriptCompilation */
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
        'docker-owner': {default: null, help: "The docker repo prefix to use when building a docker image"}
    },

    needsDockerBuild: false,

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
        this.bundleURL = this.buildURL.appendingPathComponent(this.project.name, true);
        this.wwwURL = this.bundleURL.appendingPathComponent('www', true);
        this.confURL = this.bundleURL.appendingPathComponent('conf', true);
        this.logsURL = this.bundleURL.appendingPathComponent('logs', true);
        this.cacheBustingURL = this.bundleURL.appendingPathComponent(this.debug ? this.buildLabel : this.buildId);
        this.sourcesURL = this.cacheBustingURL.appendingPathComponent("JS");
        this.frameworksURL = this.cacheBustingURL.appendingPathComponent("Frameworks");
        this.resourcesURL = this.wwwURL.appendingPathComponent('Resources', true);
        var exists = await this.fileManager.itemExistsAtURL(this.www);
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
        await this.fileManager.createDirectoryAtURL(this.sourceURL);
        await this.fileManager.createDirectoryAtURL(this.frameworksURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
    },

    build: async function(){
        await this.setup();
        await this.findResources();
        await this.findImports();
        await this.bundleFrameworks();
        await this.bundleResources();
        await this.bundleJavascript();
        if (this.hasLinkedDispatchFramework){
            await this.buildWorker();
        }
        await this.bundleWWW();
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

    // ----------------------------------------------------------------------
    // MARK: - Frameworks

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
        await this.fileManager.copyItemAtURL(framework.sourcesURL, bundledURL);
        await this.addFrameworkSources(framework, 'generic', bundledURL);
        await this.addFrameworkSources(framework, 'html', bundledURL);
        await this.addBundleJS(bundledURL, framework.info, framework.resources);
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
        if (!sources.files){
            return;
        }
        let prefix = toURL.encodedStringRelativeTo(this.wwwURL);
        for (let i = 0, l = sources.files.length; i < l; ++i){
            let path = prefix + sources.files[i];
            this.wwwJavascriptPaths.push(path);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Resources

    resources: null,
    wwwResourcePaths: null,

    findResources: async function(){
        var blacklist = {
            names: new Set(["Info.yaml", "Info.json", "Dockerfile", this.project.licenseFilename]),
            directories: new Set(["conf", "www"]),
            extensions: new Set(['.js'])
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
        await this.addBundleJS(this.sourcesURL, this.project.info, this.resources, true);
    },

    addBundleJS: async function(parentURL, info, resources, isMain){
        var bundle = {
            Info: info,
            Resources: [],
            ResourceLookup: {},
            Fonts: []
        };
        if (resources){
            for (let i = 0, l = resources.metadata.length; i < l; ++i){
                let metadata = JSCopy(resources.metadata[i]);
                let hashedPath = metadata.hash + metadata.path.fileExtension;
                let url = this.resourcesURL.appendingPathComponent(hashedPath);
                let sourceURL = resources.sourceURLs[i];
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
            }
            if (resources.lookup){
                bundle.ResourceLookup = resources.lookup;
            }
        }
        var json = JSON.stringify(bundle, this.debug ? 2 : 0);
        var js = "'use strict';\nJSBundle.bundles['%s'] = %s;\n".sprintf(info.JSBundleIdentifier, json);
        if (isMain){
            js += 'JSBundle.mainBundleIdentifier = "%s";\n'.sprintf(info.JSBundleIdentifier);
        }
        var jsURL = parentURL.appendingPathComponent("node-bundle.js");
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
    },

    minifyReleaseJavascript: async function(){
        for (let i = 0, l = this.imports.files.length; i < l; ++i){
            let file = this.imports.files[i];
            let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
            let bundledURL = JSURL.initWithString(bundledPath, this.nodeURL);
            await this.fileManager.copyItemAtURL(file.url, bundledURL);
            this.executableRequires.push(bundledPath);
        }
        let compilation = JavascriptCompilation.initWithName("%s.js".sprintf(this.project.name), this.sourcesURL, this.fileManager);
        var header = "%s (%s)\n----\n%s".sprintf(this.project.info.JSBundleIdentifier, this.project.info.JSBundleVersion, this.project.licenseString);
        compilation.writeComment(header);
        for (let i = 0, l = this.imports.files.length; i < l; ++i){
            let file = this.imports.files[i];
            await compilation.writeJavascriptAtURL(file.url);
        }
        await compilation.finish();
        for (let i = 0, l = compilation.files.length; i < l; ++i){
            let url = this.sourcesURL.appendingPathComponent(compilation.files[i]);
            let wwwPath = url.encodedStringRelativeTo(this.wwwURL);
            this.wwwJavascriptPaths.push(wwwPath);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - WWW

    wwwJavascriptPaths: null,
    wwwCSSPaths:  null,
    manifestURL: null,
    preflightId: null,
    preflightURL: null,
    workerURL: null,

    bundleWWW: async function(){
        this.wwwCSSPaths = [];
        await this.buildCSS();
        await this.buildPreflight();
        await this.buildManifest();

        var params = {
            JSKIT_APP: JSON.stringify({
                appSrc: this.wwwJavascriptPaths,
                appCss: this.wwwCSSPaths,
                preflightId: this.preflightId,
                preflightSrc: this.preflightURL.encodedStringRelativeTo(this.wwwURL)
            }, 2),
            BUILD_ID: this.buildId
        };

        var projectWWWURL = this.project.url.appendingPathComponent('www');
        var entries = await this.fileManager.contentsOfDirectoryAtURL(projectWWWURL);
        for (let i = 0, l = entries.length; i < l; ++i){
            let entry = entries[i];
            let toURL = this.wwwURL.appendingPathComponent(entry.url.lastPathComponent);
            if (entry.name == 'index.html'){
                await this.buildIndex(entry.url, toURL);
            }else{
                await this.fileManager.copyItemAtURL(entry.url, toURL);
            }
        }
    },

    buildIndex: async function(sourceURL, toURL){
        let contents = await this.fileManager.contentsAtURL(sourceURL);
        let html = contents.stringByDecodingUTF8();
        let documet = DOMParser.parseFromString(html, "text/html");
        let serializer = DOMSerializer
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
        for (let i = 0, l = fonts.length; i < l; ++i){
            let metadata = fonts[i];
            lines.push('@font-face {');
            lines.push('  font-family: "%s";'.sprintf(metadata.font.family));
            lines.push('  font-style: %s;'.sprintf(metadata.font.style));
            // TTF weights can be 1 to 1000, CSS weights can on be multiples of 100
            lines.push('  font-weight: %s;'.sprintf(Math.floor((metadata.font.weight / 100) * 100)));
            lines.push('  src: url("%s");'.sprintf(metadata.htmlURL));
            lines.push('  font-display: block;');
            lines.push('}');
        }
        let css = lines.join("\n");
        let url = this.cacheBustingURL.appendingPathComponent("fonts.css");
        await this.fileManager.createFileAtURL(url, css.utf8());
        let path = url.encodedStringRelativeTo(this.wwwURL);
        this.wwwCSSPaths.push(path);
    },

    buildWorker: async function(){
        // TODO:
        // self.updateStatus("Creating worker.js...")
        // sys.stdout.flush()
        // workerJSFile = open(self.workerJSPath, 'w')
        // workerJSFile.write("'use strict';\n")
        // # FIXME: we should probably include logger config as a script file so we're syncd with index, and so
        // # it's easier to import here
        // workerJSFile.write("self.JSGlobalObject = self;\n")
        // workerJSFile.write("importScripts.apply(undefined, %s);\n" % json.dumps([self.absoluteWebPath(js) for js in self.appJS], indent=2))
        // workerJSFile.write("var queueWorker = JSHTMLDispatchQueueWorker.init();\n")
        // workerJSFile.close()
        // self.manifest.append(workerJSFile.name)
    },

    buildPreflight: async function(){
        // TODO:
        // self.updateStatus("Creating preflight js...")
        // sys.stdout.flush()
        // self.featureCheck = JSFeatureCheck()
        // self.featureCheck.addFeature(JSFeature('window'))
        // self.featureCheck.addFeature(JSFeature("document.body"))
        // for feature in self.jsCompilation.features:
        //     self.featureCheck.addFeature(feature)
        // self.preflightFile = open(os.path.join(self.outputWebRootPath, 'preflight-%s.js' % self.featureCheck.hash), 'w')
        // self.featureCheck.serialize(self.preflightFile, 'bootstrapper')
        // self.preflightFile.close()
        // self.manifest.append(self.preflightFile.name)
    },

    buildManifest: async function(){
        this.printer.setStatus("Creating manifest.appcache...");
        let lines = [
            "CACHE MANIFEST",
            "# build %s\n".sprintf(this.buildId)
        ];
        for (let i = 0, l = this.wwwResourcePaths.length; i < l; ++i){
            lines.push(this.wwwResourcePaths[i]);
        }
        for (let i = 0, l = this.wwwCSSPaths.length; i < l; ++i){
            lines.push(this.wwwCSSPaths[i]);
        }
        for (let i = 0, l = this.wwwJavascriptPaths.length; i < l; ++i){
            lines.push(this.wwwJavascriptPaths[i]);
        }
        if (this.preflightURL !== null){
            let path = this.preflightURL.encodedStringRelativeTo(this.wwwURL);
            lines.push(path);
        }
        if (this.workerURL !== null){
            let path = this.workerURL.encodedStringRelativeTo(this.wwwURL);
            lines.push(path);
        }
        // TODO: Bootstrap include (or any others)
        lines.push("");
        lines.push("NETWORK:");
        lines.push("*");
        lines.push("");
        let txt = lines.join("\n");
        this.manifestURL = this.wwwURL.appendingPathComponent("manifest.appcache");
        await this.fileManager.createFileAtURL(this.manifestURL, txt.utf8());
    },



    // TODO: app icons
    // def applicationIcons(self):
    //     icons = []
    //     imagesetName = self.mainBundle.info.get("UIApplicationIcon", None)
    //     if imagesetName is not None:
    //         imagesetName += '.imageset'
    //         contents = self.mainBundle[imagesetName + '/Contents.json']
    //         images = contents['value']['images']
    //         for image in images:
    //             metadata = self.mainBundle[imagesetName + '/' + image['filename']]
    //             icons.append(dict(
    //                 rel="icon" if not image.get('mask', False) else 'mask-icon',
    //                 href=metadata['htmlURL'],
    //                 type=metadata['mimetype'],
    //                 sizes=('%dx%d' % (metadata['image']['width'], metadata['image']['height'])) if not metadata['image'].get('vector', False) else 'any',
    //                 color=image.get('color', None)
    //             ))
    //     return icons

    // -----------------------------------------------------------------------
    // MARK: - Nginx Conf

    bundleConf: async function(){
        var params = {
            BUILD_ID: this.buildId,
            WORKER_PROCESSES: this.arguments.workers,
            WORKER_CONNECTIONS: this.arguments.connections,
            HTTP_PORT: this.arguments['http-port']
        };
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
        // TODO: finish building docker image
    },

});