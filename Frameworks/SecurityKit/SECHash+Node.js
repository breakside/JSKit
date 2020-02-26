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

