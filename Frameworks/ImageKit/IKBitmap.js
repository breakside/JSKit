// #import "Foundation/Foundation.js"
// #import "ImageKit/IKDecoder.js"
// #import "ImageKit/IKEncoder.js"
/* global JSClass, JSObject, IKBitmap, JSReadOnlyProperty, JSSize, IKDecoder, IKEncoder */
'use strict';

(function(){

JSClass('IKBitmap', JSObject, {

    size: JSReadOnlyProperty('_size', null),
    data: JSReadOnlyProperty('_data', null),

    initWithData: function(data, size){
        if (data === null){
            return null;
        }
        this._data = data;
        this._size = JSSize(size);
    },

    initWithEncodedData: function(data){
        var format = IKBitmap.FormatOfData(data);
        var decoder = IKDecoder.initWithFormat(format);
        if (decoder === null){
            return null;
        }
        var info = decoder.decodeData(data);
        return this.initWithData(info.data, info.size);
    },

    encode: function(format, callback){
        var encoder = IKEncoder.initWithFormat(format);
        if (encoder === null){
            callback(null);
            return;
        }
        encoder.encodeData(this._data, callback);
    },

    close: function(){
        this._data = null;
    }

});

IKBitmap.FormatOfData = function(data){
    if (data === null){
        return IKBitmap.Format.unknown;
    }
    var bytes = data.bytes;
    if (bytes.length >= 16){
        // PNG magic bytes
        if (bytes[0] == 0x89 &&
            bytes[1] == 0x50 &&
            bytes[2] == 0x4E &&
            bytes[3] == 0x47 &&
            bytes[4] == 0x0D &&
            bytes[5] == 0x0A &&
            bytes[6] == 0x1A &&
            bytes[7] == 0x0A)
        {
            // Verifying "IHDR" signature
            if (bytes[12] == 0x49 && bytes[13] == 0x48 && bytes[14] == 0x44 && bytes[15] == 0x52){
                return IKBitmap.Format.png;
                // Invalid PNG
            }
        }
    }else if (bytes.length >= 2){
        // JPEG magic bytes
        if (bytes[0] == 0xFF && bytes[1] == 0xD8){
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