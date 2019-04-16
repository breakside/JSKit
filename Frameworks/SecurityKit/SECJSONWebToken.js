// #import Foundation
// #import "SECHash.js"
/* global JSClass, JSObject, JSReadOnlyProperty, SECHash, SECVerify, JSData */
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
        var key;
        var keyData = null;
        if (keys instanceof JSData){
            keyData = keys;
        }else{
            for (var i = 0, l = keys.length; i < l && keyData === null; ++i){
                key = keys[i];
                if (this._header.kid == key.kid){
                    keyData = key;
                }
            }
        }
        if (keyData === null){
            completion.call(target, null);
            return;
        }
        switch (this._header.alg){
            case "HS256":
                this._verifyHash(SECHash.Algorithm.hmacSHA256, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "HS384":
                this._verifyHash(SECHash.Algorithm.hmacSHA384, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "HS512":
                this._verifyHash(SECHash.Algorithm.hmacSHA512, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "RS256":
                this._verifyRSA(SECHash.Algorithm.rsaSHA256, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "RS384":
                this._verifyRSA(SECHash.Algorithm.rsaSHA384, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            case "RS512":
                this._verifyRSA(SECHash.Algorithm.rsaSHA512, keyData, this._signedChunks, this.signature, this._unverifiedPayload, completion, target);
                break;
            default:
                completion.call(target, null);
                break;
        }
        return completion.promise;
    },

    _verifyHash: function(algorithm, keyData, chunks, signature, payload, completion, target){
        var hash = SECHash.initWithAlgorithm(algorithm, keyData);
        for (var i = 0, l = chunks.length; i < l; ++i){
            hash.update(chunks[i]);
        }
        hash.digest(function(computed){
            if (computed === null || !computed.isEqual(signature)){
                completion.call(target, null);
                return;
            }
            completion.call(target, payload);
        });
    },

    _verifyRSA: function(algorithm, jwk, chunks, signature, payload, completion, target){
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
                if (!verified){
                    completion.call(target, null);
                    return;
                }
                completion.call(target, payload);
            });
        }, this);
    }

});

var dot = JSData.initWithArray([0x2E]);


})();