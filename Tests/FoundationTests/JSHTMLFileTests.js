// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global File, JSClass, TKTestSuite, JSData, JSFile, JSHTMLFile, TKExpectation */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSHTMLFileTests", TKTestSuite, {

    requiredEnvironment: 'html',

    testHTMLFile: function(){
        var bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        TKAssertNotNull(file);
        TKAssertEquals(file.size, 4);
        TKAssertEquals(file.name, "test.dat");
        TKAssertEquals(file.contentType, "application/octet-stream");
    },

    testReadHTMLFile: function(){
        var bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        var expectation = TKExpectation.init();
        expectation.call(file.readData, file, function(readData){
            TKAssertNotNull(readData);
            TKAssertObjectEquals(bytes, readData.bytes);
        });
        this.wait(expectation, 1.0);
    },

    testHTMLFileURL: function(){
        var bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        var blob = new File([bytes], "test.dat", {type: "application/octet-stream"});
        var file = JSHTMLFile.initWithFile(blob);
        var url = file.url;
        TKAssertNotNull(url);
        TKAssertEquals(url.scheme, 'blob');
    },

    testDataFileURL: function(){
        var bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        var data = JSData.initWithBytes(bytes);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
        var url = file.url;
        TKAssertNotNull(url);
        TKAssertEquals(url.scheme, 'blob');
    }

});