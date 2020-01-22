// #import Foundation
'use strict';

JSClass("SECSign", JSObject, {

    initWithAlgorithm: function(algorithm){
    },

    createKeyPair: function(options, completion, target){
    },

    update: function(data){
    },

    sign: function(key, completion, target){
    }

});

SECSign.Algorithm = {
    rsaSHA256: "rsa.sha256",
    rsaSHA384: "rsa.sha384",
    rsaSHA512: "rsa.sha512",
};