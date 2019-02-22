// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFStreamObject, PDFNameObject */
'use strict';


JSGlobalObject.PDFStreamObject = function(){
    if (this === undefined){
        return new PDFStreamObject();
    }
};

JSGlobalObject.PDFStreamObject.prototype = Object.create(PDFObject.prototype, {
    Length:         PDFObjectProperty,
    Filter:         PDFObjectProperty,
    DecodeParams:   PDFObjectProperty,
    F:              PDFObjectProperty,
    FFilter:        PDFObjectProperty,
    FDecodeParams:  PDFObjectProperty,
    DL:             PDFObjectProperty,

    // PDFReader will redefine this property so it reads data from the pdf file
    getData: {
        value: function PDFStreamObject_getData(completion, target){
            return completion.call(target, null);
        }
    },

    // PDFReader will redefine this property using an internal class to provide the operation
    getOperationIterator: {
        value: function PDFStreamObject_getOperationIterator(completion, target){
            return completion.call(target, null);
        }
    }
});

PDFStreamObject.Filters = {
    asciiHex: PDFNameObject("ASCIIHexDecode"),
    ascii85: PDFNameObject("ASCII85Decode"),
    lzw: PDFNameObject("LZWDeccode"),
    flate: PDFNameObject("FlateDecode"),
    runLength: PDFNameObject("RunLengthDecode"),
    ccittFax: PDFNameObject("CCITTFaxDecode"),
    jbig2: PDFNameObject("JBIG2Decode"),
    dct: PDFNameObject("DCTDecode"),
    jpx: PDFNameObject("JPXDecode"),
    crypt: PDFNameObject("Crypt")
};