// #import "Command.js"
// #import "Project.js"
// #import "Builder.js"
/* global JSClass, JSObject, JSData, Command, Project, JSURL, Builder, JSArguments, JSDate, JSDateFormatter, JSFileManager, JSMD5Hash */
'use strict';

const path = require('path');
const fs = require('fs');

JSClass("MakeCommand", Command, {

    name: "make",
    builder: null,
    buildsPath: null,

    options: {
        debug: {kind: "flag", help: "Build the project in debug mode"},
        watch: {kind: "flag", help: "Automatically rebuild when files change"},
        include: {multiple: true, default: [], help: "Extra include directory, can be specified multiple times."},
        project: {kind: "positional", help: "The project to build"},
        subargs: {kind: "unknown", help: "Additional arguments for specific project types"}
    },

    init: function(){
        this.statusMessage = JSData.initWithLength(0);
    },

    run: async function(){
        var projectPath = this.arguments.project;
        if (!path.isAbsolute(projectPath)){
            projectPath = path.join(process.cwd(), projectPath);
        }
        var projectURL = JSURL.initWithFilePath(projectPath);
        var project = Project.initWithURL(projectURL);
        this.setStatus("Loading project...");
        var success = await project.load();
        if (!success){
            throw new Error("Could not load project: %s".sprintf(this.arguments.project));
        }
        this.buildsURL = JSURL.initWithFilePath(path.join(process.cwd(), "builds"));
        this.builder = Builder.initForProject(project, this.arguments.subargs);
        if (this.builder === null){
            throw new Error("Unknown project type: %s".sprintf(project.info.JSBundleType));
        }
        this.builder.makeCommand = this;
        this.setStatus("Starting build...");
        await this.builder.build();
        while (this.arguments.watch && this.builder.watchlist.length > 0){
            this.setStatus("Complete.  Will rebuild if files change...");
            await this.watchForChanges(this.builder.watchlist);
            await this.builder.build();
        }
    },

    watchForChanges: async function(watchlist){
        return new Promise(function(resolve, reject){
            var watchers = [];
            var handleChange = function(){
                for (var i = 0, l = watchers.length; i < l; ++i){
                    watchers[i].close();
                }
                watchers = [];
                resolve();
            };
            var watcher;
            for (var i = 0, l = watchlist.length; i < l; ++i){
                watcher = fs.watch(watchlist[i], handleChange);
                watchers.push(watcher);
            }
        });
    },

    // -----------------------------------------------------------------------
    // MARK: - Status messages

    statusMessage: null,

    setStatus: function(message){
        if (this.statusMessage !== null){
            this._erase(this.statusMessage.length);
        }
        var prefix = "[build %s] ".sprintf(this.buildLabel);
        var line = prefix + message;
        this.statusMessage = line.encode('utf-8');
        this._printRawData(this.statusMessage);
    },

    print: function(message, reprintStatus=false, overwriteStatus=false){
        if (overwriteStatus){
            reprintStatus = true;
        }
        if (!overwriteStatus && this.statusMessage.length > 0){
            this._printRawData("\n".utf8(), false);
        }
        if (overwriteStatus){
            this._erase(this.statusMessage.length);
        }
        this._printRawData(message.utf8());
        if (reprintStatus){
            if (message.length > 0 && !message.endsWith("\n")){
                this._printRawData("\n".utf8(), false);
            }
            this._printRawData(this.statusMessage);
        }else{
            this.statusMessage = JSData.initWithLength(0);
        }
    },

    _printRawData: function(data, flush=false){
        process.stdout.write(data);
        if (flush){
            process.stdout.flush();
        }
    },

    _erase: function(count, flush=false){
        if (process.stdout.isTTY){
            this._printRawData("".leftPaddedString("\x08", count).utf8(), flush);
            this._printRawData("\x1B[0K".utf8());
        }else if (count > 0){
            this._printRawData("\n".utf8());
        }
    }

});

JSClass("Builder", JSObject, {

    initForProject: function(project, argv){
        var subclass = Builder.byBundleType[project.info.JSBundleType];
        if (!subclass){
            return null;
        }
        var args = JSArguments.initWithOptions(subclass.options);
        argv = [subclass.bundleType].concat(argv);
        args.parse(argv);
        return subclass.initWithProject(project, arguments);
    },

    initWithProject: function(project, args){
        this.project = project;
        this.arguments = args;
        this.watchlist = [];
        this.dependencies = [];
        this.includedFrameworks = new Set();
        this.fileManager = JSFileManager.shared;
    },

    makeCommand: null,

    project: null,
    dependencies: null,
    arguments: null,

    buildId: null,
    buildLabel: null,
    buildURL: null,
    watchlist: null,
    fileManager: null,

    build: async function(){
        await this.setup();
    },

    setup: async function(){
        this.setupBuildIdentity();
        await this.setupBuildFolder();
        await this.setupBundleDependencies(this.project);
    },

    setupBuildIdentity: function(){
        var now = JSDate.initWithTimeIntervalSinceNow();
        var formatter = JSDateFormatter.init();
        formatter.dateFormat = "YYYY-MM-dd-HH-mm-ss";
        this.buildLabel = formatter.stringFromDate(now);
        this.buildId = JSMD5Hash(this.buildLabel.utf8()).hexStringRepresentation();
    },

    setupBuildFolder: async function(){
        var buildComponents = [this.makeCommand.buildsPath, this.project.info.JSBundleIdentifier];
        if (this.makeCommand.arguments.debug){
            buildComponents.push("debug");
        }else{
            buildComponents.push(this.buildLabel);
        }
        this.buildURL = this.makeCommand.buildsURL.appendingPathComponents(buildComponents);
        await this.fileManager.createFolderAtURL(this.buildURL);
    },

    includedFrameworks: null,

    setupBundleDependencies: async function(bundle){
        var frameworks = bundle.info.JSFrameworks;
        if (frameworks){
            for (var i = 0, l = frameworks.length; i < l; ++i){
                await this.setupFrameworkDependency(frameworks[i]);
            }
        }
    },

    setupFrameworkDependency: async function(frameworkName){
        if (this.includedFrameworks.has(frameworkName)){
            return;
        }
        // TODO: locate framework, load bundle, await setupBundleDependencies
    }

});

Builder.byBundleType = {};

Builder.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.names.push(extensions.bundleType);
    this.byBundleType[extensions.bundleType] = subclass;
    return subclass;
};

JSClass("HTMLBuilder", Builder, {

    bundleType: "html",

    options: {
        'http-port': {valueType: "integer", default: 8080, help: "The port on which the static http server will be configured"},
        'docker-owner': {default: null, help: "The docker repo prefix to use when building a docker image"}
    },

    needsDockerBuild: false,

});

JSClass("NodeBuilder", Builder, {

    bundleType: "node",

    options: {
    },

    needsDockerBuild: false,

});

JSClass("TestsBuilder", Builder, {

    bundleType: "tests",

    options: {
    },

});

JSClass("FrameworkBuilder", Builder, {

    bundleType: "framework",

    options: {
    },

});