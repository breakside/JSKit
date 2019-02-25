// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFFont, PDFName, PDFType1FontObject, PDFTrueTypeFontObject */
'use strict';

(function(){

JSGlobalObject.PDFFont = function(){
    if (this === undefined){
        return new PDFFont();
    }
};

JSGlobalObject.PDFFont.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFName("Font") },
    Subtype:        PDFObjectProperty,
});

JSGlobalObject.PDFType1FontObject = function(){
    if (this === undefined){
        return new PDFType1FontObject();
    }
};

JSGlobalObject.PDFType1FontObject.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("Type1") },
    Name:           PDFObjectProperty,
    BaseFont:       PDFObjectProperty,
    FirstChar:      PDFObjectProperty,
    LastChar:       PDFObjectProperty,
    Widths:         PDFObjectProperty,
    FontDescriptor: PDFObjectProperty,
    Encoding:       PDFObjectProperty,
    ToUnicode:      PDFObjectProperty,

    stringFromData: {
        value: function PDFType1FontObject_stringFromData(data){
            // FIXME: use Encoding/ToUnicode to decode data
            // TODO: expand combined chars like fi
            return String.initWithData(data, String.Encoding.latin1);
        }
    },
});

JSGlobalObject.PDFTrueTypeFontObject = function(){
    if (this === undefined){
        return new PDFTrueTypeFontObject();
    }
};

JSGlobalObject.PDFTrueTypeFontObject.prototype = Object.create(PDFType1FontObject.prototype, {
    Subtype:    { enumerable: true, value: PDFName("TrueType") },
});

var StandardFonts = [
    "Times-Roman",
    "Times-Bold",
    "Times-Italic",
    "Times-BoldItalic",
    "Helvetica",
    "Helvetica-Bold",
    "Helvetica-Oblique",
    "Helvetica-BoldOblique",
    "Courier",
    "Courier-Bold",
    "Courier-Oblique",
    "Courier-BoldOblique",
    "Symbol",
    "ZapfDingbats"
];

})();