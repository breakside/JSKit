// #import Foundation
/* global JSClass, JSObject, SECHash */
'use strict';

JSClass("SECHash", JSObject, {

    initWithAlgorithm: function(algorithm, keyData){
    },

    createKeyWithData: function(data, completion, target){
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
    rsaSHA256: "rsa.sha256",
    rsaSHA384: "rsa.sha384",
    rsaSHA512: "rsa.sha512",
};