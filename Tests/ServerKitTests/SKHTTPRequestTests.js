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
    }

});