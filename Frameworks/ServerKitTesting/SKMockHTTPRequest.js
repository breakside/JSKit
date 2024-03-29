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

// #import ServerKit
// #import "SKMockHTTPResponse.js"
'use strict';

JSClass("SKMockHTTPRequest", SKHTTPRequest, {

    data: null,

    initWithURLRequest: function(urlRequest){
        SKMockHTTPRequest.$super.initWithMethodAndURL.call(this, urlRequest.method, urlRequest.url);
        this.data = urlRequest.data;
        this._headerMap = JSMIMEHeaderMap(urlRequest.headerMap);
        this._response = SKMockHTTPResponse.initWithTag(this.tag, this.logger);
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        JSRunLoop.main.schedule(completion, target, this.data);
        return completion.promise;
    },

    _write: function(){
        
    },

    mockWebSocket: null,

    createWebsocket: function(){
        return this.mockWebSocket;
    },

});