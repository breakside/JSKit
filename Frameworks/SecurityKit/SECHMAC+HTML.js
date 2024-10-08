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

// #import "SECHMAC.js"
// #import "SECHTMLKey.js"
// jshint browser: true
/* global crypto */
'use strict';

(function(){

SECHMAC.definePropertiesFromExtensions({

    htmlAlgorithm: null,
    chunks: null,

    initWithAlgorithm: function(algorithm){
        this.htmlAlgorithm = htmlAlgorithms[algorithm];
        if (!this.htmlAlgorithm){
            return null;
        }
        this.chunks = [];
    },

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = this.htmlAlgorithm;
        var extractable = true;
        crypto.subtle.generateKey(algorithm, extractable, ["sign"]).then(function(htmlKey){
            var key = SECHTMLKey.initWithKey(htmlKey);
            key.id = JSSHA1Hash(UUID.init().bytes).base64URLStringRepresentation();
            completion.call(target, key);
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    createKeyWithData: function(data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var extractable = true;
        var algorithm = {
            name: this.htmlAlgorithm.name,
            hash: this.htmlAlgorithm.hash
        };
        crypto.subtle.importKey("raw", data, algorithm, extractable, ["sign"]).then(function(htmlKey){
            completion.call(target, SECHTMLKey.initWithKey(htmlKey));
        }, function(e){
            completion.call(target, null);
        });
        return completion.promise;
    },

    update: function(data){
        if (this.key === null){
            throw new Error("SECHMAC must have a key before calling update()");
        }
        this.chunks.push(data);
    },

    sign: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = {
            name: this.htmlAlgorithm.name,
            hash: this.htmlAlgorithm.hash
        };
        var data = JSData.initWithChunks(this.chunks);
        crypto.subtle.sign(algorithm, this.key.htmlKey, data).then(function(computed){
            completion.call(target, JSData.initWithBuffer(computed));
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

var htmlAlgorithms = {};
htmlAlgorithms[SECHMAC.Algorithm.sha1] = { name: 'HMAC', hash: 'SHA-1'};
htmlAlgorithms[SECHMAC.Algorithm.sha256] = { name: 'HMAC', hash: 'SHA-256', length: 256};
htmlAlgorithms[SECHMAC.Algorithm.sha384] = { name: 'HMAC', hash: 'SHA-384', length: 384};
htmlAlgorithms[SECHMAC.Algorithm.sha512] = { name: 'HMAC', hash: 'SHA-512', length: 512};


})();