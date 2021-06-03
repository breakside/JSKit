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
// #import "SKHTTPResponderContext.js"
// #import "SKHTTPError.js"
// #import "SKHTTPResponse.js"
// #import "SKValidatingObject.js"
// #import "SKHTTPAuthorization.js"
'use strict';

(function(){

JSClass("SKHTTPResponder", JSObject, {

    contextClass: null,

    request: JSReadOnlyProperty('_request', null),
    context: JSReadOnlyProperty('_context', null),
    response: JSReadOnlyProperty('_response', null),
    allowedOrigins: null,
    route: null,
    server: null,

    initWithRequest: function(request, context){
        this._request = request;
        this._context = context;
        this._response = request ? request.response : null;
        this.allowedOrigins = {};
    },

    authenticate: function(completion, target){
        return Promise.resolve(SKHTTPAuthorization(true));
    },

    options: function(){
        this._setAccessHeaders();
        this.sendStatus(SKHTTPResponse.StatusCode.ok);
    },

    fail: function(error){
        if (error instanceof SKValidatingObject.Error){
            this.sendObject({invalid: error.info}, SKHTTPResponse.StatusCode.badRequest);
            return;
        }
        var statusCode = SKHTTPResponse.StatusCode.internalServerError;
        if (error instanceof SKHTTPError){
            statusCode = error.statusCode;
            if (error.object !== null){
                this.sendObject(error.object, statusCode);
                return;
            }
        }
        if (statusCode === SKHTTPResponse.StatusCode.noResponse || statusCode === SKHTTPResponse.StatusCode.unknown){
            this.request.close();
        }else{
            this.sendStatus(statusCode);
        }
    },

    urlForResponder: function(responder, params){
        var url = JSURL.init();
        url.scheme = this.request.url.scheme;
        url.host = this.request.url.host;
        url.port = this.request.url.port;
        url.pathComponents = this.route.pathComponentsForResponder(responder, params);
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

    objectMethodForUpgrade: function(product){
        return this.objectMethodForRequestMethod(product);
    },

    applicableObjectMethod: function(){
        var method = null;
        var upgrade = this.request.headerMap.get('Upgrade', null);
        if (upgrade !== null){
            method = this.objectMethodForUpgrade(upgrade);
            if (method !== null){
                return method;
            }
        }
        return this.objectMethodForRequestMethod(this.request.method);
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
        this.sendData(str.utf8(), contentType + "; charset=utf-8", status);
    },

    sendObject: function(obj, status, indent){
        var json = JSON.stringify(obj, null, indent ? 2 : 0);
        this.response.headerMap.set("Cache-Control", "no-cache");
        this.response.headerMap.set("Expires", "Thu, 01 Jan 1970 00:00:01 GMT");
        this.sendString(json + "\n", "application/json", status);
    },

    sendStatus: function(status){
        this._setAccessHeaders();
        this.response.contentLength = 0;
        this.response.statusCode = status;
        this.response.complete();
    },

    sendRedirect: function(destination){
        if (destination instanceof JSURL){
            destination = destination.encodedString;
        }
        this._setAccessHeaders();
        this.response.headerMap.set("Location", destination);
        this.sendStatus(SKHTTPResponse.StatusCode.found);
    },

    sendFile: function(filePath, contentType, hash, statusCode){
        return Promise.reject(new Error("not implemented"));
    },

    sendResourceNamed: function(name, type, statusCode, bundle){
        if (statusCode instanceof JSBundle){
            bundle = statusCode;
            statusCode = undefined;
        }
        bundle = bundle || JSBundle.mainBundle;
        var metadata = bundle.metadataForResourceName(name, type);
        return this.sendResource(metadata, statusCode);
    },

    sendResource: function(metadata, statusCode){
        return Promise.reject(new Error("not implemented"));
    },

    addAllowedOrigin: function(origin, methods, headers){
        if (methods === undefined){
            methods = ["*"];
        }
        if (headers === undefined){
            headers = ["Authorization", "Content-Type"];
        }
        this.allowedOrigins[origin] = {
            methods: methods,
            headers: headers
        };
    },

    _setAccessHeaders: function(){
        var origin = this.request.origin;
        if (origin){
            var allowed = this.allowedOrigins[origin];
            if (!allowed){
                origin = "*";
                allowed = this.allowedOrigins[origin];
            }
            if (allowed){
                this.response.headerMap.set("Access-Control-Allow-Origin", origin);
                if (origin != "*"){
                    this.response.headerMap.set("Vary", "Origin");
                }
                if (this.request.headerMap.get('Access-Control-Request-Method', null) !== null){
                    this.response.headerMap.set("Access-Control-Allow-Methods", allowed.methods.join(", "));
                }
                if (this.request.headerMap.get('Access-Control-Request-Headers', null) !== null){
                    this.response.headerMap.set("Access-Control-Allow-Headers", allowed.headers.join(", "));
                }
                if (this.request.method == "OPTIONS"){
                    this.response.headerMap.set("Access-Control-Max-Age", 60 * 60);
                }
            }
        }
    },

});

})();