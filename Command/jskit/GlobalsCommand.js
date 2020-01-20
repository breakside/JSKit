// #import "Command.js"
// #import "JavascriptFile.js"
/* global JSClass, Command, JavascriptFile */
'use strict';

JSClass("GlobalsCommand", Command, {

    name: "globals",
    help: "Find all global varaiables defined in the given file and its imports",

    options: {
        file: {kind: "positional", help: "The file to parse"},
        delimiter: {default: "\n"}
    },

    run: async function(){
        var fileURL = this.fileManager.urlForPath(this.arguments.file, this.workingDirectoryURL);
        var project = await Project.projectForFile(fileURL);
        var includeDirectories = await project.findIncludeDirectoryURLs();
        var globals = await project.globals([fileURL], includeDirectories);
        process.stdout.write(globals.join(this.arguments.delimiter));
    },

});