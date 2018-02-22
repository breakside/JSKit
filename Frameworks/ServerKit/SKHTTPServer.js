// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPRoute.js"
/* global JSClass, JSObject, JSReadOnlyProperty, SKHTTPResponse, SKHTTPRoute, jslog_create */
'use strict';

var logger = jslog_create("http.server");

JSClass("SKHTTPServer", JSObject, {

    port: JSReadOnlyProperty('_port', 0),
    rootRoute: null,
    notFoundRoute: null,
    _nodeHttpServer: null,

    initWithPort: function(port){
        this._port = port;
        this.rootRoute = SKHTTPRoute.initWithFixedComponent('');
        this._extensionInit();
    },

    _extensionInit: function(){
    },

    run: function(){
    },

    _handleRequest: function(request){
        logger.info("%s %s".sprintf(request.method, request.url));
        var route = this.rootRoute.routeForPathComponents(request.url.pathComponents);
        if (route === null){
            logger.warn("> Not found");
            request.response.statusCode = SKHTTPResponse.StatusCode.NotFound;
            // TODO: not found content
            request.response.complete();
            return;
        }
        var method = request.method.lowercaseString();
        if (!route[method]){
            logger.warn("> Method not supported %s");
            request.response.statusCode = SKHTTPResponse.StatusCode.MethodNotAllowed;
            // TODO: not found (method not supported?) content
            request.response.complete();
            return;
        }
        // TODO: access control
        route[method](request);
        request.response.complete();
    },

    _handleUpgrade: function(request){
        var product = request.headerMap.get('upgrade', '').lowercaseString();
        logger.info("%s %s (upgrade: %s)".sprintf(request.method, request.url, product));
        var route = this.rootRoute.routeForPathComponents(request.url.pathComponents);
        if (route === null){
            logger.warn("> Not found");
            request.response.statusCode = SKHTTPResponse.StatusCode.NotFound;
            // TODO: not found content
            request.response.complete();
            return;
        }
        if (!route[product]){
            logger.warn("> Product not supported");
            request.response.statusCode = SKHTTPResponse.StatusCode.NotFound;
            // TODO: not found content
            request.response.complete();
            return;
        }
        // TODO: access control
        route[product](request);
    }

});