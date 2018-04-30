// #import "SecurityKit/SecurityKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKExpectation, SECCrypto */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("SECCryptoTests", TKTestSuite, {

    testAESCBC: function(){
        var crypto = SECCrypto.initWithAlgorithm(SECCrypto.Algorithm.aesCipherBlockChaining);

        var expectation = TKExpectation.init();
        expectation.call(crypto.createKey, crypto, function(key){
            TKAssertNotNull(key);
            expectation.call(crypto.encryptString, crypto, "Hello, World!", key, function(encrypted){
                TKAssertNotNull(encrypted);
                TKAssertObjectNotEquals(encrypted.bytes, "Hello, World!".utf8());
                expectation.call(crypto.decryptString, crypto, encrypted, key, function(decrypted){
                    TKAssertNotNull(decrypted);
                    TKAssertEquals(decrypted, "Hello, World!");
                });
                expectation.setTimeout(2.0);
            });
            expectation.setTimeout(2.0);
        });

        this.wait(expectation, 2.0);
    }

});