// #import "Command.js"
// #import "Template.js"
// #import "Printer.js"
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

        var sublimeURL = workspaceURL.appendingPathComponent(workspaceURL.lastPathComponent);
        sublimeURL = sublimeURL.appendingFileExtension('sublime-project');
        var projectJSON = await this.fileManager.contentsAtURL(sublimeURL);
        var projectSettings = null;
        if (projectJSON !== null){
            projectSettings = JSON.parse(String.initWithData(projectJSON, String.Encoding.utf8));
            if (!projectSettings.build_systems){
                projectSettings.build_systems = [];
            }
            projectSettings.build_systems.push({
                "name": projectName,
                "cmd": ["npx", "jskit", "make", projectName],
                "working_dir": "${project_path}",
                "variants": [
                    {
                        "name": "debug",
                        "cmd": ["npx", "jskit", "make", "--debug", projectName]
                    }
                ]
            });
        }

        if (this.arguments.template !== 'tests'){
            var testsTemplateURL = templatesURL.appendingPathComponent("project-tests");
            var testsTemplate = Template.initWithURL(testsTemplateURL, this.fileManager);
            await testsTemplate.addToWorkspace(workspaceURL, projectName);
            if (projectSettings !== null){
                projectSettings.build_systems.push({
                    "name": "%s Tests".sprintf(projectName),
                    "cmd": ["npx", "jskit", "test", "%sTests".sprintf(projectName)],
                    "working_dir": "${project_path}"
                });
            }
        }

        if (projectSettings !== null){
            projectJSON = JSON.stringify(projectSettings).utf8();
            await this.fileManager.createFileAtURL(sublimeURL, projectJSON);
        }

        printer.setStatus("%s added".sprintf(this.arguments.template));
        printer.print("");
    },

});