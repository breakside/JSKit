// #import "Foundation/Foundation.js"
/* global JSObject, JSClass, IKEncoder */
'use strict';

JSClass("IKEncoder", JSObject, {

    initWithFormat: function(format, bitmap){
        var encoderClass = IKEncoder.EncoderClassesByFormat[format];
        if (encoderClass !== undefined){
            return encoderClass.initWithBitmap(bitmap);
        }
        return null;
    },

    initWithBitmap: function(bitmap){
        this.bitmap = bitmap;
    },

    bitmap: null,

    getData: function(){
    }

});

IKEncoder.EncoderClassesByFormat = {};

IKEncoder.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.EncoderClassesByFormat[extensions.format] = subclass;
    return subclass;
};