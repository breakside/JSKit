// #import "Command.js"
// #import "Documentation.js"
// #import "Printer.js"
'use strict';

JSClass("DocCommand", Command, {

    name: "doc",
    help: "Create code documentation",

    options: {
        input: {kind: "positional", help: "The root documentation file to start with"},
        output: {kind: "positional", help: "The directory in which to output the generated documentation"},
        title: {default: null, help: "The title to include on all pages"},
        sublime: {kind: "flag", help: "Generate Sublime Text completions"}
        // style: {default: null, help: "The stylesheet to use"}
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var rootURL = this.fileManager.urlForPath(this.arguments.input, workspaceURL);
        var printer = Printer.initWithLabel('doc');
        var documentation = Documentation.initWithRootURL(rootURL, this.fileManager);
        documentation.title = this.arguments.title;
        documentation.printer = printer;
        documentation.outputDirectoryURL = this.fileManager.urlForPath(this.arguments.output, workspaceURL);

        if (this.arguments.sublime){
            await documentation.sublime();
        }else{
            await documentation.run();
        }
        printer.setStatus("Done");

        printer.print("");
    },

});