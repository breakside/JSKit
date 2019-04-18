// #import "Command.js"
// #import "Project.js"
// #import "Builder.js"
// #import "FrameworkBuilder.js"
// #import "NodeBuilder.js"
// #import "HtmlBuilder.js"
// #import "TestBuilder.js"
// #import "Printer.js"
/* global JSClass, JSObject, Command, MakeCommand, Project, Builder, Printer */
'use strict';

const fs = require('fs');

JSClass("MakeCommand", Command, {

    // -----------------------------------------------------------------------
    // MARK: - Command Name & Options

    name: "make",

    options: {
        'debug':        {kind: "flag",                  help: "Build the project in debug mode"},
        'watch':        {kind: "flag",                  help: "Automatically rebuild when files change"},
        'include':      {multiple: true, default: [],   help: "Extra include directory, can be specified multiple times."},
        'builds-root':  {default: null,                 help: "Root folder for builds"},
        'project':      {kind: "positional",            help: "The project to build"},
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
        if (this.arguments['builds-root']){
            this.builder.buildsRootURL = this.fileManager.urlForPath(this.arguments['builds-root'], this.workingDirectoryURL, true);
        }else{
            this.builder.buildsRootURL = this.workingDirectoryURL.appendingPathComponent('builds', true);
        }
        this.printer.setStatus("Starting...");
        await this.builder.build();
        var willWatch = this.arguments.watch && this.builder.watchlist.length > 0;
        if (!willWatch){
            this.printer.setStatus("Done (build label: %s)".sprintf(this.builder.buildLabel));
        }
        if (this.builder.commands.length > 0){
            var commands = "$ " + this.builder.commands.join("\n$ ") + "\n";
            this.printer.print(commands, false, willWatch);
        }
        while (this.arguments.watch && this.builder.watchlist.length > 0){
            this.printer.setStatus("Done (build label: %s).  Watching for file changes...".sprintf(this.builder.buildLabel));
            await this.watchForChanges(this.builder.watchlist);
            await this.builder.build();
        }
        this.printer.print("");
    },

    watchForChanges: async function(watchlist){
        var fileManager = this.fileManager;
        return new Promise(function(resolve, reject){
            var watchers = [];
            var handleChange = function(){
                for (var i = 0, l = watchers.length; i < l; ++i){
                    watchers[i].close();
                }
                watchers = [];
                resolve();
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