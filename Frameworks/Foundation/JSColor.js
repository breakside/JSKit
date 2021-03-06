// Copyright 2020 Breakside Inc.
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

// #import "JSObject.js"
// #import "CoreTypes.js"
'use strict';

(function(){

var ColorComponentProperty = function(){
    if (this === undefined){
        return new ColorComponentProperty();
    }
};

ColorComponentProperty.prototype = Object.create(JSCustomProperty.prototype);

ColorComponentProperty.prototype.define = function(C, publicKey, extensions){
    var component = this.component;
    var space = this.space;
    Object.defineProperty(C.prototype, publicKey, {
        enumerable: true,
        configurable: false,
        get: function JSColor_getComponent(){
            var component = SpaceComponentMap[this._colorSpace][publicKey];
            if (component === undefined){
                if (publicKey == 'alpha'){
                    return 1.0;
                }
                return undefined;
            }
            return this._components[component];
        },
        set: function JSColor_setComponent(value){
            var component = SpaceComponentMap[this._colorSpace][publicKey];
            if (component !== undefined){
                SpaceComponentMap[this._colorSpace][publicKey] = value;
            }
        }
    });
};

JSClass('JSColor', JSObject, {
    colorSpace: JSReadOnlyProperty('_colorSpace'),
    components: JSReadOnlyProperty('_components'),

    red: ColorComponentProperty(),
    green: ColorComponentProperty(),
    blue: ColorComponentProperty(),
    hue: ColorComponentProperty(),
    saturation: ColorComponentProperty(),
    lightness: ColorComponentProperty(),
    alpha: ColorComponentProperty(),
    white: ColorComponentProperty(),

    init: function(){
        this.initWithRGBA();
    },

    initWithSpaceAndComponents: function(colorSpace, components){
        this._colorSpace = colorSpace;
        this._components = components;
    },

    initWithRGBA: function(r, g, b, a){
        this._colorSpace = JSColor.SpaceIdentifier.rgba;
        if (r === undefined) r = 0;
        if (g === undefined) g = 0;
        if (b === undefined) b = 0;
        if (a === undefined) a = 1.0;
        this._components = [r,g,b,a];
    },

    initWithWhite: function(w, a){
        if (w === undefined) w = 0;
        if (a === undefined){
            this._colorSpace = JSColor.SpaceIdentifier.gray;
            this._components = [w];
        }else{
            this._colorSpace = JSColor.SpaceIdentifier.graya;
            this._components = [w, a];
        }
    },

    initWithBlendedColor: function(base, otherColor, blendPercentage){
        otherColor = otherColor.rgbaColor();
        var original = base.rgbaColor();
        var r = original.red   + (otherColor.red   - original.red)   * blendPercentage;
        var g = original.green + (otherColor.green - original.green) * blendPercentage;
        var b = original.blue  + (otherColor.blue  - original.blue)  * blendPercentage;
        this.initWithRGBA(r, g, b, original.alpha);
    },

    initWithSpec: function(spec){
        var components;
        if (spec.containsKey("rgba")){
            var rgba = spec.valueForKey("rgba");
            if (rgba.startsWith("#")){
                components = [
                    parseInt(rgba.substringInRange(JSRange(1,2)) || "0", 16),
                    parseInt(rgba.substringInRange(JSRange(3,2)) || "0", 16),
                    parseInt(rgba.substringInRange(JSRange(5,2)) || "0", 16),
                    (parseInt(rgba.substringInRange(JSRange(7,2)) || "FF", 16)) / 255
                ];
            }else if (rgba.match(/^[0-9A-Fa-f]{6}$/)){
                components = [
                    parseInt(rgba.substringInRange(JSRange(0,2)), 16),
                    parseInt(rgba.substringInRange(JSRange(2,2)), 16),
                    parseInt(rgba.substringInRange(JSRange(4,2)), 16),
                    1
                ];
            }else if (rgba.match(/^[0-9A-Fa-f]{8}$/)){
                components = [
                    parseInt(rgba.substringInRange(JSRange(0,2)), 16),
                    parseInt(rgba.substringInRange(JSRange(2,2)), 16),
                    parseInt(rgba.substringInRange(JSRange(4,2)), 16),
                    (parseInt(rgba.substringInRange(JSRange(6,2)), 16)) / 255
                ];
            }else{
                components = rgba.parseNumberArray();
            }
            if (components.length > 0){
                components[0] = components[0] / 255;
            }
            if (components.length > 1){
                components[1] = components[1] / 255;
            }
            if (components.length > 2){
                components[2] = components[2] / 255;
            }
            this.initWithRGBA.apply(this, components);
        }else if (spec.containsKey("white")){
            this.initWithWhite(spec.valueForKey("white"));
        }else if (spec.containsKey("blendBase") && spec.containsKey("with") && spec.containsKey("percent")){
            var base = spec.valueForKey("blendBase", JSColor);
            var otherColor = spec.valueForKey("with", JSColor);
            var blendPercentage = spec.valueForKey("percent") / 100;
            this.initWithBlendedColor(base, otherColor, blendPercentage);
        }
    },

    isEqual: function(other){
        if (!other || !other.isKindOfClass || !other.isKindOfClass(JSColor)){
            return false;
        }
        if (this._colorSpace != other._colorSpace){
            return false;
        }
        for (var i = 0, l = this._components.length; i < l; ++i){
            if (Math.round(this._components[i] * 255) != Math.round(other._components[i] * 255)){
                return false;
            }
        }
        return true;
    },

    toString: function(){
        return "%s(%s)".sprintf(this._colorSpace, this._components.join(','));
    },

    colorWithAlpha: function(alpha){
        switch (this.colorSpace){
            case JSColor.SpaceIdentifier.rgb:
            case JSColor.SpaceIdentifier.rgba:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, [this.red, this.green, this.blue, alpha]);
            case JSColor.SpaceIdentifier.hsl:
            case JSColor.SpaceIdentifier.hsla:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsla, [this.hue, this.saturation, this.lightness, alpha]);
            case JSColor.SpaceIdentifier.gray:
            case JSColor.SpaceIdentifier.graya:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.graya, [this.white, alpha]);
            default:
                return null;
        }
    },

    colorDarkenedByPercentage: function(darkenPercentage){
        return this.rgbaColor().colorByBlendingColor(JSColor.black, darkenPercentage);
    },

    colorLightenedByPercentage: function(lightenPercentage){
        return this.rgbaColor().colorByBlendingColor(JSColor.white, lightenPercentage);
    },

    colorByBlendingColor: function(otherColor, blendPercentage){
        return JSColor.initWithBlendedColor(this, otherColor, blendPercentage);
    },

    rgbaColor: function(){
        switch (this.colorSpace){
            case JSColor.SpaceIdentifier.rgb:
                return this.colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.rgba:
                return this;
            case JSColor.SpaceIdentifier.hsl:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, JSColor.HSLToRGB(this.hue, this.saturation, this.lightness)).colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.hsla:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, JSColor.HSLToRGB(this.hue, this.saturation, this.lightness)).colorWithAlpha(this.alpha);
            case JSColor.SpaceIdentifier.gray:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, JSColor.GrayToRGB(this.white)).colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.graya:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, JSColor.GrayToRGB(this.white)).colorWithAlpha(this.alpha);
            default:
                return null;
        }
    },

    grayColor: function(){
        var rgba;
        switch (this.colorSpace){
            case JSColor.SpaceIdentifier.rgb:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.gray, JSColor.RGBToGray(this.red, this.blue, this.green)).colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.rgba:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.gray, JSColor.RGBToGray(this.red, this.blue, this.green)).colorWithAlpha(this.alpha);
            case JSColor.SpaceIdentifier.hsl:
                rgba = this.rgbaColor();
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.gray, JSColor.RGBToGray(rgba.red, rgba.blue, rgba.green)).colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.hsla:
                rgba = this.rgbaColor();
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.gray, JSColor.RGBToGray(rgba.red, rgba.blue, rgba.green)).colorWithAlpha(this.alpha);
            case JSColor.SpaceIdentifier.gray:
                return this.colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.graya:
                return this;
            default:
                return null;
        }
    }

});

