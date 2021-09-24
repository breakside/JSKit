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

JSClass("UIColor", JSColor, {

    initWithStyles: function(lightColor, darkColor, lightContrastColor, darkContrastColor){
        if (darkColor === undefined){
            darkColor = lightColor;
        }
        if (lightContrastColor === undefined){
            lightContrastColor = lightColor;
        }
        if (darkContrastColor === undefined){
            darkContrastColor = darkColor;
        }
        this.lightColor = lightColor;
        this.darkColor = darkColor;
        this.lightContrastColor = lightContrastColor;
        this.darkContrastColor = darkContrastColor;
    },

    lightColor: null,
    darkColor: null,
    lightContrastColor: null,
    darkContrastColor: null,

    colorForTraits: function(traits){
        if (traits.accessibilityContrast === UIUserInterface.Contrast.high){
            if (traits.userInterfaceStyle === UIUserInterface.Style.dark){
                return this.darkContrastColor;
            }
            return this.lightContrastColor;
        }
        if (traits.userInterfaceStyle === UIUserInterface.Style.dark){
            return this.darkColor;
        }
        return this.lightColor;
    },

    adaptToTraits: function(traits){
        var color = this.colorForTraits(traits);
        this._space = color._space;
        this._components = color._components;
    },

    colorWithAlpha: function(alpha){
        var lightColor = this.lightColor.colorWithAlpha(alpha);
        var darkColor = this.darkColor.colorWithAlpha(alpha);
        var lightContrastColor = this.lightContrastColor.colorWithAlpha(alpha);
        var darkContrastColor = this.darkContrastColor.colorWithAlpha(alpha);
        return UIColor.initWithStyles(lightColor, darkColor, lightContrastColor, darkContrastColor);
    },

    rgbaColor: function(){
        if (this.lightColor._space === JSColorSpace.rgb && this.darkColor._space === JSColorSpace.rgb && this.lightContrastColor._space === JSColorSpace.rgb && this.darkContrastColor._space === JSColorSpace.rgb){
            return this;
        }
        var lightColor = this.lightColor.rgbaColor();
        var darkColor = this.darkColor.rgbaColor();
        var lightContrastColor = this.lightContrastColor.rgbaColor();
        var darkContrastColor = this.darkContrastColor.rgbaColor();
        return UIColor.initWithStyles(lightColor, darkColor, lightContrastColor, darkContrastColor);
    },

    grayColor: function(){
        if (this.lightColor._space === JSColorSpace.gray && this.darkColor._space === JSColorSpace.gray && this.lightContrastColor._space === JSColorSpace.gray && this.darkContrastColor._space === JSColorSpace.gray){
            return this;
        }
        var lightColor = this.lightColor.grayColor();
        var darkColor = this.darkColor.grayColor();
        var lightContrastColor = this.lightContrastColor.grayColor();
        var darkContrastColor = this.darkContrastColor.grayColor();
        return UIColor.initWithStyles(lightColor, darkColor, lightContrastColor, darkContrastColor);
    },

    colorByBlendingColor: function(other, percentage){
        var lightColor;
        var darkColor;
        var lightContrastColor;
        var darkContrastColor;
        if (other.isKindOfClass(UIColor)){
            lightColor = this.lightColor.colorByBlendingColor(other.lightColor, percentage);
            darkColor = this.darkColor.colorByBlendingColor(other.darkColor, percentage);
            lightContrastColor = this.lightContrastColor.colorByBlendingColor(other.lightContrastColor, percentage);
            darkContrastColor = this.darkContrastColor.colorByBlendingColor(other.darkContrastColor, percentage);
        }else{
            lightColor = this.lightColor.colorByBlendingColor(other, percentage);
            darkColor = this.darkColor.colorByBlendingColor(other, percentage);
            lightContrastColor = this.lightContrastColor.colorByBlendingColor(other, percentage);
            darkContrastColor = this.darkContrastColor.colorByBlendingColor(other, percentage);
        }
        return UIColor.initWithStyles(lightColor, darkColor, lightContrastColor, darkContrastColor);
    },

});

// Common Colors
JSColor.background = UIColor.initWithStyles(JSColor.white, JSColor.initWithWhite(0.15));
JSColor.text = UIColor.initWithStyles(JSColor.black, JSColor.initWithWhite(0.9));
JSColor.hightlight = UIColor.initWithStyles(JSColor.initWithRGBA(0, 0.5, 1), JSColor.initWithRGBA(0.5, 0.75, 1));
JSColor.mutedHighlight = UIColor.initWithStyles(JSColor.black.colorWithAlpha(0.2), JSColor.white.colorWithAlpha(0.2));
JSColor.highlightedText = UIColor.initWithStyles(JSColor.white, JSColor.white);
JSColor.placeholderText = UIColor.initWithStyles(JSColor.black.colorWithAlpha(0.5), JSColor.white.colorWithAlpha(0.4));

