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

// #import "SECSign.js"
// #import "SECHTMLKey.js"
// jshint browser: true
/* global crypto */
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

    createJWKPair: function(options, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.createKeyPair(options, function(pair){
            if (pair === null){
                completion.call(target, null);
                return;
            }
            crypto.subtle.exportKey("jwk", pair.public.htmlKey).then(function(publicJWK){
                crypto.subtle.exportKey("jwk", pair.private.htmlKey).then(function(privateJWK){
                    publicJWK.kid = privateJWK.kid = JSSHA1Hash(UUID.init().bytes).base64URLStringRepresentation();
                    var pair = {
                        public: publicJWK,
                        private: privateJWK
                    };
                    completion.call(target, pair);
                }, function(){
                    completion.call(target, null);
                });
            }, function(){
                completion.call(target, null);
            });
        }, this);
        return completion.promise;
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        crypto.subtle.importKey("jwk", jwk, this.htmlAlgorithm, true, ["sign"]).then(function(htmlKey){
            var key = SECHTMLKey.initWithKey(htmlKey);
            completion.call(target, key);
        }, function(error){
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
            completion.call(target, JSData.initWithBuffer(signature));
        }, function(error){
            completion.call(target, null);
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