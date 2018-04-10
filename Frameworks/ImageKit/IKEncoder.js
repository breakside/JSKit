// #import "Foundation/Foundation.js"
/* global JSObject, JSClass, IKEncoder */
'use strict';

JSClass("IKEncoder", JSObject, {

    initWithFormat: function(format){
        var encoderClass = IKEncoder.EncoderClassesByFormat[format];
        if (encoderClass !== undefined){
            return encoderClass.init();
        }
        return null;
    },

    encodeBitmap: function(bitmap){
    }

});

IKEncoder.EncoderClassesByFormat = {};

IKEncoder.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.EncoderClassesByFormat[extensions.format] = subclass;
    return subclass;
};