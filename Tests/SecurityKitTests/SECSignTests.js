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

JSClass("SECSignTests", TKTestSuite, {

    testSignAndVerify: function(){
        var plaintext = "This is a test of SECSign and SECVerify".utf8();
        var signer = SECSign.initWithAlgorithm(SECSign.Algorithm.rsaSHA256);
        var expectation = TKExpectation.init();
        expectation.call(signer.createKeyPair, signer, {}, function(keys){
            TKAssertNotNull(keys);
            signer.update(plaintext);
            expectation.call(signer.sign, signer, keys.private, function(signature){
                TKAssertNotNull(signature);
                var verify = SECVerify.initWithAlgorithm(SECVerify.Algorithm.rsaSHA256);
                verify.update(plaintext);
                expectation.call(verify.verify, verify, keys.public, signature, function(verified){
                    TKAssert(verified);
                });
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    },

    testCreateJWK: function(){
        var signer = SECSign.initWithAlgorithm(SECSign.Algorithm.rsaSHA256);
        var expectation = TKExpectation.init();
        expectation.call(signer.createJWKPair, signer, {}, function(keys){
            TKAssertNotNull(keys);
            var plaintext = "This is a test of SECSign and SECVerify".utf8();
            expectation.call(signer.createKeyFromJWK, signer, keys.private, function(privateKey){
                TKAssertNotNull(privateKey);
                signer.update(plaintext);
                expectation.call(signer.sign, signer, privateKey, function(signature){
                    TKAssertNotNull(signature);
                    var verify = SECVerify.initWithAlgorithm(SECVerify.Algorithm.rsaSHA256);
                    expectation.call(verify.createKeyFromJWK, verify, keys.public, function(publicKey){
                        TKAssertNotNull(publicKey);
                        verify.update(plaintext);
                        expectation.call(verify.verify, verify, publicKey, signature, function(verified){
                            TKAssert(verified);
                        }, this);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    },

    testEllipticCurve: function(){
        var plaintext = "This is a test of SECSign and SECVerify".utf8();
        var signer = SECSign.initWithAlgorithm(SECSign.Algorithm.ellipticCurveSHA256);
        var expectation = TKExpectation.init();
        expectation.call(signer.createKeyPair, signer, {}, function(keys){
            TKAssertNotNull(keys);
            signer.update(plaintext);
            expectation.call(signer.sign, signer, keys.private, function(signature){
                TKAssertNotNull(signature);
                var verify = SECVerify.initWithAlgorithm(SECVerify.Algorithm.ellipticCurveSHA256);
                verify.update(plaintext);
                expectation.call(verify.verify, verify, keys.public, signature, function(verified){
                    TKAssert(verified);
                });
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    },

    testCreateJWKEllipticCurve: function(){
        var signer = SECSign.initWithAlgorithm(SECSign.Algorithm.ellipticCurveSHA256);
        var expectation = TKExpectation.init();
        expectation.call(signer.createJWKPair, signer, {}, function(keys){
            TKAssertNotNull(keys);
            var plaintext = "This is a test of SECSign and SECVerify".utf8();
            expectation.call(signer.createKeyFromJWK, signer, keys.private, function(privateKey){
                TKAssertNotNull(privateKey);
                signer.update(plaintext);
                expectation.call(signer.sign, signer, privateKey, function(signature){
                    TKAssertNotNull(signature);
                    var verify = SECVerify.initWithAlgorithm(SECVerify.Algorithm.ellipticCurveSHA256);
                    expectation.call(verify.createKeyFromJWK, verify, keys.public, function(publicKey){
                        TKAssertNotNull(publicKey);
                        verify.update(plaintext);
                        expectation.call(verify.verify, verify, publicKey, signature, function(verified){
                            TKAssert(verified);
                        }, this);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    },

    testCreateKeyFromKeystore: function(){
        var signer = SECSign.initWithAlgorithm(SECSign.Algorithm.rsaSHA256);
        var expectation = TKExpectation.init();
        expectation.call(signer.createJWKPair, signer, {}, function(keys){
            TKAssertNotNull(keys);
            var keystore = SECKeystore.init();
            keystore.addJWK(keys.private);
            expectation.call(signer.createKeyFromKeystore, signer, keystore, keys.private.kid, function(key){
                TKAssertNotNull(key);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    }

});