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
// #import "SECCipher.js"
// #import "SECHMAC.js"
// #import "SECJSONWebAlgorithms.js"
'use strict';

(function(){

JSClass("SECJSONWebEncryption", JSObject, {

    initWithString: function(str){
        if (str === null || str === undefined){
            return null;
        }
        var parts = str.split('.');
        if (parts.length !== 5){
            return null;
        }
        try{
            this._headerData = parts[0].dataByDecodingBase64URL();
            this._header = JSON.parse(this._headerData.stringByDecodingUTF8());
            this._encryptedKey = parts[1].length > 0 ? parts[1].dataByDecodingBase64URL() : null;
            this._initalizationVector = parts[2].dataByDecodingBase64URL();
            this._ciphertext = parts[3].dataByDecodingBase64URL();
            this._authenticationTag = parts[4].dataByDecodingBase64URL();
        }catch (e){
            return null;
        }
    },

    _headerData: null,
    _header: null,
    _encryptedKey: null,
    _initalizationVector: null,
    _ciphertext: null,
    _authenticationTag: null,

    encrypt: function(plaintext, jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this._header = {
        };
        this._encryptedKey = null;
        this._initalizationVector = null;
        this._ciphertext = null;
        this._authenticationTag = null;
        if (jwk.kid){
            this._header.kid = jwk.kid;
        }
        switch (jwk.alg){
            case SECJSONWebAlgorithms.Algorithm.hmacSHA256:
                this._header.alg = SECJSONWebAlgorithms.Algorithm.direct;
                this._header.enc = SECJSONWebAlgorithms.Algorithm.aesCBC128HS256;
                this._encryptAESCBCHMAC(128, SECHMAC.Algorithm.sha256, plaintext, jwk, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.hmacSHA384:
                this._header.alg = SECJSONWebAlgorithms.Algorithm.direct;
                this._header.enc = SECJSONWebAlgorithms.Algorithm.aesCBC192HS384;
                this._encryptAESCBCHMAC(192, SECHMAC.Algorithm.sha384, plaintext, jwk, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.hmacSHA512:
                this._header.alg = SECJSONWebAlgorithms.Algorithm.direct;
                this._header.enc = SECJSONWebAlgorithms.Algorithm.aesCBC256HS512;
                this._encryptAESCBCHMAC(256, SECHMAC.Algorithm.sha512, plaintext, jwk, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.rsaOAEP:
                this._header.alg = SECJSONWebAlgorithms.Algorithm.rsaOAEP;
                this._header.enc = SECJSONWebAlgorithms.Algorithm.aesCBC256HS512;
                this._encryptAESCBCHMAC(256, SECHMAC.Algorithm.sha512, plaintext, jwk, completion, target);
                break;
            default:
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
        }
        return completion.promise;
    },

    _encryptAESCBCHMAC: function(keyBitLength, hmacAlgorithm, plaintext, jwk, completion, target){
        this._headerData = JSON.stringify(this._header).utf8();
        var additionalData = this._headerData.base64URLStringRepresentation().latin1();
        var contentCipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCBC, {keyBitLength: keyBitLength});
        var hmac = SECHMAC.initWithAlgorithm(hmacAlgorithm);
        var keyCipher = null;
        switch (this._header.alg){
            case SECJSONWebAlgorithms.Algorithm.direct:
                break;
            case SECJSONWebAlgorithms.Algorithm.rsaOAEP:
                keyCipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rsaOAEP);
                break;
            default:
                JSRunLoop.main.schedule(completion, target, null);
                return;
        }
        var encryptContent = function(combinedKeyData){
            if (combinedKeyData === null){
                completion.call(target, null);
                return;
            }
            var hkeyData = combinedKeyData.subdataInRange(JSRange(0, contentCipher.keyByteLength));
            var cekData = combinedKeyData.subdataInRange(JSRange(contentCipher.keyByteLength, contentCipher.keyByteLength));
            contentCipher.createKeyWithData(cekData, function(cek){
                if (cek === null){
                    completion.call(target, null);
                    return;
                }
                contentCipher.encrypt(plaintext, cek, function(ciphertext){
                    if (ciphertext === null){
                        completion.call(target, null);
                        return;
                    }
                    this._initalizationVector = ciphertext.subdataInRange(JSRange(0, contentCipher.ivByteLength));
                    this._ciphertext = ciphertext.subdataInRange(JSRange(contentCipher.ivByteLength, ciphertext.length - contentCipher.ivByteLength));
                    hmac.createKeyWithData(hkeyData, function(hkey){
                        if (hkey === null){
                            completion.call(target, null);
                            return;
                        }
                        hmac.key = hkey;
                        hmac.update(additionalData);
                        hmac.update(this._initalizationVector);
                        hmac.update(this._ciphertext);
                        hmac.update(uint64DataFromNumber(additionalData.length * 8));
                        hmac.sign(function(tag){
                            if (tag === null){
                                completion.call(target, null);
                                return;
                            }
                            this._authenticationTag = tag.subdataInRange(JSRange(0, hkeyData.length));
                            completion.call(target, this.stringRepresentation());
                        }, this);
                    }, this);
                }, this);
            }, this);
        };
        if (keyCipher !== null){
            keyCipher.createKeyFromJWK(jwk, function(kek){
                if (kek === null){
                    completion.call(target, null);
                    return;
                }
                hmac.createKey(function(combinedKey){
                    if (combinedKey === null){
                        completion.call(target, null);
                        return;
                    }
                    keyCipher.wrapKey(combinedKey, kek, function(encryptedKey){
                        if (encryptedKey === null){
                            completion.call(target, null);
                            return;
                        }
                        this._encryptedKey = encryptedKey;
                        combinedKey.getData(encryptContent, this);
                    }, this);
                }, this);
            }, this);
        }else{
            JSRunLoop.main.schedule(encryptContent, this, jwk.k.dataByDecodingBase64URL());
        }
    },

    stringRepresentation: function(){
        if (this._ciphertext === null){
            throw new Error("SECJSONWebEncryption.stringRepresentation() cannot be called before first calling .encrypt()");
        }
        var parts = [
            this._headerData.base64URLStringRepresentation(),
            this._encryptedKey !== null ? this._encryptedKey.base64URLStringRepresentation() : "",
            this._initalizationVector.base64URLStringRepresentation(),
            this._ciphertext.base64URLStringRepresentation(),
            this._authenticationTag.base64URLStringRepresentation()
        ];
        return parts.join(".");
    },

    decrypt: function(jwkOrSet, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var jwk = null;
        if (jwkOrSet instanceof JSData){
            jwk = {
                kty: SECJSONWebAlgorithms.KeyType.symmetric,
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
        if (jwk === null){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var additionalData = this._headerData.base64URLStringRepresentation().latin1();
        switch (this._header.enc){
            case SECJSONWebAlgorithms.Algorithm.aesGCM128:
                this._decryptAESGCM(128, jwk, additionalData, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.aesGCM192:
                this._decryptAESGCM(192, jwk, additionalData, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.aesGCM256:
                this._decryptAESGCM(256, jwk, additionalData, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.aesCBC128HS256:
                this._decryptAESCBCHMAC(128, SECHMAC.Algorithm.sha256, jwk, additionalData, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.aesCBC192HS384:
                this._decryptAESCBCHMAC(192, SECHMAC.Algorithm.sha384, jwk, additionalData, completion, target);
                break;
            case SECJSONWebAlgorithms.Algorithm.aesCBC256HS512:
                this._decryptAESCBCHMAC(256, SECHMAC.Algorithm.sha512, jwk, additionalData, completion, target);
                break;
            default:
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
        }
        return completion.promise;
    },

    _decryptAESGCM: function(keyBitLength, jwk, additionalData, completion, target){
        var contentCipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGCM, {
            keyBitLength: keyBitLength,
            additionalData: additionalData,
            ivByteLength: this._initalizationVector.length,
            tagByteLength: this._authenticationTag.length
        });
        var keyCipher = null;
        switch (this._header.alg){
            case SECJSONWebAlgorithms.Algorithm.direct:
                break;
            case SECJSONWebAlgorithms.Algorithm.rsaOAEP:
                keyCipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rsaOAEP);
                break;
            // TODO: support ECDH-ES key derivation
            default:
                JSRunLoop.main.schedule(completion, target, null);
                return;
        }
        var decrypt = function(cek){
            if (cek === null){
                completion.call(target, null);
                return;
            }
            var ciphertext = JSData.initWithChunks([
                this._initalizationVector,
                this._ciphertext,
                this._authenticationTag
            ]);
            contentCipher.decrypt(ciphertext, cek, function(plaintext){
                if (plaintext === null){
                    completion.call(target, null);
                    return;
                }
                completion.call(target, plaintext, null);
            }, this);
        };
        if (keyCipher !== null){
            keyCipher.createKeyFromJWK(jwk, function(kek){
                if (kek === null){
                    decrypt(null);
                    return;
                }
                keyCipher.unwrapKey(this._encryptedKey, contentCipher.algorithm, kek, decrypt, this);
            }, this);
        }else{
            contentCipher.createKeyFromJWK(jwk, decrypt, this);
        }
    },

    _decryptAESCBCHMAC: function(keyBitLength, hmacAlgorithm, jwk, additionalData, completion, target){
        var contentCipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesCBC, {keyBitLength: keyBitLength});
        var keyCipher = null;
        switch (this._header.alg){
            case SECJSONWebAlgorithms.Algorithm.direct:
                break;
            case SECJSONWebAlgorithms.Algorithm.rsaOAEP:
                keyCipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rsaOAEP);
                break;
            // TODO: support ECDH-ES key derivation
            default:
                JSRunLoop.main.schedule(completion, target, null);
                return;
        }
        var decrypt = function(combinedKeyData){
            if (combinedKeyData === null){
                completion.call(target, null);
                return;
            }
            if (combinedKeyData.length !== contentCipher.keyByteLength + contentCipher.keyByteLength){
                completion.call(target, null);
                return;
            }
            var hkeyData = combinedKeyData.subdataInRange(JSRange(0, contentCipher.keyByteLength));
            var cekData = combinedKeyData.subdataInRange(JSRange(contentCipher.keyByteLength, contentCipher.keyByteLength));
            contentCipher.createKeyWithData(cekData, function(cek){
                if (cek === null){
                    completion.call(target, null);
                    return;
                }
                var ciphertext = JSData.initWithChunks([
                    this._initalizationVector,
                    this._ciphertext
                ]);
                contentCipher.decrypt(ciphertext, cek, function(plaintext){
                    if (plaintext === null){
                        completion.call(target, null);
                        return;
                    }
                    var hmac = SECHMAC.initWithAlgorithm(hmacAlgorithm);
                    hmac.createKeyWithData(hkeyData, function(hkey){
                        if (hkey === null){
                            completion.call(target, null);
                            return;
                        }
                        hmac.key = hkey;
                        hmac.update(additionalData);
                        hmac.update(this._initalizationVector);
                        hmac.update(this._ciphertext);
                        hmac.update(uint64DataFromNumber(additionalData.length * 8));
                        hmac.sign(function(tag){
                            if (tag === null){
                                completion.call(target, null);
                                return;
                            }
                            tag = tag.subdataInRange(JSRange(0, hkeyData.length));
                            if (!this._authenticationTag.isEqual(tag)){
                                completion.call(target, null);
                                return;
                            }
                            completion.call(target, plaintext);
                        }, this);
                    }, this);
                }, this);
            }, this);
        };
        if (keyCipher !== null){
            keyCipher.createKeyFromJWK(jwk, function(kek){
                if (kek === null){
                    decrypt(null);
                    return;
                }
                keyCipher.decrypt(this._encryptedKey, kek, decrypt, this);
            }, this);
        }else{
            JSRunLoop.main.schedule(decrypt, this, jwk.k.dataByDecodingBase64URL());
        }

    },

});

SECJSONWebEncryption.Algorithm = SECJSONWebAlgorithms.Algorithm;

SECJSONWebEncryption.KeyType = SECJSONWebAlgorithms.KeyType;

SECJSONWebEncryption.EllipticCurve = SECJSONWebAlgorithms.EllipticCurve;

var uint64DataFromNumber = function(n){
    var data = JSData.initWithLength(8);
    var byte = 7;
    while (n > 0){
        data[byte] = n & 0xFF;
        n >>>= 8;
        --byte;
    }
    return data;
};

})();