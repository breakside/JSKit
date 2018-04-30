// #import "Foundation/Foundation.js"
// #import "SecurityKit/SECCrypto.js"
// #import "SecurityKit/SECHTMLKey.js"
/* global crypto, JSClass, JSObject, SECCrypto, SECCryptoAESCBC, JSData, JSRange, SECHTMLKey */
// #feature window.crypto.subtle
'use strict';

SECCryptoAESCBC.definePropertiesFromExtensions({

    encrypt: function(data, key, completion){
        var algorithm = {
            name: 'AES-CBC',
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
            name: 'AES-CBC',
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
        var algorithm = {
            name: 'AES-CBC',
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