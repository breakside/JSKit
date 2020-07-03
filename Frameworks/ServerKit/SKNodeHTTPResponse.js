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
// jshint node: true
'use strict';

var fs = require('fs');
var logger = JSLog("serverkit", "http");

JSClass("SKNodeHTTPResponse", SKHTTPResponse, {

    _nodeResponse: null,

    initWithNodeResponse: function(nodeResponse, tag){
        this._nodeResponse = nodeResponse;
        this.tag = tag;
    },

    getStatusCode: function(){
        return this._nodeResponse.statusCode;
    },

    setStatusCode: function(statusCode){
        this._nodeResponse.statusCode = statusCode;
    },

    complete: function(){
        this._nodeResponse.end();
        logger.info("%{public} %d response complete", this.tag, this.statusCode);
    },

    setHeader: function(name, value){
        this._nodeResponse.setHeader(name, value);
    },

    getHeader: function(name){
        return this._nodeResponse.getHeader(name);
    },

    writeData: function(data){
        this._nodeResponse.write(data.nodeBuffer());
    },

    writeFile: function(filePath){
        var fp = fs.createReadStream(filePath);
        fp.pipe(this._nodeResponse); // pipe will call this._nodeResponse.end(), which is the same as calling complete()
        logger.info("%{public} %d write file complete", this.tag, this.statusCode);
    }

});