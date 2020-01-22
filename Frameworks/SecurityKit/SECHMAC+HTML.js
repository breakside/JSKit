// #import "SECHMAC.js"
// #import "SECHTMLKey.js"
// jshint browser: true
/* global crypto */
'use strict';

(function(){

SECHMAC.definePropertiesFromExtensions({

    htmlAlgorithm: null,
    chunks: null,

    initWithAlgorithm: function(algorithm){
        this.htmlAlgorithm = htmlAlgorithms[algorithm];
        if (!this.htmlAlgorithm){
            return null;
        }
        this.chunks = [];
    },

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: this.htmlAlgorithm.name,
            hash: this.htmlAlgorithm.hash,
            length: 256
        };
        var extractable = true;
        crypto.subtle.generateKey(algorithm, extractable, ["sign"]).then(function(htmlKey){
            completion.call(target, SECHTMLKey.initWithKey(htmlKey));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    createKeyWithData: function(data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var extractable = true;
        var algorithm = this.htmlAlgorithm;
        crypto.subtle.importKey("raw", data, algorithm, extractable, ["sign"]).then(function(htmlKey){
            completion.call(target, SECHTMLKey.initWithKey(htmlKey));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    update: function(data){
        if (this.key === null){
            throw new Error("SECHMAC must have a key before calling update()");
        }
        this.chunks.push(data);
    },

    sign: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this.htmlAlgorithm;
        var data = JSData.initWithChunks(this.chunks);
        crypto.subtle.sign(algorithm, this.key.htmlKey, data).then(function(computed){
            completion.call(target, JSData.initWithBuffer(computed));
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

var htmlAlgorithms = {};
htmlAlgorithms[SECHMAC.Algorithm.sha256] = { name: 'HMAC', hash: 'SHA-256'};
htmlAlgorithms[SECHMAC.Algorithm.sha384] = { name: 'HMAC', hash: 'SHA-384'};
htmlAlgorithms[SECHMAC.Algorithm.sha512] = { name: 'HMAC', hash: 'SHA-512'};


})();