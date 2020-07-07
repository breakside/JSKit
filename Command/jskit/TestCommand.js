// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "Command.js"
// #import "Project.js"
// #import "TestBuilder.js"
// #import "Printer.js"
'use strict';

var http = require('http');
var fs = require('fs');

JSClass("TestCommand", Command, {

    name: "test",
    help: "Build and execute a test run for the given tests project",

    options: {
        'builds-root':  {default: null, help: "Root folder for builds"},
        project: {kind: "positional", help: "The test project to build and run"},
        'inspect-brk': {kind: "flag", help: "Wait for a debugger to attach when running tests"},
        testargs: {kind: "unknown", help: "Additional arguments for the test run"},
        'http-port': {default: null, help: "Runs an http server for in-browser testing"}
    },

    run: async function(){
        var projectURL = this.fileManager.urlForPath(this.arguments.project, this.workingDirectoryURL, true);
        var project = Project.initWithURL(projectURL, this.fileManager);
        this.printer = Printer.initWithLabel('make');
        this.printer.setStatus("Loading project...");
        try{
            await project.load();
        }catch (e){
            throw new Error("Could not load project '%s': %s".sprintf(this.arguments.project, e));
        }
        if (project.info.JSBundleType != 'tests'){
            throw new Error("Not a test project");
        }
        var builder = TestBuilder.initWithProject(project, {});
        builder.workingDirectoryURL = this.workingDirectoryURL;
        builder.printer = this.printer;
        if (arguments['builds-root']){
            builder.buildsRootURL = this.fileManager.urlForPath(this.arguments['builds-root'], this.workingDirectoryURL, true);
        }else{
            builder.buildsRootURL = this.workingDirectoryURL.appendingPathComponent('builds', true);
        }
        this.printer.setStatus("Building...");
        this.printer.stream = {write: function(){ }};
        await builder.build();
        this.printer.stream = process.stdout;
        this.printer.setStatus("Done");
        this.printer.print("");

        var port = this.arguments['http-port'];
        if (port !== null){
            var fileManager = this.fileManager;
            var server = http.createServer(function(request, response){
                try{
                    if (request.method != 'GET'){
                        response.statusCode = JSURLResponse.StatusCode.methodNotAllowed;
                        response.end();
                        return;
                    }
                    var url = JSURL.initWithString(request.url).standardized();
                    var path = url.path;
                    if (path === null || path.length === 0 || path[0] != '/'){
                        response.statusCode = JSURLResponse.StatusCode.badRequest;
                        response.end();
                        return;
                    }
                    if (path === "/"){
                        path = "/tests.html";
                    }
                    var relativePath = path.substr(1);
                    var fileURL = JSURL.initWithString(relativePath, builder.wwwURL);
                    var filePath = fileManager.pathForURL(fileURL);
                    var contentType = typeForExtension(filePath.fileExtension);
                    fs.stat(filePath, function(error, stat){
                        try{
                            if (error){
                                response.statusCode = JSURLResponse.StatusCode.notFound;
                                response.end();
                                return;
                            }
                            response.setHeader("Content-Type", contentType);
                            response.setHeader("Content-Length", stat.size);
                            response.statusCode = JSURLResponse.StatusCode.ok;
                            var fp = fs.createReadStream(filePath);
                            fp.pipe(response); // calls .end()
                        }catch(e){
                            process.stdout.write(e.stack);
                            response.statusCode = JSURLResponse.StatusCode.internalServerError;
                            response.end();
                        }
                    });
                }catch (e){
                    process.stdout.write(e.stack);
                    response.statusCode = JSURLResponse.StatusCode.internalServerError;
                    response.end();
                }
            });
            server.listen(port, '127.0.0.1');
            process.stdout.write("Run in-browser tests at http://localhost:%d/\n".sprintf(port));
        }else{
            const { spawn } = require('child_process');
            let exe = this.fileManager.pathForURL(builder.executableURL);
            var nodeargs = [];
            if (this.arguments['inspect-brk']){
                nodeargs.push('--inspect-brk');
            }
            nodeargs.push(exe);
            nodeargs = nodeargs.concat(this.arguments.testargs);
            var tests = spawn('node', nodeargs, {stdio: 'inherit'});

            var cmd = this;
            return new Promise(function(resolve, reject){
                tests.on('close', function(code){
                    cmd.returnValue = code;
                    resolve();
                });
            });
        }
    }

});

var typeForExtension = function(ext){
    switch (ext){
        case ".html": return "text/html";
        case ".js": return "application/javascript";
        case ".css": return "text/css";
        case ".png": return "image/png";
        case ".jpg": return "image/jepg";
        case ".jpg": return "image/jpg";
        case ".svg": return "image/svg+xml";
        case ".svgz": return "image/svg+xml";
        case ".woff": return "application/font-woff";
        case ".ttf": return "application/x-font-ttf";
        default: return "application/octet-stream";
    }
};