JSColor.HSLToRGB = function(h, s, l){
    var m2;
    if (l < 0.5){
        m2 = l * (s + 1);
    }else{
        m2 = l + s - l * s;
    }
    var m1 = l * 2 - m2;
    var r = JSColor._HueToRGB(m1, m2, h + 1 / 3);
    var g = JSColor._HueToRGB(m1, m2, h);
    var b = JSColor._HueToRGB(m1, m2, h - 1 / 3);
    return [r, g, b];
};

JSColor._HueToRGB = function(m1, m2, h){
    if (h < 0){
        h +=1 ;
    }else if (h > 1){
        h -= 1;
    }
    if (6 * h < 1){
        return m1 + (m2 - m1) * h * 6;
    }
    if (2 * h < 1){
        return m2;
    }
    if (3 * h < 2){
        return m1 + (m2 - m1) * (2 / 3 - h) * 6;
    }
    return m1;
};

JSColor.GrayToRGB = function(white){
    // FIXME: could get fancier here with gray coversion
    return [white, white, white];
};

JSColor.RGBToGray = function(r, g, b){
    return [(r + g + b) / 3.0];
};

JSColor.SpaceIdentifier = {
    rgb: 'rgb',
    rgba: 'rgba',
    hsla: 'hsla',
    hsl: 'hsl',
    gray: 'gray',
    graya: 'graya',
};

var SpaceComponentMap = {};
SpaceComponentMap[JSColor.SpaceIdentifier.rgb] = { 'red': 0, 'green': 1, 'blue': 2 };
SpaceComponentMap[JSColor.SpaceIdentifier.rgba] = { 'red': 0, 'green': 1, 'blue': 2, 'alpha': 3 };
SpaceComponentMap[JSColor.SpaceIdentifier.hsl] = { 'hue': 0, 'saturation': 1, 'lightness': 2 };
SpaceComponentMap[JSColor.SpaceIdentifier.hsla] = { 'hue': 0, 'saturation': 1, 'lightness': 2, 'alpha': 3 };
SpaceComponentMap[JSColor.SpaceIdentifier.gray] = { 'white': 0 };
SpaceComponentMap[JSColor.SpaceIdentifier.graya] = { 'white': 0, 'alpha': 1 };

Object.defineProperties(JSColor, {

    clear: {
        configurable: true,
        get: function JSColor_getClearColor(){
            var color = JSColor.initWithRGBA(0, 0, 0, 0);
            Object.defineProperty(this, 'clear', {value: color});
            return color;
        }
    },

    white: {
        configurable: true,
        get: function JSColor_getWhiteColor(){
            var color = JSColor.initWithWhite(1.0);
            Object.defineProperty(this, 'white', {value: color});
            return color;
        }
    },

    black: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithWhite(0);
            Object.defineProperty(this, 'black', {value: color});
            return color;
        }
    },

    red: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(1.0, 0, 0);
            Object.defineProperty(this, 'red', {value: color});
            return color;
        }
    },

    green: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(0, 1.0, 0);
            Object.defineProperty(this, 'green', {value: color});
            return color;
        }
    },

    blue: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(0, 0, 1.0);
            Object.defineProperty(this, 'blue', {value: color});
            return color;
        }
    },

});

})();