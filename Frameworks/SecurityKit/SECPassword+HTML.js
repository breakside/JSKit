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
// #feature window.crypto.subtle
// jshint browser: true
/* global crypto */
'use strict';

(function(){

SECPassword.dataDerivedFromPassphrase = function(passphrase, length, salt, iterations, hash, completion, target){
    if (!completion){
        completion = Promise.completion(Promise.resolveNonNull);
    }
    // 1. Create a new PBKDF (Password-Based Key Derivation Function) key, using just the raw passphrase,
    //    with permission to derive a key
    var algorithm = {
        name: 'PBKDF2'
    };
    var derivedAlgorithmName = this.htmlAlgorithmName;
    crypto.subtle.importKey('raw', passphrase.utf8(), algorithm, false, ["deriveBits"]).then(function(masterKey){
        // 2. Derive a key using the PBKDF algorithm and the given salt, resulting in a key suitable
        //    for use with this cipher
        var algorithm = {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: htmlHashes[hash]
        };
        return crypto.subtle.deriveBits(algorithm, masterKey, length * 8);
    }).then(function(derivedBits){
        completion.call(target, JSData.initWithBuffer(derivedBits));
    }, function(e){
        completion.call(target, null);
    });
    return completion.promise;
};

var htmlHashes = {};
htmlHashes[SECHash.Algorithm.sha256] = 'SHA-256';
htmlHashes[SECHash.Algorithm.sha384] = 'SHA-384';
htmlHashes[SECHash.Algorithm.sha512] = 'SHA-512';

})();