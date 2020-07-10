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

// #import "SECPassword.js"
// jshint node: true
'use strict';

var crypto = require('crypto');

SECPassword.dataDerivedFromPassphrase = function(passphrase, length, salt, iterations, hash, completion, target){
    if (!completion){
        completion = Promise.completion(Promise.resolveNonNull);
    }
    var digest = nodeAlgorithms[hash];
    crypto.pbkdf2(passphrase.utf8().nodeBuffer(), salt.nodeBuffer(), iterations, length, digest, function(error, derivedBytes){
        if (error){
            completion.call(target, null);
        }else{
            completion.call(target, JSData.initWithNodeBuffer(derivedBytes));
        }
    });
    return completion.promise;
};

var nodeAlgorithms = {};
nodeAlgorithms[SECHash.Algorithm.sha256] = 'sha256';
nodeAlgorithms[SECHash.Algorithm.sha384] = 'sha384';
nodeAlgorithms[SECHash.Algorithm.sha512] = 'sha512';