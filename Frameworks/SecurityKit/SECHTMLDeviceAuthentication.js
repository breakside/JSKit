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
// #import "SECDER.js"
// #import "SECCBOR.js"
// #import "SECHash.js"
// #import "SECJSONWebToken.js"
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
            registration.providerName = JSBundle.mainBundle.info.UIApplicationTitle || JSBundle.mainBundle.info.JSExecutableName || JSBundle.mainBundle.info.JSBundleIndentifier;
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
                residentKey: "required",
                userVerification: "required"
            },
            attestation: "direct",
            timeout: 10000
        };
        if (registration.supportedAlgorithms){
            for (var i = 0, l = registration.supportedAlgorithms.length; i < l; ++i){
                info.pubKeyCredParams.push({type: "public-key", alg: coseAlgorithmsBySignAlgorithm[registration.supportedAlgorithms[i]]});
            }
        }else{
            info.pubKeyCredParams = [
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA512]},
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA384]},
                {type: "public-key", alg: coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA256]}
            ];
        }
        this.credentialStore.create({publicKey: info}).then(function(credential){
            if (!credential || credential.type != "public-key"){
                completion.call(target, null);
                return;
            }
            var jwk = jwkForCOSEAlgorithm(credential.response.getPublicKeyAlgorithm());
            if (jwk !== null){
                jwk.kid = credential.id;
                jwk.key_ops = ["verify"];
                if (jwk.kty == SECJSONWebToken.KeyType.rsa){
                    var der = JSData.initWithBuffer(credential.response.getPublicKey());
                    var parser = SECDERParser.initWithData(der);
                    var sequence = parser.parse();
                    // sequence 0 is algorithm, which we already know
                    jwk.n = sequence[1][0].base64URLStringRepresentation();
                    jwk.e = sequence[1][1].base64URLStringRepresentation();
                }
            }
            var clientData = JSData.initWithBuffer(credential.response.clientDataJSON);
            var authData = JSData.initWithBuffer(credential.response.authenticatorData);
            var attestation = null;
            var signature = null;
            var chain = [];
            try{
                attestation = SECCBOR.parse(credential.response.attestationObject);
                delete attestation.authData;
            }catch (e){
                // oh well
            }
            var result = {
                jwk: jwk,
                webauthn: {
                    attestation: attestation,
                    authData: authData,
                    clientData: clientData
                }
            };
            completion.call(target, result);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

    signChallenge: function(challengeData, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        var request = {
            challenge: challengeData,
            userVerification: "required"
        };
        this.credentialStore.get({publicKey: request}).then(function(credential){
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
                    authData: authData,
                    clientData: clientData
                },
                challenge: challengeData,
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

var jwkForCOSEAlgorithm = function(coseAlgorithm){
    switch (coseAlgorithm){
        case -257:
            return {kty: SECJSONWebToken.KeyType.rsa, alg: SECJSONWebToken.Algorithm.rsaSHA256};
        case -258:
            return {kty: SECJSONWebToken.KeyType.rsa, alg: SECJSONWebToken.Algorithm.rsaSHA384};
        case -259:
            return {kty: SECJSONWebToken.KeyType.rsa, alg: SECJSONWebToken.Algorithm.rsaSHA512};
        default:
            return null;
    }
};

})();