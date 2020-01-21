// #import Foundation
// #import "SKHTTPResponse.js"
// #import "SKValidatingObject.js"
/* global JSClass, JSDate, JSLazyInitProperty, JSObject, JSData, JSReadOnlyProperty, JSURL, JSMIMEHeaderMap, SKHTTPResponse, JSLog, JSMediaType, SKValidatingObject */
'use strict';

var logger = JSLog("server", "http");

JSClass("SKHTTPRequest", JSObject, {

    url: JSReadOnlyProperty('_url', null),
    response: JSReadOnlyProperty('_response', null),
    headerMap: JSReadOnlyProperty('_headerMap', null),
    method: JSReadOnlyProperty('_method', null),
    contentType: JSLazyInitProperty('_getContentType'),
    origin: JSLazyInitProperty('_getOrigin'),

    initWithMethodAndURL: function(method, url){
        this._method = method;
        this._url = url;
        this._headerMap = JSMIMEHeaderMap();
    },

    _getContentType: function(){
        var header = this.headerMap.get('Content-Type');
        return JSMediaType(header);
    },

    _getMethod: function(){
        return this._method;
    },

    _getOrigin: function(){
        return this.headerMap.get('Origin', null);
    },

    respond: function(statusCode, statusMessage, headerMap){
        this._write("HTTP/1.1 %d %s\r\n".sprintf(statusCode, statusMessage));
        var header;
        for (var i = 0, l = headerMap.headers.length; i < l; ++i){
            header = headerMap.headers[i];
            this._write("%s\r\n".sprintf(header));
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
    },

    getData: function(completion, target){
    },

    getObject: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!this.contentType || this.contentType.mime !== 'application/json' || this.contentType.parameters.charset !== String.Encoding.utf8){
            completion.call(target, null);
            return completion.promise;
        }
        this.getData(function(data){
            if (data === null){
                completion.call(target, null);
                return;
            }
            var json = String.initWithData(data, this.contentType.parameters.charset);
            var obj = null;
            try{
                obj = JSON.parse(json);
            }catch (e){
            }
            completion.call(target, obj);
        }, this);
        return completion.promise;
    },

    getValidatingObject: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.getObject(function(obj){
            var validator = SKValidatingObject.initWithObject(obj);
            completion.call(target, validator);
        });
        return completion.promise;
    },

    getValidObject: function(validatingClass, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.getValidatingObject(function(obj){
            var validator = SKValidatingObject.initWithObject(obj);
            var valid = validatingClass.initWithValidatingObject(validator);
            completion.call(target, valid);
        });
        return completion.promise;

    }

});