// #import "SecurityKit/SecurityKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSData, TKTestSuite, TKExpectation, SECCipher */
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

    testRC4_1: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rc4);
        var expectation = TKExpectation.init();
        expectation.call(cipher.createKeyWithData, cipher, "Key".utf8(), function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encrypt, cipher, "Plaintext".utf8(), key, function(encrypted){
                var expected = JSData.initWithBytes(Uint8Array.from([0xBB,0xF3,0x16,0xE8,0xD9,0x40,0xAF,0x0A,0xD3]));
                TKAssertObjectEquals(encrypted, expected);
                expectation.call(cipher.decrypt, cipher, encrypted, key, function(decrypted){
                    TKAssertObjectEquals(decrypted, "Plaintext".utf8());
                });
            });
        }, this);
        this.wait(expectation);
    },

    testRC4_2: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rc4);
        var expectation = TKExpectation.init();
        expectation.call(cipher.createKeyWithData, cipher, "Wiki".utf8(), function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encrypt, cipher, "pedia".utf8(), key, function(encrypted){
                var expected = JSData.initWithBytes(Uint8Array.from([0x10,0x21,0xBF,0x04,0x20]));
                TKAssertObjectEquals(encrypted, expected);
                expectation.call(cipher.decrypt, cipher, encrypted, key, function(decrypted){
                    TKAssertObjectEquals(decrypted, "pedia".utf8());
                });
            });
        }, this);
        this.wait(expectation);
    },

    testRC4_3: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rc4);
        var expectation = TKExpectation.init();
        expectation.call(cipher.createKeyWithData, cipher, "Secret".utf8(), function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encrypt, cipher, "Attack at dawn".utf8(), key, function(encrypted){
                var expected = JSData.initWithBytes(Uint8Array.from([0x45,0xA0,0x1F,0x64,0x5F,0xC3,0x5B,0x38,0x35,0x52,0x54,0x4B,0x9B,0xF5]));
                TKAssertObjectEquals(encrypted, expected);
                expectation.call(cipher.decrypt, cipher, encrypted, key, function(decrypted){
                    TKAssertObjectEquals(decrypted, "Attack at dawn".utf8());
                });
            });
        }, this);
        this.wait(expectation);
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
                expectation.setTimeout(5.0);
            });
            expectation.setTimeout(5.0);
        });
        this.wait(expectation, 5.0);
    },

    testAESCipherBlockChainingWrapUnwrapKey: function(){
        var algorithm = SECCipher.Algorithm.aesCipherBlockChaining;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrap(cipher, algorithm);
    },

    testAESCounterWrapUnwrapKey: function(){
        var algorithm = SECCipher.Algorithm.aesCounter;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrap(cipher, algorithm);
    },

    testAESGaloisCounterModeWrapUnwrapKey: function(){
        var algorithm = SECCipher.Algorithm.aesGaloisCounterMode;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrap(cipher, algorithm);
    },

    _testWrapUnwrap: function(cipher, algorithm){
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
                            expectation.call(cipher.unwrapKey, cipher, wrappedData, algorithm, key1, function(key3){
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
        this.wait(expectation, 5.0);
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
        this.wait(expectation, 5.0);
    }

});