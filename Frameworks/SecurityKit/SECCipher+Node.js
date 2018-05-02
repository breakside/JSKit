// #import "Foundation/Foundation.js"
// #import "SecurityKit/SECCipher.js"
// #import "SecurityKit/SECNodeKey.js"
/* global require, JSClass, JSObject, JSRunLoop, SECCipher, SECCipherAESCipherBlockChaining, SECCipherAESCounter, SECCipherAESGaloisCounterMode, JSData, JSRange, SECNodeKey */
'use strict';

var crypto = require('crypto');

SECCipher.definePropertiesFromExtensions({
    createNodeKey: function(completion){
        crypto.randomBytes(32, function(error, keyBytes){
            if (error){
                completion(null);
            }else{
                completion(SECNodeKey.initWithBytes(keyBytes));
            }
        });
    }
});

SECCipherAESCipherBlockChaining.definePropertiesFromExtensions({

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
        JSRunLoop.main.schedule(completion, undefined, JSData.initWithChunks(chunks));
    },

    createKey: function(completion){
        this.createNodeKey(completion);
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
        var iv = new Uint8Array(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createCipheriv('AES-256-CTR', key.keyData.bytes, iv);
        var chunks = [nonce, cipher.update(data.bytes), cipher.final()];
        JSRunLoop.main.schedule(completion, undefined, JSData.initWithChunks(chunks));
    },

    decrypt: function(data, key, completion){
        var nonce = data.subdataInRange(JSRange(0, 8)).bytes;
        var iv = new Uint8Array(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createDecipheriv('AES-256-CTR', key.keyData.bytes, iv);
        var chunks = [cipher.update(data.subdataInRange(JSRange(8, data.length - 8)).bytes), cipher.final()];
        JSRunLoop.main.schedule(completion, undefined, JSData.initWithChunks(chunks));
    },

    createKey: function(completion){
        this.createNodeKey(completion);
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
        var iv = new Uint8Array(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createCipheriv('id-aes256-GCM', key.keyData.bytes, iv);
        var chunks = [nonce, cipher.update(data.bytes), cipher.final()];
        var tag = new Uint8Array(16);
        cipher.getAuthTag().copyTo(tag, 0);
        chunks.push(tag);
        JSRunLoop.main.schedule(completion, undefined, JSData.initWithChunks(chunks));
    },

    decrypt: function(data, key, completion){
        var nonce = data.subdataInRange(JSRange(0, 8)).bytes;
        var iv = new Uint8Array(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createDecipheriv('id-aes256-GCM', key.keyData.bytes, iv);
        var tag = data.subdataInRange(JSRange(data.length - 16, 16)).bytes;
        cipher.setAuthTag(tag);
        var chunks = [cipher.update(data.subdataInRange(JSRange(8, data.length - 8 - 16)).bytes), cipher.final()];
        JSRunLoop.main.schedule(completion, undefined, JSData.initWithChunks(chunks));
    },

    createKey: function(completion){
        this.createNodeKey(completion);
    }

});