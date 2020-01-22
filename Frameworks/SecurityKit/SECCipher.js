// #import Foundation
// #import "SECDataKey.js"
'use strict';

JSClass("SECCipher", JSObject, {

    initWithAlgorithm: function(algorithm){
        switch (algorithm){
            case SECCipher.Algorithm.aesCipherBlockChaining:
                return SECCipherAESCipherBlockChaining.init();
            case SECCipher.Algorithm.aesCounter:
                return SECCipherAESCounter.init();
            case SECCipher.Algorithm.aesGaloisCounterMode:
                return SECCipherAESGaloisCounterMode.init();
            case SECCipher.Algorithm.rivestCipher4:
                return SECCipherRC4.init();
        }
        return null;
    },

    encrypt: function(data, key, completion, target){
        // Implemented in subclasses
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, null);
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        // Implemented in subclasses
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, null);
        return completion.promise;
    },

    encryptString: function(str, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.encrypt(str.utf8(), key, completion, target);
        return completion.promise;
    },

    decryptString: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.decrypt(data, key, function(decrypted){
            if (decrypted === null){
                completion.call(target, null);
            }else{
                completion.call(target, String.initWithData(decrypted, String.Encoding.utf8));
            }
        });
        return completion.promise;
    },

    wrapKey: function(key, wrappingKey, completion, target){
        // Implemented in subclasses
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, null);
        return completion.promise;
    },

    unwrapKey: function(wrappedKeyData, unwrappedKeyAlgorithm, wrappingKey, completion, target){
        // Implemented in subclasses
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, null);
        return completion.promise;
    },

    createKey: function(completion, target){
        // Implemented in subclasses
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, null);
        return completion.promise;
    },

    createKeyWithData: function(data, completion, target){
        // Implemented in subclasses
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, null);
        return completion.promise;
    },

    createKeyWithPassphrase: function(passphrase, salt, completion, target){
        // Implemented in subclasses
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, null);
        return completion.promise;
    }

});

JSClass("SECCipherAESCipherBlockChaining", SECCipher, {

    init: function(){
    }

});

JSClass("SECCipherAESCounter", SECCipher, {

    encryptedMessageId: 0,
    decryptedMessageId: 0,

    init: function(){
    },

    ensureUniqueMessageID: function(){
        if (this.encryptedMessageId == 9007199254740991){
            return false;
        }
        ++this.encryptedMessageId;
        return true;
    }

});

JSClass("SECCipherAESGaloisCounterMode", SECCipher, {

    encryptedMessageId: 0,
    decryptedMessageId: 0,

    init: function(){
    },

    ensureUniqueMessageID: function(){
        if (this.encryptedMessageId == 9007199254740991){
            return false;
        }
        ++this.encryptedMessageId;
        return true;
    }

});


// RC4 is used by some PDFs, but is insecure and should not be used other than
// to read the PDFs that already use it.
JSClass("SECCipherRC4", SECCipher, {

    encrypt: function(data, key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var encrypted = JSData.initWithLength(data.length);
        var S = JSData.initWithLength(256);
        var i, l;
        for (i = 0; i < 256; ++i){
            S[i] = i;
        }
        var j = 0;
        var tmp;
        for (i = 0; i < 256; ++i){
            j = (j + S[i] + key.keyData[i % key.keyData.length]) & 0xFF;
            tmp = S[i];
            S[i] = S[j];
            S[j] = tmp;
        }
        var o = 0;
        var K = 0;
        i = 0;
        j = 0;
        for (l = data.length; o < l; ++o){
            i = (i + 1) & 0xFF;
            j = (j + S[i]) & 0xFF;
            tmp = S[i];
            S[i] = S[j];
            S[j] = tmp;
            K = S[(S[i] + S[j]) & 0xFF];
            encrypted[o] = data[o] ^ K;
        }
        JSRunLoop.main.schedule(completion, target, encrypted);
        return completion.promise;
    },

    decrypt: function(data, key, completion, target){
        return this.encrypt(data, key, completion, target);
    },

    createKeyWithData: function(data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var key = SECDataKey.initWithData(data);
        JSRunLoop.main.schedule(completion, target, key);
        return completion.promise;
    }

});

SECCipher.Algorithm = {
    aesCipherBlockChaining: 'aes_cbc',
    aesCounter: 'aes_ctr',
    aesGaloisCounterMode: 'aes_gcm',
    rivestCipher4: 'rc4'
};

SECCipher.getRandomData = function(length){
    // Implemented in environment extensions
};

SECCipher.Algorithm.aesCBC = SECCipher.Algorithm.aesCipherBlockChaining;
SECCipher.Algorithm.aesCTR = SECCipher.Algorithm.aesCounter;
SECCipher.Algorithm.aesGCM = SECCipher.Algorithm.aesGaloisCounterMode;
SECCipher.Algorithm.rc4 = SECCipher.Algorithm.rivestCipher4;
