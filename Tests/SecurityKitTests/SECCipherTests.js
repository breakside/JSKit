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

JSClass("SECCipherTests", TKTestSuite, {

    testAESCipherBlockChainingEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        TKAssertEquals(cipher.keyBitLength, 256);
        this._testEncryptDecrypt(cipher);
    },

    testAESCipherBlockChainingEncryptDecryptPromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        TKAssertEquals(cipher.keyBitLength, 256);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESCounterEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        TKAssertEquals(cipher.keyBitLength, 256);
        this._testEncryptDecrypt(cipher);
    },

    testAESCounterEncryptDecryptPromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        TKAssertEquals(cipher.keyBitLength, 256);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESGaloisCounterModeEncryptDecrypt: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        TKAssertEquals(cipher.keyBitLength, 256);
        this._testEncryptDecrypt(cipher);
    },

    testAESGaloisCounterModeEncryptDecryptPromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        TKAssertEquals(cipher.keyBitLength, 256);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESCipherBlockChainingEncryptDecrypt192: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining, 192);
        TKAssertEquals(cipher.keyBitLength, 192);
        this._testEncryptDecrypt(cipher);
    },

    testAESCipherBlockChainingEncryptDecryptPromise192: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining, 192);
        TKAssertEquals(cipher.keyBitLength, 192);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESCounterEncryptDecrypt192: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter, 192);
        TKAssertEquals(cipher.keyBitLength, 192);
        this._testEncryptDecrypt(cipher);
    },

    testAESCounterEncryptDecryptPromise192: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter, 192);
        TKAssertEquals(cipher.keyBitLength, 192);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESGaloisCounterModeEncryptDecrypt192: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode, 192);
        TKAssertEquals(cipher.keyBitLength, 192);
        this._testEncryptDecrypt(cipher);
    },

    testAESGaloisCounterModeEncryptDecryptPromise192: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode, 192);
        TKAssertEquals(cipher.keyBitLength, 192);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESCipherBlockChainingEncryptDecrypt128: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining, 128);
        TKAssertEquals(cipher.keyBitLength, 128);
        this._testEncryptDecrypt(cipher);
    },

    testAESCipherBlockChainingEncryptDecryptPromise128: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining, 128);
        TKAssertEquals(cipher.keyBitLength, 128);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESCounterEncryptDecrypt128: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter, 128);
        TKAssertEquals(cipher.keyBitLength, 128);
        this._testEncryptDecrypt(cipher);
    },

    testAESCounterEncryptDecryptPromise128: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter, 128);
        TKAssertEquals(cipher.keyBitLength, 128);
        this._testEncryptDecryptPromise(cipher);
    },

    testAESGaloisCounterModeEncryptDecrypt128: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode, 128);
        TKAssertEquals(cipher.keyBitLength, 128);
        this._testEncryptDecrypt(cipher);
    },

    testAESGaloisCounterModeEncryptDecryptPromise128: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode, 128);
        TKAssertEquals(cipher.keyBitLength, 128);
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
            expectation.call(key.getData, key, function(data){
                TKAssertNotNull(data);
                TKAssertEquals(data.length * 8, cipher.keyBitLength);
                expectation.call(cipher.encryptString, cipher, "Hello, World!", key, function(encrypted){
                    TKAssertNotNull(encrypted);
                    TKAssertObjectNotEquals(encrypted, "Hello, World!".utf8());
                    expectation.call(cipher.decryptString, cipher, encrypted, key, function(decrypted){
                        TKAssertNotNull(decrypted);
                        TKAssertEquals(decrypted, "Hello, World!");
                    });
                    expectation.setTimeout(5.0);
                });
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
            var promise = key.getData();
            expectation.call(promise.then, promise, function(data){
                TKAssertEquals(data.length * 8, cipher.keyBitLength);
                var promise = cipher.encryptString("Hello, World!", key);
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(encrypted){
                    TKAssertObjectNotEquals(encrypted, "Hello, World!".utf8());
                    var promise = cipher.decryptString(encrypted, key);
                    TKAssert(promise instanceof Promise);
                    expectation.call(promise.then, promise, function(decrypted){
                        TKAssertEquals(decrypted, "Hello, World!");
                    }, function(){
                        TKAssert(false);
                    });
                    expectation.setTimeout(5.0);
                }, function(){
                    TKAssert(false);
                });
                expectation.setTimeout(5.0);
            }, function(){
                TKAssert(false);
            });
        }, function(){
            TKAssert(false);
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
                                    TKAssert(false);
                                });
                            }, function(){
                                TKAssert(false);
                            });
                        }, function(){
                            TKAssert(false);
                        });
                    }, function(){
                        TKAssert(false);
                    });
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

    testAESCipherBlockChainingCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testCreateKeyWithPassphrase(cipher, 100000, SECHash.Algorithm.sha256);
    },

    testAESCipherBlockChainingCreateKeyWithPassphrasePromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testCreateKeyWithPassphrasePromise(cipher, 100000, SECHash.Algorithm.sha256);
    },

    testAESCipherBlockChainingCreateKeyWithPassphrase512: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testCreateKeyWithPassphrase(cipher, 200000, SECHash.Algorithm.sha256);
    },

    testAESCipherBlockChainingCreateKeyWithPassphrasePromise512: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
        this._testCreateKeyWithPassphrasePromise(cipher, 200000, SECHash.Algorithm.sha512);
    },

    testAESCounterCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testCreateKeyWithPassphrase(cipher, 100000, SECHash.Algorithm.sha256);
    },

    testAESCounterCreateKeyWithPassphrasePromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testCreateKeyWithPassphrasePromise(cipher, 100000, SECHash.Algorithm.sha256);
    },

    testAESCounterCreateKeyWithPassphrase512: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testCreateKeyWithPassphrase(cipher, 200000, SECHash.Algorithm.sha512);
    },

    testAESCounterCreateKeyWithPassphrasePromise512: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCounter);
        this._testCreateKeyWithPassphrasePromise(cipher, 200000, SECHash.Algorithm.sha512);
    },

    testAESGaloisCounterModeCreateKeyWithPassphrase: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testCreateKeyWithPassphrase(cipher, 100000, SECHash.Algorithm.sha256);
    },

    testAESGaloisCounterModeCreateKeyWithPassphrasePromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testCreateKeyWithPassphrasePromise(cipher, 100000, SECHash.Algorithm.sha256);
    },

    testAESGaloisCounterModeCreateKeyWithPassphrase512: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testCreateKeyWithPassphrase(cipher, 200000, SECHash.Algorithm.sha512);
    },

    testAESGaloisCounterModeCreateKeyWithPassphrasePromise512: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGaloisCounterMode);
        this._testCreateKeyWithPassphrasePromise(cipher, 200000, SECHash.Algorithm.sha512);
    },

    _testCreateKeyWithPassphrase: function(cipher, iterations, hash){
        var password = "test123";
        var salt = SECCipher.getRandomData(16);
        var expectation = TKExpectation.init();
        expectation.call(cipher.createKeyWithPassphrase, cipher, password, salt, iterations, hash, function(key){
            TKAssertNotNull(key);
            expectation.call(cipher.encryptString, cipher, "Hello, World!", key, function(encrypted){
                TKAssertNotNull(encrypted);
                expectation.call(cipher.createKeyWithPassphrase, cipher, password, salt, iterations, hash, function(key2){
                    TKAssertNotNull(key2);
                    expectation.call(cipher.decryptString, cipher, encrypted, key2, function(decrypted){
                        TKAssertNotNull(decrypted);
                        TKAssertEquals(decrypted, "Hello, World!");
                        expectation.call(cipher.createKeyWithPassphrase, cipher, "Test123", salt, iterations, hash, function(key3){
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

    _testCreateKeyWithPassphrasePromise: function(cipher, iterations, hash){
        var password = "test123";
        var salt = SECCipher.getRandomData(16);
        var expectation = TKExpectation.init();
        var promise = cipher.createKeyWithPassphrase(password, salt, iterations, hash);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(key){
            var promise = cipher.encryptString("Hello, World!", key);
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(encrypted){
                var promise = cipher.createKeyWithPassphrase(password, salt, iterations, hash);
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(key2){
                    expectation.call(cipher.decryptString, cipher, encrypted, key2, function(decrypted){
                        TKAssertEquals(decrypted, "Hello, World!");
                        var promise = cipher.createKeyWithPassphrase("Test123", salt, iterations, hash);
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
                            TKAssert(false);
                        });
                    }, function(){
                        TKAssert(false);
                    });
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

    testCreateKeyWithPassphraseDeprecatedAPI: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
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

    testCreateKeyWithPassphraseDeprecatedPromise: function(){
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCipherBlockChaining);
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
                            TKAssert(false);
                        });
                    }, function(){
                        TKAssert(false);
                    });
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