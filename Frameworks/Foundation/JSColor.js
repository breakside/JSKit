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
/* global JSBundle, JSSpec */
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
        var space = null;
        if (typeof(colorSpace) === "string"){
            // The deprecated initWithSpaceAndComponents constructor took a
            // SpaceIdentifier (string enum) identifier for the color space. 
            // We can't break that, so we'll convert the string to an appropriate
            // JSColorSpace.
            // NOTE: since SpaceIdentifier is also deprecated, and since some
            // of the values changed for comparison purposes, we'll used hard-coded
            // values as they were before deprecation.
            if (colorSpace === "hsl" || colorSpace === "hsla"){
                // hsl and hsla aren't really their own color spaces, they're
                // just different ways to express rgb, so we'll convert the
                // components to rgb values.
                space = JSColorSpace.rgb;
                var rgbComponents = space.componentsFromHSL(components);
                rgbComponents.push(components.length === 4 ? components[3] : 1);
                components = rgbComponents;
            }else if (colorSpace === "rgb" || colorSpace == "rgba"){
                space = JSColorSpace.rgb;
            }else if (colorSpace === "gray" || colorSpace === "graya"){
                space = JSColorSpace.gray;
            }else{
                throw new Error("Unknown color space identifier: %s".sprintf(colorSpace));
            }
            // Deprecated behavior allowed components without alpha, but the
            // new behavior requires alpha, so add an alpha value if needed
            if (components.length === space.numberOfComponents){
                components = JSCopy(components);
                components.push(1);
            }
        }else{
            space = colorSpace;
        }
        if (components.length !== space.numberOfComponents + 1){
            throw new Error("%d components required for %s color space, %d given".sprintf(space.numberOfComponents + 1, space.name, components.length));
        }
        this._space = space;
        this._components = components;
    },

    initFromDictionary: function(dictionary){
        var space = null;
        if (dictionary.space === "rgb"){
            space = JSColorSpace.rgb;
        }else if (dictionary.space === "gray"){
            space = JSColorSpace.gray;
        }
        if (space === null){
            return null;
        }
        this.initWithSpaceAndComponents(space, JSCopy(dictionary.components));
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
        while (base._space instanceof JSMappedColorSpace){
            base = base._space.colorFromComponents(base._components);
        }
        while (otherColor._space instanceof JSMappedColorSpace){
            otherColor = otherColor._space.colorFromComponents(otherColor._components);
        }
        if (base.space !== otherColor.space || !base.space.canMixComponents){
            base = base.rgbaColor();
            otherColor = otherColor.rgbaColor();
        }
        var components = base.space.mixedComponents(base.components, otherColor.components, blendPercentage);
        components.push(base.alpha);
        this.initWithSpaceAndComponents(base.space, components);
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
            var white = spec.valueForKey("white");
            components = white.parseNumberArray();
            this.initWithWhite.apply(this, components);
        }else if (spec.containsKey("blendBase") && spec.containsKey("with") && spec.containsKey("percent")){
            var base = spec.valueForKey("blendBase", JSColor);
            var otherColor = spec.valueForKey("with", JSColor);
            var blendPercentage = spec.valueForKey("percent") / 100;
            this.initWithBlendedColor(base, otherColor, blendPercentage);
        }else if (spec.containsKey("space")){
            var spaceName = spec.valueForKey("space");
            var space = JSColorSpace[spaceName];
            if (space === undefined){
                throw new Error("Unknown color space: %s".sprintf(spaceName));
            }
            components = [];
            for (var componentName in space.componentNames){
                if (!spec.containsKey(componentName)){
                    throw new Error("Missing component %s for color in space: %s".sprintf(componentName, spaceName));
                }
                components[space.componentNames[componentName]] = spec.valueForKey(componentName);
            }
            if (space instanceof JSMappedColorSpace){
                components.push(1);
            }
            var alpha = 1;
            if (spec.containsKey("alpha")){
                alpha = spec.valueForKey("alpha");
            }else if (space instanceof JSMappedColorSpace){
                alpha = -1;
            }
            components.push(alpha);
            this.initWithSpaceAndComponents(space, components);
        }else if (spec.containsKey("light") && this.initWithUIStyles){
            var light = spec.valueForKey("light", JSColor);
            var dark = light;
            var lightContrast = light;
            if (spec.containsKey("dark")){
                dark = spec.valueForKey("dark", JSColor);
            }
            var darkContrast = dark;
            if (spec.containsKey("lightContrast")){
                lightContrast = spec.valueForKey("lightContrast", JSColor);
            }
            if (spec.containsKey("darkContrast")){
                darkContrast = spec.valueForKey("darkContrast", JSColor);
            }
            this.initWithUIStyles(light, dark, lightContrast, darkContrast);
        }
    },

    isEqual: function(other){
        if (!other || !other.isKindOfClass || !other.isKindOfClass(JSColor)){
            return false;
        }
        if (this._space !== other._space){
            return false;
        }
        return this._space.compareComponents(this._components, other._components) && Math.round(this.alpha * 255) === Math.round(other.alpha * 255);
    },

    toString: function(){
        return "%s(%s)".sprintf(this._space.name, this._components.join(','));
    },

    getAlpha: function(){
        var alpha = this._components[this._space.numberOfComponents];
        if (alpha < 0){
            alpha = this._space.alphaFromComponents(this._components);
        }
        return alpha;
    },

    colorWithAlpha: function(alpha){
        var components = JSCopy(this._components);
        components[this._space.numberOfComponents] = alpha;
        return JSColor.initWithSpaceAndComponents(this._space, components);
    },

    colorDarkenedByPercentage: function(darkenPercentage){
        var components = this._space.componentsDarkenedByPercentage(this._components, darkenPercentage);
        components.push(this.alpha);
        return JSColor.initWithSpaceAndComponents(this._space, components);
    },

    colorLightenedByPercentage: function(lightenPercentage){
        var components = this._space.componentsLightenedByPercentage(this._components, lightenPercentage);
        components.push(this.alpha);
        return JSColor.initWithSpaceAndComponents(this._space, components);
    },

    colorByBlendingColor: function(otherColor, blendPercentage){
        return JSColor.initWithBlendedColor(this, otherColor, blendPercentage);
    },

    rgbaColor: function(){
        if (this._space === JSColorSpace.rgb){
            return this;
        }
        var rgb = this._space.rgbFromComponents(this._components);
        rgb.push(this.alpha);
        return JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, rgb);
    },

    grayColor: function(){
        if (this._space === JSColorSpace.gray){
            return this;
        }
        var gray = this._space.grayFromComponents(this._components);
        gray.push(this.alpha);
        return JSColor.initWithSpaceAndComponents(JSColorSpace.gray, gray);
    },

    colorInSpace: function(space){
        if (space === this._space){
            return this;
        }
        var components = space.componentsFromSpace(this._space, this._components);
        components.push(this._components[this._components.length - 1]);
        return JSColor.initWithSpaceAndComponents(space, components);
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
        if (this._space !== JSColorSpace.rgb && this._space !== JSColorSpace.gray){
            return this.rgbaColor().dictionaryRepresentation();
        }
        return {
            space: this._space.name,
            components: JSCopy(this._components)
        };
    },

    // Deprecated
    colorSpace: JSReadOnlyProperty(),
    hue: JSReadOnlyProperty(),
    saturation: JSReadOnlyProperty(),
    lightness: JSReadOnlyProperty(),

    getColorSpace: function(){
        return this._space.name;
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

// deprecated
JSColor.SpaceIdentifier = {
    rgb: 'rgb',
    gray: 'gray',
    rgba: {value: 'rgb'}, // value changed from rgba
    graya: {value: 'gray'}, // value changed from graya
    hsla: {value: 'hsla'},
    hsl: {value: 'hsl'},
};

Object.defineProperties(JSColor, {

    clear: {
        configurable: true,
        get: function JSColor_getClearColor(){
            var color = JSColor.initWithRGBA(0, 0, 0, 0);
            Object.defineProperty(JSColor, 'clear', {value: color});
            return color;
        }
    },

    white: {
        configurable: true,
        get: function JSColor_getWhiteColor(){
            var color = JSColor.initWithWhite(1.0);
            Object.defineProperty(JSColor, 'white', {value: color});
            return color;
        }
    },

    black: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithWhite(0);
            Object.defineProperty(JSColor, 'black', {value: color});
            return color;
        }
    },

    red: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(1.0, 0, 0);
            Object.defineProperty(JSColor, 'red', {value: color});
            return color;
        }
    },

    green: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(0, 1.0, 0);
            Object.defineProperty(JSColor, 'green', {value: color});
            return color;
        }
    },

    blue: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(0, 0, 1.0);
            Object.defineProperty(JSColor, 'blue', {value: color});
            return color;
        }
    },

});


JSColor.contentType = "x-jskit/jscolor";

})();