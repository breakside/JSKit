// #import "SECVerify.js"
// #import "SECNodeKey.js"
/* global JSClass, JSObject, JSData, require, SECVerify */
'use strict';

var crypto = require('crypto');

SECVerify.definePropertiesFromExtensions({

    nodeVerify: null,
    nodeAlgorithm: null,

    initWithAlgorithm: function(algorithm){
        this.nodeAlgorithm = nodeAlgorithms[algorithm];
        if (!this.nodeAlgorithm){
            return null;
        }
        this.nodeVerify = crypto.createVerify(this.nodeAlgorithm.hash);
    },

    update: function(data){
        this.nodeVerify.update(data);
    },

    verify: function(key, signature, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var verified = this.nodeVerify.verify(key.keyData, signature);
        completion.call(target, verified);
        return completion.promise;
    },

});

var nodeAlgorithms = {};
nodeAlgorithms[SECVerify.Algorithm.rsaSHA256] = {name: 'rsa', hash: 'sha256'};
nodeAlgorithms[SECVerify.Algorithm.rsaSHA384] = {name: 'rsa', hash: 'sha384'};
nodeAlgorithms[SECVerify.Algorithm.rsaSHA512] = {name: 'rsa', hash: 'sha512'};

