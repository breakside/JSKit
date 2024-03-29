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
        project: {kind: "positional", help: "The test project to build and run"},
        "builds-root":  {default: null, help: "Root folder for builds"},
        "inspect-brk": {kind: "flag", help: "Wait for a debugger to attach when running tests"},
        "http-port": {default: null, help: "Runs an http server for in-browser testing"},
        "browser": {default: null, help: "Uses Playwright to run the tests in browser", allowed: ["chrome", "firefox", "webkit"]},
        testargs: {kind: "unknown", help: "Additional arguments for the test run"},
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
            await this.startHTTPServer(port, builder.wwwURL);
            process.stdout.write("Run in-browser tests at %s\n".sprintf(this.url.encodedString));
        }else if (this.arguments.browser !== null){
            await this.startHTTPServer(0, builder.wwwURL);
            try{
                await this.runTestsInBrowser(this.arguments.browser);
            }finally{
                await this.stopHTTPServer();
            }
        }else{
            await this.runTests(builder.executableURL);
        }
    },

    runTests: function(executableURL){
        const { spawn } = require('child_process');
        let exe = this.fileManager.pathForURL(executableURL);
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
    },

    url: null,
    httpServer: null,

    startHTTPServer: async function(port, root){
        var fileManager = this.fileManager;
        this.httpServer = http.createServer(function(request, response){
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
                var fileURL = JSURL.initWithString(relativePath, root);
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

        var server = this.httpServer;
        port = await new Promise(function(resolve, reject){
            server.listen(port, '127.0.0.1', function(){
                resolve(server.address().port);
            });
        });

        var url = JSURL.initWithString("http://localhost/");
        url.port = port;
        var args = JSArguments.initWithOptions({
            suite: {default: null},
            case: {default: null},
            other: {kind: "unknown"}
        });
        var query = JSFormFieldMap();
        args.parse([""].concat(this.arguments.testargs));
        if (args.suite !== null){
            query.set("suite", args.suite);
            if (args.case !== null){
                query.set("case", args.case);
            }
        }
        url.query = query;
        this.url = url;
    },

    stopHTTPServer: function(){
        var server = this.httpServer;
        return new Promise(function(resolve, reject){
            server.close(function(){
                resolve();
            });
        });
    },

    runTestsInBrowser: async function(browserName){
        var playwright = null;
        try{
            playwright = require("playwright");
        }catch (e){
            process.stdout.write("Playwright is required to run headless tests in %s\n\n$ npm install -D playwright\n".sprintf(browserName));
            this.returnValue = -1;
            return;
        }
        var property = {
            chrome: "chromium",
            firefox: "firefox",
            webkit: "webkit"
        }[browserName];
        var browser = null;
        try{
            browser = await playwright[property].launch();
        }catch (e){
            if (browserName === "webkit"){
                process.stdout.write("Failed to launch webkit.  Ubuntu required packages are: \n");
                process.stdout.write("  libwoff1\n");
                process.stdout.write("  libopus0\n");
                process.stdout.write("  libwebp6\n");
                process.stdout.write("  libwebpdemux2\n");
                process.stdout.write("  libenchant1c2a\n");
                process.stdout.write("  libgudev-1.0-0\n");
                process.stdout.write("  libsecret-1-0\n");
                process.stdout.write("  libhyphen0\n");
                process.stdout.write("  libgdk-pixbuf2.0-0\n");
                process.stdout.write("  libegl1\n");
                process.stdout.write("  libnotify4\n");
                process.stdout.write("  libxslt1.1\n");
                process.stdout.write("  libevent-2.1-6\n");
                process.stdout.write("  libgles2\n");
                process.stdout.write("  libvpx5\n");
                process.stdout.write("  libxcomposite1\n");
                process.stdout.write("  libatk1.0-0\n");
                process.stdout.write("  libatk-bridge2.0-0\n");
                process.stdout.write("  libepoxy0\n");
                process.stdout.write("  libgtk-3-0\n");
                process.stdout.write("  libharfbuzz-icu0\n");
                process.stdout.write("  libgstreamer-gl1.0-0\n");
                process.stdout.write("  libgstreamer-plugins-bad1.0-0\n");
                process.stdout.write("  gstreamer1.0-plugins-good\n");
                process.stdout.write("  gstreamer1.0-libav\n");
            }
            throw e;
        }
        process.stdout.write("Running tests in %s...\n".sprintf(browserName));
        var url = JSURL.initWithURL(this.url);
        var query = url.query;
        query.add("headless");
        url.query = query;
        var page = await browser.newPage();
        var cmd = this;
        await new Promise(function(resolve, reject){
            page.exposeFunction("headlessPrint", function(text, ttyOnly){
                if (!ttyOnly || process.stdout.isTTY){
                    process.stdout.write(text);
                }
            });
            page.exposeFunction("headlessExit", function(code){
                cmd.returnValue = code;
                resolve();
            });
            return page.goto(url.encodedString);
        });
        await browser.close();
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