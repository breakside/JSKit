// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "SECVerify.js"
// #import "SECNodeKey.js"
// jshint node: true
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

