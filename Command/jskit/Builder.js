// #import Foundation
// #import "Project.js"
// #import "Framework.js"
// #import "JavascriptFile.js"
/* global JSClass, JSObject, JSCopy, JSURL, Builder, Project, JavascriptFile, JSArguments, JSDate, JSDateFormatter, JSFileManager, JSMD5Hash, Framework, JSKitRootDirectoryPath, FrameworkBuilder */
'use strict';

JSClass("Builder", JSObject, {

    // -----------------------------------------------------------------------
    // MARK: - Creating a Builder

    initForProject: function(project, argv){
        var subclass = Builder.byBundleType[project.info.JSBundleType];
        if (!subclass){
            return null;
        }
        var args = JSArguments.initWithOptions(subclass.prototype.options);
        argv = [subclass.bundleType].concat(argv);
        args.parse(argv);
        return subclass.initWithProject(project, args);
    },

    initWithProject: function(project, args){
        this.project = project;
        this.arguments = args;
        this.watchlist = [];
        this.commands = [];
        this.builtURLs = {};
        this.fileManager = project.fileManager;
    },

    // -----------------------------------------------------------------------
    // MARK: - Build Environment and Settings

    buildId: null,
    buildLabel: null,
    buildURL: null,
    buildsRootURL: null,
    fileManager: null,
    workingDirectoryURL: null,
    debug: false,

    // -----------------------------------------------------------------------
    // MARK: - Project & Dependencies

    project: null,
    arguments: null,
    builtURLs: null,

    // -----------------------------------------------------------------------
    // MARK: - Status

    printer: null,
    commands: null,

    // -----------------------------------------------------------------------
    // MARK: - File Watching

    watchlist: null,

    // -----------------------------------------------------------------------
    // MARK: - Building

    build: async function(){
    },

    setup: async function(){
        var now = new Date();
        this.buildLabel = "%04d-%02d-%02d-%02d-%02d-%02d".sprintf(
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        );
        this.buildId = JSMD5Hash(this.buildLabel.utf8()).hexStringRepresentation();
        this.commands = [];
        this.watchlist = [];
        await this.project.load();
    },

    finish: async function(){
        if (!this.debug){
            var buildParentURL = this.buildURL.removingLastPathComponent();
            var latestBuildURL = buildParentURL.appendingPathComponent("latest");
            var exists = await this.fileManager.itemExistsAtURL(latestBuildURL);
            if (exists){
                await this.fileManager.removeItemAtURL(latestBuildURL);
            }
            await this.fileManager.createSymbolicLinkAtURL(latestBuildURL, this.buildURL);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Dependencies

    buildFrameworks: async function(imports, env){
        var frameworksByName = {};
        var urls = [];
        var names = [];
        var seen = new Set();
        for (let i = 0, l = imports.length; i < l; ++i){
            let import_ = imports[i];
            seen.add(import_.name);
            urls.push(import_.url || import_.projectURL);
            names.push(import_.name);
        }
        var dependenciesByName = {};
        for (let i = 0; i < urls.length; ++i){
            let url = urls[i];
            let name = names[i];
            let builtURL = url;
            if (url.fileExtension != '.jsframework'){
                builtURL = this.builtURLs[name];
                if (!builtURL){
                    builtURL = await this.buildFramework(url);
                    this.builtURLs[name] = builtURL;
                }
            }
            let framework = Framework.initWithURL(builtURL, this.fileManager);
            await framework.load();
            let dependencies = framework.dependencies(env);
            dependenciesByName[name] = dependencies;
            frameworksByName[name] = framework;
            for (let j = 0, k = dependencies.length; j < k; ++j){
                let name = dependencies[j];
                if (!seen.has(name)){
                    // FIXME: hack to get tests working; need real solution for dependent projects
                    if (this.project.name == "jskitTests" && name == 'jsyaml'){
                        seen.add(name);
                        names.push(name);
                        urls.push(this.fileManager.urlForPath('/Users/oshaw/Documents/JSKit/Command/jskit/jsyaml.jsframework'));
                    }else{
                        seen.add(name);
                        let candidateURL = this.fileManager.urlForPath(JSKitRootDirectoryPath).appendingPathComponents(["Frameworks", name], true);
                        let exists = await this.fileManager.itemExistsAtURL(candidateURL);
                        if (!exists){
                            throw new Error("Cannot find framework %s, (required by %s)".sprintf(name, url.lastPathComponent));
                        }
                        urls.push(candidateURL);
                        names.push(name);
                    }
                }
            }
        }
        var frameworks = [];
        var added = new Set();
        var add = function(name){
            if (added.has(name)){
                return;
            }
            let dependencies = dependenciesByName[name];
            for (let i = 0, l = dependencies.length; i < l; ++i){
                add(dependencies[i]);
            }
            frameworks.push(frameworksByName[name]);
            added.add(name);
        };
        for (let name in frameworksByName){
            add(name);
        }
        return frameworks;
    },

    buildFramework: async function(url){
        var project = Project.initWithURL(url, this.fileManager);
        await project.load();
        var args = {};
        var builder = FrameworkBuilder.initWithProject(project, args);
        builder.debug = this.debug || this.bundleType == 'node' || this.bundleType == 'tests';
        builder.printer = this.printer;
        builder.buildsRootURL = this.buildsRootURL;
        builder.workingDirectoryURL = this.workingDirectoryURL;
        builder.builtURLs = this.builtURLs;
        await builder.build();
        return builder.bundleURL;
    },

    replaceTemplateText: function(text, parameters){
    }

});

var frameworkDependencies = function(framework, env){
    var names = [];

};

Builder.byBundleType = {};
Builder.names = [];

Builder.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.names.push(extensions.bundleType);
    this.byBundleType[extensions.bundleType] = subclass;
    return subclass;
};