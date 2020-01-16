// #import "SECHash.js"
// #import "SECHTMLKey.js"
/* global JSClass, JSObject, JSData, crypto, SECHash, SECHTMLKey */
'use strict';

(function(){

SECHash.definePropertiesFromExtensions({

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

    digest: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var data = JSData.initWithChunks(this.chunks);
        crypto.subtle.digest(this.htmlAlgorithm, data, function(computed){
            completion.call(target, computed);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

var htmlAlgorithms = {};
htmlAlgorithms[SECHash.Algorithm.sha256] = { name: 'SHA-256' };
htmlAlgorithms[SECHash.Algorithm.sha384] = { name: 'SHA-384' };
htmlAlgorithms[SECHash.Algorithm.sha512] = { name: 'SHA-512' };

})();