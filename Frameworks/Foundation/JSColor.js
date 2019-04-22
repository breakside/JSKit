// #import "JSObject.js"
/* global JSClass, JSObject, JSCustomProperty, JSColor, JSReadOnlyProperty */
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

    initWithSpec: function(spec, values){
        if (values.rgba){
            var components = values.rgba.parseNumberArray();
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
        }else if (values.white){
            this.initWithWhite(values.white);
        }else if (values.blendBase && values.with && values.percent){
            var base = spec.resolvedValue(values.blendBase, "JSColor");
            var otherColor = spec.resolvedValue(values.with, "JSColor");
            var blendPercentage = spec.resolvedValue(values.percent) / 100;
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
        return this.rgbaColor().colorByBlendingColor(JSColor.blackColor, darkenPercentage);
    },

    colorLightenedByPercentage: function(lightenPercentage){
        return this.rgbaColor().colorByBlendingColor(JSColor.whiteColor, lightenPercentage);
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

    clearColor: {
        configurable: true,
        get: function JSColor_getClearColor(){
            var color = JSColor.initWithRGBA(0, 0, 0, 0);
            Object.defineProperty(this, 'clearColor', {value: color});
            return color;
        }
    },

    whiteColor: {
        configurable: true,
        get: function JSColor_getWhiteColor(){
            var color = JSColor.initWithWhite(1.0);
            Object.defineProperty(this, 'whiteColor', {value: color});
            return color;
        }
    },

    blackColor: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithWhite(0);
            Object.defineProperty(this, 'blackColor', {value: color});
            return color;
        }
    },

    redColor: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(1.0, 0, 0);
            Object.defineProperty(this, 'redColor', {value: color});
            return color;
        }
    },

    greenColor: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(0, 1.0, 0);
            Object.defineProperty(this, 'greenColor', {value: color});
            return color;
        }
    },

    blueColor: {
        configurable: true,
        get: function JSColor_getBlackColor(){
            var color = JSColor.initWithRGBA(0, 0, 1.0);
            Object.defineProperty(this, 'blueColor', {value: color});
            return color;
        }
    },

});

})();