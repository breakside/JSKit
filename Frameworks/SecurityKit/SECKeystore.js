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

(function(){

var logger = JSLog("securitykit", "keystore");

JSClass("SECKeystore", JSObject, {

    init: function(){
        this.jwksByKID = {};
    },

    addJWK: function(jwk){
        if (!jwk.kid){
            throw new Error("A kid is required when adding a JWK to a SECKeystore");
        }
        this.jwksByKID[jwk.kid] = jwk;
    },

    addBase64URLForIdentifier: function(base64URL, kid){
        var jwk = {
            kty: SECJSONWebAlgorithms.KeyType.symmetric,
            kid: kid,
            k: base64URL
        };
        this.addJWK(jwk);
    },

    addDataForIdentifier: function(keyData, kid){
        this.addBase64URLForIdentifier(keyData.base64URLStringRepresentation(), kid);
    },

    jwkForIdentifier: function(kid){
        return this.jwksByKID[kid] || null;
    },

    dataForIdentifier: function(kid){
        var jwk = this.jwkForIdentifier(kid);
        if (jwk !== null && jwk.kty === SECJSONWebAlgorithms.KeyType.symmetric && typeof(jwk.k) == "string"){
            return jwk.k.dataByDecodingBase64URL();
        }
        return null;
    }

});

})();