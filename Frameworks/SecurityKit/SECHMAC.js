// #import Foundation
'use strict';

JSClass("SECHMAC", JSObject, {

    key: null,

    initWithAlgorithm: function(algorithm){
    },

    createKey: function(completion, target){
    },

    createKeyWithData: function(data, completion, target){
    },

    update: function(data){
    },

    sign: function(completion, target){
    }

});

SECHMAC.Algorithm = {
    sha256: "sha256",
    sha384: "sha384",
    sha512: "sha512"
};