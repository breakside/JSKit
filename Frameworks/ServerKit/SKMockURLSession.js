// #import "SKMockHTTPServer.js"
// #import "SKMockHTTPRequest.js"
'use strict';

JSClass("SKMockURLSession", JSURLSession, {

    server: null,

    init: function(){
        this.server = SKMockHTTPServer.init();
        this.dataTaskClass = SKMockURLSessionDataTask;
        this.uploadTaskClass = SKMockURLSessionUploadTask;
        this.streamTaskClass = SKMockURLSessionStreamTask;
    },

});

var sharedDataAndUpload = {

    resume: function(){
        if (!this.completion){
            this.completion = Promise.completion(Promise.resolveNull);
            var task = this;
            this.completion.promise = this.completion.promise.then(function(){
                return task.currentRequest.response;
            });
        }
        var serverRequest = SKMockHTTPRequest.initWithURLRequest(this.request);
        this.session.server.handleRequest(serverRequest, function(){
            var response = serverRequest.response.urlResponse;
            this.currentRequest._response = response;
            this.session._taskDidComplete(this, null);
        }, this);
        return this.completion.promise;
    }

};

JSClass("SKMockURLSessionDataTask", JSURLSessionDataTask, sharedDataAndUpload);
JSClass("SKMockURLSessionUploadTask", JSURLSessionUploadTask, sharedDataAndUpload);

JSClass("SKMockURLSessionStreamTask", JSURLSessionStreamTask, {

    

});