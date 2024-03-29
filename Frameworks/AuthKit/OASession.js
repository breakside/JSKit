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
// #import SecurityKit
'use strict';

JSClass("OASession", JSObject, {

    initWithService: function(service, clientId){
        this.service = service;
        this.clientId = clientId;
        this.scopes = ['openid', 'profile',  'email'];
        this.responseTypes = ['code'];
        this.state = JSSHA1Hash(SECCipher.getRandomData(20)).hexStringRepresentation();
        this.urlSession = service.urlSession;
    },

    service: null,
    clientId: null,
    scopes: null,
    loginHint: null,
    state: null,
    redirectURL: null,
    responseTypes: null,
    responseMode: "fragment",
    nonce: 1,
    urlSession: null,

    authenticationURL: JSReadOnlyProperty(),

    getAuthenticationURL: function(){
        var url = JSURL.initWithURL(this.service.authenticationURL);
        var query = new JSFormFieldMap();
        query.add('client_id', this.clientId);
        query.add('scope', this.scopes.join(' '));
        query.add('state', this.state);
        query.add('response_type', this.responseTypes.join(' '));
        query.add('response_mode', this.responseMode);
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
        var task = this.urlSession.dataTaskWithRequest(request, function(error){
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

OASession.ResponseMode = {
    query: "query",
    fragment: "fragment"
};