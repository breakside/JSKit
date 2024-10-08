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
"use strict";

JSClass("SECJSONWebAlgorithms", JSObject, {    

});

SECJSONWebAlgorithms.Algorithm = {

    none: 'none',
    direct: "dir",
    hmacSHA256: "HS256",
    hmacSHA384: "HS384",
    hmacSHA512: "HS512",
    rsaSHA256: "RS256",
    rsaSHA384: "RS384",
    rsaSHA512: "RS512",
    ellipticCurveSHA256: "ES256",
    ellipticCurveSHA384: "ES384",
    ellipticCurveSHA512: "ES512",
    aesGCM128: "A128GCM",
    aesGCM192: "A192GCM",
    aesGCM256: "A256GCM",
    aesCBC128HS256: "A128CBC-HS256",
    aesCBC192HS384: "A192CBC-HS384",
    aesCBC256HS512: "A256CBC-HS512",
    rsaOAEP: "RSA-OAEP",
    ecdhES: "ECDH-ES"
};

SECJSONWebAlgorithms.KeyType = {
    symmetric: "oct",
    rsa: "RSA",
    ellipticCurve: "EC"
};

SECJSONWebAlgorithms.EllipticCurve = {
    p256: "P-256",
    p384: "P-384",
    p521: "P-521"
};