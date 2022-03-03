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

JSClass("JSIndexPathTests", TKTestSuite, {

    testConstructor: function(){
        TKAssertThrows(function(){
            var a = JSIndexPath();
        });
        TKAssertThrows(function(){
            var a = JSIndexPath(1);
        });
        var a = JSIndexPath(1, 2);
        TKAssertEquals(a.section, 1);
        TKAssertEquals(a.row, 2);
    },

    testCopyConstructor: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(a);
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 2);
        a.section = 3;
        a.row = 4;
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 2);
    },

    testNullConstructor: function(){
        var a = JSIndexPath(null);
        TKAssertNull(a);
    },

    testIsEqual: function(){
        var a = JSIndexPath(0, 0);
        var b = JSIndexPath(0, 0);
        TKAssertObjectEquals(a, b);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexPath([]);
        b = JSIndexPath([]);
        TKAssertObjectEquals(a, b);
    },

    testLessThan: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(!a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath([]);
        b = JSIndexPath([0]);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath([]);
        b = JSIndexPath([0, 0]);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath([0]);
        b = JSIndexPath([0, 0]);
        TKAssert(a.isLessThan(b));
    },

    testLessThanOrEqual: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(a.isLessThanOrEqual(b));
    },

    testGreaterThan: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(!b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath([]);
        b = JSIndexPath([0]);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath([]);
        b = JSIndexPath([0, 0]);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath([0]);
        b = JSIndexPath([0, 0]);
        TKAssert(b.isGreaterThan(a));
    },

    testGreaterThanOrEqual: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(b.isGreaterThanOrEqual(a));
    },

    testCompare: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssertEquals(a.compare(b), 0);
        TKAssertEquals(b.compare(a), 0);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssertEquals(a.compare(b), 1);
        TKAssertEquals(b.compare(a), -1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);
    },

    testIncremented: function(){
        var a = JSIndexPath(1, 2);
        var b = a.incremented();
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 3);

        a = JSIndexPath([1, 2, 3]);
        b = a.incremented();
        TKAssertEquals(b[0], 1);
        TKAssertEquals(b[1], 2);
        TKAssertEquals(b[2], 4);
    },

    testDecremented: function(){
        var a = JSIndexPath(1, 1);
        var b = a.decremented();
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 0);
        var c = b.decremented();
        TKAssertEquals(c.section, 1);
        TKAssertEquals(c.row, -1);
    }


});