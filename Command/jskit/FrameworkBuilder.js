// #import "Builder.js"
// #import "Resources.js"
// #import "JavascriptCompilation.js"
/* global JSClass, JSObject, JSLazyInitProperty, JSReadOnlyProperty, JSURL, Builder, FrameworkBuilder, Resources, JavascriptCompilation */
'use strict';

// buildURL
//   - {project.name}.jsframework
//     - Info.yaml
//     - License.txt
//     - sources.json
//     - resources.json
//     - JS
//       - ... js sources ...
//     - Resources
//       - ... resources ...

JSClass("FrameworkBuilder", Builder, {

    bundleType: "framework",

    options: {
    },

    // -----------------------------------------------------------------------
    // MARK: - Environment

    environmentRoots: JSReadOnlyProperty(),

    getEnvironmentRoots: function(){
        var roots = {generic: this.project.name + '.js'};
        var environments = this.project.info.JSBundleEnvironments;
        if (environments){
            for (let env in environments){
                roots[env] = environments[env];
            }
        }
        return roots;
    },

    // -----------------------------------------------------------------------
    // MARK: - Building

    bundleURL: null,
    sourcesURL: null,
    resourcesURL: null,
    bundle: null,

    setup: async function(){
        await FrameworkBuilder.$super.setup.call(this);
        this.bundleURL = this.buildURL.appendingPathComponent(this.project.name + '.jsframework', true);
        var exists = await this.fileManager.itemExistsAtURL(this.bundleURL);
        if (exists){
            await this.fileManager.removeItemAtURL(this.bundleURL);
        }
        this.sourcesURL = this.bundleURL.appendingPathComponent("JS", true);
        this.resourcesURL = this.bundleURL.appendingPathComponent("Resources", true);
        await this.fileManager.createDirectoryAtURL(this.bundleURL);
        await this.fileManager.createDirectoryAtURL(this.sourcesURL);
        await this.fileManager.createDirectoryAtURL(this.resourcesURL);
    },

    build: async function(){
        await this.setup();
        await this.bundleResources();
        await this.bundleJavascript();
        await this.copyInfo();
        await this.copyLicense();
        await this.finish();
    },

    bundleResources: async function(){
        var blacklist = {
            names: new Set(["Info.yaml", "Info.json", "jshint.json", this.project.licenseFilename]),
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
        for (let i = 0, l = resources.metadata.length; i < l; ++i){
            let metadata = resources.metadata[i];
            let url = resources.sourceURLs[i];
            let bundledURL = JSURL.initWithString(metadata.path, this.resourcesURL);
            this.printer.setStatus("Copying %s...".sprintf(url.lastPathComponent));
            await this.fileManager.copyItemAtURL(url, bundledURL);
        }
        var manifest = {
            lookup: resources.lookup,
            metadata: resources.metadata,
            fonts: resources.fonts
        };
        var manifestURL = this.bundleURL.appendingPathComponent('resources.json');
        var json = JSON.stringify(manifest, null, this.debug ? 2 : 0);
        await this.fileManager.createFileAtURL(manifestURL, json.utf8());
    },

    bundleJavascript: async function(){
        var manifest;
        if (this.debug){
            manifest = await this.copyDebugJavascript();
        }else{
            manifest = await this.minifyReleaseJavascript();
        }
        var manifestURL = this.bundleURL.appendingPathComponent('sources.json');
        var json = JSON.stringify(manifest, null, this.debug ? 2 : 0);
        await this.fileManager.createFileAtURL(manifestURL, json.utf8());
    },

    copyDebugJavascript: async function(){
        this.printer.setStatus("Copying code...");
        var genericFrameworks = new Set();
        var genericFiles = new Set();
        var sources = {};
        var roots = this.environmentRoots;
        var includeDirectoryURLs = await this.project.findIncludeDirectoryURLs();
        for (let env in roots){
            let root = roots[env];
            sources[env] = {frameworks: [], files: []};
            let imports = await this.project.findJavascriptImports([root], includeDirectoryURLs);
            for (let i = 0, l = imports.frameworks.length; i < l; ++i){
                let framework = imports.frameworks[i];
                if (env == 'generic'){
                    genericFrameworks.add(framework.name);
                }
                if (env == 'generic' || !genericFrameworks.has(framework.name)){
                    sources[env].frameworks.push(framework.name);
                }
            }
            for (let i = 0, l = imports.files.length; i < l; ++i){
                let file = imports.files[i];
                let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
                // FIXME: convert .. path components to _parent_
                if (env == 'generic'){
                    genericFiles.add(bundledPath);
                }
                if (env == 'generic' || !genericFiles.has(bundledPath)){
                    sources[env].files.push(bundledPath);
                    let bundledURL = JSURL.initWithString(bundledPath, this.sourcesURL);
                    await this.fileManager.copyItemAtURL(file.url, bundledURL);
                }
            }
        }
        return sources;
    },

    minifyReleaseJavascript: async function(variant){
        this.printer.setStatus("Minifying code...");
        var genericFrameworks = new Set();
        var genericFiles = new Set();
        var sources = {};
        var roots = this.environmentRoots;
        var includeDirectoryURLs = await this.project.findIncludeDirectoryURLs();
        var header = "%s (%s)\n----\n%s".sprintf(this.project.info.JSBundleIdentifier, this.project.info.JSBundleVersion, this.project.licenseString);
        for (let env in roots){
            sources[env] = {frameworks: [], files: []};
            let root = roots[env];
            let compilation = JavascriptCompilation.initWithName(root, this.sourcesURL, this.fileManager);
            compilation.writeComment(header);
            let imports = await this.project.findJavascriptImports([root], includeDirectoryURLs);
            for (let i = 0, l = imports.files.length; i < l; ++i){
                let file = imports.files[i];
                let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
                if (env == 'generic'){
                    genericFiles.add(bundledPath);
                }
                if (env == 'generic' || !genericFiles.has(bundledPath)){
                    compilation.writeJavascriptAtURL(file.url);
                }
            }
            await compilation.finish();
            for (let i = 0, l = compilation.frameworks.length; i < l; ++i){
                let framework = compilation.frameworks[i];
                if (env == 'generic'){
                    genericFrameworks.add(framework);
                }
                if (env == 'generic' || !genericFrameworks.has(framework)){
                    sources[env].frameworks.push(framework);
                }
            }
            sources[env].files = compilation.files;
        }
        return sources;
    },

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
    }

});