// #import "JSKit/JSObject.js"

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
        this.colorSpace = JSColorSpaceIdentifier.RGBA;
        if (r === undefined) r = 0;
        if (g === undefined) g = 0;
        if (b === undefined) b = 0;
        if (a === undefined) a = 255;
        this.components = [r,g,b,a];
    },

    initWithWhite: function(w){
        this.colorSpace = JSColorSpaceIdentifier.GRAY;
        if (w === undefined) w = 0;
        this.components = [w];
    }

});

var JSColorSpaceIdentifier = {
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