// Control Colors
JSColor.controlBackground = UIColor.initWithStyles(JSColor.initWithWhite(0.98), JSColor.initWithWhite(0.2));
JSColor.controlBorder = UIColor.initWithStyles(JSColor.initWithWhite(0.8), JSColor.initWithWhite(0.1));
JSColor.controlTitle = UIColor.initWithStyles(JSColor.initWithWhite(0.2), JSColor.white);
JSColor.activeControlBackground = UIColor.initWithStyles(JSColor.initWithWhite(0.875), JSColor.initWithWhite(0.1));
JSColor.activeControlBorder = UIColor.initWithStyles(JSColor.initWithWhite(0.75), JSColor.black);
JSColor.activeControlTitle = UIColor.initWithStyles(JSColor.initWithWhite(0.2), JSColor.white);
JSColor.disabledControlBackground = UIColor.initWithStyles(JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.1));
JSColor.disabledControlBorder = UIColor.initWithStyles(JSColor.initWithWhite(0.875), JSColor.initWithWhite(0.05));
JSColor.disabledControlTitle = UIColor.initWithStyles(JSColor.initWithWhite(0.6), JSColor.initWithWhite(0.4));
JSColor.controlShadow = UIColor.initWithStyles(JSColor.black.colorWithAlpha(0.1));

// Window Colors
JSColor.windowShadow = UIColor.initWithStyles(JSColor.black.colorWithAlpha(0.4));

// Tooltip Colors
JSColor.toolip = UIColor.initWithStyles(JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.2));
JSColor.tooltipText = UIColor.initWithStyles(JSColor.initWithWhite(0.2), JSColor.white);
JSColor.tooltipBorder = UIColor.initWithStyles(JSColor.initWithWhite(0.7), JSColor.black);
JSColor.tooltipShadow = UIColor.initWithStyles(JSColor.black.colorWithAlpha(0.2));

// Menu Colors
JSColor.menuBar = UIColor.initWithStyles(JSColor.initWithWhite(0.94), JSColor.black);
JSColor.menuBarText = UIColor.initWithStyles(JSColor.black, JSColor.white);
JSColor.menu = UIColor.initWithStyles(JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.3));
JSColor.menuText = UIColor.initWithStyles(JSColor.initWithWhite(0.2), JSColor.white);

// JSClass("UIColor", JSColor, {

//     _derivedColors: null,

//     replace: function(color){
//         this._space = color._space;
//         this._components = color._components;
//         if (this._derivedColors !== null){
//             for (var i = 0, l = this._derivedColors.length; i < l; ++i){
//                 this._updateDerivedColor(this._derivedColors[i]);
//             }
//         }
//     },

//     _updateDerivedColor: function(derivedColor){
//         var replacement = derivedColor.method.apply(this, derivedColor.args);
//         derivedColor.color.replace(replacement);
//     },

//     colorWithAlpha: function(alpha){
//         if (this._derivedColors === null){
//             this._derivedColors = [];
//         }
//         var components = JSCopy(this._components);
//         components[components.length - 1] = alpha;
//         var derived = UIColor.initWithSpaceAndComponents(this._space, components);
//         this._derivedColors.push({
//             method: this.$super.colorWithAlpha,
//             args: [alpha],
//             color: derived
//         });
//         return derived;
//     },

//     colorByBlendingColor: function(otherColor, blendPercentage){
//         if (this._derivedColors === null){
//             this._derivedColors = [];
//         }
//         var derived = UIColor.initWithBlendedColor(this, otherColor, blendPercentage);
//         this._derivedColors.push({
//             method: this.$super.colorByBlendingColor,
//             args: [otherColor, blendPercentage],
//             color: derived
//         });
//         return derived;
//     },

//     rgbaColor: function(){
//         var components;
//         if (this._space === JSColorSpace.rgb){
//             return this;
//         }
//         if (this._derivedColors === null){
//             this._derivedColors = [];
//         }
//         var rgb = this._space.rgbFromComponents(this._components);
//         rgb.push(this.alpha);
//         var derived = UIColor.initWithSpaceAndComponents(JSColorSpace.rgb, rgb);
//         this._derivedColors.push({
//             method: this.$super.rgbaColor,
//             args: [],
//             color: derived
//         });
//         return derived;
//     },

//     grayColor: function(){
//         var components;
//         if (this._space === JSColorSpace.gray){
//             return this;
//         }
//         if (this._derivedColors === null){
//             this._derivedColors = [];
//         }
//         var gray = this._space.grayFromComponents(this._components);
//         gray.push(this.alpha);
//         var derived = UIColor.initWithSpaceAndComponents(JSColorSpace.gray, gray);
//         this._derivedColors.push({
//             method: this.$super.grayColor,
//             args: [],
//             color: derived
//         });
//         return derived;
//     }

// });
