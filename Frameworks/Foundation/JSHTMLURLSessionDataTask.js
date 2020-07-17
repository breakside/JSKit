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

// #import "Promise+JS.js"
// #import "JSURLSessionDataTask.js"
// #import "JSHTMLHTTPClient.js"
// #import "JSLog.js"
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("foundation", "url-session");

JSClass("JSHTMLURLSessionDataTask", JSURLSessionDataTask, {

    cancelation: null,

    resume: function(){
        if (!this.completion){
            this.completion = Promise.completion(Promise.resolveNull);
            var task = this;
            this.completion.promise = this.completion.promise.then(function(){
                return task.currentRequest.response;
            });
        }
        if (this.cancelation === null){
            this.cancelation = JSHTMLHTTPClient.shared.send(this.currentRequest, {
                redirect: function(url){
                    this._currentRequest = this._originalRequest.redirectedRequestToURL(url);
                },
                uploadProgress: function(sent, total){
                    this.session._taskDidSendBodyData(this, sent, total);
                },
                response: function(response){
                    this.currentRequest._response = response;
                },
                progress: function(loaded, total){
                    this.session._taskDidReceiveBodyData(this, loaded, total);
                },
                complete: function(error){
                    this._error = error;
                    this.session._taskDidComplete(this, this._error);
                }
            }, this);
        }
        return this.completion.promise;
    },

    cancel: function(){
        if (this.cancelation !== null){
            this.cancelation();
            this.cancelation = null;
        }
    }

});

})();