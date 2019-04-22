// #import "SKHTTPResponder.js"
/* global require, JSDate, SKHTTPResponder, SKHTTPResponse */
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