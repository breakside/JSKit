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

// #import "SECCipher.js"
// #import "SECHash.js"
'use strict';

JSClass("SECPassword", JSObject, {

    salt: null,
    iterations: 500000,
    hashAlgorithm: SECHash.Algorithm.sha512,
    pbkdf2Data: null,

    initWithDictionary: function(dictionary){
        this.salt = dictionary.salt.dataByDecodingBase64();
        this.iterations = dictionary.iterations;
        this.hashAlgorithm = dictionary.hash;
        this.pbkdf2Data = dictionary.pbkdf2.dataByDecodingBase64();
    },

    initWithPBKDF2Data: function(pbkdf2Data, salt, iterations, hash){
        this.pbkdf2Data = pbkdf2Data;
        this.salt = salt;
        this.iterations = iterations;
        this.hashAlgorithm = hash;
    },

    dictionaryRepresentation: function(){
        return {
            salt: this.salt.base64StringRepresentation(),
            iterations: this.iterations,
            hash: this.hashAlgorithm,
            pbkdf2: this.pbkdf2Data.base64StringRepresentation()
        };
    },

    verify: function(plainPassword, completion, target){
        if (completion === undefined){
            completion = Promise.completion();
        }
        SECPassword.dataDerivedFromPassphrase(plainPassword, this.pbkdf2Data.length, this.salt, this.iterations, this.hashAlgorithm, function(data){
            if (data === null){
                completion.call(target, false);
                return;
            }
            var verified = data.isEqual(this.pbkdf2Data);
            completion.call(target, verified);
        }, this);
        return completion.promise;
    }

});

SECPassword.createWithPlainPassword = function(plainPassword, length, iterations, hash, completion, target){
    if (completion === undefined){
        completion = Promise.completion(Promise.resolveNonNull);
    }
    var salt = SECCipher.getRandomData(20);
    SECPassword.dataDerivedFromPassphrase(plainPassword, length, salt, iterations, hash, function(data){
        if (data === null){
            completion.call(target, null);
            return;
        }
        var savedPassword = SECPassword.initWithPBKDF2Data(data, salt, iterations, hash);
        completion.call(target, savedPassword);
    });
    return completion.promise;
};