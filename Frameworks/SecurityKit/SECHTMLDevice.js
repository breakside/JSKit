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

// #import "SECDevice.js"
// #import "SECDER.js"
// #import "SECHash.js"
// #import "SECJSONWebToken.js"
// jshint browser: true
/* global AuthenticatorAttestationResponse */
'use strict';

(function(){

JSClass("SECHTMLDevice", JSObject, {

    initWithCredentialStore: function(credentialStore, origin){
        SECHTMLDevice.$super.init.call(this);
        if (credentialStore !== undefined){
            this.credentialStore = credentialStore;
        }
        this.origin = origin;
    },

    credentialStore: null,
    origin: null,

    passwordCredential: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        this.credentialStore.get({password: true}).then(function(credential){
            if (!credential || credential.type != "password"){
                completion.call(target, null);
                return;
            }
            completion.call(target, {username: credential.id, password: credential.password});
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

    rememberPasswordCredential: function(login, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, false);
            return;
        }
        var info = {
            id: login.username,
            password: login.password,
            origin: this.origin
        };
        var credentialStore = this.credentialStore;
        credentialStore.create({password: info}).then(function(credential){
            if (!credential || credential.type  != "password"){
                completion.call(target, false);
                return;
            }
            credentialStore.store(credential).then(function(){
                completion.call(target, true);
            }, function(error){
                completion.call(target, false);
            });
        }, function(error){
            completion.call(target, false);
        });
        return completion.promise;
    },

    createPublicKeyForAuthentication: function(registration, completion, target){
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
            attestation: "none"
        };
        if (registration.supportedAlgorithms){
            for (var i = 0, l = registration.supportedAlgorithms.length; i < l; ++i){
                info.pubKeyCredParams.push({type: "public-key", alg: htmlPublicKeyAlgorithm[registration.supportedAlgorithms[i]]});
            }
        }else{
            info.pubKeyCredParams = [
                {type: "public-key", alg: htmlPublicKeyAlgorithm[SECDevice.Algorithm.rsa512]},
                {type: "public-key", alg: htmlPublicKeyAlgorithm[SECDevice.Algorithm.rsa384]},
                {type: "public-key", alg: htmlPublicKeyAlgorithm[SECDevice.Algorithm.rsa256]}
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
            completion.call(target, jwk);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;

    },

    authenticateBySigningChallengeData: function(challengeData, completion, target){
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
                    appData: authData.base64URLStringRepresentation(),
                    clientData: clientData.base64URLStringRepresentation()
                },
                signature: JSData.initWithBuffer(credential.response.signature).base64URLStringRepresentation()
            };
            completion.call(target, result);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

});

Object.defineProperties(SECDevice, {
    shared: {
        configurable: true,
        get: function SECHTMLDevice_getShared(){
            var device = SECHTMLDevice.initWithCredentialStore(navigator.credentials, location.origin);
            Object.defineProperty(SECDevice, "shared", {value: device});
            return device;
        }
    }
});

var htmlPublicKeyAlgorithm = {};
htmlPublicKeyAlgorithm[SECDevice.PublicKeyAlgorithm.rsa256] = -257;
htmlPublicKeyAlgorithm[SECDevice.PublicKeyAlgorithm.rsa384] = -258;
htmlPublicKeyAlgorithm[SECDevice.PublicKeyAlgorithm.rsa512] = -259;

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