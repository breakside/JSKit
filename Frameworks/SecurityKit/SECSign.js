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
'use strict';

JSClass("SECSign", JSObject, {

    algorithm: null,

    initWithAlgorithm: function(algorithm){
    },

    initForJWK: function(jwk){
        if (jwk.kty != "RSA" && jwk.kty !== "EC"){
            return null;
        }
        var algorithm = jwkAlgorithm[jwk.alg];
        if (!algorithm){
            return null;
        }
        this.initWithAlgorithm(algorithm);
    },

    createKeyPair: function(options, completion, target){
    },

    createJWKPair: function(options, completion, target){
    },

    createKeyFromJWK: function(jwk, completion, target){        
    },

    createKeyFromKeystore: function(keystore, kid, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var jwk = keystore.jwkForIdentifier(kid);
        if (jwk !== null){
            this.createKeyFromJWK(jwk, completion, target);
        }else{
            completion.call(target, null);
        }
        return completion.promise;
    },

    update: function(data){
    },

    sign: function(key, completion, target){
    }

});

SECSign.Algorithm = {
    rsaSHA256: "rsa.sha256",
    rsaSHA384: "rsa.sha384",
    rsaSHA512: "rsa.sha512",
    ellipticCurveSHA256: "ec.sha256",
    ellipticCurveSHA384: "ec.sha384",
    ellipticCurveSHA512: "ec.sha512"
};

SECSign.EllipticCurve = {
    p256: "P-256",
    p384: "P-384",
    p521: "P-521"
};

var jwkAlgorithm = {
    "RS256": SECSign.Algorithm.rsaSHA256,
    "RS384": SECSign.Algorithm.rsaSHA384,
    "RS512": SECSign.Algorithm.rsaSHA512,
    "ES256": SECSign.Algorithm.ellipticCurveSHA256,
    "ES384": SECSign.Algorithm.ellipticCurveSHA384,
    "ES512": SECSign.Algorithm.ellipticCurveSHA512
};