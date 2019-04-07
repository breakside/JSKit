// #import "Command.js"
// #import "Template.js"
// #import "Printer.js"
/* global JSClass, Command, JSKitRootDirectoryPath, Template, Printer */
'use strict';

JSClass("InitCommand", Command, {

    name: "init",
    help: "Initialize a workspace with a project",

    options: {
        template: {kind: "positional", help: "The project template to use as a starting point", allowed: ["html", "http", "node", "framework"]},
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
            process.stdout.write("Use jskit add to add projects to an existing workspace\n");
            return;
        }
        var printer = Printer.initWithLabel('init');
        printer.setStatus("Initializing %s workspace...".sprintf(this.arguments.template));
        var projectName = workspaceURL.lastPathComponent;
        var templatesURL = this.fileManager.urlForPath(JSKitRootDirectoryPath).appendingPathComponent("Templates", true);

        var workspaceTemplateURL = templatesURL.appendingPathComponent("workspace");
        var workspaceTemplate = Template.initWithURL(workspaceTemplateURL, this.fileManager);
        await workspaceTemplate.addToWorkspace(workspaceURL, projectName);

        var templateURL = templatesURL.appendingPathComponent(this.arguments.template);
        var template = Template.initWithURL(templateURL, this.fileManager);
        await template.addToWorkspace(workspaceURL, projectName);

        var testsTemplateURL = templatesURL.appendingPathComponent("project-tests");
        var testsTemplate = Template.initWithURL(testsTemplateURL, this.fileManager);
        await testsTemplate.addToWorkspace(workspaceURL, projectName);

        printer.setStatus("%s workspace initialized".sprintf(this.arguments.template));
        printer.print("");
    },

});