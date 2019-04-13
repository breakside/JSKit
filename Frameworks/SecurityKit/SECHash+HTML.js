// #import "SECHash.js"
/* global JSClass, JSObject, JSData, crypto, SECHash */
'use strict';

(function(){

SECHash.definePropertiesFromExtensions({

    htmlAlgorithm: null,
    chunks: null,
    keyData: null,

    initWithAlgorithm: function(algorithm, keyData){
        this.htmlAlgorithm = htmlAlgorithms[algorithm];
        if (!this.htmlAlgorithm){
            return null;
        }
        this.keyData = keyData;
        this.chunks = [];
    },

    update: function(data){
        this.chunks.push(data);
    },

    digest: function(completion, target){
        if (this.htmlAlgorithm.name == "HMAC"){
            return this.digestHMAC(completion, target);
        }
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var data = this.chunks.length === 1 ? this.chunks[0] : JSData.initWithChunks(this.chunks);
        crypto.subtle.digest(this.htmlAlgorithm, data, function(computed){
            completion.call(target, computed);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

    digestHMAC: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this.htmlAlgorithm;
        var data = this.chunks.length === 1 ? this.chunks[0] : JSData.initWithChunks(this.chunks);
        crypto.subtle.importKey("raw", this.keyData, algorithm, true, ["sign"]).then(function(key){
            crypto.subtle.sign(algorithm, key, data).then(function(computed){
                completion.call(target, JSData.initWithBuffer(computed));
            }, function(error){
                completion.call(target, null);
            });
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
htmlAlgorithms[SECHash.Algorithm.hmacSHA256] = { name: 'HMAC', hash: 'SHA-256'};
htmlAlgorithms[SECHash.Algorithm.hmacSHA384] = { name: 'HMAC', hash: 'SHA-384'};
htmlAlgorithms[SECHash.Algorithm.hmacSHA512] = { name: 'HMAC', hash: 'SHA-512'};


})();