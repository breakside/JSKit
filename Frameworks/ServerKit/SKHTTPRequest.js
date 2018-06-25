// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPResponse.js"
/* global JSClass, JSObject, JSData, JSReadOnlyProperty, JSURL, JSMIMEHeaderMap, SKHTTPResponse, jslog_create */
'use strict';

var logger = jslog_create("http.server");

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
    }

});