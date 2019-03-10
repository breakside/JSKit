// #import "ImageKit/ImageKit.js"
// #import "PDFKit/PDFXObject.js"
// #import "PDFKit/PDFColorSpace.js"
/* global JSGlobalObject, JSData, PDFXObject, PDFObjectProperty, PDFName, PDFImage, JSSize, IKBitmap, PDFColorSpace */
'use strict';

JSGlobalObject.PDFImage = function(){
    if (this === undefined){
        return new PDFImage();
    }
};

JSGlobalObject.PDFImage.prototype = Object.create(PDFXObject.prototype, {
    Subtype:            { enumerable: true, value: PDFName("Image") },
    Width:              PDFObjectProperty,
    Height:             PDFObjectProperty,
    ColorSpace:         PDFObjectProperty,
    BitsPerComponent:   PDFObjectProperty,
    Intent:             PDFObjectProperty,
    ImageMask:          PDFObjectProperty,
    Mask:               PDFObjectProperty,
    Decode:             PDFObjectProperty,
    Interpolate:        PDFObjectProperty,
    Alternates:         PDFObjectProperty,
    SMask:              PDFObjectProperty,
    SMaskInData:        PDFObjectProperty,
    Name:               PDFObjectProperty,
    StructParent:       PDFObjectProperty,
    ID:                 PDFObjectProperty,
    OPI:                PDFObjectProperty,
    Metadata:           PDFObjectProperty,
    OC:                 PDFObjectProperty,

    getBitmap: {
        value: function PDFImage_getBitmap(completion, target){
            this.getData(function(data){
                // if (data === null){
                    completion.call(target, null);
                    return;
                // }
                // var size = JSSize(this.Width, this.Height);
                // var bitsPerComponent = this.ImageMask ? 1 : this.BitsPerComponent;
                // var colorSpace = PDFColorSpace(this.ColorSpace);
                // // TODO: if colorSpace is null, we must have a JPXDecode filter, which somehow specifies the color space
                // // TODO: load color space
                // var numberOfInputComponents = colorSpace ? colorSpace.numberOfComponents : 1;
                // var bytesPerInputRow = Math.ceil(numberOfInputComponents * bitsPerComponent * size.width / 8);
                // var bytesPerOutputRow = 4 * size.width;
                // var bitmapData = JSData.initWithLength(bytesPerOutputRow * size.height);
                // var i = 0;
                // var o = 0;
                // var color;
                // for (var row = 0; row < size.height; ++row){
                //     for (var col = 0; col < size.width; ++col){
                //         // TODO: read input components
                //         // TODO: use color space to convert input components
                //         // bitmapData[o++] = Math.round(color.red * 255);
                //         // bitmapData[o++] = Math.round(color.green * 255);
                //         // bitmapData[o++] = Math.round(color.blue * 255);
                //         // bitmapData[o++] = Math.round(color.alpha * 255);
                //     }
                // }
                // var bitmap = IKBitmap.initWithData(data, size);
                // completion.call(target, bitmap);
            }, this);
        }
    },

    foundationImage: {
        writable: true,
        value: null,
    },

    load: {
        value: function PDFImage_getImage(completion, target){
            var format = IKBitmap.Format.png;
            this.getBitmap(function(bitmap){
                if (bitmap === null){
                    completion.call(target, null);
                    return;
                }
                this.foundationImage = bitmap.imageWithFormat(format);
                completion.call(target);
            }, this);
        }
    },
});