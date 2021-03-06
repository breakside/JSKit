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
'use strict';

JSClass("Template", JSObject, {

    initWithURL: function(url, fileManager){
        this.url = url;
        this.fileManager = fileManager;
    },

    addToWorkspace: async function(workspaceURL, projectName){
        var projectNameFileSafe = projectName.replace(/[^A-Za-z0-9\-_]/g, "");
        var params = {
            PROJECT_NAME: projectName,
            PROJECT_NAME_FILE_SAFE: projectNameFileSafe
        };
        await this._copyContentsOfDirectory(this.url, workspaceURL, params);
    },

    _copyContentsOfDirectory: async function(directoryURL, toDirectoryURL, params){
        var entries = await this.fileManager.contentsOfDirectoryAtURL(directoryURL);
        for (let i = 0, l = entries.length; i < l; ++i){
            let entry = entries[i];
            let toName = entry.name.replacingTemplateParameters(params, '${');
            if (entry.name == ".DS_Store") continue;
            if (entry.itemType == JSFileManager.ItemType.directory){
                let toURL = toDirectoryURL.appendingPathComponent(toName, true);
                await this.fileManager.createDirectoryAtURL(toURL);
                await this._copyContentsOfDirectory(entry.url, toURL, params);
            }else{
                let toURL = toDirectoryURL.appendingPathComponent(toName);
                let data = await this.fileManager.contentsAtURL(entry.url);
                if (isText(data)){
                    let contents = data.stringByDecodingUTF8();
                    let replaced = contents.replacingTemplateParameters(params, '${');
                    data = replaced.utf8();
                }
                await this.fileManager.createFileAtURL(toURL, data);
            }
        }
    }

});

var isText = function(data){
    var head = data.subdataInRange(JSRange(0, Math.min(128, data.length)));
    return head.isEqual(head.stringByDecodingUTF8().utf8());
};