// Copyright 2021 Breakside Inc.
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
// #import SecurityKit
// #import "NKUserNotification.js"
/* global NKWebPushService */
"use strict";

(function(){

var logger = JSLog("notify", "webpush");

JSClass("NKWebPushService", JSObject, {

    urlSession: null,
    keystore: null,
    contactURL: null, 

    initWithKeystore: function(keystore, urlSession){
        this.keystore = keystore;
        this.urlSession = urlSession || JSURLSession.shared;
    },

    pushNotification: function(notification, registration, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        this.createPushRequest(notification, registration, function(request, error){
            if (error !== null){
                completion.call(target, error);
                return;
            }
            var task = this.urlSession.dataTaskWithRequest(request, function(error){
                if (error !== null){
                    logger.error("Push request failed: %{error}", error);
                    completion.call(target, error);
                    return;
                }
                if (task.response.statusCode !== JSURLResponse.StatusCode.created){
                    logger.error("Push request failed with %d", task.response.statusCode);
                    completion.call(target, JSURLResponseError(task.response));
                    return;
                }
                completion.call(target, null);
            });
            task.resume();
        }, this);
        return completion.promise;
    },

    createPushRequest: function(notification, registration, completion, target){
        var url = JSURL.initWithString(registration.subscription.endpoint);
        var request = JSURLRequest.initWithURL(url);
        request.method = JSURLRequest.Method.post;
        if (notification.identifier !== null){
            var hash = JSSHA1Hash(notification.identifier.utf8());
            request.headerMap.add("Topic", hash.base64URLStringRepresentation());
        }
        request.headerMap.add("TTL", notification.timeToLive);
        request.headerMap.add("Urgency", this.urgencyForNotificationPriority(notification.priority));
        this.authorizePushRequest(request, notification, registration, function(error){
            if (error !== null){
                completion.call(target, request, error);
                return;
            }
            this.encodePushRequest(request, notification, registration, function(error){
                completion.call(target, request, error);
            }, this);
        }, this);
    },

    authorizePushRequest: function(request, notification, registration, completion, target){
        // https://www.rfc-editor.org/rfc/rfc8292
        var publicJWK = registration.options.applicationServerJWK;
        var privateJWK = null;
        if (publicJWK){
            privateJWK = this.keystore.jwkForIdentifier(publicJWK.kid);
            if (privateJWK === null){
                completion.call(target, new Error("No key matching kid: %s".sprintf(publicJWK.kid)));
                return;
            }
        }
        if (privateJWK){
            var url = JSURL.initWithString(registration.subscription.endpoint);
            var claims = {
                aud: url.origin,
                exp: Math.floor(JSDate.initWithTimeIntervalSinceNow(JSTimeInterval.hours(24)).timeIntervalSince1970),
            };
            if (this.contactURL !== null){
                claims.sub = this.contactURL.encodedString;
            }
            var token = SECJSONWebToken.initWithPayload(claims);
            token.sign(privateJWK, function(tokenString){
                var encodedPublicKey = JSData.initWithChunks([
                    JSData.initWithArray([0x04]),
                    privateJWK.x.dataByDecodingBase64URL(),
                    privateJWK.y.dataByDecodingBase64URL()
                ]).base64URLStringRepresentation();
                request.headerMap.add("Authorization", "vapid t=%s, k=%s".sprintf(tokenString, encodedPublicKey));
                completion.call(target, null);
            }, function(error){
                logger.error("Failed to sign push request: %{error}", error);
                completion.call(target, error);
            });
        }else{
            completion.call(target, null);
        }
    },

    encodePushRequest: function(request, notification, registration, completion, target){
        // https://www.rfc-editor.org/rfc/rfc8188
        // https://www.rfc-editor.org/rfc/rfc8291
        var encodedClientPublicKey = registration.subscription.keys.p256dh;
        var encodedClientAuthSecret = registration.subscription.keys.auth;
        var plaintext = JSON.stringify({
            type: "notification",
            title: notification.title,
            body: notification.body
        }).utf8();
        if (encodedClientPublicKey && encodedClientAuthSecret){
            if (plaintext.length > NKWebPushService.maximumRecordSize - 17){
                completion.call(target, new Error("Message too long for web push"));
                return;
            }
            var clientPublicKeyData = encodedClientPublicKey.dataByDecodingBase64URL();
            var clientAuthSecretData = encodedClientAuthSecret.dataByDecodingBase64URL();
            var salt = SECCipher.getRandomData(16);
            var caughtError = null;
            // TODO: abstract ECDH calls so they're not node-specific
            var crypto = require("crypto");
            var ecdh = crypto.createECDH('prime256v1');
            ecdh.generateKeys();
            var serverPublicKeyData = JSData.initWithNodeBuffer(ecdh.getPublicKey());
            var sharedKeyData = JSData.initWithNodeBuffer(ecdh.computeSecret(clientPublicKeyData));
            SECHMAC.digest(SECHMAC.Algorithm.sha256, clientAuthSecretData, sharedKeyData).then(function(prk){
                return SECHMAC.digest(SECHMAC.Algorithm.sha256, prk, JSData.initWithChunks([
                    "WebPush: info\x00".utf8(),
                    clientPublicKeyData,
                    serverPublicKeyData,
                    JSData.initWithArray([0x01])
                ]));
            }).then(function(ikm){
                return SECHMAC.digest(SECHMAC.Algorithm.sha256, salt, ikm);
            }).then(function(prk){
                return Promise.all([
                    SECHMAC.digest(SECHMAC.Algorithm.sha256, prk, "Content-Encoding: aes128gcm\x00\x01".utf8()),
                    SECHMAC.digest(SECHMAC.Algorithm.sha256, prk, "Content-Encoding: nonce\x00\x01".utf8())
                ]);
            }).then(function(keyAndNonce){
                var keyData = keyAndNonce[0].subdataInRange(JSRange(0, 16));
                var nonceData = keyAndNonce[1].subdataInRange(JSRange(0, 12));
                var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.aesGCM, {keyBitLength: 128, iv: nonceData});
                return cipher.createKeyWithData(keyData).then(function(key){
                    if (key === null){
                        return;
                    }
                    return cipher.encrypt(JSData.initWithChunks([plaintext, JSData.initWithArray([0x02])]), key);
                });
            }).then(function(encrypted){
                var ciphertext = encrypted.subdataInRange(JSRange(12, encrypted.length - 12));
                var header = JSData.initWithLength(5);
                header.dataView().setUint32(0, NKWebPushService.maximumRecordSize);
                header[4] = serverPublicKeyData.length;
                request.headerMap.add("Content-Encoding", "aes128gcm");
                request.data = JSData.initWithChunks([
                    salt,
                    header,
                    serverPublicKeyData,
                    ciphertext
                ]);
            }).catch(function(error){
                caughtError = error;
            }).finally(function(){
                completion.call(target, caughtError);
            });
        }else{
            if (plaintext.length > NKWebPushService.maximumRecordSize - 17){
                completion.call(target, new Error("Message too long for web push"));
                return;
            }
            request.data = plaintext;
            completion.call(target, null);
        }
    },

    urgencyForNotificationPriority: function(priority){
        switch (priority){
            case NKUserNotification.Priority.veryLow: return "very-low";
            case NKUserNotification.Priority.low: return "low";
            case NKUserNotification.Priority.high: return "high";
            default: return "normal";
        }
    }

});

NKWebPushService.maximumRecordSize = 4096;

})();