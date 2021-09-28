// Copyright 2021 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// #import Foundation
// #import "UIUserInterface.js"
/* global UIApplication */
"use strict";

JSClass("UIColorSpace", JSMappedColorSpace, {

    name: "ui",
    numberOfComponents: 1,
    componentNames: {},
    colors: null,

    initWithStyles: function(lightColor, darkColor, lightContrastColor, darkContrastColor){
        this.colors = [
            lightColor,
            darkColor,
            lightContrastColor,
            darkContrastColor
        ];
    },

    colorFromComponents: function(components){
        var color = this.colors[UIColorSpace.colorIndex];
        if (components[0] < 1){
            color = color.colorDarkenedByPercentage(1 - components[0]);
        }else if (components[0] > 1){
            color = color.colorLightenedByPercentage(components[0] - 1);
        }
        return color;
    },

    componentsDarkenedByPercentage: function(components, percentage){
        return [
            components[0] * (1.0 - percentage)
        ];
    },

    componentsLightenedByPercentage: function(components, percentage){
        return [
            components[0] * (1.0 + percentage)
        ];
    }

});

UIColorSpace.colorIndex = 0;

UIColorSpace.setTraitCollection = function(traitCollection){
    if (traitCollection.accessibilityContrast === UIUserInterface.Contrast.high){
        if (traitCollection.userInterfaceStyle === UIUserInterface.Style.dark){
            UIColorSpace.colorIndex = 3;
        }else{
            UIColorSpace.colorIndex = 2;
        }
    }else{
        if (traitCollection.userInterfaceStyle === UIUserInterface.Style.dark){
            UIColorSpace.colorIndex = 1;
        }else{
            UIColorSpace.colorIndex = 0;
        }
    }
    if (JSColor.invalidateCSSCache){
        JSColor.invalidateCSSCache();
    }
};

JSClass("UINamedColorSpace", JSNamedColorSpace, {

    setColorForName: function(name, color){
        var namedColor = UINamedColorSpace.$super.setColorForName.call(this, name, color);
        if (JSGlobalObject.UIApplication && UIApplication.shared){
            UIApplication.shared.windowServer.setNeedsRedisplay();
            if (JSColor.invalidateCSSCache){
                JSColor.invalidateCSSCache();
            }
        }
        var space = this;
        Object.defineProperty(JSColor, name, {
            configurable: true,
            get: function(){
                return namedColor;
            },
            set: function(color){
                space.setColorForName(name, color);
            }
        });
        return namedColor;
    },

    setStylesForName: function(name, lightColor, darkColor, lightContrastColor, darkContrastColor){
        var color = JSColor.initWithUIStyles(lightColor, darkColor, lightContrastColor, darkContrastColor);
        this.setColorForName(name, color);
    }

});

Object.defineProperties(JSColorSpace, {

    ui: {
        configurable: true,
        get: function(){
            var space = UINamedColorSpace.init();
            Object.defineProperty(this, "ui", {value: space});
            return space;
        }
    }

});