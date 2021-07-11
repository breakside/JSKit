// #import UIKit
// #import TestKit
"use strict";

JSClass("UIColorWellTests", TKTestSuite, {

    testInitWithFrame: function(){
        var colorWell = UIColorWell.initWithFrame(JSRect(0, 0, 40, 40));
        TKAssertInstance(colorWell.color, JSColor);
        TKAssertExactEquals(colorWell.allowsAlpha, true);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({
            enabled: false,
            styler: {
                class: "UIColorWellDefaultStyler"
            },
            color: "red"
        });
        var colorWell = UIColorWell.initWithSpec(spec);
        TKAssertInstance(colorWell.styler, UIColorWellDefaultStyler);
        TKAssertNotExactEquals(colorWell.styler, UIColorWell.Styler.default);
        TKAssertFloatEquals(colorWell.color.red, 1);
        TKAssertFloatEquals(colorWell.color.green, 0);
        TKAssertFloatEquals(colorWell.color.blue, 0);
    },

    testLayoutSubviews: function(){
        var colorWell = UIColorWell.init();
        colorWell.bounds = JSRect(JSPoint.Zero, colorWell.intrinsicSize);
        TKAssertEquals(colorWell.bounds.size.width, 44);
        TKAssertEquals(colorWell.bounds.size.height, 22);
        colorWell.setNeedsLayout();
        colorWell.layoutIfNeeded();
    },

    testSetColor: function(){
        var colorWell = UIColorWell.init();
        colorWell.color = JSColor.red;
        TKAssertFloatEquals(colorWell.color.red, 1);
        TKAssertFloatEquals(colorWell.color.green, 0);
        TKAssertFloatEquals(colorWell.color.blue, 0);
    }

});