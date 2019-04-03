// #import Foundation
// #import Testkit
/* global File, JSClass, TKTestSuite, JSData, JSFile, JSRange, JSHTMLFile, TKExpectation */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSHTMLFileTests", TKTestSuite, {

    requiredEnvironment: 'html',

    testHTMLFile: function(){
        var bytes = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        TKAssertNotNull(file);
        TKAssertEquals(file.size, 4);
        TKAssertEquals(file.name, "test.dat");
        TKAssertEquals(file.contentType, "application/octet-stream");
    },

    testReadHTMLFile: function(){
        var bytes = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        var expectation = TKExpectation.init();
        expectation.call(file.readData, file, function(readData){
            TKAssertNotNull(readData);
            TKAssertObjectEquals(bytes, readData);
        });
        this.wait(expectation, 1.0);
    },

    testReadHTMLFilePromise: function(){
        var bytes = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        var expectation = TKExpectation.init();
        var promise = file.readData();
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(readData){
            TKAssertNotNull(readData);
            TKAssertObjectEquals(bytes, readData);
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 1.0);
    },

    testReadHTMLFileRange: function(){
        var bytes = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
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

    testReadHTMLFileRangePromise: function(){
        var bytes = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        var expectation = TKExpectation.init();
        var range = JSRange(1, 2);
        var promise = file.readDataRange(range);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(readData){
            TKAssertNotNull(readData);
            TKAssertEquals(readData.length, 2);
            TKAssertEquals(readData[0], 0x02);
            TKAssertEquals(readData[1], 0x03);
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 1.0);
    },

    testHTMLFileURL: function(){
        var bytes = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        var url = file.url;
        TKAssertNotNull(url);
        TKAssertEquals(url.scheme, 'blob');
    },

    testDataFileURL: function(){
        var data = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
        var url = file.url;
        TKAssertNotNull(url);
        TKAssertEquals(url.scheme, 'blob');
    }

});