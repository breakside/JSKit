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

JSClass("SECSignTests", TKTestSuite, {

    testSignAndVerify: function(){
        var plaintext = "This is a test of SECSign and SECVerify".utf8();
        var signer = SECSign.initWithAlgorithm(SECSign.Algorithm.rsaSHA256);
        var expectation = TKExpectation.init();
        expectation.call(signer.createKeyPair, signer, {}, function(keys){
            TKAssertNotNull(keys);
            signer.update(plaintext);
            expectation.call(signer.sign, signer, keys.private, function(signature){
                TKAssertNotNull(signature);
                var verify = SECVerify.initWithAlgorithm(SECVerify.Algorithm.rsaSHA256);
                verify.update(plaintext);
                expectation.call(verify.verify, verify, keys.public, signature, function(verified){
                    TKAssert(verified);
                });
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    }

});