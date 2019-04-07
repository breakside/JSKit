// #import ImageKit
// #import TestKit
/* global JSClass, TKTestSuite, IKDecoderPNG, JSData, Promise */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("IKDecoderPNGTests", TKTestSuite, {

    testBasicPNG: function(){
        var data = JSData.initWithArray([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x02,0x00,0x00,0x00,0x02,0x08,0x02,0x00,0x00,0x00,0xFD,0xD4,0x9A,0x73,0x00,0x00,0x00,0x01,0x73,0x52,0x47,0x42,0x00,0xAE,0xCE,0x1C,0xE9,0x00,0x00,0x00,0x15,0x49,0x44,0x41,0x54,0x08,0x1D,0x63,0xF8,0xCF,0xC0,0xC0,0xF0,0x9F,0x81,0x11,0x48,0xFC,0xFF,0xCF,0x00,0x00,0x1E,0xF6,0x04,0xFD,0xA0,0x06,0x5A,0x06,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
        var decoder = IKDecoderPNG.initWithData(data);
        var bitmap = decoder.getBitmap();
        TKAssertNull(decoder.error);
        TKAssertNotNull(bitmap);
        TKAssertNotNull(bitmap.data);
        TKAssertNotNull(bitmap.size);
        TKAssertEquals(bitmap.size.width, 2);
        TKAssertEquals(bitmap.size.height, 2);
        TKAssertEquals(bitmap.data.length, 16);
        TKAssertEquals(bitmap.data[0], 255);
        TKAssertEquals(bitmap.data[1], 0);
        TKAssertEquals(bitmap.data[2], 0);
        TKAssertEquals(bitmap.data[3], 255);
        TKAssertEquals(bitmap.data[4], 0);
        TKAssertEquals(bitmap.data[5], 255);
        TKAssertEquals(bitmap.data[6], 0);
        TKAssertEquals(bitmap.data[7], 255);
        TKAssertEquals(bitmap.data[8], 0);
        TKAssertEquals(bitmap.data[9], 0);
        TKAssertEquals(bitmap.data[10], 255);
        TKAssertEquals(bitmap.data[11], 255);
        TKAssertEquals(bitmap.data[12], 255);
        TKAssertEquals(bitmap.data[13], 255);
        TKAssertEquals(bitmap.data[14], 255);
        TKAssertEquals(bitmap.data[15], 255);
    }

});