// #import Foundation
"use strict";

const http = require("http");
const https = require("https");
const os = require("os");
const fs = require("fs");

const logger = JSLog("jskit", "http");

JSClass("HTMLProjectServer", JSObject, {

    initWithProject: function(project, wwwURL, fileManager, printer){
        this.project = project;
        this.wwwURL = wwwURL;
        this.fileManager = fileManager;
        this.printer = printer;
        this.contentTypesByExtension = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "application/javascript",
            ".json": "application/json",
            ".xml": "text/xml",
            ".txt": "text/plain",
            ".gif": "image/gif",
            ".jpeg": "image/jpeg",
            ".jpg": "image/jpeg",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".svgz": "image/svg+xml",
            ".pdf": "application/pdf",
            ".woff": "application/font-woff",
            ".ttf": "application/x-font-ttf",
            ".webmanifest": "application/manifest+json",
            ".appcache": "text/cache-manifest",
        };
    },

    project: null,
    wwwURL: null,
    fileManager: null,
    printer: null,

    port: null,
    tlsCertificateFileURL: null,
    tlsKeyFileURL: null,
    contentTypesByExtension: null,

    _nodeHttpServer: null,

    run: async function(){
        var scheme = "http";
        if (this.tlsCertificateFileURL !== null && this.tlsKeyFileURL !== null){
            scheme = "https";
            var options = {
                cert: await this.fileManager.contentsAtURL(this.tlsCertificateFileURL),
                key: await this.fileManager.contentsAtURL(this.tlsKeyFileURL)
            };
            this._nodeHttpServer = https.createServer(options, this._handleNodeRequest.bind(this));
            if (this.port === null){
                this.port = 443;
            }
        }else{
            this._nodeHttpServer = http.createServer(this._handleNodeRequest.bind(this));
            if (this.port === null){
                this.port = 80;
            }
        }
        this._nodeHttpServer.listen(this.port);
        var networkInterfaces = os.networkInterfaces();
        var networkInterface;
        var address;
        for (var name in networkInterfaces){
            networkInterface = networkInterfaces[name];
            for (var i = 0, l = networkInterface.length; i < l; ++i){
                address = networkInterface[i];
                if (address.family == "IPv4"){
                    this.printer.print(String.initWithFormat("HTTP server listening on %s://%s:%d", scheme, address.address, this.port), true, true);
                }
            }
        }
    },

    stop: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this._nodeHttpServer === null){
            completion.call(target);
        }else{
            this.printer.print("HTTP server closing, waiting for outstanding requests to close", true, true);
            var server = this;
            this._nodeHttpServer.close(function(){
                this.printer.print("HTTP server closed", true, true);
                completion.call(target);
                server._nodeHttpServer = null;
            });
        }
        return completion.promise;
    },

    alwaysExpires: JSLazyInitProperty(() => "Thu, 01 Jan 1970 00:00:01 GMT"),
    neverExpires: JSLazyInitProperty(() => "Thu, 31 Dec 2037 23:55:55 GMT"),

    _handleNodeRequest: async function(nodeRequest, nodeResponse){
        let statusCode = null;
        let headers = {};
        let filePath = null;
        try{
            let url = JSURL.initWithString(nodeRequest.url);
            if (url !== null){
                url.standardize();
                if (url.pathComponents.length === 0){
                    url.path = "/";
                }
                let method = nodeRequest.method.toUpperCase();
                if (method === "GET"){
                    if (url.pathComponents[0] === "/"){
                        if (url.pathComponents.length === 1){
                            url.appendPathComponent("index.html");
                        }
                        let statePaths = this.project.info.UIHTMLStatePaths || [];
                        for (let path of statePaths){
                            path = path.trim();
                            if (path.endsWith("/")){
                                if (url.path.startsWith(path)){
                                    statusCode = 302;
                                    headers.Location = "/#" + url.path; 
                                    break;
                                }
                            }else{
                                if (url.path === path){
                                    statusCode = 302;
                                    headers.Location = "/#" + url.path;
                                    break; 
                                }
                            }
                        }
                        if (statusCode === null){
                            if (url.pathComponents.length === 2){
                                if (url.pathComponents[1] === "index.html"){
                                    headers.Expires = this.alwaysExpires;
                                    headers["Cache-Control"] = "no-cache";
                                }else if (url.pathComponents[1] === "manifest.appcache"){
                                    headers.Expires = this.alwaysExpires;
                                    headers["Cache-Control"] = "no-cache";
                                }else if (url.pathComponents[1] === "service-worker.js"){
                                    headers.Expires = this.alwaysExpires;
                                    headers["Cache-Control"] = "no-cache";
                                }else if (url.pathComponents[1] === "HTMLAppBootstrapper.js"){
                                    headers.Expires = this.alwaysExpires;
                                    headers["Cache-Control"] = "no-cache";
                                }
                            }else if (url.pathComponents[1] === "Resources"){
                                headers.Expires = this.neverExpires;
                                headers["Cache-Control"] = "max-age=315360000"; // ~10 years
                                headers.Etag = url.lastPathComponent;
                            }
                            let fileURL = this.wwwURL.appendingPathComponents(url.pathComponents.slice(1));
                            let exists = await this.fileManager.itemExistsAtURL(fileURL);
                            if (exists){
                                let attributes = await this.fileManager.attributesOfItemAtURL(fileURL);
                                headers["Content-Type"] = this.contentTypesByExtension[url.fileExtension] || "application/octet-stream";
                                headers["Content-Length"] = attributes.size;
                                filePath = this.fileManager.pathForURL(fileURL);
                                statusCode = 200;
                            }else{
                                statusCode = 404;
                            }
                        }
                    }else{
                        statusCode = 404;
                    }
                }else{
                    statusCode = 405;
                }
            }else{
                statusCode = 404;
            }
        }catch (e){
            logger.error("Error handling request: %{error}", e);
            statusCode = 500;
        }        

        try{
            try{
                nodeResponse.writeHead(statusCode, headers);
            }catch (e){
                logger.error("Error sending response headers: %{error}", e);
                nodeResponse.writeHead(500);
            }
            nodeResponse.flushHeaders();

            if (statusCode === 200 && filePath !== null){
                let fp = fs.createReadStream(filePath);
                fp.pipe(nodeResponse); // pipe will call this._nodeResponse.end(), which is the same as calling complete()
            }else{
                nodeResponse.end();
            }
            if (statusCode >= 400){
                logger.warn("%d %{public} %{public}", statusCode, nodeRequest.method, nodeRequest.url);
            }
        }catch (e){
            nodeRequest.socket.destroy();
            logger.error("Error sending response: %{error}", e);
        }
    },

});