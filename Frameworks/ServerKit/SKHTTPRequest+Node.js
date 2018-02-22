// #import "ServerKit/SKHTTPRequest.js"
// #import "ServerKit/SKHTTPWebSocket+Node.js"
// #import "ServerKit/SKHTTPResponse+Node.js"
/* global SKHTTPRequest, SKHTTPResponse, JSURL, JSMIMEHeaderMap, SKHTTPWebSocket */
'use strict';

SKHTTPRequest.definePropertiesFromExtensions({

    _nodeRequest: null,

    initWithNodeRequest: function(nodeRequest, nodeResponse){
        this._nodeRequest = nodeRequest;
        this._headerMap = JSMIMEHeaderMap();
        for (var i = 0, l = this._nodeRequest.rawHeaders.length - 1; i < l; i += 2){
            this._headerMap.add(this._nodeRequest.rawHeaders[i], this._nodeRequest.rawHeaders[i + 1]);
        }
        if (nodeResponse){
            this._response = SKHTTPResponse.initWithNodeResponse(nodeResponse);
        }
        this._url = JSURL.initWithString(nodeRequest.url);
    },

    createWebsocket: function(){
        return SKHTTPWebSocket.initWithNodeSocket(this._nodeRequest.socket);
    },

    _write: function(str){
        this._nodeRequest.socket.write(str);
    },

    getMethod: function(){
        return this._nodeRequest.method;
    }

});