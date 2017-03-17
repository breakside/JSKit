// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSRange, JSData */
'use strict';

JSClass('JSDataTests', TKTestSuite, {

    testBytesConstructor: function(){
        var bytes = Uint8Array.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
        var data = JSData.initWithBytes(bytes);
        TKAssertEquals(data.length, 6);
        TKAssertEquals(data.bytes[0], 0x00);
        TKAssertEquals(data.bytes[1], 0x01);
        TKAssertEquals(data.bytes[2], 0x02);
        TKAssertEquals(data.bytes[3], 0x03);
        TKAssertEquals(data.bytes[4], 0x04);
        TKAssertEquals(data.bytes[5], 0x05);
    },

    testSubdata: function(){
        var bytes = Uint8Array.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
        var data = JSData.initWithBytes(bytes);
        var subset = data.subdataInRange(JSRange(3, 2));
        TKAssertEquals(subset.length, 2);
        TKAssertEquals(subset.bytes[0], 0x03);
        TKAssertEquals(subset.bytes[1], 0x04);
        subset = data.subdataInRange(JSRange(1, 3));
        TKAssertEquals(subset.length, 3);
        TKAssertEquals(subset.bytes[0], 0x01);
        TKAssertEquals(subset.bytes[1], 0x02);
        TKAssertEquals(subset.bytes[2], 0x03);
    }

});