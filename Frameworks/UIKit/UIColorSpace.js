// #import Foundation
// #import "UIUserInterface.js"
/* global UIApplication */
"use strict";

JSClass("UIColorSpace", JSColorSpace, {

    name: "ui",
    numberOfComponents: 16,
    componentNames: {},

    rgbFromComponents: function(components){
        return [
            components[UIColorSpace.componentOffset],
            components[UIColorSpace.componentOffset + 1],
            components[UIColorSpace.componentOffset + 2]
        ];
    },

    grayFromComponents: function(components){
        var rgb = this.rgbFromComponents(components);
        return JSColorSpace.rgb.grayFromComponents(rgb);
    },

    alphaFromComponents: function(components){
        return components[UIColorSpace.componentOffset + 3];
    },

    xyzFromComponents: function(components){
        var rgb = this.rgbFromComponents(components);
        return JSColorSpace.rgb.xyzFromComponents(rgb);
    },

    componentsFromXYZ: function(xyz){
        throw new Error("Unable to convert from XYZ -> UI color space");
    },

    componentsFromSpace: function(space, components){
        if (space === this){
            // slice to create a copy and to always return the expected number of
            // components regardless of whether an alpha component was passed in
            return components.slice(0, this.numberOfComponents);
        }
        var xyz = space.xyzFromComponents(components);
        return this.componentsFromXYZ(xyz);
    },

    componentsDarkenedByPercentage: function(components, percentage){
        return [
            components[0] - components[0] * percentage,
            components[1] - components[1] * percentage,
            components[2] - components[2] * percentage,
            components[3],
            components[4] - components[4] * percentage,
            components[5] - components[5] * percentage,
            components[6] - components[6] * percentage,
            components[7],
            components[8] - components[8] * percentage,
            components[9] - components[9] * percentage,
            components[10] - components[10] * percentage,
            components[11],
            components[12] - components[12] * percentage,
            components[13] - components[13] * percentage,
            components[14] - components[14] * percentage,
            components[15]
        ];
    },

    componentsLightenedByPercentage: function(components, percentage){
        return [
            components[0] + (1 - components[0]) * percentage,
            components[1] + (1 - components[1]) * percentage,
            components[2] + (1 - components[2]) * percentage,
            components[3],
            components[4] + (1 - components[4]) * percentage,
            components[5] + (1 - components[5]) * percentage,
            components[6] + (1 - components[6]) * percentage,
            components[7],
            components[8] + (1 - components[8]) * percentage,
            components[9] + (1 - components[9]) * percentage,
            components[10] + (1 - components[10]) * percentage,
            components[11],
            components[12] + (1 - components[12]) * percentage,
            components[13] + (1 - components[13]) * percentage,
            components[14] + (1 - components[14]) * percentage,
            components[15]
        ];
    },

});

UIColorSpace.componentOffset = 0;

UIColorSpace.setTraitCollection = function(traitCollection){
    if (traitCollection.accessibilityContrast === UIUserInterface.Contrast.high){
        if (traitCollection.userInterfaceStyle === UIUserInterface.Style.dark){
            UIColorSpace.componentOffset = 12;
        }else{
            UIColorSpace.componentOffset = 8;
        }
    }else{
        if (traitCollection.userInterfaceStyle === UIUserInterface.Style.dark){
            UIColorSpace.componentOffset = 4;
        }else{
            UIColorSpace.componentOffset = 0;
        }
    }
    if (JSColor.invalidateCSSCache){
        JSColor.invalidateCSSCache();
    }
};

JSClass("UINamedColorSpace", JSNamedColorSpace, {

    setColorForName: function(name, color){
        UINamedColorSpace.$super.setColorForName.call(this, name, color);
        if (JSGlobalObject && UIApplication.shared){
            UIApplication.shared.windowServer.setNeedsRedisplay();
        }
    },

    setStylesForName: function(name, lightColor, darkColor, lightContrastColor, darkContrastColor){
        var color = JSColor.initWithUIStyles(lightColor, darkColor, lightContrastColor, darkContrastColor);
        this.setColorForName(color, name);
    }

});

Object.defineProperties(JSColorSpace, {

    ui: {
        configurable: true,
        get: function(){
            var space = UIColorSpace.init();
            Object.defineProperty(this, "ui", {value: space});
            return space;
        }
    },

    theme: {
        configurable: true,
        get: function(){
            var space = UINamedColorSpace.init();
            Object.defineProperty(this, "theme", {value: space});
            return space;
        }
    }

});