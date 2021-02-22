// #import APIKit
// #import TestKit
"use strict";

JSClass("APIResponseTests", TKTestSuite, {

    testStatusCode: function(){
        var response = APIResponse.init();
        TKAssertEquals(response.statusCode, 200);

        response.statusCode = APIResponse.StatusCode.noContent;
        TKAssertEquals(response.statusCode, 204);
    },

    testContentType: function(){
        var response = APIResponse.init();
        TKAssertNull(response.contentType);

        response.contentType = JSMediaType("application/json; charset=utf-8");
        var contentType = response.contentType;
        TKAssertNotNull(contentType);
        TKAssertInstance(contentType, JSMediaType);
        TKAssertEquals(contentType.mime, "application/json");
        TKAssertEquals(contentType.parameters.charset, "utf-8");

        TKAssertEquals(response.headerMap.get("Content-Type"), "application/json; charset=\"utf-8\"");
    },

    testContentLength: function(){
        var response = APIResponse.init();
        TKAssertNull(response.contentLength);

        response.contentLength = 123;
        TKAssertExactEquals(response.contentLength, 123);
        TKAssertExactEquals(response.headerMap.get("Content-Length"), "123");
    },

    testEtag: function(){
        var response = APIResponse.init();
        TKAssertNull(response.etag);

        response.etag = "hello";
        TKAssertExactEquals(response.etag, "hello");
        TKAssertExactEquals(response.headerMap.get("ETag"), '"hello"');
    },

    testLastModified: function(){
        var response = APIResponse.init();
        TKAssertNull(response.lastModified);

        response.lastModified = JSDate.initWithTimeIntervalSince1970(123);
        TKAssertExactEquals(response.lastModified.timeIntervalSince1970, 123);
        TKAssertExactEquals(response.headerMap.get("Last-Modified"), "Thu, 01 Jan 1970 00:02:03 GMT");
    },

    testData: function(){
        var response = APIResponse.init();
        TKAssertNull(response.data);

        response.data = "hello".utf8();
        TKAssertEquals(response.data.stringByDecodingUTF8(), "hello");
    },

    testObject: function(){
        var response = APIResponse.init();
        TKAssertNull(response.object);

        response.object = {one: 1, two: "2"};
        TKAssertEquals(response.data.stringByDecodingUTF8(), '{"one":1,"two":"2"}');

        var contentType = response.contentType;
        TKAssertNotNull(contentType);
        TKAssertInstance(contentType, JSMediaType);
        TKAssertEquals(contentType.mime, "application/json");
        TKAssertEquals(contentType.parameters.charset, "utf-8");

        TKAssertEquals(response.headerMap.get("Content-Type"), "application/json; charset=\"utf-8\"");
    },

    testLambdaResponse: function(){
        var response = APIResponse.init();
        response.statusCode = APIResponse.StatusCode.noContent;
        response.contentLength = 0;
        var lambdaResponse = response.lambdaResponse();
        TKAssertEquals(lambdaResponse.statusCode, 204);
        TKAssertUndefined(lambdaResponse.body);
        TKAssertUndefined(lambdaResponse.isBase64Encoded);
        TKAssertEquals(lambdaResponse.multiValueHeaders["Content-Length"].length, 1);
        TKAssertEquals(lambdaResponse.multiValueHeaders["Content-Length"][0], "0");

        response = APIResponse.init();
        response.object = {one: 1, two: "2"};
        lambdaResponse = response.lambdaResponse();
        TKAssertEquals(lambdaResponse.statusCode, 200);
        TKAssertEquals(lambdaResponse.body, "eyJvbmUiOjEsInR3byI6IjIifQ==");
        TKAssertEquals(lambdaResponse.isBase64Encoded, true);
        TKAssertEquals(lambdaResponse.multiValueHeaders["Content-Type"].length, 1);
        TKAssertEquals(lambdaResponse.multiValueHeaders["Content-Type"][0], "application/json; charset=\"utf-8\"");
    }

});