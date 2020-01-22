// #import "Command.js"
// #import "Project.js"
// #import "JavascriptFile.js"
'use strict'; 

JSClass("GlobalsCommand", Command, {

    name: "globals",
    help: "Find all global varaiables defined in the given file and its imports",

    options: {
        file: {kind: "positional", help: "The file to parse"},
        frameworks: {kind: "flag", help: "Whether to include globals from imported frameworks"},
        filename: {default: null, help: "A dummy filename, used when the file is -"},
        delimiter: {default: "\n"}
    },

    run: async function(){
        let root = null;
        let project = null;
        if (this.arguments.file === '-'){
            root = await this.inputData();
            var dummyURL = this.workingDirectoryURL;
            if (this.arguments.filename){
                dummyURL = this.fileManager.urlForPath(this.arguments.filename, dummyURL);
            }else{
                dummyURL = dummyURL.appendingPathComponent('filename.js');
            }
            project = await Project.projectForFile(dummyURL);
        }else{
            root = this.fileManager.urlForPath(this.arguments.file, this.workingDirectoryURL);
            project = await Project.projectForFile(root);
        }
        let globals;
        if (project !== null){
            var includeDirectories = await project.findIncludeDirectoryURLs();
            globals = await project.globals([root], includeDirectories, this.arguments.frameworks);
        }else{
            let contents;
            if (root instanceof JSData){
                contents = root;
            }else{
                contents = await this.fileManager.contentsAtURL(root);
            }
            let file = JavascriptFile.initWithData(contents);
            globals = await file.globals();
        }
        process.stdout.write("JSGlobalObject");
        if (globals.length > 0){
            process.stdout.write(this.arguments.delimiter);
        }
        process.stdout.write(globals.join(this.arguments.delimiter));
    }

});