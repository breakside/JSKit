// #import "SecurityKit/SecurityKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKExpectation, SECCipher */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("SECCipherTests", TKTestSuite, {

    testAESCipherBlockChaining: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);

        var expectation = TKExpectation.init();
        expectation.call(cipher.createKey, cipher, function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encryptString, cipher, "Hello, World!", key, function(encrypted){
                TKAssertNotNull(encrypted);
                TKAssertObjectNotEquals(encrypted.bytes, "Hello, World!".utf8().bytes);
                expectation.call(cipher.decryptString, cipher, encrypted, key, function(decrypted){
                    TKAssertNotNull(decrypted);
                    TKAssertEquals(decrypted, "Hello, World!");
                });
                expectation.setTimeout(2.0);
            });
            expectation.setTimeout(2.0);
        });

        this.wait(expectation, 2.0);
    },

    testAESCounter: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);

        var expectation = TKExpectation.init();
        expectation.call(cipher.createKey, cipher, function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encryptString, cipher, "Hello, World!", key, function(encrypted){
                TKAssertNotNull(encrypted);
                TKAssertObjectNotEquals(encrypted.bytes, "Hello, World!".utf8().bytes);
                expectation.call(cipher.decryptString, cipher, encrypted, key, function(decrypted){
                    TKAssertNotNull(decrypted);
                    TKAssertEquals(decrypted, "Hello, World!");
                });
                expectation.setTimeout(2.0);
            });
            expectation.setTimeout(2.0);
        });

        this.wait(expectation, 2.0);
    },

    testAESGaloisCounterMode: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);

        var expectation = TKExpectation.init();
        expectation.call(cipher.createKey, cipher, function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encryptString, cipher, "Hello, World!", key, function(encrypted){
                TKAssertNotNull(encrypted);
                TKAssertObjectNotEquals(encrypted.bytes, "Hello, World!".utf8().bytes);
                expectation.call(cipher.decryptString, cipher, encrypted, key, function(decrypted){
                    TKAssertNotNull(decrypted);
                    TKAssertEquals(decrypted, "Hello, World!");
                });
                expectation.setTimeout(2.0);
            });
            expectation.setTimeout(2.0);
        });

        this.wait(expectation, 2.0);
    },


});