// #import "ServerKit/SKHTTPResponse.js"
/* global require, SKHTTPResponse */
'use strict';

var fs = require('fs');

SKHTTPResponse.definePropertiesFromExtensions({

    _nodeResponse: null,
    _shouldEnd: true,

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
        if (this._shouldEnd){
            this._nodeResponse.end();
        }
    },

    setHeader: function(name, value){
        this._nodeResponse.setHeader(name, value);
    },

    getHeader: function(name, value){
        this._nodeResponse.setHeader(name, value);
    },

    writeString: function(str){
        this.writeData(str.utf8());
    },

    writeData: function(data){
        this._nodeResponse.write(data.bytes);
    },

    sendFile: function(filePath, contentType){
        var stat = fs.statSync(filePath);
        this.contentType = contentType;
        this.contentLength = stat.size;
        var fp = fs.createReadStream(filePath);
        fp.pipe(this._nodeResponse);
        this._shouldEnd = false;
    }

});