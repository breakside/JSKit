// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFStream, PDFName */
'use strict';


JSGlobalObject.PDFStream = function(){
    if (this === undefined){
        return new PDFStream();
    }
};

JSGlobalObject.PDFStream.prototype = Object.create(PDFObject.prototype, {
    Length:         PDFObjectProperty,
    Filter:         PDFObjectProperty,
    DecodeParms:    PDFObjectProperty,
    F:              PDFObjectProperty,
    FFilter:        PDFObjectProperty,
    FDecodeParms:   PDFObjectProperty,
    DL:             PDFObjectProperty,

    // PDFReader will redefine this property so it reads data from the pdf file
    getData: {
        value: function PDFStream_getData(completion, target){
            return completion.call(target, null);
        }
    }
});

PDFStream.Filters = {
    asciiHex: PDFName("ASCIIHexDecode"),
    ascii85: PDFName("ASCII85Decode"),
    lzw: PDFName("LZWDeccode"),
    flate: PDFName("FlateDecode"),
    runLength: PDFName("RunLengthDecode"),
    ccittFax: PDFName("CCITTFaxDecode"),
    jbig2: PDFName("JBIG2Decode"),
    dct: PDFName("DCTDecode"),
    jpx: PDFName("JPXDecode"),
    crypt: PDFName("Crypt")
};