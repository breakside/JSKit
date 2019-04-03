// #import Foundation
// #import "ServerKit/SKHTTPResponse.js"
/* global JSClass, JSDate, JSObject, JSData, JSReadOnlyProperty, JSURL, JSMIMEHeaderMap, SKHTTPResponse, JSLog */
'use strict';

var logger = JSLog("server", "http");

JSClass("SKHTTPRequest", JSObject, {

    url: JSReadOnlyProperty('_url', null),
    response: JSReadOnlyProperty('_response', null),
    headerMap: JSReadOnlyProperty('_headerMap', null),
    method: JSReadOnlyProperty('_method', null),

    initWithMethodAndURL: function(method, url){
        this._method = method;
        this._url = url;
        this._headerMap = JSMIMEHeaderMap();
    },

    respond: function(statusCode, statusMessage, headerMap){
        this._write("HTTP/1.1 %d %s\r\n".sprintf(statusCode, statusMessage));
        var header;
        for (var i = 0, l = headerMap.headers.length; i < l; ++i){
            header = headerMap.headers[i];
            this._write("%s: %s\r\n".sprintf(header.name, header.value || ""));
        }
        this._write("\r\n");
    },

    upgrade: function(statusMessage, headerMap){
        this.respond(SKHTTPResponse.StatusCode.switchingProtocols, statusMessage, headerMap);
    },

    writeRawHeaders: function(headers){
        this._write(headers.join("\r\n") + "\r\n\r\n");
    },

    createWebsocket: function(){
    },

    _write: function(){
    },

    close: function(){
    },

    needsEntityWithTag: function(etag){
        if (!etag){
            return true;
        }
        var tags = this.headerMap.get('If-None-Match', '').split(',');
        var tag;
        for (var i = 0, l = tags.length; i < l; ++i){
            tag = tags[i].trim();
            if (tag === '*'){
                return false;
            }
            if (tag.startsWith('"') && tag.endsWith('"')){
                tag = tag.substr(1, tag.length - 2).replace('\\"', '"');
            }
            if (tag == etag){
                return false;
            }
        }
        return true;
    },

    needsEntityModifiedAt: function(lastModified){
        var ifModifiedSince = this.headerMap.get('If-Modified-Since', null);
        if (ifModifiedSince){
            var cutoffNative = new Date(ifModifiedSince);
            var cutoffNativeTimestamp = cutoffNative.getTime();
            if (!isNaN(cutoffNativeTimestamp)){
                var cutoff = JSDate.initWithTimeIntervalSince1970(cutoffNativeTimestamp / 1000);
                if (cutoff.compare(lastModified) >= 0){
                    return false;
                }
            }
        }
        return true;
    },

    needsEntity: function(lastModified, etag){
        if (etag){
            return this.needsEntityWithTag(etag) && this.needsEntityModifiedAt(lastModified);
        }
        return this.needsEntityModifiedAt(lastModified);
    }

});