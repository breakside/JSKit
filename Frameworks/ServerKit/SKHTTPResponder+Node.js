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

// #import "SKHTTPResponder.js"
// jshint node: true
'use strict';

var fs = require('fs');

SKHTTPResponder.definePropertiesFromExtensions({

    sendFile: function(filePath, contentType, hash){
        this._setAccessHeaders();
        var responder = this;
        fs.stat(filePath, function(error, stat){
            if (error){
                responder.sendStatus(SKHTTPResponse.StatusCode.notFound);
            }else{
                responder._sendFileAfterStat(filePath, contentType, hash, stat);
            }
        });
    },

    _sendFileAfterStat: function(filePath, contentType, hash, stat){
        if (hash){
            if (!this.request.needsEntityWithTag(hash)){
                this.sendStatus(SKHTTPResponse.StatusCode.notModified);
                return;
            }
            this.response.etag = hash;
        }
        var lastModified = JSDate.initWithTimeIntervalSince1970(Math.floor(stat.mtime.getTime() / 1000));
        if (!this.request.needsEntityModifiedAt(lastModified)){
            this.sendStatus(SKHTTPResponse.StatusCode.notModified);
            return;
        }
        this.response.contentType = contentType;
        this.response.contentLength = stat.size;
        this.response.lastModified = lastModified;
        this.response.writeFile(filePath);
    }

});