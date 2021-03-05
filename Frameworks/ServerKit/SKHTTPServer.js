// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
    healthCheckPath: "/.health-check",

    initWithPort: function(port){
        this._port = port;
        this._extensionInit();
    },

    initWithSpec: function(spec){
        SKHTTPServer.$super.initWithSpec.call(this, spec);
        this.delegate = spec.valueForKey("delegate");
        var routes = spec.unmodifiedValueForKey("routes");
        this.rootRoute = SKHTTPRoute.CreateFromMap(routes, spec.bundle);
        this._extensionInit();
        this.contextProperties = {};
        if (spec.containsKey("healthCheckPath")){
            this.healthCheckPath = spec.valueForKey("healthCheckPath");
        }
    },

    _extensionInit: function(){
    },

    run: function(){
    },

    handleRequest: function(request, completion, target){
        if (!completion){
            completion = Promise.completion();
        }

        var responder = null;
        var server = this;

        var catcher = function(error){
            if (error && !(error instanceof SKHTTPError) && !(error instanceof SKValidatingObject.Error)){
                logger.error("%{public} %{error}", request.tag, error);
            }
            var errorResonder = responder || SKHTTPResponder.initWithRequest(request);
            return errorResonder.fail(error) || Promise.resolve();
        };

        var finish = function(){
            try{
                if (server.delegate && server.delegate.serverDidRespondToRequest){
                    server.delegate.serverDidRespondToRequest(server, request);
                }
            }catch(e){
                logger.error(e);
            }
            completion.call(target);
        };

        // Health check requests get processed before any logging, otherwise logs get
        // spammed with frequent health checks
        if (this.healthCheckPath !== null && request.method.lowercaseString() == "get" && request.url.path == this.healthCheckPath){
            try{
                request.response.loggingEnabled = false;
                request.response.contentLength = 0;
                request.response.statusCode = SKHTTPResponse.StatusCode.ok;
                request.response.complete();
            }catch (e){
                logger.error(e);
                catcher(e);
            }
            completion.call(target);
            return completion.promise;
        }

        logger.info("%{public} %{public} %{public}%{public}", request.tag, request.method, request.url.path, request.url.encodedQuery ? "?..." : "");

        try{
            if (server.delegate && server.delegate.serverDidReceiveRequest){
                server.delegate.serverDidReceiveRequest(server, request);
            }
        }catch(e){
            logger.error(e);
        }

        try{

            // 1. Find a route for the request
            var routeMatch = this.rootRoute.routeMatchForRequest(request);
            if (routeMatch === null){
                logger.warn("%{public} %{public} %{public} No route for request", request.tag, request.method, request.url.path);
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }


            // 2. Create a request context, if applicable
            var context = routeMatch.route.contextWithMatches(routeMatch.matches);
            if (context !== null){
                if (this.delegate && this.delegate.serverDidCreateContextForRequest){
                    this.delegate.serverDidCreateContextForRequest(this, context, request);
                }
            }

            // 3. Create a responder
            responder = routeMatch.route.responderWithRequest(request, context);
            if (responder === null){
                logger.warn("%{public} No responder for request", request.tag);
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }
            if (this.delegate && this.delegate.serverFoundResponder){
                this.delegate.serverFoundResponder(this, responder);
            }

            // 4. Find the method to call on the responder
            var method = responder.applicableObjectMethod();
            if (method === null){
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
                if (responder.context !== null){
                    responder.context.authenticated = authenticated;
                    return responder.context.open();
                }

            // 5. Call the method
            }).then(function(){
                return method.call(responder);

            // 6. Error Handling & Metrics
            }).catch(catcher).then(finish);
        }catch (e){
            catcher(e).then(finish);
        }
        return completion.promise;
    }

});