// #import "Command.js"
// #import "Project.js"
/* global JSClass, Command, Project, JSURL */
'use strict';

const path = require('path');

JSClass("MakeCommand", Command, {

    name: "make",

    options: {
        debug: {kind: "flag", help: "Build the project in debug mode"},
        watch: {kind: "flag", help: "Automatically rebuild when files change"},
        include: {multiple: true, default: [], help: "Extra include directory, can be specified multiple times."},
        project: {kind: "positional", help: "The project to build"},
        subargs: {kind: "unknown", help: "Additional arguments for specific project types"}
    },

    run: async function(){
        var projectPath = this.arguments.project;
        if (!path.isAbsolute(projectPath)){
            projectPath = path.join(process.cwd(), projectPath);
        }
        var projectURL = JSURL.initWithFilePath(projectPath);
        var project = Project.initWithURL(projectURL);
        await project.load();
        var buildType = project.info.JSBundleType;
        // node
        // npm
        // html
        // tests
        // framework
    }

});