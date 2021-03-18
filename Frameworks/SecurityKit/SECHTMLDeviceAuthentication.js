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

// #import "SECDeviceAuthentication.js"
// #import "SECCipher.js"
// #import "SECSign.js"
// #import "SECCBOR.js"
// #import "SECHash.js"
// #import "SECJSONWebAlgorithms.js"
// jshint browser: true
/* global AuthenticatorAttestationResponse */
'use strict';

(function(){

JSClass("SECHTMLDeviceAuthentication", JSObject, {

    initWithCredentialStore: function(credentialStore){
        SECHTMLDeviceAuthentication.$super.init.call(this);
        if (credentialStore !== undefined){
            this.credentialStore = credentialStore;
        }
    },

    credentialStore: null,

    createPublicKey: function(registration, completion, target){
        // Registration
        // domain
        // providerName
        // userId
        // accountName
        // challengeData
        // supportedAlgorithms
        if (!completion){
            completion = Promise.completion();
        }
        if (this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        registration = JSCopy(registration);
        if (!registration.providerName){
            registration.providerName = JSBundle.mainBundle.localizedStringForInfoKey("UIApplicationTitle") || JSBundle.mainBundle.info.JSExecutableName || JSBundle.mainBundle.info.JSBundleIndentifier;
        }
        if (!registration.userId){
            registration.userId = UUID();
        }
        if (!registration.accountName){
            registration.accountName = "%s User".sprintf(registration.providerName);
        }
        if (!registration.challengeData){
            registration.challengeData = SECCipher.getRandomData(32);
        }
        var info = {
            rp: {
                name: registration.providerName
            },
            user: {
                id: registration.userId.utf8(),
                name: registration.accountName,
                displayName: registration.accountName
            },
            challenge: registration.challengeData,
            pubKeyCredParams: [],
            authenticatorSelection: {
                // Browser support for resident keys is spotty:
                // - Chrome works, requiring the user to set a PIN, but can't share with others
                // - Safari works, no PIN required, but can't share with others
                // - Safari will get PIN support in Safari 14
                // - Firefox doesn't work on macOS, but supposedly works on windows with a PIN
                // Without a resident key, we need something like a username that the user can
                // provide so we can lookup allowed key IDs on a server and send them back to
                // the client before authenticating
                requireResidentKey: false,
                residentKey: "discouraged",
                userVerification: "discouraged",
                authenticatorAttachment: "cross-platform"
            },
            attestation: "none",
            timeout: 10000
        };
        if (registration.domain !== undefined){
            info.rp.id = registration.domain;
        }
        if (registration.supportedAlgorithms){
            for (var i = 0, l = registration.supportedAlgorithms.length; i < l; ++i){
                info.pubKeyCredParams.push({type: "public-key", alg: coseAlgorithmsBySignAlgorithm[registration.supportedAlgorithms[i]]});
            }
        }else{
            info.pubKeyCredParams = [
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA512]},
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA384]},
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA256]},
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA512]},
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA384]},
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA256]},
            ];
        }
        var credentials = this.credentialStore;
        this.credentialStore.create({publicKey: info}).then(function(credential){
            if (!credential || credential.type != "public-key"){
                completion.call(target, null);
                return;
            }
            var clientData = JSData.initWithBuffer(credential.response.clientDataJSON);
            var attestationCBOR = JSData.initWithBuffer(credential.response.attestationObject);
            var attestationParser = SECCBORParser.initWithData(attestationCBOR);
            attestationParser.encodeDataAsBase64URL = true;
            var attestation = attestationParser.parse();
            var authData = attestation.authData.dataByDecodingBase64URL();
            var length = (authData[53] << 8) | authData[54];
            var keyParser = SECCBORParser.initWithData(authData);
            keyParser.offset = 55 + length;
            var coseKey = keyParser.readNext();
            var jwk = jwkForCoseKey(coseKey, credential.id);
            var result = {
                jwk: jwk,
                webauthn: {
                    attestation: attestation,
                    clientData: clientData.base64URLStringRepresentation()
                },
                challenge: registration.challengeData
            };
            completion.call(target, result);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

    authenticate: function(request, completion, target){
        // Request
        // challengeData
        // domain
        // allowedKeyIDs
        if (!completion){
            completion = Promise.completion();
        }
        if (this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        var info = {
            challenge: request.challengeData,
            userVerification: "discouraged",
            timeout: 10000,
            allowCredentials: []
        };
        if (request.domain){
            info.rpId = request.domain;
        }
        // naming change after publishing docs
        if (request.allowedKeyIds && !request.allowedKeyIDs){
            request.allowedKeyIDs = request.allowedKeyIds;
        }
        if (request.allowedKeyIDs){
            for (var i = 0, l = request.allowedKeyIDs.length; i < l; ++i){
                try{
                    info.allowCredentials.push({
                        type: "public-key",
                        id: request.allowedKeyIDs[i].dataByDecodingBase64URL()
                    });
                }catch (e){
                    // if the key isn't base64-url encoded, then it isn't
                    // a key made by the Credentials API
                }
            }
        }
        this.credentialStore.get({publicKey: info}).then(function(credential){
            if (!credential || credential.type != "public-key"){
                completion.call(target, null);
                return;
            }
            var clientData = JSData.initWithBuffer(credential.response.clientDataJSON);
            var authData = JSData.initWithBuffer(credential.response.authenticatorData);
            var hash = SECHash.initWithAlgorithm(SECHash.Algorithm.sha256);
            var result = {
                kid: credential.id,
                webauthn: {
                    authData: authData.base64URLStringRepresentation(),
                    clientData: clientData.base64URLStringRepresentation()
                },
                challenge: request.challengeData,
                signature: JSData.initWithBuffer(credential.response.signature)
            };
            completion.call(target, result);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

});

Object.defineProperties(SECDeviceAuthentication, {
    shared: {
        configurable: true,
        get: function SECHTMLDeviceAuthentication_getShared(){
            var device = SECHTMLDeviceAuthentication.initWithCredentialStore(navigator.credentials);
            Object.defineProperty(SECDeviceAuthentication, "shared", {value: device});
            return device;
        }
    }
});

var coseAlgorithmsBySignAlgorithm = {};
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA256] = -257;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA384] = -258;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA512] = -259;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA256] = -7;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA384] = -35;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA512] = -36;

