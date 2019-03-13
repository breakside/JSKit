// #import "PDFKit/PDFObject.js"
// #import "FontKit/FontKit.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFFontDescriptor, PDFName, PDFType1Font, PDFTrueTypeFont, FNTType1Font, FNTCompactFontFormat */
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

    getOpenTypeData: {
        value: function PDFFontDescriptor_getOpenTypeData(completion, target){
            if (this.FontFile){
                if (this.Subtype == "Type1" || this.Subtype == "MMType1"){
                    this.FontFile.getData(function(type1){
                        var type1Font = FNTType1Font.initWithData(type1);
                        type1Font.getOpenTypeData(completion, target);
                    }, this);
                }else{
                    completion.call(target, null);
                }
            }if (this.FontFile2){
                this.FontFile2.getData(completion, target);
            }else if (this.FontFile3){
                if (this.FontFile3.Subtype == "OpenType"){
                    this.FontFile3.getData(completion, target);
                }else if (this.FontFile3.Subtype == "Type1C" || this.FontFile3.Subtype == "CIDFontType0C"){
                    this.FontFile3.getData(function(ccf){
                        var compactFont = FNTCompactFontFormat.initWithData(ccf);
                        compactFont.getOpenTypeData(completion, target);
                    }, this);
                }else{
                    completion.call(target, null);
                }
            }else{
                completion.call(target, null);
            }
        }
    }
});