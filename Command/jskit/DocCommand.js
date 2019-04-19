// #import "Command.js"
// #import "Documentation.js"
// #import "Printer.js"
/* global JSClass, Command, JSKitRootDirectoryPath, Documentation, Printer */
'use strict';

JSClass("DocCommand", Command, {

    name: "doc",
    help: "Create code documentation",

    options: {
        input: {kind: "positional", help: "The root documentation file to start with"},
        output: {kind: "positional", help: "The directory in which to output the generated documentation"},
        // style: {default: null, help: "The stylesheet to use"}
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var rootURL = this.fileManager.urlForPath(this.arguments.input, workspaceURL);
        var printer = Printer.initWithLabel('doc');
        var documentation = Documentation.initWithRootURL(rootURL, this.fileManager);
        documentation.printer = printer;
        documentation.outputDirectoryURL = this.fileManager.urlForPath(this.arguments.output, workspaceURL);

        await documentation.run();
        printer.setStatus("Done");

        printer.print("");
    },

});