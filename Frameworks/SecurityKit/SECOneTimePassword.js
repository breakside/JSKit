// #import Foundation
// #import "SECCipher.js"
// #import "SECHMAC.js"
'use strict';

JSClass("SECOneTimePassword", JSObject, {

    secretData: null,
    numberOfDigits: null,
    timePeriod: null,
    startTime: 0,

    init: function(){
        this.initWithNumberOfDigits(6);
    },

    initWithSecret: function(secretData, numberOfDigits, timePeriod, startTime){
        if (numberOfDigits === undefined){
            numberOfDigits = 6;
        }
        if (timePeriod === undefined){
            timePeriod = 30;
        }
        if (startTime === undefined){
            startTime = 0;
        }
        this.secretData = secretData;
        this.numberOfDigits = numberOfDigits;
        this.timePeriod = timePeriod;
        this.startTime = startTime;
    },

    initWithNumberOfDigits: function(numberOfDigits, timePeriod, startTime){
        var secretData = SECCipher.getRandomData(20);
        this.initWithSecret(secretData, numberOfDigits, timePeriod, startTime);
    },

    initWithStorageRepresentation: function(dictionary){
        var secretData = dictionary.secret.dataByDecodingBase64();
        this.initWithSecret(secretData, dictionary.digits, dictionary.timePeriod, dictionary.start);
    },

    storageRepresentation: function(){
        return {
            secret: this.secretData.base64StringRepresentation(),
            digits: this.numberOfDigits,
            period: this.timePeriod,
            start: this.startTime
        };
    },

    urlForUsername: function(username, domain){
        var url = JSURL.init();
        url.scheme = "otpauth";
        url.host = "totp";
        url.pathComponents = ["%s:%s".sprintf(domain, username)];
        var query = JSFormFieldMap();
        query.add("secret", this.secretData.base32StringRepresentation());
        query.add("issuer", domain);
        if (this.numberOfDigits != 6){
            query.add("digits", this.numberOfDigits);
        }
        if (this.timePeriod != 30){
            query.add("period", this.timePeriod);
        }
        url.query = query;
        return url;
    },

    generateToken: function(completion, target){
        return this.generateTokenForTimestamp(JSDate.now.timeIntervalSince1970, completion, target);
    },

    generateTokenWithOffset: function(timeOffset, completion, target){
        return this.generateTokenForTimestamp(JSDate.now.timeIntervalSince1970 + timeOffset, completion, target);
    },

    generateTokenForTimestamp: function(timestamp, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var now = Math.floor(timestamp);
        var steps = Math.floor((now - this.startTime) / this.timePeriod);
        var n = steps;
        var data = JSData.initWithLength(8);
        var i = 7;
        while (i >= 0 && n > 0){
            data[i] = n & 0xFF;
            n = n >>> 8;
            --i;
        }
        var hmac = SECHMAC.initWithAlgorithm(SECHMAC.Algorithm.sha1);
        hmac.createKeyWithData(this.secretData, function(key){
            if (key === null){
                completion.call(target, null);
                return;
            }
            hmac.key = key;
            hmac.update(data);
            hmac.sign(function(signature){
                if (signature === null){
                    completion.call(target, null);
                    return;
                }
                var offset = signature[19] & 0xF;
                var n = ((signature[offset] & 0x7F) << 24) | (signature[offset + 1] << 16) | (signature[offset + 2] << 8) | (signature[offset + 3]);
                var tokenNumber = n % Math.pow(10, this.numberOfDigits);
                completion.call(target, tokenNumber.toString().leftPaddedString("0", this.numberOfDigits));
            }, this);
        }, this);
        return completion.promise;
    },

    verify: function(token, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.generateTokenWithOffset(0, function(generated){
            if (token !== generated){
                this.generateTokenWithOffset(-this.timePeriod / 2, function(generated){
                    completion.call(target, token === generated);
                }, this);
                return;
            }
            completion.call(target, true);
        }, this);
        return completion.promise;
    }

});