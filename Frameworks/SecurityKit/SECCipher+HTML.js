// #import "Foundation/Foundation.js"
// #import "SecurityKit/SECCipher.js"
// #import "SecurityKit/SECHTMLKey.js"
/* global crypto, JSClass, JSObject, JSRunLoop, SECCipher, SECCipherAESCipherBlockChaining, SECCipherAESCounter, SECCipherAESGaloisCounterMode, JSData, JSRange, SECHTMLKey */
// #feature window.crypto.subtle
'use strict';

(function(){

var HTMLCryptoAlgorithmNames = {
    aesCBC: 'AES-CBC',
    aesCTR: 'AES-CTR',
    aesGCM: 'AES-GCM',
    pbkdf2: 'PBKDF2',

    fromAlgorithm: function(algorithm){
        switch (algorithm){
            case SECCipher.Algorithm.aesCipherBlockChaining:
                return HTMLCryptoAlgorithmNames.aesCBC;
            case SECCipher.Algorithm.aesCounter:
                return HTMLCryptoAlgorithmNames.aesCTR;
            case SECCipher.Algorithm.aesGaloisCounterMode:
                return HTMLCryptoAlgorithmNames.aesGCM;
            case SECCipher.Algorithm.rc4:
        }
        return null;
    }
};

SECCipher.definePropertiesFromExtensions({

    htmlAlgorithmName: null,

    createKey: function(completion, target){
        var algorithm = {
            name: this.htmlAlgorithmName,
            length: 256
        };
        var extractable = true;
        crypto.subtle.generateKey(algorithm, extractable, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]).then(function(htmlKey){
            completion.call(target, SECHTMLKey.initWithKey(htmlKey));
        }, function(e){
            completion.call(target, null);
        });
    },

    createKeyWithData: function(data, completion, target){
        var algorithm = {
            name: this.htmlAlgorithmName
        };
        var extractable = true;
        crypto.subtle.importKey("raw", data.bytes, algorithm, extractable, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]).then(function(htmlKey){
            completion.call(target, SECHTMLKey.initWithKey(htmlKey));
        }, function(e){
            completion.call(target, null);
        });
    },

    createKeyWithPassphrase: function(passphrase, salt, completion, target){
        // 1. Create a new PBKDF (Password-Based Key Derivation Function) key, using just the raw passphrase,
        //    with permission to derive a key
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.pbkdf2
        };
        var derivedAlgorithmName = this.htmlAlgorithmName;
        crypto.subtle.importKey('raw', passphrase.utf8().bytes, algorithm, false, ["deriveKey"]).then(function(masterKey){
            // 2. Derive a key using the PBKDF algorithm and the given salt, resulting in a key suitable
            //    for use with this cipher
            var algorithm = {
                name: HTMLCryptoAlgorithmNames.pbkdf2,
                salt: salt.bytes,
                iterations: 500000,
                hash: 'SHA-512'
            };
            var derivedAlgorithm = {
                name: derivedAlgorithmName,
                length: 256
            };
            return crypto.subtle.deriveKey(algorithm, masterKey, derivedAlgorithm, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]);
        }).then(function(derivedKey){
            completion.call(target, SECHTMLKey.initWithKey(derivedKey));
        }, function(e){
            completion.call(target, null);
        });
    }

});

