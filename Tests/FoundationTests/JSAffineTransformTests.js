// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertFloatEquals, TKAssertObjectEquals, JSAffineTransform, JSPoint */
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

    testNullFunction: function(){
        var transform = JSAffineTransform(null);
        TKAssertNull(transform);
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
    },

    testIsIdentity: function(){
        var transform = JSAffineTransform.Identity;
        TKAssert(transform.isIdentity);

        transform.a = 2;
        TKAssert(!transform.isIdentity);

        transform.a = 1.0001;
        TKAssert(!transform.isIdentity);

        transform.a = 1.0;
        TKAssert(transform.isIdentity);

        transform = JSAffineTransform(1, 1, 0, 1, 0, 0);
        TKAssert(!transform.isIdentity);
        transform = JSAffineTransform(1, 0, 1, 1, 0, 0);
        TKAssert(!transform.isIdentity);
        transform = JSAffineTransform(1, 0, 0, 2, 0, 0);
        TKAssert(!transform.isIdentity);
        transform = JSAffineTransform(1, 0, 0, 1, 1, 0);
        TKAssert(!transform.isIdentity);
        transform = JSAffineTransform(1, 0, 0, 1, 0, 1);
        TKAssert(!transform.isIdentity);
    },

    testConcatenatedWith: function(){
        var transform = JSAffineTransform(2, 0, 0, 3, 0, 0).concatenatedWith(JSAffineTransform(4, 0, 0, 5, 0, 0));
        TKAssertFloatEquals(transform.a, 8);
        TKAssertFloatEquals(transform.d, 15);

        transform = JSAffineTransform(4, 0, 0, 5, 0, 0).concatenatedWith(JSAffineTransform(2, 0, 0, 3, 0, 0));
        TKAssertFloatEquals(transform.a, 8);
        TKAssertFloatEquals(transform.b, 0);
        TKAssertFloatEquals(transform.c, 0);
        TKAssertFloatEquals(transform.d, 15);
        TKAssertFloatEquals(transform.tx, 0);
        TKAssertFloatEquals(transform.ty, 0);

        transform = JSAffineTransform(1, 0, 0, 1, 3, 4).concatenatedWith(JSAffineTransform(1, 0, 0, 1, 5, 10));
        TKAssertFloatEquals(transform.a, 1);
        TKAssertFloatEquals(transform.b, 0);
        TKAssertFloatEquals(transform.c, 0);
        TKAssertFloatEquals(transform.d, 1);
        TKAssertFloatEquals(transform.tx, 8);
        TKAssertFloatEquals(transform.ty, 14);

        transform = JSAffineTransform(1, 0, 0, 1, 5, 10).concatenatedWith(JSAffineTransform(1, 0, 0, 1, 3, 4));
        TKAssertFloatEquals(transform.a, 1);
        TKAssertFloatEquals(transform.b, 0);
        TKAssertFloatEquals(transform.c, 0);
        TKAssertFloatEquals(transform.d, 1);
        TKAssertFloatEquals(transform.tx, 8);
        TKAssertFloatEquals(transform.ty, 14);

        transform = JSAffineTransform.RotatedDegrees(30).concatenatedWith(JSAffineTransform.RotatedDegrees(60));
        TKAssertFloatEquals(transform.a, 0);
        TKAssertFloatEquals(transform.b, 1);
        TKAssertFloatEquals(transform.c, -1);
        TKAssertFloatEquals(transform.d, 0);
        TKAssertFloatEquals(transform.tx, 0);
        TKAssertFloatEquals(transform.ty, 0);

        transform = JSAffineTransform.RotatedDegrees(60).concatenatedWith(JSAffineTransform.RotatedDegrees(30));
        TKAssertFloatEquals(transform.a, 0);
        TKAssertFloatEquals(transform.b, 1);
        TKAssertFloatEquals(transform.c, -1);
        TKAssertFloatEquals(transform.d, 0);
        TKAssertFloatEquals(transform.tx, 0);
        TKAssertFloatEquals(transform.ty, 0);
    },

    // TODO:
    // testInverse: function(){
    //},

    testTranslatedBy: function(){
        var transform = JSAffineTransform.Identity.translatedBy(5, 7);
        TKAssertEquals(transform.tx, 5);
        TKAssertEquals(transform.ty, 7);

        transform = JSAffineTransform.Identity.translatedBy(5, -7);
        TKAssertEquals(transform.tx, 5);
        TKAssertEquals(transform.ty, -7);

        transform = JSAffineTransform.Identity.translatedBy(5, -7).translatedBy(10, 18);
        TKAssertEquals(transform.tx, 15);
        TKAssertEquals(transform.ty, 11);
    },

    testScaledBy: function(){
        var transform = JSAffineTransform.Identity.scaledBy(5, 7);
        TKAssertEquals(transform.a, 5);
        TKAssertEquals(transform.d, 7);

        transform = JSAffineTransform.Identity.scaledBy(5, -7);
        TKAssertEquals(transform.a, 5);
        TKAssertEquals(transform.d, -7);

        transform = JSAffineTransform.Identity.scaledBy(5, -7).scaledBy(10, 18);
        TKAssertEquals(transform.a, 50);
        TKAssertEquals(transform.d, -126);
    },

    testRotatedBy: function(){
        var transform = JSAffineTransform.Identity.rotatedByDegrees(90);
        TKAssertFloatEquals(transform.a, Math.cos(Math.PI / 2));
        TKAssertFloatEquals(transform.b, Math.sin(Math.PI / 2));
        TKAssertFloatEquals(transform.c, -Math.sin(Math.PI / 2));
        TKAssertFloatEquals(transform.d, Math.cos(Math.PI / 2));

        transform = JSAffineTransform.Identity.rotatedByDegrees(-45);
        TKAssertFloatEquals(transform.a, Math.cos(-Math.PI / 4));
        TKAssertFloatEquals(transform.b, Math.sin(-Math.PI / 4));
        TKAssertFloatEquals(transform.c, -Math.sin(-Math.PI / 4));
        TKAssertFloatEquals(transform.d, Math.cos(-Math.PI / 4));

        transform = JSAffineTransform.Identity.rotatedByDegrees(90).rotatedByDegrees(-45);
        TKAssertFloatEquals(transform.a, Math.cos(Math.PI / 4));
        TKAssertFloatEquals(transform.b, Math.sin(Math.PI / 4));
        TKAssertFloatEquals(transform.c, -Math.sin(Math.PI / 4));
        TKAssertFloatEquals(transform.d, Math.cos(Math.PI / 4));
    },

    testConvertPointFromTransform: function(){
        var transform = JSAffineTransform.Identity.translatedBy(5, 7);
        var point = transform.convertPointFromTransform(JSPoint(12, -5));
        TKAssertFloatEquals(point.x, 17);
        TKAssertFloatEquals(point.y, 2);

        transform = JSAffineTransform.Identity.scaledBy(2, 3);
        point = transform.convertPointFromTransform(JSPoint(12, -5));
        TKAssertFloatEquals(point.x, 24);
        TKAssertFloatEquals(point.y, -15);

        transform = JSAffineTransform.Identity.rotatedByDegrees(90);
        point = transform.convertPointFromTransform(JSPoint(12, -5));
        TKAssertFloatEquals(point.x, 5);
        TKAssertFloatEquals(point.y, 12);

        transform = JSAffineTransform.Identity.translatedBy(5, 7).rotatedByDegrees(90).scaledBy(2, 3);
        point = transform.convertPointFromTransform(JSPoint(12, -5));
        TKAssertFloatEquals(point.x, 20);
        TKAssertFloatEquals(point.y, 31);

        transform = JSAffineTransform.Identity.translatedBy(5, 7).scaledBy(2, 3).rotatedByDegrees(90);
        point = transform.convertPointFromTransform(JSPoint(12, -5));
        TKAssertFloatEquals(point.x, 15);
        TKAssertFloatEquals(point.y, 43);
    },

    testConvertPointToTransform: function(){
        var transform = JSAffineTransform.Identity.translatedBy(5, 7);
        var point = transform.convertPointToTransform(JSPoint(17, 2));
        TKAssertFloatEquals(point.x, 12);
        TKAssertFloatEquals(point.y, -5);

        transform = JSAffineTransform.Identity.scaledBy(2, 3);
        point = transform.convertPointToTransform(JSPoint(24, -15));
        TKAssertFloatEquals(point.x, 12);
        TKAssertFloatEquals(point.y, -5);

        transform = JSAffineTransform.Identity.rotatedByDegrees(90);
        point = transform.convertPointToTransform(JSPoint(5, 12));
        TKAssertFloatEquals(point.x, 12);
        TKAssertFloatEquals(point.y, -5);

        transform = JSAffineTransform.Identity.translatedBy(5, 7).rotatedByDegrees(90).scaledBy(2, 3);
        point = transform.convertPointToTransform(JSPoint(20, 31));
        TKAssertFloatEquals(point.x, 12);
        TKAssertFloatEquals(point.y, -5);

        transform = JSAffineTransform.Identity.translatedBy(5, 7).scaledBy(2, 3).rotatedByDegrees(90);
        point = transform.convertPointToTransform(JSPoint(15, 43));
        TKAssertFloatEquals(point.x, 12);
        TKAssertFloatEquals(point.y, -5);
    }

});