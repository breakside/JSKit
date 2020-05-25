// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import TestKit
'use strict';

JSClass("JSFileTests", TKTestSuite, {

    testDataFile: function(){
        var data = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
        TKAssertNotNull(file);
        TKAssertEquals(file.size, 4);
        TKAssertEquals(file.name, "test.dat");
        TKAssertNotNull(file.contentType);
        TKAssertEquals(file.contentType.mime, "application/octet-stream");
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

    testReadDataFilePromise: function(){
        var data = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
        var expectation = TKExpectation.init();
        var promise = file.readData();
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(readData){
            TKAssertNotNull(readData);
            TKAssertObjectEquals(data, readData);
        }, function(error){
            TKAssert();
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

    testReadDataFileRangePromise: function(){
        var data = JSData.initWithArray([0x01, 0x02, 0x03, 0x04]);
        var file = JSFile.initWithData(data, "test.dat", "application/octet-stream");
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

});