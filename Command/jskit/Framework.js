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
'use strict';

JSClass("Framework", JSObject, {

    initWithURL: function(url, fileManager){
        this.url = url;
        this.sourcesURL = url.appendingPathComponent('JS', true);
        this.resourcesURL = url.appendingPathComponent('Resources', true);
        this.fileManager = fileManager;
        this.name = this.url.lastPathComponent.substr(0, this.url.lastPathComponent.length - this.url.fileExtension.length);
    },

    url: null,
    resourcesURL: null,
    sourcesURL: null,

    _isLoaded: false,

    load: async function(){
        if (this._isLoaded){
            return;
        }
        this._isLoaded = true;
        var sourcesURL = this.url.appendingPathComponent('sources.json');
        var sourcesJSON = await this.fileManager.contentsAtURL(sourcesURL);
        this.sources = JSON.parse(sourcesJSON.stringByDecodingUTF8());

        var resourcesURL = this.url.appendingPathComponent('resources.json');
        var exists = await this.fileManager.itemExistsAtURL(resourcesURL);
        if (exists){
            var resourcesJSON = await this.fileManager.contentsAtURL(resourcesURL);
            this.resources = JSON.parse(resourcesJSON.stringByDecodingUTF8());
        }

        await this._loadInfo();
    },

    _loadInfo: async function(){
        var url = this.url.appendingPathComponent("Info.json");
        var exists = await this.fileManager.itemExistsAtURL(url);
        if (exists){
            let contents = await this.fileManager.contentsAtURL(url);
            let json = contents.stringByDecodingUTF8();
            this.info = JSON.parse(json);
            return;
        }
        url = this.url.appendingPathComponent("Info.yaml");
        exists = await this.fileManager.itemExistsAtURL(url);
        if (exists){
            let contents = await this.fileManager.contentsAtURL(url);
            let yaml = contents.stringByDecodingUTF8();
            this.info = jsyaml.safeLoad(yaml);
            return;
        }
        throw new Error("Missing Info.(json|yaml) file");
    },

    info: null,
    sources: null,
    resources: null,

    dependencies: function(envs){
        var names = [];
        if (this.sources.generic.frameworks){
            for (let i = 0, l = this.sources.generic.frameworks.length; i < l; ++i){
                names.push(this.sources.generic.frameworks[i]);
            }
        }
        if (!envs){
            envs = [];
        }else if (typeof(envs) == "string"){
            envs = [envs];
        }
        for (let i = 0, l = envs.length; i < l; ++i){
            let env = envs[i];
            if (env in this.sources){
                if (this.sources[env].frameworks){
                    for (let i = 0, l = this.sources[env].frameworks.length; i < l; ++i){
                        names.push(this.sources[env].frameworks[i]);
                    }
                }
            }
        }
        return names;
    }

});