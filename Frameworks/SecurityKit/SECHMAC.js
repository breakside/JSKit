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

// #import Foundation
// #import "SECJSONWebAlgorithms.js"
'use strict';

JSClass("SECHMAC", JSObject, {

    key: null,

    initWithAlgorithm: function(algorithm){
    },

    createKey: function(completion, target){
    },

    createKeyWithData: function(data, completion, target){
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (jwk.kty == SECJSONWebAlgorithms.KeyType.symmetric){
            if (typeof(jwk.k) == "string"){
                try{
                    var data = jwk.k.dataByDecodingBase64URL();
                    this.createKeyWithData(data, completion, target);
                }catch (e){
                    completion.call(target, null);
                }
            }else{
                completion.call(target, null);
            }
        }else{
            completion.call(target, null);
        }
        return completion.promise;
    },

    update: function(data){
    },

    sign: function(completion, target){
    }

});

SECHMAC.Algorithm = {
    sha1: "sha1",
    sha256: "sha256",
    sha384: "sha384",
    sha512: "sha512"
};