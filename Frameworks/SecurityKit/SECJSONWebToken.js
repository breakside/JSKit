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

    signed: JSReadOnlyProperty(null, 'isSigned'),

    isSigned: function(){
        return this._header.alg != 'none';
    },

    verifiedPayload: function(keys, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var jwk = null;
        var keyData = null;
        if (keys instanceof JSData){
            keyData = keys;
        }else{
            for (var i = 0, l = keys.length; i < l && keyData === null; ++i){
                jwk = keys[i];
                if (this._header.kid == jwk.kid){
                    break;
                }
            }
        }
        switch (this._header.alg){
            case "HS256":
                this._verifyHMAC(SECHMAC.Algorithm.sha256, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "HS384":
                this._verifyHMAC(SECHMAC.Algorithm.sha384, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "HS512":
                this._verifyHMAC(SECHMAC.Algorithm.sha512, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "RS256":
                this._verifyRSA(SECVerify.Algorithm.rsaSHA256, jwk, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "RS384":
                this._verifyRSA(SECVerify.Algorithm.rsaSHA384, jwk, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "RS512":
                this._verifyRSA(SECVerify.Algorithm.rsaSHA512, jwk, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            default:
                completion.call(target, null);
                break;
        }
        return completion.promise;
    },

    _verifyHMAC: function(algorithm, keyData, chunks, signature, payload, completion, target){
        if (keyData === null){
            completion.call(target, null);
            return;
        }
        var hash = SECHMAC.initWithAlgorithm(algorithm);
        hash.createKeyWithData(keyData, function(key){
            if (key === null){
                completion.call(target, null);
                return;
            }
            hash.key = key;
            for (var i = 0, l = chunks.length; i < l; ++i){
                hash.update(chunks[i]);
            }
            hash.sign(function(computed){
                if (computed === null || !computed.isEqual(signature)){
                    completion.call(target, null);
                    return;
                }
                completion.call(target, payload);
            });
        });
    },

    _verifyRSA: function(algorithm, jwk, chunks, signature, payload, completion, target){
        var verify = SECVerify.initWithAlgorithm(algorithm);
        var key = this.createVerifyKey(jwk, function(key){
            if (key === null){
                completion.call(target, null);
                return;
            }
            for (var i = 0, l = chunks.length; i < l; ++i){
                verify.update(chunks[i]);
            }
            verify.verify(key, signature, function(verified){
                if (!verified){
                    completion.call(target, null);
                    return;
                }
                completion.call(target, payload);
            });
        }, this);
    },

    createVerifyKey: function(jwk, completion, target){
        // implemented by platform
    }

});

var dot = JSData.initWithArray([0x2E]);


})();