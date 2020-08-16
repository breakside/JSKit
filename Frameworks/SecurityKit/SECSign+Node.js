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
// #import "SECDER.js"
// #import "SECJSONWebToken.js"
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
            nodeOptions.namedCurve = this.nodeAlgorithm.namedCurve;
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
                var kty;
                switch (this.algorithm){
                    case SECSign.Algorithm.rsaSHA256:
                        alg = SECJSONWebToken.Algorithm.rsa256;
                        kty = SECJSONWebToken.KeyType.rsa;
                        break;
                    case SECSign.Algorithm.rsaSHA384:
                        alg = SECJSONWebToken.Algorithm.rsa384;
                        kty = SECJSONWebToken.KeyType.rsa;
                        break;
                    case SECSign.Algorithm.rsaSHA512:
                        alg = SECJSONWebToken.Algorithm.rsa512;
                        kty = SECJSONWebToken.KeyType.rsa;
                        break;
                    case SECSign.Algorithm.ellipticCurveSHA256:
                        alg = SECJSONWebToken.Algorithm.ellipticCurve256;
                        kty = SECJSONWebToken.ellipticCurve;
                        break;
                    case SECSign.Algorithm.ellipticCurveSHA384:
                        alg = SECJSONWebToken.Algorithm.ellipticCurve384;
                        kty = SECJSONWebToken.ellipticCurve;
                        break;
                    case SECSign.Algorithm.ellipticCurveSHA512:
                        alg = SECJSONWebToken.Algorithm.ellipticCurve512;
                        kty = SECJSONWebToken.ellipticCurve;
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
                if (kty == SECJSONWebToken.KeyType.rsa){
                    pem = pair.public.keyData;
                    parser = SECDERParser.initWithPEM(pem, "RSA PUBLIC KEY");
                    sequence = parser.parse();
                    publicJWK.n = sequence[0].base64URLStringRepresentation();
                    publicJWK.e = sequence[1].base64URLStringRepresentation();

                    pem = pair.private.keyData;
                    parser = SECDERParser.initWithPEM(pem, "RSA PRIVATE KEY");
                    sequence = parser.parse();
                    privateJWK.n = sequence[1].base64URLStringRepresentation();
                    privateJWK.e = sequence[2].base64URLStringRepresentation();
                    privateJWK.d = sequence[3].base64URLStringRepresentation();
                    if (sequence.length >= 9){
                        privateJWK.p = sequence[4].base64URLStringRepresentation();
                        privateJWK.q = sequence[5].base64URLStringRepresentation();
                        privateJWK.dp = sequence[6].base64URLStringRepresentation();
                        privateJWK.dq = sequence[7].base64URLStringRepresentation();
                        privateJWK.qi = sequence[8].base64URLStringRepresentation();
                    }
                }else if (kty == SECJSONWebToken.KeyType.ellipticCurve){
                    pem = pair.public.keyData;
                    parser = SECDERParser.initWithPEM(pem, "PUBLIC KEY");
                    sequence = parser.parse();
                    // TODO:
                    // crv
                    // x
                    // y
                    pem = pair.private.keyData;
                    parser = SECDERParser.initWithPEM(pem, "EC PRIVATE KEY");
                    sequence = parser.parse();
                    var version = sequence[0];
                    if (version != 1){
                        throw new Error("Unexpected EC private key version");
                    }
                    // TODO:
                    // crv
                    // x
                    // y
                    privateJWK.d = sequence[1].base64StringRepresentation();
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
        if (jwk.kty == SECJSONWebToken.KeyType.rsa){
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
                        SECDERInteger(JSData.initWithArray([0])),
                        SECDERInteger(jwk.n.dataByDecodingBase64URL()),
                        SECDERInteger(jwk.e.dataByDecodingBase64URL()),
                        SECDERInteger(jwk.d.dataByDecodingBase64URL()),
                    ];

                    if (typeof(jwk.p) == "string" && typeof(jwk.q) == "string" && typeof(jwk.dp) == "string" && typeof(jwk.dq) == "string" && typeof(jwk.qi) == "string"){
                        values.push(SECDERInteger(jwk.p.dataByDecodingBase64URL()));
                        values.push(SECDERInteger(jwk.q.dataByDecodingBase64URL()));
                        values.push(SECDERInteger(jwk.dp.dataByDecodingBase64URL()));
                        values.push(SECDERInteger(jwk.dq.dataByDecodingBase64URL()));
                        values.push(SECDERInteger(jwk.qi.dataByDecodingBase64URL()));
                    }

                    if (jwk.oth){
                        JSRunLoop.main.schedule(completion, target, null);
                        return completion.promise;
                    }

                    var rsaPrivateKey = SECDERSequence(values);
                    var der = JSData.initWithLength(rsaPrivateKey.length);
                    rsaPrivateKey.copyTo(der, 0);

                    var base64 = der.base64StringRepresentation(64);
                    var pem = "-----BEGIN RSA PRIVATE KEY-----\n";
                    pem += base64;
                    pem += "\n-----END RSA PRIVATE KEY-----\n";
                    var key = SECNodeKey.initWithData(pem.utf8());
                    JSRunLoop.main.schedule(completion, target, key);
                }catch (e){
                    JSRunLoop.main.schedule(completion, target, null);
                }
            }else{
                JSRunLoop.main.schedule(completion, target, null);
            }
        }else if (jwk.kty == SECJSONWebToken.KeyType.ellipticCurve){
            var namedCurve = jwk.crv;
            // jwk.x
            // jwk.y
            // jwk.d
            // TODO:
            JSRunLoop.main.schedule(completion, target, null);
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

var nodeAlgorithms = {};
nodeAlgorithms[SECSign.Algorithm.rsaSHA256] = {name: 'rsa', hash: 'sha256'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA384] = {name: 'rsa', hash: 'sha384'};
nodeAlgorithms[SECSign.Algorithm.rsaSHA512] = {name: 'rsa', hash: 'sha512'};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA256] = {name: 'ec', hash: 'sha256', namedCurve: "secp256r1"};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA384] = {name: 'ec', hash: 'sha384', namedCurve: "secp384r1"};
nodeAlgorithms[SECSign.Algorithm.ellipticCurveSHA512] = {name: 'ec', hash: 'sha512', namedCurve: "secp521r1"};

