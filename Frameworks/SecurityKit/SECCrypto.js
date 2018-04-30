// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, SECCrypto, SECCryptoAESCBC */
'use strict';

JSClass("SECCrypto", JSObject, {

    algorithm: JSReadOnlyProperty('_algorithm', null),

    initWithAlgorithm: function(algorithm){
        switch (algorithm){
            case SECCrypto.Algorithm.aesCipherBlockChaining:
                return SECCryptoAESCBC.init();
        }
        return null;
    },

    encrypt: function(data, key, completion){
    },

    decrypt: function(data, key, completion){
    },

    createKey: function(completion){
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

JSClass("SECCryptoAESCBC", SECCrypto, {

    init: function(){
    },

    encrypt: function(data, key, completion){
    },

    decrypt: function(data, key, completion){
    },

    createKey: function(completion){
    }

});

SECCrypto.Algorithm = {
    aesCipherBlockChaining: 'aes_cbc'
};