// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, SECCipher, SECCipherAESCipherBlockChaining, SECCipherAESCounter, SECCipherAESGaloisCounterMode, JSRunLoop */
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
        }
        return null;
    },

    encrypt: function(data, key, completion, target){
        // Implemented in subclasses
    },

    decrypt: function(data, key, completion, target){
        // Implemented in subclasses
    },

    encryptString: function(str, key, completion, target){
        this.encrypt(str.utf8(), key, completion, target);
    },

    decryptString: function(data, key, completion, target){
        this.decrypt(data, key, function(decrypted){
            if (decrypted === null){
                completion.call(target, null);
            }else{
                completion.call(target, String.initWithData(decrypted, String.Encoding.utf8));
            }
        });
    },

    wrapKey: function(key, wrappingKey, completion, target){
        // Implemented in subclasses
    },

    unwrapKey: function(wrappedKeyData, wrappingKey, completion, target){
        // Implemented in subclasses
    },

    createKey: function(completion, target){
        // Implemented in subclasses
    },

    createKeyWithData: function(data, completion, target){
        // Implemented in subclasses
    },

    createKeyWithPassphrase: function(passphrase, salt, completion, target){
        // Implemented in subclasses
    }

});

JSClass("SECCipherAESCipherBlockChaining", SECCipher, {

    init: function(){
    }

});

JSClass("SECCipherAESCounter", SECCipher, {

    messageID: 0,

    init: function(){
    },

    ensureUniqueMessageID: function(completion, target){
        if (this.messageID == 9007199254740991){
            return false;
        }
        ++this.messageID;
        return true;
    }

});

JSClass("SECCipherAESGaloisCounterMode", SECCipher, {

    messageID: 0,

    init: function(){
    },

    ensureUniqueMessageID: function(completion, target){
        if (this.messageID == 9007199254740991){
            return false;
        }
        ++this.messageID;
        return true;
    }

});

SECCipher.Algorithm = {
    aesCipherBlockChaining: 'aes_cbc',
    aesCounter: 'aes_ctr',
    aesGaloisCounterMode: 'aes_gcm'
};

SECCipher.getRandomData = function(length){
    // Implemented in environment extensions
};

SECCipher.Algorithm.aesCBC = SECCipher.Algorithm.aesCipherBlockChaining;
SECCipher.Algorithm.aesCTR = SECCipher.Algorithm.aesCounter;
SECCipher.Algorithm.aesGCM = SECCipher.Algorithm.aesCounter;