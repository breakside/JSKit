// #import "SKHTTPResponse.js"
'use strict';

JSClass("SKMockHTTPResponse", SKHTTPResponse, {

    chunks: null,
    urlResponse: null,

    init: function(){
        SKMockHTTPResponse.$super.init.call(this);
        this.urlResponse = JSURLResponse.init();
        this.chunks = [];
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion;
        }
        JSRunLoop.main.schedule(completion, target, this.data);
        return completion.promise;
    },

    _getStatusCode: function(){
        return this.urlResponse.statusCode;
    },

    _setStatusCode: function(statusCode){
        this.urlResponse.statusCode = statusCode;
    },

    complete: function(){
    },

    setHeader: function(name, value){
        this.urlResponse.headerMap.set(name, value);
    },

    getHeader: function(name){
        return this.urlResponse.headerMap.get(name);
    },

    writeData: function(data){
        this.chunks.push(data);
        this.urlResponse.data = JSData.initWithChunks(this.chunks);
    },

    writeFile: function(filePath){
        throw new Error("Not implemented");
    }

});