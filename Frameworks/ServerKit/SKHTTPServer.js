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
    strictTransportSecurityEnabled: true,
    tlsCertificate: null,
    tlsPrivateKey: null,
    defaultMaximumRequestContentLength: 1024 * 1024 * 2,
    notificationCenter: null,
    isStopping: false,
    _websocketClosePromises: null,

    initWithPort: function(port){
        this._port = port;
        this._extensionInit();
        this.notificationCenter = JSNotificationCenter.shared;
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
        if (spec.containsKey("strictTransportSecurityEnabled")){
            this.strictTransportSecurityEnabled = spec.valueForKey("strictTransportSecurityEnabled");
        }
        if (spec.containsKey("defaultMaximumRequestContentLength")){
            this.defaultMaximumRequestContentLength = spec.valueForKey("defaultMaximumRequestContentLength");
        }
        this.notificationCenter = JSNotificationCenter.shared;
    },

    _extensionInit: function(){
    },

    run: function(){
    },

    stop: function(completion, target){
    },

    handleRequest: function(request, completion, target){
        if (!completion){
            completion = Promise.completion();
        }

        var responder = null;
        var server = this;

        var catcher = function(error){
            if (error && !(error instanceof SKHTTPError) && !(error instanceof SKValidatingObject.Error)){
                request.logger.error(error);
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
                request.logger.error(e);
            }
            completion.call(target);
        };

        // Health check requests get processed before any logging, otherwise logs get
        // spammed with frequent health checks
        if (this.healthCheckPath !== null && request.url.path == this.healthCheckPath){
            try{
                request.logger.config.debug.enabled = false;
                request.logger.config.info.enabled = false;
                request.logger.config.log.enabled = false;
                request.response.contentLength = 0;
                if (request.method.lowercaseString() == "get"){
                    request.response.statusCode = SKHTTPResponse.StatusCode.ok;
                }else{
                    request.response.statusCode = SKHTTPResponse.StatusCode.methodNotAllowed;
                }
                request.response.complete();
            }catch (e){
                request.logger.error(e);
                catcher(e);
            }
            completion.call(target);
            return completion.promise;
        }

        try{
            request.logger.info("%{public} %{public}%{public} (%{public})", request.method, request.url.path, request.url.encodedQuery ? "?..." : "", request.clientIPAddress != null ? request.clientIPAddress.stringRepresentation() : "(unknown ip)");

            request.maximumContentLength = this.defaultMaximumRequestContentLength;

            if (this.strictTransportSecurityEnabled){
                request.response.headerMap.add("Strict-Transport-Security", "max-age=%d".sprintf(JSTimeInterval.hours(24) * 365));
            }

            try{
                if (server.delegate && server.delegate.serverDidReceiveRequest){
                    server.delegate.serverDidReceiveRequest(server, request);
                }
            }catch(e){
                request.logger.error(e);
            }

            // 1. Find a route for the request
            var routeMatch = this.rootRoute.routeMatchForRequest(request);
            if (routeMatch === null){
                if (this.delegate && this.delegate.serverRouteNotFoundForRequest){
                    this.delegate.serverRouteNotFoundForRequest(this, request);
                }
                request.logger.info("%{public} %{public} No route for request", request.method, request.url.path);
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
                request.logger.warn("No responder for request");
                throw new SKHTTPError(SKHTTPResponse.StatusCode.notFound);
            }
            responder.server = this;
            if (this.delegate && this.delegate.serverFoundResponder){
                this.delegate.serverFoundResponder(this, responder);
            }

            // 4. Find the method to call on the responder
            var method = responder.applicableObjectMethod();
            if (method === null){
                throw new SKHTTPError(SKHTTPResponse.StatusCode.methodNotAllowed);
            }

            if (request.method == "OPTIONS"){
                // 3. Call the method without authenticating or opening the
                //    context, allowing the preflight to succeed so the browser
                //    can make the actual request and get an appropriate error.
                //    (if the OPTIONS fails with a 401 or 404, for example, it
                //    will appear in the browser as a network error, which is
                //    not what the calling application is expecting)
                var promise = method.call(responder);
                if (!(promise instanceof Promise)){
                    promise = Promise.resolve();
                }
                promise.catch(catcher).then(finish);
            }else{
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
            }
        }catch (e){
            catcher(e).then(finish);
        }
        return completion.promise;
    },

});