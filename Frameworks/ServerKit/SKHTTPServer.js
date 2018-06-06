// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPRoute.js"
// #import "ServerKit/SKHTTPError.js"
/* global JSClass, JSObject, JSDynamicProperty, SKHTTPResponse, SKHTTPRoute, SKHTTPServer, SKHTTPError, jslog_create */
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
        try{
            if (this.rootRoute !== null){
                responder = this.rootRoute.responderForRequest(request);
            }
            if (responder === null){
                logger.warn("> No responder for request (404)");
                request.response.statusCode = SKHTTPResponse.StatusCode.notFound;
                // TODO: not found content
            }else{
                var method = request.method.lowercaseString();
                if (!responder[method]){
                    logger.warn("> Method not supported %s");
                    request.response.statusCode = SKHTTPResponse.StatusCode.methodNotAllowed;
                    // TODO: not found (method not supported?) content
                }else{
                    // TODO: access control
                    responder[method]();
                }
            }
        }catch (e){
            if (e instanceof SKHTTPError){
                request.response.statusCode = e.statusCode;
            }else{
                request.response.statusCode = SKHTTPResponse.StatusCode.internalServerError;
                logger.error("Uncaught error handling '%s': %s".sprintf(request.url, e.message));
                if (e.stack){
                    var lines = e.stack.split("\n");
                    for (var i = 0, l = lines.length; i < l; ++i){
                        logger.error(lines[i]);
                    }
                }
            }
        }finally{
            request.response.complete();
        }
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
            request.rejectUpgrade(SKHTTPResponse.StatusCode.notFound);
            // TODO: not found content
            return;
        }
        if (!responder[product]){
            logger.warn("> Product not supported");
            request.rejectUpgrade(SKHTTPResponse.StatusCode.notFound);
            // TODO: not found content
            return;
        }
        // TODO: access control
        responder[product]();
    }

});