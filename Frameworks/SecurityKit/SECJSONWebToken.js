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
// #import "SECHMAC.js"
// #import "SECVerify.js"
// #import "SECSign.js"
// #import "SECJSONWebAlgorithms.js"
'use strict';

(function(){

JSClass("SECJSONWebToken", JSObject, {

    signature: null,
    _signedChunks: null,
    _header: null,
    unverifiedPayload: JSReadOnlyProperty('_unverifiedPayload'),

    initWithString: function(str){
        var parts = str.split('.');
        if (parts.length !== 3){
            return null;
        }
        try{
            var headerData = parts[0].dataByDecodingBase64URL();
            var payloadData = parts[1].dataByDecodingBase64URL();
            this.signature = parts[2].dataByDecodingBase64URL();
            this._header = JSON.parse(headerData.stringByDecodingUTF8());
            this._unverifiedPayload = JSON.parse(payloadData.stringByDecodingUTF8());
        }catch (e){
            return null;
        }
        this._signedChunks = [parts[0].utf8(), dot, parts[1].utf8()];
    },

    initWithPayload: function(payload){
        this._header = {
            typ: "JWT",
            alg: SECJSONWebToken.Algorithm.none
        };
        this._unverifiedPayload = payload;
        this.signature = JSData.initWithLength(0);
    },

    stringRepresentation: function(){
        if (this._signedChunks !== null){
            return JSData.initWithChunks(this._signedChunks).stringByDecodingUTF8() + "." + this.signature.base64URLStringRepresentation();
        }
        var parts = [
            JSON.stringify(this._header).utf8().base64URLStringRepresentation(),
            JSON.stringify(this._unverifiedPayload).utf8().base64URLStringRepresentation(),
            this.signature.base64URLStringRepresentation()
        ];
        return parts.join(".");
    },

    signed: JSReadOnlyProperty(null, 'isSigned'),

    isSigned: function(){
        return this._header.alg != SECJSONWebToken.Algorithm.none;
    },

    verifiedPayload: function(jwkOrSet, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var veifyHandler = function(verified){
            if (verified){
                completion.call(target, this._unverifiedPayload);
                return;
            }
            completion.call(target, null);
        };
        var jwk = null;
        if (jwkOrSet instanceof JSData){
            jwk = {
                kty: "oct",
                k: jwkOrSet.base64URLStringRepresentation()
            };
        }else if (jwkOrSet instanceof Array){
            for (var i = 0, l = jwkOrSet.length; i < l && jwk === null; ++i){
                var candidate = jwkOrSet[i];
                if (this._header.kid == candidate.kid){
                    jwk = candidate;
                }
            }
        }else{
            jwk = jwkOrSet;
        }
        if (jwk !== null){
            switch (this._header.alg){
                case SECJSONWebToken.Algorithm.hmacSHA256:
                    this._verifyHMAC(SECHMAC.Algorithm.sha256, jwk, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.hmacSHA384:
                    this._verifyHMAC(SECHMAC.Algorithm.sha384, jwk, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.hmacSHA512:
                    this._verifyHMAC(SECHMAC.Algorithm.sha512, jwk, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.rsaSHA256:
                    this._verifyAsymmetric(SECVerify.Algorithm.rsaSHA256, jwk, SECJSONWebToken.KeyType.rsa, this._header.kid, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.rsaSHA384:
                    this._verifyAsymmetric(SECVerify.Algorithm.rsaSHA384, jwk, SECJSONWebToken.KeyType.rsa, this._header.kid, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.rsaSHA512:
                    this._verifyAsymmetric(SECVerify.Algorithm.rsaSHA512, jwk, SECJSONWebToken.KeyType.rsa, this._header.kid, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.ellipticCurveSHA256:
                    this._verifyAsymmetric(SECVerify.Algorithm.ellipticCurveSHA256, jwk, SECJSONWebToken.KeyType.ellipticCurve, this._header.kid, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.ellipticCurveSHA384:
                    this._verifyAsymmetric(SECVerify.Algorithm.ellipticCurveSHA384, jwk, SECJSONWebToken.KeyType.ellipticCurve, this._header.kid, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.ellipticCurveSHA512:
                    this._verifyAsymmetric(SECVerify.Algorithm.ellipticCurveSHA512, jwk, SECJSONWebToken.KeyType.ellipticCurve, this._header.kid, this._signedChunks, this.signature, veifyHandler, this);
                    break;
                default:
                    completion.call(target, null);
                    break;
            }
        }else{
            completion.call(target, null);
        }
        return completion.promise;
    },

    _verifyHMAC: function(algorithm, jwk, chunks, signature, completion, target){
        this._signHMAC(algorithm, jwk, chunks, function(computed){
            var verified = computed !== null && computed.isEqual(signature);
            completion.call(target, verified);
        }, this);
    },

    _verifyAsymmetric: function(algorithm, jwk, kty, kid, chunks, signature, completion, target){
        if (jwk.kty === kty){
            var verify = SECVerify.initWithAlgorithm(algorithm);
            var key = verify.createKeyFromJWK(jwk, function(key){
                if (key === null){
                    completion.call(target, false);
                    return;
                }
                for (var i = 0, l = chunks.length; i < l; ++i){
                    verify.update(chunks[i]);
                }
                verify.verify(key, signature, function(verified){
                    completion.call(target, verified);
                });
            }, this);
        }else{
            completion.call(target, false);
        }
    },

    sign: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNotNull);
        }
        var signatureHandler = function(signature){
            if (signature === null){
                completion.call(target, null);
                return;
            }
            this.signature = signature;
            var jwt = this.stringRepresentation();
            completion.call(target, jwt);
        };
        if (jwk !== null){
            this._header.alg = jwk.alg;
            if (jwk.kid){
                this._header.kid = jwk.kid;
            }
            this._signedChunks = [JSON.stringify(this._header).utf8().base64URLStringRepresentation().utf8(), dot, JSON.stringify(this._unverifiedPayload).utf8().base64URLStringRepresentation().utf8()];
            switch (jwk.alg){
                case SECJSONWebToken.Algorithm.hmacSHA256:
                    this._signHMAC(SECHMAC.Algorithm.sha256, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.hmacSHA384:
                    this._signHMAC(SECHMAC.Algorithm.sha384, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.hmacSHA512:
                    this._signHMAC(SECHMAC.Algorithm.sha512, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.rsaSHA256:
                    this._signAsymmetric(SECVerify.Algorithm.rsaSHA256, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.rsaSHA384:
                    this._signAsymmetric(SECVerify.Algorithm.rsaSHA384, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.rsaSHA512:
                    this._signAsymmetric(SECVerify.Algorithm.rsaSHA512, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.ellipticCurveSHA256:
                    this._signAsymmetric(SECVerify.Algorithm.ellipticCurveSHA256, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.ellipticCurveSHA384:
                    this._signAsymmetric(SECVerify.Algorithm.ellipticCurveSHA384, jwk, this._signedChunks, signatureHandler, this);
                    break;
                case SECJSONWebToken.Algorithm.ellipticCurveSHA512:
                    this._signAsymmetric(SECVerify.Algorithm.ellipticCurveSHA512, jwk, this._signedChunks, signatureHandler, this);
                    break;
                default:
                    completion.call(target, null);
                    return completion.promise;
            }
        }else{
            completion.call(target, null);
        }
        return completion.promise;
    },

    _signHMAC: function(algorithm, jwk, chunks, completion, target){
        var hash = SECHMAC.initWithAlgorithm(algorithm);
        hash.createKeyFromJWK(jwk, function(key){
            if (key === null){
                completion.call(target, null);
                return;
            }
            hash.key = key;
            for (var i = 0, l = chunks.length; i < l; ++i){
                hash.update(chunks[i]);
            }
            hash.sign(function(computed){
                completion.call(target, computed);
            });
        });
    },

    _signAsymmetric: function(algorithm, jwk, chunks, completion, target){
        var sign = SECSign.initWithAlgorithm(algorithm);
        var key = sign.createKeyFromJWK(jwk, function(key){
            if (key === null){
                completion.call(target, null);
                return;
            }
            for (var i = 0, l = chunks.length; i < l; ++i){
                sign.update(chunks[i]);
            }
            sign.sign(key, function(computed){
                completion.call(target, computed);
            });
        }, this);
    },

});

SECJSONWebToken.Algorithm = SECJSONWebAlgorithms.Algorithm;

SECJSONWebToken.KeyType = SECJSONWebAlgorithms.KeyType;

SECJSONWebToken.EllipticCurve = SECJSONWebAlgorithms.EllipticCurve;

var dot = JSData.initWithArray([0x2E]);

})();