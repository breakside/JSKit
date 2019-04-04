// #import Foundation
// #import jsyaml
// #import "JavascriptFile.js"
/* global JSClass, JSObject, JSFileManager, jsyaml, JSReadOnlyProperty, JavascriptFile, JSURL */
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
        var txt = await this.fileManager.contentsAtURL(url);
        return txt.stringByDecodingUTF8();
    },

    // -----------------------------------------------------------------------
    // MARK: - Entry Point

    entryPoint: JSReadOnlyProperty(),

    getEntryPoint: function(){
        var entryPoint = this.info.EntryPoint || 'main.js:main';
        var entryParts = entryPoint.split(':');
        return {
            path: entryParts[0],
            fn: entryParts[1]
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
            frameworks: []
        };
        var visited = {
            paths: new Set(),
            frameworks: new Set()
        };
        let prefix = "%s/".sprintf(this.url.lastPathComponent);

        var visit = async function(path, sourceURL, sourceLine){
            if (this.info.JSBundleType == 'framework' && path.startsWith(prefix)){
                path = path.substr(prefix.length);
            }
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
                                    candidateURL = JSURL.initWithString(link, candidateURL);
                                    isProject = true;
                                    found = await this.fileManager.itemExistsAtURL(candidateURL);
                                    if (!found){
                                        throw new Error("Bad .jslink at %s.jslink".sprintf(name));
                                    }
                                }
                            }
                            // TODO: consider project references (reference format TBD, but should
                            // push a framework result of {name: name, projectURL: urlToReferencedProject})
                        }
                        if (!found){
                            var jskitURL = this.fileManager.urlForPath(JSKitRootDirectoryPath);
                            candidateURL = jskitURL.appendingPathComponents(["Frameworks", name], true);
                            found = await this.fileManager.itemExistsAtURL(candidateURL);
                            isProject = true;
                        }
                        if (!found){
                            if (sourceURL){
                                throw new Error('Cannot find framework %s, included from %s:%d'.sprintf(path, sourceURL, sourceLine));
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
        if (!('directories' in blacklist)){
            blacklist.directories = new Set();
        }
        if (!('extensions' in blacklist)){
            blacklist.extensions = new Set();
        }
        if (!('urls' in blacklist)){
            blacklist.urls = new Set();
        }
        var stack = [this.url];
        var urls = [];
        while (stack.length > 0){
            let url = stack.shift();
            let entries = await this.fileManager.contentsOfDirectoryAtURL(url);
            for (let i = 0, l = entries.length; i < l; ++i){
                let entry = entries[i];
                if (entry.name.startsWith(".")) continue;
                if (entry.itemType == JSFileManager.ItemType.directory && entry.name.fileExtension != '.lproj' && entry.name.fileExtension != '.imageset'){
                    if (!blacklist.directories.has(entry.name) && entry.name.fileExtension != '.jsframework'){
                        stack.push(entry.url);
                    }
                }else{
                    if (!blacklist.names.has(entry.name) && !blacklist.extensions.has(entry.name.fileExtension) && !blacklist.urls.has(entry.url.encodedString)){
                        urls.push(entry.url);
                    }
                }
            }
        }
        return urls;
    }

});