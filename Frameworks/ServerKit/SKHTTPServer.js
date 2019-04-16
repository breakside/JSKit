// #import Foundation
// #import "ServerKit/SKHTTPRoute.js"
// #import "ServerKit/SKHTTPError.js"
// #import "ServerKit/SKHTTPResponder.js"
/* global JSClass, JSObject, JSProtocol, JSDynamicProperty, JSMIMEHeaderMap, SKHTTPResponse, SKHTTPResponder, SKHTTPRoute, SKHTTPServer, SKHTTPError, JSLog */
'use strict';

var logger = JSLog("server", "http");

JSProtocol("SKHTTPServerDelegate", JSProtocol, {

    serverDidCreateContextForRequest: function(server, context, request){},
    serverDidCreateResponder: function(server, responder){}

});

JSClass("SKHTTPServer", JSObject, {

    port: JSDynamicProperty('_port', 0),
    rootRoute: null,
    notFoundRoute: null,
    _nodeHttpServer: null,
    delegate: null,

    initWithPort: function(port){
        this._port = port;
        this._extensionInit();
    },

    initWithSpec: function(spec, values){
        SKHTTPServer.$super.initWithSpec.call(this, spec, values);
        this.rootRoute = SKHTTPRoute.CreateFromMap(values.routes, spec);
        this._extensionInit();
        this.contextProperties = {};
    },

    _extensionInit: function(){
    },

    run: function(){
    },

    handleRequest: function(request){
        logger.info("%{public} %{public}", request.method, request.url.path);
        var responder = null;
        try{

            // 1. Create a responder for the request
            responder = this._responderForRequest(request);

            // 2. Find the method to call on the responder
            var method = responder.objectMethodForRequestMethod(request.method);
            if (method === null){
                logger.warn("Method not supported %{public}", request.method);
                throw new SKHTTPError(SKHTTPResponse.StatusCode.methodNotAllowed);
            }

            // 3. Authenticate the request
            responder.authenticate(function(authorized, authenticated, statusCode){
                if (!authorized){
                    if (authenticated !== null){
                        responder.fail(new SKHTTPError(statusCode || SKHTTPResponse.StatusCode.forbidden));
                        return;
                    }
                    responder.fail(new SKHTTPError(statusCode || SKHTTPResponse.StatusCode.unauthorized));
                    return;
                }
                responder.context.authenticated = authenticated;

                // 4. Open the context
                responder.context.open(function(status){
                    if (status){
                        responder.fail(new SKHTTPError(status));
                    }else{
                        try{

                            // 5. Call the request method
                            var promise = method.call(responder);
                            if (promise && promise.catch){
                                promise.catch(function(e){
                                    if (e instanceof Error){
                                        logger.error(e);
                                    }
                                    responder.fail(e);
                                });
                            }
                        }catch (e){
                            if (e instanceof Error){
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
                this._failRequest(request, e);
            }
        }
    },

    _responderForRequest: function(request){
        var context = null;
        var routeInfo = null;
        var route = null;
        var responder = null;

        // 1. Find a route that matches the request path
        if (this.rootRoute !== null){
            routeInfo = this.rootRoute.routeInfoForRequest(request);
        }
        if (routeInfo === null || routeInfo.route === null){
            logger.warn("No route for request (404)");
            throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
        }
        route = routeInfo.route;

        // 2. Create a request context, if applicable
        context = route.contextWithMatches(routeInfo.matches);
        if (context !== null){
            if (this.delegate && this.delegate.serverDidCreateContextForRequest){
                this.delegate.serverDidCreateContextForRequest(this, context, request);
            }
        }

        // 3. Create a responder
        responder = route.responderWithRequest(request, context);
        if (responder === null){
            logger.warn("No responder for request (404)");
            throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
        }
        if (this.delegate && this.delegate.serverFoundResponder){
            this.delegate.serverFoundResponder(this, responder);
        }

        return responder;
    },

    handleUpgrade: function(request){
        var product = request.headerMap.get('upgrade', '');
        logger.info("%{public} %{public} (upgrade: %{public})", request.method, request.url.path, product);
        var responder = null;
        try{
            // 1. Create a responder for the request
            responder = this._responderForRequest(request);

            // 2. Find the websocket method to call
            var method = responder.objectMethodForWebsocketProduct(product);
            if (method === null){
                logger.warn("Product not supported");
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }

            // NOTE: Browsers don't send authentication or custom headers
            // as part of a websocket request, so we cannot do any
            // authentication automatically.  It's up to each websocket
            // responder to do its own authentication.  Suggest using a
            // one-time-use token in the query string.

            // 3. Open the context
            responder.context.open(function(status){
                if (status){
                    responder.fail(new SKHTTPError(status));
                }else{
                    try{
                        // 4. Call the request method to open a socket
                        method.call(responder);
                    }catch (e){
                        responder.fail(e);
                    }
                }
            }, this);
        }catch (e){
            if (!(e instanceof SKHTTPError)){
                logger.error(e);
            }
            if (responder !== null){
                responder.fail(e);
            }else{
                this._failRequest(request, e);
            }
        }
    },

    _failRequest: function(request, error){
        var statusCode = SKHTTPResponse.StatusCode.internalServerError;
        if (error instanceof SKHTTPError){
            statusCode = error.statusCode;
        }
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Length", "0");
        request.respond(statusCode, "", headers);
        request.close();
    }

});