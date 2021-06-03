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

// #import SecurityKit
// #import TestKit
'use strict';

JSClass("SECOneTimePasswordTests", TKTestSuite, {

    testGenerateToken: function(){
        var secret = "12345678901234567890".latin1();
        var otp = SECOneTimePassword.initWithSecret(secret, 8, 30);
        var expectation = TKExpectation.init();
        expectation.call(otp.generateTokenForDate, otp, JSDate.initWithTimeIntervalSince1970(59), function(token){
            TKAssertNotNull(token);
            TKAssertExactEquals(token, "94287082");
            expectation.call(otp.generateTokenForDate, otp, JSDate.initWithTimeIntervalSince1970(1111111109), function(token){
                TKAssertNotNull(token);
                TKAssertExactEquals(token, "07081804");
                expectation.call(otp.generateTokenForDate, otp, JSDate.initWithTimeIntervalSince1970(1111111111), function(token){
                    TKAssertNotNull(token);
                    TKAssertExactEquals(token, "14050471");
                    expectation.call(otp.generateTokenForDate, otp, JSDate.initWithTimeIntervalSince1970(1234567890), function(token){
                        TKAssertNotNull(token);
                        TKAssertExactEquals(token, "89005924");
                        expectation.call(otp.generateTokenForDate, otp, JSDate.initWithTimeIntervalSince1970(2000000000), function(token){
                            TKAssertNotNull(token);
                            TKAssertExactEquals(token, "69279037");
                            expectation.call(otp.generateTokenForDate, otp, JSDate.initWithTimeIntervalSince1970(20000000000), function(token){
                                TKAssertNotNull(token);
                                TKAssertExactEquals(token, "65353130");
                            });
                        });
                    });
                });
            });
        });
        this.wait(expectation, 5.0);
    },

    testVerify: function(){
        var secret = "12345678901234567890".latin1();
        var otp = SECOneTimePassword.initWithSecret(secret, 8, 30);
        var expectation = TKExpectation.init();
        expectation.call(otp.generateToken, otp, function(token){
            TKAssertNotNull(token);
            expectation.call(otp.verify, otp, token, function(verified){
                TKAssert(verified);
            });
        });
        this.wait(expectation, 5.0);
    },

    testDictionaryRepresentation: function(){
        var secret = "12345678901234567890".latin1();
        var otp = SECOneTimePassword.initWithSecret(secret, 8, 30);
        var dictionary = otp.dictionaryRepresentation();
        TKAssertNotNull(dictionary);
        TKAssertEquals(dictionary.secret, "MTIzNDU2Nzg5MDEyMzQ1Njc4OTA=");
        TKAssertExactEquals(dictionary.digits, 8);
        TKAssertExactEquals(dictionary.period, 30);
        TKAssertExactEquals(dictionary.start, 0);
    },

    testInitWithDictionary: function(){
        var dictionary = {
            secret: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTA=",
            digits: 8,
            period: 45,
            start: 60
        };
        var otp = SECOneTimePassword.initWithDictionary(dictionary);
        TKAssertObjectEquals(otp.secretData, "12345678901234567890".latin1());
        TKAssertEquals(otp.numberOfDigits, 8);
        TKAssertEquals(otp.timePeriod, 45);
        TKAssertObjectEquals(otp.startDate, JSDate.initWithTimeIntervalSince1970(60));
    }

});