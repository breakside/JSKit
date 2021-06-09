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
// jshint browser: true
"use strict";

(function(){

var logger = JSLog("notify", "webpush");

JSObject("NKWebPushService", JSObject, {

    url: null,
    urlSession: null,
    signingJWK: null,
    contactURL: null, 

    initWithURL: function(url, urlSession){
        this.url = url;
        this.urlSession = urlSession || JSURLSession.shared;
    },

    pushNotification: function(notification, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.createPushRequest(function(request){
            if (request === null){
                completion.call(target, false);
                return;
            }
            var task = this.urlSession.dataTaskWithRequest(request, function(error){
                if (error !== null){
                    logger.error("Push request failed: %{error}", error);
                    completion.call(target, false);
                    return;
                }
                if (task.response.statusCode !== JSURLResponse.StatusCode.created){
                    logger.error("Push request failed with %d", task.response.statusCode);
                    completion.call(target, false);
                    return;
                }
                completion.call(target, true);
            });
        }, this);
        return completion.promise;
    },

    createPushRequest: function(completion, target){
        var request = JSURLRequest.initWithURL(this.url);
        request.method = JSURLRequest.Method.post;
        request.data = null; // TODO
        this.authorizePushRequest(request, function(authorized){
            if (authorized){
                completion.call(target, request);
            }else{
                completion.call(target, null);
            }
        }, this);
    },

    authorizePushRequest: function(request, completion, target){
        if (this.signingJWK === null){
            completion.call(target, true);
        }else{
            var identificationPayload = {
                aud: this.url.origin,
                exp: JSDate.initWithTimeIntervalSinceNow(JSTimeInterval.hours(24)).timeIntervalSince1970,
            };
            if (this.contactURL !== null){
                identificationPayload.sub = this.contactURL.encodedString;
            }
            var identificationToken = SECJSONWebToken.initWithPayload(identificationPayload);
            identificationToken.sign(this.signingJWK, function(identificationTokenString){
                var keyString = JSData.initWithChunks([
                    JSData.initWithArray([0x04]),
                    this.signingJWK.x.dataByDecodingBase64URL(),
                    this.signingJWK.y.dataByDecodingBase64URL()
                ]).base64URLStringRepresentation();
                request.headerMap.add("Authorization", "vapid t=%s,k=%s".sprintf(identificationTokenString, keyString));
                completion.call(target, true);
            }, function(error){
                logger.error("Failed to sign push request: %{error}", error);
                completion.call(target, false);
            });
        }
    }

});

})();