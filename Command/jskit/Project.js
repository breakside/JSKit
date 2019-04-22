// #import Foundation
// #import jsyaml
// #import "JavascriptFile.js"
/* global JSClass, JSObject, JSFileManager, jsyaml, JSReadOnlyProperty, JavascriptFile, JSURL, JSKitRootDirectoryPath */
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

    // -----------------------------------------------------------------------
    // MARK: - Loading Project

    load: async function(){
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
        return {
            path: 'main.js',
            fn: 'main'
        };
    },

    // -----------------------------------------------------------------------
    // MARK: - Subdirectory Traversal

    findIncludeDirectoryURLs: async function(){
        var stack = [this.url];
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

    // -----------------------------------------------------------------------
    // MARK: - Resources

    findJavascriptImports: async function(roots, includeDirectoryURLs){
        var result = {
            files: [],
            frameworks: [],
            features: []
        };
        var visited = {
            paths: new Set(),
            frameworks: new Set(),
            features: new Set()
        };

        var visit = async function(path, sourceURL, sourceLine){
            if (!visited.paths.has(path)){
                visited.paths.add(path);
                let found = false;
                let directoryURL;
                let candidateURL;
                for (let i = 0, l = includeDirectoryURLs.length; i < l && !found; ++i){
                    directoryURL = includeDirectoryURLs[i];
                    candidateURL = directoryURL.appendingPathComponent(path);
                    found = await this.fileManager.itemExistsAtURL(candidateURL);
                }
                if (!found){
                    if (sourceURL){
                        throw new Error('Cannot find "%s", included from %s:%d'.sprintf(path, sourceURL, sourceLine));
                    }
                    throw new Error('Cannot find "%s"'.sprintf(path));
                }
                let data = await this.fileManager.contentsAtURL(candidateURL);
                let js = JavascriptFile.initWithData(data, candidateURL);
                let imports = js.imports();
                let import_;
                for (let i = 0, l = imports.paths.length; i < l; ++i){
                    import_ = imports.paths[i];
                    await visit.call(this, import_.path, import_.sourceURL, import_.sourceLine);
                }
                result.files.push({url: candidateURL});

                for (let i = 0, l = imports.frameworks.length; i < l; ++i){
                    import_ = imports.frameworks[i];
                    let name = import_.name;
                    if (!visited.frameworks.has(name)){
                        visited.frameworks.add(name);
                        candidateURL = null;
                        found = false;
                        let isProject = false;
                        for (let j = 0, k = includeDirectoryURLs.length; j < k && !found; ++j){
                            directoryURL = includeDirectoryURLs[j];
                            candidateURL = directoryURL.appendingPathComponent(name + '.jsframework', true);
                            found = await this.fileManager.itemExistsAtURL(candidateURL);
                            if (!found){
                                candidateURL = directoryURL.appendingPathComponent(name + '.jslink', false);
                                found = await this.fileManager.itemExistsAtURL(candidateURL);
                                if (found){
                                    let link = await this.fileManager.contentsAtURL(candidateURL);
                                    candidateURL = JSURL.initWithString(link.stringByDecodingUTF8(), candidateURL);
                                    candidateURL.hasDirectoryPath = true;
                                    isProject = true;
                                    found = await this.fileManager.itemExistsAtURL(candidateURL);
                                    if (!found){
                                        throw new Error("Bad .jslink at %s.jslink".sprintf(name));
                                    }
                                }
                            }
                            if (!found){
                                candidateURL = this.url.removingLastPathComponent().appendingPathComponent(name, true);
                                found = await this.fileManager.itemExistsAtURL(candidateURL);
                                if (found){
                                    let project = Project.initWithURL(candidateURL);
                                    try{
                                        await project.load();
                                        isProject = true;
                                    }catch (e){
                                        found = false;
                                    }
                                }
                            }
                        }
                        if (!found){
                            var jskitURL = this.fileManager.urlForPath(JSKitRootDirectoryPath);
                            candidateURL = jskitURL.appendingPathComponents(["Frameworks", name], true);
                            found = await this.fileManager.itemExistsAtURL(candidateURL);
                            isProject = true;
                        }
                        if (!found){
                            if (sourceURL){
                                throw new Error('Cannot find framework %s, included from %s:%d'.sprintf(name, sourceURL, sourceLine));
                            }
                            throw new Error('Cannot find "%s"');
                        }
                        if (isProject){
                            result.frameworks.push({name: name, projectURL: candidateURL});
                        }else{
                            result.frameworks.push({name: name, url: candidateURL});
                        }
                    }
                }
                for (let i = 0, l = imports.features.length; i < l; ++i){
                    let feature = imports.features[i];
                    if (!visited.features.has(feature)){
                        result.features.push(feature);
                    }
                }
            }
        };

        for (let i = 0, l = roots.length; i < l; ++i){
            await visit.call(this, roots[i]);
        }

        return result;
    },

    // -----------------------------------------------------------------------
    // MARK: - Resources

    findResourceURLs: async function(blacklist){
        if (!blacklist){
            blacklist = {};
        }
        if (!('names' in blacklist)){
            blacklist.names = new Set();
        }
        if (!('extensions' in blacklist)){
            blacklist.extensions = new Set();
        }
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
    }

});