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
// #import "SECNodeKey.js"
// jshint node: true
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
        crypto.randomBytes(this.keyByteLength, function(error, keyBytes){
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

    encryptWithNonce: function(nonce, data, key, completion, target, _ivLength){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var name = this._cipherNameForKey(key);
        if (name === null){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        if (_ivLength === undefined){
            _ivLength = nonce.length;
        }
        var iv = JSData.initWithLength(_ivLength);
        nonce.copyTo(iv, 0);
        var cipher = crypto.createCipheriv(name, key.keyData, iv);
        var chunks = [nonce, cipher.update(data), cipher.final()];
        var tagLength = 16;
        var tag = JSData.initWithLength(tagLength);
        cipher.getAuthTag().copyTo(tag, 0);
        chunks.push(tag);
        JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        return completion.promise;
    },

    decryptWithNonceLength: function(nonceLength, data, key, completion, target, _ivLength){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        try{
            var name = this._cipherNameForKey(key);
            if (name === null){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            var nonce = data.subdataInRange(JSRange(0, nonceLength));
            if (_ivLength === undefined){
                _ivLength = nonceLength;
            }
            var iv = JSData.initWithLength(_ivLength);
            nonce.copyTo(iv, 0);
            var cipher = crypto.createDecipheriv(name, key.keyData, iv);
            var tagLength = 16;
            var tag = data.subdataInRange(JSRange(data.length - tagLength, tagLength));
            cipher.setAuthTag(tag);
            var chunks = [cipher.update(data.subdataInRange(JSRange(nonceLength, data.length - nonceLength - tagLength))), cipher.final()];
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