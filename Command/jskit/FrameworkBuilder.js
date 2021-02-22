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
// #import "JavascriptCompilation.js"
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

    bundleEnvironments: JSLazyInitProperty('_populateBundleEnvironments'),

    _populateBundleEnvironments: function(){
        var bundleEnvironments = {generic: this.project.entryPoint.path};
        var extraEnvironments = this.project.info.JSBundleEnvironments;
        if (extraEnvironments){
            for (let env in extraEnvironments){
                bundleEnvironments[env] = extraEnvironments[env];
            }
        }
        return bundleEnvironments;
    },

    // -----------------------------------------------------------------------
    // MARK: - Building

    bundleURL: null,
    sourcesURL: null,
    resourcesURL: null,
    bundle: null,
    resources: null,

    setup: async function(){
        await FrameworkBuilder.$super.setup.call(this);
        this.buildURL = this.buildsRootURL.appendingPathComponents([this.project.info.JSBundleIdentifier, this.debug ? "debug" : this.buildLabel], true);
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
        await this.findImports();
        await this.bundleJavascript();
        await this.bundleInfo();
        await this.copyLicense();
        await this.finish();
    },

    bundleResources: async function(){
        this.printer.setStatus("Finding resources...");
        await this.project.loadResources(this.printer);
        var resources = this.resources = this.project.resources;
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

    importsByEnvironment: null,

    findImports: async function(){
        this.importsByEnvironment = {};
        this.printer.setStatus("Finding imports...");
        var genericFrameworks = new Set();
        var genericFiles = new Set();
        var genericFeatures = new Set();
        for (let env in this.bundleEnvironments){
            let imports = await this.project.findJavascriptImports(env);
            this.importsByEnvironment[env] = imports;
        }
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
        var genericFeatures = new Set();
        var sources = {};
        for (let env in this.bundleEnvironments){
            sources[env] = {frameworks: [], files: [], features: []};
            let imports = this.importsByEnvironment[env];
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
                while (bundledPath.startsWith("../")){
                    bundledPath = bundledPath.substr(3);
                }
                if (env == 'generic'){
                    genericFiles.add(bundledPath);
                }
                if (env == 'generic' || !genericFiles.has(bundledPath)){
                    sources[env].files.push(bundledPath);
                    let bundledURL = JSURL.initWithString(bundledPath, this.sourcesURL);
                    this.printer.setStatus("Copying %s...".sprintf(file.url.lastPathComponent));
                    await this.fileManager.copyItemAtURL(file.url, bundledURL);
                }
            }
            for (let i = 0, l = imports.features.length; i < l; ++i){
                let feature = imports.features[i];
                if (env == 'generic'){
                    genericFeatures.add(feature);
                }
                if (env == 'generic' || !genericFeatures.has(feature)){
                    sources[env].features.push(feature);
                }
            }
        }
        return sources;
    },

    minifyReleaseJavascript: async function(variant){
        this.printer.setStatus("Minifying code...");
        var genericFrameworks = new Set();
        var genericFiles = new Set();
        var genericFeatures = new Set();
        var sources = {};
        var copyright  = this.project.getInfoString("JSCopyright", this.resources);
        var licenseString = await this.project.licenseNoticeString();
        if (licenseString.startsWith("Copyright")){
            copyright = "";
        }else{
            copyright += "\n\n";
        }
        var header = "%s (%s)\n----\n%s%s".sprintf(this.project.info.JSBundleIdentifier, this.project.info.JSBundleVersion, copyright, licenseString);
        for (let env in this.bundleEnvironments){
            sources[env] = {frameworks: [], files: [], features: []};
            let filename = this.bundleEnvironments[env];
            let compilation = JavascriptCompilation.initWithName(filename, this.sourcesURL, this.fileManager);
            var fullSourcesURL = this.sourcesURL.appendingPathComponent("_debug", true);
            compilation.sourceRoot = fullSourcesURL.encodedStringRelativeTo(this.sourcesURL);
            compilation.writeComment(header);
            let imports = this.importsByEnvironment[env];
            for (let i = 0, l = imports.files.length; i < l; ++i){
                let file = imports.files[i];
                let bundledPath = file.url.encodedStringRelativeTo(this.project.url);
                while (bundledPath.startsWith("../")){
                    bundledPath = bundledPath.substr(3);
                }
                let bundledURL = JSURL.initWithString(bundledPath, fullSourcesURL);
                if (env == 'generic'){
                    genericFiles.add(bundledPath);
                }
                if (env == 'generic' || !genericFiles.has(bundledPath)){
                    compilation.sources.push(bundledPath);
                    await this.fileManager.copyItemAtURL(file.url, bundledURL);
                    await compilation.writeJavascriptAtURL(file.url);
                }
            }
            await compilation.finish();
            sources[env].files = compilation.files;
            for (let i = 0, l = compilation.frameworks.length; i < l; ++i){
                let framework = compilation.frameworks[i];
                if (env == 'generic'){
                    genericFrameworks.add(framework);
                }
                if (env == 'generic' || !genericFrameworks.has(framework)){
                    sources[env].frameworks.push(framework);
                }
            }
            for (let i = 0, l = imports.features.length; i < l; ++i){
                let feature = imports.features[i];
                if (env == 'generic'){
                    genericFeatures.add(feature);
                }
                if (env == 'generic' || !genericFeatures.has(feature)){
                    sources[env].features.push(feature);
                }
            }
        }
        return sources;
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

    dependencies: function(envs){
        var imports = [];
        var seen = new Set();
        if (this.importsByEnvironment.generic.frameworks){
            for (let i = 0, l = this.importsByEnvironment.generic.frameworks.length; i < l; ++i){
                let import_ = this.importsByEnvironment.generic.frameworks[i];
                imports.push(import_);
                seen.add(import_.name);
            }
        }
        if (!envs){
            envs = [];
        }else if (typeof(envs) == "string"){
            envs = [envs];
        }
        for (let i = 0, l = envs.length; i < l; ++i){
            let env = envs[i];
            if (env in this.importsByEnvironment){
                if (this.importsByEnvironment[env].frameworks){
                    for (let i = 0, l = this.importsByEnvironment[env].frameworks.length; i < l; ++i){
                        let import_ = this.importsByEnvironment[env].frameworks[i];
                        if (!seen.has(import_.name)){
                            imports.push(import_);
                            seen.add(import_.name);
                        }
                    }
                }
            }
        }
        return imports;
    }

});