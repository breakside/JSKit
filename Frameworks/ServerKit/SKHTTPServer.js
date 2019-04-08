// #import Foundation
// #import "ServerKit/SKHTTPRoute.js"
// #import "ServerKit/SKHTTPError.js"
// #import "ServerKit/SKHTTPResponder.js"
/* global JSClass, JSObject, JSDynamicProperty, SKHTTPResponse, SKHTTPResponder, SKHTTPRoute, SKHTTPServer, SKHTTPError, JSLog */
'use strict';

var logger = JSLog("server", "http");

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
        logger.info("%{public} %{public}", request.method, request.url.path);
        var responder = null;
        try{
            if (this.rootRoute !== null){
                responder = this.rootRoute.responderForRequest(request);
            }
            if (responder === null){
                logger.warn("No responder for request (404)");
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }
            var method = responder.objectMethodForRequestMethod(request.method);
            if (method === null){
                logger.warn("Method not supported %{public}", request.method);
                throw new SKHTTPError(SKHTTPResponse.StatusCode.methodNotAllowed);
            }
            responder.authenticate(function(authentication){
                responder.context.authentication = authentication;
                responder.context.open(function(error){
                    if (error !== null){
                        responder.fail(error);
                    }else{
                        try{
                            method.call(responder);
                        }catch (e){
                            if (!(e instanceof SKHTTPError)){
                                logger.error(e);
                            }
                            responder.fail(e);
                        }
                    }
                }, this);
            }, this);
        }catch (e){
            if (!(e instanceof SKHTTPError)){
                logger.error(e);
            }
            if (responder !== null){
                responder.fail(e);
            }else{
                SKHTTPResponder.fail(request, e);
            }
        }
    },

    _handleUpgrade: function(request){
        var product = request.headerMap.get('upgrade', '');
        logger.info("%{public} %{public} (upgrade: %{public})", request.method, request.url.path, product);
        var responder = null;
        try{
            if (this.rootRoute !== null){
                responder = this.rootRoute.responderForRequest(request);
            }
            if (responder === null){
                logger.warn("Not found");
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }
            var method = responder.objectMethodForWebsocketProduct(product);
            if (method === null){
                logger.warn("Product not supported");
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }
            responder.context.open(function(error){
                if (error !== null){
                    responder.fail(error);
                }else{
                    try{
                        // TODO: access control here, as part of context.open, or both?
                        method.call(responder);
                    }catch (e){
                        responder.fail(e);
                    }
                }
            }, this);
        }catch (e){
            if (responder !== null){
                responder.fail(e);
            }else{
                SKHTTPResponder.fail(request, e);
            }
        }
    }

});