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

// #import "Command.js"
// #import "Printer.js"
// #import SecurityKit
'use strict';

JSClass("ZipCommand", Command, {

    name: "zip",
    help: "Create a zip file",

    options: {
        out: {shortcut: "o", help: "The output filename"},
        compress: {shortcut: "c", kind: "flag", help: "Should the files be compressed"},
        files: {kind: "positional", multiple: true, help: "The path(s) to compresss"}
    },

    run: async function(){
        var baseURL = this.workingDirectoryURL;
        var fileManager = this.fileManager;
        var i, l;
        var zip = JSZip.init();
        var url;
        var compress = this.arguments.compress;
        var addURL = async function(url){
            var attributes = await fileManager.attributesOfItemAtURL(url);
            if (attributes.itemType === JSFileManager.ItemType.directory){
                var items = await fileManager.contentsOfDirectoryAtURL(url);
                for (var i = 0, l = items.length; i < l; ++i){
                    await addURL(items[i].url);
                }
            }else if (attributes.itemType === JSFileManager.ItemType.file){
                var data = await fileManager.contentsAtURL(url);
                var relativeUrl = JSURL.initWithString(url.encodedStringRelativeTo(baseURL));
                var components = JSCopy(relativeUrl.pathComponents);
                while (components.length > 0 && components[0] === ".." || components[0] == "/"){
                    components.shift();
                }
                if (components.length > 0){
                    zip.addDataForFilename(data, components.join("/"), attributes, compress);
                }
            }
        };
        for (i = 0, l = this.arguments.files.length; i < l; ++i){
            url = JSURL.initWithString(this.arguments.files[i], baseURL);
            await addURL(url);
        }
        var outURL = JSURL.initWithString(this.arguments.out, baseURL);
        await fileManager.createFileAtURL(outURL, zip.data);
    },

});