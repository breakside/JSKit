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
// #import "TestBuilder.js"
// #import "Printer.js"
'use strict';

JSClass("TestCommand", Command, {

    name: "test",
    help: "Build and execute a test run for the given tests project",

    options: {
        'builds-root':  {default: null, help: "Root folder for builds"},
        project: {kind: "positional", help: "The test project to build and run"},
        testargs: {kind: "unknown", help: "Additional arguments for the test run"},
    },

    run: async function(){
        var projectURL = this.fileManager.urlForPath(this.arguments.project, this.workingDirectoryURL, true);
        var project = Project.initWithURL(projectURL, this.fileManager);
        this.printer = Printer.initWithLabel('make');
        this.printer.setStatus("Loading project...");
        try{
            await project.load();
        }catch (e){
            throw new Error("Could not load project '%s': %s".sprintf(this.arguments.project, e));
        }
        if (project.info.JSBundleType != 'tests'){
            throw new Error("Not a test project");
        }
        var builder = TestBuilder.initWithProject(project, {});
        builder.workingDirectoryURL = this.workingDirectoryURL;
        builder.printer = this.printer;
        if (arguments['builds-root']){
            builder.buildsRootURL = this.fileManager.urlForPath(this.arguments['builds-root'], this.workingDirectoryURL, true);
        }else{
            builder.buildsRootURL = this.workingDirectoryURL.appendingPathComponent('builds', true);
        }
        this.printer.setStatus("Building...");
        this.printer.stream = {write: function(){ }};
        await builder.build();
        this.printer.stream = process.stdout;
        this.printer.setStatus("Done");
        this.printer.print("");

        const { spawn } = require('child_process');
        let exe = this.fileManager.pathForURL(builder.executableURL);
        var tests = spawn(exe, this.arguments.testargs, {stdio: 'inherit'});

        var cmd = this;
        return new Promise(function(resolve, reject){
            tests.on('close', function(code){
                cmd.returnValue = code;
                resolve();
            });
        });
    }

});