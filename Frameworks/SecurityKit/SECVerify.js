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

(function(){

JSClass("SECVerify", JSObject, {

    initWithAlgorithm: function(algorithm){
    },

    initForJWK: function(jwk){
        if (jwk.kty != "RSA" && jwk.kty != "EC"){
            return null;
        }
        var algorithm = jwkAlgorithm[jwk.alg];
        if (!algorithm){
            return null;
        }
        this.initWithAlgorithm(algorithm);
    },

    update: function(data){
    },

    verify: function(key, signature, completion, target){
    },

    createKeyFromJWK: function(jwk, completion, target){        
    }

});

SECVerify.Algorithm = {
    rsaSHA256: "rsa.sha256",
    rsaSHA384: "rsa.sha384",
    rsaSHA512: "rsa.sha512",
    ellipticCurveSHA256: "ec.sha256",
    ellipticCurveSHA384: "ec.sha384",
    ellipticCurveSHA512: "ec.sha512"
};

SECVerify.EllipticCurve = {
    p256: "P-256",
    p384: "P-384",
    p521: "P-521"
};

var jwkAlgorithm = {
    "RS256": SECVerify.Algorithm.rsaSHA256,
    "RS384": SECVerify.Algorithm.rsaSHA384,
    "RS512": SECVerify.Algorithm.rsaSHA512,
    "ES256": SECVerify.Algorithm.ellipticCurveSHA256,
    "ES384": SECVerify.Algorithm.ellipticCurveSHA384,
    "ES512": SECVerify.Algorithm.ellipticCurveSHA512
};

})();