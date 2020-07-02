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