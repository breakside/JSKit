// #import "Promise+JS.js"
// #import "JSURL.js"
// #import "JSURLSessionDataTask.js"
// #import "JSURLRequest.js"
// #import "JSURLResponse.js"
// #import "JSRunLoop.js"
// #import "JSLog.js"
// jshint node: true
'use strict';

var logger = JSLog("foundation", "url-session");
var http = require('http');
var https = require('https');

JSURLSessionDataTask.definePropertiesFromExtensions({

    _nodeRequest: null,
    _sent: false,

    resume: function(){
        if (!this.completion){
            this.completion = Promise.completion(Promise.resolveNull);
            var task = this;
            this.completion.promise = this.completion.promise.then(function(){
                return task.currentRequest.response;
            });
        }
        var request = this._currentRequest;
        var data = null;
        var url = request.url.encodedString;
        if (request.data !== null){
            data = request.data;
        }
        if (!this._nodeRequest){
            var options = {
                method: request.method
            };
            if (request.url.scheme == 'https'){
                this._nodeRequest = https.request(url, options);
            }else{
                this._nodeRequest = http.request(url, options);
            }
            var headers = request.headers;
            var header;
            for (var i = 0, l = headers.length; i < l; ++i){
                header = headers[i];
                this._nodeRequest.setHeader(header.name, header.value);
            }
            this._nodeRequest.on('response', this._handleResponse.bind(this));
            this._nodeRequest.on('error', this._handleError.bind(this));
            this._nodeRequest.on('abort', this._handleAbort.bind(this));
            this._nodeRequest.on('timeout', this._handleTimeout.bind(this));
            if (data !== null){
                this._nodeRequest.write(data);
            }
            this._nodeRequest.end();
        }else{
            JSRunLoop.main.schedule(this._complete, this);
        }
        return this.completion.promise;
    },

    cancel: function(){
        this._nodeRequest.abort();
    },

    _handleResponse: function(message){
        // var url = JSURL.initWithString(this._xmlRequest.responseURL);
        // if (!url.isEqual(this._currentRequest.url)){
        //     this._currentRequest = this._originalRequest.redirectedRequestToURL(url);
        // }
        var response = JSURLResponse.init();
        response.statusCode = message.statusCode;
        response._headerMap.parse(message.rawHeaders.join("\r\n"));
        response.statusText = message.statusMessage;
        this._currentRequest._response = response;
        this._chunks = [];
        message.on('data', this._handleChunk.bind(this));
        message.on('end', this._handleEnd.bind(this));
    },

    _handleError: function(error){
        this._error = 'error';
    },

    _handleAbort: function(){
        this._error = 'abort';
    },

    _handleTimeout: function(){
        this._error = 'timeout';
    },

    _chunks: null,

    _handleChunk: function(chunk){
        this._chunks.push(JSData.initWithNodeBuffer(chunk));
    },

    _handleEnd: function(){
        var data = JSData.initWithChunks(this._chunks);
        this._currentRequest._response.data = data;
        this._complete();
    },

    _complete: function(){
        this.session._taskDidComplete(this, this._error);
    },

});