SECCipherAESCipherBlockChaining.definePropertiesFromExtensions({

    htmlAlgorithmName: HTMLCryptoAlgorithmNames.aesCBC,

    _getHTMLEncryptAlgorithm: function(){
        return {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: crypto.getRandomValues(new Uint8Array(16))
        };
    },

    _getHTMLDecryptAlgorithm: function(prefixedData){
        return {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: prefixedData.subdataInRange(JSRange(0, 16)).bytes
        };
    },

    encrypt: function(data, key, completion, target){
        var algorithm = this._getHTMLEncryptAlgorithm();
        crypto.subtle.encrypt(algorithm, key.htmlKey, data.bytes).then(function(encrypted){
            // prefix the encrypted data with the random initializtion vector so
            // it is available to the decrypt function.  The iv does not need
            // to be a secret, it just needs to be random, so prefixing does not affect security.
            var ivPrefixed = JSData.initWithChunks([algorithm.iv, new Uint8Array(encrypted)]);
            completion.call(target, ivPrefixed);
        },function(e){
            completion.call(target, null);
        });
    },

    decrypt: function(data, key, completion, target){
        var algorithm = this._getHTMLDecryptAlgorithm(data);
        var encrypted = data.subdataInRange(JSRange(16, data.length - 16));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted.bytes).then(function(decrypted){
            var decryptedData = JSData.initWithBytes(new Uint8Array(decrypted));
            completion.call(target, decryptedData);
        }, function(e){
            completion.call(target, null);
        });
    },

    wrapKey: function(key, wrappingKey, completion, target){
        var algorithm = this._getHTMLEncryptAlgorithm();
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var ivPrefixed = JSData.initWithChunks([algorithm.iv, new Uint8Array(bytes)]);
            completion.call(target, ivPrefixed);
        }, function(e){
            completion.call(target, null);
        });
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        var algorithm = this._getHTMLDecryptAlgorithm(wrappedKeyData);
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        wrappedKeyData = wrappedKeyData.subdataInRange(JSRange(16, wrappedKeyData.length - 16));
        crypto.subtle.unwrapKey("raw", wrappedKeyData.bytes, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
            completion.call(target, SECHTMLKey.initWithKey(key));
        }, function(e){
            completion.call(target, null);
        });
    }

});

SECCipherAESCounter.definePropertiesFromExtensions({

    htmlAlgorithmName: HTMLCryptoAlgorithmNames.aesCTR,

    _getHTMLEncryptAlgorithm: function(){
        var nonce = new Uint8Array([
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
            counter: new Uint8Array(16),
            length: 64
        };
        nonce.copyTo(algorithm.counter, 0);
        return algorithm;
    },

    _getHTMLDecryptAlgorithm: function(prefixedData){
        var nonce = prefixedData.subdataInRange(JSRange(0, 8));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCTR,
            counter: new Uint8Array(16),
            length: 64
        };
        this.decryptedMessageId =
              (nonce.bytes[6] << 48)
            | (nonce.bytes[5] << 40)
            | (nonce.bytes[4] << 32)
            | (nonce.bytes[3] << 24)
            | (nonce.bytes[2] << 16)
            | (nonce.bytes[1] << 8)
            | (nonce.bytes[0]);
        nonce.bytes.copyTo(algorithm.counter, 0);
        return algorithm;
    },

    encrypt: function(data, key, completion, target){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, undefined, null);
            return;
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        var nonce = new Uint8Array(algorithm.counter.buffer, algorithm.counter.byteOffset, 8);
        crypto.subtle.encrypt(algorithm, key.htmlKey, data.bytes).then(function(encrypted){
            var noncePrefixed = JSData.initWithChunks([nonce, new Uint8Array(encrypted)]);
            completion.call(target, noncePrefixed);
        },function(e){
            completion.call(target, null);
        });
    },

    decrypt: function(data, key, completion, target){
        // Extract the nonce from the start of the data, then use it to decrypt the remaining data
        var algorithm = this._getHTMLDecryptAlgorithm(data);
        var encrypted = data.subdataInRange(JSRange(8, data.length - 8));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted.bytes).then(function(decrypted){
            var decryptedData = JSData.initWithBytes(new Uint8Array(decrypted));
            completion.call(target, decryptedData);
        }, function(error){
            completion.call(target, null);
        });
    },

    wrapKey: function(key, wrappingKey, completion, target){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        var nonce = new Uint8Array(algorithm.counter.buffer, algorithm.counter.byteOffset, 8);
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var noncePrefixed = JSData.initWithChunks([nonce, new Uint8Array(bytes)]);
            completion.call(target, noncePrefixed);
        }, function(e){
            completion.call(target, null);
        });
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        var algorithm = this._getHTMLDecryptAlgorithm(wrappedKeyData);
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        wrappedKeyData = wrappedKeyData.subdataInRange(JSRange(8, wrappedKeyData.length - 8));
        crypto.subtle.unwrapKey("raw", wrappedKeyData.bytes, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
            completion.call(target, SECHTMLKey.initWithKey(key));
        }, function(e){
            completion.call(target, null);
        });
    }

});

