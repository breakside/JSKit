// #import "SECVerify.js"
/* global JSClass, JSObject, JSData, crypto, SECVerify */
'use strict';

(function(){

SECVerify.definePropertiesFromExtensions({

    htmlAlgorithm: null,
    chunks: null,

    initWithAlgorithm: function(algorithm){
        this.htmlAlgorithm = htmlAlgorithms[algorithm];
        if (!this.htmlAlgorithm){
            return null;
        }
        this.chunks = [];
    },

    update: function(data){
        this.chunks.push(data);
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        crypto.subtle.importKey("jwk", jwk, this.htmlAlgorithm, true, ["verify"]).then(function(key){
            completion.call(target, key);
        }, function(error){
            completion.call(target, false);
        });
        return completion.promise;
    },

    verify: function(key, signature, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var data = this.chunks.length === 1 ? this.chunks[0] : JSData.initWithChunks(this.chunks);
        crypto.subtle.verify(this.htmlAlgorithm, key, signature, data).then(function(verified){
            completion.call(target, verified);
        }, function(error){
            completion.call(target, false);
        });
        return completion.promise;
    }

});

var htmlAlgorithms = {};
htmlAlgorithms[SECVerify.Algorithm.rsaSHA256] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'};
htmlAlgorithms[SECVerify.Algorithm.rsaSHA384] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384'};
htmlAlgorithms[SECVerify.Algorithm.rsaSHA512] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512'};


})();