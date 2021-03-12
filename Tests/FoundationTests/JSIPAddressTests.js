// #import Foundation
// #import TestKit
'use strict';

JSClass("JSIPAddressTests", TKTestSuite, {

    testInitWithStringV4: function(){
        var address = JSIPAddress.initWithString("1.2.3.4");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 4);
        TKAssertEquals(address.data[0], 1);
        TKAssertEquals(address.data[1], 2);
        TKAssertEquals(address.data[2], 3);
        TKAssertEquals(address.data[3], 4);

        address = JSIPAddress.initWithString("111.222.33.44");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 4);
        TKAssertEquals(address.data[0], 111);
        TKAssertEquals(address.data[1], 222);
        TKAssertEquals(address.data[2], 33);
        TKAssertEquals(address.data[3], 44);
    },

    testInitWithStringV6: function(){
        var address = JSIPAddress.initWithString("FEDC:BA98:7654:3210:FEDC:BA98:7654:3210");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0xFE);
        TKAssertEquals(address.data[1], 0xDC);
        TKAssertEquals(address.data[2], 0xBA);
        TKAssertEquals(address.data[3], 0x98);
        TKAssertEquals(address.data[4], 0x76);
        TKAssertEquals(address.data[5], 0x54);
        TKAssertEquals(address.data[6], 0x32);
        TKAssertEquals(address.data[7], 0x10);
        TKAssertEquals(address.data[8], 0xFE);
        TKAssertEquals(address.data[9], 0xDC);
        TKAssertEquals(address.data[10], 0xBA);
        TKAssertEquals(address.data[11], 0x98);
        TKAssertEquals(address.data[12], 0x76);
        TKAssertEquals(address.data[13], 0x54);
        TKAssertEquals(address.data[14], 0x32);
        TKAssertEquals(address.data[15], 0x10);

        address = JSIPAddress.initWithString("1080:0:0:0:8:800:200C:417A");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x10);
        TKAssertEquals(address.data[1], 0x80);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x08);
        TKAssertEquals(address.data[10], 0x08);
        TKAssertEquals(address.data[11], 0x00);
        TKAssertEquals(address.data[12], 0x20);
        TKAssertEquals(address.data[13], 0x0C);
        TKAssertEquals(address.data[14], 0x41);
        TKAssertEquals(address.data[15], 0x7A);

        address = JSIPAddress.initWithString("1080::8:800:200C:417A");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x10);
        TKAssertEquals(address.data[1], 0x80);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x08);
        TKAssertEquals(address.data[10], 0x08);
        TKAssertEquals(address.data[11], 0x00);
        TKAssertEquals(address.data[12], 0x20);
        TKAssertEquals(address.data[13], 0x0C);
        TKAssertEquals(address.data[14], 0x41);
        TKAssertEquals(address.data[15], 0x7A);

        address = JSIPAddress.initWithString("FF01::101");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0xFF);
        TKAssertEquals(address.data[1], 0x01);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x00);
        TKAssertEquals(address.data[10], 0x00);
        TKAssertEquals(address.data[11], 0x00);
        TKAssertEquals(address.data[12], 0x00);
        TKAssertEquals(address.data[13], 0x00);
        TKAssertEquals(address.data[14], 0x01);
        TKAssertEquals(address.data[15], 0x01);

        address = JSIPAddress.initWithString("::1");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x00);
        TKAssertEquals(address.data[1], 0x00);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x00);
        TKAssertEquals(address.data[10], 0x00);
        TKAssertEquals(address.data[11], 0x00);
        TKAssertEquals(address.data[12], 0x00);
        TKAssertEquals(address.data[13], 0x00);
        TKAssertEquals(address.data[14], 0x00);
        TKAssertEquals(address.data[15], 0x01);

        address = JSIPAddress.initWithString("::");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x00);
        TKAssertEquals(address.data[1], 0x00);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x00);
        TKAssertEquals(address.data[10], 0x00);
        TKAssertEquals(address.data[11], 0x00);
        TKAssertEquals(address.data[12], 0x00);
        TKAssertEquals(address.data[13], 0x00);
        TKAssertEquals(address.data[14], 0x00);
        TKAssertEquals(address.data[15], 0x00);

        address = JSIPAddress.initWithString("0:0:0:0:0:0:13.1.68.3");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x00);
        TKAssertEquals(address.data[1], 0x00);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x00);
        TKAssertEquals(address.data[10], 0x00);
        TKAssertEquals(address.data[11], 0x00);
        TKAssertEquals(address.data[12], 0x0d);
        TKAssertEquals(address.data[13], 0x01);
        TKAssertEquals(address.data[14], 0x44);
        TKAssertEquals(address.data[15], 0x03);

        address = JSIPAddress.initWithString("0:0:0:0:0:FFFF:129.144.52.38");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x00);
        TKAssertEquals(address.data[1], 0x00);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x00);
        TKAssertEquals(address.data[10], 0xFF);
        TKAssertEquals(address.data[11], 0xFF);
        TKAssertEquals(address.data[12], 0x81);
        TKAssertEquals(address.data[13], 0x90);
        TKAssertEquals(address.data[14], 0x34);
        TKAssertEquals(address.data[15], 0x26);

        address = JSIPAddress.initWithString("::13.1.68.3");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x00);
        TKAssertEquals(address.data[1], 0x00);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x00);
        TKAssertEquals(address.data[10], 0x00);
        TKAssertEquals(address.data[11], 0x00);
        TKAssertEquals(address.data[12], 0x0d);
        TKAssertEquals(address.data[13], 0x01);
        TKAssertEquals(address.data[14], 0x44);
        TKAssertEquals(address.data[15], 0x03);

        address = JSIPAddress.initWithString("::ffff:129.144.52.38");
        TKAssertNotNull(address);
        TKAssertEquals(address.data.length, 16);
        TKAssertEquals(address.data[0], 0x00);
        TKAssertEquals(address.data[1], 0x00);
        TKAssertEquals(address.data[2], 0x00);
        TKAssertEquals(address.data[3], 0x00);
        TKAssertEquals(address.data[4], 0x00);
        TKAssertEquals(address.data[5], 0x00);
        TKAssertEquals(address.data[6], 0x00);
        TKAssertEquals(address.data[7], 0x00);
        TKAssertEquals(address.data[8], 0x00);
        TKAssertEquals(address.data[9], 0x00);
        TKAssertEquals(address.data[10], 0xFF);
        TKAssertEquals(address.data[11], 0xFF);
        TKAssertEquals(address.data[12], 0x81);
        TKAssertEquals(address.data[13], 0x90);
        TKAssertEquals(address.data[14], 0x34);
        TKAssertEquals(address.data[15], 0x26);
    },

    testStringRepresentationV4: function(){
        var address = JSIPAddress.initWithData(JSData.initWithArray([1, 2, 3, 4]));
        var str = address.stringRepresentation();
        TKAssertEquals(str, "1.2.3.4");

        address = JSIPAddress.initWithData(JSData.initWithArray([111, 222, 33, 44]));
        str = address.stringRepresentation();
        TKAssertEquals(str, "111.222.33.44");
    },

    testStringRepresentationV6: function(){
        var address = JSIPAddress.initWithString("0:0:0:0:0:0:13.1.68.3");
        var str = address.stringRepresentation();
        TKAssertEquals(str, "::13.1.68.3");

        address = JSIPAddress.initWithString("0:0:0:0:0:FFFF:129.144.52.38");
        str = address.stringRepresentation();
        TKAssertEquals(str, "::ffff:129.144.52.38");

        address = JSIPAddress.initWithString("FEDC:BA98:7654:3210:FEDC:BA98:7654:3210");
        str = address.stringRepresentation();
        TKAssertEquals(str, "fedc:ba98:7654:3210:fedc:ba98:7654:3210");

        address = JSIPAddress.initWithString("::1");
        str = address.stringRepresentation();
        TKAssertEquals(str, "::1");

        address = JSIPAddress.initWithString("0:0:0:0:0:0:0:1");
        str = address.stringRepresentation();
        TKAssertEquals(str, "::1");

        address = JSIPAddress.initWithString("::");
        str = address.stringRepresentation();
        TKAssertEquals(str, "::");

        address = JSIPAddress.initWithString("0:0:0:0:0:0:0:0");
        str = address.stringRepresentation();
        TKAssertEquals(str, "::");
    }

});