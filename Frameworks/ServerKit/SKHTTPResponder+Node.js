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

    sendResource: function(metadata, statusCode){
        if (statusCode === undefined){
            statusCode = SKHTTPResponse.StatusCode.ok;
        }
        if (metadata === null){
            if (statusCode !== SKHTTPResponse.StatusCode.ok){
                // We're trying to send a non-ok code, like maybe an html
                // resource for a 400/404/500 page but can't find the
                // resource to send with it.  Make sure to still send the
                // intended code even though we can't find the resource.
                this.sendStatus(statusCode);
            }else{
                this.sendStatus(SKHTTPResponse.StatusCode.notFound);
            }
            return;
        }
        var path = JSBundle.getNodePath(metadata);
        this.sendFile(path, metadata.mimetype, metadata.hash, statusCode);
    },

    sendFile: function(filePath, contentType, hash, statusCode){
        if (statusCode === undefined){
            statusCode = SKHTTPResponse.StatusCode.ok;
        }
        this._setAccessHeaders();
        var responder = this;
        fs.stat(filePath, function(error, stat){
            if (error){
                if (statusCode !== SKHTTPResponse.StatusCode.ok){
                    // We're trying to send a non-ok code, like maybe an html
                    // resource for a 400/404/500 page but can't find the
                    // file to send with it.  Make sure to still send the
                    // intended code even though we can't find the file.
                    responder.sendStatus(statusCode);
                }else{
                    responder.sendStatus(SKHTTPResponse.StatusCode.notFound);
                }
            }else{
                responder._sendFileAfterStat(filePath, contentType, hash, stat, statusCode);
            }
        });
    },

    _sendFileAfterStat: function(filePath, contentType, hash, stat, statusCode){
        if (statusCode === undefined){
            statusCode = SKHTTPResponse.StatusCode.ok;
        }
        // If we're trying to send a 200, first check if we can instead
        // send a 304 not modified.
        //
        // If we're trying to send something else, like a 400/404/500 page,
        // never change to a 304.
        if (statusCode == SKHTTPResponse.StatusCode.ok){
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
            this.response.lastModified = lastModified;
        }
        this.response.contentType = contentType;
        this.response.contentLength = stat.size;
        this.response.statusCode = statusCode;
        this.response.writeFile(filePath);
    }

});