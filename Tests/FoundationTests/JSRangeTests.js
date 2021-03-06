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

JSClass('JSRangeTests', TKTestSuite, {

    testContructor: function(){
        var range = new JSRange(1, 2);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
    },

    testCopyConstructor: function(){
        var range = new JSRange(3, 4);
        var range2 = new JSRange(range);
        TKAssertEquals(range2.location, 3);
        TKAssertEquals(range2.length, 4);
        range2.location = 5;
        range2.length = 6;
        TKAssertEquals(range.location, 3);
        TKAssertEquals(range.length, 4);
    },

    testFunction: function(){
        var range = JSRange(1, 2);
        TKAssertNotNull(range);
        TKAssert(range instanceof JSRange);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
    },

    testNullFunction: function(){
        var range = JSRange(null);
        TKAssertNull(range);
    },

    testNegatives: function(){
        var range = JSRange(-1, -2);
        TKAssertEquals(range.location, -1);
        TKAssertEquals(range.length, -2);
    },

    testContains: function(){
        var range = JSRange(0, 0);
        TKAssert(!range.contains(0));
        TKAssert(!range.contains(1));
        TKAssert(!range.contains(-1));
        TKAssert(!range.contains(10));
        TKAssert(!range.contains(-10));

        range = JSRange(0, 10);
        TKAssert(range.contains(0));
        TKAssert(range.contains(1));
        TKAssert(!range.contains(-1));
        TKAssert(range.contains(9));
        TKAssert(!range.contains(10));

        range = JSRange(10, 5);
        TKAssert(!range.contains(0));
        TKAssert(range.contains(10));
        TKAssert(range.contains(14));
        TKAssert(!range.contains(15));
    },

    testContainsRange: function(){
        var range1 = JSRange(5, 20);
        var range2 = JSRange(2, 5);

        TKAssert(!range1.containsRange(range2));

        range2 = JSRange(5, 0);
        TKAssert(range1.containsRange(range2));

        range2 = JSRange(5, 10);
        TKAssert(range1.containsRange(range2));

        range2 = JSRange(5, 20);
        TKAssert(range1.containsRange(range2));

        range2 = JSRange(6, 10);
        TKAssert(range1.containsRange(range2));

        range2 = JSRange(6, 19);
        TKAssert(range1.containsRange(range2));

        range2 = JSRange(6, 21);
        TKAssert(!range1.containsRange(range2));

        range2 = JSRange(25, 0);
        TKAssert(!range1.containsRange(range2));
    },

    testEnd: function(){
        var range = JSRange(0, 0);
        TKAssertEquals(range.end, 0);

        range = JSRange(0, 5);
        TKAssertEquals(range.end, 5);

        range = JSRange(3, 4);
        TKAssertEquals(range.end, 7);
    },

    testAdvance: function(){
        var range = JSRange(5, 30);
        range.advance(7);
        TKAssertEquals(range.location, 12);
        TKAssertEquals(range.length, 23);

        range.advance(-10);
        TKAssertEquals(range.location, 2);
        TKAssertEquals(range.length, 33);

        range.advance(32);
        TKAssertEquals(range.location, 34);
        TKAssertEquals(range.length, 1);

        range.advance(0);
        TKAssertEquals(range.location, 34);
        TKAssertEquals(range.length, 1);

        range.advance(1);
        TKAssertEquals(range.location, 35);
        TKAssertEquals(range.length, 0);

        range.advance(1);
        TKAssertEquals(range.location, 35);
        TKAssertEquals(range.length, 0);

        range.advance(-20);
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 20);

        range.advance(50);
        TKAssertEquals(range.location, 35);
        TKAssertEquals(range.length, 0);
    },

    testIntersection: function(){
        var range1 = JSRange(5, 30);
        var range2 = JSRange(2, 15);
        var intersection = range1.intersection(range2);
        TKAssertEquals(intersection.location, 5);
        TKAssertEquals(intersection.length, 12);
        intersection = range2.intersection(range1);
        TKAssertEquals(intersection.location, 5);
        TKAssertEquals(intersection.length, 12);

        range1 = JSRange(5, 30);
        range2 = JSRange(2, 50);
        intersection = range1.intersection(range2);
        TKAssertEquals(intersection.location, 5);
        TKAssertEquals(intersection.length, 30);
        intersection = range2.intersection(range1);
        TKAssertEquals(intersection.location, 5);
        TKAssertEquals(intersection.length, 30);

        range1 = JSRange(5, 30);
        range2 = JSRange(35, 4);
        intersection = range1.intersection(range2);
        TKAssertEquals(intersection.location, 35);
        TKAssertEquals(intersection.length, 0);
        intersection = range2.intersection(range1);
        TKAssertEquals(intersection.location, 35);
        TKAssertEquals(intersection.length, 0);

        range1 = JSRange(5, 30);
        range2 = JSRange(36, 4);
        intersection = range1.intersection(range2);
        TKAssertEquals(intersection.location, 35);
        TKAssertEquals(intersection.length, 0);
        intersection = range2.intersection(range1);
        TKAssertEquals(intersection.location, 36);
        TKAssertEquals(intersection.length, 0);
    },

    testZero : function(){
        var range = JSRange.Zero;
        TKAssertExactEquals(range.location, 0);
        TKAssertExactEquals(range.length, 0);
        // make sure .Zero returns a copy each time, and isn't a reference that can be modified
        range.location = 1;
        var range2 = JSRange.Zero;
        TKAssertExactEquals(range2.location, 0);
    }

});