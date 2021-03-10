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
'use strict';

JSClass("OAService", JSObject, {

    initWithIdentifier: function(identifier, urlSession){
        var bundle = JSBundle.initWithIdentifier('io.breakside.JSKit.AuthKit');
        var services = bundle.metadataForResourceName("Services").value;
        var info = services[identifier];
        if (!info){
            return null;
        }
        this.identifier = identifier;
        var endpointURL = JSURL.initWithString(info.endpoint);
        this.initWithEndpointURL(endpointURL, urlSession);
    },

    initWithEndpointURL: function(endpointURL, urlSession){
        this.discoveryURL = endpointURL.appendingPathComponents(['.well-known', 'openid-configuration']);
        this.urlSession = urlSession || JSURLSession.shared;
    },

    identifier: null,
    discoveryURL: null,
    urlSession: null,
    _isLoaded: false,

    load: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (this._isLoaded){
            completion.call(target, true);
            return completion.promise;
        }
        var task = this.urlSession.dataTaskWithURL(this.discoveryURL, function(error){
            var response = task.response;
            if (!response || response.statusClass != JSURLResponse.StatusClass.success){
                completion.call(target, false);
                return;
            }
            var json = response.data.stringByDecodingUTF8();
            var info = JSON.parse(json);
            this.authenticationURL = JSURL.initWithString(info.authorization_endpoint);
            this.tokenURL = JSURL.initWithString(info.token_endpoint);
            this.keysURL = JSURL.initWithString(info.jwks_uri);
            this._isLoaded = true;
            completion.call(target, true);
        }, this);
        task.resume();
        return completion.promise;
    },

    keys: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.keysURL === null){
            completion.call(target, null);
            return completion.promise;
        }
        var task = this.urlSession.dataTaskWithURL(this.keysURL, function(error){
            var response = task.response;
            if (!response || response.statusClass != JSURLResponse.StatusClass.success){
                completion.call(target, false);
                return;
            }
            var json = response.data.stringByDecodingUTF8();
            var info = JSON.parse(json);
            completion.call(target, info.keys || null);
        });
        task.resume();
        return completion.promise;
    },

    authenticationURL: null,
    tokenURL: null,
    keysURL: null

});

Object.defineProperties(OAService, {
    google: {
        configurable: true,
        get: function(){
            var service = OAService.initWithIdentifier('google');
            Object.defineProperty(this, 'google', {value: service});
            return service;
        }
    },
    microsoft: {
        configurable: true,
        get: function(){
            var service = OAService.initWithIdentifier('microsoft');
            Object.defineProperty(this, 'microsoft', {value: service});
            return service;
        }
    }
});