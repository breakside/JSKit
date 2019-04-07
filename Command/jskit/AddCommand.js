// #import "Command.js"
// #import "Template.js"
// #import "Printer.js"
/* global JSClass, Command, JSKitRootDirectoryPath, Template, Printer */
'use strict';

JSClass("AddCommand", Command, {

    name: "add",
    help: "Add a project to an existing workspace",

    options: {
        template: {kind: "positional", help: "The project template to use as a starting point", allowed: ["html", "http", "node", "framework", "tests"]},
        name: {kind: "positional", help: "The name for the new project"}
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;

        var printer = Printer.initWithLabel('init');
        printer.setStatus("Adding %s...".sprintf(this.arguments.name));
        var projectName = this.arguments.name;
        var templatesURL = this.fileManager.urlForPath(JSKitRootDirectoryPath).appendingPathComponent("Templates", true);

        var templateURL = templatesURL.appendingPathComponent(this.arguments.template);
        var template = Template.initWithURL(templateURL, this.fileManager);
        await template.addToWorkspace(workspaceURL, projectName);

        if (this.arguments.template !== 'tests'){
            var testsTemplateURL = templatesURL.appendingPathComponent("project-tests");
            var testsTemplate = Template.initWithURL(testsTemplateURL, this.fileManager);
            await testsTemplate.addToWorkspace(workspaceURL, projectName);
        }

        printer.setStatus("%s added".sprintf(this.arguments.template));
        printer.print("");
    },

});