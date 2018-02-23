// #import "Foundation/Foundation.js"
// #import "Hash/Hash.js"
/* global JSClass, JSObject, JSData, JSReadOnlyProperty, JSURL, JSMIMEHeaderMap, JSSHA1Hash, jslog_create */
'use strict';

var logger = jslog_create("http.server");

var findFirstMatch = function(a, b){
    for (var i = 0, l = a.length; i < l; ++i){
        for (var j = 0, k = b.length; j < k; ++j){
            if (a[i] == b[j].trim()){
                return a[i];
            }
        }
    }
    return null;
};

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

    acceptWebSocketUpgrade: function(allowedProtocols){
        var version = this._headerMap.get('Sec-WebSocket-Version');
        if (version !== "13"){
            logger.warn("Unexpected websocket version: %s".sprintf(version));
            this._close();
            return null;
        }
        var requestedProtocols = this._headerMap.get('Sec-WebSocket-Protocol', '').trimmedSplit(',');
        var protocol = findFirstMatch(allowedProtocols, requestedProtocols);
        if (protocol === null){
            logger.warn("No match for protocols: %s".sprintf(requestedProtocols.join(", ")));
            this._close();
            return null;
        }
        var key = this._headerMap.get('Sec-WebSocket-Key', '');
        var accept = JSSHA1Hash((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").utf8().bytes).base64StringRepresentation();
        var handshake = [
            "HTTP/1.1 101 Web Socket Protocol Handshake",
            "Upgrade: websocket",
            "Connection: Upgrade",
            "Sec-WebSocket-Accept: %s".sprintf(accept),
            "Sec-WebSocket-Protocol: %s".sprintf(protocol)
        ];
        logger.info("Accepting websocket");
        this._writeRawHeaders(handshake);
        return this.createWebsocket(handshake);
    },

    rejectUpgrade: function(statusCode){
        var response = [
            "HTTP/1.1 %d".sprintf(statusCode),
            "Content-Length: 0"
        ];
        this._writeRawHeaders(response);
        this._close();
    },

    _writeRawHeaders: function(headers){
        this._write(headers.join("\r\n") + "\r\n\r\n");
    },

    createWebsocket: function(){
    },

    _write: function(){
    },

    _close: function(){
    }

});