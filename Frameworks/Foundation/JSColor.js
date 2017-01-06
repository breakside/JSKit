// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSColor */
'use strict';

JSClass('JSColor', JSObject, {
    colorSpace: null,
    components: null,

    init: function(){
        this.initWithRGBA();
    },

    initWithSpaceAndComponents: function(colorSpace, components){
        this.colorSpace = colorSpace;
        this.components = components;
    },

    initWithRGBA: function(r, g, b, a){
        this.colorSpace = JSColor.SpaceIdentifier.RGBA;
        if (r === undefined) r = 0;
        if (g === undefined) g = 0;
        if (b === undefined) b = 0;
        if (a === undefined) a = 1.0;
        this.components = [r,g,b,a];
    },

    initWithWhite: function(w){
        this.colorSpace = JSColor.SpaceIdentifier.GRAY;
        if (w === undefined) w = 0;
        this.components = [w];
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
    }

});

JSColor.SpaceIdentifier = {
    RGB: 'rgb',
    RGBA: 'rgba',
    HSLA: 'hsla',
    HSL: 'hsl',
    GRAY: 'gray'
};

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