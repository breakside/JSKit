// #import Foundation
// #import TestKit
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSRange, JSData */
'use strict';

JSClass('JSDataTests', TKTestSuite, {

    testArrayConstructor: function(){
        var data = JSData.initWithArray([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
        TKAssertEquals(data.length, 6);
        TKAssertEquals(data[0], 0x00);
        TKAssertEquals(data[1], 0x01);
        TKAssertEquals(data[2], 0x02);
        TKAssertEquals(data[3], 0x03);
        TKAssertEquals(data[4], 0x04);
        TKAssertEquals(data[5], 0x05);
    },

    testChunksConstructor: function(){
        var chunk1 = JSData.initWithArray([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
        var chunk2 = JSData.initWithArray([0x0a, 0x09, 0x08, 0x07, 0x06]);
        var data = JSData.initWithChunks([chunk1, chunk2]);
        TKAssertEquals(data.length, 11);
        TKAssertEquals(data[0], 0x00);
        TKAssertEquals(data[1], 0x01);
        TKAssertEquals(data[2], 0x02);
        TKAssertEquals(data[3], 0x03);
        TKAssertEquals(data[4], 0x04);
        TKAssertEquals(data[5], 0x05);
        TKAssertEquals(data[6], 0x0a);
        TKAssertEquals(data[7], 0x09);
        TKAssertEquals(data[8], 0x08);
        TKAssertEquals(data[9], 0x07);
        TKAssertEquals(data[10], 0x06);
    },

    testSubdata: function(){
        var data = JSData.initWithArray([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
        var subset = data.subdataInRange(JSRange(3, 2));
        TKAssertEquals(subset.length, 2);
        TKAssertEquals(subset[0], 0x03);
        TKAssertEquals(subset[1], 0x04);
        subset = data.subdataInRange(JSRange(1, 3));
        TKAssertEquals(subset.length, 3);
        TKAssertEquals(subset[0], 0x01);
        TKAssertEquals(subset[1], 0x02);
        TKAssertEquals(subset[2], 0x03);
    },

    testCopyTo: function(){
        var a = JSData.initWithArray([1,2,3,4,5]);
        var b = JSData.initWithArray([6,7,8,9,0]);
        b.copyTo(a);
        TKAssertEquals(a[0], 6);
        TKAssertEquals(a[1], 7);
        TKAssertEquals(a[2], 8);
        TKAssertEquals(a[3], 9);
        TKAssertEquals(a[4], 0);

        b.copyTo(a, 3);
        TKAssertEquals(a[0], 6);
        TKAssertEquals(a[1], 7);
        TKAssertEquals(a[2], 8);
        TKAssertEquals(a[3], 6);
        TKAssertEquals(a[4], 7);

        b.subdataInRange(JSRange(0, 2)).copyTo(a, 2);
        TKAssertEquals(a[0], 6);
        TKAssertEquals(a[1], 7);
        TKAssertEquals(a[2], 6);
        TKAssertEquals(a[3], 7);
        TKAssertEquals(a[4], 7);

        b.subdataInRange(JSRange(2, 2)).copyTo(a, 4);
        TKAssertEquals(a[0], 6);
        TKAssertEquals(a[1], 7);
        TKAssertEquals(a[2], 6);
        TKAssertEquals(a[3], 7);
        TKAssertEquals(a[4], 8);
    }

});