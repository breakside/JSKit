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
    },

    cssString: function(){
        if (this.colorSpace === JSColorSpaceIdentifier.RGBA){
            return 'rgba(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.RGB){
            return 'rgb(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.HSLA){
            return 'hsla(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.HSL){
            return 'hsl(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.GRAY){
            var w = this.components[0];
            return 'rgb(' + [w, w, w].join(',') + ')';
        }else{
            throw Error("Unsupported color space.  Cannot generate css string for '%s'".sprintf(this.colorSpace));
        }
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