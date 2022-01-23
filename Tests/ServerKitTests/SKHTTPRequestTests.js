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

// #import ServerKit
// #import TestKit
// #import "Mock.js"
'use strict';

JSClass("SKHTTPRequestTests", TKTestSuite, {

    testOrigin: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, []);
        TKAssertNull(request.origin);

        request = MockRequest.initMock("GET", url, [
            "Origin: http://localhost:8085"
        ]);
        TKAssertEquals(request.origin, "http://localhost:8085");
    },

    testContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, []);
        TKAssertNull(request.contentType);

        request = MockRequest.initMock("GET", url, [
            "Content-Type: application/json"
        ]);
        TKAssert(request.contentType instanceof JSMediaType);
        TKAssertEquals(request.contentType.mime, "application/json");

        request = MockRequest.initMock("GET", url, [
            "Content-Type: application/json; charset=utf-8"
        ]);
        TKAssert(request.contentType instanceof JSMediaType);
        TKAssertEquals(request.contentType.mime, "application/json");
        TKAssertEquals(request.contentType.parameters.charset, "utf-8");
    },

    testNeedsEntityWithTag: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, []);
        var needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(needsEntity);

        url = JSURL.initWithString("http://breakside.io/test/request");
        request = MockRequest.initMock("GET", url, [
            "If-None-Match: sdf, asd"
        ]);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(needsEntity);

        url = JSURL.initWithString("http://breakside.io/test/request");
        request = MockRequest.initMock("GET", url, [
            "If-None-Match: sdf, asd, asdf"
        ]);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(!needsEntity);

        url = JSURL.initWithString("http://breakside.io/test/request");
        request = MockRequest.initMock("GET", url, [
            'If-None-Match: sdf, asd, "asdf"'
        ]);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(!needsEntity);

        url = JSURL.initWithString("http://breakside.io/test/request");
        request = MockRequest.initMock("GET", url, [
            'If-None-Match: sdf, asd, *'
        ]);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(!needsEntity);
    },

    _testNeedsEntityModifiedAt: function(){

    },

    testGetObjectNullData: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [], null);
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectMissingContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
        ], '{"one": 1, "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectIncorrectContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
            'Content-Type: text/html',
        ], '{"one": 1, "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectMissingCharset: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
            "Content-Type: application/json"
        ], '{"one": 1, "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectBadCharset: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
            'Content-Type: application/json; charset=iso8859-1'
        ], '{"one": 1, "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectBadJSON: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
            'Content-Type: application/json; charset=utf-8'
        ], '{"one": "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObject: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
            'Content-Type: application/json; charset=utf-8'
        ], '{"one": 1, "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetValdiatingObject: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
            'Content-Type: application/json; charset=utf-8'
        ], '{"one": 1, "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getValidatingObject, request, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.integerForKey('one'), 1);
            TKAssertExactEquals(obj.stringForKey('two'), "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetValdiatingObjectNullObject: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, [
        ], '{"one": 1, "two": "2"}'.utf8());
        var expectation = TKExpectation.init();
        expectation.call(request.getValidatingObject, request, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.integerForKey('one', 0), 0);
            TKAssertExactEquals(obj.stringForKey('two', ''), "");
        }, this);
        this.wait(expectation, 1.0);
    },

    testClientIPAddress: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        var request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertNull(request.clientIPAddress);

        headers.set("X-Forwarded-For", "123.1.2.3");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertEquals(request.clientIPAddress.stringRepresentation(), "123.1.2.3");

        headers.set("X-Forwarded-For", "123.1.2.3,1.2.3.123");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertEquals(request.clientIPAddress.stringRepresentation(), "123.1.2.3");
    },

    testBearerToken: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        var request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertNull(request.bearerToken);

        headers.set("Authorization", "Bearer thisisatoken");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertEquals(request.bearerToken, "thisisatoken");
    },

    testBasicAuthorization: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        var request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertNull(request.username);
        TKAssertNull(request.password);

        headers.set("Authorization", "Bearer thisisatoken");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertNull(request.username);
        TKAssertNull(request.password);

        headers.set("Authorization", "Basic");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertNull(request.username);
        TKAssertNull(request.password);

        headers.set("Authorization", "Basic ");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertExactEquals(request.username, "");
        TKAssertNull(request.password);

        headers.set("Authorization", "Basic one:two");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertNull(request.username);
        TKAssertNull(request.password);

        headers.set("Authorization", "Basic " + "one:two".utf8().base64StringRepresentation());
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertExactEquals(request.username, "one");
        TKAssertExactEquals(request.password, "two");

        headers.set("Authorization", "Basic " + "one".utf8().base64StringRepresentation());
        request = SKHTTPRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertExactEquals(request.username, "one");
        TKAssertNull(request.password);
    },

    testAcceptContentTypes: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = SKHTTPRequest.initWithMethodAndURL("GET", url);
        TKAssertExactEquals(request.acceptContentTypes.length, 0);

        var headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 1);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "application/json");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json, text/csv");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 2);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "application/json");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/csv");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json;q=0.9, text/csv");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 2);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/csv");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "application/json");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json, text/csv;q=0.6, text/plain");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 3);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "application/json");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/plain");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "text/csv");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "audio/*; q=0.2, audio/basic");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 2);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "audio/basic");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "audio/*");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "text/plain; q=0.5, text/html,\ttext/x-dvi; q=0.8, text/x-c");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 4);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/html");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/x-c");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "text/x-dvi");
        TKAssertExactEquals(request.acceptContentTypes[3].toString(), "text/plain");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "text/*, text/plain, text/plain;format=flowed, */*");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 4);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/plain; format=\"flowed\"");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/plain");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "text/*");
        TKAssertExactEquals(request.acceptContentTypes[3].toString(), "*/*");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "text/*;q=0.3, text/html;q=0.7, text/html;level=1,\ttext/html;level=2;q=0.4, */*;q=0.5");
        request = SKHTTPRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 5);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/html; level=\"1\"");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/html");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "*/*");
        TKAssertExactEquals(request.acceptContentTypes[3].toString(), "text/html; level=\"2\"");
        TKAssertExactEquals(request.acceptContentTypes[4].toString(), "text/*");
    },

});