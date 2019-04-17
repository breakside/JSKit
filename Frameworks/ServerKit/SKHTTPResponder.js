// #import Foundation
// #import "ServerKit/SKHTTPResponderContext.js"
// #import "ServerKit/SKHTTPError.js"
// #import "ServerKit/SKHTTPResponse.js"
// #import "ServerKit/SKValidatingObject.js"
// #import Hash
/* global JSClass, JSObject, JSURL, JSReadOnlyProperty, JSMIMEHeaderMap, JSSHA1Hash, SKHTTPResponder, SKHTTPResponse, SKHTTPResponderContext, SKHTTPError, JSLog, SKValidatingObject */
'use strict';

(function(){

var logger = JSLog("server", "http");

JSClass("SKHTTPResponder", JSObject, {

    request: JSReadOnlyProperty('_request', null),
    context: JSReadOnlyProperty('_context', null),
    response: JSReadOnlyProperty('_response', null),
    allowedOrigins: null,
    route: null,
    _isWebsocket: false,

    initWithRequest: function(request, context){
        this._request = request;
        this._context = context;
        this._response = request ? request.response : null;
        this.allowedOrigins = {};
    },

    authenticate: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        completion.call(target, true, null);
        return completion.promise;
    },

    options: function(){
        this._setAccessHeaders();
        this.sendStatus(SKHTTPResponse.StatusCode.ok);
    },

    fail: function(error){
        if (this._isWebsocket){
            this._request.close();
            return;
        }
        if (error instanceof SKValidatingObject.Error){
            this.sendObject({error: error.message}, SKHTTPResponse.StatusCode.badRequest);
            return;
        }
        var statusCode = SKHTTPResponse.StatusCode.internalServerError;
        if (error instanceof SKHTTPError){
            statusCode = error.statusCode;
        }
        this.sendStatus(statusCode);
    },

    urlForResponder: function(responder, params){
        var url = JSURL.init();
        url.scheme = this.request.url.scheme;
        url.host = this.request.url.host;
        url.port = this.request.url.port;
        url.setPathComponents = this.route.pathComponentsForResponder(responder, params);
        return url;
    },

    objectMethodForRequestMethod: function(requestMethod){
        // Since request.metod is entirely in the caller's control, and since we'll
        // use it to invoke a matching method name on the responder, we need to sanity check
        // the method name so we don't end up calling unexpected/private methods
        // - Disallow calls to base class methods/properties.  The base class does not provide implementations for any http method,
        //   This means the only methods that may be called are ones that are defined in subclasses
        // - Disallow calls to any method starting with underscore.  This provides subclasses with an easy way to have
        //   helper methods that can never be directly invoked.
        // - By nature of using the lowercase method, any sublcass methods named with camelCase cannot be called directly
        var methodName = requestMethod.toLowerCase();
        if (methodName.startsWith('_')){
            return null;
        }
        if (methodName == 'options'){
            return this.options;
        }
        if (methodName in SKHTTPResponder.prototype){
            return null;
        }
        return this[methodName] || null;
    },

    objectMethodForWebsocketProduct: function(product){
        return this.objectMethodForRequestMethod(product);
    },

    acceptWebSocketUpgrade: function(allowedProtocols){
        var requestHeaders = this._request.headerMap;
        var version = requestHeaders.get('Sec-WebSocket-Version');
        if (version !== "13"){
            logger.warn("Unexpected websocket version: %{public}". version);
            throw new SKHTTPError(SKHTTPResponse.StatusCode.badRequest);
        }
        var requestedProtocols = requestHeaders.get('Sec-WebSocket-Protocol', '').trimmedSplit(',');
        var protocol = findFirstMatch(allowedProtocols, requestedProtocols);
        if (protocol === null){
            logger.warn("No match for protocols: %{public}". requestedProtocols.join(", "));
            throw new SKHTTPError(SKHTTPResponse.StatusCode.badRequest);
        }

        logger.info("Accepting websocket");
        var key = requestHeaders.get('Sec-WebSocket-Key', '');
        var accept = JSSHA1Hash((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").utf8()).base64StringRepresentation();
        var upgradeHeaders = JSMIMEHeaderMap();
        upgradeHeaders.add("Upgrade", "websocket");
        upgradeHeaders.add("Connection", "Upgrade");
        upgradeHeaders.add("Sec-WebSocket-Accept", accept);
        upgradeHeaders.add("Sec-WebSocket-Protocol", protocol);
        this._request.upgrade("Web Socket Protocol Handshake", upgradeHeaders);
        this._isWebsocket = true;
        logger.info("Creating websocket");
        return this._request.createWebsocket();
    },

    sendData: function(data, contentType, status){
        if (status === undefined){
            status = SKHTTPResponse.StatusCode.ok;
        }
        this._setAccessHeaders();
        this.response.statusCode = status;
        this.response.contentType = contentType;
        this.response.contentLength = data.length;
        this.response.writeData(data);
        this.response.complete();
    },

    sendString: function(str, contentType, status){
        this.sendData(str.utf8(), contentType, status);
    },

    sendObject: function(obj, status, indent){
        var json = JSON.stringify(obj, null, indent ? 2 : 0);
        this.response.setHeader("Cache-Control", "no-cache");
        this.response.setHeader("Expires", "Thu, 01 Jan 1970 00:00:01 GMT");
        this.sendString(json + "\n", "application/json; charset=utf8", status);
    },

    sendStatus: function(status){
        this._setAccessHeaders();
        this.response.contentLength = 0;
        this.response.statusCode = status;
        this.response.complete();
    },

    sendRedirect: function(destination){
        this._setAccessHeaders();
        this.response.statusCode = SKHTTPResponse.StatusCode.found;
        this.response.setHeader("Location", destination);
    },

    sendFile: function(filePath, contentType, hash){
    },

    _setAccessHeaders: function(){
        var origin = this.request.origin;
        if (origin){
            var allowed = this.allowedOrigins[origin];
            if (allowed){
                this.response.setHeader("Access-Control-Allow-Origin", origin);
                if (origin != "*"){
                    this.response.setHeader("Vary", "Origin");
                }
                if (this.request.headerMap.get('Access-Control-Request-Method', null) !== null){
                    this.response.setHeader("Access-Control-Allow-Methods", allowed.methods.join(", "));
                }
                if (this.request.headerMap.get('Access-Control-Request-Headers', null) !== null){
                    this.response.setHeader("Access-Control-Allow-Headers", allowed.headers.join(", "));
                }
                if (this.request.method == "OPTIONS"){
                    this.response.setHeader("Access-Control-Max-Age", 60 * 60);
                }
            }
        }
    }

});

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

})();