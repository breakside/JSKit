// #import "SECSign.js"
// #import "SECHTMLKey.js"
/* global JSClass, JSObject, JSData, crypto, SECSign, SECHTMLKey */
'use strict';

(function(){

SECSign.definePropertiesFromExtensions({

    htmlAlgorithm: null,
    chunks: null,

    initWithAlgorithm: function(algorithm){
        this.htmlAlgorithm = htmlAlgorithms[algorithm];
        if (!this.htmlAlgorithm){
            return null;
        }
        this.chunks = [];
    },

    createKeyPair: function(options, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: this.htmlAlgorithm.name,
            hash: this.htmlAlgorithm.hash,
            modulusLength: options.modulusLength || 2048,
            publicExponent: bigIntegerFromNumber(options.publicExponent || 0x10001)
        };
        var extractable = true;
        crypto.subtle.generateKey(algorithm, extractable, ["sign", "verify"]).then(function(htmlPair){
            var pair = {
                public: SECHTMLKey.initWithKey(htmlPair.publicKey),
                private: SECHTMLKey.initWithKey(htmlPair.privateKey)
            };
            completion.call(target, pair);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    update: function(data){
        this.chunks.push(data);
    },

    sign: function(key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var data = JSData.initWithChunks(this.chunks);
        crypto.subtle.sign(this.htmlAlgorithm, key.htmlKey, data).then(function(signature){
            completion.call(target, signature);
        }, function(error){
            completion.call(target, false);
        });
        return completion.promise;
    }

});

var htmlAlgorithms = {};
htmlAlgorithms[SECSign.Algorithm.rsaSHA256] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'};
htmlAlgorithms[SECSign.Algorithm.rsaSHA384] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384'};
htmlAlgorithms[SECSign.Algorithm.rsaSHA512] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512'};

var bigIntegerFromNumber = function(n){
    var elements = [];
    while (n > 0){
        elements.unshift(n & 0xFF);
        n >>>= 8;
    }
    return JSData.initWithArray(elements);
};

})();