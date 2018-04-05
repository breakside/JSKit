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
    DL:             PDFObjectProperty
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