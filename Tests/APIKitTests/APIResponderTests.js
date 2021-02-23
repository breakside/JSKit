// #import APIKit
// #import TestKit
"use strict";

JSClass("APIResponderTests", TKTestSuite, {

    testInitWithRequest: function(){
        var cls = APIResponder.$extend({
            get: function(){
                return new Promise(function(resolve, reject){
                    resolve({
                        message: "hello"
                    });
                });
            }
        }, "TestAPIResponder");
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        var response = APIResponse.init();
        var responder = cls.initWithRequest(request, response);
        TKAssertExactEquals(responder.request, request);
        TKAssertExactEquals(responder.response, response);

        url = JSURL.initWithString("http://breakside.io/test/request");
        request = APIRequest.initWithMethodAndURL("GET", url);
        responder = cls.initWithRequest(request);
        TKAssertExactEquals(responder.request, request);
        TKAssertNotNull(responder.response);
    },

    testDefinePropertiesFromPathParameters: function(){
        var cls = APIResponder.$extend({
            id: null,
            test2: "hi",
            get: function(){
                return new Promise(function(resolve, reject){
                    resolve({
                        message: "hello"
                    });
                });
            }
        }, "TestAPIResponder");
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        var response = APIResponse.init();
        var responder = cls.initWithRequest(request, response);
        TKAssertNull(responder.id);
        TKAssertUndefined(responder.test);
        TKAssertEquals(responder.test2, "hi");
        responder.definePropertiesFromPathParameters({
            id: "1",
            test: "hello",
            test2: "changed"
        });
        TKAssertEquals(responder.id, "1");
        TKAssertEquals(responder.test, "hello");
        TKAssertEquals(responder.test2, "hi");
    },

    testObjectMethodForRequestMethod: function(){
        var cls = APIResponder.$extend({
            get: function(){
                Promise.resolve({message: "hello"});
            },

            _notthis: function(){
            },

            _notThisEither: function(){
            }

        }, "TestAPIResponder");
        var pathParameters = {id: "test"};
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        var response = APIResponse.init();
        var secrets = APISecrets.init();
        var responder = cls.initWithRequest(request, response, pathParameters, secrets);
        
        var method = responder.objectMethodForRequestMethod("GET");
        TKAssertExactEquals(method, cls.prototype.get);
        
        method = responder.objectMethodForRequestMethod("get");
        TKAssertExactEquals(method, cls.prototype.get);
        
        method = responder.objectMethodForRequestMethod("prepare");
        TKAssertNull(method);
        
        method = responder.objectMethodForRequestMethod("_notthis");
        TKAssertNull(method);
        
        method = responder.objectMethodForRequestMethod("_notThisEither");
        TKAssertNull(method);
    },

    testPrepare: function(){
        var cls = APIResponder.$extend({
            get: function(){
                return new Promise(function(resolve, reject){
                    resolve({
                        message: "hello"
                    });
                });
            }
        }, "TestAPIResponder");
        var pathParameters = {id: "test"};
        var url = JSURL.initWithString("http://breakside.io/test/request");
        var request = APIRequest.initWithMethodAndURL("GET", url);
        var response = APIResponse.init();
        var secrets = APISecrets.init();
        var responder = cls.initWithRequest(request, response, pathParameters, secrets);
        var promise = responder.prepare();
        var expectation = TKExpectation.init();
        expectation.call(promise.then, promise, function(){
        }, function(){
            TKAssert(false, "promise rejection not expected");
        });
        this.wait(expectation, 1.0);
    }

});