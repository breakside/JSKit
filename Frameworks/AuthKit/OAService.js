// #imoprt Foundation
/* global JSClass, JSObject, OAService, JSBundle, JSURL, JSURLSession, JSURLResponse */
'use strict';

JSClass("OAService", JSObject, {

    initWithIdentifier: function(identifier){
        var bundle = JSBundle.initWithIdentifier('io.breakside.JSKit.AuthKit');
        var services = bundle.metadataForResourceName("Services").value;
        var info = services[identifier];
        if (!info){
            return null;
        }
        this.identifier = identifier;
        var endpointURL = JSURL.initWithString(info.endpoint);
        this.initWithEndpointURL(endpointURL);
    },

    initWithEndpointURL: function(endpointURL){
        this.discoveryURL = endpointURL.appendingPathComponents(['.well-known', 'openid-configuration']);
    },

    identifier: null,
    discoveryURL: null,
    _isLoaded: false,

    load: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (this._isLoaded){
            completion.call(target, true);
            return completion.promise;
        }
        var task = JSURLSession.shared.dataTaskWithURL(this.discoveryURL, function(error){
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
        var task = JSURLSession.shared.dataTaskWithURL(this.keysURL, function(error){
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