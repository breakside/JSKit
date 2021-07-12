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

    initFromDictionary: function(dictionary){
        this.initWithSpaceAndComponents(dictionary.colorSpace, JSCopy(dictionary.components));
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

    initWithRGBAHexString: function(hexString){
        if (hexString === null || hexString === undefined){
            return null;
        }
        var components = JSColor.componentsFromHexString(hexString);
        if (components === null){
            return null;
        }
        this._components = components;
        this._colorSpace = JSColor.SpaceIdentifier.rgba;
    },

    initWithHSLA: function(h, s, l, a){
        this._colorSpace = JSColor.SpaceIdentifier.hsla;
        if (h === undefined) h = 0;
        if (s === undefined) s = 0;
        if (l === undefined) l = 0;
        if (a === undefined) a = 1.0;
        this._components = [h,s,l,a];
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
            components = JSColor.componentsFromHexString(rgba);
            if (components === null){
                components = rgba.parseNumberArray();
                if (components.length > 0){
                    components[0] = components[0] / 255;
                }
                if (components.length > 1){
                    components[1] = components[1] / 255;
                }
                if (components.length > 2){
                    components[2] = components[2] / 255;
                }
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

    hslaColor: function(){
        switch (this.colorSpace){
            case JSColor.SpaceIdentifier.rgb:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsl, JSColor.RGBToHSL(this.red, this.green, this.blue)).colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.rgba:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsl, JSColor.RGBToHSL(this.red, this.green, this.blue)).colorWithAlpha(this.alpha);
            case JSColor.SpaceIdentifier.hsl:
                return this.colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.hsla:
                return this;
            case JSColor.SpaceIdentifier.gray:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsl, JSColor.GrayToHSL(this.white)).colorWithAlpha(1.0);
            case JSColor.SpaceIdentifier.graya:
                return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsl, JSColor.GrayToHSL(this.white)).colorWithAlpha(this.alpha);
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
    },

    rgbaHexStringRepresentation: function(){
        var color = this.rgbaColor();
        var r = Math.round(color.red * 255);
        var g = Math.round(color.green * 255);
        var b = Math.round(color.blue * 255);
        var str = "%02x%02x%02x".sprintf(r, g, b);
        if (color.alpha < 1){
            str += "%02x".sprintf(Math.round(color.alpha * 255));
        }
        return str;
    },

    dictionaryRepresentation: function(){
        return {
            colorSpace: this._colorSpace,
            components: JSCopy(this.components)
        };
    },

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

JSColor.RGBToHSL = function(r, g, b){
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    var l = (max + min) / 2;
    if (d === 0){
        return [0, 0, l];
    }
    var s = d / (1 - Math.abs(2 * l - 1));
    var h;
    if (max === r){
        h = 60 * (((g - b) / d) % 6);
    }else if (max == g){
        h = 60 * (((b - r) / d) + 2);
    }else{
        h = 60 * (((r - g) / d) + 4);
    }
    if (h > 360){
        h -= 360;
    }
    if (h < 0){
        h += 360;
    }
    h /= 360;
    return [h, s, l];
};

JSColor.GrayToRGB = function(white){
    // FIXME: could get fancier here with gray coversion
    return [white, white, white];
};

JSColor.GrayToHSL = function(white){
    return [0, 0, white];
};

JSColor.RGBToGray = function(r, g, b){
    return [(r + g + b) / 3.0];
};

JSColor.HSBToHSL = function(h, s, b){
    var l = b * (1 - s / 2);
    if (l > 0 && l < 1){
        s = (b - l) / Math.min(l, 1 - l);
    }
    return [h, s, l];
};

JSColor.HSLToHSB = function(h, s, l){
    var b = l + s * Math.min(l, 1 - l);
    if (b === 0){
        s = 0;
    }else{
        s = 2 * (1 - l / b);
    }
    return [h, s, b];
};

JSColor.componentsFromHexString = function(hexString){
    if (hexString.startsWith("#")){
        return [
            parseInt(hexString.substringInRange(JSRange(1,2)) || "0", 16) / 255,
            parseInt(hexString.substringInRange(JSRange(3,2)) || "0", 16) / 255,
            parseInt(hexString.substringInRange(JSRange(5,2)) || "0", 16) / 255,
            (parseInt(hexString.substringInRange(JSRange(7,2)) || "FF", 16)) / 255
        ];
    }else if (hexString.match(/^[0-9A-Fa-f]{6}$/)){
        return [
            parseInt(hexString.substringInRange(JSRange(0,2)), 16) / 255,
            parseInt(hexString.substringInRange(JSRange(2,2)), 16) / 255,
            parseInt(hexString.substringInRange(JSRange(4,2)), 16) / 255,
            1
        ];
    }else if (hexString.match(/^[0-9A-Fa-f]{8}$/)){
        return [
            parseInt(hexString.substringInRange(JSRange(0,2)), 16) / 255,
            parseInt(hexString.substringInRange(JSRange(2,2)), 16) / 255,
            parseInt(hexString.substringInRange(JSRange(4,2)), 16) / 255,
            (parseInt(hexString.substringInRange(JSRange(6,2)), 16)) / 255
        ];
    }
    return null;
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

JSColor.contentType = "x-jskit/jscolor";

})();