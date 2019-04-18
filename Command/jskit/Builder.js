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
    parentBuild: null,

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
        var dependenciesByName = {};
        var seen = new Set();

        // Loop through the imports
        // - build dependencies as necessary
        // - add dependencies of dependencies as necessary
        imports = JSCopy(imports);
        for (let i = 0, l = imports.length; i < l; ++i){
            seen.add(imports[i].name);
        }

        for (let i = 0; i < imports.length; ++i){
            let import_ = imports[i];
            let url = import_.url;
            let name = import_.name;

            // If the import points to a projectURL, it needs to be built.
            //
            // Because dependent builds are always framework builds, and
            // because framework builds don't build their dependencies,
            // and because we're careful to have unique items in the imports
            // list, we will only ever build each dependency once.
            if (import_.projectURL){
                this.printer.print("\nBuilding %s\n".sprintf(import_.name));
                let builder = await this.buildFramework(import_.projectURL);
                url = builder.bundleURL;
                // Add build dependencies
                let dependencies = builder.dependencies(env);
                for (let j = 0, k = dependencies.length; j < k; ++j){
                    let dependency = dependencies[j];
                    if (!seen.has(dependency.name)){
                        this.printer.print("\nAdding build dependency %s\n".sprintf(dependency.name));
                        seen.add(dependency.name);
                        imports.push(dependency);
                    }
                }
            }

            // Load the built framework add add any of its dependencies that
            // we haven't seen yet
            let framework = Framework.initWithURL(url, this.fileManager);
            await framework.load();
            let dependencies = framework.dependencies(env);
            dependenciesByName[name] = dependencies;
            frameworksByName[name] = framework;
            for (let j = 0, k = dependencies.length; j < k; ++j){
                let name = dependencies[j];
                if (!seen.has(name)){
                    seen.add(name);
                    // If the framework was pre-built, then it can only have
                    // dependencies on standard frameworks, so that's the only
                    // place we'll look.
                    //
                    // If we built the framework, then we already added its
                    // dependencies based on its build reuslts and won't get here.
                    let candidateURL = this.fileManager.urlForPath(JSKitRootDirectoryPath).appendingPathComponents(["Frameworks", name], true);
                    let exists = await this.fileManager.itemExistsAtURL(candidateURL);
                    if (!exists){
                        throw new Error("Cannot find framework %s, (required by %s)".sprintf(name, url.lastPathComponent));
                    }
                    this.printer.print("\nAdding dependency %s\n".sprintf(name));
                    imports.push({
                        name: name,
                        url: candidateURL
                    });
                }
            }
        }

        // After everything is built, sort the frameworks in dependency order
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

        // Return the list of frameworks sorted in dependency order, allowing
        // the caller to loop and include everything in the correct order.
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
        builder.parentBuild = this;
        await builder.build();
        return builder;
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