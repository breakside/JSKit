// #import APIKit
// #import TestKit
"use strict";

JSClass("APILambdaTests", TKTestSuite, {

    setup: function(){
        this.bundle = JSBundle.initWithDictionary({
            Info: {
                JSBundleIdentifier: "io.breakside.APIKitTests.APILambdaTests",
                APIResponder: "APILambdaTestsResponder"
            }
        });
    },

    teardown: function(){
        APILambdaTestsResponder.shared = null;
    },

    testAPILambdaMissingAPIResponder: function(){
        delete this.bundle.info.APIResponder;
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 500);
            TKAssertUndefined(response.body);
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaUnknownAPIResponder: function(){
        this.bundle.info.APIResponder = "NotARealClass";
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 500);
            TKAssertUndefined(response.body);
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaUnsupportedMethod: function(){
        var event = {
            httpMethod: "POST",
            path: "/test/request",
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 405);
            TKAssertUndefined(response.body);
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaGetReturn: function(){
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var calls = {
            prepare: 0,
            get: 0,
        };
        APILambdaTestsResponder.preparer = function(){
            ++calls.prepare;
            return Promise.resolve();
        };
        APILambdaTestsResponder.handler = function(){
            ++calls.get;
            return Promise.resolve({
                one: 1,
                two: "2"
            });
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 200);
            TKAssertEquals(response.body, "eyJvbmUiOjEsInR3byI6IjIifQ==");
            TKAssertEquals(response.isBase64Encoded, true);
            TKAssertEquals(response.multiValueHeaders["Content-Type"].length, 1);
            TKAssertEquals(response.multiValueHeaders["Content-Type"][0], "application/json; charset=\"utf-8\"");
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaGetNoReturn: function(){
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var calls = {
            prepare: 0,
            get: 0,
        };
        APILambdaTestsResponder.preparer = function(){
            ++calls.prepare;
            return Promise.resolve();
        };
        APILambdaTestsResponder.handler = function(){
            ++calls.get;
            this.response.statusCode = APIResponse.StatusCode.ok;
            this.response.contentType = JSMediaType("text/html");
            this.response.data = "<html></html>".utf8();
            return Promise.resolve();
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 200);
            TKAssertEquals(response.body, "PGh0bWw+PC9odG1sPg==");
            TKAssertEquals(response.isBase64Encoded, true);
            TKAssertEquals(response.multiValueHeaders["Content-Type"].length, 1);
            TKAssertEquals(response.multiValueHeaders["Content-Type"][0], "text/html");
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaGetThrowAPIErrorInPrepare: function(){
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var calls = {
            prepare: 0,
            get: 0,
        };
        APILambdaTestsResponder.preparer = function(){
            ++calls.prepare;
            throw new APIError(APIResponse.StatusCode.notFound, "not found");
        };
        APILambdaTestsResponder.handler = function(){
            ++calls.get;
            return Promise.resolve();
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 404);
            TKAssertEquals(response.body, "eyJtZXNzYWdlIjoibm90IGZvdW5kIn0=");
            TKAssertEquals(response.isBase64Encoded, true);
            TKAssertEquals(response.multiValueHeaders["Content-Type"].length, 1);
            TKAssertEquals(response.multiValueHeaders["Content-Type"][0], "application/json; charset=\"utf-8\"");
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaGetThrowAPIErrorInHandler: function(){
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var calls = {
            prepare: 0,
            get: 0,
        };
        APILambdaTestsResponder.preparer = function(){
            ++calls.prepare;
            return Promise.resolve();
        };
        APILambdaTestsResponder.handler = function(){
            ++calls.get;
            throw new APIError(APIResponse.StatusCode.notFound, "not found");
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 404);
            TKAssertEquals(response.body, "eyJtZXNzYWdlIjoibm90IGZvdW5kIn0=");
            TKAssertEquals(response.isBase64Encoded, true);
            TKAssertEquals(response.multiValueHeaders["Content-Type"].length, 1);
            TKAssertEquals(response.multiValueHeaders["Content-Type"][0], "application/json; charset=\"utf-8\"");
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaGetThrowValidationErrorInHandler: function(){
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var calls = {
            prepare: 0,
            get: 0,
        };
        APILambdaTestsResponder.preparer = function(){
            ++calls.prepare;
            return Promise.resolve();
        };
        APILambdaTestsResponder.handler = function(){
            ++calls.get;
            var validator = APIValidatingObject.initWithObject({one: 1, two: 2});
            var value = validator.stringForKey("three");
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 400);
            TKAssertEquals(response.body, "eyJpbnZhbGlkIjp7ImZpZWxkIjoidGhyZWUiLCJwcm9ibGVtIjoicmVxdWlyZWQifX0=");
            TKAssertEquals(response.isBase64Encoded, true);
            TKAssertEquals(response.multiValueHeaders["Content-Type"].length, 1);
            TKAssertEquals(response.multiValueHeaders["Content-Type"][0], "application/json; charset=\"utf-8\"");
        });
        this.wait(expectation, 1.0);
    },

    testAPILambdaGetThrowInHandler: function(){
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var calls = {
            prepare: 0,
            get: 0,
        };
        APILambdaTestsResponder.preparer = function(){
            ++calls.prepare;
            return Promise.resolve();
        };
        APILambdaTestsResponder.handler = function(){
            ++calls.get;
            throw new Error("bad");
        };
        var promise = APILambda(event, this.bundle);
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(response){
            TKAssertEquals(response.statusCode, 500);
            TKAssertUndefined(response.body, "eyJtZXNzYWdlIjoibm90IGZvdW5kIn0=");
        });
        this.wait(expectation, 1.0);
    }

});

JSClass("APILambdaTestsResponder", APIResponder, {

    prepare: function(){
        if (APILambdaTestsResponder.preparer !== null){
            return APILambdaTestsResponder.preparer.call(this);
        }
        return APILambdaTestsResponder.$super.prepare.call(this);
    },

    get: function(){
        return APILambdaTestsResponder.handler.call(this);
    }

});

APILambdaTestsResponder.preparer = null;
APILambdaTestsResponder.handler = null;