SECCipherAESGaloisCounterMode.definePropertiesFromExtensions({

    htmlAlgorithmName: HTMLCryptoAlgorithmNames.aesGCM,

    _getHTMLEncryptAlgorithm: function(){
        var nonce = new Uint8Array([
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
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: new Uint8Array(16),
            tagLength: 128
        };
        nonce.copyTo(algorithm.iv, 0);
        return algorithm;
    },

    _getHTMLDecryptAlgorithm: function(prefixedData){
        var nonce = prefixedData.subdataInRange(JSRange(0, 8));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: new Uint8Array(16),
            tagLength: 128
        };
        this.decryptedMessageId =
              (nonce.bytes[6] << 48)
            | (nonce.bytes[5] << 40)
            | (nonce.bytes[4] << 32)
            | (nonce.bytes[3] << 24)
            | (nonce.bytes[2] << 16)
            | (nonce.bytes[1] << 8)
            | (nonce.bytes[0]);
        nonce.bytes.copyTo(algorithm.iv, 0);
        return algorithm;
    },

    encrypt: function(data, key, completion, target){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        var nonce = new Uint8Array(algorithm.iv.buffer, algorithm.iv.byteOffset, 8);
        crypto.subtle.encrypt(algorithm, key.htmlKey, data.bytes).then(function(encrypted){
            var noncePrefixed = JSData.initWithChunks([nonce, new Uint8Array(encrypted)]);
            completion.call(target, noncePrefixed);
        },function(e){
            completion.call(target, null);
        });
    },

    decrypt: function(data, key, completion, target){
        var algorithm = this._getHTMLDecryptAlgorithm(data);
        var encrypted = data.subdataInRange(JSRange(8, data.length - 8));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted.bytes).then(function(decrypted){
            var decryptedData = JSData.initWithBytes(new Uint8Array(decrypted));
            completion.call(target, decryptedData);
        }, function(error){
            completion.call(target, null);
        });
    },

    wrapKey: function(key, wrappingKey, completion, target){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        var algorithm = this._getHTMLEncryptAlgorithm();
        var nonce = new Uint8Array(algorithm.iv.buffer, algorithm.iv.byteOffset, 8);
        crypto.subtle.wrapKey("raw", key.htmlKey, wrappingKey.htmlKey, algorithm).then(function(bytes){
            var noncePrefixed = JSData.initWithChunks([nonce, new Uint8Array(bytes)]);
            completion.call(target, noncePrefixed);
        }, function(e){
            completion.call(target, null);
        });
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        var algorithm = this._getHTMLDecryptAlgorithm(wrappedKeyData);
        var unwrappedKeyHTMLAlgorithm = HTMLCryptoAlgorithmNames.fromAlgorithm(unwrappedKeyAlgorithm);
        wrappedKeyData = wrappedKeyData.subdataInRange(JSRange(8, wrappedKeyData.length - 8));
        crypto.subtle.unwrapKey("raw", wrappedKeyData.bytes, wrappingKey.htmlKey, algorithm, unwrappedKeyHTMLAlgorithm, true, ["encrypt", "decrypt"]).then(function(key){
            completion.call(target, SECHTMLKey.initWithKey(key));
        }, function(e){
            completion.call(target, null);
        });
    }
});

SECCipher.getRandomData = function(length){
    return JSData.initWithBytes(crypto.getRandomValues(new Uint8Array(length)));
};

})();