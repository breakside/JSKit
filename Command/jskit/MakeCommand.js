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
// #import "Builder.js"
// #import "FrameworkBuilder.js"
// #import "NodeBuilder.js"
// #import "HTMLBuilder.js"
// #import "TestBuilder.js"
// #import "Printer.js"
'use strict';

const fs = require('fs');

JSClass("MakeCommand", Command, {

    // -----------------------------------------------------------------------
    // MARK: - Command Name & Options

    name: "make",

    options: {
        'debug':        {kind: "flag",                  help: "Build the project in debug mode"},
        'watch':        {kind: "flag",                  help: "Automatically rebuild when files change"},
        'no-tag':       {kind: "flag",                  help: "Don't do any git tagging (debug builds never tag)"},
        'include':      {multiple: true, default: [],   help: "Extra include directory, can be specified multiple times."},
        'builds-root':  {default: null,                 help: "Root folder for builds"},
        'project':      {kind: "positional",            help: "The project to build"},
        'bundle-version': {default: null,               help: "The bundle version to use, overriding the project's Info file"},
        'subargs':      {kind: "unknown",               help: "Additional arguments for specific project types"}
    },

    // -----------------------------------------------------------------------
    // MARK: - Running a Make Command

    builder: null,

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
        this.builder = Builder.initForProject(project, this.arguments.subargs);
        if (this.builder === null){
            throw new Error("Unknown project type: %s".sprintf(project.info.JSBundleType));
        }
        this.builder.workingDirectoryURL = this.workingDirectoryURL;
        this.builder.printer = this.printer;
        this.builder.debug = this.arguments.debug;
        this.builder.shouldTag = !this.arguments['no-tag'];
        this.builder.bundleVersion = this.arguments['bundle-version'];
        if (this.arguments['builds-root']){
            this.builder.buildsRootURL = this.fileManager.urlForPath(this.arguments['builds-root'], this.workingDirectoryURL, true);
        }else{
            this.builder.buildsRootURL = this.workingDirectoryURL.appendingPathComponent('builds', true);
        }
        this.printer.setStatus("Starting...");
        await this.builder.build();
        var willWatch = this.arguments.watch && this.builder.watchlist.length > 0;
        if (!willWatch){
            this.printer.setStatus("Done (build: %s/%s)".sprintf(this.builder.buildLabel, this.builder.buildId));
        }
        if (this.builder.commands.length > 0){
            var commands = "$ " + this.builder.commands.join("\n$ ") + "\n";
            this.printer.print(commands, false, willWatch);
        }
        var error = null;
        while (this.arguments.watch && this.builder.watchlist.length > 0){
            if (error !== null){
                this.printer.setStatus("Failed (%s).  Watching for file changes...".sprintf(error.toString()));
                error = null;
            }else{
                this.printer.setStatus("Done (build: %s/%s).  Watching for file changes...".sprintf(this.builder.buildLabel, this.builder.buildId));
            }
            await this.watchForChanges(this.builder.watchlist);
            try{
                project.reload();
                await this.builder.build();
            }catch (e){
                error = e;
            }
        }
        this.printer.print("");
    },

    watchForChanges: async function(watchlist){
        var fileManager = this.fileManager;
        return new Promise(function(resolve, reject){
            var watchers = [];
            var timer = null;
            var handleTimeout = function(){
                for (var i = 0, l = watchers.length; i < l; ++i){
                    watchers[i].close();
                }
                watchers = [];
                resolve();
            };
            var handleChange = function(){
                if (timer !== null){
                    timer.invalidate();
                }
                timer = JSTimer.scheduledTimerWithInterval(1, handleTimeout);
            };
            for (let i = 0, l = watchlist.length; i < l; ++i){
                let url = watchlist[i];
                let path = fileManager.pathForURL(watchlist[i]);
                let watcher = fs.watch(path, {recursive: url.hasDirectoryPath}, handleChange);
                watchers.push(watcher);
            }
        });
    },

    // -----------------------------------------------------------------------
    // MARK: - Status

    printer: null


});