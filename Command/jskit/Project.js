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

// #import Foundation
// #import jsyaml
// #import "JavascriptFile.js"
// #import "Resources.js"
'use strict';

JSClass("Project", JSObject, {

    // -----------------------------------------------------------------------
    // MARK: - Creating a Project

    initWithURL: function(url, fileManager){
        this.url = url;
        this.fileManager = fileManager || JSFileManager.shared;
        this.name = this.url.lastPathComponent;
    },

    fileManager: null,
    url: null,
    name: null,

    // -----------------------------------------------------------------------
    // MARK: - Project Info

    info: null,
    infoURL: null,

    lastIdentifierPart: JSReadOnlyProperty(),

    getLastIdentifierPart: function(){
        var identifier = this.info.JSBundleIdentifier;
        var index = identifier.lastIndexOf('.');
        if (index < 0){
            return identifier;
        }
        return identifier.substr(index + 1);
    },

    getInfoString: function(infoKey, resources){
        var infoValue = this.info[infoKey] || '';
        var devlang = this.info.JSDevelopmentLanguage || null;
        if (devlang !== null && (devlang in resources.lookup)){
            if (infoValue.length > 0 && infoValue[0] == '.'){
                let hits = resources.lookup[devlang]["Info.strings"];
                if (hits && hits.length > 0){
                    let table = resources.metadata[hits[0]].strings;
                    return table[infoValue.substr(1)] || '';
                }
            }
        }
        return infoValue;
    },

    roots: async function(envs){
        var entryPoint = this.entryPoint;
        let roots = [];
        if (entryPoint !== null){
            roots.push(entryPoint.path);
        }
        var resourceImportPaths;
        if (this.info.JSBundleType == 'html'){
            if (!this.info.UIMainSpec && this.info.UIApplicationDelegate){
                roots.push(this.info.UIApplicationDelegate + ".js");
            }
            await this.loadResources();
            await this.loadIncludeDirectoryURLs();
            resourceImportPaths = await this.resources.getImportPaths(this.includeDirectoryURLs);
            roots = roots.concat(resourceImportPaths);
        }else if (this.info.JSBundleType == 'node'){
            if (!this.info.SKMainSpec && this.info.SKApplicationDelegate){
                roots.push(this.info.SKApplicationDelegate + ".js");
            }
            await this.loadResources();
            await this.loadIncludeDirectoryURLs();
            resourceImportPaths = await this.resources.getImportPaths(this.includeDirectoryURLs);
            roots = roots.concat(resourceImportPaths);
        }else if (this.info.JSBundleType == 'tests'){
            await this._recursivelyAddAnyJavascriptInDirectory(this.url, roots);
        }else if (this.info.JSBundleType == "api"){
            await this.loadResources();
            await this.loadIncludeDirectoryURLs();
            resourceImportPaths = await this.resources.getImportPaths(this.includeDirectoryURLs);
            roots = roots.concat(resourceImportPaths);
        }
        var envRoots = this.info.JSBundleEnvironments;
        if (envRoots && envs){
            for (let i = 0, l = envs.length; i < l; ++i){
                let env = envs[i];
                let root = envRoots[env];
                if (root){
                    roots.push(root);
                }
            }
        }
        return roots;
    },

    // -----------------------------------------------------------------------
    // MARK: - Loading Project

    load: async function(){
        await this._loadInfo();
    },

    reload: async function(){
        this.unloadResources();
        this.unloadIncludeDirectoryURLs();
        await this._loadInfo();
    },

    _loadInfo: async function(){
        var url = this.url.appendingPathComponent("Info.json");
        var exists = await this.fileManager.itemExistsAtURL(url);
        if (exists){
            let contents = await this.fileManager.contentsAtURL(url);
            let json = contents.stringByDecodingUTF8();
            this.info = JSON.parse(json);
            this.infoURL = url;
            return;
        }
        url = this.url.appendingPathComponent("Info.yaml");
        exists = await this.fileManager.itemExistsAtURL(url);
        if (exists){
            let contents = await this.fileManager.contentsAtURL(url);
            let yaml = contents.stringByDecodingUTF8();
            this.info = jsyaml.safeLoad(yaml);
            this.infoURL = url;
            return;
        }
        throw new Error("Missing Info.(json|yaml) file");
    },

    // -----------------------------------------------------------------------
    // MARK: - License

    licenseFilename: JSReadOnlyProperty(),

    getLicenseFilename: function(){
        if ('JSLicense' in this.info){
            return this.info.JSLicense;
        }
        return "LICENSE.txt";
    },

    licenseString: async function(){
        var url = this.url.appendingPathComponent(this.licenseFilename);
        var exists = await this.fileManager.itemExistsAtURL(url);
        if (exists){
            var txt = await this.fileManager.contentsAtURL(url);
            return txt.stringByDecodingUTF8();
        }
        return "";
    },

    licenseNoticeString: async function(){
        if ('JSLicenseNotice' in this.info){
            return this.info.JSLicenseNotice;
        }
        return this.licenseString();
    },

    // -----------------------------------------------------------------------
    // MARK: - Entry Point

    entryPoint: JSReadOnlyProperty(),

    getEntryPoint: function(){
        if (this.info.EntryPoint){
            var entryParts = this.info.EntryPoint.split(':');   
            return {
                path: entryParts[0],
                fn: entryParts[1] || null
            };
        }
        if (this.info.JSBundleType == 'framework'){
            return {path: this.info.EntryPoint || this.name + '.js', fn: null};
        }
        if (this.info.JSBundleType == 'tests'){
            return null;
        }
        if (this.info.JSBundleType == "api"){
            return {path: this.info.APIResponder + '.js', fn: null};
        }
        return {
            path: 'main.js',
            fn: 'main'
        };
    },

    // -----------------------------------------------------------------------
    // MARK: - Subdirectory Traversal

    includeDirectoryURLs: null,

    loadIncludeDirectoryURLs: async function(){
        if (this.includeDirectoryURLs !== null){
            return;
        }
        this.includeDirectoryURLs = await this.findIncludeDirectoryURLs();
    },

    findIncludeDirectoryURLs: async function(){
        var stack = [this.url];
        if (this.info.JSIncludeDirectories){
            for (let path of this.info.JSIncludeDirectories){
                stack.push(JSURL.initWithString(path, this.url));
            }
        }
        var urls = [];
        while (stack.length > 0){
            let url = stack.shift();
            if (url.fileExtension == '.jsframework'){
                continue;
            }
            let entries = await this.fileManager.contentsOfDirectoryAtURL(url);
            urls.push(url);
            for (let i = 0, l = entries.length; i < l; ++i){
                let entry = entries[i];
                if (entry.name.startsWith(".'")){
                    continue;
                }
                if (entry.itemType == JSFileManager.ItemType.directory){
                    stack.push(entry.url);
                }
                // TODO: symlinks to directories????
            }
        }
        return urls;
    },

    unloadIncludeDirectoryURLs: function(){
        this.includeDirectoryURLs = null;
    },

    // -----------------------------------------------------------------------
    // MARK: - Resources

    urlForJavascriptPath: async function(path, includeDirectoryURLs){
        let directoryURL;
        let candidateURL;
        let found;
        for (let i = 0, l = includeDirectoryURLs.length; i < l; ++i){
            directoryURL = includeDirectoryURLs[i];
            candidateURL = directoryURL.appendingPathComponent(path);
            found = await this.fileManager.itemExistsAtURL(candidateURL);
            if (found){
                return candidateURL;
            }
        }
        return null;
    },

    urlForFrameworkName: async function(name, includeDirectoryURLs){
        let directoryURL;
        let candidateURL;
        let found;
        for (let i = 0, l = includeDirectoryURLs.length; i < l; ++i){
            directoryURL = includeDirectoryURLs[i];
            candidateURL = directoryURL.appendingPathComponent(name + '.jsframework', true);
            found = await this.fileManager.itemExistsAtURL(candidateURL);
            if (found){
                return candidateURL;
            }
            candidateURL = directoryURL.appendingPathComponent(name + '.jslink', false);
            found = await this.fileManager.itemExistsAtURL(candidateURL);
            if (found){
                let link = await this.fileManager.contentsAtURL(candidateURL);
                candidateURL = JSURL.initWithString(link.stringByDecodingUTF8(), candidateURL);
                candidateURL.hasDirectoryPath = true;
                found = await this.fileManager.itemExistsAtURL(candidateURL);
                if (!found){
                    throw new Error("Bad .jslink at %s.jslink".sprintf(name));
                }
                return candidateURL;
            }
        }
        candidateURL = this.url.removingLastPathComponent().appendingPathComponent(name, true);
        found = await this.fileManager.itemExistsAtURL(candidateURL);
        if (found){
            return candidateURL;
        }
        var jskitURL = this.fileManager.urlForPath(JSKitRootDirectoryPath);
        candidateURL = jskitURL.appendingPathComponents(["Frameworks", name], true);
        found = await this.fileManager.itemExistsAtURL(candidateURL);
        if (found){
            return candidateURL;
        }
        return null;
    },

    findJavascriptImports: async function(env){
        await this.loadIncludeDirectoryURLs();
        var includeDirectoryURLs = this.includeDirectoryURLs;
        var roots = await this.roots([env]);
        var result = {
            files: [],
            frameworks: [],
            features: [],
            globals: []
        };
        var visited = {
            paths: new Set(),
            frameworks: new Set(),
            features: new Set()
        };

        var visit = async function(path, sourceURL, sourceLine){
            if (!visited.paths.has(path)){
                visited.paths.add(path);
                let url = await this.urlForJavascriptPath(path, includeDirectoryURLs);
                if (url === null){
                    if (sourceURL){
                        throw new Error('Cannot find "%s", included from %s:%d'.sprintf(path, sourceURL, sourceLine));
                    }
                    throw new Error('Cannot find "%s"'.sprintf(path));
                }
                let data = await this.fileManager.contentsAtURL(url);
                let js = JavascriptFile.initWithData(data, url);
                let imports = js.imports();
                let import_;
                for (let i = 0, l = imports.paths.length; i < l; ++i){
                    import_ = imports.paths[i];
                    await visit.call(this, import_.path, import_.sourceURL, import_.sourceLine);
                }
                result.files.push({url: url});

                for (let i = 0, l = imports.frameworks.length; i < l; ++i){
                    import_ = imports.frameworks[i];
                    let name = import_.name;
                    if (!visited.frameworks.has(name)){
                        visited.frameworks.add(name);
                        let url = await this.urlForFrameworkName(name, includeDirectoryURLs);
                        if (url === null){
                            if (import_.sourceURL){
                                throw new Error('Cannot find framework %s, included from %s:%d'.sprintf(name, import_.sourceURL, import_.sourceLine));
                            }
                            throw new Error('Cannot find "%s"'.sprintf(name));
                        }
                        result.frameworks.push({name: name, url: url});
                    }
                }
                for (let i = 0, l = imports.features.length; i < l; ++i){
                    let feature = imports.features[i];
                    if (!visited.features.has(feature)){
                        result.features.push(feature);
                    }
                }
                let globals = js.globals();
                for (let i = 0, l = globals.length; i < l; ++i){
                    let name = globals[i];
                    result.globals.push(name);
                }
            }
        };

        for (let i = 0, l = roots.length; i < l; ++i){
            await visit.call(this, roots[i]);
        }

        return result;
    },

    _recursivelyAddAnyJavascriptInDirectory: async function(url, paths){
        var entries = await this.fileManager.contentsOfDirectoryAtURL(url);
        for (let i = 0, l = entries.length; i < l; ++i){
            let entry = entries[i];
            if (entry.itemType == JSFileManager.ItemType.directory){
                await this._recursivelyAddAnyJavascriptInDirectory(entry.url, paths);
            }else if (entry.name.fileExtension == ".js"){
                paths.push(entry.name);
            }
        }
    },

    globals: async function(roots, visitFrameworks, seenFrameworks, envs){
        await this.loadIncludeDirectoryURLs();
        var includeDirectoryURLs = this.includeDirectoryURLs;
        var seenFiles = new Set();
        var urlStack = [];
        var frameworkStack = [];
        if (seenFrameworks === undefined){
            seenFrameworks = new Set();
        }
        if (envs === undefined){
            if (this.info.JSBundleType == 'html'){
                envs = ['html'];
            }else if (this.info.JSBundleType == 'node'){
                envs = ['node'];
            }
        }
        for (let i = 0, l = roots.length; i < l; ++i){
            let root = roots[i];
            if (typeof(root) === 'string'){
                root = await this.urlForJavascriptPath(root, includeDirectoryURLs);
            }
            urlStack.push(root);
        }
        var globals = [];
        while (urlStack.length > 0){
            let url = urlStack.shift();
            let contents = null;
            if (url instanceof JSData){
                contents = url;
            }else{
                seenFiles.add(url.path);
                contents = await this.fileManager.contentsAtURL(url);
            }
            let js = JavascriptFile.initWithData(contents);
            let fileGlobals = js.globals();
            for (let i = 0, l = fileGlobals.length; i < l; ++i){
                globals.push(fileGlobals[i]);
            }
            let imports = js.imports();
            for (let i = 0, l = imports.paths.length; i < l; ++i){
                let path = imports.paths[i].path;
                let url = await this.urlForJavascriptPath(path, includeDirectoryURLs);
                if (url !== null && !seenFiles.has(url.path)){
                    seenFiles.add(url.path);
                    urlStack.push(url);
                }
            }
            for (let i = 0, l = imports.frameworks.length; i < l; ++i){
                let name = imports.frameworks[i].name;
                if (!seenFrameworks.has(name)){
                    seenFrameworks.add(name);
                    frameworkStack.push(name);
                }
            }
        }

        if (visitFrameworks){
            while (frameworkStack.length > 0){
                let name = frameworkStack.shift();
                let url = await this.urlForFrameworkName(name, includeDirectoryURLs);
                if (url !== null){
                    if (url.fileExtension === '.jsframework'){
                        let sourcesURL = url.appendingPathComponent("sources.json");
                        let data = await this.fileManager.contentsAtURL(sourcesURL);
                        let sources = JSON.parse(data.stringByDecodingUTF8());
                        if (sources.generic.globals){
                            for (let name of sources.generic.globals){
                                globals.push(name);
                            }
                        }
                        for (let env of envs){
                            if ((env in sources) && sources[env].globals){
                                for (let name of sources[env].globals){
                                    globals.push(name);
                                }
                            }
                        }
                    }else{
                        let frameworkProject = Project.initWithURL(url);
                        try{
                            await frameworkProject.load();
                            let roots = await frameworkProject.roots(envs);
                            let frameworkGlobals = await frameworkProject.globals(roots, true, seenFrameworks, envs);
                            for (let i = 0, l = frameworkGlobals.length; i < l; ++i){
                                globals.push(frameworkGlobals[i]);
                            }
                        }catch(e){
                            console.error(e);
                        }
                    }
                }
            }
        }

        return globals;
    },

    // -----------------------------------------------------------------------
    // MARK: - Resources

    resources: null,

    loadResources: async function(printer){
        if (this.resources !== null){
            return;
        }
        var urls = await this.findResourceURLs();
        var resources = Resources.initWithFileManager(this.fileManager);
        for (let i = 0, l = urls.length; i < l; ++i){
            let url = urls[i];
            if (printer !== undefined){
                printer.setStatus("Inspecting %s...".sprintf(url.lastPathComponent));
            }
            await resources.addResourceAtURL(url);
        }
        this.resources = resources;
    },

    resourceBlacklist: function(){
        switch (this.info.JSBundleType){
            case "html":
                return {names: new Set(["Info.yaml", "Info.json", "Dockerfile", "conf", "www", this.licenseFilename]), extensions: new Set()};
            case "node":
                return {names: new Set(["Info.yaml", "Info.json", "package.json", "Dockerfile", "README.md", this.licenseFilename]), extensions: new Set()};
            case "api":
                return {names: new Set(["Info.yaml", "Info.json", "package.json", this.licenseFilename]), extensions: new Set()};
            case "framework":
                return {names: new Set(["Info.yaml", "Info.json", this.licenseFilename]), extensions: new Set()};
            case "tests":
                return {names: new Set(["Info.yaml", "Info.json", this.licenseFilename]), extensions: new Set()};
            default:
                return {names: new Set(), extensions: new Set()};
        }
    },

    findResourceURLs: async function(){
        var blacklist = this.resourceBlacklist();
        blacklist.extensions.add(".js");
        blacklist.extensions.add(".jslink");
        blacklist.extensions.add(".jsframework");
        var stack = [this.url];
        var urls = [];
        while (stack.length > 0){
            let url = stack.shift();
            let entries = await this.fileManager.contentsOfDirectoryAtURL(url);
            for (let i = 0, l = entries.length; i < l; ++i){
                let entry = entries[i];
                if (entry.name.startsWith(".")) continue;
                if (entry.itemType == JSFileManager.ItemType.directory && entry.name.fileExtension != '.lproj' && entry.name.fileExtension != '.imageset'){
                    if (!blacklist.names.has(entry.name) && !blacklist.extensions.has(entry.name.fileExtension)){
                        stack.push(entry.url);
                    }
                }else{
                    if (!blacklist.names.has(entry.name) && !blacklist.extensions.has(entry.name.fileExtension)){
                        urls.push(entry.url);
                    }
                }
            }
        }
        if (this.info.JSResources){
            for (let i = 0, l = this.info.JSResources.length; i < l; ++i){
                let path = this.info.JSResources[i];
                let url = this.url.appendingPathComponent(path);
                urls.push(url);
            }
        }
        return urls;
    },

    unloadResources: function(){
        this.resources = null;
    }

});

Project.projectForFile = async function(fileURL){
    var candidateURL = fileURL.removingLastPathComponent();
    while (candidateURL.pathComponents.length > 1){
        var project = Project.initWithURL(candidateURL);
        try{
            await project.load();
            return project;
        }catch (e){
            candidateURL = candidateURL.removingLastPathComponent();
        }
    }
    return null;
};