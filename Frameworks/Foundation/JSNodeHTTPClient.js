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

// #import "JSURLSessionDataTask.js"
// #import "JSURLSessionUploadTask.js"
// #import "JSURLRequest.js"
// #import "JSURLResponse.js"
// #import "JSRunLoop.js"
// #import "JSLog.js"
// jshint node: true
'use strict';

var logger = JSLog("foundation", "url-session");
var http = require('http');
var https = require('https');

JSClass("JSNodeHTTPClient", JSObject, {

    send: function(request, callbacks, target){
        var completed = false;
        var complete = function(error){
            if (completed){
                return;
            }
            completed = true;
            if (callbacks.complete){
                callbacks.complete.call(target, error);
            }
        };
        try{
            var response = null;

            // Create node request
            var options = {
                method: request.method
            };
            var nodeRequest = null;
            if (request.url.scheme == 'https'){
                nodeRequest = https.request(request.url.encodedString, options);
            }else{
                nodeRequest = http.request(request.url.encodedString, options);
            }

            // Event Listeners
            nodeRequest.on('response', function(message){
                response = JSURLResponse.init();
                response.statusCode = message.statusCode;
                response._headerMap.parse(message.rawHeaders.join("\r\n"));
                response.statusText = message.statusMessage;
                if (callbacks.response){
                    callbacks.response.call(target, response);
                }
                var chunks = [];
                message.on('data', function(chunk){
                    chunks.push(JSData.initWithNodeBuffer(chunk));
                });
                message.on('end', function(){
                    if (completed){
                        return;
                    }
                    response.data = JSData.initWithChunks(chunks);
                    complete(null);
                });
            });
            nodeRequest.on('error', function(error){
                complete(error);
            });
            nodeRequest.on('abort', function(){
                complete(new Error('abort'));
            });
            nodeRequest.on('timeout', function(){
                complete(new Error('timeout'));
            });

            // Configure request
            var headers = request.headers;
            var header;
            for (var i = 0, l = headers.length; i < l; ++i){
                header = headers[i];
                nodeRequest.setHeader(header.name, header.value);
            }
            if (request.data !== null){
                nodeRequest.write(request.data.nodeBuffer());
            }
            nodeRequest.end();
            return function(){
                if (completed){
                    return;
                }
                nodeRequest.abort();
            };
        }catch(e){
            complete(e);
        }
    }

});

Object.defineProperties(JSNodeHTTPClient, {
    shared: {
        configurable: true,
        get: function(){
            var client = JSNodeHTTPClient.init();
            Object.defineProperty(this, 'shared', {value: client});
            return client;
        }
    }
});
