// #import ServerKit
// #import TestKit
"use strict";

JSClass("SKHTTPResponderTests", TKTestSuite, {

    testSendData: function(){
        var request = SKHTTPResponderTestsRequest.initWithMethodAndURL("GET", JSURL.initWithString("https://test"), JSData.initWithLength(0));
        var responder = SKHTTPResponder.initWithRequest(request);
        responder.sendData("hello".utf8(), "text/plain");
        TKAssertExactEquals(request.response.statusCode, 200);
        TKAssertExactEquals(request.response.headerMap.get("Content-Type"), "text/plain");
        TKAssertEquals(request.response.data.stringByDecodingUTF8(), "hello");
        TKAssert(request.response.headerWritten);
        TKAssert(request.response.completed);

        request = SKHTTPResponderTestsRequest.initWithMethodAndURL("GET", JSURL.initWithString("https://test"), JSData.initWithLength(0));
        responder = SKHTTPResponder.initWithRequest(request);
        responder.sendData("hello".utf8(), JSMediaType("text/html; charset=iso-8859-1"), SKHTTPResponse.StatusCode.created);
        TKAssertExactEquals(request.response.statusCode, 201);
        TKAssertExactEquals(request.response.headerMap.get("Content-Type"), 'text/html; charset="iso-8859-1"');
        TKAssertEquals(request.response.data.stringByDecodingUTF8(), "hello");
        TKAssert(request.response.headerWritten);
        TKAssert(request.response.completed);
    },

    testSendString: function(){
        var request = SKHTTPResponderTestsRequest.initWithMethodAndURL("GET", JSURL.initWithString("https://test"), JSData.initWithLength(0));
        var responder = SKHTTPResponder.initWithRequest(request);
        responder.sendString("hello", "text/plain");
        TKAssertExactEquals(request.response.statusCode, 200);
        TKAssertExactEquals(request.response.headerMap.get("Content-Type"), 'text/plain; charset="utf-8"');
        TKAssertEquals(request.response.data.stringByDecodingUTF8(), "hello");
        TKAssert(request.response.headerWritten);
        TKAssert(request.response.completed);

        request = SKHTTPResponderTestsRequest.initWithMethodAndURL("GET", JSURL.initWithString("https://test"), JSData.initWithLength(0));
        responder = SKHTTPResponder.initWithRequest(request);
        responder.sendString("hello", JSMediaType("text/html; charset=iso-8859-1"), SKHTTPResponse.StatusCode.created);
        TKAssertExactEquals(request.response.statusCode, 201);
        TKAssertExactEquals(request.response.headerMap.get("Content-Type"), 'text/html; charset="utf-8"');
        TKAssertEquals(request.response.data.stringByDecodingUTF8(), "hello");
        TKAssert(request.response.headerWritten);
        TKAssert(request.response.completed);
    },

    testSendObject: function(){
        var request = SKHTTPResponderTestsRequest.initWithMethodAndURL("GET", JSURL.initWithString("https://test"), JSData.initWithLength(0));
        var responder = SKHTTPResponder.initWithRequest(request);
        responder.sendObject({a: "hello"});
        TKAssertExactEquals(request.response.statusCode, 200);
        TKAssertExactEquals(request.response.headerMap.get("Content-Type"), 'application/json; charset="utf-8"');
        TKAssertEquals(request.response.data.stringByDecodingUTF8(), '{"a":"hello"}\n');
        TKAssert(request.response.headerWritten);
        TKAssert(request.response.completed);

        request = SKHTTPResponderTestsRequest.initWithMethodAndURL("GET", JSURL.initWithString("https://test"), JSData.initWithLength(0));
        responder = SKHTTPResponder.initWithRequest(request);
        responder.sendObject({a: "hello"}, SKHTTPResponse.StatusCode.created);
        TKAssertExactEquals(request.response.statusCode, 201);
        TKAssertExactEquals(request.response.headerMap.get("Content-Type"), 'application/json; charset="utf-8"');
        TKAssertEquals(request.response.data.stringByDecodingUTF8(), '{"a":"hello"}\n');
        TKAssert(request.response.headerWritten);
        TKAssert(request.response.completed);
    },

});

JSClass("SKHTTPResponderTestsRequest", SKHTTPRequest, {

    initWithMethodAndURL: function(method, url, data){
        SKHTTPResponderTestsRequest.$super.initWithMethodAndURL.call(this, method, url);
        this._response = SKHTTPResponderTestsResponse.init();
        this._data = data;
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, this._data);
        return completion.promise;
    },

    closed: false,

    close: function(){
        this.closed = true;
    }

});

JSClass("SKHTTPResponderTestsResponse", SKHTTPResponse, {

    init: function(){
        SKHTTPResponderTestsResponse.$super.init.call(this);
        this.chunks = [];
    },

    writeHeader: function(){
        this.headerWritten = true;
    },

    writeData: function(data){
        this.writeHeaderIfNeeded();
        this.chunks.push(data);
    },

    writeFile: function(path){
    },

    headerWritten: false,
    completed: false,

    complete: function(){
        this.completed = true;
    },

    data: JSReadOnlyProperty(),

    getData: function(){
        return JSData.initWithChunks(this.chunks);
    }

});