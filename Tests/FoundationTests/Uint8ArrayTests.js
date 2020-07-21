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

JSClass('Uint8ArrayTests', TKTestSuite, {

    testZero: function(){
        var bytes = Uint8Array.from([0x01, 0x02, 0x03]);
        bytes.zero();
        TKAssertEquals(bytes[0], 0x00);
        TKAssertEquals(bytes[1], 0x00);
        TKAssertEquals(bytes[2], 0x00);
    },

    testHexStringRepresentation: function(){
        var bytes = Uint8Array.from([0x01, 0x02, 0x03, 0xAB, 0x1F]);
        var hex = bytes.hexStringRepresentation();
        TKAssertEquals(hex, "010203ab1f");
    },

    testUTF8: function(){
        var bytes = Uint8Array.from([0x48, 0xc3, 0xa8, 0x6c, 0x6c, 0x6f]);
        var str = bytes.stringByDecodingUTF8();
        TKAssertEquals(str, "Hèllo");

        bytes = Uint8Array.from([0xf0, 0x9f, 0x98, 0x80]);
        str = bytes.stringByDecodingUTF8();
        TKAssertEquals(str, "😀");
    },

    testBase64StringRepresentation: function(){
        TKAssertEquals("".utf8().base64StringRepresentation(), "");
        TKAssertEquals("f".utf8().base64StringRepresentation(), "Zg==");
        TKAssertEquals("fo".utf8().base64StringRepresentation(), "Zm8=");
        TKAssertEquals("foo".utf8().base64StringRepresentation(), "Zm9v");
        TKAssertEquals("foob".utf8().base64StringRepresentation(), "Zm9vYg==");
        TKAssertEquals("fooba".utf8().base64StringRepresentation(), "Zm9vYmE=");
        TKAssertEquals("foobar".utf8().base64StringRepresentation(), "Zm9vYmFy");
        TKAssertEquals(new Uint8Array([0xb3, 0x7a, 0x4f, 0x2c, 0xc0, 0x62, 0x4f, 0x16, 0x90, 0xf6, 0x46, 0x06, 0xcf, 0x38, 0x59, 0x45, 0xb2, 0xbe, 0xc4, 0xea]).base64StringRepresentation(), "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=");
        TKAssertEquals(JSData.initWithArray([0xfb, 0xff]).base64StringRepresentation(), "+/8=");
    },

    testBase64URLStringRepresentation: function(){
        TKAssertEquals("".utf8().base64URLStringRepresentation(), "");
        TKAssertEquals("f".utf8().base64URLStringRepresentation(), "Zg");
        TKAssertEquals("fo".utf8().base64URLStringRepresentation(), "Zm8");
        TKAssertEquals("foo".utf8().base64URLStringRepresentation(), "Zm9v");
        TKAssertEquals("foob".utf8().base64URLStringRepresentation(), "Zm9vYg");
        TKAssertEquals("fooba".utf8().base64URLStringRepresentation(), "Zm9vYmE");
        TKAssertEquals("foobar".utf8().base64URLStringRepresentation(), "Zm9vYmFy");
        TKAssertEquals(new Uint8Array([0xb3, 0x7a, 0x4f, 0x2c, 0xc0, 0x62, 0x4f, 0x16, 0x90, 0xf6, 0x46, 0x06, 0xcf, 0x38, 0x59, 0x45, 0xb2, 0xbe, 0xc4, 0xea]).base64URLStringRepresentation(), "s3pPLMBiTxaQ9kYGzzhZRbK-xOo");
        TKAssertEquals(JSData.initWithArray([0xfb, 0xff]).base64URLStringRepresentation(), "-_8");
    },

    testBase32StringRepresentation: function(){
        TKAssertEquals("".utf8().base32StringRepresentation(), "");
        TKAssertEquals("f".utf8().base32StringRepresentation(), "MY======");
        TKAssertEquals("fo".utf8().base32StringRepresentation(), "MZXQ====");
        TKAssertEquals("foo".utf8().base32StringRepresentation(), "MZXW6===");
        TKAssertEquals("foob".utf8().base32StringRepresentation(), "MZXW6YQ=");
        TKAssertEquals("fooba".utf8().base32StringRepresentation(), "MZXW6YTB");
        TKAssertEquals("foobar".utf8().base32StringRepresentation(), "MZXW6YTBOI======");
        TKAssertEquals(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x21, 0xDE, 0xAD, 0xBE, 0xEF]).base32StringRepresentation(), "JBSWY3DPEHPK3PXP");
    },

});