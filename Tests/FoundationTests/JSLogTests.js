// #import Foundation
// #import TestKit
"use strict";

JSClass("JSLogTests", TKTestSuite, {

    testLogBuffer: function(){
        var buffer = JSLog._createBuffer(5);
        buffer.write(1);
        buffer.write(2);
        buffer.write(3);
        buffer.write(4);
        var records = buffer.readAll();
        TKAssertEquals(records.length, 4);
        TKAssertEquals(records[0], 1);
        TKAssertEquals(records[1], 2);
        TKAssertEquals(records[2], 3);
        TKAssertEquals(records[3], 4);

        buffer.write(5);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 1);
        TKAssertEquals(records[1], 2);
        TKAssertEquals(records[2], 3);
        TKAssertEquals(records[3], 4);
        TKAssertEquals(records[4], 5);

        buffer.write(6);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 2);
        TKAssertEquals(records[1], 3);
        TKAssertEquals(records[2], 4);
        TKAssertEquals(records[3], 5);
        TKAssertEquals(records[4], 6);

        buffer.write(7);
        buffer.write(8);
        buffer.write(9);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 5);
        TKAssertEquals(records[1], 6);
        TKAssertEquals(records[2], 7);
        TKAssertEquals(records[3], 8);
        TKAssertEquals(records[4], 9);

        buffer.write(10);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 6);
        TKAssertEquals(records[1], 7);
        TKAssertEquals(records[2], 8);
        TKAssertEquals(records[3], 9);
        TKAssertEquals(records[4], 10);

        buffer.write(11);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 7);
        TKAssertEquals(records[1], 8);
        TKAssertEquals(records[2], 9);
        TKAssertEquals(records[3], 10);
        TKAssertEquals(records[4], 11);
    }

});