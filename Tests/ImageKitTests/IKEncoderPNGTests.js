// #import ImageKit
// #import TestKit
/* global JSClass, TKTestSuite, IKEncoderPNG, JSData, Promise, IKBitmap, JSSize */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("IKEncoderPNGTests", TKTestSuite, {

    testBasicPNG: function(){
        var bitmapData = JSData.initWithArray([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
        var bitmap = IKBitmap.initWithData(bitmapData, JSSize(2,2));
        var encoder = IKEncoderPNG.initWithBitmap(bitmap);
        var data = encoder.getData();
        TKAssertNotNull(data);
        var bitmap2 = IKBitmap.initWithEncodedData(data);
        TKAssertNotNull(bitmap2);
        TKAssertNotNull(bitmap2.data);
        TKAssertNotNull(bitmap2.size);
        TKAssertEquals(bitmap2.size.width, 2);
        TKAssertEquals(bitmap2.size.height, 2);
        TKAssertEquals(bitmap2.data.length, 16);
        TKAssertEquals(bitmap2.data[0], 255);
        TKAssertEquals(bitmap2.data[1], 0);
        TKAssertEquals(bitmap2.data[2], 0);
        TKAssertEquals(bitmap2.data[3], 255);
        TKAssertEquals(bitmap2.data[4], 0);
        TKAssertEquals(bitmap2.data[5], 255);
        TKAssertEquals(bitmap2.data[6], 0);
        TKAssertEquals(bitmap2.data[7], 255);
        TKAssertEquals(bitmap2.data[8], 0);
        TKAssertEquals(bitmap2.data[9], 0);
        TKAssertEquals(bitmap2.data[10], 255);
        TKAssertEquals(bitmap2.data[11], 255);
        TKAssertEquals(bitmap2.data[12], 255);
        TKAssertEquals(bitmap2.data[13], 255);
        TKAssertEquals(bitmap2.data[14], 255);
        TKAssertEquals(bitmap2.data[15], 255);
    }

});