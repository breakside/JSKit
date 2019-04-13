// #import Foundation
// #import SecurityKit
// #import Hash
/* global JSClass, JSObject, JSCopy, JSReadOnlyProperty, JSFormFieldMap, JSURL, JSSHA1Hash, SECCipher, JSURLSession, JSURLRequest, JSURLResponse */
'use strict';

JSClass("OASession", JSObject, {

    initWithService: function(service, clientId){
        this.service = service;
        this.clientId = clientId;
        this.scopes = ['openid profile email'];
        this.responseTypes = ['code'];
        this.state = JSSHA1Hash(SECCipher.getRandomData(20)).hexStringRepresentation();
    },

    service: null,
    clientId: null,
    scopes: null,
    loginHint: null,
    state: null,
    redirectURL: null,
    responseTypes: null,
    nonce: 1,

    authenticationURL: JSReadOnlyProperty(),

    getAuthenticationURL: function(){
        var url = JSURL.initWithURL(this.service.authenticationURL);
        var query = new JSFormFieldMap();
        query.add('client_id', this.clientId);
        query.add('scope', this.scopes.join(' '));
        query.add('state', this.state);
        query.add('response_type', this.responseTypes.join(' '));
        if (this.responseTypes.indexOf('id_token') >= 0){
            query.add('nonce', this.nonce);
            ++this.nonce;
        }
        if (this.loginHint){
            query.add('login_hint', this.loginHint);
        }
        query.add('redirect_uri', this.redirectURL.encodedString);
        url.query = query;
        return url;
    },

    exchangeCodeForToken: function(code, clientSecret, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var url = JSURL.initWithString(this.service.tokenURL);
        var form = new JSFormFieldMap();
        form.set('code', code);
        form.set('client_id', this.clientId);
        form.set('client_secret', clientSecret);
        form.set('redirect_uri', this.redirectURL.encodedString);
        form.set('grant_type', 'authorization_code');
        var request = JSURLRequest.initWithURL(url);
        request.method = JSURLRequest.Method.POST;
        request.data = form.encode();
        var task = JSURLSession.shared.dataTaskWithRequest(request, function(error){
            if (error !== null){
                completion.call(target, null);
                return;
            }
            var response = task.response;
            if (response.statusClass != JSURLResponse.StatusClass.success){
                completion.call(target, null);
                return;
            }
            var payload = null;
            try{
                var json = task.response.data.stringByDecodingUTF8();
                payload = JSON.parse(json);
            }catch (e){
            }
            completion.call(target, payload);
        }, this);
        task.resume();
        return completion.promise;
    }

});