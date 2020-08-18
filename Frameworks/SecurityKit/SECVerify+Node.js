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

// #import "SECVerify.js"
// #import "SECNodeKey.js"
// #import "SECASN1.js"
// #import "SECJSONWebToken.js"
// jshint node: true
'use strict';

var crypto = require('crypto');

SECVerify.definePropertiesFromExtensions({

    nodeVerify: null,
    nodeAlgorithm: null,

    initWithAlgorithm: function(algorithm){
        this.nodeAlgorithm = nodeAlgorithms[algorithm];
        if (!this.nodeAlgorithm){
            return null;
        }
        this.nodeVerify = crypto.createVerify(this.nodeAlgorithm.hash);
    },

    update: function(data){
        this.nodeVerify.update(data);
    },

    verify: function(key, signature, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var verified = this.nodeVerify.verify(key.keyData, signature);
        completion.call(target, verified);
        return completion.promise;
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var der, base64, pem, key;
        if (jwk.kty == SECJSONWebToken.KeyType.rsa){
            // RSA public key ASN.1 syntax:
            // RSAPublicKey ::= SEQUENCE {
            //     modulus           INTEGER,  -- n
            //     publicExponent    INTEGER   -- e
            // }
            // 

            if (typeof(jwk.n) == "string" && typeof(jwk.e) == "string"){
                try{
                    var rsaPublicKey = SECASN1Sequence.initWithValues([
                        SECASN1Integer.initWithData(jwk.n.dataByDecodingBase64URL()),
                        SECASN1Integer.initWithData(jwk.e.dataByDecodingBase64URL())
                    ]);
                    pem = rsaPublicKey.pemRepresentation("RSA PUBLIC KEY");
                    key = SECNodeKey.initWithData(pem.utf8());
                    JSRunLoop.main.schedule(completion, target, key);
                }catch (e){
                    JSRunLoop.main.schedule(completion, target, null);
                }
            }else{
                JSRunLoop.main.schedule(completion, target, null);
            }
        }else if (jwk.kty == SECJSONWebToken.KeyType.ellipticCurve){
            // SPKI format
            try{
                var derCurve;
                switch (jwk.crv){
                    case SECJSONWebToken.EllipticCurve.p256:
                        derCurve = derNamedCurves[SECSign.EllipticCurve.p256];
                        break;
                    case SECJSONWebToken.EllipticCurve.p384:
                        derCurve = derNamedCurves[SECSign.EllipticCurve.p384];
                        break;
                    case SECJSONWebToken.EllipticCurve.p384:
                        derCurve = derNamedCurves[SECSign.EllipticCurve.p384];
                        break;
                    default:
                        throw new Error("Unknown jwk.crv");
                }
                var publicKey = SECASN1Sequence.initWithValues([
                    SECASN1Sequence.initWithValues([
                        SECASN1ObjectIdentifier.initWithString("1.2.840.10045.2.1"),
                        SECASN1ObjectIdentifier.initWithString(derCurve),
                    ]),
                    SECASN1BitString.initWithData(JSData.initWithChunks([
                        JSData.initWithArray([0x4]), // uncompressed
                        jwk.x.dataByDecodingBase64URL(),
                        jwk.y.dataByDecodingBase64URL()
                    ]), 0)
                ]);
                pem = publicKey.pemRepresentation("PUBLIC KEY");
                key = SECNodeKey.initWithData(pem.utf8());
                JSRunLoop.main.schedule(completion, target, key);
            }catch (e){
                JSRunLoop.main.schedule(completion, target, null);
            }
        }else{
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    }

});

var derNamedCurves = {};
derNamedCurves[SECSign.EllipticCurve.p256] = "1.2.840.10045.3.1.7";
derNamedCurves[SECSign.EllipticCurve.p384] = "1.3.132.0.34";
derNamedCurves[SECSign.EllipticCurve.p512] = "1.3.132.0.35";

var nodeAlgorithms = {};
nodeAlgorithms[SECVerify.Algorithm.rsaSHA256] = {name: 'rsa', hash: 'sha256'};
nodeAlgorithms[SECVerify.Algorithm.rsaSHA384] = {name: 'rsa', hash: 'sha384'};
nodeAlgorithms[SECVerify.Algorithm.rsaSHA512] = {name: 'rsa', hash: 'sha512'};
nodeAlgorithms[SECVerify.Algorithm.ellipticCurveSHA256] = {name: 'ec', hash: 'sha256', namedCurve: "secp256r1"};
nodeAlgorithms[SECVerify.Algorithm.ellipticCurveSHA384] = {name: 'ec', hash: 'sha384', namedCurve: "secp384r1"};
nodeAlgorithms[SECVerify.Algorithm.ellipticCurveSHA512] = {name: 'ec', hash: 'sha512', namedCurve: "secp521r1"};

