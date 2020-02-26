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
// #import "Documentation.js"
// #import "Printer.js"
'use strict';

JSClass("DocCommand", Command, {

    name: "doc",
    help: "Create code documentation",

    options: {
        input: {kind: "positional", help: "The root documentation file to start with"},
        output: {kind: "positional", help: "The directory in which to output the generated documentation"},
        sublime: {kind: "flag", help: "Generate Sublime Text completions"}
        // style: {default: null, help: "The stylesheet to use"}
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var rootURL = this.fileManager.urlForPath(this.arguments.input, workspaceURL);
        var printer = Printer.initWithLabel('doc');
        var documentation = Documentation.initWithRootURL(rootURL, this.fileManager);
        documentation.printer = printer;
        documentation.outputDirectoryURL = this.fileManager.urlForPath(this.arguments.output, workspaceURL);

        if (this.arguments.sublime){
            await documentation.sublime();
        }else{
            await documentation.run();
        }
        printer.setStatus("Done");

        printer.print("");
    },

});