// #import "Foundation/Foundation.js"
// #import "Bundle.js"
/* global JSClass, JSObject, JSURL, Builder, JSArguments, JSDate, JSDateFormatter, JSFileManager, JSMD5Hash */
'use strict';

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