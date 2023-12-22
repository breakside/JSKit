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

JSClass('JSRectTests', TKTestSuite, {

    testContructor: function(){
        var rect = new JSRect(1, 2, 3, 4);
        TKAssertEquals(rect.origin.x, 1);
        TKAssertEquals(rect.origin.y, 2);
        TKAssertEquals(rect.size.width, 3);
        TKAssertEquals(rect.size.height, 4);
    },

    testOriginSizeConstructor: function(){
        var origin = JSPoint(1, 2);
        var size = JSSize(3, 4);
        var rect = new JSRect(origin, size);
        TKAssertEquals(rect.origin.x, 1);
        TKAssertEquals(rect.origin.y, 2);
        TKAssertEquals(rect.size.width, 3);
        TKAssertEquals(rect.size.height, 4);
        rect.origin.x = 10;
        rect.size.width = 11;
        // Make sure the original origin and size were copied
        TKAssertEquals(origin.x, 1);
        TKAssertEquals(size.width, 3);
    },

    testCopyConstructor: function(){
        var rect = new JSRect(1, 2, 3, 4);
        var rect2 = new JSRect(rect);
        TKAssertEquals(rect2.origin.x, 1);
        TKAssertEquals(rect2.origin.y, 2);
        TKAssertEquals(rect2.size.width, 3);
        TKAssertEquals(rect2.size.height, 4);
        rect2.origin.x = 5;
        rect2.origin.y = 6;
        TKAssertEquals(rect.origin.x, 1);
        TKAssertEquals(rect.origin.y, 2);
    },

    testFunction: function(){
        var rect = JSRect(1, 2, 3, 4);
        TKAssertNotNull(rect);
        TKAssert(rect instanceof JSRect);
        TKAssertEquals(rect.origin.x, 1);
        TKAssertEquals(rect.origin.y, 2);
        TKAssertEquals(rect.size.width, 3);
        TKAssertEquals(rect.size.height, 4);
    },

    testNullFunction: function(){
        var rect = JSRect(null);
        TKAssertNull(rect);
    },

    testZero : function(){
        var rect = JSRect.Zero;
        TKAssertExactEquals(rect.origin.x, 0);
        TKAssertExactEquals(rect.origin.y, 0);
        TKAssertExactEquals(rect.size.width, 0);
        TKAssertExactEquals(rect.size.height, 0);
        // make sure .Zero returns a copy each time, and isn't a reference that can be modified
        rect.origin.x = 1;
        var rect2 = JSRect.Zero;
        TKAssertExactEquals(rect2.origin.x, 0);
    },

    testIntersectsRect: function(){
        var a = JSRect(0, 0, 100, 100);

        // exact overlap
        var b = JSRect(0, 0, 100, 100);
        var intersects = a.intersectsRect(b);
        TKAssert(intersects);
        intersects = b.intersectsRect(a);
        TKAssert(intersects);

        // zero width
        b = JSRect(0, 0, 0, 100);
        intersects = a.intersectsRect(b);
        TKAssert(!intersects);
        intersects = b.intersectsRect(a);
        TKAssert(!intersects);

        // zero height
        b = JSRect(0, 0, 100, 0);
        intersects = a.intersectsRect(b);
        TKAssert(!intersects);
        intersects = b.intersectsRect(a);
        TKAssert(!intersects);

        // fully inside
        b = JSRect(10, 10, 10, 10);
        intersects = a.intersectsRect(b);
        TKAssert(intersects);
        intersects = b.intersectsRect(a);
        TKAssert(intersects);

        // up to left edge
        b = JSRect(-10, 0, 10, 10);
        intersects = a.intersectsRect(b);
        TKAssert(!intersects);
        intersects = b.intersectsRect(a);
        TKAssert(!intersects);

        // up to right edge
        b = JSRect(100, 10, 10, 10);
        intersects = a.intersectsRect(b);
        TKAssert(!intersects);
        intersects = b.intersectsRect(a);
        TKAssert(!intersects);

        // up to bottom edge
        b = JSRect(10, 100, 10, 10);
        intersects = a.intersectsRect(b);
        TKAssert(!intersects);
        intersects = b.intersectsRect(a);
        TKAssert(!intersects);

        // up to top edge
        b = JSRect(0, -10, 10, 10);
        intersects = a.intersectsRect(b);
        TKAssert(!intersects);
        intersects = b.intersectsRect(a);
        TKAssert(!intersects);

        // overlap left edge
        b = JSRect(-10, 10, 20, 10);
        intersects = a.intersectsRect(b);
        TKAssert(intersects);
        intersects = b.intersectsRect(a);
        TKAssert(intersects);

        // overlap right edge
        b = JSRect(90, 10, 20, 10);
        intersects = a.intersectsRect(b);
        TKAssert(intersects);
        intersects = b.intersectsRect(a);
        TKAssert(intersects);

        // overlap top edge
        b = JSRect(10, -10, 10, 20);
        intersects = a.intersectsRect(b);
        TKAssert(intersects);
        intersects = b.intersectsRect(a);
        TKAssert(intersects);

        // overlap bottom edge
        b = JSRect(10, 90, 10, 20);
        intersects = a.intersectsRect(b);
        TKAssert(intersects);
        intersects = b.intersectsRect(a);
        TKAssert(intersects);

        // larger
        b = JSRect(-10, -10, 120, 120);
        intersects = a.intersectsRect(b);
        TKAssert(intersects);
        intersects = b.intersectsRect(a);
        TKAssert(intersects);
    },

    testInterestingRect: function(){
        var a = JSRect(0, 0, 100, 100);

        // exact overlap
        var b = JSRect(0, 0, 100, 100);
        var c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 100);
        TKAssertFloatEquals(c.size.height, 100);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 100);
        TKAssertFloatEquals(c.size.height, 100);

        // zero width
        b = JSRect(0, 0, 0, 100);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 0);
        TKAssertFloatEquals(c.size.height, 100);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 0);
        TKAssertFloatEquals(c.size.height, 100);

        // zero height
        b = JSRect(0, 0, 100, 0);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 100);
        TKAssertFloatEquals(c.size.height, 0);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 100);
        TKAssertFloatEquals(c.size.height, 0);

        // fully inside
        b = JSRect(10, 10, 10, 10);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);

        // up to left edge
        b = JSRect(-10, 0, 10, 10);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 0);
        TKAssertFloatEquals(c.size.height, 10);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 0);
        TKAssertFloatEquals(c.size.height, 10);

        // up to right edge
        b = JSRect(100, 10, 10, 10);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 100);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 0);
        TKAssertFloatEquals(c.size.height, 10);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 100);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 0);
        TKAssertFloatEquals(c.size.height, 10);

        // up to bottom edge
        b = JSRect(10, 100, 10, 10);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 100);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 0);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 100);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 0);

        // up to top edge
        b = JSRect(0, -10, 10, 10);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 0);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 0);

        // overlap left edge
        b = JSRect(-10, 10, 20, 10);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);

        // overlap right edge
        b = JSRect(90, 10, 20, 10);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 90);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 90);
        TKAssertFloatEquals(c.origin.y, 10);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);

        // overlap top edge
        b = JSRect(10, -10, 10, 20);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);

        // overlap bottom edge
        b = JSRect(10, 90, 10, 20);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 90);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 10);
        TKAssertFloatEquals(c.origin.y, 90);
        TKAssertFloatEquals(c.size.width, 10);
        TKAssertFloatEquals(c.size.height, 10);

        // larger
        b = JSRect(-10, -10, 120, 120);
        c = a.intersectingRect(b);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 100);
        TKAssertFloatEquals(c.size.height, 100);
        c = b.intersectingRect(a);
        TKAssertFloatEquals(c.origin.x, 0);
        TKAssertFloatEquals(c.origin.y, 0);
        TKAssertFloatEquals(c.size.width, 100);
        TKAssertFloatEquals(c.size.height, 100);

    }

});