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
        if (a === undefined) a = 255;
        this.components = [r,g,b,a];
    },

    initWithWhite: function(w){
        this.colorSpace = JSColor.SpaceIdentifier.GRAY;
        if (w === undefined) w = 0;
        this.components = [w];
    },

    initWithSpec: function(spec){
        if (spec.rgba){
            this.initWithRGBA.apply(this, spec.rgba.parseNumberArray());
        }else if (spec.white){
            this.initWithWhite(spec.white);
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

JSColor.whiteColor = function(){
    return JSColor.initWithWhite(255);
};

JSColor.blackColor = function(){
    return JSColor.initWithWhite(0);
};

JSColor.redColor = function(){
    return JSColor.initWithRGBA(255, 0, 0);
};

JSColor.greenColor = function(){
    return JSColor.initWithRGBA(0, 255, 0);
};

JSColor.blueColor = function(){
    return JSColor.initWithRGBA(0, 0, 255);
};