// #import Foundation
// #import "SECCipher.js"
// #import "SECHMAC.js"
'use strict';

// Implements Time-based One-Time Password Algorithm https://tools.ietf.org/html/rfc6238

JSClass("SECOneTimePassword", JSObject, {

    secretData: null,
    numberOfDigits: null,
    timePeriod: null,
    startDate: null,

    init: function(){
        this.initWithNumberOfDigits(6);
    },

    initWithSecret: function(secretData, numberOfDigits, timePeriod, startDate){
        if (numberOfDigits === undefined){
            numberOfDigits = 6;
        }
        if (timePeriod === undefined){
            timePeriod = 30;
        }
        if (startDate === undefined){
            startDate = JSDate.initWithTimeIntervalSince1970(0);
        }
        this.secretData = secretData;
        this.numberOfDigits = numberOfDigits;
        this.timePeriod = timePeriod;
        this.startDate = startDate;
    },

    initWithNumberOfDigits: function(numberOfDigits, timePeriod, startDate){
        var secretData = SECCipher.getRandomData(20);
        this.initWithSecret(secretData, numberOfDigits, timePeriod, startDate);
    },

    initWithDictionary: function(dictionary){
        var secretData = dictionary.secret.dataByDecodingBase64();
        this.initWithSecret(secretData, dictionary.digits, dictionary.period, JSDate.initWithTimeIntervalSince1970(dictionary.start));
    },

    dictionaryRepresentation: function(){
        return {
            secret: this.secretData.base64StringRepresentation(),
            digits: this.numberOfDigits,
            period: this.timePeriod,
            start: this.startDate.timeIntervalSince1970
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
        return this.generateTokenForDate(JSDate.now, completion, target);
    },

    generateTokenForDate: function(date, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var dt = Math.floor(date.timeIntervalSinceDate(this.startDate));
        var steps = Math.floor(dt / this.timePeriod);
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
        var date = JSDate.now;
        this.generateTokenForDate(date, function(generated){
            if (token !== generated){
                this.generateTokenForDate(date.addingTimeInterval(-this.timePeriod / 2), function(generated){
                    completion.call(target, token === generated);
                }, this);
                return;
            }
            completion.call(target, true);
        }, this);
        return completion.promise;
    }

});