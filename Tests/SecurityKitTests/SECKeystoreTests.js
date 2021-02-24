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

JSClass("SECKeystoreTests", TKTestSuite, {

    testAddRetrieveJWK: function(){
        var keystore = SECKeystore.init();
        keystore.addJWK({kid: "key1", kty: "oct", k: "abc123"});
        var jwk = keystore.jwkForIdentifier("key1");
        TKAssertEquals(jwk.kid, "key1");
        TKAssertEquals(jwk.kty, "oct");
        TKAssertEquals(jwk.k, "abc123");
    },

    testAddRetrieveData: function(){
        var keystore = SECKeystore.init();
        keystore.addDataForIdentifier("keydata".utf8(), "key1");
        var data = keystore.dataForIdentifier("key1");
        TKAssertEquals(data.stringByDecodingUTF8(), "keydata");
    },

    testAddRetrieveBase64URL: function(){
        var keystore = SECKeystore.init();
        keystore.addBase64URLForIdentifier("keydata".utf8().base64URLStringRepresentation(), "key1");
        var data = keystore.dataForIdentifier("key1");
        TKAssertEquals(data.stringByDecodingUTF8(), "keydata");
    },

    testAddDataRetrieveJWK: function(){
        var keystore = SECKeystore.init();
        keystore.addDataForIdentifier("keydata".utf8(), "key1");
        var data = keystore.dataForIdentifier("key1");
        var jwk = keystore.jwkForIdentifier("key1");
        TKAssertEquals(jwk.kid, "key1");
        TKAssertEquals(jwk.kty, "oct");
        TKAssertEquals(jwk.k, "a2V5ZGF0YQ");
    },

    testAddBase64URLRetrieveJWK: function(){
        var keystore = SECKeystore.init();
        keystore.addBase64URLForIdentifier("keydata".utf8().base64URLStringRepresentation(), "key1");
        var jwk = keystore.jwkForIdentifier("key1");
        TKAssertEquals(jwk.kid, "key1");
        TKAssertEquals(jwk.kty, "oct");
        TKAssertEquals(jwk.k, "a2V5ZGF0YQ");
    }
});