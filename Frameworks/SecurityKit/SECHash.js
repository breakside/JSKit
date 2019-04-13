// #import Foundation
/* global JSClass, JSObject, SECHash */
'use strict';

JSClass("SECHash", JSObject, {

    initWithAlgorithm: function(algorithm, keyData){
    },

    update: function(data){
    },

    digest: function(completion, target){
    }

});

SECHash.Algorithm = {
    sha256: "sha256",
    sha384: "sha384",
    sha512: "sha384",
    hmacSHA256: "hmac.sha256",
    hmacSHA384: "hmac.sha384",
    hmacSHA512: "hmac.sha512",
    rsaSHA256: "rsa.sha256",
    rsaSHA384: "rsa.sha384",
    rsaSHA512: "rsa.sha512",
};