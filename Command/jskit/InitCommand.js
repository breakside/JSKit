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
// #import "Template.js"
// #import "Printer.js"
'use strict';

JSClass("InitCommand", Command, {

    name: "init",
    help: "Initialize a workspace",

    options: {
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var isEmpty = true;
        var entries = await this.fileManager.contentsOfDirectoryAtURL(workspaceURL);
        for (let i = 0, l = entries.length; i < l && isEmpty; ++i){
            let entry = entries[i];
            if (!entry.name.startsWith(".") && entry.name != 'node_modules' && entry.name != 'package-lock.json' && entry.name != 'package.json' && entry.name.removingFileExtension() != "LICENSE"){
                isEmpty = false;
            }
        }
        if (!isEmpty){
            process.stdout.write("jskit init can only be used in an empty directory\n");
            return;
        }
        var printer = Printer.initWithLabel('init');
        printer.setStatus("Initializing workspace...");
        var workspaceName = workspaceURL.lastPathComponent;
        var templatesURL = this.fileManager.urlForPath(JSKitRootDirectoryPath).appendingPathComponent("Templates", true);

        var workspaceTemplateURL = templatesURL.appendingPathComponent("workspace");
        var workspaceTemplate = Template.initWithURL(workspaceTemplateURL, this.fileManager);
        await workspaceTemplate.addToWorkspace(workspaceURL, workspaceName);

        printer.setStatus("workspace initialized");
        printer.print("");
    },

});