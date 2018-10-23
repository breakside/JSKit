// #import "ServerKit/SKHTTPResponse.js"
/* global require, SKHTTPResponse */
'use strict';

var fs = require('fs');

SKHTTPResponse.definePropertiesFromExtensions({

    _nodeResponse: null,

    initWithNodeResponse: function(nodeResponse){
        this._nodeResponse = nodeResponse;
    },

    getStatusCode: function(){
        return this._nodeResponse.statusCode;
    },

    setStatusCode: function(statusCode){
        this._nodeResponse.statusCode = statusCode;
    },

    complete: function(){
        this._nodeResponse.end();
    },

    setHeader: function(name, value){
        this._nodeResponse.setHeader(name, value);
    },

    getHeader: function(name, value){
        this._nodeResponse.setHeader(name, value);
    },

    writeData: function(data){
        this._nodeResponse.write(data.bytes.nodeBuffer());
    },

    sendFile: function(filePath, contentType){
        var response = this;
        fs.stat(filePath, function(error, stat){
            response.contentType = contentType;
            response.contentLength = stat.size;
            response.setHeader("Last-Modified", stat.mtime.toString());
            var fp = fs.createReadStream(filePath);
            fp.pipe(response._nodeResponse); // pipe will call this._nodeResponse.end(), which is the same as calling complete()
        });
    }

});

SKHTTPResponse.defineInitMethod('initWithNodeResponse');