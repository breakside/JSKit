// #import Foundation
// #import "ImageKit/IKDecoder.js"
// #import "ImageKit/IKEncoder.js"
/* global JSClass, JSObject, IKBitmap, JSReadOnlyProperty, JSImage, JSSize, IKDecoder, IKEncoder */
'use strict';

(function(){

JSClass('IKBitmap', JSObject, {

    size: JSReadOnlyProperty('_size', null),
    data: JSReadOnlyProperty('_data', null),
    colorSpace: JSReadOnlyProperty('_colorSpace', null),

    initWithData: function(data, size, colorSpace){
        if (data === null){
            return null;
        }
        this._data = data;
        this._size = JSSize(size);
        this._colorSpace = colorSpace || null;
    },

    initWithEncodedData: function(data){
        var format = IKBitmap.FormatOfData(data);
        var decoder = IKDecoder.initWithFormat(format, data);
        if (decoder === null){
            return null;
        }
        return decoder.getBitmap();
    },

    encodedData: function(format){
        var encoder = IKEncoder.initWithFormat(format, this);
        if (encoder === null){
            return null;
        }
        var encoded = encoder.getData();
        return encoded;
    },

    close: function(){
        this._data = null;
    }

});

IKBitmap.FormatOfData = function(data){
    if (data === null){
        return IKBitmap.Format.unknown;
    }
    if (data.length >= 16){
        // PNG magic bytes
        if (data[0] == 0x89 &&
            data[1] == 0x50 &&
            data[2] == 0x4E &&
            data[3] == 0x47 &&
            data[4] == 0x0D &&
            data[5] == 0x0A &&
            data[6] == 0x1A &&
            data[7] == 0x0A)
        {
            return IKBitmap.Format.png;
            // Verifying "IHDR" signature
            // if (data[12] == 0x49 && data[13] == 0x48 && data[14] == 0x44 && data[15] == 0x52){
            // }
        }
    }
    if (data.length >= 2){
        // JPEG magic bytes
        if (data[0] == 0xFF && data[1] == 0xD8){
            return IKBitmap.Format.jpeg;
        }
    }
    return IKBitmap.Format.unknown;
};

IKBitmap.Format = {
    unknown: 0,
    png: 1,
    jpeg: 2
};

})();