// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSColor, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertThrows, JSBundle */
'use strict';

JSClass('JSColorTests', TKTestSuite, {

    testRGBA: function(){
        var color = JSColor.initWithRGBA();
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
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
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
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

    testColorWithAlpha: function(){
        var color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.3, 0.4, 0.5]);
        var color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertEquals(color2.components[0], 0.3);
        TKAssertEquals(color2.components[1], 0.4);
        TKAssertEquals(color2.components[2], 0.5);
        TKAssertEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, [0.3, 0.4, 0.5, 0.8]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertEquals(color2.components[0], 0.3);
        TKAssertEquals(color2.components[1], 0.4);
        TKAssertEquals(color2.components[2], 0.5);
        TKAssertEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsl, [0.3, 0.4, 0.5]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.hsla);
        TKAssertEquals(color2.components[0], 0.3);
        TKAssertEquals(color2.components[1], 0.4);
        TKAssertEquals(color2.components[2], 0.5);
        TKAssertEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsla, [0.3, 0.4, 0.5, 0.8]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.hsla);
        TKAssertEquals(color2.components[0], 0.3);
        TKAssertEquals(color2.components[1], 0.4);
        TKAssertEquals(color2.components[2], 0.5);
        TKAssertEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.gray, [0.3]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.graya);
        TKAssertEquals(color2.components[0], 0.3);
        TKAssertEquals(color2.components[1], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.graya, [0.3, 0.8]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.graya);
        TKAssertEquals(color2.components[0], 0.3);
        TKAssertEquals(color2.components[1], 0.6);
    },

    testCssString: function(){
        if (!JSColor.prototype.cssString){
            return;
        }
        var color = JSColor.initWithRGBA();
        TKAssertEquals(color.cssString(), "rgba(0, 0, 0, 1)");

        color = JSColor.initWithRGBA(0.25, 0.5, 0.75, 0.3);
        TKAssertEquals(color.cssString(), "rgba(64, 128, 191, 0.3)");
    },

    testIsEqual: function(){
        var color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, [0.2, 0.4, 0.6, 0.8]);
        var color2 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, [0.2, 0.4, 0.6, 0.8]);
        TKAssertObjectEquals(color1, color2);
        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, [0.2, 0.4, 0.6, 1.0]);
        color2 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.4, 0.6]);
        TKAssertObjectNotEquals(color1, color2);
        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, [0.202, 0.4, 0.6, 1.0]);
        color2 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, [0.203, 0.4, 0.6, 0.999]);
        TKAssertObjectEquals(color1, color2);
    }
});