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

    encrypt: function(data, key, completion){
        // Implemented in subclasses
    },

    decrypt: function(data, key, completion){
        // Implemented in subclasses
    },

    createKey: function(completion){
        // Implemented in subclasses
    },

    encryptString: function(str, key, completion){
        this.encrypt(str.utf8(), key, completion);
    },

    decryptString: function(data, key, completion){
        this.decrypt(data, key, function(decrypted){
            if (decrypted === null){
                completion(null);
            }else{
                completion(String.initWithData(decrypted, String.Encoding.utf8));
            }
        });
    }

});

JSClass("SECCipherAESCipherBlockChaining", SECCipher, {

    init: function(){
    },

    encrypt: function(data, key, completion){
        // Implemented in environment extensions
    },

    decrypt: function(data, key, completion){
        // Implemented in environment extensions
    },

    createKey: function(completion){
        // Implemented in environment extensions
    }

});

JSClass("SECCipherAESCounter", SECCipher, {

    messageID: 0,

    init: function(){
    },

    ensureUniqueMessageID: function(completion){
        if (this.messageID == 9007199254740991){
            return false;
        }
        ++this.messageID;
        return true;
    },

    encrypt: function(data, key, completion){
        // Implemented in environment extensions
    },

    decrypt: function(data, key, completion){
        // Implemented in environment extensions
    },

    createKey: function(completion){
        // Implemented in environment extensions
    }

});

JSClass("SECCipherAESGaloisCounterMode", SECCipher, {

    messageID: 0,

    init: function(){
    },

    ensureUniqueMessageID: function(completion){
        if (this.messageID == 9007199254740991){
            return false;
        }
        ++this.messageID;
        return true;
    },

    encrypt: function(data, key, completion){
        // Implemented in environment extensions
    },

    decrypt: function(data, key, completion){
        // Implemented in environment extensions
    },

    createKey: function(completion){
        // Implemented in environment extensions
    }

});

SECCipher.Algorithm = {
    aesCipherBlockChaining: 'aes_cbc',
    aesCounter: 'aes_ctr',
    aesGaloisCounterMode: 'aes_gcm'
};

SECCipher.Algorithm.aesCBC = SECCipher.Algorithm.aesCipherBlockChaining;
SECCipher.Algorithm.aesCTR = SECCipher.Algorithm.aesCounter;
SECCipher.Algorithm.aesGCM = SECCipher.Algorithm.aesCounter;