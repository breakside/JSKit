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

// #import Foundation
// #import "Project.js"
// #import "Framework.js"
// #import "JavascriptFile.js"
/* global FrameworkBuilder */
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
    bundleVersion: null,

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
        if (this.buildLabel === null){
            this.buildLabel = "%04d-%02d-%02d-%02d-%02d-%02d".sprintf(
                now.getFullYear(),
                now.getMonth() + 1,
                now.getDate(),
                now.getHours(),
                now.getMinutes(),
                now.getSeconds()
            );
        }
        this.buildId = JSSHA1Hash(this.buildLabel.utf8()).hexStringRepresentation();
        this.commands = [];
        this.watchlist = [];
        await this.project.load();
        var gitRevision = await this.getGitRevision();
        if (gitRevision !== null){
            this.project.info.GitRevision = gitRevision;
        }
        if (this.bundleVersion !== null){
            this.project.info.JSBundleVersion = this.bundleVersion;
        }
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
            if (this.shouldTag && this.parentBuild === null){
                await this.gitTag("v" + this.project.info.JSBundleVersion);
            }
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

            // If the import doen't point to .jsframework, then it's a project
            // that needs to be built.
            //
            // Because dependent builds are always framework builds, and
            // because framework builds don't build their dependencies,
            // and because we're careful to have unique items in the imports
            // list, we will only ever build each dependency once.
            if (import_.url.fileExtension != '.jsframework'){
                let builder = await this.buildFramework(import_.url);
                url = builder.bundleURL;
                // Add build dependencies
                let dependencies = builder.dependencies(env);
                for (let j = 0, k = dependencies.length; j < k; ++j){
                    let dependency = dependencies[j];
                    if (!seen.has(dependency.name)){
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
                    // dependencies on other pre-built frameworks, which
                    // are other .jsframework bundles or JSKit frameworks
                    // 
                    // If we built the framework, then we already added its
                    // dependencies based on its build reuslts and won't get here.
                    let includeDirectoryURLs = this.project.includeDirectoryURLs;
                    let url = null;
                    for (let i = 0, l = includeDirectoryURLs.length; i < l && url === null; ++i){
                        let directoryURL = includeDirectoryURLs[i];
                        let candidateURL = directoryURL.appendingPathComponent(name + '.jsframework', true);
                        let found = await this.fileManager.itemExistsAtURL(candidateURL);
                        if (found){
                            url = candidateURL;
                        }
                    }
                    if (url === null){
                        url = this.fileManager.urlForPath(JSKitRootDirectoryPath).appendingPathComponents(["Frameworks", name], true);
                        let found = await this.fileManager.itemExistsAtURL(url);
                        if (!found){
                            throw new Error("Cannot find framework %s, (required by %s)".sprintf(name, url.lastPathComponent));
                        }
                    }
                    imports.push({
                        name: name,
                        url: url
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
        builder.debug = this.debug || this.bundleType == 'node' || this.bundleType == 'tests' || this.bundleType == 'api';
        builder.printer = this.printer;
        builder.buildsRootURL = this.buildsRootURL;
        builder.workingDirectoryURL = this.workingDirectoryURL;
        builder.parentBuild = this;
        await builder.build();
        return builder;
    },

    replaceTemplateText: function(text, parameters){
    },

    // -----------------------------------------------------------------------
    // MARK: - Info

    bundleInfo: async function(){
        var infoURL = this.bundleURL.appendingPathComponent("Info.json");
        var json = JSON.stringify(this.project.info, null, 2);
        await this.fileManager.createFileAtURL(infoURL, json.utf8());
    },

    // -----------------------------------------------------------------------
    // MARK: - Git

    shouldTag: true,

    gitTag: async function(tag){
        const { spawn } = require('child_process');
        var args = ["tag", tag];
        var cwd = this.fileManager.pathForURL(this.project.url);
        try{
            var git = spawn("git", args, {cwd: cwd});
            var builder = this;
            return new Promise(function(resolve, reject){
                git.on('close', function(code){
                    resolve();
                });
                git.on('error',function(){
                    resolve();
                });
            });
        }catch (e){
        }
    },

    getGitRevision: async function(){
        const { spawn } = require('child_process');
        var args = ["rev-parse", "HEAD"];
        var cwd = this.fileManager.pathForURL(this.project.url);
        try{
            var git = spawn("git", args, {cwd: cwd});
            var rev = "";
            git.stdout.on('data', function(data){
                if (data){
                    rev += data.stringByDecodingUTF8();
                }
            });
            var builder = this;
            return new Promise(function(resolve, reject){
                git.on('close', function(code){
                    resolve(rev.trim());
                });
                git.on('error',function(){
                    resolve(null);
                });
            });
        }catch (e){
            return null;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Typescript

    frameworkTypescript: null,

    includeFrameworkTypescript: function(name, url, paths){
        if (!paths || paths.length === 0){
            return;
        }
        if (this.frameworkTypescript === null){
            this.frameworkTypescript = {};
        }
        let entry = this.frameworkTypescript[name];
        if (!entry){
            entry = this.frameworkTypescript[name] = {
                name: name,
                url: url,
                paths: []
            };
        }
        entry.paths = entry.paths.concat(paths);
    },

    compileTypescript: async function(paths, sourcesRootURL, outputRootURL, esversion = null, env = null){
        let baseName = "%s+TypeScript".sprintf(this.project.name);
        if (env){
            baseName += "+" + env;
        }
        let indexName = baseName + ".ts";
        let indexURL = sourcesRootURL.appendingPathComponent(indexName);
        let indexPath = this.fileManager.pathForURL(indexURL);
        let indexText = "";
        for (let path of paths){
            indexText += 'import "./%s";\n'.sprintf(path.removingFileExtension());
        }
        if (this.frameworkTypescript !== null){
            for (let name in this.frameworkTypescript){
                let entry = this.frameworkTypescript[name];
                for (let path of entry.paths){
                    let url = JSURL.initWithString(path, entry.url);
                    let relativePath = url.encodedStringRelativeTo(indexURL);
                    indexText += 'import "%s";\n'.sprintf(relativePath.removingFileExtension());
                }
            }
        }
        await this.fileManager.createFileAtURL(indexURL, indexText.utf8());

        // Check with `tsc`
        let configURL = await this.findTSConfigURL();
        let buildConfigURL = this.buildURL.appendingPathComponent("tsconfig.json");
        let config = await this.adjustedTSConfig(configURL, buildConfigURL);
        config.include = [indexPath];
        await this.fileManager.createFileAtURL(buildConfigURL, JSON.stringify(config, null, 2).utf8());
        let buildConfigPath = this.fileManager.pathForURL(buildConfigURL);
        const { spawn } = require('child_process');
        let args = [
            "tsc",
            "--noEmit",
            "--project",
            buildConfigPath
        ];
        let cwd = this.fileManager.pathForURL(sourcesRootURL);
        let tsc = spawn("npx", args, {cwd: cwd});
        let err = "";
        tsc.stderr.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });
        tsc.stdout.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });
        await new Promise(function(resolve, reject){
            tsc.on('close', function(code){
                if (code !== 0){
                    reject(new Error("Failed to check typescript: " + err));
                    return;
                }
                resolve();
            });
            tsc.on('error',function(){
                reject(new Error("Failed to check typescript because `typescript` is not installed: npm install -D typescript"));
            });
        });

        // Bundle with `esbuild`
        let outputName = baseName + ".js";
        let outputURL = outputRootURL.appendingPathComponent(outputName);
        let outputPath = this.fileManager.pathForURL(outputURL);
        let target = "es2022";
        if (esversion !== null){
            if (esversion < 13){
                throw new Error("TypeScript requires esversion >= 13");
            }
            target = "es%04d".sprintf(2009 + esversion);
        }
        args = [
            "esbuild",
            "--bundle",
            "--outfile=" + outputPath,
            "--sourcemap",
            "--sources-content=false",
            "--target=" + target,
            "--tsconfig=" + buildConfigPath,
            indexPath
        ];
        if (!this.debug){
            args.push("--minify-whitespace");
            args.push("--line-limit=4000");
        }
        let esbuild = spawn("npx", args, {cwd: cwd});
        err = "";
        esbuild.stderr.on('data', function(data){
            if (data){
                err += data.stringByDecodingUTF8();
            }
        });
        await new Promise(function(resolve, reject){
            esbuild.on('close', function(code){
                if (code !== 0){
                    reject(new Error("Failed to bundle typescript: " + err));
                    return;
                }
                resolve();
            });
            esbuild.on('error',function(){
                reject(new Error("Failed to bundle typescript because `esbuild` is not installed: npm install -D esbuild"));
            });
        });
        return outputURL;
    },

    findTSConfigURL: async function(){
        let url = this.project.url;
        let workspaceURL = this.workingDirectoryURL;
        while (url.encodedString.startsWith(workspaceURL.encodedString)){
            let configURL = url.appendingPathComponent("tsconfig.json");
            let exists = await this.fileManager.itemExistsAtURL(configURL);
            if (exists){
                return configURL;
            }
            url = url.removingLastPathComponent();
        }
        return null;
    },

    adjustedTSConfig: async function(configURL, buildConfigURL){
        let config = {};
        if (configURL !== null){
            let data = await this.fileManager.contentsAtURL(configURL);
            config = JSON.parse(data.stringByDecodingUTF8());
        }
        if (config.compilerOptions){
            let frameworkTypescript = this.frameworkTypescript || {};
            if (config.compilerOptions.paths){
                for (let path in config.compilerOptions.paths){
                    let entry = frameworkTypescript[path];
                    if (entry){
                        let replacement = entry.url.appendingPathComponent(entry.name).encodedStringRelativeTo(buildConfigURL);
                        if (replacement[0] != "."){
                            replacement = "./" + replacement;
                        }
                        config.compilerOptions.paths[path] = [replacement];
                    }else{
                        if (path.endsWith("/*")){
                            entry = frameworkTypescript[path.substr(0, path.length - 2)];
                        }
                        if (entry){
                            let replacement = entry.url.appendingPathComponent("*").encodedStringRelativeTo(buildConfigURL);
                            if (replacement[0] != "."){
                                replacement = "./" + replacement;
                            }
                            config.compilerOptions.paths[path] = [replacement];
                        }else{
                            let paths = config.compilerOptions.paths[path];
                            for (let i = 0, l = paths.length; i < l; ++i){
                                let replacement = paths[i];
                                replacement = JSURL.initWithString(replacement, configURL).encodedStringRelativeTo(buildConfigURL);
                                if (replacement[0] != "."){
                                    replacement = "./" + replacement;
                                }
                                paths[i] = replacement;
                            }
                        }
                    }
                }
            }
            if (config.compilerOptions.typeRoots){
                for (let i = 0, l = config.compilerOptions.typeRoots.length; i < l; ++i){
                    let typeRoot = config.compilerOptions.typeRoots[i];
                    typeRoot = JSURL.initWithString(typeRoot, configURL).encodedStringRelativeTo(buildConfigURL);
                    config.compilerOptions.typeRoots[i] = typeRoot;
                }
            }
        }
        return config;
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