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
// #import "Project.js"
'use strict';

JSClass("LintCommand", Command, {

    name: "lint",
    help: "Lint a JavaScript file, with understanding of JSKit globals",

    options: {
        file: {kind: "positional", help: "The file to lint"},
    },

    run: async function(){
        let filename = this.arguments.file;
        let fileURL = null;
        let project = null;
        fileURL = this.fileManager.urlForPath(filename, this.workingDirectoryURL);
        project = await Project.projectForFile(fileURL);
        let data = await this.fileManager.contentsAtURL(fileURL);
        let globals = await project.globals([fileURL], true);
        globals.unshift("JSGlobalObject");
        let config = await this.configForFileURL(fileURL);
        if (!config.predef){
            config.predef = [];
        }
        config.predef = config.predef.concat(globals);
        const jshint = require("jshint");
        jshint.JSHINT(data.stringByDecodingUTF8(), config);
        if (jshint.JSHINT.errors.length > 0){
            for (let error of jshint.JSHINT.errors){
                let line = "%s: line %d, col %d, %s (%s)\n".sprintf(filename, error.line, error.character, error.reason, error.code);
                process.stdout.write(line);
            }
            process.stdout.write("\n");
            if (jshint.JSHINT.errors.length === 1){
                process.stdout.write("1 errors\n");
            }else{
                process.stdout.write("%d errors\n".sprintf(jshint.JSHINT.errors.length));
            }
            process.exitCode = 2;
        }
    },

    configForFileURL: async function(fileURL){
        let folderURL = fileURL.removingLastPathComponent();
        let configURL = folderURL.appendingPathComponent(".jshintrc");
        let exists = await this.fileManager.itemExistsAtURL(configURL);
        if (exists){
            let data = await this.fileManager.contentsAtURL(configURL);
            let config = JSON.parse(data.stringByDecodingUTF8());
            return config;
        }
        if (folderURL.pathComponents.length > 1){
            return await this.configForFileURL(folderURL);
        }
        return {};
    },

});
