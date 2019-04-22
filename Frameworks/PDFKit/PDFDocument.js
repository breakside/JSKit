// #import "PDFObject.js"
// #import "PDFName.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFDocument, PDFPageIterator, PDFName */
'use strict';

JSGlobalObject.PDFDocument = function(){
    if (this === undefined){
        return new PDFDocument();
    }
};

JSGlobalObject.PDFDocument.prototype = Object.create(PDFObject.prototype, {
    Type:               { enumerable: true, value: PDFName("Catalog") },
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
        get: function PDFDocument_getPageCount(){
            if (this.Pages === null){
                return 0;
            }
            return this.Pages.Count;
        }
    },

    page: {
        value: function PDFDocument_getPage(index){
            if (this.Pages === null){
                return null;
            }
            return this.Pages.page(index);
        }
    }
});