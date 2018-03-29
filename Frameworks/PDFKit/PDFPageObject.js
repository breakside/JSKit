// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFNameObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFPageObject, PDFNameObject */
'use strict';

JSGlobalObject.PDFPageObject = function(){
    if (this === undefined){
        return new PDFPageObject();
    }
    this.Contents = [];
};

JSGlobalObject.PDFPageObject.prototype = Object.create(PDFObject.prototype, {
    Type:                   { enumerable: true, value: PDFNameObject("Page") },
    Parent:                 PDFObjectProperty,
    LastModified:           PDFObjectProperty,
    Resources:              PDFObjectProperty,
    MediaBox:               PDFObjectProperty,
    CropBox:                PDFObjectProperty,
    BleedBox:               PDFObjectProperty,
    TrimBox:                PDFObjectProperty,
    ArtBox:                 PDFObjectProperty,
    BoxColorInfo:           PDFObjectProperty,
    Contents:               PDFObjectProperty,
    Rotate:                 PDFObjectProperty,
    Group:                  PDFObjectProperty,
    Thumb:                  PDFObjectProperty,
    B:                      PDFObjectProperty,
    Dur:                    PDFObjectProperty,
    Trans:                  PDFObjectProperty,
    Annots:                 PDFObjectProperty,
    AA:                     PDFObjectProperty,
    Metadata:               PDFObjectProperty,
    PieceInfo:              PDFObjectProperty,
    StructParents:          PDFObjectProperty,
    ID:                     PDFObjectProperty,
    PZ:                     PDFObjectProperty,
    SeparationInfo:         PDFObjectProperty,
    Tabs:                   PDFObjectProperty,
    TemplateInstantiated:   PDFObjectProperty,
    PresSteps:              PDFObjectProperty,
    UserUnit:               PDFObjectProperty,
    VP:                     PDFObjectProperty,

    normalizeContent: {
        value: function PDFPageObject_normalizeContent(){
            if (this.Contents.length === 1){
                this.Contents = this.Contents[0];
            }
        }
    }
});
