// #import "SECHash.js"
// jshint node: true
'use strict';

var crypto = require('crypto');

SECHash.definePropertiesFromExtensions({

    nodeHash: null,

    initWithAlgorithm: function(algorithm){
        var nodeAlgorithm = nodeAlgorithms[algorithm];
        if (!nodeAlgorithm){
            return null;
        }
        this.nodeHash = crypto.createHash(nodeAlgorithm);
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
nodeAlgorithms[SECHash.Algorithm.sha256] = 'sha256';
nodeAlgorithms[SECHash.Algorithm.sha384] = 'sha384';
nodeAlgorithms[SECHash.Algorithm.sha512] = 'sha512';

