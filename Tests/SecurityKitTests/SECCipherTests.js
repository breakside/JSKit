// #import SecurityKit
// #import TestKit
/* global JSClass, JSData, TKTestSuite, TKExpectation, SECCipher */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("SECCipherTests", TKTestSuite, {

    testAESCipherBlockChainingEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testEncryptDecrypt(cipher);
    },

    testAESCipherBlockChainingEncryptDecryptPromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESCounterEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testEncryptDecrypt(cipher);
    },

    testAESCounterEncryptDecryptPromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESGaloisCounterModeEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testEncryptDecrypt(cipher);
    },

    testAESGaloisCounterModeEncryptDecryptPromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testEncryptDecryptPromise(cipher);
    },

    testRC4_1: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rc4);
        var expectation = TKExpectation.init();
        expectation.call(cipher.createKeyWithData, cipher, "Key".utf8(), function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encrypt, cipher, "Plaintext".utf8(), key, function(encrypted){
                var expected = JSData.initWithArray([0xBB,0xF3,0x16,0xE8,0xD9,0x40,0xAF,0x0A,0xD3]);
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
                var expected = JSData.initWithArray([0x10,0x21,0xBF,0x04,0x20]);
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
                var expected = JSData.initWithArray([0x45,0xA0,0x1F,0x64,0x5F,0xC3,0x5B,0x38,0x35,0x52,0x54,0x4B,0x9B,0xF5]);
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
                TKAssertObjectNotEquals(encrypted, "Hello, World!".utf8());
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

    _testEncryptDecryptPromise: function(cipher){
        var expectation = TKExpectation.init();
        var promise = cipher.createKey();
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(key){
            var promise = cipher.encryptString("Hello, World!", key);
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(encrypted){
                TKAssertObjectNotEquals(encrypted, "Hello, World!".utf8());
                var promise = cipher.decryptString(encrypted, key);
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(decrypted){
                    TKAssertEquals(decrypted, "Hello, World!");
                }, function(){
                    TKAssert();
                });
                expectation.setTimeout(5.0);
            }, function(){
                TKAssert();
            });
            expectation.setTimeout(5.0);
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
    },

    testAESCipherBlockChainingWrapUnwrapKey: function(){
        var algorithm = SECCipher.Algorithm.aesCipherBlockChaining;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrap(cipher, algorithm);
    },

    testAESCipherBlockChainingWrapUnwrapKeyPromise: function(){
        var algorithm = SECCipher.Algorithm.aesCipherBlockChaining;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrapPromise(cipher, algorithm);
    },

    testAESCounterWrapUnwrapKey: function(){
        var algorithm = SECCipher.Algorithm.aesCounter;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrap(cipher, algorithm);
    },

    testAESCounterWrapUnwrapKeyPromise: function(){
        var algorithm = SECCipher.Algorithm.aesCounter;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrapPromise(cipher, algorithm);
    },

    testAESGaloisCounterModeWrapUnwrapKey: function(){
        var algorithm = SECCipher.Algorithm.aesGaloisCounterMode;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrap(cipher, algorithm);
    },

    testAESGaloisCounterModeWrapUnwrapKeyPromise: function(){
        var algorithm = SECCipher.Algorithm.aesGaloisCounterMode;
        var cipher = SECCipher.initWithAlgorithm(algorithm);
        this._testWrapUnwrapPromise(cipher, algorithm);
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

    _testWrapUnwrapPromise: function(cipher, algorithm){
        var expectation = TKExpectation.init();
        var promise = cipher.createKey();
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(key1){
            var promise = cipher.createKey();
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(key2){
                var promise = key2.getData();
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(rawData){
                    var promise = cipher.encryptString("Hello, World!", key2);
                    TKAssert(promise instanceof Promise);
                    expectation.call(promise.then, promise, function(encrypted){
                        var promise = cipher.wrapKey(key2, key1);
                        TKAssert(promise instanceof Promise);
                        expectation.call(promise.then, promise, function(wrappedData){
                            TKAssertObjectNotEquals(rawData, wrappedData);
                            var promise = cipher.unwrapKey(wrappedData, algorithm, key1);
                            TKAssert(promise instanceof Promise);
                            expectation.call(promise.then, promise, function(key3){
                                var promise = cipher.decryptString(encrypted, key3);
                                TKAssert(promise instanceof Promise);
                                expectation.call(promise.then, promise, function(decrypted){
                                    TKAssertEquals(decrypted, "Hello, World!");
                                }, function(){
                                    TKAssert();
                                });
                            }, function(){
                                TKAssert();
                            });
                        }, function(){
                            TKAssert();
                        });
                    }, function(){
                        TKAssert();
                    });
                }, function(){
                    TKAssert();
                });
            }, function(){
                TKAssert();
            });
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
    },

    testAESCipherBlockChainingCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testCreateKeyWithPassphrase(cipher);
    },

    testAESCipherBlockChainingCreateKeyWithPassphrasePromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testCreateKeyWithPassphrasePromise(cipher);
    },

    testAESCounterCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testCreateKeyWithPassphrase(cipher);
    },

    testAESCounterCreateKeyWithPassphrasePromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testCreateKeyWithPassphrasePromise(cipher);
    },

    testAESGaloisCounterModeCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testCreateKeyWithPassphrase(cipher);
    },

    testAESGaloisCounterModeCreateKeyWithPassphrasePromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testCreateKeyWithPassphrasePromise(cipher);
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
    },

    _testCreateKeyWithPassphrasePromise: function(cipher){
        var password = "test123";
        var salt = SECCipher.getRandomData(16);
        var expectation = TKExpectation.init();
        var promise = cipher.createKeyWithPassphrase(password, salt);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(key){
            var promise = cipher.encryptString("Hello, World!", key);
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(encrypted){
                var promise = cipher.createKeyWithPassphrase(password, salt);
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(key2){
                    expectation.call(cipher.decryptString, cipher, encrypted, key2, function(decrypted){
                        TKAssertEquals(decrypted, "Hello, World!");
                        var promise = cipher.createKeyWithPassphrase("Test123", salt);
                        TKAssert(promise instanceof Promise);
                        expectation.call(promise.then, promise, function(key3){
                            var promise = cipher.decryptString(encrypted, key3);
                            TKAssert(promise instanceof Promise);
                            expectation.call(promise.then, promise, function(decrypted){
                                TKAssert(decrypted != "Hello, World!");
                            }, function(){
                                // expecting failure
                            });
                        }, function(){
                            TKAssert();
                        });
                    }, function(){
                        TKAssert();
                    });
                }, function(){
                    TKAssert();
                });
            }, function(){
                TKAssert();
            });
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
    }

});