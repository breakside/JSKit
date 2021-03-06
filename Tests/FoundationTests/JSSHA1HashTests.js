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

JSClass('JSSHA1HashTests', TKTestSuite, {

    testRFC01: function(){
        var hex = JSSHA1Hash("abc".utf8()).hexStringRepresentation();
        TKAssertEquals(hex, "a9993e364706816aba3e25717850c26c9cd0d89d");
    },

    testRFC02: function(){
        var hex = JSSHA1Hash("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq".utf8()).hexStringRepresentation();
        TKAssertEquals(hex, "84983e441c3bd26ebaae4aa1f95129e5e54670f1");
    },

    testRFC03: function(){
        var data = "a".utf8();
        var hasher = new JSSHA1Hash();
        hasher.start();
        for (var i = 0; i < 1000000; ++i){
            hasher.add(data);
        }
        hasher.finish();
        var hex = hasher.digest().hexStringRepresentation();
        TKAssertEquals(hex, "34aa973cd4c4daa4f61eeb2bdbad27316534016f");
    },

    testRFC04: function(){
        var data = "0123456701234567012345670123456701234567012345670123456701234567".utf8();
        var hasher = new JSSHA1Hash();
        hasher.start();
        for (var i = 0; i < 10; ++i){
            hasher.add(data);
        }
        hasher.finish();
        var hex = hasher.digest().hexStringRepresentation();
        TKAssertEquals(hex, "dea356a2cddd90c7a7ecedc5ebb563934f460452");

    },

    testWebsocketExample: function(){
        var hex = JSSHA1Hash("dGhlIHNhbXBsZSBub25jZQ==258EAFA5-E914-47DA-95CA-C5AB0DC85B11".utf8()).hexStringRepresentation();
        TKAssertEquals(hex, "b37a4f2cc0624f1690f64606cf385945b2bec4ea");
    }

});