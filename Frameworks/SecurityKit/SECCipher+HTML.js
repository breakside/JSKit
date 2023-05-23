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

// #import Foundation
// #import "SECCipher.js"
// #import "SECHTMLKey.js"
// #import "SECHash.js"
// #feature window.crypto.subtle
// jshint browser: true
/* global crypto */
'use strict';

(function(){

var HTMLCryptoAlgorithmNames = {
    aesCBC: 'AES-CBC',
    aesCTR: 'AES-CTR',
    aesGCM: 'AES-GCM',

    fromAlgorithm: function(algorithm){
        switch (algorithm){
            case SECCipher.Algorithm.aesCipherBlockChaining:
                return HTMLCryptoAlgorithmNames.aesCBC;
            case SECCipher.Algorithm.aesCounter:
                return HTMLCryptoAlgorithmNames.aesCTR;
            case SECCipher.Algorithm.aesGaloisCounterMode:
                return HTMLCryptoAlgorithmNames.aesGCM;
            case SECCipher.Algorithm.rc4:
                return null;
        }
        return null;
    }
};

SECCipher.definePropertiesFromExtensions({

    htmlAlgorithmName: null,

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: this.htmlAlgorithmName,
            length: this.keyBitLength
        };
        var extractable = true;
        crypto.subtle.generateKey(algorithm, extractable, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]).then(function(htmlKey){
            completion.call(target, SECHTMLKey.initWithKey(htmlKey));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    createKeyWithData: function(data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: this.htmlAlgorithmName
        };
        var extractable = true;
        crypto.subtle.importKey("raw", data, algorithm, extractable, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]).then(function(htmlKey){
            completion.call(target, SECHTMLKey.initWithKey(htmlKey));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

SECCipherAESCipherBlockChaining.definePropertiesFromExtensions({

    htmlAlgorithmName: HTMLCryptoAlgorithmNames.aesCBC,

    _getHTMLEncryptAlgorithm: function(){
        return {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: crypto.getRandomValues(JSData.initWithLength(16))
        };
    },

    _getHTMLDecryptAlgorithm: function(prefixedData){
        return {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: prefixedData.subdataInRange(JSRange(0, 16))
        };
    },

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        crypto.subtle.encrypt(algorithm, key.htmlKey, data).then(function(encrypted){
            // prefix the encrypted data with the random initializtion vector so
            // it is available to the decrypt function.  The iv does not need
            // to be a secret, it just needs to be random, so prefixing does not affect security.
            var ivPrefixed = JSData.initWithChunks([algorithm.iv, JSData.initWithBuffer(encrypted)]);
            completion.call(target, ivPrefixed);
        },function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLDecryptAlgorithm(data);
        var encrypted = data.subdataInRange(JSRange(16, data.length - 16));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted).then(function(decrypted){
            var decryptedData = JSData.initWithBuffer(decrypted);
            completion.call(target, decryptedData);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    wrapKey: function(key, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var ivPrefixed = JSData.initWithChunks([algorithm.iv, JSData.initWithBuffer(bytes)]);
            completion.call(target, ivPrefixed);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLDecryptAlgorithm(wrappedKeyData);
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        wrappedKeyData = wrappedKeyData.subdataInRange(JSRange(16, wrappedKeyData.length - 16));
        crypto.subtle.unwrapKey("raw", wrappedKeyData, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
            completion.call(target, SECHTMLKey.initWithKey(key));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

SECCipherAESCounter.definePropertiesFromExtensions({

    htmlAlgorithmName: HTMLCryptoAlgorithmNames.aesCTR,

    _getHTMLEncryptAlgorithm: function(){
        var nonce = JSData.initWithArray([
            1,
            ((this.encryptedMessageId / 0x100000000) >> 16) & 0xFF,
            ((this.encryptedMessageId / 0x100000000) >> 8) & 0xFF,
            (this.encryptedMessageId / 0x100000000) & 0xFF,
            (this.encryptedMessageId >> 24) & 0xFF,
            (this.encryptedMessageId >> 16) & 0xFF,
            (this.encryptedMessageId >> 8) & 0xFF,
            this.encryptedMessageId & 0xF
        ]);
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCTR,
            counter: JSData.initWithLength(16),
            length: 64
        };
        nonce.copyTo(algorithm.counter, 0);
        return algorithm;
    },

    _getHTMLDecryptAlgorithm: function(prefixedData){
        var nonce = prefixedData.subdataInRange(JSRange(0, 8));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCTR,
            counter: JSData.initWithLength(16),
            length: 64
        };
        nonce.copyTo(algorithm.counter, 0);
        return algorithm;
    },

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, undefined, null);
            return completion.promise;
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        var nonce = algorithm.counter.truncatedToLength(8);
        crypto.subtle.encrypt(algorithm, key.htmlKey, data).then(function(encrypted){
            var noncePrefixed = JSData.initWithChunks([nonce, JSData.initWithBuffer(encrypted)]);
            completion.call(target, noncePrefixed);
        },function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        // Extract the nonce from the start of the data, then use it to decrypt the remaining data
        var algorithm = this._getHTMLDecryptAlgorithm(data);
        var encrypted = data.subdataInRange(JSRange(8, data.length - 8));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted).then(function(decrypted){
            var decryptedData = JSData.initWithBuffer(decrypted);
            completion.call(target, decryptedData);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

    wrapKey: function(key, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        var nonce = algorithm.counter.truncatedToLength(8);
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var noncePrefixed = JSData.initWithChunks([nonce, JSData.initWithBuffer(bytes)]);
            completion.call(target, noncePrefixed);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLDecryptAlgorithm(wrappedKeyData);
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        wrappedKeyData = wrappedKeyData.subdataInRange(JSRange(8, wrappedKeyData.length - 8));
        crypto.subtle.unwrapKey("raw", wrappedKeyData, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
            completion.call(target, SECHTMLKey.initWithKey(key));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

SECCipherAESGaloisCounterMode.definePropertiesFromExtensions({

    htmlAlgorithmName: HTMLCryptoAlgorithmNames.aesGCM,

    _getHTMLEncryptAlgorithm: function(nonce, _ivLength){
        if (_ivLength === undefined){
            _ivLength = nonce.length;
        }
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: JSData.initWithLength(_ivLength),
            tagLength: 128
        };
        nonce.copyTo(algorithm.iv, 0);
        return algorithm;
    },

    _getHTMLDecryptAlgorithm: function(prefixedData, nonceLength, _ivLength){
        if (nonceLength === undefined){
            nonceLength = 8;
        }
        if (_ivLength === undefined){
            _ivLength = nonceLength;
        }
        var nonce = prefixedData.subdataInRange(JSRange(0, nonceLength));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: JSData.initWithLength(_ivLength),
            tagLength: 128
        };
        nonce.copyTo(algorithm.iv, 0);
        return algorithm;
    },

    encryptWithNonce: function(nonce, data, key, completion, target, _ivLength){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLEncryptAlgorithm(nonce, _ivLength);
        crypto.subtle.encrypt(algorithm, key.htmlKey, data).then(function(encrypted){
            var noncePrefixed = JSData.initWithChunks([nonce, JSData.initWithBuffer(encrypted)]);
            completion.call(target, noncePrefixed);
        },function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    decryptWithNonceLength: function(nonceLength, data, key, completion, target, _ivLength){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLDecryptAlgorithm(data, nonceLength, _ivLength);
        var encrypted = data.subdataInRange(JSRange(nonceLength, data.length - nonceLength));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted).then(function(decrypted){
            var decryptedData = JSData.initWithBuffer(decrypted);
            completion.call(target, decryptedData);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

    wrapKey: function(key, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var nonce = JSData.initWithArray([
            1,
            ((this.encryptedMessageId / 0x100000000) >> 16) & 0xFF,
            ((this.encryptedMessageId / 0x100000000) >> 8) & 0xFF,
            (this.encryptedMessageId / 0x100000000) & 0xFF,
            (this.encryptedMessageId >> 24) & 0xFF,
            (this.encryptedMessageId >> 16) & 0xFF,
            (this.encryptedMessageId >> 8) & 0xFF,
            this.encryptedMessageId & 0xF
        ]);
        var algorithm = this._getHTMLEncryptAlgorithm(nonce, 16);
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var noncePrefixed = JSData.initWithChunks([nonce, JSData.initWithBuffer(bytes)]);
            completion.call(target, noncePrefixed);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this._getHTMLDecryptAlgorithm(wrappedKeyData, 8, 16);
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        wrappedKeyData = wrappedKeyData.subdataInRange(JSRange(8, wrappedKeyData.length - 8));
        crypto.subtle.unwrapKey("raw", wrappedKeyData, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
            completion.call(target, SECHTMLKey.initWithKey(key));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    }
});

SECCipher.getRandomData = function(length){
    return crypto.getRandomValues(JSData.initWithLength(length));
};

})();