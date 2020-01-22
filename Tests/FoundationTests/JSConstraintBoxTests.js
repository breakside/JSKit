// #import Foundation
// #import TestKit
'use strict';

JSClass('JSConstraintBoxTests', TKTestSuite, {

    testContructor: function(){
        var constraints = new JSConstraintBox({
            top: 1,
            right: 2,
            bottom: 3,
            left: 4,
            width: 5,
            height: 6
        });
        TKAssertEquals(constraints.top, 1);
        TKAssertEquals(constraints.right, 2);
        TKAssertEquals(constraints.bottom, 3);
        TKAssertEquals(constraints.left, 4);
        TKAssertEquals(constraints.width, 5);
        TKAssertEquals(constraints.height, 6);
    },

    testCopyConstructor: function(){
        var constraints = new JSConstraintBox({
            top: 1,
            right: 2,
            bottom: 3,
            left: 4,
            width: 5,
            height: 6
        });
        var constraints2 = new JSConstraintBox(constraints);
        TKAssertEquals(constraints2.top, 1);
        TKAssertEquals(constraints2.right, 2);
        TKAssertEquals(constraints2.bottom, 3);
        TKAssertEquals(constraints2.left, 4);
        TKAssertEquals(constraints2.width, 5);
        TKAssertEquals(constraints2.height, 6);
        constraints2.top = 7;
        constraints2.right = 8;
        TKAssertEquals(constraints.top, 1);
        TKAssertEquals(constraints.right, 2);
    },

    testFunction: function(){
        var constraints = JSConstraintBox({
            top: 1,
            right: 2,
            bottom: 3,
            left: 4,
            width: 5,
            height: 6
        });
        TKAssertNotNull(constraints);
        TKAssert(constraints instanceof JSConstraintBox);
        TKAssertEquals(constraints.top, 1);
        TKAssertEquals(constraints.right, 2);
        TKAssertEquals(constraints.bottom, 3);
        TKAssertEquals(constraints.left, 4);
        TKAssertEquals(constraints.width, 5);
        TKAssertEquals(constraints.height, 6);
    },

    testNullFunction: function(){
        var constraints = JSConstraintBox(null);
        TKAssertNull(constraints);
    },

    testSize: function(){
        var constraints = JSConstraintBox.Size(1, 2);
        TKAssertExactEquals(constraints.top, undefined);
        TKAssertExactEquals(constraints.right, undefined);
        TKAssertExactEquals(constraints.bottom, undefined);
        TKAssertExactEquals(constraints.left, undefined);
        TKAssertExactEquals(constraints.width, 1);
        TKAssertExactEquals(constraints.height, 2);
    },

    testMargin: function(){
        var constraints = JSConstraintBox.Margin(1, 2, 3, 4);
        TKAssertExactEquals(constraints.top, 1);
        TKAssertExactEquals(constraints.right, 2);
        TKAssertExactEquals(constraints.bottom, 3);
        TKAssertExactEquals(constraints.left, 4);
        TKAssertExactEquals(constraints.width, undefined);
        TKAssertExactEquals(constraints.height, undefined);
        
        constraints = JSConstraintBox.Margin(1, 2, 3);
        TKAssertExactEquals(constraints.top, 1);
        TKAssertExactEquals(constraints.right, 2);
        TKAssertExactEquals(constraints.bottom, 3);
        TKAssertExactEquals(constraints.left, 2);
        TKAssertExactEquals(constraints.width, undefined);
        TKAssertExactEquals(constraints.height, undefined);
        
        constraints = JSConstraintBox.Margin(1, 2);
        TKAssertExactEquals(constraints.top, 1);
        TKAssertExactEquals(constraints.right, 2);
        TKAssertExactEquals(constraints.bottom, 1);
        TKAssertExactEquals(constraints.left, 2);
        TKAssertExactEquals(constraints.width, undefined);
        TKAssertExactEquals(constraints.height, undefined);
        
        constraints = JSConstraintBox.Margin(1);
        TKAssertExactEquals(constraints.top, 1);
        TKAssertExactEquals(constraints.right, 1);
        TKAssertExactEquals(constraints.bottom, 1);
        TKAssertExactEquals(constraints.left, 1);
        TKAssertExactEquals(constraints.width, undefined);
        TKAssertExactEquals(constraints.height, undefined);
    },

    testAnchorTop: function(){
        var constraints = JSConstraintBox.AnchorTop(1);
        TKAssertExactEquals(constraints.top, 0);
        TKAssertExactEquals(constraints.right, 0);
        TKAssertExactEquals(constraints.bottom, undefined);
        TKAssertExactEquals(constraints.left, 0);
        TKAssertExactEquals(constraints.width, undefined);
        TKAssertExactEquals(constraints.height, 1);
    },

    testAnchorLeft: function(){
        var constraints = JSConstraintBox.AnchorLeft(1);
        TKAssertExactEquals(constraints.top, 0);
        TKAssertExactEquals(constraints.right, undefined);
        TKAssertExactEquals(constraints.bottom, 0);
        TKAssertExactEquals(constraints.left, 0);
        TKAssertExactEquals(constraints.width, 1);
        TKAssertExactEquals(constraints.height, undefined);
    },

    testAnchorBottom: function(){
        var constraints = JSConstraintBox.AnchorBottom(1);
        TKAssertExactEquals(constraints.top, undefined);
        TKAssertExactEquals(constraints.right, 0);
        TKAssertExactEquals(constraints.bottom, 0);
        TKAssertExactEquals(constraints.left, 0);
        TKAssertExactEquals(constraints.width, undefined);
        TKAssertExactEquals(constraints.height, 1);
    },

    testAnchorRight: function(){
        var constraints = JSConstraintBox.AnchorRight(1);
        TKAssertExactEquals(constraints.top, 0);
        TKAssertExactEquals(constraints.right, 0);
        TKAssertExactEquals(constraints.bottom, 0);
        TKAssertExactEquals(constraints.left, undefined);
        TKAssertExactEquals(constraints.width, 1);
        TKAssertExactEquals(constraints.height, undefined);
    },

    testRect: function(){
        var rect = JSRect(1, 2, 3, 4);
        var constraints = JSConstraintBox.Rect(rect);
        TKAssertExactEquals(constraints.top, 2);
        TKAssertExactEquals(constraints.right, undefined);
        TKAssertExactEquals(constraints.bottom, undefined);
        TKAssertExactEquals(constraints.left, 1);
        TKAssertExactEquals(constraints.width, 3);
        TKAssertExactEquals(constraints.height, 4);
    }


});