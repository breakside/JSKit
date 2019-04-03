// #import Foundation
// #import "SecurityKit/SECCipher.js"
// #import "SecurityKit/SECNodeKey.js"
/* global require, JSClass, JSObject, JSRunLoop, SECCipher, SECCipherAESCipherBlockChaining, SECCipherAESCounter, SECCipherAESGaloisCounterMode, JSData, JSRange, SECNodeKey */
'use strict';

var crypto = require('crypto');

SECCipher.definePropertiesFromExtensions({

    wrapKey: function(key, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.encrypt(key.keyData, wrappingKey, completion, target);
        return completion.promise;
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.decrypt(wrappedKeyData, wrappingKey, function(decrypted){
            if (decrypted !== null){
                completion.call(target, SECNodeKey.initWithData(decrypted));
            }else{
                completion.call(target, null);
            }
        }, this);
        return completion.promise;
    },

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        crypto.randomBytes(32, function(error, keyBytes){
            if (error){
                completion.call(target, null);
            }else{
                completion.call(target, SECNodeKey.initWithData(JSData.initWithNodeBuffer(keyBytes)));
            }
        });
        return completion.promise;
    },

    createKeyWithData: function(data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var key = SECNodeKey.initWithData(data);
        JSRunLoop.main.schedule(completion, target, key);
        return completion.promise;
    },

    createKeyWithPassphrase: function(passphrase, salt, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var utf8Passphrase = String.fromCharCode.apply(String, passphrase.utf8());
        var saltString = String.fromCharCode.apply(String, salt);
        crypto.pbkdf2(utf8Passphrase, saltString, 500000, 32, 'sha512', function(error, derivedBytes){
            if (error){
                completion.call(target, null);
            }else{
                completion.call(target, SECNodeKey.initWithData(JSData.initWithNodeBuffer(derivedBytes)));
            }
        });
        return completion.promise;
    },
});

SECCipherAESCipherBlockChaining.definePropertiesFromExtensions({

    _cipherNameForKey: function(key){
        switch (key.keyData.length){
            case 16:
                return 'AES-128-CBC';
            case 24:
                return 'AES-192-CBC';
            case 32:
                return 'AES-256-CBC';
        }
        return null;
    },

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var name = this._cipherNameForKey(key);
        crypto.randomBytes(16, function(error, iv){
            if (error){
                completion.call(target, null);
                return;
            }
            if (name === null){
                completion.call(target, null);
                return;
            }
            var cipher = crypto.createCipheriv(name, key.keyData, iv);
            var chunks = [iv, cipher.update(data), cipher.final()];
            completion.call(target, JSData.initWithChunks(chunks));
        });
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        try{
            var name = this._cipherNameForKey(key);
            if (name === null){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            var iv = data.subdataInRange(JSRange(0, 16));
            var cipher = crypto.createDecipheriv(name, key.keyData, iv);
            var chunks = [cipher.update(data.subdataInRange(JSRange(16, data.length - 16))), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch (e){
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    }

});

SECCipherAESCounter.definePropertiesFromExtensions({

    _cipherNameForKey: function(key){
        switch (key.keyData.length){
            case 16:
                return 'AES-128-CTR';
            case 24:
                return 'AES-192-CTR';
            case 32:
                return 'AES-256-CTR';
        }
        return null;
    },

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var name = this._cipherNameForKey(key);
        if (name === null){
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
        var iv = JSData.initWithLength(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createCipheriv(name, key.keyData, iv);
        var chunks = [nonce, cipher.update(data), cipher.final()];
        JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        try{
            var name = this._cipherNameForKey(key);
            if (name === null){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            var nonce = data.subdataInRange(JSRange(0, 8));
            this.decryptedMessageId =
                  (nonce[6] << 48)
                | (nonce[5] << 40)
                | (nonce[4] << 32)
                | (nonce[3] << 24)
                | (nonce[2] << 16)
                | (nonce[1] << 8)
                | (nonce[0]);
            var iv = JSData.initWithLength(16);
            nonce.copyTo(iv, 0);
            var cipher = crypto.createDecipheriv(name, key.keyData, iv);
            var chunks = [cipher.update(data.subdataInRange(JSRange(8, data.length - 8))), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch (e){
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    }

});

SECCipherAESGaloisCounterMode.definePropertiesFromExtensions({

    _cipherNameForKey: function(key){
        switch (key.keyData.length){
            case 16:
                return 'id-aes128-GCM';
            case 24:
                return 'id-aes192-GCM';
            case 32:
                return 'id-aes256-GCM';
        }
        return null;
    },

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var name = this._cipherNameForKey(key);
        if (name === null){
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
        var iv = JSData.initWithLength(16);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createCipheriv(name, key.keyData, iv);
        var chunks = [nonce, cipher.update(data), cipher.final()];
        var tag = JSData.initWithLength(16);
        cipher.getAuthTag().copyTo(tag, 0);
        chunks.push(tag);
        JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        try{
            var name = this._cipherNameForKey(key);
            if (name === null){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            var nonce = data.subdataInRange(JSRange(0, 8));
            this.decryptedMessageId =
                  (nonce[6] << 48)
                | (nonce[5] << 40)
                | (nonce[4] << 32)
                | (nonce[3] << 24)
                | (nonce[2] << 16)
                | (nonce[1] << 8)
                | (nonce[0]);
            var iv = JSData.initWithLength(16);
            nonce.copyTo(iv, 0);
            var cipher = crypto.createDecipheriv(name, key.keyData, iv);
            var tag = data.subdataInRange(JSRange(data.length - 16, 16));
            cipher.setAuthTag(tag);
            var chunks = [cipher.update(data.subdataInRange(JSRange(8, data.length - 8 - 16))), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch(e){
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    }

});

SECCipher.getRandomData = function(length){
    return JSData.initWithNodeBuffer(crypto.randomBytes(length));
};