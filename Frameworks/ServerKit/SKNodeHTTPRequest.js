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
// #import "SKHTTPError.js"
'use strict';

JSClass("SKNodeHTTPRequest", SKHTTPRequest, {

    _nodeRequest: null,

    initWithNodeRequest: function(nodeRequest, nodeResponse){
        var url = JSURL.initWithString(nodeRequest.url);
        var headerMap = JSMIMEHeaderMap();
        for (var i = 0, l = nodeRequest.rawHeaders.length - 1; i < l; i += 2){
            headerMap.add(nodeRequest.rawHeaders[i], nodeRequest.rawHeaders[i + 1]);
        }
        SKNodeHTTPRequest.$super.initWithMethodAndURL.call(this, nodeRequest.method, url, headerMap);
        this._nodeRequest = nodeRequest;
        if (nodeResponse){
            this._response = SKNodeHTTPResponse.initWithNodeResponse(nodeResponse, this.tag, this.logger);
        }
        if (this.clientIPAddress === null){
            if (nodeRequest.socket.remoteAddress){
                this.clientIPAddress = JSIPAddress.initWithString(nodeRequest.socket.remoteAddress);
            }
        }
    },

    createWebsocket: function(){
        return SKNodeHTTPWebSocket.initWithNodeSocket(this._nodeRequest.socket, this.tag, this.logger);
    },

    close: function(){
        this._nodeRequest.socket.destroy();
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var length = 0;
        var chunks = [];
        var maximumLength = this.maximumContentLength;
        var contentLength = this.contentLength;
        if (contentLength !== null && contentLength > maximumLength){
            throw new SKHTTPError(SKHTTPResponse.StatusCode.payloadTooLarge);
        }
        this._nodeRequest.on('data', function(chunk){
            chunks.push(chunk);
            length += chunk.length;
            if (length > maximumLength){
                throw new SKHTTPError(SKHTTPResponse.StatusCode.payloadTooLarge);
            }
        });
        this._nodeRequest.on('end', function(){
            completion.call(target, JSData.initWithChunks(chunks));
        });
        return completion.promise;
    },

});