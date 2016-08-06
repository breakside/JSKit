// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSAffineTransform */
'use strict';

JSClass('JSAffineTransformTests', TKTestSuite, {

    testContructor: function(){
        var transform = new JSAffineTransform(1, 2, 3, 4, 5, 6);
        TKAssertEquals(transform.a, 1);
        TKAssertEquals(transform.b, 2);
        TKAssertEquals(transform.c, 3);
        TKAssertEquals(transform.d, 4);
        TKAssertEquals(transform.tx, 5);
        TKAssertEquals(transform.ty, 6);
    },

    testCopyConstructor: function(){
        var transform = new JSAffineTransform(1, 2, 3, 4, 5, 6);
        var transform2 = new JSAffineTransform(transform);
        TKAssertEquals(transform2.a, 1);
        TKAssertEquals(transform2.b, 2);
        TKAssertEquals(transform2.c, 3);
        TKAssertEquals(transform2.d, 4);
        TKAssertEquals(transform.tx, 5);
        TKAssertEquals(transform.ty, 6);
        transform2.a = 7;
        transform2.b = 8;
        TKAssertEquals(transform.a, 1);
        TKAssertEquals(transform.b, 2);
    },

    testFunction: function(){
        var transform = JSAffineTransform(1, 2, 3, 4, 5, 6);
        TKAssertNotNull(transform);
        TKAssert(transform instanceof JSAffineTransform);
        TKAssertEquals(transform.a, 1);
        TKAssertEquals(transform.b, 2);
        TKAssertEquals(transform.c, 3);
        TKAssertEquals(transform.d, 4);
        TKAssertEquals(transform.tx, 5);
        TKAssertEquals(transform.ty, 6);
    },

    testIdentity : function(){
        var transform = JSAffineTransform.Identity;
        TKAssertEquals(transform.a, 1);
        TKAssertEquals(transform.b, 0);
        TKAssertEquals(transform.c, 0);
        TKAssertEquals(transform.d, 1);
        TKAssertEquals(transform.tx, 0);
        TKAssertEquals(transform.ty, 0);
        // make sure .Identity returns a copy each time, and isn't a reference that can be modified
        transform.a = 2;
        var transform2 = JSAffineTransform.Identity;
        TKAssertEquals(transform2.a, 1);
    }

});