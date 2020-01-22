// jshint node: true, esversion: 8
/* global MakeCommand */
'use strict';

/// A script that includes what's needed from jskit to make the first build of jskit
///
/// Gets around the bootstrapping problem for developers, who otherwise would need
/// jskit from somewhere else in order to build their local development jskit.
///
/// Recursively scans included JS files to require() all required files in the
/// appropriate order.

global.JSGlobalObject = global;

var fs = require('fs');
var path = require('path');

function recursive_include_paths(dirpath){
    var include_subfolders = function(dirpath){
        paths.push(dirpath);
        var entries = fs.readdirSync(dirpath, {withFileTypes: true});
        var entry;
        for (var i = 0, l = entries.length; i < l; ++i){
            entry = entries[i];
            if (entry.name.startsWith(".")){
                continue;
            }
            if (entry.name.endsWith(".jsframework") || entry.name.endsWith(".lproj") || entry.name.endsWith(".imageset")){
                continue;
            }
            if (entry.isDirectory()){
                include_subfolders(path.join(dirpath, entry.name));
            }
        }
    };
    var paths = [];
    include_subfolders(dirpath);
    return paths;
}

function path_for_include(include, includeDirectories){
    var ospath = path.join.apply(path, include.split("/"));
    var candidate;
    for (var i = 0, l = includeDirectories.length; i < l; ++i){
        candidate = path.join(includeDirectories[i], ospath);
        if (fs.existsSync(candidate)){
            return candidate;
        }
    }
    throw new Error("Could not find include: " + include);
}

function path_for_framework(framework, includeDirectories){
    var name = framework + '.jsframework';
    var candidate;
    for (var i = 0, l = includeDirectories.length; i < l; ++i){
        candidate = path.join(includeDirectories[i], name);
        if (fs.existsSync(candidate)){
            return candidate;
        }
    }
    candidate = path.join(rootDirectory, "Frameworks", framework);
    if (fs.existsSync(candidate)){
        return candidate;
    }
    throw new Error("Could not find framework: " + framework);
}

function file_dependencies(path){
    var js = fs.readFileSync(path, "utf8");
    var lines = js.split("\n");
    var dependencies = {
        paths: [],
        frameworks: []
    };
    var line;
    for (var i = 0, l = lines.length; i < l; ++i){
        line = lines[i].trim();
        if (line.startsWith('// #import ')){
            let arg = line.substr(11).trim();
            if (arg.startsWith('"') && arg.endsWith('"')){
                dependencies.paths.push(arg.substr(1, arg.length - 2));
            }else{
                dependencies.frameworks.push(arg);
            }
        }
    }
    return dependencies;
}

var visitedFrameworks = new Set();
var visitedPaths = new Set();

function require_includes(includes, includeDirectories){
    var path;
    var dependencies;
    for (var i = 0, l = includes.length; i < l; ++i){
        path = path_for_include(includes[i], includeDirectories);
        if (!visitedPaths.has(path)){
            dependencies = file_dependencies(path);
            visitedPaths.add(path);
            require_frameworks(dependencies.frameworks, includeDirectories);
            require_includes(dependencies.paths, includeDirectories);
            require(path);
        }
    }
}

function require_frameworks(frameworks, includeDirectories){
    for (let i = 0, l = frameworks.length; i < l; ++i){
        let framework = frameworks[i];
        require_framework(framework, includeDirectories);
    }
}

function require_framework(framework, includeDirectories){
    if (visitedFrameworks.has(framework)){
        return;
    }
    visitedFrameworks.add(framework);
    var directory = path_for_framework(framework, includeDirectories);
    if (path.extname(path.basename(directory)) == '.jsframework'){
        let sources = JSON.parse(fs.readFileSync(path.join(directory, 'sources.json'), 'utf-8'));
        for (let i = 0, l = sources.generic.files.length; i < l; ++i){
            let jspath = path.join(directory, 'JS', sources.generic.files[i]);
            require(jspath);
        }
        if (sources.node){
            for (let i = 0, l = sources.node.files.length; i < l; ++i){
                let jspath = path.join(directory, 'JS', sources.node.files[i]);
                require(jspath);
            }
        }
    }else{
        var frameworkIncludeDirectories = recursive_include_paths(directory);
        // Frameworks still have a lot of imports that include the framework name itself,
        // so allow those to work by adding the parent directory as an include path
        frameworkIncludeDirectories.push(path.join(rootDirectory, "Frameworks"));
        var roots = [framework + '.js'];
        // Assume node extensions are +Node, which should be true for any internal
        // frameworks, which are the only kind we rely on
        var nodeExtensions = framework + '+Node.js';
        if (fs.existsSync(path.join(directory, nodeExtensions))){
            roots.push(nodeExtensions);
        }
        require_includes(roots, frameworkIncludeDirectories);
    }
}

var rootDirectory = path.dirname(path.dirname(__filename));
var jskitIncludeDirectories = recursive_include_paths(path.join(rootDirectory, "Command", "jskit"));

require_includes(["main.js"], jskitIncludeDirectories);

global.JSKitRootDirectoryPath = rootDirectory;

var command = MakeCommand.initInWorkingDirectory(rootDirectory);
command.arguments = {
    project: "Command/jskit",
    debug: true,
    subargs: []
};
command.run();