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
// #import TestKit
'use strict';

JSClass('JSMD5HashTests', TKTestSuite, {

    _testHash: function(str, expecting){
        var hex = JSMD5Hash(str.utf8()).hexStringRepresentation();
        TKAssertEquals(hex, expecting);
    },

    testRFC01: function(){
        this._testHash("", "d41d8cd98f00b204e9800998ecf8427e");
    },

    testRFC02: function(){
        this._testHash("a", "0cc175b9c0f1b6a831c399e269772661");
    },

    testRFC03: function(){
        this._testHash("abc", "900150983cd24fb0d6963f7d28e17f72");
    },

    testRFC04: function(){
        this._testHash("message digest", "f96b697d7cb7938d525a2f31aaf161d0");
    },

    testRFC05: function(){
        this._testHash("abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b");
    },

    testRFC06: function(){
        this._testHash("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", "d174ab98d277d9f5a5611c2c9f419d9f");
    },

    testRFC07: function(){
        this._testHash("12345678901234567890123456789012345678901234567890123456789012345678901234567890", "57edf4a22be3c955ac49da2e2107b67a");
    },

    testLong: function(){
        this._testHash("1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890", "268c7919189d85e276d74b8c60b2f84f");
    },

    testAdd: function(){
        var hasher = new JSMD5Hash();
        hasher.start();
        hasher.add("1234567890".utf8());
        hasher.add("1234567890".utf8());
        hasher.add("1234567890".utf8());
        hasher.add("1234567890".utf8());
        hasher.add("1234567890".utf8());
        hasher.add("1234567890".utf8());
        hasher.add("1234567890".utf8());
        hasher.add("1234567890".utf8());
        hasher.finish();
        var hex = hasher.digest().hexStringRepresentation();
        TKAssertEquals(hex, "57edf4a22be3c955ac49da2e2107b67a");

        var hasher2 = new JSMD5Hash();
        hasher2.start();
        hasher2.add("12345678901234567890123456789012345678901234567890123456789012345678901234567890".utf8());
        hasher2.add("12345678901234567890123456789012345678901234567890123456789012345678901234567890".utf8());
        hasher2.finish();
        var hex2 = hasher2.digest().hexStringRepresentation();
        TKAssertEquals(hex2, "268c7919189d85e276d74b8c60b2f84f");
    }

});