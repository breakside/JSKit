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

JSClass("SECCBORTests", TKTestSuite, {

    testParse: function(){
        // integers
        var data = "00".dataByDecodingHex();
        var value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 0);
        data = "01".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 1);
        data = "0a".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 10);
        data = "17".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 23);
        data = "1818".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 24);
        data = "1864".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 100);
        data = "1903e8".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 1000);
        data = "1a000f4240".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 1000000);
        data = "1b000000e8d4a51000".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, 1000000000000);
        data = "1bffffffffffffffff".dataByDecodingHex();
        // big int
        // value = SECCBOR.parse(data);
        // TKAssertType(value, "number");
        // TKAssertExactEquals(value, 18446744073709551615);
        // data = "c249010000000000000000".dataByDecodingHex();
        // value = SECCBOR.parse(data);
        // TKAssertType(value, "number");
        // TKAssertExactEquals(value, 18446744073709551616);
        // data = "3bffffffffffffffff".dataByDecodingHex();
        // value = SECCBOR.parse(data);
        // TKAssertType(value, "number");
        // TKAssertExactEquals(value, -18446744073709551616);
        // data = "c349010000000000000000".dataByDecodingHex();
        // value = SECCBOR.parse(data);
        // TKAssertType(value, "number");
        // TKAssertExactEquals(value, -18446744073709551617);
        data = "20".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, -1);
        data = "29".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, -10);
        data = "3863".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, -100);
        data = "3863".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, -100);
        data = "3903e7".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "number");
        TKAssertExactEquals(value, -1000);

        // TODO: floats

        // data
        data = "f4".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "boolean");
        TKAssertExactEquals(value, false);
        data = "f5".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "boolean");
        TKAssertExactEquals(value, true);
        data = "f6".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertNull(value);
        data = "f7".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertUndefined(value);
        data = "40".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof JSData);
        TKAssertEquals(value.length, 0);
        data = "4401020304".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof JSData);
        TKAssertEquals(value.length, 4);
        TKAssertEquals(value[0], 0x01);
        TKAssertEquals(value[1], 0x02);
        TKAssertEquals(value[2], 0x03);
        TKAssertEquals(value[3], 0x04);
        data = "5f42010243030405ff".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof JSData);
        TKAssertEquals(value.length, 5);
        TKAssertEquals(value[0], 0x01);
        TKAssertEquals(value[1], 0x02);
        TKAssertEquals(value[2], 0x03);
        TKAssertEquals(value[3], 0x04);
        TKAssertEquals(value[4], 0x05);

        // strings
        data = "60".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "");
        data = "6161".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "a");
        data = "6449455446".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "IETF");
        data = "62225c".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "\"\\");
        data = "62c3bc".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "\u00fc");
        data = "63e6b0b4".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "\u6c34");
        data = "64f0908591".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "\ud800\udd51");
        data = "7f657374726561646d696e67ff".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "string");
        TKAssertEquals(value, "streaming");

        // arrays
        data = "80".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof Array);
        TKAssertEquals(value.length, 0);
        data = "83010203".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof Array);
        TKAssertEquals(value.length, 3);
        TKAssertExactEquals(value[0], 1);
        TKAssertExactEquals(value[1], 2);
        TKAssertExactEquals(value[2], 3);
        data = "8301820203820405".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof Array);
        TKAssertEquals(value.length, 3);
        TKAssertExactEquals(value[0], 1);
        TKAssert(value[1] instanceof Array);
        TKAssertEquals(value[1].length, 2);
        TKAssertEquals(value[1][0], 2);
        TKAssertEquals(value[1][1], 3);
        TKAssert(value[2] instanceof Array);
        TKAssertEquals(value[2].length, 2);
        TKAssertEquals(value[2][0], 4);
        TKAssertEquals(value[2][1], 5);
        data = "98190102030405060708090a0b0c0d0e0f101112131415161718181819".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof Array);
        TKAssertEquals(value.length, 25);
        TKAssertEquals(value[0], 1);
        TKAssertEquals(value[10], 11);
        TKAssertEquals(value[24], 25);
        data = "9fff".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof Array);
        TKAssertEquals(value.length, 0);
        data = "9f018202039f0405ffff".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof Array);
        TKAssertEquals(value.length, 3);
        TKAssertExactEquals(value[0], 1);
        TKAssert(value[1] instanceof Array);
        TKAssertEquals(value[1].length, 2);
        TKAssertEquals(value[1][0], 2);
        TKAssertEquals(value[1][1], 3);
        TKAssert(value[2] instanceof Array);
        TKAssertEquals(value[2].length, 2);
        TKAssertEquals(value[2][0], 4);
        TKAssertEquals(value[2][1], 5);
        data = "9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssert(value instanceof Array);
        TKAssertEquals(value.length, 25);
        TKAssertEquals(value[0], 1);
        TKAssertEquals(value[10], 11);
        TKAssertEquals(value[24], 25);

        // dictionaries
        data = "a0".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "object");
        TKAssertEquals(Object.keys(value).length, 0);
        data = "a201020304".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "object");
        TKAssert(!(value instanceof Array));
        TKAssertEquals(Object.keys(value).length, 2);
        TKAssertExactEquals(value[1], 2);
        TKAssertExactEquals(value[3], 4);
        data = "a26161016162820203".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "object");
        TKAssert(!(value instanceof Array));
        TKAssertEquals(Object.keys(value).length, 2);
        TKAssertExactEquals(value.a, 1);
        TKAssert(value.b instanceof Array);
        TKAssertEquals(value.b.length, 2);
        TKAssertExactEquals(value.b[0], 2);
        TKAssertExactEquals(value.b[1], 3);
        data = "a56161614161626142616361436164614461656145".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "object");
        TKAssert(!(value instanceof Array));
        TKAssertEquals(Object.keys(value).length, 5);
        TKAssertExactEquals(value.a, "A");
        TKAssertExactEquals(value.b, "B");
        TKAssertExactEquals(value.c, "C");
        TKAssertExactEquals(value.d, "D");
        TKAssertExactEquals(value.e, "E");
        data = "bf61610161629f0203ffff".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "object");
        TKAssert(!(value instanceof Array));
        TKAssertEquals(Object.keys(value).length, 2);
        TKAssertExactEquals(value.a, 1);
        TKAssert(value.b instanceof Array);
        TKAssertEquals(value.b.length, 2);
        TKAssertExactEquals(value.b[0], 2);
        TKAssertExactEquals(value.b[1], 3);
        data = "bf6346756ef563416d7421ff".dataByDecodingHex();
        value = SECCBOR.parse(data);
        TKAssertType(value, "object");
        TKAssert(!(value instanceof Array));
        TKAssertEquals(Object.keys(value).length, 2);
        TKAssertExactEquals(value.Fun, true);
        TKAssertExactEquals(value.Amt, -2);
    },

});