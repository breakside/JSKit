// #import "PDFKit/PDFKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, PDFReader */
/* global PDFIndirectObject, PDFNameObject, PDFObject, PDFDocumentObject, PDFPageTreeNodeObject, PDFPageObject, PDFResourcesObject, PDFGraphicsStateParametersObject, PDFStreamObject, PDFTrailerObject, PDFFontObject, PDFType1FontObject, PDFTrueTypeFontObject, PDFImageObject, PDFColorSpaceObject */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("PDFReaderTests", TKTestSuite, {

    testEmptyDocument: function(){

        var data = [
            "%PDF-1.7",
            "1 0 obj",
            "<< /Type /Catalog >>",
            "endobj",
            "xref",
            "0 2",
            "0000000000 65535 f\r",
            "0000000009 00000 n\r",
            "trailer",
            "<< /Root 1 0 R /Size 2 >>",
            "startxref",
            "45",
            "%%EOF"
        ].join("\n").utf8();


        var reader = PDFReader.initWithData(data);
        var doc = reader.getDocument();
        TKAssert(doc instanceof PDFDocumentObject);
        TKAssertEquals(doc.Type, "Catalog");
        TKAssertNull(doc.Pages);
    },

    testEmptyPage: function(){

        var data = [
            "%PDF-1.7",
            "2 0 obj",
            "<< /Contents [ ] /Parent 1 0 R /Type /Page >>",
            "endobj",
            "1 0 obj",
            "<< /Kids [ 2 0 R ] /Count 1 /Type /Pages >>",
            "endobj",
            "3 0 obj",
            "<< /Pages 1 0 R /Type /Catalog >>",
            "endobj",
            "xref",
            "0 4",
            "0000000000 65535 f\r",
            "0000000070 00000 n\r",
            "0000000009 00000 n\r",
            "0000000129 00000 n\r",
            "trailer",
            "<< /Root 3 0 R /Size 4 >>",
            "startxref",
            "178",
            "%%EOF"
        ].join("\n").utf8();

        var reader = PDFReader.initWithData(data);
        var doc = reader.getDocument();
        TKAssert(doc instanceof PDFDocumentObject);
        TKAssertEquals(doc.Type, "Catalog");
        TKAssert(doc.Pages instanceof PDFPageTreeNodeObject);
        TKAssertNull(doc.Pages.Parent);
        TKAssertEquals(doc.Pages.Count, 1);
        TKAssertEquals(doc.Pages.Kids.length, 1);
        var page = doc.Pages.Kids[0];
        TKAssert(page instanceof PDFPageObject);
        TKAssertExactEquals(page.Contents.length, 0);
    },

    testStreamObject: function(){
        var data = [
            "%PDF-1.7",                                             //  9        9 (5)
            "5 0 obj",                                              //  8       17
            "<< /Pages 1 0 R /Type /Catalog >>",                    // 34       51
            "endobj",                                               //  7       58 (1)
            "1 0 obj",                                              //  8       66
            "<< /Kids [ 2 0 R ] /Count 1 /Type /Pages >>",          // 44      110
            "endobj",                                               //  7      117 (3)
            "3 0 obj",                                              //  8      125
            "<< /Length 4 0 R >>",                                  // 20      145
            "stream",                                               //  7      152
            "q 100 200 300 400 re f Q",                             // 25      177
            "endstream",                                            // 10      187
            "endobj",                                               //  7      194 (4)
            "4 0 obj",                                              //  8      202
            "24",                                                   //  3      205
            "endobj",                                               //  7      212 (2)
            "2 0 obj",                                              //  8      220
            "<< /Contents 3 0 R /Parent 1 0 R /Type /Page >>",      // 48      268
            "endobj",                                               //  7      275 (xref)
            "xref",
            "0 6",
            "0000000000 65535 f\r",
            "0000000058 00000 n\r",
            "0000000212 00000 n\r",
            "0000000117 00000 n\r",
            "0000000194 00000 n\r",
            "0000000009 00000 n\r",
            "trailer",
            "<< /Root 5 0 R /Size 6 >>",
            "startxref",
            "275",
            "%%EOF"
        ].join("\n").utf8();

        var reader = PDFReader.initWithData(data);
        var doc = reader.getDocument();
        TKAssertEquals(doc.Pages.Count, 1);
        TKAssertEquals(doc.Pages.Kids.length, 1);
        var page = doc.Pages.Kids[0];
        TKAssert(page instanceof PDFPageObject);
        var stream = page.Contents;
        TKAssert(stream instanceof PDFObject);
        TKAssertEquals(stream.Length, 24);
        var expected = "q 100 200 300 400 re f Q".utf8();
        TKAssertObjectEquals(stream.data, expected);
    }

});