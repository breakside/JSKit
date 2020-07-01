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

// #import SecurityKit
// #import TestKit
'use strict';

JSClass("SECPasswordTests", TKTestSuite, {

    testInitWithDictionary: function(){
        var dictionary = {
            salt: "Testing".utf8().base64StringRepresentation(),
            iterations: 200000,
            hash: "sha256",
            pbkdf2: "Not real".utf8().base64StringRepresentation(),
        };
        var password = SECPassword.initWithDictionary(dictionary);
        TKAssertObjectEquals(password.salt, "Testing".utf8());
        TKAssertEquals(password.iterations, 200000);
        TKAssertExactEquals(password.hashAlgorithm, SECHash.Algorithm.sha256);
        TKAssertObjectEquals(password.pbkdf2Data, "Not real".utf8());


        dictionary = {
            salt: "Testing".utf8().base64StringRepresentation(),
            iterations: 500000,
            hash: "sha512",
            pbkdf2: "Not real".utf8().base64StringRepresentation(),
        };
        password = SECPassword.initWithDictionary(dictionary);
        TKAssertObjectEquals(password.salt, "Testing".utf8());
        TKAssertEquals(password.iterations, 500000);
        TKAssertExactEquals(password.hashAlgorithm, SECHash.Algorithm.sha512);
        TKAssertObjectEquals(password.pbkdf2Data, "Not real".utf8());
    },

    testInitWithPBKDF2Data: function(){
        var password = SECPassword.initWithPBKDF2Data("Not real".utf8(), "Testing".utf8(), 500000, SECHash.Algorithm.sha256);
        TKAssertObjectEquals(password.salt, "Testing".utf8());
        TKAssertEquals(password.iterations, 500000);
        TKAssertExactEquals(password.hashAlgorithm, SECHash.Algorithm.sha256);
        TKAssertObjectEquals(password.pbkdf2Data, "Not real".utf8());
    },

    testDictionaryRepresentation: function(){
        var password = SECPassword.initWithPBKDF2Data("Not real".utf8(), "Testing".utf8(), 500000, SECHash.Algorithm.sha512);
        var dictionary = password.dictionaryRepresentation();
        TKAssertEquals(dictionary.salt, "VGVzdGluZw==");
        TKAssertEquals(dictionary.iterations, 500000);
        TKAssertExactEquals(dictionary.hash, 'sha512');
        TKAssertEquals(dictionary.pbkdf2, "Tm90IHJlYWw=");
    },

    testCreateVerify: function(){
        var expectation = TKExpectation.init();
        expectation.call(SECPassword.createWithPlainPassword, SECPassword, "test123", 256, 100000, SECHash.Algorithm.sha256, function(password){
            TKAssertNotNull(password);
            expectation.call(password.verify, password, "Test123", function(verified){
                TKAssert(!verified);
                expectation.call(password.verify, password, "test123", function(verified){
                    TKAssert(verified);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 5.0);
    },

    testCreateVerifyPromise: function(){
        var expectation = TKExpectation.init();
        var promise = SECPassword.createWithPlainPassword("test123", 512, 100000, SECHash.Algorithm.sha256);
        expectation.call(promise.then, promise, function(password){
            var promise = password.verify("Test123");
            expectation.call(promise.then, promise, function(verified){
                TKAssert(!verified);
                var promise = password.verify("test123");
                expectation.call(promise.then, promise, function(verified){
                    TKAssert(verified);
                }, function(){
                    TKAssert(false);
                });
            }, function(){
                TKAssert(false);
            });
        }, function(){
            TKAssert(false);
        });
        this.wait(expectation, 5.0);
    },

});