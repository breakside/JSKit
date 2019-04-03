// #import Foundation
// #import Testkit
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertExactEquals, TKAssertObjectEquals, JSInsets, JSPoint, JSSize */
'use strict';

JSClass('JSInsetsTests', TKTestSuite, {

    testContructor: function(){
        var insets = new JSInsets(1, 2, 3, 4);
        TKAssertEquals(insets.top, 1);
        TKAssertEquals(insets.left, 2);
        TKAssertEquals(insets.bottom, 3);
        TKAssertEquals(insets.right, 4);
    },

    testPartialConstructor: function(){
        var insets = new JSInsets(1, 2, 3);
        TKAssertEquals(insets.top, 1);
        TKAssertEquals(insets.left, 2);
        TKAssertEquals(insets.bottom, 3);
        TKAssertEquals(insets.right, 2);

        insets = new JSInsets(1, 2);
        TKAssertEquals(insets.top, 1);
        TKAssertEquals(insets.left, 2);
        TKAssertEquals(insets.bottom, 1);
        TKAssertEquals(insets.right, 2);

        insets = new JSInsets(1);
        TKAssertEquals(insets.top, 1);
        TKAssertEquals(insets.left, 1);
        TKAssertEquals(insets.bottom, 1);
        TKAssertEquals(insets.right, 1);
    },

    testCopyConstructor: function(){
        var insets = new JSInsets(1, 2, 3, 4);
        var insets2 = new JSInsets(insets);
        TKAssertEquals(insets2.top, 1);
        TKAssertEquals(insets2.left, 2);
        TKAssertEquals(insets2.bottom, 3);
        TKAssertEquals(insets2.right, 4);
        insets2.top = 5;
        insets2.left = 6;
        TKAssertEquals(insets.top, 1);
        TKAssertEquals(insets.left, 2);
    },

    testFunction: function(){
        var insets = JSInsets(1, 2, 3, 4);
        TKAssertNotNull(insets);
        TKAssert(insets instanceof JSInsets);
        TKAssertEquals(insets.top, 1);
        TKAssertEquals(insets.left, 2);
        TKAssertEquals(insets.bottom, 3);
        TKAssertEquals(insets.right, 4);
    },

    testNullFunction: function(){
        var insets = JSInsets(null);
        TKAssertNull(insets);
    },

    testZero : function(){
        var insets = JSInsets.Zero;
        TKAssertExactEquals(insets.top, 0);
        TKAssertExactEquals(insets.left, 0);
        TKAssertExactEquals(insets.bottom, 0);
        TKAssertExactEquals(insets.right, 0);
        // make sure .Zero returns a copy each time, and isn't a reference that can be modified
        insets.top = 1;
        var insets2 = JSInsets.Zero;
        TKAssertExactEquals(insets2.top, 0);
    }

});