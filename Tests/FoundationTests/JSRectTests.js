// #import Foundation
// #import TestKit
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertExactEquals, TKAssertObjectEquals, JSRect, JSPoint, JSSize */
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
    }

});