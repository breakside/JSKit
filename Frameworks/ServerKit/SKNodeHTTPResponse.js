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

JSClass("SKNodeHTTPResponse", SKHTTPResponse, {

    _nodeResponse: null,

    initWithNodeResponse: function(nodeResponse, tag, logger){
        SKNodeHTTPResponse.$super.init.call(this);
        this._nodeResponse = nodeResponse;
        this.tag = tag;
        this.logger = logger;
    },

    complete: function(){
        this.writeHeaderIfNeeded();
        this._nodeResponse.end();
        this.logger.info("%d response complete", this.statusCode);
    },

    writeHeader: function(){
        var nameMap = {};
        var nodeHeaders = {};
        var header;
        for (var i = 0, l = this.headerMap.headers.length; i < l; ++i){
            header = this.headerMap.headers[i];
            var nodeName = nameMap[header.lowerName];
            if (!nodeName){
                nodeName = nameMap[header.lowerName] = header.name;
            }
            if (nodeName in nodeHeaders){
                if (!(nodeHeaders[nodeName] instanceof Array)){
                    nodeHeaders[nodeName] = [nodeHeaders[nodeName]];
                }
                nodeHeaders[nodeName].push(header.value);
            }else{
                nodeHeaders[nodeName] = header.value;
            }
        }
        try{
            this._nodeResponse.writeHead(this._statusCode, nodeHeaders);
        }catch (e){
            this.logger.error(e);
            this.statusCode = SKHTTPResponse.StatusCode.internalServerError;
            this._nodeResponse.writeHead(this._statusCode);
        }
        this._nodeResponse.flushHeaders();
    },

    writeData: function(data){
        this.writeHeaderIfNeeded();
        this._nodeResponse.write(data.nodeBuffer());
    },

    writeFile: function(filePath){
        this.writeHeaderIfNeeded();
        var fp = fs.createReadStream(filePath);
        fp.pipe(this._nodeResponse); // pipe will call this._nodeResponse.end(), which is the same as calling complete()
        this.logger.info("%d respone complete (piped file)", this.statusCode);
    }

});