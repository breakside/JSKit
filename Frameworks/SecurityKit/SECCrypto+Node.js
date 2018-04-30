// #import "Foundation/Foundation.js"
// #import "SecurityKit/SECCrypto.js"
// #import "SecurityKit/SECNodeKey.js"
/* global require, JSClass, JSObject, SECCrypto, SECCryptoAESCBC, JSData, JSRange, SECNodeKey */
'use strict';

var crypto = require('crypto');

SECCryptoAESCBC.definePropertiesFromExtensions({

    encrypt: function(data, key, completion){
        crypto.randomBytes(16, function(error, iv){
            if (error){
                completion(null);
            }else{
                var cipher = crypto.createCipheriv('AES-256-CBC', key.keyData.bytes, iv);
                var chunks = [iv, cipher.update(data.bytes), cipher.final()];
                completion(JSData.initWithChunks(chunks));
            }
        });
    },

    decrypt: function(data, key, completion){
        var iv = data.subdataInRange(JSRange(0, 16)).bytes;
        var cipher = crypto.createDecipheriv('AES-256-CBC', key.keyData.bytes, iv);
        var chunks = [cipher.update(data.subdataInRange(JSRange(16, data.length - 16)).bytes), cipher.final()];
        completion(JSData.initWithChunks(chunks));
    },

    createKey: function(completion){
        crypto.randomBytes(32, function(error, keyBytes){
            if (error){
                completion(null);
            }else{
                completion(SECNodeKey.initWithBytes(keyBytes));
            }
        });
    }

});