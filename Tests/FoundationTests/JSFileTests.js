// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSData, JSFile, JSRange, TKExpectation */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSFileTests", TKTestSuite, {

    testDataFile: function(){
        var data = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
        TKAssertNotNull(file);
        TKAssertEquals(file.size, 4);
        TKAssertEquals(file.name, "test.dat");
        TKAssertEquals(file.contentType, "application/octet-stream");
    },

    testReadDataFile: function(){
        var data = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
        var expectation = TKExpectation.init();
        expectation.call(file.readData, file, function(readData){
            TKAssertNotNull(readData);
            TKAssertObjectEquals(data, readData);
        });
        this.wait(expectation, 1.0);
    },

    testReadDataFileRange: function(){
        var data = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
        var expectation = TKExpectation.init();
        var range = JSRange(1, 2);
        expectation.call(file.readDataRange, file, range, function(readData){
            TKAssertNotNull(readData);
            TKAssertEquals(readData.length, 2);
            TKAssertEquals(readData[0], 0x02);
            TKAssertEquals(readData[1], 0x03);
        });
        this.wait(expectation, 1.0);
    },

});