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
// #import "JSColorSpace.js"
'use strict';

(function(){

var ColorComponentProperty = function(){
    if (this === undefined){
        return new ColorComponentProperty();
    }
};

ColorComponentProperty.prototype = Object.create(JSCustomProperty.prototype);

ColorComponentProperty.prototype.define = function(C, publicKey, extensions){
    Object.defineProperty(C.prototype, publicKey, {
        enumerable: true,
        configurable: false,
        get: function JSColor_getComponent(){
            var component = this._space.componentNames[publicKey];
            if (component === undefined){
                return undefined;
            }
            return this._components[component];
        }
    });
};

JSClass('JSColor', JSObject, {
    space: JSReadOnlyProperty("_space"),
    components: JSReadOnlyProperty('_components'),

    red: ColorComponentProperty(),
    green: ColorComponentProperty(),
    blue: ColorComponentProperty(),
    white: ColorComponentProperty(),
    alpha: JSReadOnlyProperty(),

    init: function(){
        this.initWithRGBA();
    },

    initWithSpaceAndComponents: function(colorSpace, components){
        if (colorSpace instanceof JSColorSpace){
            this._space = colorSpace;
            this._components = components;
        }else if (colorSpace === JSColor.SpaceIdentifier.hsl || colorSpace === JSColor.SpaceIdentifier.hsla){
            // the hsl and hsla identifiers are depreicated, so if we see one,
            // we'll use initWithHSLA init method to convert to rgb
            this.initWithHSLA.apply(this, components);
        }else{
            // the rgba and graya identifiers are deprecated, so if we see one,
            // we'll convert it to rgb or gray.
            // NOTE: the identifier values changed to just "rgb" and "gray" so .colorSpace
            // comparisons will still function as expected, but that means we
            // have to check for the old values, which no longer are in the enum.
            if (colorSpace === "rgba"){
                colorSpace = JSColor.SpaceIdentifier.rgb;
            }else if (colorSpace === "graya"){
                colorSpace = JSColor.SpaceIdentifier.gray;
            }
            // Deprecated behavior allowed components without alpha, but the
            // new behavior requires alpha, so add an alpha value if needed 
            if ((colorSpace === JSColor.SpaceIdentifier.rgb && components.length === 3) || (colorSpace === JSColor.SpaceIdentifier.gray && components.length === 1)){
                components = JSCopy(components);
                components.push(1);
            }
            this._space = JSColorSpace.initWithIdentifier(colorSpace);
            this._components = components;   
        }
    },

    initFromDictionary: function(dictionary){
        this.initWithSpaceAndComponents(dictionary.space, JSCopy(dictionary.components));
    },

    initWithRGBA: function(r, g, b, a){
        this._space = JSColorSpace.rgb;
        if (r === undefined) r = 0;
        if (g === undefined) g = 0;
        if (b === undefined) b = 0;
        if (a === undefined) a = 1.0;
        this._components = [r,g,b,a];
    },

    initWithWhite: function(w, a){
        this._space = JSColorSpace.gray;
        if (w === undefined) w = 0;
        if (a === undefined) a = 1.0;
        this._components = [w, a];
    },

    initWithRGBAHexString: function(hexString){
        if (hexString === null || hexString === undefined){
            return null;
        }
        var components = JSColor.componentsFromHexString(hexString);
        if (components === null){
            return null;
        }
        this._space = JSColorSpace.rgb;
        this._components = components;
    },

    initWithHSLA: function(h, s, l, a){
        var space = JSColorSpace.rgb;
        var components = space.componentsFromHSL([h, s, l]);
        components.push(a !== undefined ? a : 1);
        this.initWithSpaceAndComponents(space, components);
    },

    initWithHSVA: function(h, s, v, a){
        var space = JSColorSpace.rgb;
        var components = space.componentsFromHSV([h, s, v]);
        components.push(a !== undefined ? a : 1);
        this.initWithSpaceAndComponents(space, components);
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
        if (this._space !== other._space){
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
        return "%s(%s)".sprintf(this._space.identifier, this._components.join(','));
    },

    getAlpha: function(){
        return this.components[this.components.length - 1];
    },

    colorWithAlpha: function(alpha){
        var components = JSCopy(this._components);
        components[components.length - 1] = alpha;
        return JSColor.initWithSpaceAndComponents(this._space, components);
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
        var components;
        switch (this._space.identifier){
            case JSColor.SpaceIdentifier.rgb:
                return this;
            case JSColor.SpaceIdentifier.gray:
                return JSColor.initWithRGBA(this.white, this.white, this.white, this.alpha);
            default:
                return null;
        }
    },

    grayColor: function(){
        switch (this._space.identifier){
            case JSColor.SpaceIdentifier.rgb:
                return JSColor.initWithWhite((this.red + this.green + this.blue) / 3, this.alpha);
            case JSColor.SpaceIdentifier.gray:
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
            space: this._space.identifier,
            components: JSCopy(this.components)
        };
    },

    // Deprecated
    colorSpace: JSReadOnlyProperty(),
    hue: JSReadOnlyProperty(),
    saturation: JSReadOnlyProperty(),
    lightness: JSReadOnlyProperty(),

    getColorSpace: function(){
        return this._space.identifier;
    },

    getHue: function(){
        var rgbaColor = this.rgbaColor();
        var hsl = JSColorSpace.rgb.hslFromComponents(rgbaColor.components);
        return hsl[0];
    },

    getSaturation: function(){
        var rgbaColor = this.rgbaColor();
        var hsl = JSColorSpace.rgb.hslFromComponents(rgbaColor.components);
        return hsl[1];
    },

    getLightness: function(){
        var rgbaColor = this.rgbaColor();
        var hsl = JSColorSpace.rgb.hslFromComponents(rgbaColor.components);
        return hsl[2];
    }

});

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

JSColor.SpaceIdentifier = Object.create(JSColorSpace.Identifier, {
    // deprecated
    rgba: {value: 'rgb'}, // value changed from rgba
    graya: {value: 'gray'}, // value changed from graya
    hsla: {value: 'hsla'},
    hsl: {value: 'hsl'},
});

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