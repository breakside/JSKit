// #import "SECHash.js"
/* global JSClass, JSObject, JSData, require, SECHash */
'use strict';

var crypto = require('crypto');

SECHash.definePropertiesFromExtensions({

    nodeHash: null,

    initWithAlgorithm: function(algorithm, keyData){
        var nodeAlgorithm = nodeAlgorithms[algorithm];
        if (!nodeAlgorithm){
            return null;
        }
        this.nodeHash = nodeAlgorithm.fn.call(crypto, nodeAlgorithm.name, keyData);
    },

    update: function(data){
        this.nodeHash.update(data);
    },

    digest: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var digest = this.nodeHash.digest();
        var data = JSData.initWithNodeBuffer(digest);
        completion.call(target, data);
        return completion.promise;
    },

});

var nodeAlgorithms = {};
nodeAlgorithms[SECHash.Algorithm.sha256] = { fn: crypto.createHash, name: 'sha256'};
nodeAlgorithms[SECHash.Algorithm.sha384] = { fn: crypto.createHash, name: 'sha384'};
nodeAlgorithms[SECHash.Algorithm.sha512] = { fn: crypto.createHash, name: 'sha512'};
nodeAlgorithms[SECHash.Algorithm.hmacSHA256] = { fn: crypto.createHmac, name: 'sha256'};
nodeAlgorithms[SECHash.Algorithm.hmacSHA384] = { fn: crypto.createHmac, name: 'sha384'};
nodeAlgorithms[SECHash.Algorithm.hmacSHA512] = { fn: crypto.createHmac, name: 'sha512'};

