// #import Foundation
/* global JSClass, JSObject, SECVerify */
'use strict';

JSClass("SECVerify", JSObject, {

    initWithAlgorithm: function(algorithm){
    },

    update: function(data){
    },

    verify: function(key, signature, completion, target){
    }

});

SECVerify.Algorithm = {
    rsaSHA256: "rsa.sha256",
    rsaSHA384: "rsa.sha384",
    rsaSHA512: "rsa.sha512",
};