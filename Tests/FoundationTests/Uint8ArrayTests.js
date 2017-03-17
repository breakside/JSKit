// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
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

    testHexString: function(){
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
    }

});