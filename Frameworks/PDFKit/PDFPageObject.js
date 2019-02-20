// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFNameObject.js"
// #import "PDFKit/PDFStreamObject.js"
/* global JSGlobalObject, JSData, PDFObject, PDFObjectProperty, PDFPageObject, PDFNameObject, PDFStreamObject */
'use strict';

JSGlobalObject.PDFPageObject = function(){
    if (this === undefined){
        return new PDFPageObject();
    }
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

    getContentsData: {
        value: function PDFPageObject_getContentsData(completion, target){
            var contents = this.Contents;
            if (!contents){
                completion.call(target, null);
                return;
            }
            if (contents instanceof PDFStreamObject){
                contents.getData(completion, target);
                return;
            }
            if (contents.length === 0){
                completion.call(target, null);
                return;
            }
            var chunks = [];
            var contentIndex = 0;
            var handleChunk = function(chunk){
                chunks.push(chunk);
                ++contentIndex;
                if (contentIndex < contents.length){
                    contents[contentIndex].getData(handleChunk);
                }else{
                    var data = JSData.initWithChunks(chunks);
                    completion.call(target, data);
                }
            };
            contents[contentIndex].getData(handleChunk);
        }
    }
});
