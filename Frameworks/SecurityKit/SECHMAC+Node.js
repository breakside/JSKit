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
// #import "SECNodeKey.js"
// jshint node: true
'use strict';

var crypto = require('crypto');

SECHMAC.definePropertiesFromExtensions({

    nodeHash: null,
    nodeAlgorithm: null,

    initWithAlgorithm: function(algorithm){
        this.nodeAlgorithm = nodeAlgorithms[algorithm];
        if (!this.nodeAlgorithm){
            return null;
        }
    },

    createKey: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var length;
        switch (this.nodeAlgorithm){
            case "sha512":
                length = 512;
                break;
            case "sha384":
                length = 384;
                break;
            default:
                length = 256;
                break;
        }
        crypto.generateKey("hmac", {length: length}, function(error, nodeKeyObject){
            if (error){
                completion.call(target, null);
            }else{
                var key = SECNodeKey.initWithNodeKeyObject(nodeKeyObject);
                key.id = JSSHA1Hash(UUID.init().bytes).base64URLStringRepresentation();
                completion.call(target, key);
            }
        });
        return completion.promise;
    },

    createKeyWithData: function(data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var key = SECNodeKey.initWithData(data);
        JSRunLoop.main.schedule(completion, target, key);
        return completion.promise;
    },

    update: function(data){
        if (this.key === null){
            throw new Error("SECHMAC must have a key before calling update()");
        }
        if (this.nodeHash === null){
            this.nodeHash = crypto.createHmac(this.nodeAlgorithm, this.key.nodeKeyObject);
        }
        this.nodeHash.update(data);
    },

    sign: function(completion, target){
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
nodeAlgorithms[SECHMAC.Algorithm.sha1] = 'sha1';
nodeAlgorithms[SECHMAC.Algorithm.sha256] = 'sha256';
nodeAlgorithms[SECHMAC.Algorithm.sha384] = 'sha384';
nodeAlgorithms[SECHMAC.Algorithm.sha512] = 'sha512';

