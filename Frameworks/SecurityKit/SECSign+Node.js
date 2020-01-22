// #import "SECSign.js"
// #import "SECNodeKey.js"
// jshint node: true
'use strict';

var crypto = require('crypto');

SECSign.definePropertiesFromExtensions({

    nodeSign: null,
    nodeAlgorithm: null,

    initWithAlgorithm: function(algorithm){
        this.nodeAlgorithm = nodeAlgorithms[algorithm];
        if (!this.nodeAlgorithm){
            return null;
        }
        this.nodeSign = crypto.createSign(this.nodeAlgorithm.hash);
    },

    createKeyPair: function(options, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var nodeOptions = {
            modulusLength: options.modulusLength || 2048,
            publicExponent: options.publicExponent || 0x10001,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            }
        };
        crypto.generateKeyPair(this.nodeAlgorithm.name, nodeOptions, function(err, publicKeyPem, privateKeyPem){
            if (err){
                completion.call(target, null);
                return;
            }
            var pair = {
                public: SECNodeKey.initWithData(publicKeyPem.utf8()),
                private: SECNodeKey.initWithData(privateKeyPem.utf8()),
            };
            completion.call(target, pair);
        });
        return completion.promise;
    },

    update: function(data){
        this.nodeSign.write(data);
    },

    sign: function(key, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.nodeSign.end();
        var signature = this.nodeSign.sign(key.keyData);
        completion.call(target, JSData.initWithNodeBuffer(signature));
        return completion.promise;
    }

});

var nodeAlgorithms = {};
nodeAlgorithms[SECSign.Algorithm.rsaSHA256] = {name: 'rsa', hash: 'sha256'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA384] = {name: 'rsa', hash: 'sha384'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA512] = {name: 'rsa', hash: 'sha512'};

