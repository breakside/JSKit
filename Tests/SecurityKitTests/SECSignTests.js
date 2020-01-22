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
    }

});