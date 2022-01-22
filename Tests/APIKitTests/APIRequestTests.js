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

// #import APIKit
// #import TestKit
'use strict';

JSClass("APIRequestTests", TKTestSuite, {

    testInitWithURLAndMethod: function(){
        var url = JSURL.initWithString("/test/request");
        var headers = JSMIMEHeaderMap();
        var request = APIRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertEquals(request.method, "GET");
        TKAssertNotExactEquals(request.url, url);
        TKAssertNull(request.url.scheme);
        TKAssertNull(request.url.host);
        TKAssertEquals(request.url.path, "/test/request");

        url = JSURL.initWithString("/test/request");
        headers = JSMIMEHeaderMap();
        headers.add("Host", "breakside.io");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertEquals(request.method, "GET");
        TKAssertNotExactEquals(request.url, url);
        TKAssertEquals(request.url.scheme, "http");
        TKAssertEquals(request.url.host, "breakside.io");
        TKAssertEquals(request.url.path, "/test/request");

        url = JSURL.initWithString("/test/request");
        headers = JSMIMEHeaderMap();
        headers.add("Host", "breakside.io");
        headers.add("X-Forwarded-Proto", "https");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        TKAssertEquals(request.method, "GET");
        TKAssertNotExactEquals(request.url, url);
        TKAssertEquals(request.url.scheme, "https");
        TKAssertEquals(request.url.host, "breakside.io");
        TKAssertEquals(request.url.path, "/test/request");
    },

    testOrigin: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        TKAssertNull(request.origin);

        var headers = JSMIMEHeaderMap();
        headers.add("Origin", "http://localhost:8085");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertEquals(request.origin, "http://localhost:8085");
    },

    testContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        TKAssertNull(request.contentType);

        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        TKAssert(request.contentType instanceof JSMediaType);
        TKAssertEquals(request.contentType.mime, "application/json");

        headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json; charset=utf-8");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        TKAssert(request.contentType instanceof JSMediaType);
        TKAssertEquals(request.contentType.mime, "application/json");
        TKAssertEquals(request.contentType.parameters.charset, "utf-8");
    },

    testNeedsEntityWithTag: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        var needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(needsEntity);

        var headers = JSMIMEHeaderMap();
        headers.add("If-None-Match", "sdf, asd");
        url = JSURL.initWithString("http://breakside.io/test/request");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(needsEntity);


        headers = JSMIMEHeaderMap();
        headers.add("If-None-Match", "sdf, asd, asdf");
        url = JSURL.initWithString("http://breakside.io/test/request");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(!needsEntity);

        headers = JSMIMEHeaderMap();
        headers.add("If-None-Match", 'sdf, asd, "asdf"');
        url = JSURL.initWithString("http://breakside.io/test/request");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(!needsEntity);

        headers = JSMIMEHeaderMap();
        headers.add("If-None-Match", 'sdf, asd, *');
        url = JSURL.initWithString("http://breakside.io/test/request");
        request = APIRequest.initWithMethodAndURL("GET", url, headers);
        needsEntity = request.needsEntityWithTag("asdf");
        TKAssert(!needsEntity);
    },

    _testNeedsEntityModifiedAt: function(){

    },

    testGetObjectNullData: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("POST", url);
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectMissingContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("POST", url);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectIncorrectContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "text/html");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectMissingCharset: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectBadCharset: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json; charset=iso-8859-1");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectBadJSON: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNull(obj);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObject: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getObject, request, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetObjectPromise: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        var promise = request.getObject();
        expectation.call(promise.then, promise, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
        }, function(error){
            TKAssert(false, "project rejected not expected");
        });
        this.wait(expectation, 1.0);
    },

    testGetValdiatingObject: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getValidatingObject, request, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.integerForKey('one'), 1);
            TKAssertExactEquals(obj.stringForKey('two'), "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetValdiatingObjectPromise: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/json; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var promise = request.getValidatingObject();
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.integerForKey('one'), 1);
            TKAssertExactEquals(obj.stringForKey('two'), "2");
        }, function(){
            TKAssert(false, "promise rejected not expected");
        });
        this.wait(expectation, 1.0);
    },

    testGetValdiatingObjectNullObject: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "text/html; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = '{"one": 1, "two": "2"}'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getValidatingObject, request, function(obj){
            TKAssertNotNull(obj);
            TKAssertExactEquals(obj.integerForKey('one', 0), 0);
            TKAssertExactEquals(obj.stringForKey('two', ''), "");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetFormNullData: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("POST", url);
        var expectation = TKExpectation.init();
        expectation.call(request.getForm, request, function(form){
            TKAssertNull(form);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetFormMissingContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("POST", url);
        request._data = 'one=1&two=2'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getForm, request, function(form){
            TKAssertNull(form);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetFormIncorrectContentType: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "text/html");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = 'one=1&two=2'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getForm, request, function(form){
            TKAssertNull(form);
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetFormMissingCharset: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/x-www-form-urlencoded");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = 'one=1&two=2'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getForm, request, function(form){
            TKAssertNotNull(form);
            TKAssertExactEquals(form.get("one"), "1");
            TKAssertExactEquals(form.get("two"), "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetForm: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = 'one=1&two=2'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getForm, request, function(form){
            TKAssertNotNull(form);
            TKAssertExactEquals(form.get("one"), "1");
            TKAssertExactEquals(form.get("two"), "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetFormPromise: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = 'one=1&two=2'.utf8();
        var expectation = TKExpectation.init();
        var promise = request.getForm();
        expectation.call(promise.then, promise, function(form){
            TKAssertNotNull(form);
            TKAssertExactEquals(form.get("one"), "1");
            TKAssertExactEquals(form.get("two"), "2");
        }, function(error){
            TKAssert(false, "project rejected not expected");
        });
        this.wait(expectation, 1.0);
    },

    testGetValdiatingForm: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = 'one=1&two=2'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getValidatingForm, request, function(form){
            TKAssertNotNull(form);
            TKAssertExactEquals(form.integerForKey('one'), 1);
            TKAssertExactEquals(form.stringForKey('two'), "2");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetValdiatingFormPromise: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = 'one=1&two=2'.utf8();
        var promise = request.getValidatingForm();
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(form){
            TKAssertNotNull(form);
            TKAssertExactEquals(form.integerForKey('one'), 1);
            TKAssertExactEquals(form.stringForKey('two'), "2");
        }, function(){
            TKAssert(false, "promise rejected not expected");
        });
        this.wait(expectation, 1.0);
    },

    testGetValdiatingFormNullForm: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var headers = JSMIMEHeaderMap();
        headers.add("Content-Type", "text/html; charset=utf-8");
        var request = APIRequest.initWithMethodAndURL("POST", url, headers);
        request._data = 'one=1&two=2'.utf8();
        var expectation = TKExpectation.init();
        expectation.call(request.getValidatingForm, request, function(form){
            TKAssertNotNull(form);
            TKAssertExactEquals(form.integerForKey('one', 0), 0);
            TKAssertExactEquals(form.stringForKey('two', ''), "");
        }, this);
        this.wait(expectation, 1.0);
    },

    testGetValdiatingQuery: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request?one=1&two=2");
        var headers = JSMIMEHeaderMap();
        var request = APIRequest.initWithMethodAndURL("GET", url, headers);
        var query = request.getValidatingQuery();
        TKAssertExactEquals(query.integerForKey('one'), 1);
        TKAssertExactEquals(query.stringForKey('two'), "2");
    },

    testInitFromLambdaEvent: function(){
        var event = {
            httpMethod: "GET",
            path: "/test/request",
        };
        var request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertNull(request.url.scheme);
        TKAssertNull(request.url.host);
        TKAssertEquals(request.url.path, "/test/request");

        event = {
            httpMethod: "GET",
            path: "/test/request",
            multiValueQueryStringParameters: {
                one: [
                    "1"
                ],
                two: [
                    "2"
                ],
                test: [
                    ""
                ]
            }
        };
        request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertNull(request.url.scheme);
        TKAssertNull(request.url.host);
        TKAssertEquals(request.url.path, "/test/request");
        TKAssertEquals(request.url.query.get("one"), "1");
        TKAssertEquals(request.url.query.get("two"), "2");
        TKAssertNull(request.url.query.get("test"));

        event = {
            httpMethod: "GET",
            path: "/test/request",
            multiValueHeaders: {
                "Content-Type": [
                    "application/json; charset=utf-8"
                ],
                "Host": [
                    "breakside.io"
                ],
                "X-Forwarded-Proto": [
                    "https"
                ]
            }
        };
        request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertEquals(request.url.scheme, "https");
        TKAssertEquals(request.url.host, "breakside.io");
        TKAssertEquals(request.url.path, "/test/request");
        TKAssertEquals(request.contentType.mime, "application/json");
        TKAssertEquals(request.contentType.parameters.charset, "utf-8");

        event = {
            httpMethod: "GET",
            path: "/test/request",
            multiValueHeaders: {
                "Content-Type": [
                    "application/json; charset=utf-8"
                ],
                "Host": [
                    "breakside.io"
                ],
                "X-Forwarded-Proto": [
                    "https"
                ]
            },
            body: '{"one": 1, "two": "2"}'
        };
        request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertEquals(request.url.scheme, "https");
        TKAssertEquals(request.url.host, "breakside.io");
        TKAssertEquals(request.url.path, "/test/request");
        TKAssertEquals(request.contentType.mime, "application/json");
        TKAssertEquals(request.contentType.parameters.charset, "utf-8");

        var expectation = TKExpectation.init();
        expectation.call(request.getData, request, function(data){
            TKAssertEquals(data.stringByDecodingUTF8(), '{"one": 1, "two": "2"}');
            expectation.call(request.getObject, request, function(obj){
                TKAssertEquals(obj.one, 1);
                TKAssertEquals(obj.two, "2");

                event = {
                    httpMethod: "GET",
                    path: "/test/request",
                    multiValueHeaders: {
                        "Content-Type": [
                            "application/json; charset=utf-8"
                        ],
                        "Host": [
                            "breakside.io"
                        ],
                        "X-Forwarded-Proto": [
                            "https"
                        ]
                    },
                    body: "eyJvbmUiOjEsInR3byI6IjIifQ==",
                    isBase64Encoded: true
                };
                request = APIRequest.initFromLambdaEvent(event);
                TKAssertEquals(request.method, "GET");
                TKAssertEquals(request.url.scheme, "https");
                TKAssertEquals(request.url.host, "breakside.io");
                TKAssertEquals(request.url.path, "/test/request");
                TKAssertEquals(request.contentType.mime, "application/json");
                TKAssertEquals(request.contentType.parameters.charset, "utf-8");

                expectation.call(request.getData, request, function(data){
                    TKAssertEquals(data.stringByDecodingUTF8(), '{"one":1,"two":"2"}');
                    expectation.call(request.getObject, request, function(obj){
                        TKAssertEquals(obj.one, 1);
                        TKAssertEquals(obj.two, "2");
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testInitFromLambdaEventVersion2: function(){
        var event = {
            version: "2.0",
            requestContext: {
                http: {
                     method: "GET",
                     path: "/test/request"
                }
            },
        };
        var request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertNull(request.url.scheme);
        TKAssertNull(request.url.host);
        TKAssertEquals(request.url.path, "/test/request");

        event = {
            version: "2.0",
            requestContext: {
                http: {
                     method: "GET",
                     path: "/test/request"
                }
            },
            rawQueryString: "one=1&two=2"
        };
        request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertNull(request.url.scheme);
        TKAssertNull(request.url.host);
        TKAssertEquals(request.url.path, "/test/request");
        TKAssertEquals(request.url.query.get("one"), "1");
        TKAssertEquals(request.url.query.get("two"), "2");

        event = {
            version: "2.0",
            requestContext: {
                http: {
                     method: "GET",
                     path: "/test/request"
                }
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Host": "breakside.io",
                "X-Forwarded-Proto": "https"
            }
        };
        request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertEquals(request.url.scheme, "https");
        TKAssertEquals(request.url.host, "breakside.io");
        TKAssertEquals(request.url.path, "/test/request");
        TKAssertEquals(request.contentType.mime, "application/json");
        TKAssertEquals(request.contentType.parameters.charset, "utf-8");

        event = {
            version: "2.0",
            requestContext: {
                http: {
                     method: "GET",
                     path: "/test/request"
                }
            },
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Host": "breakside.io",
                "X-Forwarded-Proto": "https"
            },
            body: '{"one": 1, "two": "2"}'
        };
        request = APIRequest.initFromLambdaEvent(event);
        TKAssertEquals(request.method, "GET");
        TKAssertEquals(request.url.scheme, "https");
        TKAssertEquals(request.url.host, "breakside.io");
        TKAssertEquals(request.url.path, "/test/request");
        TKAssertEquals(request.contentType.mime, "application/json");
        TKAssertEquals(request.contentType.parameters.charset, "utf-8");

        var expectation = TKExpectation.init();
        expectation.call(request.getData, request, function(data){
            TKAssertEquals(data.stringByDecodingUTF8(), '{"one": 1, "two": "2"}');
            expectation.call(request.getObject, request, function(obj){
                TKAssertEquals(obj.one, 1);
                TKAssertEquals(obj.two, "2");

                event = {
                    version: "2.0",
                    requestContext: {
                        http: {
                             method: "GET",
                             path: "/test/request"
                        }
                    },
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Host": "breakside.io",
                        "X-Forwarded-Proto": "https"
                    },
                    body: "eyJvbmUiOjEsInR3byI6IjIifQ==",
                    isBase64Encoded: true
                };
                request = APIRequest.initFromLambdaEvent(event);
                TKAssertEquals(request.method, "GET");
                TKAssertEquals(request.url.scheme, "https");
                TKAssertEquals(request.url.host, "breakside.io");
                TKAssertEquals(request.url.path, "/test/request");
                TKAssertEquals(request.contentType.mime, "application/json");
                TKAssertEquals(request.contentType.parameters.charset, "utf-8");

                expectation.call(request.getData, request, function(data){
                    TKAssertEquals(data.stringByDecodingUTF8(), '{"one":1,"two":"2"}');
                    expectation.call(request.getObject, request, function(obj){
                        TKAssertEquals(obj.one, 1);
                        TKAssertEquals(obj.two, "2");
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testAcceptContentTypes: function(){
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        TKAssertExactEquals(request.acceptContentTypes.length, 0);

        var headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 1);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "application/json");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json, text/csv");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 2);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "application/json");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/csv");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json;q=0.9, text/csv");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 2);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/csv");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "application/json");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "application/json, text/csv;q=0.6, text/plain");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 3);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "application/json");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/plain");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "text/csv");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "audio/*; q=0.2, audio/basic");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 2);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "audio/basic");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "audio/*");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "text/plain; q=0.5, text/html,\ttext/x-dvi; q=0.8, text/x-c");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 4);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/html");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/x-c");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "text/x-dvi");
        TKAssertExactEquals(request.acceptContentTypes[3].toString(), "text/plain");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "text/*, text/plain, text/plain;format=flowed, */*");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 4);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/plain; format=\"flowed\"");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/plain");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "text/*");
        TKAssertExactEquals(request.acceptContentTypes[3].toString(), "*/*");

        headers = JSMIMEHeaderMap();
        headers.add("Accept", "text/*;q=0.3, text/html;q=0.7, text/html;level=1,\ttext/html;level=2;q=0.4, */*;q=0.5");
        request = APIRequest.initWithMethodAndURL("GET", url,headers);
        TKAssertExactEquals(request.acceptContentTypes.length, 5);
        TKAssertExactEquals(request.acceptContentTypes[0].toString(), "text/html; level=\"1\"");
        TKAssertExactEquals(request.acceptContentTypes[1].toString(), "text/html");
        TKAssertExactEquals(request.acceptContentTypes[2].toString(), "*/*");
        TKAssertExactEquals(request.acceptContentTypes[3].toString(), "text/html; level=\"2\"");
        TKAssertExactEquals(request.acceptContentTypes[4].toString(), "text/*");
    }

});