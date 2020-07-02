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

// #import "SKHTTPRequest.js"
// #import "SKNodeHTTPWebSocket.js"
// #import "SKNodeHTTPResponse.js"
'use strict';

JSClass("SKNodeHTTPRequest", SKHTTPRequest, {

    _nodeRequest: null,

    initWithNodeRequest: function(nodeRequest, nodeResponse){
        this._nodeRequest = nodeRequest;
        this._headerMap = JSMIMEHeaderMap();
        for (var i = 0, l = this._nodeRequest.rawHeaders.length - 1; i < l; i += 2){
            this._headerMap.add(this._nodeRequest.rawHeaders[i], this._nodeRequest.rawHeaders[i + 1]);
        }
        if (nodeResponse){
            this._response = SKHTTPResponse.initWithNodeResponse(nodeResponse);
        }
        this._url = JSURL.initWithString(nodeRequest.url);
        this._method = this._nodeRequest.method;
    },

    createWebsocket: function(){
        return SKHTTPWebSocket.initWithNodeSocket(this._nodeRequest.socket);
    },

    _write: function(str){
        this._nodeRequest.socket.write(str);
    },

    close: function(){
        this._nodeRequest.socket.destroy();
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var chunks = [];
        this._nodeRequest.on('data', function(chunk){
            chunks.push(chunk);
        });
        this._nodeRequest.on('end', function(){
            completion.call(target, JSData.initWithChunks(chunks));
        });
        return completion.promise;
    }

});