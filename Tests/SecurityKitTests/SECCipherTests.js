// #import "SecurityKit/SecurityKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKExpectation, SECCipher */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("SECCipherTests", TKTestSuite, {

    testAESCipherBlockChainingEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testEncryptDecrypt(cipher);
    },

    testAESCounterEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testEncryptDecrypt(cipher);
    },

    testAESGaloisCounterModeEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testEncryptDecrypt(cipher);
    },

    _testEncryptDecrypt: function(cipher){
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

    testAESCipherBlockChainingWrapUnwrapKey: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testWrapUnwrap(cipher);
    },

    testAESCounterWrapUnwrapKey: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testWrapUnwrap(cipher);
    },

    testAESGaloisCounterModeWrapUnwrapKey: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testWrapUnwrap(cipher);
    },

    _testWrapUnwrap: function(cipher){
        var expectation = TKExpectation.init();
        expectation.call(cipher.createKey, cipher, function(key1){
            TKAssertNotNull(key1);
            expectation.call(cipher.createKey, cipher, function(key2){
                TKAssertNotNull(key2);
                expectation.call(key2.getData, key2, function(rawData){
                    TKAssertNotNull(rawData);
                    expectation.call(cipher.encryptString, cipher, "Hello, World!", key2, function(encrypted){
                        TKAssertNotNull(encrypted);
                        expectation.call(cipher.wrapKey, cipher, key2, key1, function(wrappedData){
                            TKAssertNotNull(wrappedData);
                            TKAssertObjectNotEquals(rawData, wrappedData);
                            expectation.call(cipher.unwrapKey, cipher, wrappedData, key1, function(key3){
                                TKAssertNotNull(key3);
                                expectation.call(cipher.decryptString, cipher, encrypted, key3, function(decrypted){
                                    TKAssertNotNull(decrypted);
                                    TKAssertEquals(decrypted, "Hello, World!");
                                });
                            });
                        });
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testAESCipherBlockChainingCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testCreateKeyWithPassphrase(cipher);
    },

    testAESCounterCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testCreateKeyWithPassphrase(cipher);
    },

    testAESGaloisCounterModeCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testCreateKeyWithPassphrase(cipher);
    },

    _testCreateKeyWithPassphrase: function(cipher){
        var password = "test123";
        var salt = SECCipher.getRandomData(16);
        var expectation = TKExpectation.init();
        expectation.call(cipher.createKeyWithPassphrase, cipher, password, salt, function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encryptString, cipher, "Hello, World!", key, function(encrypted){
                TKAssertNotNull(encrypted);
                expectation.call(cipher.createKeyWithPassphrase, cipher, password, salt, function(key2){
                    TKAssertNotNull(key2);
                    expectation.call(cipher.decryptString, cipher, encrypted, key2, function(decrypted){
                        TKAssertNotNull(decrypted);
                        TKAssertEquals(decrypted, "Hello, World!");
                        expectation.call(cipher.createKeyWithPassphrase, cipher, "Test123", salt, function(key3){
                            TKAssertNotNull(key3);
                            expectation.call(cipher.decryptString, cipher, encrypted, key3, function(decrypted){
                                TKAssert(decrypted === null || decrypted != "Hello, World!");
                            });
                        });
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    }

});