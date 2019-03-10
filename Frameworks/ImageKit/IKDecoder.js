// #import "Foundation/Foundation.js"
/* global JSObject, JSClass, IKDecoder, IKBitmap, IKDecoderPNG, IKDecoderJPEG */
'use strict';

JSClass("IKDecoder", JSObject, {

    initWithFormat: function(format, data){
        var decoderClass = IKDecoder.DecoderClassesByFormat[format];
        if (decoderClass !== undefined){
            return decoderClass.initWithData(data);
        }
        return null;
    },

    initWithData: function(data){
        this.data = data;
    },

    data: null,

    getBitmap: function(){
        return null;
    }

});

IKDecoder.DecoderClassesByFormat = {};

IKDecoder.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.DecoderClassesByFormat[extensions.format] = subclass;
    return subclass;
};