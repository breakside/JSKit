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

    testStringRepresentationV4: function(){
        var address = JSIPAddress.initWithData(JSData.initWithArray([1, 2, 3, 4]));
        var str = address.stringRepresentation();
        TKAssertEquals(str, "1.2.3.4");

        address = JSIPAddress.initWithData(JSData.initWithArray([111, 222, 33, 44]));
        str = address.stringRepresentation();
        TKAssertEquals(str, "111.222.33.44");
    }

});