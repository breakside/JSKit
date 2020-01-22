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

    testRespond: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, []);
        var headers = JSMIMEHeaderMap();
        headers.set('Content-Length', 0);
        request.respond(200, "OK", headers);
        TKAssertEquals(request.responseText, "HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n");
        TKAssert(!request.response.isClosed);
    },

    testUpgrade: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = MockRequest.initMock("GET", url, []);
        var headers = JSMIMEHeaderMap();
        headers.set('Content-Length', 0);
        headers.set('X-Upgrade-Info', "hello");
        request.upgrade("Upgrade", headers);
        TKAssertEquals(request.responseText, "HTTP/1.1 101 Upgrade\r\nContent-Length: 0\r\nX-Upgrade-Info: hello\r\n\r\n");
        TKAssert(!request.response.isClosed);
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
    }

});