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