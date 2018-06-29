// #import "Foundation/Foundation.js"
// #import "SecurityKit/SECCipher.js"
// #import "SecurityKit/SECNodeKey.js"
/* global require, JSClass, JSObject, JSRunLoop, SECCipher, SECCipherAESCipherBlockChaining, SECCipherAESCounter, SECCipherAESGaloisCounterMode, JSData, JSRange, SECNodeKey */
'use strict';

var crypto = require('crypto');

SECCipher.definePropertiesFromExtensions({

    wrapKey: function(key, wrappingKey, completion, target){
        this.encrypt(key.keyData, wrappingKey, completion, target);
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        this.decrypt(wrappedKeyData, wrappingKey, function(decrypted){
            if (decrypted !== null){
                completion.call(target, SECNodeKey.initWithData(decrypted));
            }else{
                completion.call(target, null);
            }
        }, this);
    },

    createKey: function(completion, target){
        crypto.randomBytes(32, function(error, keyBytes){
            if (error){
                completion.call(target, null);
            }else{
                completion.call(target, SECNodeKey.initWithBytes(keyBytes));
            }
        });
    },

    createKeyWithData: function(data, completion, target){
        var key = SECNodeKey.initWithData(data);
        JSRunLoop.main.schedule(completion, target, key);
    },

    createKeyWithPassphrase: function(passphrase, salt, completion, target){
        var utf8Passphrase = String.fromCharCode.apply(String, passphrase.utf8().bytes);
        var saltString = String.fromCharCode.apply(String, salt.bytes);
        crypto.pbkdf2(utf8Passphrase, saltString, 1000000, 32, 'sha512', function(error, derivedBytes){
            if (error){
                completion.call(target, null);
            }else{
                completion.call(target, SECNodeKey.initWithBytes(derivedBytes));
            }
        });
    },
});

SECCipherAESCipherBlockChaining.definePropertiesFromExtensions({

    encrypt: function(data, key, completion, target){
        crypto.randomBytes(16, function(error, iv){
            if (error){
                completion.call(target, null);
            }else{
                var cipher = crypto.createCipheriv('AES-256-CBC', key.keyData.bytes, iv);
                var chunks = [iv, cipher.update(data.bytes), cipher.final()];
                completion.call(target, JSData.initWithChunks(chunks));
            }
        });
    },

    decrypt: function(data, key, completion, target){
        try{
            var iv = data.subdataInRange(JSRange(0, 16)).bytes;
            var cipher = crypto.createDecipheriv('AES-256-CBC', key.keyData.bytes, iv);
            var chunks = [cipher.update(data.subdataInRange(JSRange(16, data.length - 16)).bytes), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch (e){
            JSRunLoop.main.schedule(completion, target, null);
        }
    }

});

SECCipherAESCounter.definePropertiesFromExtensions({

    encrypt: function(data, key, completion, target){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
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
        var iv = new Uint8Array(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createCipheriv('AES-256-CTR', key.keyData.bytes, iv);
        var chunks = [nonce, cipher.update(data.bytes), cipher.final()];
        JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
    },

    decrypt: function(data, key, completion, target){
        try{
            var nonce = data.subdataInRange(JSRange(0, 8)).bytes;
            var iv = new Uint8Array(16);
            nonce.copyTo(iv, 0);
            var cipher = crypto.createDecipheriv('AES-256-CTR', key.keyData.bytes, iv);
            var chunks = [cipher.update(data.subdataInRange(JSRange(8, data.length - 8)).bytes), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch (e){
            JSRunLoop.main.schedule(completion, target, null);
        }
    }

});

SECCipherAESGaloisCounterMode.definePropertiesFromExtensions({

    encrypt: function(data, key, completion, target){
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
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
        var iv = new Uint8Array(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createCipheriv('id-aes256-GCM', key.keyData.bytes, iv);
        var chunks = [nonce, cipher.update(data.bytes), cipher.final()];
        var tag = new Uint8Array(16);
        cipher.getAuthTag().copyTo(tag, 0);
        chunks.push(tag);
        JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
    },

    decrypt: function(data, key, completion, target){
        try{
            var nonce = data.subdataInRange(JSRange(0, 8)).bytes;
            var iv = new Uint8Array(16);
            nonce.copyTo(iv, 0);
            var cipher = crypto.createDecipheriv('id-aes256-GCM', key.keyData.bytes, iv);
            var tag = data.subdataInRange(JSRange(data.length - 16, 16)).bytes;
            cipher.setAuthTag(tag);
            var chunks = [cipher.update(data.subdataInRange(JSRange(8, data.length - 8 - 16)).bytes), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch(e){
            JSRunLoop.main.schedule(completion, target, null);
        }
    }

});

SECCipher.getRandomData = function(length){
    return JSData.initWithBytes(crypto.randomBytes(length));
};