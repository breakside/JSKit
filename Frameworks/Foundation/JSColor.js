// #import "Foundation/JSObject.js"
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
                return undefined;
            }
            return this._components[component];
        },
        set: function JSColor_setComponent(value){
            var component = SpaceComponentMap[this._colorSpace][publicKey];
            if (component === undefined){
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
        this._colorSpace = JSColor.SpaceIdentifier.RGBA;
        if (r === undefined) r = 0;
        if (g === undefined) g = 0;
        if (b === undefined) b = 0;
        if (a === undefined) a = 1.0;
        this._components = [r,g,b,a];
    },

    initWithWhite: function(w){
        this._colorSpace = JSColor.SpaceIdentifier.Gray;
        if (w === undefined) w = 0;
        this._components = [w];
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
    }

});

JSColor.SpaceIdentifier = {
    RGB: 'rgb',
    RGBA: 'rgba',
    HSLA: 'hsla',
    HSL: 'hsl',
    Gray: 'gray'
};

var SpaceComponentMap = {};
SpaceComponentMap[JSColor.SpaceIdentifier.RGB] = { 'red': 0, 'green': 1, 'blue': 2 };
SpaceComponentMap[JSColor.SpaceIdentifier.RGBA] = { 'red': 0, 'green': 1, 'blue': 2, 'alpha': 3 };
SpaceComponentMap[JSColor.SpaceIdentifier.HSL] = { 'hue': 0, 'saturation': 1, 'lightness': 2 };
SpaceComponentMap[JSColor.SpaceIdentifier.HSLA] = { 'hue': 0, 'saturation': 1, 'lightness': 2, 'alpha': 3 };
SpaceComponentMap[JSColor.SpaceIdentifier.Gray] = { 'white': 0 };

JSColor.clearColor = function(){
    return JSColor.initWithRGBA(0, 0, 0, 0);
};

JSColor.whiteColor = function(){
    return JSColor.initWithWhite(1.0);
};

JSColor.blackColor = function(){
    return JSColor.initWithWhite(0);
};

JSColor.redColor = function(){
    return JSColor.initWithRGBA(1.0, 0, 0);
};

JSColor.greenColor = function(){
    return JSColor.initWithRGBA(0, 1.0, 0);
};

JSColor.blueColor = function(){
    return JSColor.initWithRGBA(0, 0, 1.0);
};

})();