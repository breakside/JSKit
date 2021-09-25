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
// #import "UIColorSpace.js"
/* global UIApplication */
"use strict";

JSColor.definePropertiesFromExtensions({

    initWithUIStyles: function(lightColor, darkColor, lightContrastColor, darkContrastColor){
        if (darkColor === undefined){
            darkColor = lightColor;
        }
        if (lightContrastColor === undefined){
            lightContrastColor = lightColor;
        }
        if (darkContrastColor === undefined){
            darkContrastColor = darkColor;
        }
        if (lightColor.space === JSColorSpace.ui){
            lightColor = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, lightColor.components.slice(0, 4));
        }else{
            lightColor = lightColor.rgbaColor();
        }
        if (darkColor.space === JSColorSpace.ui){
            darkColor = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, darkColor.components.slice(4, 8));
        }else{
            darkColor = darkColor.rgbaColor();
        }
        if (lightContrastColor.space === JSColorSpace.ui){
            lightContrastColor = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, lightContrastColor.components.slice(8, 12));
        }else{
            lightContrastColor = lightContrastColor.rgbaColor();
        }
        if (darkContrastColor.space === JSColorSpace.ui){
            darkContrastColor = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, darkContrastColor.components.slice(12, 16));
        }else{
            darkContrastColor = darkContrastColor.rgbaColor();
        }
        var space = JSColorSpace.ui;
        var components = [
            lightColor.components[0],
            lightColor.components[1],
            lightColor.components[2],
            lightColor.components[3],
            darkColor.components[0],
            darkColor.components[1],
            darkColor.components[2],
            darkColor.components[3],
            lightContrastColor.components[0],
            lightContrastColor.components[1],
            lightContrastColor.components[2],
            lightContrastColor.components[3],
            darkContrastColor.components[0],
            darkContrastColor.components[1],
            darkContrastColor.components[2],
            darkContrastColor.components[3],
            -1
        ];
        return JSColor.initWithSpaceAndComponents(space, components);
    },

});

JSColor.defineInitMethod("initWithUIStyles");

// JSColorSpace.theme.setStylesForName("background", JSColor.white, JSColor.initWithWhite(0.15));
// JSColorSpace.theme.setStylesForName("text", JSColor.black, JSColor.initWithWhite(0.9));

// Common Colors
JSColor.background = JSColor.initWithUIStyles(JSColor.white, JSColor.initWithWhite(0.15));
JSColor.text = JSColor.initWithUIStyles(JSColor.black, JSColor.initWithWhite(0.9));
JSColor.hightlight = JSColor.initWithUIStyles(JSColor.initWithRGBA(0, 0.5, 1), JSColor.initWithRGBA(0.5, 0.75, 1));
JSColor.mutedHighlight = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.2), JSColor.white.colorWithAlpha(0.2));
JSColor.highlightedText = JSColor.initWithUIStyles(JSColor.white, JSColor.white);
JSColor.placeholderText = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.5), JSColor.white.colorWithAlpha(0.4));

// Control Colors
JSColor.controlBackground = JSColor.initWithUIStyles(JSColor.initWithWhite(0.98), JSColor.initWithWhite(0.2));
JSColor.controlBorder = JSColor.initWithUIStyles(JSColor.initWithWhite(0.8), JSColor.initWithWhite(0.1));
JSColor.controlTitle = JSColor.initWithUIStyles(JSColor.initWithWhite(0.2), JSColor.white);
JSColor.activeControlBackground = JSColor.initWithUIStyles(JSColor.initWithWhite(0.875), JSColor.initWithWhite(0.1));
JSColor.activeControlBorder = JSColor.initWithUIStyles(JSColor.initWithWhite(0.75), JSColor.black);
JSColor.activeControlTitle = JSColor.initWithUIStyles(JSColor.initWithWhite(0.2), JSColor.initWithWhite(0.8));
JSColor.disabledControlBackground = JSColor.initWithUIStyles(JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.1));
JSColor.disabledControlBorder = JSColor.initWithUIStyles(JSColor.initWithWhite(0.875), JSColor.initWithWhite(0.05));
JSColor.disabledControlTitle = JSColor.initWithUIStyles(JSColor.initWithWhite(0.6), JSColor.initWithWhite(0.4));
JSColor.controlShadow = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.1));

// Window Colors
JSColor.windowShadow = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.4));

// Tooltip Colors
JSColor.toolip = JSColor.initWithUIStyles(JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.2));
JSColor.tooltipText = JSColor.initWithUIStyles(JSColor.initWithWhite(0.2), JSColor.white);
JSColor.tooltipBorder = JSColor.initWithUIStyles(JSColor.initWithWhite(0.7), JSColor.black);
JSColor.tooltipShadow = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.2));

// Menu Colors
JSColor.menuBar = JSColor.initWithUIStyles(JSColor.initWithWhite(0.94), JSColor.black);
JSColor.menuBarText = JSColor.initWithUIStyles(JSColor.black, JSColor.white);
JSColor.menu = JSColor.initWithUIStyles(JSColor.initWithWhite(0.94), JSColor.initWithWhite(0.3));
JSColor.menuText = JSColor.initWithUIStyles(JSColor.initWithWhite(0.2), JSColor.white);

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
