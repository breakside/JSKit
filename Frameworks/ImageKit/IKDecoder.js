// #import "Foundation/Foundation.js"
// #import "ImageKit/IKFormatPNG.js"
// #import "ImageKit/IKFormatJPEG.js"
/* global JSObject, JSClass, IKDecoder, IKBitmap, IKDecoderPNG, IKDecoderJPEG */
'use strict';

JSClass("IKDecoder", JSObject, {

    initWithFormat: function(format){
        switch (format){
            case IKBitmap.Format.png:
                return IKDecoderPNG.init();
            case IKBitmap.Format.jpeg:
                return IKDecoderJPEG.init();
        }
        return null;
    },

    decodeData: function(data, callback){
    }

});