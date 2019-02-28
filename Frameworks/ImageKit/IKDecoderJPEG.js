// https://www.w3.org/TR/2003/REC-PNG-20031110/
// #import "ImageKit/IKDecoder.js"
// #import "ImageKit/IKBitmap.js"
// #import "ImageKit/IKColorSpace.js"
/* global IKDecoder, IKBitmap, JSClass, IKDecoderJPEG */
'use strict';

(function(){

JSClass("IKDecoderJPEG", IKDecoder, {
    format: IKBitmap.Format.jpeg
});

})();