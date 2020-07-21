// #import SecurityKit
// #import TestKit
'use strict';

JSClass("SECOneTimePasswordTests", TKTestSuite, {

    testGenerateToken: function(){
        var secret = "12345678901234567890".latin1();
        var otp = SECOneTimePassword.initWithSecret(secret, 8, 30, 0);
        var expectation = TKExpectation.init();
        expectation.call(otp.generateTokenForTimestamp, otp, 59, function(token){
            TKAssertNotNull(token);
            TKAssertExactEquals(token, "94287082");
            expectation.call(otp.generateTokenForTimestamp, otp, 1111111109, function(token){
                TKAssertNotNull(token);
                TKAssertExactEquals(token, "07081804");
                expectation.call(otp.generateTokenForTimestamp, otp, 1111111111, function(token){
                    TKAssertNotNull(token);
                    TKAssertExactEquals(token, "14050471");
                    expectation.call(otp.generateTokenForTimestamp, otp, 1234567890, function(token){
                        TKAssertNotNull(token);
                        TKAssertExactEquals(token, "89005924");
                        expectation.call(otp.generateTokenForTimestamp, otp, 2000000000, function(token){
                            TKAssertNotNull(token);
                            TKAssertExactEquals(token, "69279037");
                            expectation.call(otp.generateTokenForTimestamp, otp, 20000000000, function(token){
                                TKAssertNotNull(token);
                                TKAssertExactEquals(token, "65353130");
                            });
                        });
                    });
                });
            });
        });
        this.wait(expectation, 5.0);
    }

});