var remap = function(dictionary, keyMap){
    var copy = {};
    for (var k in dictionary){
        copy[keyMap[k] || k] = dictionary[k];
    }
    return copy;
};

var jwkForCoseKey = function(coseKey, kid){
    coseKey = remap(coseKey, {
        "1": "kty",
        "2": "kid",
        "3": "alg",
        "-1": "crv",
        "-2": "x",
        "-3": "y",
        "-4": "d"
    });
    var jwk = {
        kid: kid,
        key_ops: ["verify"]
    };
    if (coseKey.kty == 2){
        jwk.kty = SECJSONWebAlgorithms.KeyType.ellipticCurve;
        switch (coseKey.alg){
            case -7:
                jwk.alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA256;
                break;
            case -35:
                jwk.alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA384;
                break;
            case -36:
                jwk.alg = SECJSONWebAlgorithms.Algorithm.ellipticCurveSHA512;
                break;
            default:
                return null;
        }
        switch (coseKey.crv){
            case 1:
                jwk.crv = "P-256";
                break;
            case 2:
                jwk.crv = "P-384";
                break;
            case 3:
                jwk.crv = "P-512";
                break;
            default:
                return null;
        }
        jwk.x = coseKey.x.base64URLStringRepresentation();
        jwk.y = coseKey.y.base64URLStringRepresentation();
        return jwk;
    }
    if (coseKey.kty == 0){ // RSA
        jwk.kty = SECJSONWebAlgorithms.KeyType.rsa;
        switch (coseKey.alg){
            case -257:
                jwk.alg = SECJSONWebAlgorithms.Algorithm.rsaSHA256;
                break;
            case -258:
                jwk.alg = SECJSONWebAlgorithms.Algorithm.rsaSHA384;
                break;
            case -259:
                jwk.alg = SECJSONWebAlgorithms.Algorithm.rsaSHA512;
                break;
            default:
                return null;
        }
        // TODO: jwk.n, jwk.e
        return jwk;
    }
    return null;
};

})();