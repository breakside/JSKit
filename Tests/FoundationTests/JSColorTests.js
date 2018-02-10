// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSColor, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, TKAssertThrows, JSBundle */
'use strict';

JSClass('JSColorTests', TKTestSuite, {

    testRGBA: function(){
        var color = JSColor.initWithRGBA();
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.RGBA);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0);
        TKAssertEquals(color.components[1], 0);
        TKAssertEquals(color.components[2], 0);
        TKAssertEquals(color.components[3], 1.0);

        color = JSColor.initWithRGBA(0.25, 0.5, 0.75);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.25);
        TKAssertEquals(color.components[1], 0.5);
        TKAssertEquals(color.components[2], 0.75);
        TKAssertEquals(color.components[3], 1.0);

        color = JSColor.initWithRGBA(0.25, 0.5, 0.75, 0.3);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.25);
        TKAssertEquals(color.components[1], 0.5);
        TKAssertEquals(color.components[2], 0.75);
        TKAssertEquals(color.components[3], 0.3);

        TKAssertEquals(color.components[0], color.red);
        TKAssertEquals(color.components[1], color.green);
        TKAssertEquals(color.components[2], color.blue);
        TKAssertEquals(color.components[3], color.alpha);
    },

    testSpec: function(){
        var spec = {color: {rgba: "204,102,51"}};
        var color = JSColor.initWithSpec(spec, spec.color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.RGBA);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.8);
        TKAssertEquals(color.components[1], 0.4);
        TKAssertEquals(color.components[2], 0.2);
        TKAssertEquals(color.components[3], 1.0);

        spec = {color: {rgba: "204,102,51,.5"}};
        color = JSColor.initWithSpec(spec, spec.color);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.8);
        TKAssertEquals(color.components[1], 0.4);
        TKAssertEquals(color.components[2], 0.2);
        TKAssertEquals(color.components[3], 0.5);
    },

    testCssString: function(){
        var color = JSColor.initWithRGBA();
        TKAssertEquals(color.cssString(), "rgba(0, 0, 0, 1)");

        color = JSColor.initWithRGBA(0.25, 0.5, 0.75, 0.3);
        TKAssertEquals(color.cssString(), "rgba(64, 128, 191, 0.3)");
    }
});