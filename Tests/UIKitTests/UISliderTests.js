// #import UIKit
// #import TestKit
"use strict";

JSClass("UISliderTests", TKTestSuite, {

    testInitWithFrame: function(){
        var slider = UISlider.initWithFrame(JSRect(0, 0, 200, 16));
        TKAssertExactEquals(slider.styler, UISlider.Styler.default);
        TKAssertFloatEquals(slider.minimumValue, 0);
        TKAssertFloatEquals(slider.maximumValue, 1);
        TKAssertFloatEquals(slider.value, 0);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({
            enabled: false,
            styler: {
                class: "UISliderDefaultStyler"
            },
            minimumValue: -10,
            maximumValue: 10,
            value: 4
        });
        var slider = UISlider.initWithSpec(spec);
        TKAssertInstance(slider.styler, UISliderDefaultStyler);
        TKAssertNotExactEquals(slider.styler, UISlider.Styler.default);
        TKAssertFloatEquals(slider.minimumValue, -10);
        TKAssertFloatEquals(slider.maximumValue, 10);
        TKAssertFloatEquals(slider.value, 4);
    },

    testLayoutSubviews: function(){
        var slider = UISlider.initWithFrame(JSRect(0, 0, 200, 16));
        slider.setNeedsLayout();
        slider.layoutIfNeeded();
    },

    testSetMinimumValue: function(){
        var slider = UISlider.initWithFrame(JSRect(0, 0, 200, 16));
        slider.minimumValue = 0.3;
        TKAssertFloatEquals(slider.minimumValue, 0.3);
        TKAssertFloatEquals(slider.value, 0.3);
        slider.minimumValue = -0.3;
        TKAssertFloatEquals(slider.minimumValue, -0.3);
        TKAssertFloatEquals(slider.value, 0.3);
    },

    testSetMaximumValue: function(){
        var slider = UISlider.initWithFrame(JSRect(0, 0, 200, 16));
        slider.value = 0.5;
        slider.maximumValue = 0.3;
        TKAssertFloatEquals(slider.maximumValue, 0.3);
        TKAssertFloatEquals(slider.value, 0.3);
        slider.maximumValue = 1.3;
        TKAssertFloatEquals(slider.maximumValue, 1.3);
        TKAssertFloatEquals(slider.value, 0.3);
    },

    testSetValue: function(){
        var slider = UISlider.initWithFrame(JSRect(0, 0, 200, 16));
        slider.value = 2;
        TKAssertFloatEquals(slider.value, 1);
        slider.value = -1;
        TKAssertFloatEquals(slider.value, 0);
        slider.value = 0.4;
        TKAssertFloatEquals(slider.value, 0.4);
    }

});