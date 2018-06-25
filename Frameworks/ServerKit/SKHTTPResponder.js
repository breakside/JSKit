// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPResponderContext.js"
// #import "ServerKit/SKHTTPError.js"
// #import "ServerKit/SKHTTPResponse.js"
// #import "Hash/Hash.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSMIMEHeaderMap, JSSHA1Hash, SKHTTPResponder, SKHTTPResponse, SKHTTPResponderContext, SKHTTPError, jslog_create */
'use strict';

(function(){

var logger = jslog_create("http.server");

JSClass("SKHTTPResponder", JSObject, {

    request: JSReadOnlyProperty('_request', null),
    context: JSReadOnlyProperty('_context', null),
    _isWebsocket: false,

    initWithRequest: function(request, context){
        this._request = request;
        this._context = context;
    },

    fail: function(error){
        if (this._isWebsocket){
            this._request.close();
        }else{
            SKHTTPResponder.fail(this._request, error);
        }
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
            logger.warn("Unexpected websocket version: %s".sprintf(version));
            throw new SKHTTPError(SKHTTPResponse.StatusCode.badRequest);
        }
        var requestedProtocols = requestHeaders.get('Sec-WebSocket-Protocol', '').trimmedSplit(',');
        var protocol = findFirstMatch(allowedProtocols, requestedProtocols);
        if (protocol === null){
            logger.warn("No match for protocols: %s".sprintf(requestedProtocols.join(", ")));
            throw new SKHTTPError(SKHTTPResponse.StatusCode.badRequest);
        }

        logger.info("Accepting websocket");
        var key = requestHeaders.get('Sec-WebSocket-Key', '');
        var accept = JSSHA1Hash((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").utf8().bytes).base64StringRepresentation();
        var upgradeHeaders = JSMIMEHeaderMap();
        upgradeHeaders.add("Upgrade", "websocket");
        upgradeHeaders.add("Connection", "Upgrade");
        upgradeHeaders.add("Sec-WebSocket-Accept", accept);
        upgradeHeaders.add("Sec-WebSocket-Protocol", protocol);
        this._request.upgrade("Web Socket Protocol Handshake", upgradeHeaders);
        this._isWebsocket = true;
        return this._request.createWebsocket();
    }

});

SKHTTPResponder.fail = function(request, error){
    var statusCode = SKHTTPResponse.StatusCode.internalServerError;
    if (error instanceof SKHTTPError){
        statusCode = error.statusCode;
    }else{
        statusCode = SKHTTPResponse.StatusCode.internalServerError;
        try {
            logger.error("Uncaught error handling '%s': %s".sprintf(request.url, error.message));
            if (error.stack){
                var lines = error.stack.split("\n");
                for (var i = 0, l = lines.length; i < l; ++i){
                    logger.error(lines[i]);
                }
            }
        }catch(e){
        }
    }
    var response = request.response;
    if (response){
        response.statusCode = statusCode;
        response.complete();
    }else{
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Length", "0");
        request.respond(statusCode, "", headers);
        request.close();
    }
};

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