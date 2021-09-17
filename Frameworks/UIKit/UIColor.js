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
/* global UIApplication */
"use strict";

JSClass("UIColor", JSColor, {

    _derivedColors: null,

    replace: function(color){
        this._space = color._space;
        this._components = color._components;
        if (this._derivedColors !== null){
            for (var i = 0, l = this._derivedColors.length; i < l; ++i){
                this._updateDerivedColor(this._derivedColors[i]);
            }
        }
    },

    _updateDerivedColor: function(derivedColor){
        var replacement = derivedColor.method.apply(this, derivedColor.args);
        derivedColor.color.replace(replacement);
    },

    colorWithAlpha: function(alpha){
        if (this._derivedColors === null){
            this._derivedColors = [];
        }
        var components = JSCopy(this._components);
        components[components.length - 1] = alpha;
        var derived = UIColor.initWithSpaceAndComponents(this._space, components);
        this._derivedColors.push({
            method: this.$super.colorWithAlpha,
            args: [alpha],
            color: derived
        });
        return derived;
    },

    colorByBlendingColor: function(otherColor, blendPercentage){
        if (this._derivedColors === null){
            this._derivedColors = [];
        }
        var derived = UIColor.initWithBlendedColor(this, otherColor, blendPercentage);
        this._derivedColors.push({
            method: this.$super.colorByBlendingColor,
            args: [otherColor, blendPercentage],
            color: derived
        });
        return derived;
    },

    rgbaColor: function(){
        var components;
        if (this._space === JSColorSpace.rgb){
            return this;
        }
        if (this._derivedColors === null){
            this._derivedColors = [];
        }
        var rgb = this._space.rgbFromComponents(this._components);
        rgb.push(this.alpha);
        var derived = UIColor.initWithSpaceAndComponents(JSColorSpace.rgb, rgb);
        this._derivedColors.push({
            method: this.$super.rgbaColor,
            args: [],
            color: derived
        });
        return derived;
    },

    grayColor: function(){
        var components;
        if (this._space === JSColorSpace.gray){
            return this;
        }
        if (this._derivedColors === null){
            this._derivedColors = [];
        }
        var gray = this._space.grayFromComponents(this._components);
        gray.push(this.alpha);
        var derived = UIColor.initWithSpaceAndComponents(JSColorSpace.gray, gray);
        this._derivedColors.push({
            method: this.$super.grayColor,
            args: [],
            color: derived
        });
        return derived;
    }

});

UIColor.addNamedColor = function(name){
    var color = UIColor.initWithRGBA();
    Object.defineProperty(JSColor, name, {
        enumerable: true,
        get: function(){
            return color;
        },
        set: function(newColor){
            color.replace(newColor);
            if (UIApplication.shared){
                UIApplication.shared.windowServer.setNeedsCompleteRedisplay();
            }
        }
    });
};

UIColor.addNamedColor("background");
UIColor.addNamedColor("text");
UIColor.addNamedColor("detailText");
UIColor.addNamedColor("highlight");
UIColor.addNamedColor("highlightedText");

UIColor.background = JSColor.white;
UIColor.text = JSColor.black;
UIColor.detailText = JSColor.black.colorLightenedByPercentage(0.3);
UIColor.highlight = JSColor.initWithRGBA();
UIColor.highlightedText = JSColor.white;
