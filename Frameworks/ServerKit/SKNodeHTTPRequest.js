// #import "SKHTTPRequest.js"
// #import "SKNodeHTTPWebSocket.js"
// #import "SKNodeHTTPResponse.js"
'use strict';

JSClass("SKNodeHTTPRequest", SKHTTPRequest, {

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
        this._method = this._nodeRequest.method;
    },

    createWebsocket: function(){
        return SKHTTPWebSocket.initWithNodeSocket(this._nodeRequest.socket);
    },

    _write: function(str){
        this._nodeRequest.socket.write(str);
    },

    close: function(){
        this._nodeRequest.socket.destroy();
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var chunks = [];
        this._nodeRequest.on('data', function(chunk){
            chunks.push(chunk);
        });
        this._nodeRequest.on('end', function(){
            completion.call(target, JSData.initWithChunks(chunks));
        });
        return completion.promise;
    }

});