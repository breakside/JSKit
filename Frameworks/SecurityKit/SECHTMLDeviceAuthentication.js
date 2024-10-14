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
// #import "SECDeviceAuthentication.js"
// #import "SECCipher.js"
// #import "SECSign.js"
// #import "SECCBOR.js"
// #import "SECHash.js"
// #import "SECCOSE.js"
// jshint browser: true
/* global AuthenticatorAttestationResponse */
'use strict';

(function(){

var logger = JSLog("securitykit", "htmldevice");

JSClass("SECHTMLDeviceAuthentication", JSObject, {

    initWithCredentialStore: function(credentialStore){
        SECHTMLDeviceAuthentication.$super.init.call(this);
        if (credentialStore !== undefined){
            this.credentialStore = credentialStore;
        }
    },

    credentialStore: null,

    hasPlatformAuthenticator: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var promise;
        if (!window.PublicKeyCredential){
            promise = Promise.resolve(false);
        }else{
            promise = window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        }
        promise.then(function(available){
            completion.call(target, available);
        }, function(error){
            logger.warn("check for platform authenticator failed: %{error}", error);
            completion.call(target, false);
        });
        return completion.promise;
    },

    createPublicKey: function(registration, completion, target){
        // Registration
        // domain
        // providerName
        // userId
        // accountName
        // challengeData
        // supportedAlgorithms
        // platform
        // conditional
        if (!completion){
            completion = Promise.completion();
        }
        if (this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
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
                // requiring a resident key is necessary for Android to
                // actually save a passkey.  Apple OSes will save a passkey
                // regardless of resident key settings
                requireResidentKey: registration.platform ? true : false,
                residentKey: registration.platform ? "required" : "discouraged",
                userVerification: registration.platform && !registration.conditional ? "required" : "discouraged",
                authenticatorAttachment: registration.platform ? "platform" : "cross-platform"
            },
            attestation: "none",
            timeout: 60000,
            extensions: {
                credProps: true
            }
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
        var handleCredential = function(credential){
            if (!credential || credential.type != "public-key"){
                completion.call(target, null);
                return;
            }
            var jwk = credential.response.getPublicJWK();
            var webauthn = credential.toJSON();
            var result = {
                name: credential.jskitName,
                jwk: jwk,
                challenge: registration.challengeData,
                webauthn: webauthn
            };
            completion.call(target, result);
        };
        if (registration.conditional){
            if (!window.PublicKeyCredential || !window.PublicKeyCredential.getClientCapabilities){
                JSRunLoop.main.schedule(completion, target, null);
                return completion.promise;
            }
            window.PublicKeyCredential.getClientCapabilities().then(function(capabilities){
                if (!capabilities || !capabilities.conditionalCreate){
                    completion.call(target, null);
                    return;
                }
                credentials.create({publicKey: info, mediation: "conditional"}).then(handleCredential,function(error){
                    completion.call(target, null);
                });
            }, function(e){
                logger.error("failed to getClientCapabilities(): %{error}", e);
                completion.call(target, null);
            });
        }else{
            credentials.create({publicKey: info}).then(handleCredential, function(error){
                completion.call(target, null);
            });
        }
        return completion.promise;
    },

    authenticate: function(request, completion, target){
        // Request
        // challengeData
        // domain
        // allowedKeyIDs
        // platform
        if (!completion){
            completion = Promise.completion();
        }
        if (this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        var info = {
            challenge: request.challengeData,
            userVerification: request.platform ? "required" : "discouraged",
            timeout: 60000,
            allowCredentials: [],
        };
        if (request.domain){
            info.rpId = request.domain;
        }
        // naming change after publishing docs
        if (request.allowedKeyIds && !request.allowedKeyIDs){
            request.allowedKeyIDs = request.allowedKeyIds;
        }
        if (request.allowedKeyIDs){
            var allowedCredential;
            for (var i = 0, l = request.allowedKeyIDs.length; i < l; ++i){
                try{
                    allowedCredential = {
                        type: "public-key",
                        id: request.allowedKeyIDs[i].dataByDecodingBase64URL()
                    };
                    if (request.platform){
                        allowedCredential.transports = ["internal", "hybrid"];
                    }
                    info.allowCredentials.push(allowedCredential);
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
            var webauthn = credential.toJSON();
            var result = {
                kid: credential.id,
                webauthn: webauthn,
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
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA256] = SECCOSE.Algorithm.rsaSHA256;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA384] = SECCOSE.Algorithm.rsaSHA384;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.rsaSHA512] = SECCOSE.Algorithm.rsaSHA512;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA256] = SECCOSE.Algorithm.ellipticCurveSHA256;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA384] = SECCOSE.Algorithm.ellipticCurveSHA384;
coseAlgorithmsBySignAlgorithm[SECSign.Algorithm.ellipticCurveSHA512] = SECCOSE.Algorithm.ellipticCurveSHA512;

if (window.PublicKeyCredential){

    if (!window.PublicKeyCredential.prototype.toJSON){
        window.PublicKeyCredential.prototype.toJSON = function PublicKeyCredential_toJSON(){
            var dictionary = {};
            dictionary.id = this.id;
            dictionary.rawId = JSData.initWithBuffer(this.rawId).base64URLStringRepresentation();
            dictionary.authenticatorAttachment = this.authenticatorAttachment || "";
            dictionary.type = this.type || "public-key";
            dictionary.clientExtensionResults = this.getClientExtensionResults();
            dictionary.response = this.response.toJSON ? this.response.toJSON() : {};
            return dictionary;
        };
    }

    if (!window.PublicKeyCredential.prototype.getClientExtensionResults){
        window.PublicKeyCredential.prototype.getClientExtensionResults = function PublicKeyCredential_getClientExtensionResults(){
            if (this._clientExtensionResults === undefined){
                var authData = JSData.initWithBuffer(this.getAuthenticatorData());
                var idLength = (authData[53] << 8) | authData[54];
                var offset = 55 + idLength;
                var cbor = SECCBORParser.initWithData(authData.subdataInRange(JSRange(offset, authData.length - offset)));
                var coseKey = cbor.readNext(); // ingored, only reading to arrive at the extensions start location
                this._clientExtensionResults = cbor.readNext() || {};
            }
            return this._clientExtensionResults;
        };
    }

    Object.defineProperties(window.PublicKeyCredential.prototype, {
        jskitName: {
            enumerable: false,
            configurable: false,
            get: function PublicKeyCredential_getJSKitName(){
                var extensions = this.getClientExtensionResults();
                if (extensions.credProps){
                    if (extensions.credProps.authenticatorDisplayName){
                        return extensions.credProps.authenticatorDisplayName;
                    }
                }
                var ua = JSHTMLUserAgent.initWithString(navigator.userAgent);
                var apple = ua.containsComment("Macintosh") || ua.containsComment("iPhone") || ua.containsComment("iPad");
                var windows = ua.containsComment("Win64") || ua.containsComment("Windows NT 10.0");
                var linux = ua.containsComment("Linux");
                var android = false;
                if (linux){
                    var i, l;
                    for (i = 0, l = ua.comments.length; i < l; ++i){
                        if (ua.comments[i].startsWith("Android")){
                            android = true;
                            break;
                        }
                    }
                }
                if (apple){
                    return "iCloud Keychain";
                }
                if (android){
                    return "Google Password Manager";
                }
                if (windows){
                    return "Windows Hello";
                }
                return "";
            }
        }
    });

}

if (window.AuthenticatorAttestationResponse){

    if (!window.AuthenticatorAttestationResponse.prototype.getAuthenticatorData){
        window.AuthenticatorAttestationResponse.prototype.getAuthenticatorData = function AuthenticatorAttestationResponse_getAuthenticatorData(){
            if (this._jskitAuthDataBuffer === undefined){
                var attestationCBOR = JSData.initWithBuffer(this.attestationObject);
                var attestationParser = SECCBORParser.initWithData(attestationCBOR);
                var attestation = attestationParser.parse();
                var data = attestation.authData;
                this._authDataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.length);
            }
            return this._authDataBuffer;
        };
    }

    if (!window.AuthenticatorAttestationResponse.prototype.jskitGetCOSE){
        window.AuthenticatorAttestationResponse.prototype.jskitGetCOSE = function jskitGuthenticatorAttestationResponse_getCOSEDictionary(){
            if (this._jskitCOSE === undefined){
                var authData = JSData.initWithBuffer(this.getAuthenticatorData());
                var idLength = (authData[53] << 8) | authData[54];
                var offset = 55 + idLength;
                this._jskitCOSE = SECCOSE.initWithData(authData.subdataInRange(JSRange(offset, authData.length - offset)));
            }
            return this._jskitCOSE;
        };
    }

    if (!window.AuthenticatorAttestationResponse.prototype.getPublicKeyAlgorithm){
        window.AuthenticatorAttestationResponse.prototype.getPublicKeyAlgorithm = function AuthenticatorAttestationResponse_getPublicKeyAlgorithm(){
            var cose = this.jskitGetCOSE();
            return cose[SECCOSE.Attribute.alg];
        };
    }

    if (!window.AuthenticatorAttestationResponse.prototype.getPublicKey){
        window.AuthenticatorAttestationResponse.prototype.getPublicKey = function AuthenticatorAttestationResponse_getPublicKey(){
            var cose = this.jskitGetCOSE();
            var derData = cose.derRepresentation();
            return derData.buffer.slice(derData.byteOffset, derData.byteOffset + derData.length);
        };
    }

    if (!window.AuthenticatorAttestationResponse.prototype.getPublicJWK){
        window.AuthenticatorAttestationResponse.prototype.getPublicJWK = function AuthenticatorAttestationResponse_getPublicJWK(){
            var cose = this.jskitGetCOSE();
            var jwk = cose.jwkRepresentation();
            var authData = JSData.initWithBuffer(this.getAuthenticatorData());
            var idLength = (authData[53] << 8) | authData[54];
            var idData = authData.subdataInRange(JSRange(55, idLength));
            jwk.kid = idData.base64URLStringRepresentation();
            jwk.key_ops = ["verify"];
            return jwk;
        };
    }

    if (!window.AuthenticatorAttestationResponse.prototype.toJSON){
        window.AuthenticatorAttestationResponse.prototype.toJSON = function AuthenticatorAttestationResponse_toJSON(){
            var attestationObjectData = JSData.initWithBuffer(this.attestationObject);
            var authData = JSData.initWithBuffer(this.getAuthenticatorData());
            var dictionary = {};
            dictionary.clientDataJSON = JSData.initWithBuffer(this.clientDataJSON).base64URLStringRepresentation();
            dictionary.authenticatorData = authData.base64URLStringRepresentation();
            dictionary.transports = this.getTransports ? this.getTransports() : [];
            dictionary.publicKey = JSData.initWithBuffer(this.getPublicKey()).base64URLStringRepresentation();
            dictionary.publicKeyAlgorithm = this.getPublicKeyAlgorithm();
            dictionary.attestationObject = attestationObjectData.base64URLStringRepresentation();
            return dictionary;
        };
    }

}

if (window.AuthenticatorAssertionResponse){

    if (!window.AuthenticatorAssertionResponse.prototype.toJSON){
        window.AuthenticatorAssertionResponse.prototype.toJSON = function AuthenticatorAssertionResponse_toJSON(){
            var dictionary = {};
            dictionary.clientDataJSON = JSData.initWithBuffer(this.clientDataJSON).base64URLStringRepresentation();
            dictionary.authenticatorData = JSData.initWithBuffer(this.authenticatorData).base64URLStringRepresentation();
            dictionary.signature = JSData.initWithBuffer(this.signature).base64URLStringRepresentation();
            dictionary.userHandle = this.userHandle ? JSData.initWithBuffer(this.userHandle).base64URLStringRepresentation() : null;
            return dictionary;
        };
    }

}

})();