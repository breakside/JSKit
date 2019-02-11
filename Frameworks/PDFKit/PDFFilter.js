// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFNameObject.js"
/* global JSClass, JSObject, PDFFilter, PDFNameObject */
/* global PDFASCIIHexFilter, PDFASCII85Filter, PDFLZWFilter, PDFDeflateFilter, PDFRunLengthFilter, PDFCCITTFaxFilter, PDFJBIG2Filter, PDFDCTFilter, PDFJPXFilter, PDFCryptFilter */
'use strict';

JSClass("PDFFilter", JSObject, {

    decodeParameters: null,

    initWithParameters: function(decodeParameters){
        this.decodeParameters = decodeParameters;
    },

    decode: function(input){
        throw new Error("PDFilter decode abstract method must be implemented by subclass");
    },

    encode: function(input){
        throw new Error("PDFilter encode abstract method must be implemented by subclass");
    }
});

PDFFilter.CreateChain = function(filters, decodeParameters){
    if (!filters){
        return [];
    }
    if (filters instanceof PDFNameObject){
        return [PDFFilter.Create(filters, decodeParameters)];
    }
    var chain = [];
    for (var i = 0, l = filters.length; i < l; ++i){
        chain.push(PDFFilter.create(filters[i], decodeParameters[i]));
    }
    return chain;
};

PDFFilter.Create = function(name, decodeParameters){
    switch (name){
        case "ASCIIHexDecode":
            return PDFASCIIHexFilter.init();
        case "ASCII85Decode":
            return PDFASCII85Filter.init();
        case "LZWDecode":
            return PDFLZWFilter.initWithParameters(decodeParameters);
        case "FlateDecode":
            return PDFDeflateFilter.initWithParameters(decodeParameters);
        case "RunLengthDecode":
            return PDFRunLengthFilter.init();
        case "CCITTFaxDecode":
            return PDFCCITTFaxFilter.initWithParameters(decodeParameters);
        case "JBIG2Decode":
            return PDFJBIG2Filter.initWithParameters(decodeParameters);
        case "DCTDecode":
            return PDFDCTFilter.initWithParameters(decodeParameters);
        case "JPXDecode":
            return PDFJPXFilter.initWithParameters(decodeParameters);
        case "Crypt":
            return PDFCryptFilter.initWithParameters(decodeParameters);
    }
};