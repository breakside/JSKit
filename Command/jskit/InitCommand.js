// #import "Command.js"
// #import "Template.js"
// #import "Printer.js"
/* global JSClass, Command, JSKitRootDirectoryPath, Template, Printer */
'use strict';

JSClass("InitCommand", Command, {

    name: "init",
    help: "Initialize a workspace",

    options: {
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var isEmpty = true;
        var entries = await this.fileManager.contentsOfDirectoryAtURL(workspaceURL);
        for (let i = 0, l = entries.length; i < l && isEmpty; ++i){
            let entry = entries[i];
            if (!entry.name.startsWith(".") && entry.name != 'node_modules' && entry.name != 'package-lock.json' && entry.name != 'package.json'){
                isEmpty = false;
            }
        }
        if (!isEmpty){
            process.stdout.write("jskit init can only be used in an empty directory\n");
            return;
        }
        var printer = Printer.initWithLabel('init');
        printer.setStatus("Initializing workspace...");
        var workspaceName = workspaceURL.lastPathComponent;
        var templatesURL = this.fileManager.urlForPath(JSKitRootDirectoryPath).appendingPathComponent("Templates", true);

        var workspaceTemplateURL = templatesURL.appendingPathComponent("workspace");
        var workspaceTemplate = Template.initWithURL(workspaceTemplateURL, this.fileManager);
        await workspaceTemplate.addToWorkspace(workspaceURL, workspaceName);

        printer.setStatus("workspace initialized");
        printer.print("");
    },

});