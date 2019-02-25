// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFNameObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFDocumentObject, PDFPageIterator, PDFNameObject */
'use strict';

JSGlobalObject.PDFDocumentObject = function(){
    if (this === undefined){
        return new PDFDocumentObject();
    }
};

JSGlobalObject.PDFDocumentObject.prototype = Object.create(PDFObject.prototype, {
    Type:               { enumerable: true, value: PDFNameObject("Catalog") },
    Version:            PDFObjectProperty,
    Extensions:         PDFObjectProperty,
    Pages:              PDFObjectProperty,
    PageLabels:         PDFObjectProperty,
    Names:              PDFObjectProperty,
    Dests:              PDFObjectProperty,
    ViewerPreferences:  PDFObjectProperty,
    PageLayout:         PDFObjectProperty,
    PageMode:           PDFObjectProperty,
    Outlines:           PDFObjectProperty,
    Threads:            PDFObjectProperty,
    OpenAction:         PDFObjectProperty,
    AA:                 PDFObjectProperty,
    URI:                PDFObjectProperty,
    ArcoForm:           PDFObjectProperty,
    Metadata:           PDFObjectProperty,
    StructTreeRoot:     PDFObjectProperty,
    MarkInfo:           PDFObjectProperty,
    Lang:               PDFObjectProperty,
    SpiderInfo:         PDFObjectProperty,
    OutputIntents:      PDFObjectProperty,
    PieceInfo:          PDFObjectProperty,
    OCProperties:       PDFObjectProperty,
    Perms:              PDFObjectProperty,
    Legal:              PDFObjectProperty,
    Requirements:       PDFObjectProperty,
    Collection:         PDFObjectProperty,
    NeedsRendering:     PDFObjectProperty,

    pageCount: {
        get: function PDFDocumentObject_getPageCount(){
            if (this.Pages === null){
                return 0;
            }
            return this.Pages.Count;
        }
    },

    page: {
        value: function PDFDocumentObject_getPage(index){
            if (this.Pages === null){
                return null;
            }
            return this.Pages.page(index);
        }
    }
});