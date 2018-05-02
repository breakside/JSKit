// #import "Foundation/Foundation.js"
// #import "SecurityKit/SECCipher.js"
// #import "SecurityKit/SECHTMLKey.js"
/* global crypto, JSClass, JSObject, JSRunLoop, SECCipher, SECCipherAESCipherBlockChaining, SECCipherAESCounter, SECCipherAESGaloisCounterMode, JSData, JSRange, SECHTMLKey */
// #feature window.crypto.subtle
'use strict';

(function(){

SECCipher.definePropertiesFromExtensions({

    createHTMLKey: function(algorithmName, completion){
        var algorithm = {
            name: algorithmName,
            length: 256
        };
        var extractable = false;
        crypto.subtle.generateKey(algorithm, extractable, ["encrypt", "decrypt"]).then(function(htmlKey){
            completion(SECHTMLKey.initWithKey(htmlKey));
        }, function(){
            completion(null);
        });
    }

});

SECCipherAESCipherBlockChaining.definePropertiesFromExtensions({

    encrypt: function(data, key, completion){
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: crypto.getRandomValues(new Uint8Array(16))
        };
        crypto.subtle.encrypt(algorithm, key.htmlKey, data.bytes).then(function(encrypted){
            // prefix the encrypted data with the random initializtion vector so
            // it is available to the decrypt function.  The iv does not need
            // to be a secret, it just needs to be random, so prefixing does not affect security.
            var ivPrefixed = JSData.initWithChunks([algorithm.iv, new Uint8Array(encrypted)]);
            completion(ivPrefixed);
        },function(){
            completion(null);
        });
    },

    decrypt: function(data, key, completion){
        // Extract the initialization vector from the start of the data, then use it to decrypt the remaining data
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCBC,
            iv: data.subdataInRange(JSRange(0, 16)).bytes
        };
        var encrypted = data.subdataInRange(JSRange(16, data.length - 16));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted.bytes).then(function(decrypted){
            var decryptedData = JSData.initWithBytes(new Uint8Array(decrypted));
            completion(decryptedData);
        }, function(){
            completion(null);
        });
    },

    createKey: function(completion){
        this.createHTMLKey(HTMLCryptoAlgorithmNames.aesCBC, completion);
    }

});

SECCipherAESCounter.definePropertiesFromExtensions({

    encrypt: function(data, key, completion){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, undefined, null);
            return;
        }
        var nonce = new Uint8Array([
            1,
            ((this.messageID / 0x100000000) >> 16) & 0xFF,
            ((this.messageID / 0x100000000) >> 8) & 0xFF,
            (this.messageID / 0x100000000) & 0xFF,
            (this.messageID >> 24) & 0xFF,
            (this.messageID >> 16) & 0xFF,
            (this.messageID >> 8) & 0xFF,
            this.messageID & 0xF
        ]);
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCTR,
            counter: new Uint8Array(16),
            length: 64
        };
        nonce.copyTo(algorithm.counter, 0);
        crypto.subtle.encrypt(algorithm, key.htmlKey, data.bytes).then(function(encrypted){
            var noncePrefixed = JSData.initWithChunks([nonce, new Uint8Array(encrypted)]);
            completion(noncePrefixed);
        },function(){
            completion(null);
        });
    },

    decrypt: function(data, key, completion){
        // Extract the nonce from the start of the data, then use it to decrypt the remaining data
        var nonce = data.subdataInRange(JSRange(0, 8));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesCTR,
            counter: new Uint8Array(16),
            length: 64
        };
        nonce.bytes.copyTo(algorithm.counter, 0);
        var encrypted = data.subdataInRange(JSRange(8, data.length - 8));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted.bytes).then(function(decrypted){
            var decryptedData = JSData.initWithBytes(new Uint8Array(decrypted));
            completion(decryptedData);
        }, function(error){
            completion(null);
        });
    },

    createKey: function(completion){
        this.createHTMLKey(HTMLCryptoAlgorithmNames.aesCTR, completion);
    }

});

SECCipherAESGaloisCounterMode.definePropertiesFromExtensions({

    encrypt: function(data, key, completion){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, undefined, null);
            return;
        }
        var nonce = new Uint8Array([
            1,
            ((this.messageID / 0x100000000) >> 16) & 0xFF,
            ((this.messageID / 0x100000000) >> 8) & 0xFF,
            (this.messageID / 0x100000000) & 0xFF,
            (this.messageID >> 24) & 0xFF,
            (this.messageID >> 16) & 0xFF,
            (this.messageID >> 8) & 0xFF,
            this.messageID & 0xF
        ]);
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: new Uint8Array(16),
            tagLength: 128
        };
        nonce.copyTo(algorithm.iv, 0);
        crypto.subtle.encrypt(algorithm, key.htmlKey, data.bytes).then(function(encrypted){
            var noncePrefixed = JSData.initWithChunks([nonce, new Uint8Array(encrypted)]);
            completion(noncePrefixed);
        },function(){
            completion(null);
        });
    },

    decrypt: function(data, key, completion){
        // Extract the nonce from the start of the data, then use it to decrypt the remaining data
        var nonce = data.subdataInRange(JSRange(0, 8));
        var algorithm = {
            name: HTMLCryptoAlgorithmNames.aesGCM,
            iv: new Uint8Array(16),
            tagLength: 128
        };
        nonce.bytes.copyTo(algorithm.iv, 0);
        var encrypted = data.subdataInRange(JSRange(8, data.length - 8));
        crypto.subtle.decrypt(algorithm, key.htmlKey, encrypted.bytes).then(function(decrypted){
            var decryptedData = JSData.initWithBytes(new Uint8Array(decrypted));
            completion(decryptedData);
        }, function(error){
            completion(null);
        });
    },

    createKey: function(completion){
        this.createHTMLKey(HTMLCryptoAlgorithmNames.aesGCM, completion);
    }

});

var HTMLCryptoAlgorithmNames = {
    aesCBC: 'AES-CBC',
    aesCTR: 'AES-CTR',
    aesGCM: 'AES-GCM'
};

})();