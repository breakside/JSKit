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

JSClass("SECJSONWebTokenTests", TKTestSuite, {

    testExampleHMACSHA256VerifyKeyData: function(){
        var token = SECJSONWebToken.initWithString("eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
        TKAssertNotNull(token);
        var keyData = JSData.initWithArray([3, 35, 53, 75, 43, 15, 165, 188, 131, 126, 6, 101, 119, 123, 166, 143, 90, 179, 40, 230, 240, 84, 201, 40, 169, 15, 132, 178, 210, 80, 46, 191, 211, 251, 90, 146, 210, 6, 71, 239, 150, 138, 180, 195, 119, 98, 61, 34, 61, 46, 33, 114, 5, 46, 79, 8, 192, 205, 154, 245, 103, 208, 128, 163]);
        var expectation = TKExpectation.init();
        expectation.call(token.verifiedPayload, token, keyData, function(payload){
            TKAssertNotNull(payload);
            TKAssertExactEquals(payload.iss, "joe");
            TKAssertExactEquals(payload.exp, 1300819380);
            TKAssertExactEquals(payload['http://example.com/is_root'], true);
        });
        this.wait(expectation, 1.0);
    },

    testExampleHMACSHA256VerifyJWK: function(){
        var token = SECJSONWebToken.initWithString("eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
        TKAssertNotNull(token);
        var keyData = JSData.initWithArray([3, 35, 53, 75, 43, 15, 165, 188, 131, 126, 6, 101, 119, 123, 166, 143, 90, 179, 40, 230, 240, 84, 201, 40, 169, 15, 132, 178, 210, 80, 46, 191, 211, 251, 90, 146, 210, 6, 71, 239, 150, 138, 180, 195, 119, 98, 61, 34, 61, 46, 33, 114, 5, 46, 79, 8, 192, 205, 154, 245, 103, 208, 128, 163]);
        var jwk = {
          kty: SECJSONWebToken.KeyType.symmetric,
          k: keyData.base64URLStringRepresentation()
        };
        var expectation = TKExpectation.init();
        expectation.call(token.verifiedPayload, token, jwk, function(payload){
            TKAssertNotNull(payload);
            TKAssertExactEquals(payload.iss, "joe");
            TKAssertExactEquals(payload.exp, 1300819380);
            TKAssertExactEquals(payload['http://example.com/is_root'], true);
        });
        this.wait(expectation, 1.0);
    },

    tesHMACSHA256Sign: function(){
        var payload = {
          iss: "https://tests.breakside.io",
          exp: 1234567890,
          testing: "Hello, World!"
        };
        var token = SECJSONWebToken.initWithPayload(payload);
        var keyData = JSData.initWithArray([3, 35, 53, 75, 43, 15, 165, 188, 131, 126, 6, 101, 119, 123, 166, 143, 90, 179, 40, 230, 240, 84, 201, 40, 169, 15, 132, 178, 210, 80, 46, 191, 211, 251, 90, 146, 210, 6, 71, 239, 150, 138, 180, 195, 119, 98, 61, 34, 61, 46, 33, 114, 5, 46, 79, 8, 192, 205, 154, 245, 103, 208, 128, 163]);
        var jwk = {
          kty: SECJSONWebToken.KeyType.symmetric,
          k: keyData.base64URLStringRepresentation(),
          alg: SECJSONWebToken.Algorithm.hmacSHA256,
        };
        var expectation = TKExpectation.init();
        expectation.call(token.sign, token, jwk, function(jwt){
          TKAssertNotNull(jwt);
          TKAssertEquals(jwt, "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3Rlc3RzLmJyZWFrc2lkZS5pbyIsImV4cCI6MTIzNDU2Nzg5MCwidGVzdGluZyI6IkhlbGxvLCBXb3JsZCEifQ.kBAszisKh6NJ7K0a_N6Bt97DcB50cRbe5m86FwR5D-U");
          var token = SECJSONWebToken.initWithString(jwt);
          TKAssertNotNull(token);

          expectation.call(token.verifiedPayload, token, jwk, function(payload){
              TKAssertNotNull(payload);
              TKAssertExactEquals(payload.iss, "https://tests.breakside.io");
              TKAssertExactEquals(payload.exp, 1234567890);
              TKAssertExactEquals(payload.testing, "Hello, World!");
          });
        });
        this.wait(expectation, 1.0);
    },

    testGoogleRSA256: function(){
        var token = SECJSONWebToken.initWithString("eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNjc4MWJhNzExOTlhNjU4ZTc2MGFhNWFhOTNlNWZjM2RjNzUyYjUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3MDMxMDY3NDIxMDUtN2huM2JydWN0dWdvYTM0Y2hkZTByaWZtYnUyczNiYjUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3MDMxMDY3NDIxMDUtN2huM2JydWN0dWdvYTM0Y2hkZTByaWZtYnUyczNiYjUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTQzNDYyNzE1NjExMzEyODc2NjYiLCJlbWFpbCI6Im93ZW5wc2hhd0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibm9uY2UiOiIxIiwibmFtZSI6Ik93ZW4gU2hhdyIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLTBoakJjU0J5LUlNL0FBQUFBQUFBQUFJL0FBQUFBQUFBQWgwL2FObXVQR3ZNUjA4L3M5Ni1jL3Bob3RvLmpwZyIsImdpdmVuX25hbWUiOiJPd2VuIiwiZmFtaWx5X25hbWUiOiJTaGF3IiwibG9jYWxlIjoiZW4iLCJpYXQiOjE1NTUxMTE5NDgsImV4cCI6MTU1NTExNTU0OCwianRpIjoiOWI0YWJmMjEyMzRiYjUwNDk4MjhiYjczNDMzMGUyMmRiN2E3ZjZiNyJ9.bDpEzcnX17OlOK2iM8i3sDMbVnFsGTRKgNoH1zclZSmFRzCmlYcj7hepEc1UbHmowvxb4juzYo15vfFO-EwWfypIadhjmDLkhk6Ysuk6gzDGH0KoJzC1YC899J4MZ2ct7b2WyiyNMIrK_G7ZuBoD8imDMNKMkWFydNQqyM7_PDu3QY5kx9tEsQhp8qD0BSdNzZ_mdCbqyO2Os0Xq8YPvprHSvd4_mjQZ6zLGzTbIBU3xxTRA0u91k-M_bgMPuSYX3lvIaae22H82M6yfAafpt9vuam6emZ_48ZLnQib3ZFLRPWqCaI8iOmIKoI-CzwC8RyIrajv1Xsev91Pi3Yewhw");
        var keys = [
            {
              "alg": "RS256",
              "n": "1J287_drOWg9YJohe9TO7T0_l3EFkXOOWECkX5U-7ELhGFcfSnug-X7jnk4UJe2IyzlxZYSzsshUgTAvXSkLQCbkNT9gqigOmE7X70UAKaaq3IryR_yM92kpmBeH0zoNRFr-0f9vATrt3E2q9oKyKT16NEyzWqurk9w5cgdEB27OF389ftFK8H-BOtyB1gGziLvXVY4UTVfGOPe8VKTt2TfNWrdc40gt9L8iW4hCDzMlYCZQ-61dLhj_muIYXDXDfMqH1YK_JaCzAowzzuw6zCWLd9cUEAncotEbEsQUGqhof7KIsuX96ajGZKOWKBkvzBOUzr8EaOU4YGAyOvyVJw",
              "use": "sig",
              "kid": "6f6781ba71199a658e760aa5aa93e5fc3dc752b5",
              "e": "AQAB",
              "kty": "RSA"
            },
            {
              "kid": "3782d3f0bc89008d9d2c01730f765cfb19d3b70e",
              "e": "AQAB",
              "kty": "RSA",
              "alg": "RS256",
              "n": "vIs0vGoFJRWXRbPOwrbkAYtocuQbkHON9xUdC3Yp0Wyg1RXGnFjO4EZJWiWXlIRdMORW_ABEz8ggh5-51zdSZK4RES7OglD9TzoUvZgCwveI__wz2YvqvvZjelHixksHJn7dxBKd_qIB94A9JCtTTcX4tJExugBrZz5OpS9PoBeR4_cwHRk2618Q9CezhjBmOWEW5kyfDAhzJc8f6mpd1pX004e_OybD6xhfUHgnB0vT45ocFHmKzZ5LGfJyPxqXkLkpezofEC4lO5ru9yUhK209s7GABo39ZX6gYjHKocKeGxMRw2jZ_5jBK9-jcp9upqO7sgbfGpHjxZE6Pr6bsw",
              "use": "sig"
            }
        ];
        var expectation = TKExpectation.init();
        expectation.call(token.verifiedPayload, token, keys, function(payload){
            TKAssertNotNull(payload);
            TKAssertExactEquals(payload.iss, "https://accounts.google.com");
            TKAssertExactEquals(payload.sub, "114346271561131287666");
            TKAssertExactEquals(payload.exp, 1555115548);
        });
        this.wait(expectation, 1.0);
    },

    testRSA256Sign: function(){
        var payload = {
          iss: "https://tests.breakside.io",
          exp: 1234567890,
          testing: "Hello, World!"
        };
        var publicJWK = {
          "alg": "RS256",
          "e": "AQAB",
          "ext": true,
          "key_ops": [
            "verify"
          ],
          "kty": "RSA",
          "n": "5KnpDItWK5vq3T3m7Yshr3JShzURaC9KwUVKIxJrbd-Aynr_aU9Ehv0I3qn8_2Tgum3Fh-69tGlpSg2JRYfmvs7dRJLHvAgb2MiXdpgpzBrce0qBRjNDpXAZcKsI0CSNhQEV9c3R8lRtSt4gJKctA3YSp6Kdve7v68QW-DLumGRf9_NSZ9NLEMo6d7kqksqo0QarKPhMah7x1D9_KIWvpZzbyYXIPXondLcJIEsxpfiAT0sSILKxFAf0uk2ba4w3EHfmKeP0viU1jQ4XspGmsRHBMk1l-l7reCBZOKNVRvbFiIvJhC2zh2_hMyqBcw-R8gau0tuM_aTg_S6pvElMNw",
          "kid": "mqsZJl9bmCA00_Ed9XPXm3SssCA"
        };
        var privateJWK = {
          "alg": "RS256",
          "d": "INh5OziOkwANWg9TawliYtHF91mmRkljcGSpaWVIHNsPJHFLho8rgEUQ2kR1AiM1lqyVma4vqMkVezImPDXGbYpzGoUHqhjzaw3RQpNJObdytpu1UGX6Zbq2-h9PSkVd4LOPDyUBRHu1IUfL5TKa_YAfM4jhJhBlfSpzGYmItUc8QUwZXdb7fN9-CllosKBcjgOztmxZkMU3pXN8aDRkDecQsOaizYGfQsqIIRdXFjFY461zaU99H63GS8kxFrhqgHHUZSs5xfazKBZ4EoqsK7G2__fpBuPsm-MDvBYQOfgkGqh0aVKjw0MfLTWGu1Sbz0fJz-_Hmko55k7EhfqCPQ",
          "dp": "ddS92-v3XPyTPtA6tcN_vc1XTyUJ00zOGk4QVf96HbZFpP1fscABUex98XJazP8wN_vtXodTSa22BHEUmLL3JX-K7BMoQ_99R-K0dmyKSQLxK9nl8ct47-JyXYfipiXyG3uo8G35siNKpUaSScMUkiZdmjNkCr_uZ-PYsimPTxU",
          "dq": "rU93eySXbMcn5JK_4-Xy0AoaEv6UyIQ9yp3s3hcbno1F4xZkHfSc9hHLSMirx_IAM_pRs6w1ZKSh1WjsA67Br-VEOYsybPwozTCT3JrZRnU6OwYEEQQR-uQvTIeqDenJXTLs2y1KI4XGgJHlxMLbMeGjjD5Z8rMK6u5t3qEJNDk",
          "e": "AQAB",
          "ext": true,
          "key_ops": [
            "sign"
          ],
          "kty": "RSA",
          "n": "5KnpDItWK5vq3T3m7Yshr3JShzURaC9KwUVKIxJrbd-Aynr_aU9Ehv0I3qn8_2Tgum3Fh-69tGlpSg2JRYfmvs7dRJLHvAgb2MiXdpgpzBrce0qBRjNDpXAZcKsI0CSNhQEV9c3R8lRtSt4gJKctA3YSp6Kdve7v68QW-DLumGRf9_NSZ9NLEMo6d7kqksqo0QarKPhMah7x1D9_KIWvpZzbyYXIPXondLcJIEsxpfiAT0sSILKxFAf0uk2ba4w3EHfmKeP0viU1jQ4XspGmsRHBMk1l-l7reCBZOKNVRvbFiIvJhC2zh2_hMyqBcw-R8gau0tuM_aTg_S6pvElMNw",
          "p": "-C98oMf9Pk6CVfDKpPKPcx7Wdo_PGSgjJAefvP5MPwazPTrCLeQJABbF0pHoxss2v1t-QWG7xN5fHJVSbhCA0HE25jUSCTqylPfAKd63micykJVLmbGlm19AmCEb7sr5wCcAhOHhR39LdZ9r6C8t8cpe7x31XwUJWm5WD2dwx70",
          "q": "690RLJH4pl0ennmc0QQN-y2JtoOqucUL7FQ_AYfoo7Jd3LlglX3LG97riUgWtqXcmweUOORXRd0eWtr8jvPt4C7jZK7bBcFNIex8Kwgs6r_DsiybhXnseVLrvS6q3c5occlRwDf-5gkyaJ9CnRp5Rhdggc6ShB6xYBmmHyrjmQM",
          "qi": "2TjnUL0oCa3c0l1PeclEUNySjXiGUlMvlmdZxnHfHtRWWrvRxyDjRdTeoc2qEPQL5N2z_1WG1APKwqK1ezPjMOIY_5bXOWvuBq76Q5EqeNiSVV9vfcj0JMtNNU2_DSzERiUw-LdB4SYfXM_joa_gW9kkpXFkIT923eAHiUBS4U0",
          "kid": "mqsZJl9bmCA00_Ed9XPXm3SssCA"
        };
        var token = SECJSONWebToken.initWithPayload(payload);
        var expectation = TKExpectation.init();
        expectation.call(token.sign, token, privateJWK, function(jwt){
          TKAssertNotNull(jwt);
          TKAssertEquals(jwt, "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Im1xc1pKbDlibUNBMDBfRWQ5WFBYbTNTc3NDQSJ9.eyJpc3MiOiJodHRwczovL3Rlc3RzLmJyZWFrc2lkZS5pbyIsImV4cCI6MTIzNDU2Nzg5MCwidGVzdGluZyI6IkhlbGxvLCBXb3JsZCEifQ.bNdgyG-0gBdh6PmMs7Y9RF-ovvp8Y4lC5sSMasYzP6sdyM4LQUqAHwgUm4DmXidNbnEv4VKOF52YZTXHVbDNAhifKOCISpuzNd6SrMUpERVWkPrhAkoRMQmyMn_fBqEZN75_17EdRE8DmLnaY1qu95vdkA4Y6kYANmTv7pWhj6EKG-aplgax0jNXTIKkTEuxyjs2vRwOIfpUOXoh9UmFN7ZUl5yZQRDslZD_gfcZ3oJLW5RdKfNCrMAJhMujzjJTi7_VfOvO6smE0jEriIi5PUysUdRqWf3BcGA5M8EcWRlgnefubTJJAywiceV6t7WOT19tmVecPoEdhPKbsxT1rw");
          var token = SECJSONWebToken.initWithString(jwt);
          TKAssertNotNull(token);
          expectation.call(token.verifiedPayload, token, publicJWK, function(payload){
              TKAssertNotNull(payload);
              TKAssertExactEquals(payload.iss, "https://tests.breakside.io");
              TKAssertExactEquals(payload.exp, 1234567890);
              TKAssertExactEquals(payload.testing, "Hello, World!");
          });
        });
        this.wait(expectation, 1.0);
    },

    testRSA256SignKid: function(){
        var payload = {
          iss: "https://tests.breakside.io",
          exp: 1234567890,
          testing: "Hello, World!"
        };
        var publicJWK = {
          "alg": "RS256",
          "e": "AQAB",
          "ext": true,
          "key_ops": [
            "verify"
          ],
          "kty": "RSA",
          "n": "5KnpDItWK5vq3T3m7Yshr3JShzURaC9KwUVKIxJrbd-Aynr_aU9Ehv0I3qn8_2Tgum3Fh-69tGlpSg2JRYfmvs7dRJLHvAgb2MiXdpgpzBrce0qBRjNDpXAZcKsI0CSNhQEV9c3R8lRtSt4gJKctA3YSp6Kdve7v68QW-DLumGRf9_NSZ9NLEMo6d7kqksqo0QarKPhMah7x1D9_KIWvpZzbyYXIPXondLcJIEsxpfiAT0sSILKxFAf0uk2ba4w3EHfmKeP0viU1jQ4XspGmsRHBMk1l-l7reCBZOKNVRvbFiIvJhC2zh2_hMyqBcw-R8gau0tuM_aTg_S6pvElMNw",
          "kid": "mqsZJl9bmCA00_Ed9XPXm3SssCA"
        };
        var privateJWK = {
          "alg": "RS256",
          "d": "INh5OziOkwANWg9TawliYtHF91mmRkljcGSpaWVIHNsPJHFLho8rgEUQ2kR1AiM1lqyVma4vqMkVezImPDXGbYpzGoUHqhjzaw3RQpNJObdytpu1UGX6Zbq2-h9PSkVd4LOPDyUBRHu1IUfL5TKa_YAfM4jhJhBlfSpzGYmItUc8QUwZXdb7fN9-CllosKBcjgOztmxZkMU3pXN8aDRkDecQsOaizYGfQsqIIRdXFjFY461zaU99H63GS8kxFrhqgHHUZSs5xfazKBZ4EoqsK7G2__fpBuPsm-MDvBYQOfgkGqh0aVKjw0MfLTWGu1Sbz0fJz-_Hmko55k7EhfqCPQ",
          "dp": "ddS92-v3XPyTPtA6tcN_vc1XTyUJ00zOGk4QVf96HbZFpP1fscABUex98XJazP8wN_vtXodTSa22BHEUmLL3JX-K7BMoQ_99R-K0dmyKSQLxK9nl8ct47-JyXYfipiXyG3uo8G35siNKpUaSScMUkiZdmjNkCr_uZ-PYsimPTxU",
          "dq": "rU93eySXbMcn5JK_4-Xy0AoaEv6UyIQ9yp3s3hcbno1F4xZkHfSc9hHLSMirx_IAM_pRs6w1ZKSh1WjsA67Br-VEOYsybPwozTCT3JrZRnU6OwYEEQQR-uQvTIeqDenJXTLs2y1KI4XGgJHlxMLbMeGjjD5Z8rMK6u5t3qEJNDk",
          "e": "AQAB",
          "ext": true,
          "key_ops": [
            "sign"
          ],
          "kty": "RSA",
          "n": "5KnpDItWK5vq3T3m7Yshr3JShzURaC9KwUVKIxJrbd-Aynr_aU9Ehv0I3qn8_2Tgum3Fh-69tGlpSg2JRYfmvs7dRJLHvAgb2MiXdpgpzBrce0qBRjNDpXAZcKsI0CSNhQEV9c3R8lRtSt4gJKctA3YSp6Kdve7v68QW-DLumGRf9_NSZ9NLEMo6d7kqksqo0QarKPhMah7x1D9_KIWvpZzbyYXIPXondLcJIEsxpfiAT0sSILKxFAf0uk2ba4w3EHfmKeP0viU1jQ4XspGmsRHBMk1l-l7reCBZOKNVRvbFiIvJhC2zh2_hMyqBcw-R8gau0tuM_aTg_S6pvElMNw",
          "p": "-C98oMf9Pk6CVfDKpPKPcx7Wdo_PGSgjJAefvP5MPwazPTrCLeQJABbF0pHoxss2v1t-QWG7xN5fHJVSbhCA0HE25jUSCTqylPfAKd63micykJVLmbGlm19AmCEb7sr5wCcAhOHhR39LdZ9r6C8t8cpe7x31XwUJWm5WD2dwx70",
          "q": "690RLJH4pl0ennmc0QQN-y2JtoOqucUL7FQ_AYfoo7Jd3LlglX3LG97riUgWtqXcmweUOORXRd0eWtr8jvPt4C7jZK7bBcFNIex8Kwgs6r_DsiybhXnseVLrvS6q3c5occlRwDf-5gkyaJ9CnRp5Rhdggc6ShB6xYBmmHyrjmQM",
          "qi": "2TjnUL0oCa3c0l1PeclEUNySjXiGUlMvlmdZxnHfHtRWWrvRxyDjRdTeoc2qEPQL5N2z_1WG1APKwqK1ezPjMOIY_5bXOWvuBq76Q5EqeNiSVV9vfcj0JMtNNU2_DSzERiUw-LdB4SYfXM_joa_gW9kkpXFkIT923eAHiUBS4U0",
          "kid": "mqsZJl9bmCA00_Ed9XPXm3SssCA"
        };
        var token = SECJSONWebToken.initWithPayload(payload);
        var expectation = TKExpectation.init();
        expectation.call(token.sign, token, privateJWK, function(jwt){
          TKAssertNotNull(jwt);
          TKAssertEquals(jwt, "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Im1xc1pKbDlibUNBMDBfRWQ5WFBYbTNTc3NDQSJ9.eyJpc3MiOiJodHRwczovL3Rlc3RzLmJyZWFrc2lkZS5pbyIsImV4cCI6MTIzNDU2Nzg5MCwidGVzdGluZyI6IkhlbGxvLCBXb3JsZCEifQ.bNdgyG-0gBdh6PmMs7Y9RF-ovvp8Y4lC5sSMasYzP6sdyM4LQUqAHwgUm4DmXidNbnEv4VKOF52YZTXHVbDNAhifKOCISpuzNd6SrMUpERVWkPrhAkoRMQmyMn_fBqEZN75_17EdRE8DmLnaY1qu95vdkA4Y6kYANmTv7pWhj6EKG-aplgax0jNXTIKkTEuxyjs2vRwOIfpUOXoh9UmFN7ZUl5yZQRDslZD_gfcZ3oJLW5RdKfNCrMAJhMujzjJTi7_VfOvO6smE0jEriIi5PUysUdRqWf3BcGA5M8EcWRlgnefubTJJAywiceV6t7WOT19tmVecPoEdhPKbsxT1rw");
          var token = SECJSONWebToken.initWithString(jwt);
          TKAssertNotNull(token);
          expectation.call(token.verifiedPayload, token, [{kid: "wrong"}, publicJWK, {kid: "another"}], function(payload){
              TKAssertNotNull(payload);
              TKAssertExactEquals(payload.iss, "https://tests.breakside.io");
              TKAssertExactEquals(payload.exp, 1234567890);
              TKAssertExactEquals(payload.testing, "Hello, World!");
          });
        });
        this.wait(expectation, 1.0);
    }

});