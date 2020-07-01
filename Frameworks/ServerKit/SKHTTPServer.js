// #import Foundation
// #import "SKHTTPRoute.js"
// #import "SKHTTPError.js"
// #import "SKHTTPResponder.js"
'use strict';

var logger = JSLog("serverkit", "http");

JSProtocol("SKHTTPServerDelegate", JSProtocol, {

    serverDidCreateContextForRequest: function(server, context, request){},
    serverFoundResponder: function(server, responder){}

});

JSClass("SKHTTPServer", JSObject, {

    port: JSDynamicProperty('_port', 0),
    rootRoute: null,
    delegate: null,

    initWithPort: function(port){
        this._port = port;
        this._extensionInit();
    },

    initWithSpec: function(spec){
        SKHTTPServer.$super.initWithSpec.call(this, spec);
        this.delegate = spec.valueForKey("delegate");
        var routes = spec.unmodifiedValueForKey("routes");
        this.rootRoute = SKHTTPRoute.CreateFromMap(routes, spec);
        this._extensionInit();
        this.contextProperties = {};
    },

    _extensionInit: function(){
    },

    run: function(){
    },

    handleRequest: function(request){
        this._fillInRequestURL(request);
        logger.info("%{public} %{public}", request.method, request.url.path);
        var responder = null;
        var server = this;
        var catcher = function(e){
            if (!(e instanceof SKHTTPError) && !(e instanceof SKValidatingObject.Error)){
                logger.error(e);
            }
            if (responder !== null){
                responder.fail(e);
            }else{
                server._failRequest(request, e);
            }
        };
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
            responder.authenticate().then(function(authorization){
                if (!authorization.authorized){
                    throw new SKHTTPError(authorization.statusCode);
                }
                return authorization.authenticated;

            // 4. Open the context
            }).then(function(authenticated){
                responder.context.authenticated = authenticated;
                return responder.context.open();

            // 5. Call the method
            }).then(function(){
                return method.call(responder);

            }).catch(catcher);
        }catch (e){
            catcher(e);
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
        this._fillInRequestURL(request);
        var product = request.headerMap.get('upgrade', '');
        logger.info("%{public} %{public} (upgrade: %{public})", request.method, request.url.path, product);
        var responder = null;
        var server = this;
        var catcher = function(e){
            if (!(e instanceof SKHTTPError)){
                logger.error(e);
            }
            if (responder !== null){
                responder.fail(e);
            }else{
                server._failRequest(request, e);
            }
        };
        try{
            // 1. Create a responder for the request
            responder = this._responderForRequest(request);

            // 2. Find the websocket method to call
            var method = responder.objectMethodForWebsocketProduct(product);
            if (method === null){
                logger.warn("Product not supported");
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }

            // 3. Authenticate the request
            responder.authenticate().then(function(authorization){
                if (!authorization.authorized){
                    responder.fail(new SKHTTPError(authorization.statusCode));
                    return;
                }
                return authorization.authenticated;

            // 4. Open the context
            }).then(function(authenticated){
                responder.context.authenticated = authenticated;
                return responder.context.open();

            // 4. Call the method
            }).then(function(){
                return method.call(responder);

            }).catch(catcher);
        }catch (e){
            catcher(e);
        }
    },

    _fillInRequestURL: function(request){
        var host = request.headerMap.get('Host', null);
        var scheme = request.headerMap.get('X-Forwarded-Proto', 'http');
        if (host !== null){
            request.url.host = host;
            request.url.scheme = scheme;
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