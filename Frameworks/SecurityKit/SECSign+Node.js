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
// #import "SECNodeKey.js"
// #import "SECASN1.js"
// #import "SECASN1Parser.js"
// #import "SECJSONWebAlgorithms.js"
// jshint node: true
'use strict';

var crypto = require('crypto');

SECSign.definePropertiesFromExtensions({

    nodeSign: null,
    nodeAlgorithm: null,

    initWithAlgorithm: function(algorithm){
        this.algorithm = algorithm;
        this.nodeAlgorithm = nodeAlgorithms[algorithm];
        if (!this.nodeAlgorithm){
            return null;
        }
        this.nodeSign = crypto.createSign(this.nodeAlgorithm.hash);
    },

    createKeyPair: function(options, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var nodeOptions = {
        };
        if (this.nodeAlgorithm.name == "rsa"){
            nodeOptions.modulusLength = options.modulusLength || 2048;
            nodeOptions.publicExponent = options.publicExponent || 0x10001;
        }else if (this.nodeAlgorithm.name == "ec"){
            if (options.namedCurve){
                nodeOptions.namedCurve = nodeNamedCurves[options.namedCurve];
            }else{
                nodeOptions.namedCurve = this.nodeAlgorithm.namedCurve;
            }
        }
        crypto.generateKeyPair(this.nodeAlgorithm.name, nodeOptions, function(err, publicKey, privateKey){
            if (err){
                completion.call(target, null);
                return;
            }
            var pair = {
                public: SECNodeKey.initWithNodeKeyObject(publicKey),
                private: SECNodeKey.initWithNodeKeyObject(privateKey),
            };
            pair.public.id = pair.private.id = JSSHA1Hash(UUID.init().bytes).base64URLStringRepresentation();
            completion.call(target, pair);
        });
        return completion.promise;
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var der, base64, pem, nodeKeyObject, key;
        if (jwk.kty === SECJSONWebAlgorithms.KeyType.rsa || jwk.kty === SECJSONWebAlgorithms.KeyType.ellipticCurve){
            nodeKeyObject = crypto.createPrivateKey({key: jwk, format: "jwk"});
            key = SECNodeKey.initWithNodeKeyObject(nodeKeyObject);
            if (key !== null){
                key.id = jwk.kid || null;
            }
            JSRunLoop.main.schedule(completion, target, key);
        // if (jwk.kty == SECJSONWebAlgorithms.KeyType.rsa){
        //     // RSA private key ASN.1 syntax:
        //     // RSAPrivateKey ::= SEQUENCE {
        //     //     version           Version,
        //     //     modulus           INTEGER,  -- n
        //     //     publicExponent    INTEGER,  -- e
        //     //     privateExponent   INTEGER,  -- d
        //     //     prime1            INTEGER,  -- p
        //     //     prime2            INTEGER,  -- q
        //     //     exponent1         INTEGER,  -- d mod (p-1)
        //     //     exponent2         INTEGER,  -- d mod (q-1)
        //     //     coefficient       INTEGER,  -- (inverse of q) mod p
        //     //     otherPrimeInfos   OtherPrimeInfos OPTIONAL
        //     // }
        //     // 
        //     if (typeof(jwk.n) == "string" && typeof(jwk.e) == "string" && typeof(jwk.d) == "string"){
        //         try{
        //             var values = [
        //                 SECASN1Integer.initWithData(JSData.initWithArray([0])),
        //                 SECASN1Integer.initWithData(jwk.n.dataByDecodingBase64URL()),
        //                 SECASN1Integer.initWithData(jwk.e.dataByDecodingBase64URL()),
        //                 SECASN1Integer.initWithData(jwk.d.dataByDecodingBase64URL()),
        //             ];

        //             if (typeof(jwk.p) == "string" && typeof(jwk.q) == "string" && typeof(jwk.dp) == "string" && typeof(jwk.dq) == "string" && typeof(jwk.qi) == "string"){
        //                 values.push(SECASN1Integer.initWithData(jwk.p.dataByDecodingBase64URL()));
        //                 values.push(SECASN1Integer.initWithData(jwk.q.dataByDecodingBase64URL()));
        //                 values.push(SECASN1Integer.initWithData(jwk.dp.dataByDecodingBase64URL()));
        //                 values.push(SECASN1Integer.initWithData(jwk.dq.dataByDecodingBase64URL()));
        //                 values.push(SECASN1Integer.initWithData(jwk.qi.dataByDecodingBase64URL()));
        //             }

        //             if (jwk.oth){
        //                 JSRunLoop.main.schedule(completion, target, null);
        //                 return completion.promise;
        //             }

        //             var rsaPrivateKey = SECASN1Sequence.initWithValues(values);
        //             pem = rsaPrivateKey.pemRepresentation("RSA PRIVATE KEY");
        //             key = SECNodeKey.initWithData(pem.utf8());
        //             JSRunLoop.main.schedule(completion, target, key);
        //         }catch (e){
        //             JSRunLoop.main.schedule(completion, target, null);
        //         }
        //     }else{
        //         JSRunLoop.main.schedule(completion, target, null);
        //     }
        // }else if (jwk.kty == SECJSONWebAlgorithms.KeyType.ellipticCurve){
        //     // ECPrivateKey ::= SEQUENCE {
        //     //   version        INTEGER { ecPrivkeyVer1(1) } (ecPrivkeyVer1),
        //     //   privateKey     OCTET STRING,
        //     //   parameters [0] ECParameters {{ NamedCurve }} OPTIONAL,
        //     //   publicKey  [1] BIT STRING OPTIONAL
        //     // }
        //     try{
        //         var namedCurve;
        //         switch (jwk.crv){
        //             case SECJSONWebAlgorithms.EllipticCurve.p256:
        //                 namedCurve = derNamedCurves[SECSign.EllipticCurve.p256];
        //                 break;
        //             case SECJSONWebAlgorithms.EllipticCurve.p384:
        //                 namedCurve = derNamedCurves[SECSign.EllipticCurve.p384];
        //                 break;
        //             case SECJSONWebAlgorithms.EllipticCurve.p521:
        //                 namedCurve = derNamedCurves[SECSign.EllipticCurve.p521];
        //                 break;
        //             default:
        //                 throw new Error("Unsupported curve name");
        //         }
        //         var privateKey = SECASN1Sequence.initWithValues([
        //             SECASN1Integer.initWithData(JSData.initWithArray([1])),
        //             SECASN1OctetString.initWithData(jwk.d.dataByDecodingBase64URL()),
        //             SECASN1Optional.initWithValue(
        //                 SECASN1ObjectIdentifier.initWithString(namedCurve),
        //                 0
        //             ),
        //             SECASN1Optional.initWithValue(
        //                 SECASN1BitString.initWithData(JSData.initWithChunks([
        //                     JSData.initWithArray([0x04]), // uncompressed
        //                     jwk.x.dataByDecodingBase64URL(),
        //                     jwk.y.dataByDecodingBase64URL()
        //                 ]), 0),
        //                 1
        //             )
        //         ]);
        //         pem = privateKey.pemRepresentation("EC PRIVATE KEY");
        //         key = SECNodeKey.initWithData(pem.utf8());
        //         JSRunLoop.main.schedule(completion, target, key);
        //     }catch (e){
        //         JSRunLoop.main.schedule(completion, target, null);
        //     }
        }else{
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    },

    update: function(data){
        this.nodeSign.write(data);
    },

    sign: function(key, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.nodeSign.end();
        var signature = this.nodeSign.sign(key.nodeKeyObject);
        completion.call(target, JSData.initWithNodeBuffer(signature));
        return completion.promise;
    }

});

var nodeNamedCurves = {};
nodeNamedCurves[SECSign.EllipticCurve.p256] = "prime256v1";
nodeNamedCurves[SECSign.EllipticCurve.p384] = "secp384r1";
nodeNamedCurves[SECSign.EllipticCurve.p521] = "secp521r1";

var derNamedCurves = {};
derNamedCurves[SECSign.EllipticCurve.p256] = "1.2.840.10045.3.1.7";
derNamedCurves[SECSign.EllipticCurve.p384] = "1.3.132.0.34";
derNamedCurves[SECSign.EllipticCurve.p521] = "1.3.132.0.35";

var nodeAlgorithms = {};
nodeAlgorithms[SECSign.Algorithm.rsaSHA256] = {name: 'rsa', hash: 'sha256'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA384] = {name: 'rsa', hash: 'sha384'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA512] = {name: 'rsa', hash: 'sha512'};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA256] = {name: 'ec', hash: 'sha256', namedCurve: nodeNamedCurves[SECSign.EllipticCurve.p256]};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA384] = {name: 'ec', hash: 'sha384', namedCurve: nodeNamedCurves[SECSign.EllipticCurve.p384]};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA512] = {name: 'ec', hash: 'sha512', namedCurve: nodeNamedCurves[SECSign.EllipticCurve.p521]};

