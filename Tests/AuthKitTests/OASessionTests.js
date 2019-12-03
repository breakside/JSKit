// #import AuthKit
// #import TestKit
/* global JSClass, TKTestSuite, OASession, OAService, JSURL */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals, TKAssertArrayEquals, TKExpectation */
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