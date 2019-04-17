// #import "Command.js"
// #import "Documentation.js"
// #import "Printer.js"
/* global JSClass, Command, JSKitRootDirectoryPath, Documentation, Printer */
'use strict';

JSClass("DocCommand", Command, {

    name: "doc",
    help: "Create code documentation",

    options: {
        input: {kind: "positional", help: "The root documentation file to start with"}
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var docURL = this.fileManager.urlForPath(this.arguments.input, this.workspaceURL);
        var printer = Printer.initWithLabel('doc');
        printer.print("");
    },

});