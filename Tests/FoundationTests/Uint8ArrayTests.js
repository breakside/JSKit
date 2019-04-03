// #import Foundation
// #import Testkit
/* global JSClass, TKTestSuite, JSRange, TKAssertNotNull, TKAssertEquals, TKAssertEquals */
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
    }

});