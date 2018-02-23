// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPRoute.js"
/* global JSClass, JSObject, JSDynamicProperty, SKHTTPResponse, SKHTTPRoute, SKHTTPServer, jslog_create */
'use strict';

var logger = jslog_create("http.server");

JSClass("SKHTTPServer", JSObject, {

    port: JSDynamicProperty('_port', 0),
    rootRoute: null,
    notFoundRoute: null,
    _nodeHttpServer: null,

    initWithPort: function(port){
        this._port = port;
        this._extensionInit();
    },

    initWithSpec: function(spec, values){
        SKHTTPServer.$super.initWithSpec.call(this, spec, values);
        this.rootRoute = SKHTTPRoute.CreateFromMap(values.routes, spec);
        this._extensionInit();
    },

    _extensionInit: function(){
    },

    run: function(){
    },

    _handleRequest: function(request){
        logger.info("%s %s".sprintf(request.method, request.url));
        var responder = null;
        if (this.rootRoute !== null){
            responder = this.rootRoute.responderForRequest(request);
        }
        if (responder === null){
            logger.warn("> Not found");
            request.response.statusCode = SKHTTPResponse.StatusCode.NotFound;
            // TODO: not found content
            request.response.complete();
            return;
        }
        var method = request.method.lowercaseString();
        if (!responder[method]){
            logger.warn("> Method not supported %s");
            request.response.statusCode = SKHTTPResponse.StatusCode.MethodNotAllowed;
            // TODO: not found (method not supported?) content
            request.response.complete();
            return;
        }
        // TODO: access control
        responder[method]();
        request.response.complete();
    },

    _handleUpgrade: function(request){
        var product = request.headerMap.get('upgrade', '').lowercaseString();
        logger.info("%s %s (upgrade: %s)".sprintf(request.method, request.url, product));
        var responder = null;
        if (this.rootRoute !== null){
            responder = this.rootRoute.responderForRequest(request);
        }
        if (responder === null){
            logger.warn("> Not found");
            request.rejectUpgrade(SKHTTPResponse.StatusCode.NotFound);
            // TODO: not found content
            return;
        }
        if (!responder[product]){
            logger.warn("> Product not supported");
            request.rejectUpgrade(SKHTTPResponse.StatusCode.NotFound);
            // TODO: not found content
            return;
        }
        // TODO: access control
        responder[product]();
    }

});