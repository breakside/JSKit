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

JSClass("JSIndexRangeTests", TKTestSuite, {

    testConstructor: function(){
        // must have start and end
        TKAssertThrows(function(){
            var a = JSIndexRange();
        });
        TKAssertThrows(function(){
            var a = JSIndexRange(0);
        });

        // start must be <= end
        TKAssertThrows(function(){
            var a = JSIndexRange(1,0);
        });

        // start can == end
        var a = JSIndexRange(1,1);
        TKAssertEquals(a.start, 1);
        TKAssertEquals(a.end, 1);

        // typical case
        a = JSIndexRange(1,4);
        TKAssertEquals(a.start, 1);
        TKAssertEquals(a.end, 4);
    },

    testCopyConstructor: function(){
        var a = JSIndexRange(2, 5);
        var b = JSIndexRange(a);
        a.start = 4;
        a.end = 7;
        TKAssertEquals(b.start, 2);
        TKAssertEquals(b.end, 5);
    },

    testIsEqual: function(){
        var a = JSIndexRange(1, 4);
        var b = JSIndexRange(1, 4);
        TKAssertObjectEquals(a, b);

        a = JSIndexRange(1, 4);
        b = JSIndexRange(1, 5);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexRange(1, 4);
        b = JSIndexRange(2, 4);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexRange(1, 4);
        b = JSIndexRange(2, 5);
        TKAssertObjectNotEquals(a, b);
    },

    testContains: function(){
        var a = JSIndexRange(10, 33);
        TKAssert(a.contains(10));
        TKAssert(a.contains(33));
        TKAssert(!a.contains(9));
        TKAssert(!a.contains(0));
        TKAssert(a.contains(11));
        TKAssert(a.contains(15));
        TKAssert(a.contains(30));
        TKAssert(!a.contains(34));
        TKAssert(!a.contains(35));
        TKAssert(!a.contains(50));
    },

    testCompare: function(){
        var a = JSIndexRange(1, 5);
        var b = JSIndexRange(1, 5);
        TKAssertExactEquals(a.compare(b), 0);
        TKAssertExactEquals(b.compare(a), 0);

        a = JSIndexRange(1, 5);
        b = JSIndexRange(1, 6);
        TKAssertExactEquals(a.compare(b), -1);
        TKAssertExactEquals(b.compare(a), 1);

        a = JSIndexRange(1, 5);
        b = JSIndexRange(2, 2);
        TKAssertExactEquals(a.compare(b), -1);
        TKAssertExactEquals(b.compare(a), 1);
    },

});