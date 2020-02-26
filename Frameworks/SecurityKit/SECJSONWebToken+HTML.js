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
// #import "SECJSONWebToken.js"
// #import "SECHTMLKey.js"
// jshint browser: true
/* global crypto */
'use strict';

(function(){

SECJSONWebToken.definePropertiesFromExtensions({

    createVerifyKey: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = htmlAlgorithms[jwk.alg];
        crypto.subtle.importKey("jwk", jwk, algorithm, true, ["verify"]).then(function(htmlKey){
            var key = SECHTMLKey.initWithKey(htmlKey);
            completion.call(target, key);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

var htmlAlgorithms = {};
htmlAlgorithms["RS256"] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'};
htmlAlgorithms["RS384"] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384'};
htmlAlgorithms["RS512"] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512'};


})();