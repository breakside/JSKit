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
"use strict";

JSClass("JSZipTests", TKTestSuite, {

    testSingleTextFile: function(){
        var zip = JSZip.init();
        var data = "hello\n".utf8();
        var file = JSFile.initWithData(data, "test.txt", JSMediaType("text/plain"));
        var expectation = TKExpectation.init();
        expectation.call(zip.addFile, zip, file, function(error){
            TKAssertNull(error);
            expectation.call(zip.close, zip, function(error){
                TKAssertNull(error);
                TKAssertEquals(zip.data[0], 0x50);
                TKAssertEquals(zip.data[1], 0x4B);
                TKAssertEquals(zip.data[2], 0x03);
                TKAssertEquals(zip.data[3], 0x04);
                TKAssertEquals(zip.data[4], 20);
                TKAssertEquals(zip.data[14], 0x20);
                TKAssertEquals(zip.data[15], 0x30);
                TKAssertEquals(zip.data[16], 0x3A);
                TKAssertEquals(zip.data[17], 0x36);
                TKAssertEquals(zip.data[18], 0x06);
                TKAssertEquals(zip.data[19], 0x00);
                TKAssertEquals(zip.data[20], 0x00);
                TKAssertEquals(zip.data[21], 0x00);
                TKAssertEquals(zip.data[22], 0x06);
                TKAssertEquals(zip.data[23], 0x00);
                TKAssertEquals(zip.data[24], 0x00);
                TKAssertEquals(zip.data[25], 0x00);
                // TODO: better checks
            });
        });
        this.wait(expectation, 2.0);
    }

});