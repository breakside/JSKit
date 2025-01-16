// Copyright 2021 Breakside Inc.
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
        TKAssertEquals(buffer.read(0), 1);
        TKAssertEquals(buffer.read(1), 2);
        TKAssertEquals(buffer.read(-1), 4);
        TKAssertEquals(buffer.read(-2), 3);

        buffer.write(5);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 1);
        TKAssertEquals(records[1], 2);
        TKAssertEquals(records[2], 3);
        TKAssertEquals(records[3], 4);
        TKAssertEquals(records[4], 5);
        TKAssertEquals(buffer.read(0), 1);
        TKAssertEquals(buffer.read(1), 2);
        TKAssertEquals(buffer.read(-1), 5);
        TKAssertEquals(buffer.read(-2), 4);

        buffer.write(6);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 2);
        TKAssertEquals(records[1], 3);
        TKAssertEquals(records[2], 4);
        TKAssertEquals(records[3], 5);
        TKAssertEquals(records[4], 6);
        TKAssertEquals(buffer.read(0), 2);
        TKAssertEquals(buffer.read(1), 3);
        TKAssertEquals(buffer.read(-1), 6);
        TKAssertEquals(buffer.read(-2), 5);

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
        TKAssertEquals(buffer.read(0), 5);
        TKAssertEquals(buffer.read(1), 6);
        TKAssertEquals(buffer.read(-1), 9);
        TKAssertEquals(buffer.read(-2), 8);

        buffer.write(10);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 6);
        TKAssertEquals(records[1], 7);
        TKAssertEquals(records[2], 8);
        TKAssertEquals(records[3], 9);
        TKAssertEquals(records[4], 10);
        TKAssertEquals(buffer.read(0), 6);
        TKAssertEquals(buffer.read(1), 7);
        TKAssertEquals(buffer.read(-1), 10);
        TKAssertEquals(buffer.read(-2), 9);

        buffer.write(11);
        records = buffer.readAll();
        TKAssertEquals(records.length, 5);
        TKAssertEquals(records[0], 7);
        TKAssertEquals(records[1], 8);
        TKAssertEquals(records[2], 9);
        TKAssertEquals(records[3], 10);
        TKAssertEquals(records[4], 11);
        TKAssertEquals(buffer.read(0), 7);
        TKAssertEquals(buffer.read(1), 8);
        TKAssertEquals(buffer.read(-1), 11);
        TKAssertEquals(buffer.read(-2), 10);
    }

});