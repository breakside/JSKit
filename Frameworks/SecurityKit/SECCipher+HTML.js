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
// #import "SECASN1Parser.js"
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

var HTMLHashAlgorithms = {};
HTMLHashAlgorithms[SECHash.Algorithm.sha1] = 'SHA-1';
HTMLHashAlgorithms[SECHash.Algorithm.sha256] = 'SHA-256';
HTMLHashAlgorithms[SECHash.Algorithm.sha384] = 'SHA-384';
HTMLHashAlgorithms[SECHash.Algorithm.sha512] = 'SHA-512';

SECCipherAES.definePropertiesFromExtensions({

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

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var iv = this.iv !== null ? this.iv : this.randomIV();
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: iv
        };
        crypto.subtle.encrypt(algorithm, key.htmlKey, data).then(function(encrypted){
            // prefix the encrypted data with the random initializtion vector so
            // it is available to the decrypt function.  The iv does not need
            // to be a secret, it just needs to be random, so prefixing does not affect security.
            var ivPrefixed = JSData.initWithChunks([iv, JSData.initWithBuffer(encrypted)]);
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
        var iv = data.subdataInRange(JSRange(0, this.ivByteLength));
        var ciphertext = data.subdataInRange(JSRange(this.ivByteLength, data.length - this.ivByteLength));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: iv
        };
        crypto.subtle.decrypt(algorithm, key.htmlKey, ciphertext).then(function(decrypted){
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
        var iv = this.iv !== null ? this.iv : this.randomIV();
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: iv
        };
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var ivPrefixed = JSData.initWithChunks([iv, JSData.initWithBuffer(bytes)]);
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
        var iv = wrappedKeyData.subdataInRange(JSRange(0, this.ivByteLength));
        var ciphertext = wrappedKeyData.subdataInRange(JSRange(16, wrappedKeyData.length - 16));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: iv
        };
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        crypto.subtle.unwrapKey("raw", ciphertext, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
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

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var iv = this.iv !== null ? this.iv : this.randomIV();
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: iv,
            tagLength: this.tagByteLength << 3
        };
        if (this.additionalData !== null){
            algorithm.additionalData = this.additionalData;
        }
        crypto.subtle.encrypt(algorithm, key.htmlKey, data).then(function(encrypted){
            var ivPrefixed = JSData.initWithChunks([iv, JSData.initWithBuffer(encrypted)]);
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
        var iv = data.subdataInRange(JSRange(0, this.ivByteLength));
        var ciphertext = data.subdataInRange(JSRange(this.ivByteLength, data.length - this.ivByteLength));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: iv,
            tagLength: this.tagByteLength << 3
        };
        if (this.additionalData !== null){
            algorithm.additionalData = this.additionalData;
        }
        crypto.subtle.decrypt(algorithm, key.htmlKey, ciphertext).then(function(decrypted){
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
        var iv = this.iv !== null ? this.iv : this.randomIV();
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: iv,
            tagLength: this.tagByteLength << 3
        };
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var ivPrefixed = JSData.initWithChunks([iv, JSData.initWithBuffer(bytes)]);
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
        var iv = wrappedKeyData.subdataInRange(JSRange(0, this.ivByteLength));
        var ciphertext = wrappedKeyData.subdataInRange(JSRange(this.ivByteLength, wrappedKeyData.length - this.ivByteLength));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: iv,
            tagLength: this.tagByteLength << 3
        };
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        crypto.subtle.unwrapKey("raw", ciphertext, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
            completion.call(target, SECHTMLKey.initWithKey(key));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    }
});

SECCipherRSAOAEP.definePropertiesFromExtensions({

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: "RSA-OAEP",
            modulusLength: this.modulusLength,
            publicExponent: bigIntegerFromNumber(this.publicExponent),
            hash: HTMLHashAlgorithms[this.hash]
        };
        crypto.subtle.generateKey(algorithm, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]).then(function(htmlPair){
            var privateKey = SECHTMLKey.initWithKey(htmlPair.privateKey);
            privateKey.publicKey = SECHTMLKey.initWithKey(htmlPair.publicKey);
            completion.call(target, privateKey);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: "RSA-OAEP",
            hash: HTMLHashAlgorithms[this.hash]
        };
        var usages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
        crypto.subtle.importKey("jwk", jwk, algorithm, true, usages).then(function(htmlKey){
            var key = SECHTMLKey.initWithKey(htmlKey);
            completion.call(target, key);
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
            name: "RSA-OAEP",
            hash: HTMLHashAlgorithms[this.hash]
        };
        var usages;
        var parser;
        try{
            parser = SECASN1Parser.initWithPEM(data, "RSA PRIVATE KEY");
            data = parser.der;
            usages = ["decrypt", "unwrapKey"];
        }catch (e){
            try {
                parser = SECASN1Parser.initWithPEM(data, "RSA PUBLIC KEY");
                data = parser.der;
                usages = ["encrypt", "wrapKey"];
            }catch (e){
                // assume data was already DER
                parser = SECASN1Parser.initWithDER(data);
                var sequence = parser.parse;
                if (sequence.length > 2){
                    usages = ["decrypt", "unwrapKey"];
                }else{
                    usages = ["encrypt", "wrapKey"];
                }
            }
        }
        crypto.subtle.importKey("pkcs8", data, algorithm, true, usages).then(function(htmlKey){
            var key = SECHTMLKey.initWithKey(htmlKey);
            completion.call(target, key);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: "RSA-OAEP"
        };
        if (this.label !== null){
            algorithm.label = this.label;
        }
        crypto.subtle.encrypt(algorithm, key.htmlKey, data).then(function(encrypted){
            var encryptedData = JSData.initWithBuffer(encrypted);
            completion.call(target, encryptedData);
        },function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: "RSA-OAEP"
        };
        if (this.label !== null){
            algorithm.label = this.label;
        }
        crypto.subtle.decrypt(algorithm, key.htmlKey, data).then(function(decrypted){
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
        var algorithm = {
            name: "RSA-OAEP"
        };
        if (this.label !== null){
            algorithm.label = this.label;
        }
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var wrapped = JSData.initWithBuffer(bytes);
            completion.call(target, wrapped);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: "RSA-OAEP"
        };
        if (this.label !== null){
            algorithm.label = this.label;
        }
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
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

var bigIntegerFromNumber = function(n){
    var elements = [];
    while (n > 0){
        elements.unshift(n & 0xFF);
        n >>>= 8;
    }
    return JSData.initWithArray(elements);
};

})();