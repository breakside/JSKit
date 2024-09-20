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
// #import "SECASN1Parser.js"
// #import "SECJSONWebAlgorithms.js"
// jshint node: true
'use strict';

var crypto = require('crypto');

SECCipher.definePropertiesFromExtensions({

    wrapKey: function(key, wrappingKey, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        key.getData(function(keyData){
            this.encrypt(keyData, wrappingKey, completion, target);
        }, this);
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

});

SECCipherAES.definePropertiesFromExtensions({

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        crypto.generateKey("aes", {length: this.keyBitLength}, function(error, key){
            if (error){
                completion.call(target, null);
            }else{
                completion.call(target, SECNodeKey.initWithNodeKeyObject(key));
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

    nodeCipherName: JSLazyInitProperty(function(){
        switch (this.keyByteLength){
            case 16:
                return 'AES-128-CBC';
            case 24:
                return 'AES-192-CBC';
            case 32:
                return 'AES-256-CBC';
        }
        return null;
    }),

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.nodeCipherName === null){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var iv = this.iv !== null ? this.iv : this.randomIV();
        var cipher = crypto.createCipheriv(this.nodeCipherName, key.nodeKeyObject, iv);
        var chunks = [iv, cipher.update(data), cipher.final()];
        JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        try{
            if (this.nodeCipherName === null){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            var iv = data.subdataInRange(JSRange(0, this.ivByteLength));
            var ciphertext = data.subdataInRange(JSRange(this.ivByteLength, data.length - this.ivByteLength));
            var cipher = crypto.createDecipheriv(this.nodeCipherName, key.nodeKeyObject, iv);
            var chunks = [cipher.update(ciphertext), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch (e){
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    }

});

SECCipherAESCounter.definePropertiesFromExtensions({

    nodeCipherName: JSLazyInitProperty(function(){
        switch (this.keyByteLength){
            case 16:
                return 'AES-128-CTR';
            case 24:
                return 'AES-192-CTR';
            case 32:
                return 'AES-256-CTR';
        }
        return null;
    }),

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!this.ensureUniqueMessageID()){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        if (this.nodeCipherName === null){
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
        var cipher = crypto.createCipheriv(this.nodeCipherName, key.nodeKeyObject, iv);
        var chunks = [nonce, cipher.update(data), cipher.final()];
        JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        try{
            if (this.nodeCipherName === null){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            var nonce = data.subdataInRange(JSRange(0, 8));
            var iv = JSData.initWithLength(16);
            nonce.copyTo(iv, 0);
            var cipher = crypto.createDecipheriv(this.nodeCipherName, key.nodeKeyObject, iv);
            var chunks = [cipher.update(data.subdataInRange(JSRange(8, data.length - 8))), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch (e){
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    }

});

SECCipherAESGaloisCounterMode.definePropertiesFromExtensions({

    nodeCipherName: JSLazyInitProperty(function(){
        switch (this.keyByteLength){
            case 16:
                return 'id-aes128-GCM';
            case 24:
                return 'id-aes192-GCM';
            case 32:
                return 'id-aes256-GCM';
        }
        return null;
    }),

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.nodeCipherName === null){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var iv = this.iv !== null ? this.iv : this.randomIV();
        var cipher = crypto.createCipheriv(this.nodeCipherName, key.nodeKeyObject, iv);
        if (this.additionalData){
            cipher.setAAD(this.additionalData);
        }
        var chunks = [iv, cipher.update(data), cipher.final()];
        var tag = JSData.initWithLength(this.tagByteLength);
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
            if (this.nodeCipherName === null){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            var iv = data.subdataInRange(JSRange(0, this.ivByteLength));
            var ciphertext = data.subdataInRange(JSRange(this.ivByteLength, data.length - this.ivByteLength - this.tagByteLength));
            var tag = data.subdataInRange(JSRange(data.length - this.tagByteLength, this.tagByteLength));
            var cipher = crypto.createDecipheriv(this.nodeCipherName, key.nodeKeyObject, iv);
            if (this.additionalData){
                cipher.setAAD(this.additionalData);
            }
            cipher.setAuthTag(tag);
            var chunks = [cipher.update(ciphertext), cipher.final()];
            JSRunLoop.main.schedule(completion, target, JSData.initWithChunks(chunks));
        }catch(e){
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    }

});

SECCipherRSAOAEP.definePropertiesFromExtensions({

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var options = {
            key: key.nodeKeyObject,
            oaepHash: this.hash
        };
        if (this.label !== null){
            options.oaepLabel = this.label;
        }
        var encryptedBuffer = crypto.publicEncrypt(options, data);
        JSRunLoop.main.schedule(completion, target, JSData.initWithNodeBuffer(encryptedBuffer));
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var options = {
            key: key.nodeKeyObject,
            oaepHash: this.hash
        };
        if (this.label !== null){
            options.oaepLabel = this.label;
        }
        var decryptedBuffer = crypto.privateDecrypt(options, data);
        JSRunLoop.main.schedule(completion, target, JSData.initWithNodeBuffer(decryptedBuffer));
        return completion.promise;
    },

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var options = {
            modulusLength: this.modulusLength,
            publicExponent: this.publicExponent
        };
        crypto.generateKeyPair("rsa", options, function(err, publicNodeKey, privateNodeKey){
            if (err){
                completion.call(target, null);
                return;
            }
            var privateKey = SECNodeKey.initWithNodeKeyObject(privateNodeKey, {alg: SECJSONWebAlgorithms.Algorithm.rsaOAEP});
            privateKey.publicKey = SECNodeKey.initWithNodeKeyObject(publicNodeKey, {alg: SECJSONWebAlgorithms.Algorithm.rsaOAEP});
            completion.call(target, privateKey);
        });
        return completion.promise;
    },

    createKeyWithData: function(data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var parser;
        var key;
        try{
            parser = SECASN1Parser.initWithPEM(data, "RSA PRIVATE KEY");
            key = crypto.createPrivateKey({key: parser.der, format: "der"});
        }catch (e){
            try {
                parser = SECASN1Parser.initWithPEM(data, "RSA PUBLIC KEY");
                key = crypto.createPublicKey({key: parser.der, format: "der"});
            }catch (e){
                parser = SECASN1Parser.initWithDER(data);
                var sequence = parser.parse();
                if (sequence.length > 2){
                    key = crypto.createPrivateKey({key: parser.der, format: "der"});
                }else{
                    key = crypto.createPublicKey({key: parser.der, format: "der"});
                }
            }
        }
        JSRunLoop.main.schedule(completion, target, SECNodeKey.initWithNodeKeyObject(key));
        return completion.promise;
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var key = null;
        if (jwk.d){
            key = crypto.createPrivateKey({key: jwk, format: "jwk"});
        }else{
            key = crypto.createPublicKey({key: jwk, format: "jwk"});
        }
        JSRunLoop.main.schedule(completion, target, SECNodeKey.initWithNodeKeyObject(key));
        return completion.promise;
    },

});

SECCipher.getRandomData = function(length){
    return JSData.initWithNodeBuffer(crypto.randomBytes(length));
};