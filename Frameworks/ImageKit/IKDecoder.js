// #import "Foundation/Foundation.js"
/* global JSObject, JSClass, IKDecoder, IKBitmap, IKDecoderPNG, IKDecoderJPEG */
'use strict';

JSClass("IKDecoder", JSObject, {

    initWithFormat: function(format){
        var decoderClass = IKDecoder.DecoderClassesByFormat[format];
        if (decoderClass !== undefined){
            return decoderClass.init();
        }
        return null;
    },

    decodeData: function(data){
        return null;
    }

});

IKDecoder.DecoderClassesByFormat = {};

IKDecoder.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.DecoderClassesByFormat[extensions.format] = subclass;
    return subclass;
};