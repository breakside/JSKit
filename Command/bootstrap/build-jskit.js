/* global global, require, __filename, MakeCommand */
/* jshint esversion: 8 */
'use strict';

/// A script that includes what's needed from jskit to make the first build of jskit
///
/// Gets around the bootstrapping problem for developers, who otherwise would need
/// jskit from somewhere else in order to build their local development jskit.
///
/// Recursively scans included JS files to require() all required files in the
/// appropriate order.
///
/// NOTE: Does not parse jskit's Info.yaml to see what framework environment
/// extensions need to be included.  Therefore, any Framework+Node.js
/// specific framework extensions need to be added by hand.  This list should
/// change infrequently enough to not be a pain.

global.JSGlobalObject = global;

var fs = require('fs');
var path = require('path');

var rootPath = path.dirname(path.dirname(path.dirname(__filename)));
var includePaths = [
    path.join(rootPath, "Command", "jskit"),
    path.join(rootPath, "Command", "jskit", "Classes"),
    path.join(rootPath, "Command", "jskit", "Frameworks"),
    path.join(rootPath, "Frameworks")
];
var included = new Set();

function path_for_include(include){
    var ospath = path.join.apply(path, include.split("/"));
    var candidate;
    for (var i = 0, l = includePaths.length; i < l; ++i){
        candidate = path.join(includePaths[i], ospath);
        if (fs.existsSync(candidate)){
            return candidate;
        }
    }
    throw new Error("Could not find include: " + include);
}

function file_dependencies(path){
    var js = fs.readFileSync(path, "utf8");
    var lines = js.split("\n");
    var dependencies = [];
    var line;
    for (var i = 0, l = lines.length; i < l; ++i){
        line = lines[i].trim();
        if (line.startsWith('// #import "')){
            dependencies.push(line.substr(12, line.length - 13));
        }
    }
    return dependencies;
}

function require_includes(includes){
    var path;
    var dependencies;
    for (var i = 0, l = includes.length; i < l; ++i){
        path = path_for_include(includes[i]);
        if (!included.has(path)){
            dependencies = file_dependencies(path);
            included.add(path);
            require_includes(dependencies);
            require(path);
        }
    }
}

require_includes([
    "main.js",
    "Foundation/Foundation+Node.js"
]);

var command = MakeCommand.init();
command.arguments = {
    project: "Command/jskit",
    debug: true
};
command.run();