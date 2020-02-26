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

// #import AuthKit
// #import TestKit
'use strict';

JSClass("OASessionTests", TKTestSuite, {

    testAuthenticationURL: function(){
        var service = OAService.google;
        var expectation = TKExpectation.init();
        expectation.call(service.load, service, function(){
            var session = OASession.initWithService(service, "myclientid");
            session.redirectURL = JSURL.initWithString('http://test.com/oauth');
            var url = session.authenticationURL;
            TKAssertEquals(url.scheme, 'https');
            TKAssertEquals(url.host, 'accounts.google.com');
            TKAssertEquals(url.path, '/o/oauth2/v2/auth');
            var query = url.query;
            TKAssertEquals(query.fields.length, 5);
            TKAssertEquals(query.get('client_id'), 'myclientid');
            TKAssertEquals(query.get('scope'), 'openid profile email');
            TKAssertEquals(query.get('state'), session.state);
            TKAssertEquals(query.get('response_type'), 'code');
            TKAssertEquals(query.get('redirect_uri'), 'http://test.com/oauth');

            session.scopes = ['openid'];
            session.responseTypes = ['id_token'];
            session.loginHint = 'test@test.com';
            url = session.authenticationURL;
            TKAssertEquals(url.scheme, 'https');
            TKAssertEquals(url.host, 'accounts.google.com');
            TKAssertEquals(url.path, '/o/oauth2/v2/auth');
            query = url.query;
            TKAssertEquals(query.fields.length, 7);
            TKAssertEquals(query.get('client_id'), 'myclientid');
            TKAssertEquals(query.get('scope'), 'openid');
            TKAssertEquals(query.get('state'), session.state);
            TKAssertEquals(query.get('response_type'), 'id_token');
            TKAssertEquals(query.get('redirect_uri'), 'http://test.com/oauth');
            TKAssertEquals(query.get('login_hint'), 'test@test.com');
            TKAssertEquals(query.get('nonce'), '1');
        });
        this.wait(expectation, 2);
    }

});