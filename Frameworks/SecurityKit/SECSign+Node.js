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
            nodeOptions.publicKeyEncoding = {
                type: 'pkcs1',
                format: 'pem'
            };
            nodeOptions.privateKeyEncoding = {
                type: 'pkcs1',
                format: 'pem'
            };
        }else if (this.nodeAlgorithm.name == "ec"){
            if (options.namedCurve){
                nodeOptions.namedCurve = nodeNamedCurves[options.namedCurve];
            }else{
                nodeOptions.namedCurve = this.nodeAlgorithm.namedCurve;
            }
            nodeOptions.publicKeyEncoding = {
                type: "spki",
                format: "pem"
            };
            nodeOptions.privateKeyEncoding = {
                type: "sec1",
                format: "pem"
            };
        }
        crypto.generateKeyPair(this.nodeAlgorithm.name, nodeOptions, function(err, publicKeyPem, privateKeyPem){
            if (err){
                completion.call(target, null);
                return;
            }
            var pair = {
                public: SECNodeKey.initWithData(publicKeyPem.utf8()),
                private: SECNodeKey.initWithData(privateKeyPem.utf8()),
            };
            completion.call(target, pair);
        });
        return completion.promise;
    },

    createJWKPair: function(options, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.createKeyPair(options, function(pair){
            if (pair === null){
                completion.call(target, null);
                return;
            }
            var jwkPair = null;
            try{
                var kid = JSSHA1Hash(UUID.init().bytes).base64URLStringRepresentation();
                var alg = null;
                var kty = null;
                switch (this.algorithm){
                    case SECSign.Algorithm.rsaSHA256:
                        alg = SECJSONWebAlgorithms.Algorithm.rsaSHA256;
                        kty = SECJSONWebAlgorithms.KeyType.rsa;
                        break;
                    case SECSign.Algorithm.rsaSHA384:
                        alg = SECJSONWebAlgorithms.Algorithm.rsaSHA384;
                        kty = SECJSONWebAlgorithms.KeyType.rsa;
                        break;
                    case SECSign.Algorithm.rsaSHA512:
                        alg = SECJSONWebAlgorithms.Algorithm.rsaSHA512;
                        kty = SECJSONWebAlgorithms.KeyType.rsa;
                        break;
                    case SECSign.Algorithm.ellipticCurveSHA256:
                        alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA256;
                        kty = SECJSONWebAlgorithms.KeyType.ellipticCurve;
                        break;
                    case SECSign.Algorithm.ellipticCurveSHA384:
                        alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA384;
                        kty = SECJSONWebAlgorithms.KeyType.ellipticCurve;
                        break;
                    case SECSign.Algorithm.ellipticCurveSHA512:
                        alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA512;
                        kty = SECJSONWebAlgorithms.KeyType.ellipticCurve;
                        break;
                    default:
                        throw new Error("Unable to map SECSign algorithm to JWK");
                }
                var publicJWK = {
                    kid: kid,
                    kty: kty,
                    alg: alg,
                    key_ops: ["verify"]
                };
                var privateJWK = {
                    kid: kid,
                    kty: kty,
                    alg: alg,
                    key_ops: ["sign"]
                };
                var pem;
                var parser;
                var sequence;
                if (kty == SECJSONWebAlgorithms.KeyType.rsa){
                    pem = pair.public.keyData;
                    parser = SECASN1Parser.initWithPEM(pem, "RSA PUBLIC KEY");
                    sequence = parser.parse();
                    publicJWK.n = sequence.values[0].data.base64URLStringRepresentation();
                    publicJWK.e = sequence.values[1].data.base64URLStringRepresentation();

                    pem = pair.private.keyData;
                    parser = SECASN1Parser.initWithPEM(pem, "RSA PRIVATE KEY");
                    sequence = parser.parse();
                    privateJWK.n = sequence.values[1].data.base64URLStringRepresentation();
                    privateJWK.e = sequence.values[2].data.base64URLStringRepresentation();
                    privateJWK.d = sequence.values[3].data.base64URLStringRepresentation();
                    if (sequence.values.length >= 9){
                        privateJWK.p = sequence.values[4].data.base64URLStringRepresentation();
                        privateJWK.q = sequence.values[5].data.base64URLStringRepresentation();
                        privateJWK.dp = sequence.values[6].data.base64URLStringRepresentation();
                        privateJWK.dq = sequence.values[7].data.base64URLStringRepresentation();
                        privateJWK.qi = sequence.values[8].data.base64URLStringRepresentation();
                    }
                }else if (kty == SECJSONWebAlgorithms.KeyType.ellipticCurve){
                    pem = pair.public.keyData;
                    parser = SECASN1Parser.initWithPEM(pem, "PUBLIC KEY");
                    sequence = parser.parse();
                    if (sequence.values[0].values[0].stringValue != "1.2.840.10045.2.1"){
                        throw new Error("Expecting id-ecPublicKey");
                    }
                    var derCurve = sequence.values[0].values[1].stringValue;
                    var pointLength;
                    switch (derCurve){
                        case derNamedCurves[SECSign.EllipticCurve.p256]:
                            publicJWK.crv = SECJSONWebAlgorithms.EllipticCurve.p256;
                            pointLength = 32;
                            break;
                        case derNamedCurves[SECSign.EllipticCurve.p384]:
                            publicJWK.crv = SECJSONWebAlgorithms.EllipticCurve.p384;
                            pointLength = 48;
                            break;
                        case derNamedCurves[SECSign.EllipticCurve.p521]:
                            publicJWK.crv = SECJSONWebAlgorithms.EllipticCurve.p521;
                            pointLength = 66;
                            break;
                        default:
                            throw new Error("Unknown elliptic curve");
                    }
                    var points = sequence.values[1].data;
                    if (points[0] != 0x4){
                        throw new Error("Compressed points not implemented");
                    }
                    if (points.length != pointLength + pointLength + 1){
                        throw new Error("Unexpected point length");
                    }
                    publicJWK.x = points.subdataInRange(JSRange(1, pointLength)).base64URLStringRepresentation();
                    publicJWK.y = points.subdataInRange(JSRange(1 + pointLength, pointLength)).base64URLStringRepresentation();


                    pem = pair.private.keyData;
                    parser = SECASN1Parser.initWithPEM(pem, "EC PRIVATE KEY");
                    sequence = parser.parse();
                    var version = sequence.values[0].data[0];
                    if (version != 1){
                        throw new Error("Unexpected EC private key version");
                    }
                    privateJWK.d = sequence.values[1].data.base64URLStringRepresentation();
                    var optional = sequence.values[2];
                    if (optional.classNumber !== 0){
                        throw new Error("Expecting EC named curve");
                    }
                    derCurve = optional.value.stringValue;
                    switch (derCurve){
                        case derNamedCurves[SECSign.EllipticCurve.p256]:
                            privateJWK.crv = SECJSONWebAlgorithms.EllipticCurve.p256;
                            pointLength = 32;
                            break;
                        case derNamedCurves[SECSign.EllipticCurve.p384]:
                            privateJWK.crv = SECJSONWebAlgorithms.EllipticCurve.p384;
                            pointLength = 48;
                            break;
                        case derNamedCurves[SECSign.EllipticCurve.p521]:
                            privateJWK.crv = SECJSONWebAlgorithms.EllipticCurve.p521;
                            pointLength = 66;
                            break;
                        default:
                            throw new Error("Unknown elliptic curve");
                    }
                    optional = sequence.values[3];
                    if (optional.classNumber !== 1){
                        throw new Error("Expecting EC point");
                    }
                    points = optional.value.data;
                    if (points[0] != 0x4){
                        throw new Error("Compressed points not implemented");
                    }
                    if (points.length != pointLength + pointLength + 1){
                        throw new Error("Unexpected point length");
                    }
                    privateJWK.x = points.subdataInRange(JSRange(1, pointLength)).base64URLStringRepresentation();
                    privateJWK.y = points.subdataInRange(JSRange(1 + pointLength, pointLength)).base64URLStringRepresentation();
                }
                jwkPair = {
                    public: publicJWK,
                    private: privateJWK
                };
            }catch (e){
            }
            completion.call(target, jwkPair);
        }, this);
        return completion.promise;
    },

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var der, base64, pem, key;
        if (jwk.kty == SECJSONWebAlgorithms.KeyType.rsa){
            // RSA private key ASN.1 syntax:
            // RSAPrivateKey ::= SEQUENCE {
            //     version           Version,
            //     modulus           INTEGER,  -- n
            //     publicExponent    INTEGER,  -- e
            //     privateExponent   INTEGER,  -- d
            //     prime1            INTEGER,  -- p
            //     prime2            INTEGER,  -- q
            //     exponent1         INTEGER,  -- d mod (p-1)
            //     exponent2         INTEGER,  -- d mod (q-1)
            //     coefficient       INTEGER,  -- (inverse of q) mod p
            //     otherPrimeInfos   OtherPrimeInfos OPTIONAL
            // }
            // 
            if (typeof(jwk.n) == "string" && typeof(jwk.e) == "string" && typeof(jwk.d) == "string"){
                try{
                    var values = [
                        SECASN1Integer.initWithData(JSData.initWithArray([0])),
                        SECASN1Integer.initWithData(jwk.n.dataByDecodingBase64URL()),
                        SECASN1Integer.initWithData(jwk.e.dataByDecodingBase64URL()),
                        SECASN1Integer.initWithData(jwk.d.dataByDecodingBase64URL()),
                    ];

                    if (typeof(jwk.p) == "string" && typeof(jwk.q) == "string" && typeof(jwk.dp) == "string" && typeof(jwk.dq) == "string" && typeof(jwk.qi) == "string"){
                        values.push(SECASN1Integer.initWithData(jwk.p.dataByDecodingBase64URL()));
                        values.push(SECASN1Integer.initWithData(jwk.q.dataByDecodingBase64URL()));
                        values.push(SECASN1Integer.initWithData(jwk.dp.dataByDecodingBase64URL()));
                        values.push(SECASN1Integer.initWithData(jwk.dq.dataByDecodingBase64URL()));
                        values.push(SECASN1Integer.initWithData(jwk.qi.dataByDecodingBase64URL()));
                    }

                    if (jwk.oth){
                        JSRunLoop.main.schedule(completion, target, null);
                        return completion.promise;
                    }

                    var rsaPrivateKey = SECASN1Sequence.initWithValues(values);
                    pem = rsaPrivateKey.pemRepresentation("RSA PRIVATE KEY");
                    key = SECNodeKey.initWithData(pem.utf8());
                    JSRunLoop.main.schedule(completion, target, key);
                }catch (e){
                    JSRunLoop.main.schedule(completion, target, null);
                }
            }else{
                JSRunLoop.main.schedule(completion, target, null);
            }
        }else if (jwk.kty == SECJSONWebAlgorithms.KeyType.ellipticCurve){
            // ECPrivateKey ::= SEQUENCE {
            //   version        INTEGER { ecPrivkeyVer1(1) } (ecPrivkeyVer1),
            //   privateKey     OCTET STRING,
            //   parameters [0] ECParameters {{ NamedCurve }} OPTIONAL,
            //   publicKey  [1] BIT STRING OPTIONAL
            // }
            try{
                var namedCurve;
                switch (jwk.crv){
                    case SECJSONWebAlgorithms.EllipticCurve.p256:
                        namedCurve = derNamedCurves[SECSign.EllipticCurve.p256];
                        break;
                    case SECJSONWebAlgorithms.EllipticCurve.p384:
                        namedCurve = derNamedCurves[SECSign.EllipticCurve.p384];
                        break;
                    case SECJSONWebAlgorithms.EllipticCurve.p521:
                        namedCurve = derNamedCurves[SECSign.EllipticCurve.p521];
                        break;
                    default:
                        throw new Error("Unsupported curve name");
                }
                var privateKey = SECASN1Sequence.initWithValues([
                    SECASN1Integer.initWithData(JSData.initWithArray([1])),
                    SECASN1OctetString.initWithData(jwk.d.dataByDecodingBase64URL()),
                    SECASN1Optional.initWithValue(
                        SECASN1ObjectIdentifier.initWithString(namedCurve),
                        0
                    ),
                    SECASN1Optional.initWithValue(
                        SECASN1BitString.initWithData(JSData.initWithChunks([
                            JSData.initWithArray([0x04]), // uncompressed
                            jwk.x.dataByDecodingBase64URL(),
                            jwk.y.dataByDecodingBase64URL()
                        ]), 0),
                        1
                    )
                ]);
                pem = privateKey.pemRepresentation("EC PRIVATE KEY");
                key = SECNodeKey.initWithData(pem.utf8());
                JSRunLoop.main.schedule(completion, target, key);
            }catch (e){
                JSRunLoop.main.schedule(completion, target, null);
            }
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
        var signature = this.nodeSign.sign(key.keyData);
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
derNamedCurves[SECSign.EllipticCurve.p512] = "1.3.132.0.35";

var nodeAlgorithms = {};
nodeAlgorithms[SECSign.Algorithm.rsaSHA256] = {name: 'rsa', hash: 'sha256'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA384] = {name: 'rsa', hash: 'sha384'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA512] = {name: 'rsa', hash: 'sha512'};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA256] = {name: 'ec', hash: 'sha256', namedCurve: nodeNamedCurves[SECSign.EllipticCurve.p256]};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA384] = {name: 'ec', hash: 'sha384', namedCurve: nodeNamedCurves[SECSign.EllipticCurve.p384]};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA512] = {name: 'ec', hash: 'sha512', namedCurve: nodeNamedCurves[SECSign.EllipticCurve.p521]};

