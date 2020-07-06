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
// jshint node: true
'use strict';

var crypto = require('crypto');

SECSign.definePropertiesFromExtensions({

    nodeSign: null,
    nodeAlgorithm: null,

    initWithAlgorithm: function(algorithm){
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
            modulusLength: options.modulusLength || 2048,
            publicExponent: options.publicExponent || 0x10001,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            }
        };
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

    createKeyFromJWK: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
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

                if (typeof(jwk.p) == "string" && typeof(jwk.q) == "string" && typeof(jwk.dp) == "string" && typeof(jwk.dq) == "string" && typeof(jwk.q1) == "string"){
                    values.push(SECDERInteger(jwk.p.dataByDecodingBase64URL()));
                    values.push(SECDERInteger(jwk.q.dataByDecodingBase64URL()));
                    values.push(SECDERInteger(jwk.dp.dataByDecodingBase64URL()));
                    values.push(SECDERInteger(jwk.dq.dataByDecodingBase64URL()));
                    values.push(SECDERInteger(jwk.q1.dataByDecodingBase64URL()));
                }

                if (jwk.oth){
                    completion.call(target, null);
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
                completion.call(target, null);
            }
        }else{
            completion.call(target, null);
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

