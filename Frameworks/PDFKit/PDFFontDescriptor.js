// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFFontDescriptor, PDFName, PDFType1Font, PDFTrueTypeFont */
'use strict';

JSGlobalObject.PDFFontDescriptor = function(){
    if (this === undefined){
        return new PDFFontDescriptor();
    }
};

JSGlobalObject.PDFFontDescriptor.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFName("FontDescriptor") },
    FontName:       PDFObjectProperty,
    FontFamily:     PDFObjectProperty,
    FontStretch:    PDFObjectProperty,
    FontWeight:     PDFObjectProperty,
    Flags:          PDFObjectProperty,
    FontBBox:       PDFObjectProperty,
    ItalicAngle:    PDFObjectProperty,
    Ascent:         PDFObjectProperty,
    Descent:        PDFObjectProperty,
    Leading:        PDFObjectProperty,
    CapHeight:      PDFObjectProperty,
    XHeight:        PDFObjectProperty,
    StemV:          PDFObjectProperty,
    StemH:          PDFObjectProperty,
    AvgWidth:       PDFObjectProperty,
    MaxWidth:       PDFObjectProperty,
    MissingWidth:   PDFObjectProperty,
    FontFile:       PDFObjectProperty,
    FontFile2:      PDFObjectProperty,
    FontFile3:      PDFObjectProperty,
    CharSet:        PDFObjectProperty,
});