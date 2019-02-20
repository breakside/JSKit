// #import "PDFKit/PDFKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, PDFReader, TKExpectation */
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
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            TKAssert(document instanceof PDFDocumentObject);
            TKAssertEquals(document.Type, "Catalog");
            TKAssertExactEquals(document.pageCount, 0);
            TKAssertNull(document.Pages);
        });
        this.wait(expectation, 2);
    },

    testEmptyPage: function(){

        var data = [
            "%PDF-1.7",
            "2 0 obj",
            "<< /Parent 1 0 R /Type /Page >>",
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
            "0000000056 00000 n\r",
            "0000000009 00000 n\r",
            "0000000115 00000 n\r",
            "trailer",
            "<< /Root 3 0 R /Size 4 >>",
            "startxref",
            "164",
            "%%EOF"
        ].join("\n").utf8();

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            TKAssertEquals(document.pageCount, 1);
            TKAssert(document.Pages instanceof PDFPageTreeNodeObject);
            TKAssertNull(document.Pages.Parent);
            TKAssertEquals(document.Pages.Count, 1);
            TKAssertEquals(document.Pages.Kids.length, 1);
            var page = document.Pages.Kids[0];
            TKAssert(page instanceof PDFPageObject);
            TKAssertNull(page.Contents);
        });
        this.wait(expectation, 2);
    },

    testPageBounds: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] >>",
            "<< /Parent 3 0 R /Type /Page >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            TKAssertNotNull(document.Pages.MediaBox);
            TKAssertEquals(document.Pages.MediaBox.length, 4);
            TKAssertEquals(document.Pages.MediaBox[0], 0);
            TKAssertEquals(document.Pages.MediaBox[1], 0);
            TKAssertEquals(document.Pages.MediaBox[2], 234);
            TKAssertEquals(document.Pages.MediaBox[3], 567);
            var page = document.page(0);
            TKAssertExactEquals(page.Parent, document.Pages);
            TKAssertNull(page.MediaBox);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 0);
            TKAssertEquals(bounds.origin.y, 0);
            TKAssertEquals(bounds.size.width, 234);
            TKAssertEquals(bounds.size.height, 567);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsOverride: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] >>",
            "<< /Parent 3 0 R /Type /Page /MediaBox [0 0 123 456] >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 0);
            TKAssertEquals(bounds.origin.y, 0);
            TKAssertEquals(bounds.size.width, 123);
            TKAssertEquals(bounds.size.height, 456);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsCropBox: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] /CropBox [ 12 34 56 79 ] >>",
            "<< /Parent 3 0 R /Type /Page >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 12);
            TKAssertEquals(bounds.origin.y, 34);
            TKAssertEquals(bounds.size.width, 44);
            TKAssertEquals(bounds.size.height, 45);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsCropBoxOverride: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] >>",
            "<< /Parent 3 0 R /Type /Page /CropBox [ 12 34 56 79 ] >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 12);
            TKAssertEquals(bounds.origin.y, 34);
            TKAssertEquals(bounds.size.width, 44);
            TKAssertEquals(bounds.size.height, 45);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsCropBoxClip: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] /CropBox [ -10 -20 500 600 ] >>",
            "<< /Parent 3 0 R /Type /Page >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 0);
            TKAssertEquals(bounds.origin.y, 0);
            TKAssertEquals(bounds.size.width, 234);
            TKAssertEquals(bounds.size.height, 567);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsTrimBox: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] /CropBox [ 12 34 56 79 ] >>",
            "<< /Parent 3 0 R /Type /Page /TrimBox [ 13 35 55 78 ] >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 13);
            TKAssertEquals(bounds.origin.y, 35);
            TKAssertEquals(bounds.size.width, 42);
            TKAssertEquals(bounds.size.height, 43);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsTrimBoxClip: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] /CropBox [ 12 34 56 79 ] >>",
            "<< /Parent 3 0 R /Type /Page /TrimBox [ 0 35 500 80 ] >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 12);
            TKAssertEquals(bounds.origin.y, 35);
            TKAssertEquals(bounds.size.width, 44);
            TKAssertEquals(bounds.size.height, 44);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsArtBox: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] /CropBox [ 12 34 56 79 ] >>",
            "<< /Parent 3 0 R /Type /Page /ArtBox [ 13 35 55 78 ] >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 13);
            TKAssertEquals(bounds.origin.y, 35);
            TKAssertEquals(bounds.size.width, 42);
            TKAssertEquals(bounds.size.height, 43);
        }, this);
        this.wait(expectation, 2);
    },

    testPageBoundsArtBoxAndTrimBox: function(){
        var data = this._pdfForObjects([
            "<< /Pages 2 0 R /Type /Catalog >>",
            "<< /Kids [ 3 0 R ] /Count 1 /Type /Pages /MediaBox [0 0 234 567] /CropBox [ 12 34 56 79 ] >>",
            "<< /Parent 3 0 R /Type /Page /ArtBox [ 13 35 55 78 ] /TrimBox [ 14 36 54 77 ] >>"
        ], "<< /Root 1 0 R /Size 4 >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            var bounds = page.bounds;
            TKAssertEquals(bounds.origin.x, 13);
            TKAssertEquals(bounds.origin.y, 35);
            TKAssertEquals(bounds.size.width, 42);
            TKAssertEquals(bounds.size.height, 43);
        }, this);
        this.wait(expectation, 2);
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
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            var page = document.page(0);
            TKAssertNotNull(page);
            TKAssert(page instanceof PDFPageObject);
            var stream = page.Contents;
            TKAssert(stream instanceof PDFStreamObject);
            TKAssertEquals(stream.Length, 24);
            expectation.call(stream.getData, stream, function(data){
                var expected = "q 100 200 300 400 re f Q".utf8();
                TKAssertObjectEquals(data, expected);
            });
        });
        this.wait(expectation, 2);
    },

    testStreamWithFilter: function(){
        var data = [
            "%PDF-1.7",                                             //  9        9 (5)
            "5 0 obj",                                              //  8       17
            "<< /Pages 1 0 R /Type /Catalog >>",                    // 34       51
            "endobj",                                               //  7       58 (1)
            "1 0 obj",                                              //  8       66
            "<< /Kids [ 2 0 R ] /Count 1 /Type /Pages >>",          // 44      110
            "endobj",                                               //  7      117 (3)
            "3 0 obj",                                              //  8      125
            "<< /Length 4 0 R /Filter /ASCIIHexDecode >>",          // 44      169
            "stream",                                               //  7      176
            "712031303020323030203330302034303020726520662051>",    // 50      226
            "endstream",                                            // 10      236
            "endobj",                                               //  7      243 (4)
            "4 0 obj",                                              //  8      251
            "49",                                                   //  3      254
            "endobj",                                               //  7      261 (2)
            "2 0 obj",                                              //  8      269
            "<< /Contents 3 0 R /Parent 1 0 R /Type /Page >>",      // 48      317
            "endobj",                                               //  7      324 (xref)
            "xref",
            "0 6",
            "0000000000 65535 f\r",
            "0000000058 00000 n\r",
            "0000000261 00000 n\r",
            "0000000117 00000 n\r",
            "0000000243 00000 n\r",
            "0000000009 00000 n\r",
            "trailer",
            "<< /Root 5 0 R /Size 6 >>",
            "startxref",
            "324",
            "%%EOF"
        ].join("\n").utf8();

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            var page = document.page(0);
            TKAssertNotNull(page);
            expectation.call(page.getContentsData, page, function(data){
                var expected = "q 100 200 300 400 re f Q".utf8();
                TKAssertNotNull(data);
                TKAssertObjectEquals(data, expected);
            });
        });
        this.wait(expectation, 2);
    },

    testStreamWithMultipleFilters: function(){
        var data = [
            "%PDF-1.7",                                                     //  9        9 (5)
            "5 0 obj",                                                      //  8       17
            "<< /Pages 1 0 R /Type /Catalog >>",                            // 34       51
            "endobj",                                                       //  7       58 (1)
            "1 0 obj",                                                      //  8       66
            "<< /Kids [ 2 0 R ] /Count 1 /Type /Pages >>",                  // 44      110
            "endobj",                                                       //  7      117 (3)
            "3 0 obj",                                                      //  8      125
            "<< /Length 4 0 R /Filter [/ASCII85Decode /FlateDecode] >>",    // 58      183
            "stream",                                                       //  7      190
            "Gap9`0JkI[0EP]n+>s8[U/Zh'Kg5W$6j5%~>",                         // 37      227
            "endstream",                                                    // 10      237
            "endobj",                                                       //  7      244 (4)
            "4 0 obj",                                                      //  8      252
            "36",                                                           //  3      255
            "endobj",                                                       //  7      262 (2)
            "2 0 obj",                                                      //  8      270
            "<< /Contents 3 0 R /Parent 1 0 R /Type /Page >>",              // 48      318
            "endobj",                                                       //  7      325 (xref)
            "xref",
            "0 6",
            "0000000000 65535 f\r",
            "0000000058 00000 n\r",
            "0000000262 00000 n\r",
            "0000000117 00000 n\r",
            "0000000244 00000 n\r",
            "0000000009 00000 n\r",
            "trailer",
            "<< /Root 5 0 R /Size 6 >>",
            "startxref",
            "325",
            "%%EOF"
        ].join("\n").utf8();

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            var page = document.page(0);
            expectation.call(page.getContentsData, page, function(data){
                var expected = "q 100 200 300 400 re f Q".utf8();
                TKAssertNotNull(data);
                TKAssertObjectEquals(data, expected);
            });
        });
        this.wait(expectation, 2);
    },

    testEncryptionV1NoPassword: function(){
        // Document ID, Owner Password, and User Password taken from real-world `TIFF 6.pdf` document
        

        // var plain = "(This is a test of rc4 encryption)";
        // var md5 = new JSMD5Hash();
        // md5.start();
        // md5.add(Uint8Array.from([0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A]));
        // md5.add(Uint8Array.from([0xBE,0x62,0x2A,0xC8,0xFC,0xCD,0x91,0x1E,0x93,0x93,0x51,0xB3,0xF5,0x43,0xF5,0x12,0x5F,0xF9,0xB1,0x18,0x7B,0x5F,0xD0,0xB2,0xE4,0xC8,0x2B,0xC5,0x26,0x0E,0x12,0x6B]));
        // md5.add(Uint8Array.from([0xf4,0xff,0x00,0x00]));
        // md5.add(Uint8Array.from([0x6e,0x8e,0x47,0xf8,0x99,0xe5,0x08,0xdd,0x04,0x5e,0x25,0x02,0xe8,0x33,0xbd,0xac]));
        // md5.finish();
        // var documentKey = JSData.initWithBytes(md5.digest(), 5);
        // md5 = new JSMD5Hash();
        // md5.start();
        // md5.add(documentKey.bytes);
        // md5.add(Uint8Array.from([0x05,0x00,0x00,0x00,0x00]));
        // md5.finish();
        // var objectKey = SECDataKey.initWithData(JSData.initWithBytes(md5.digest(), 10));
        // var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rc4);
        // var result = {};
        // cipher.encrypt(plain.utf8(), objectKey, function(encrypted){});
        var data = this._pdfForObjects([
            "<< /Filter /Standard /V 1 /R 2 /P 65524 /O (\xBE\x62\x2A\xC8\xFC\xCD\x91\x1E\x93\x93\x51\xB3\xF5\x43\xF5\x12\x5F\xF9\xB1\x18\x7B\x5F\xD0\xB2\xE4\xC8\x2B\xC5\x26\x0E\x12\x6B) /U (\x21\x60\x15\x5D\xBB\x5C\x5C\x06\x63\xD9\x7F\xB2\xB5\xFE\x7A\xB8\x6A\xB8\xE3\x3E\xD8\x0C\x43\x7A\x39\xB2\x27\xEF\xEB\x6B\xC0\xB2\x4C) >>",
            "<< /Type /Catalog /Pages 3 0 R >>",
            "<< /Type /Pages /Count 1 /Kids [ 4 0 R ] >>",
            "<< /Type /Page /Parent 4 0 R /Contents 5 0 R >>",
            "<< /Length 34 >>\nstream\n\x84\xc4\xc0\xf0\xd8\xff\x56\x27\xae\x5f\x7e\x57\xc3\x3a\x0e\x59\x6d\xf5\xf2\xc1\xc8\xba\xce\xcd\x39\x24\x09\xde\x28\x1c\x29\x81\x72\x94\nendstream",
        ], "<< /Root 2 0 R /Encrypt 1 0 R /Size 6 /ID [ <6e8e47f899e508dd045e2502e833bdac> <6e8e47f899e508dd045e2502e833bdac> ] >>");

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            var page = document.page(0);
            expectation.call(page.getContentsData, page, function(data){
                TKAssertNotNull(data);
                var expected = "(This is a test of rc4 encryption)".utf8();
                TKAssertObjectEquals(data, expected);
            }, this);
        }, this);
        this.wait(expectation, 2);
    },

    testEncryptionV4Password: function(){
        var data = (
            "JVBERi0xLjYKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9G" +
            "bGF0ZURlY29kZSA+PgpzdHJlYW0K0ySmHtNJPD/a1qH6HBPOEg0W5JTD3VPHlBfEiJrrvHVdEQE4" +
            "hritFLsfwx5rTvYSXLJlyW3W3lkIBGtnhWkgSp7x+ESM0R6hiUloiOjeRP4Kd/hepgtPWVHfYDtx" +
            "wlhRA9tFOi08p4zsR3ggzKzP0Xca12nWozEkiBNHsnHpja/wsTLdrPMpBhO+mT3TygGMu/vxB+ZW" +
            "dXAXXdbUBzYFtSZNkmflSmdDmW/rWV3oqaaTzI82NjAvtLdcZA9jeuzIKVAD5q51JSvqZ/MTO6+u" +
            "TVgACD6Ujecr60Vz73FgbceWRF21ubHTbrl0U/LdgyQVESiFAmgLHp0RKjPDy67EQ8S+yiMnaMxY" +
            "ZvhnI+F9mvAKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjI3MgplbmRvYmoKMiAwIG9iago8PCAv" +
            "VHlwZSAvUGFnZSAvUGFyZW50IDMgMCBSIC9SZXNvdXJjZXMgNiAwIFIgL0NvbnRlbnRzIDQgMCBS" +
            "IC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iago2IDAgb2JqCjw8IC9Qcm9jU2V0IFsg" +
            "L1BERiAvVGV4dCBdIC9Db2xvclNwYWNlIDw8IC9DczEgNyAwIFIgPj4gL0ZvbnQgPDwgL1RUMyAx" +
            "MCAwIFIKL1RUMSA4IDAgUiA+PiA+PgplbmRvYmoKMTEgMCBvYmoKPDwgL0xlbmd0aCAxMiAwIFIg" +
            "L04gMyAvQWx0ZXJuYXRlIC9EZXZpY2VSR0IgL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFt" +
            "CtMkph7TSTw/2tah+hwTzhJXjKexstAk2Tj78GnC0Hz2jsqL6QZ7EdN9d2A5oi+FxoBZQgo/hMc2" +
            "303/MakNPMZ8fw1Jp9Tg0EB1CeOQNHsUJb3+TKyk7oBVIBAUGy0HjUoZowt3eZfuJffNCWVSuBaW" +
            "pbdYtaaYYqhxY5W1cGeHI9c+cVNv7fQgH4P8zqUuUpChKHhI9NhdiYIOSdgOk6G/S3pu0sEoEY8q" +
            "N6NZk+CLcDkzZi182wX4F4GZjDLZ0puCku9z8eshd2mTb43ZRZuiL1MpWeXzWviP4FWSOheB1Z2m" +
            "3hhc9PFxTEFV+pX3/fbmLwBzw1NpRw3gBU9Cs3IgBBE4EVo6bXQ9Y55PfkW/0djp92Emm18BXA9r" +
            "RK7+eyFDV3dXB/zBPfRJObgtvJHFwElkjKa7eB4l+ybP6Iny0lE2hVQOM7KsUfIAmPbxfPVjyC1b" +
            "s71SMM5QjVh5w5AJTlJy5fjaEGF8md+GJ/U8BFZTnrkNNas7NV3J4b92Kbw5D6OwwLSGjApwG6Zz" +
            "qvi7ArpxH1Oa03ZUH0Axp0VaJF25zLvqgWKvkj25NXeAk7cXtP68zDamQXNQ9HR9v1R4qUEVoP65" +
            "b7TncjJvpfKR4TPvjv8PVkrLAcFOD4o0OVjLJJsQA4QL/SF5LzAQpjYiNDX5/Fm9XHCDmcbNrpzo" +
            "PBoq3+iW25w0DTIoKezoeoRyZj1AMhms4S/X0Ue+wMxe88A7zi8ovKv9vxKYUGNvlQBZv7AqC9EV" +
            "7PwgTs+us29nKnp8GdCqlEXe5z1Myp98QKL3Jcw9Wthv4A4G7KSE9fHzKSP5Hpwzs5zlp0KocbH3" +
            "UBNoIYmkNMIcNxap7xAXdAABUfa6YwaLyJqBfStq6gmgya4xWwHx5pAmStL/OeR/tIoMTcLNOgwF" +
            "ZINnAwC/SE4SJBvjqisYz/eQ3sN6mcmjDHqLnvL6yvEgKFPztici3xo4y3GFe/e/GBi3QJcRwjxC" +
            "NKda+T37jjSJTS3NjKLHHpoBiKqJB/jJfJ5TXs+qMXzHX4h6HC+NilFR0faKhQtQ+lEUFAWVSCMU" +
            "Yz5hTDH+d6P8KNEXNhHuEdKiSvuZPvslKkKgASRxIEGrqIugdcbYb5QJMI7Sw0nStJWgAUNh1bzq" +
            "6VcWkedtxQcCMkJ0YVOkgOEwn8Tc+r8C/FXy4P/XvCDHRLWIXJ3IlE9JcKSbTU0PdV3mBmJDlQrb" +
            "1Z3XcL8IKzUDuzNSUnECjrWWrgIpJi0Wykq2gT5Skc1mb00k72jDFcgsHDv3qRf2OjNWdoeJfj5H" +
            "NBWbioN2eyjogx/Rr/Q5b0zxGBSgo70c2pPu1bQN6spPzCQLgJHwh2ZWBlIAAsjKXy18U01O0aJk" +
            "TiT+7x205wkX7BRNNGAnb/1x+rL6rogN/NOKla93dNiBFozxtYqjTfoOT6B3B4mGVGebLz4sBu56" +
            "7i5YfpuSTDSPz2i912CXUvQ7NLtMg+CIcvFru21AbiUM6lG9m8eRDDDucESwKUVEhb6NWuVrrORu" +
            "k9LF64WR67qPD0yXLn7oHZ7iOlUHxKdK3wGB/E0wm1/fZA8TFW7ihBeRTzM60RTtJ4MlwqVKX14P" +
            "c9vieBH2UhAastFK6dyE7WehhfHRSn8Qc7gwo1DPZtzmENFst3CdEpRURQUkHIxsurwYsZY5O4BW" +
            "u2+h78z2VC1WRa3jNUA3ts03OPTCwQ13m6hPc6NeNiI1A8UCJmAXRErSp9FKH8cdIfBaewkYLwtI" +
            "5IRBu5REWytHSswsN53aK+BTAzs0jsRo+CvZMvYLQfiiDCLWrwB/IpaimmsiwXtPeNm9aPqHTpyB" +
            "wZ3fD5kPfOtsiGeLe8X+h5rnonuKSGp6wG59N6HGPx+sZBfFluNvDDsX5pS2HvicqC+Az2YfSgmI" +
            "bFJHsW1BOVeG/GEdUUuBbk77Zt7dOyEShGsGPvZOiwe9ruCZ/VJMCbvXGmIGOCAnuKe7iQW70c9I" +
            "uyj+UmMvM20atFpknqtI6Fk8veymdVUymAEyg5mtgZsn0esTR0zUG0O0MkAu0qUoKQwbMu8tM7EB" +
            "GMaqhlHCoctEkgU1BZOu3yXN6Vrweb+jyEUzuA593F31bnYJO+Y6xtqH82tklHoHGwlW8fSFMRnH" +
            "NOarmAiEr+WS/R+AqgYf7rq8pqSXqlcAtSSxnbsJ37rZlUj3q/u2SYrqrqZYC7n/d6WC30oR2azO" +
            "oSusqZQg6s8WMg0hhIkRhLjSJ6EKWo8KXnxSHLyrDjPeN+aunUJg152mvfr4b2L7RzkIOSv/Tecb" +
            "gFq1EARkqMLzu5TCgMHP+NQmkGZ+H2oW9i4ymQ0fJ58mNzGCM5y64rw47MwtJOWp9qH/2WnP4dNp" +
            "jSog+/yqN3pJyH7N79ORTM5c/rsZpRU2gFXGFToatmCHMmeoX3fX6F2BVHFfePd4UI6Oo1olxdGw" +
            "mU/nXvtMmn4JGdOypGw37A+07H1QAftF4Pd5f0mgmhQiriutBcFcQ5UFa+73/k7VXHRaZn8TkHAg" +
            "khbcPVq+ebnYq0YBIkzaReI/6yAebRIlh4Ny6wKuBWV036HcenGOhRClpihT4A0RaEPqzlcSegMi" +
            "VEvdjeM0TbHYpCtP8JxzvPfm9vXLIh4cPA5oC5bVu9+PnD9CYSmuF4Sa7wZebWS3oxUZhT8zXzwy" +
            "ki6jh4SAdt38BDpb+ngNvxOpGGUYmNGfn/KyoMV61x+UN8FhIrJM49IEzzgS32LwpoTTQpxZEFWB" +
            "jYRYL51hx5VNVA2mNuZV6vb3l+e1u6bOjkLh3JFSiKsX4OIVaTCt0Ge7QTa89OychEdJ2LPpJvYG" +
            "k71kFUl1nKtjAa9p+khPTN1t6r6cOVD8NaepFwG3xHuuq7W92LDkkZLiS6fXll+GaU7yESg9TwwR" +
            "+T+2FbEzO3TiEF6J5PtQVbqpjFSKq3cosAmEabh6sx9IcczpVvclkxubH5Udsiinm/Ebi5h7IRtc" +
            "L2+tIuCfyBuscoKWDcyJ0zsH3Art8Gh40yRvuhqBm1ihx3QtE7gWjKUBeLCRf29VGtMi75rshX9D" +
            "bRHatvPtH8zVIS57U5sC9ewg5985gXqpagahOcPw0vJf6BD/CqC/O4NgHoxinsW+7rVwCc+/awSm" +
            "9H94THf5JiYxl/Sh9q6bEg3eaupAhD5P5tOvNyKOmqJjW9oth12V5sypTkEgel9LywoPjXtBG92g" +
            "6ZIQT/3S1H/MGxSEUg0ViaN+TlBS6/ThcYkhdUi5uEC/tx31yU/5BJhm2wPoiC2Zyd5Fgj7mWFFH" +
            "wxqLrzguyiHHitrAZgngYJshMNaxDXwH+W61w2k35Z0HO4an3dbDCDfgdpV1pP9di72QO+XsdYIr" +
            "neuz3vOiy106raElMa6VvUJv954RCrDv24NGSElTOTHMXQNj3LP7jZ49HG9YjSfGBp947ZJQP77a" +
            "kIem87oSjy3CscGMBYg9k6XTbpzze48Wy1fUaiPhhZsYEKE8kMNT4pJxcfZz8gpZ521yLTC1jpVK" +
            "qvDqYVKj5LxJPqgbdj2nxFLI6gplbmRzdHJlYW0KZW5kb2JqCjEyIDAgb2JqCjI2NDAKZW5kb2Jq" +
            "CjcgMCBvYmoKWyAvSUNDQmFzZWQgMTEgMCBSIF0KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1Bh" +
            "Z2VzIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db3VudCAxIC9LaWRzIFsgMiAwIFIgXSA+Pgpl" +
            "bmRvYmoKMTMgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDMgMCBSIC9WZXJzaW9uIC8x" +
            "LjYgPj4KZW5kb2JqCjggMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1RydWVUeXBlIC9C" +
            "YXNlRm9udCAvU1BZTlhaK0hlbHZldGljYU5ldWUgL0ZvbnREZXNjcmlwdG9yCjE0IDAgUiAvRW5j" +
            "b2RpbmcgL01hY1JvbWFuRW5jb2RpbmcgL0ZpcnN0Q2hhciAzMiAvTGFzdENoYXIgMjIyIC9XaWR0" +
            "aHMgWyAyNzgKMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAyNzggMCAwIDAgMCAwIDAgMCAwIDAg" +
            "MCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgNzA0CjAgNTc0IDAgMCAyNTkgMCA2NjcgMCAwIDAgMCA2" +
            "NDggMCAwIDAgNTc0IDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDUzNyA1OTMKNTM3IDU5MyA1Mzcg" +
            "Mjk2IDU3NCA1NTYgMjIyIDIyMiA1MTkgMjIyIDg1MyA1NTYgNTc0IDU5MyAwIDMzMyA1MDAgMzE1" +
            "IDAgNTAwCjc1OCAwIDUwMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAg" +
            "MCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAKMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAw" +
            "IDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMAowIDAgMCAwIDAgMCAwIDAg" +
            "MCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDUxOCBdID4+CmVu" +
            "ZG9iagoxNCAwIG9iago8PCAvVHlwZSAvRm9udERlc2NyaXB0b3IgL0ZvbnROYW1lIC9TUFlOWFor" +
            "SGVsdmV0aWNhTmV1ZSAvRmxhZ3MgMzIgL0ZvbnRCQm94ClstOTUxIC00ODEgMTk4NyAxMDc3XSAv" +
            "SXRhbGljQW5nbGUgMCAvQXNjZW50IDk1MiAvRGVzY2VudCAtMjEzIC9DYXBIZWlnaHQKNzEyIC9T" +
            "dGVtViAwIC9MZWFkaW5nIDI4IC9YSGVpZ2h0IDYyMCAvTWF4V2lkdGggMjIyNSAvRm9udEZpbGUy" +
            "IDE1IDAgUiA+PgplbmRvYmoKMTUgMCBvYmoKPDwgL0xlbmd0aCAxNiAwIFIgL0xlbmd0aDEgODEw" +
            "MCAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0K0ySmHtNJPD/a1qH6HBPOEk4F5Y95YAlb" +
            "urGfu1bPB+bkeTFTzsIImZNx/lcdJPPC1vuFt9RYpEjGnEE++1m71As3UCNTFUQT7Sc8FywmPQ3N" +
            "SRRXhULg0MuR9Po+Lfa7cepFMET7BG6Da9ezQ3gWC+DLYLATfxRy71wQBZxF4+2ytQzDQDkKNKeD" +
            "touh5p5sy8x9Btu5bQiqKSaM4dImLdBcFuQb7zmgLxfiVARaVkIWHKwXjjeuIPO5viMWx1PLOaL7" +
            "KJtES2WXxOUg9I66A6nYR0t5sfhF1fjOBBiwKKqlVDlCqW9LLYOC8wL1TN5U9U0nhSV+D01O08/m" +
            "4Jst0/XfLjs6sojRJJXqPnA39YDKYshuulP34rzGX0aZh17VWbCKtsfMBwCxz3absbs/uPljTNc0" +
            "ooK515ZH5VHiNtOryHlpXt9HoekeRIeqrEwDu73nDeERmiK3vn97HYjPeJTdPv1+ssA4PRnZqalz" +
            "qkW8CzY7VhrPz5kzt51LLM4tat2hCsDmuDynRavltifVr54ho/ttFTDYqVoGOJY/iAprFCeQZYX3" +
            "+AJcYT2lRXozGX/EhftXSbIPhE4t5LiQHBjU4V9lqzCV2Cl5nV3UMRlLz3njawFbr1k8RqjKdwzX" +
            "cSdezyWA39V4fiMEo9ZbgqPB0/XK+dp0OdlmpkQJTyx05uLPjPcYv5xvmslC2b0dCoRJT83vt2gg" +
            "voOxnFH6VGDMpxNKLioMEVErYNMEhvIu6QHaJIIff2yT0ub6Rf2NtcS0ywffj0PTcY8xH7zSFta8" +
            "es3ImTR5t2glLgxEPDZEdZIeKmt6yHXFRemWHgqaL0JokTGKpz0I8agLgyGs5kfKWg6jwVuUie5y" +
            "xa6ec404zh3YSvPmEaLfZnIO/+h0OP/7UZPaKjWiOZbya9IxHV8vVBLK7hZLZ6pnLtUILrpU45KR" +
            "j6068uqLyrmVPjozpBgCwYa7teFH+Nb5ZOcatrfqUbIMSY9xr0EUykDyMbH4/6wqifllkXZ4HVAY" +
            "E7R5RcNDsWMO0dcLCewBaQA9bTjgsUaQFnfDQiFvrHMFKRFuzJ08/AXn5++YwlsSXt/1yv/KgLJ1" +
            "bzVKU+fDx9XHqg8iIvmQ4xOz7MJeCu7128whRJrRK7bfSgTLQcRf53xEQ2baA9N9JX9TkffbDrmx" +
            "b81mg85ZYG5W/VYYnNomYhX2T/LAhMxQM51RaTbn0qulpTqR+raAC1KOcStSvajgMrv748fbDEsF" +
            "ekvD/qr6CBcjoScFEUQljNORWP2fmUgyG01U/QWaEijAeu5EilxJbCFTqka9sK/08c5Vh8xcw/QG" +
            "jggv6zsZau16C1yJlQB/YTs11eL3vwZfA5ZPimvx8nZKdYTVxF2N/GsilG0SuRadgc1BBW6nwrG5" +
            "m9OEYRSWLI7g5E6pB1x4dUNzQfnKAjr2Ch0l6iQDTMCgsN9iPOrJCRLMlIgYIYGzYYSL8HnD4vmk" +
            "GTOYKcOfb7ydckpitjkj0fLaotd/gRwH97DXD8AsITZKGRIsvy9lxgp61IsLQJ+X1z38ENSt5/id" +
            "6sHWt1YcufJHKE1Wfs9Xu56J0x1PyLL/kqYQbodQaWkGVzzaupomZBjx9kHfnFfZBcsMFQAkzTb9" +
            "KTLZEVyyAmBVwqtmcUrhMj30KLN4/UNYod0Pn8hmQyUlBZN2hL8RSoK4wr2DElvXF/h6pUJCTV6C" +
            "heud7FMSMtXpfEWv2lsB1yXysIfOVDgOIg8/LuUKirivTSpHUJ4yrqr5G9iXt1lIw6IZHYclpZEt" +
            "DQ3m2+Y57Ld66FBA78xJOyIm+rUjdX4y6Lc9uvnjwJjLdAMulVKYJfn2AsfKWo2WSrxGoofowGdg" +
            "AB0qmvFTaJAq4JlqUp/K/BxnwBCO9/Az6XbhWK8Bq1h+2ync8yRQ5oUpAKyiWNF+HRCJ9NDy4Zt2" +
            "lIjCD5JVXiTYLJXRmJmS1l1RADKjNDWGasFpmYHTy1dlAs8ryUdqSamfjs8yi3lf6c8ChIMDv8Oq" +
            "hNcDUgN4z/906VfE8t9PyX7LsybxnuGKgM+iaS2HZ1GmbbEBs1/ClGHrV4I43wuqHQdo1rsf9muf" +
            "b5gd+fIVV+xS4N7EzrlpATfOaDix/MZvbdGzID2TRgQ1kF2FXfgTioRa0ZXNHxHNQ7/gixM7qbeq" +
            "Pd5jvBqxxWcfoLtn2wj9ireFlzl+1vP6h43ZnM0o1ICpbeoRCEbgjBWDLRGVapitcL6GPkg8OVMa" +
            "X6YjhlSXhxEsGGMY5ylHBvFlOPQQVwIJO/jJaoA0+dWh7ADKGytDz2KhTHjKDXLqHPz/1m7uzOPP" +
            "a30u5H2TnuzqI5LMNjqpV+Dhi4H0r0uxdwuQD9VWWIveQdIdF0qAWVuRyQwBmwTRpW7LfQUWoreL" +
            "2+zxGiQfmL+uaUADJu9ZE11hmsh5lRLNqa/Clhwffs9W7MqXyEbv/GkB7PHLeGEIoGRjcfGvtg60" +
            "jAre3nHPL6ZpNzE6M/KLnlTvxf0i8Re4jxFbWlVgLAzTW97z4/s708BD+Zb8fmrAfSpiKLdWuW/m" +
            "Wom8EYjVYufaHlC9jAnHz35gNqhdMlSxc84rnXHdsBkCFVw2uno8Y2xovjw9B3SFKEphq3QL/WmM" +
            "OCBkAbk/9KxEHDTz8aSPZzYZUg0HbvOyLNj27g6boP43M8Gv+jbWDjAx/rc0kPadJGPBvco2B3mm" +
            "RMmTHs+y9TrNToYWNYgYPdXDUOqt/XXkdYCAeS8bUItIbt8H6WS5goMwZXz4Y/OaXh+FqUunBTqJ" +
            "daNpqiPq0WvZaqUXHelitll5kXw1b3IE1jAliq+Bab5zB5uzI94YWVitneR8fhzH5ITx5T5AOb0r" +
            "TTrD6AK30mAk9nuTa/w63P2PDjkc3E0ZAt1tFQdrhJoO+ukLqePZ9dZ8/G8VX6Bv951TcsD5iO7n" +
            "P/xTp5I+cKwxxr+8geuiCROWxKF05GdAEbVpd/xcTXeMvg2S8X1SDqq5ObXrrLlORSWP3jKgBY6D" +
            "f61rs1fWiyc7KR+gtUIVtFWEp7spEMmoe14toSlUFVmjSJ3XowFVyb2nySHGGW7GBP0st36atTyZ" +
            "G6fVMRk5T1ZlP8w8dc+eg7VudqQRpaj2x91QPkm8rhrX0XUaFFAj0RvhPVWE4+S8EPjybU7ODsoc" +
            "T+JuGB7ZcMSyiOMunT3b8XAq1dUSXj3gIBRvW/AHHizp33y9U9sPRfhb6WA6SL2/qjDgIQbrg/8Q" +
            "Y8c10KN7vTBK2/qrORrSsqE2KX2RMKgxWW/Y1/oH6g29ba4RND1R58xGgz9ljmjhLw2g57BFXkUM" +
            "92WA2yx8ihQdOrCYXTGECx1Z2kbesnUQOPh7yQORuCwCC5eS7cf1Ye14VmvibfHkIcRMoOOpXFCz" +
            "tXwAOmnO7pB6z55P4rlWdQ9UEbUw8BG5p7Zi9gd5vpc6l4bbKm3ovt0xHuwYol2HNKW0eaT22R7k" +
            "rrcEy7jNtjRWgel3qjfZc922XpSf4OTElR40yr5cxOH6JBoJzwXlk3054I1VK3tcWlh9+RTYynjU" +
            "TfpwGQNDWJOHHE20lcv7ZZ0RefuAjpuOc6VWWOjkmk+fLtAWpoQhYUKnBKsnb8LRqzS/HnKiucjL" +
            "JCs6FzOpTfuaDGnp/b7SbaIY8lF3b8LYmulU7eWNuH4JXJnyLfxS4SXWVIz8bCv5SLDBA58XP1Wk" +
            "wZV/kBlVQo3cSneL+zOos7NmJCwUM5JgRq97AGmsSEjEU8ZUvHahTDtlFyZ6xUulome83XN3V1bj" +
            "X26mI02NEzGIIp1ci6V1L6yjQfKyQwuiwvQ9byASK5cu9s00Bp2aB6xz4dibGzdoQ8A786kKjNOj" +
            "hJ7ko5XqeihQ0uK2TOQB4mfTWYgkYMOnxzWOG++KFLb5R7/rN2XWjp70bVsBsvqsV9cQeCnCfEQS" +
            "t9nZEL04EIMbsXfx+dOdrPy8uriwQbolReYBqL7gq9E2q22yiXW8TPfl8LiuEK8JcoosOGOVdN6s" +
            "v3qxbfuFWtJkh3bgMiHUviD4Fy9Qiu/9YQGNxBCO8sPLBW7wslVrDxiJpLpTgI3qHuIdc+OX2wZX" +
            "XJbrDJfG00r3qCps4OPDNV6/yMHyMPsl5RoKkCqECe1Am7/ECpBRauWcO6Kjol851DVHmQDDT8xy" +
            "5ZUMCSE55bxP50A8j5zCHAC43ZndXHi8hcLMrPZy4u2jOPRmEVMfCpOChDszjeU4YcsrfAyQezuy" +
            "jpMfEJ+yGubiqlECxYNLbbP6OAtnzju60B/CRJ+jBXOWvYhNX9ED/Q8nq8WP3HxPvJrYocoBVHIt" +
            "TFiXKMDB/O/PhheGXzGZIFa62UcFiIWGACLwakZAV5o+U/o3Lu8+syMIDxzaXLpXpaudmN+ock07" +
            "xKDl3djIxP74yyiqxFd+hSMfYUNlwYuyWHmA/2e4PInuZiLrp2/+xFChOyCXKV0tpXF77CrDdhD3" +
            "bvUn/YQN/nhH68efLmIqdC8tGX210h158VbL7cooxYXtq8wQWxGJ5z2IFoWkwumeKdiTA3fDXy8l" +
            "whTJRC9yIGmOQC7D48zcsiHlAISSAc+gf6L/zuD0y1ULd26B306Yll+Dqoauwo213cR78sjkHmwd" +
            "nvOd6NmwDL1kUOoqHm+V/lK6N0kE6Ozlb+kkItt51DQVA6RyV2nmJ2T+DTvTyzcYJ0UpGrr8aVkS" +
            "sCyKebEGFZRMIfdPSF1Lmkj2Nnso9Qzvdg1Mp/o4Jdb0JwqwXjnjaAtYfMhaxStKEcViF3q2AjOA" +
            "tmXfIhNyjiyTIaHhCtBG3jW7da30Zj504Zo8DGQndpD/NCeiTxwYaDM7zjWdlK9mkUNlMJ9Evuiu" +
            "atSiWaZk1rqkdgq4nSFvKd9AbBH+l9/HexsxsjJtQl+YybD53fxXnKQBaFh4GHkbJfMxeIsjKNv/" +
            "JpLwcekhHfQ04DCJyAcw3xV5KsuESkhkCaCO7aqjiabqyhU4uOWzHfgfpdpGLq5r1mYsS3pbt02H" +
            "suwZov/FE4FV8H6mN8/S9xhAzv5ti/Gjuzv3RewkK+djHPBYMJi5NULnwNm/EWgWyNGqGMUJelqM" +
            "Kxuanp7wZNPS80PN7DKe2Esw20uVMhoBWaaLHdm4iLIWpiLoeulkA952yyecbThMxApLGkeOSSpV" +
            "/09cQwdk1jBrNNxCqyL0bB/YU+6H8Y726SWkcKCQIJv7QSkxSub3OC5W+G/qMl+0DtsSyHkwnmvY" +
            "EvYSD/zXKp623wp++92gYr2EcsY7Ukv9nbzv/OMxiMzN8GqzhTMentSpq0cDYf3ZvrW+H3gCjLFq" +
            "F9a8sJRvUB9F5iX0eyu9054XxZJ1ed0fTH1nJNVbjAN0FpxmYp5wNJu+2QHRaw6UMKrdsRFQs2z6" +
            "LidHNU7+uMDUcvY1ntuos3/HYnVgK6s9pGihGlVi6H9hX1NceSo2GBaWpgdlIsk3c9yunkcSGRxH" +
            "7NR7Drv9rryaLyLhXj/rInmUrMSD9aXTNKhWe10y6fj4IIVhEiL9d6xABuzBU6YIYaWSonY3aNLb" +
            "7pMGibekczfAB8w1ZUI7rEBIn4e8ZfTAbXIVryxOB5N1oVErZp9I1UBPOOdi7zFPY5LujTXSdR9W" +
            "sGqEMLcqvlGzZSsjhy/H8iKy9UMNOjtALCG4cGQk1NwnD6Jlq9tDCbPKe6TMEti1N+uifZirel8p" +
            "GoRRlGqfHDdJ9DDZvPRmpErMQlZCfEyTIIAU+o28OaD7RwBZqYTjJm3W4r/w9F71O7qaBxejC+WI" +
            "P5VZHteBR1AL/rJQzAe5X9iFJnkbPO/hSwQY6bsL6pDJDF11wEqfPw37x90+BsMbDRgPWEGou5yx" +
            "GzSLmYlem72bSVmfwpIXnJEozDGpYOxz3Gi9Hbs85Rr4BZCCH4caOv+d3Kub/HxYQEsPkC8h3x4G" +
            "MzAsNxxnnsqxwI8iGfFzCYJQGuQfq7ZWoxFzFC1WczHGZp6yKS3VIOGThO//+mEE1cUkCc/TJxrP" +
            "vp/VLn8nCiDyo6wweGJYlwFkyYBBMXdlosRnPXIoSd1WbrXWbrCPLKB8CmVuZHN0cmVhbQplbmRv" +
            "YmoKMTYgMCBvYmoKNDUxMgplbmRvYmoKMTAgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUg" +
            "L1RydWVUeXBlIC9CYXNlRm9udCAvR0pDS0JEK0hlbHZldGljYU5ldWUgL0ZvbnREZXNjcmlwdG9y" +
            "CjE3IDAgUiAvVG9Vbmljb2RlIDE4IDAgUiAvRmlyc3RDaGFyIDMzIC9MYXN0Q2hhciAzMyAvV2lk" +
            "dGhzIFsgMjc4IF0gPj4KZW5kb2JqCjE4IDAgb2JqCjw8IC9MZW5ndGggMTkgMCBSIC9GaWx0ZXIg" +
            "L0ZsYXRlRGVjb2RlID4+CnN0cmVhbQrTJKYe00k8P9rWofocE84ScHkYMmUlwhL8B0+erPJa950h" +
            "qJs9jiiLAYIIaJ+yuIPS9L/ojBNHQGZQYw+0G8fyPapHW9QxIAy1dJ65GUvgT/yybVAqU4yFL+zx" +
            "TDIadsAezeSs2otRkc3kcD86mWxJ085dT3Htpv7geAA/D2220prabXRRljsBUpMxM3jLCHcJlQZC" +
            "kc+yD3ZhCuywkyoCfgsHH9b/OhvilAQi/gQcw8QiUtleByyIn27P9VHtZtsyiIRiJ2B77vTZCaVI" +
            "cVEd3+OeRvq0ZsUSlC1jmPNzWuHXgtcp84F2k6/I6bHFuZcKZW5kc3RyZWFtCmVuZG9iagoxOSAw" +
            "IG9iagoyNDAKZW5kb2JqCjE3IDAgb2JqCjw8IC9UeXBlIC9Gb250RGVzY3JpcHRvciAvRm9udE5h" +
            "bWUgL0dKQ0tCRCtIZWx2ZXRpY2FOZXVlIC9GbGFncyA0IC9Gb250QkJveApbLTk1MSAtNDgxIDE5" +
            "ODcgMTA3N10gL0l0YWxpY0FuZ2xlIDAgL0FzY2VudCA5NTIgL0Rlc2NlbnQgLTIxMyAvQ2FwSGVp" +
            "Z2h0Cjg0NiAvU3RlbVYgMCAvTGVhZGluZyAyOCAvWEhlaWdodCA2MzQgL01heFdpZHRoIDIyMjUg" +
            "L0ZvbnRGaWxlMiAyMCAwIFIgPj4KZW5kb2JqCjIwIDAgb2JqCjw8IC9MZW5ndGggMjEgMCBSIC9M" +
            "ZW5ndGgxIDE3ODggL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFtCtMkph7TSTw/2tah+hwT" +
            "zhLpuqpbYZvPKXSWdYCHxzcmxqHX1mLPoKOyBGQZPd2YqFnGuFIQGCasNb1lFjenxaZprLV7bLlq" +
            "uQ0Bs3cYbkszTaukmzwGSahBXD0iiPq+IjIyD8zZF49V1f8URxMQdGU7S4Wxagf7+EDuTkK2PWSM" +
            "7qTLJoO2kjp4Fn28jI9h9Mhhgs5ll8jK3RNW+jPhVllku3JrVIlSH+Fnlr9VpxpjEYdQ5TRc05Sn" +
            "hA72roNs3JBw44qN465U80gsY5hFWaq9gaUiJA3OJobzKDI8LDafXZi4ITtTV3N5427RaCovyUcw" +
            "IhPM8gAbI1aIZhAHew7wa2DVVr9/BKYwd7pGoAk3N1gpPuIjmLIIjMIEWfl+J60o9RLdA8Lh5EAA" +
            "5pRS/D4BkX0HmQH/HohiKbHPmHehrA5zUcbasRz4HHNiKmdObaNvKPTxUizowwDWRH7Lpccr4bGD" +
            "ikk4XMdGt4rQTXsYKgCvJvKbiv1OreNCbBqQ0aIetSh4vXTC7uHUfxxwscUbOtggxBdZIC5TOdna" +
            "hWgiwf0OzKA5WqiUE6PU8WICV74qPOZ++FPN997IbnFJ+6jFaAtyxNgY683PniZ73Y1pZGmCiyP6" +
            "oQC8+Kupy/+VB4Poxvrhny57mnJfrrNBz15chyHAWsmijcY8PvZRMH/IVbbAc2ZdCHKxVG1yKatn" +
            "lCfwTNzHiIP6EvoJ3Y9lHFlYGQA6kYKlDNKKn++FUs76TiVUs2K5yz6kDaprP8nLbrR94yDEwnBc" +
            "+lgLNdeatmDEOk0UuEi66o3Cjj4Mlu6btpIMkccMldtzKO+Zb5G6UCwAI22RAeGyIVA2I3IyiD43" +
            "k/eqOH4agS3srIfevoXAhxztnxa+aDNNrKI3Ko1nbq4Qgn62nWJLmMKK/TgmVzm+xiAVGPoIfuQQ" +
            "BLis4OLl8ZxH4xKf2ZNK61FIFGvsyZCQ6Qwpqpv06Tw8IfjjNX2cPimmmosisWqYx6KFOj4l74/N" +
            "ocmHr9TJSi1EuhyywEPZH53PtfGtK8PDfIY8cKORE2tk27qAqkCHftEcISPcuRFQ3eGulExSwEI+" +
            "RR9zk7xbKBT1pLSKG8RTev5SweFuq/BrU1SmMunyX1lus3R0l40l22/eieJ2HSVkq5/vro8anj4v" +
            "hrP+C4huUzvTS5sKZW5kc3RyZWFtCmVuZG9iagoyMSAwIG9iago4ODAKZW5kb2JqCjIyIDAgb2Jq" +
            "CijTJKZcMDM200k8P9rWofpcMDM0XDAyM85cMDIyXClcXNda3NHTMFwwMTL925BcMDM0XDAwM86d" +
            "KQplbmRvYmoKMjMgMCBvYmoKKNMkplwwMzbTSTw/2tah+lwwMzRcMDIzzlwwMjJ+Z3HaXDAwNu+B" +
            "XDAwNjNQiNK+nodcMDA2eVwwMzRNXDAwNkNcMDI06X+40aJcMDA2vlwwMzVcMDM0XDAyMJup3Y2V" +
            "XDAzNE5Ou0rhQ7xGoP1cMDExO1wwMjSNXDAxN+7eXDAwN35+13ZMStPNKQplbmRvYmoKMjQgMCBv" +
            "YmoKKNMkplwwMzbTSTw/2tah+lwwMzRcMDIzzlwwMjLGXDAyN1ngLaNk6FwwMDTjSDVcMDMyfPGL" +
            "KQplbmRvYmoKMjUgMCBvYmoKKNMkplwwMzbTSTw/2tah+lwwMzRcMDIzzlwwMjLhXDAxNtOnl9yG" +
            "tts6N2hcKaQh97dcMDM1QmK4XDAyNbS4cHhmXDAwN8m/LI8pCmVuZG9iagoyNiAwIG9iagoo0ySm" +
            "XDAzNtNJPD/a1qH6XDAzNFwwMjPOXDAyMjdcMDI3YLtToVcki1wwMjRcMDE0W31GYlwwMTcpCmVu" +
            "ZG9iagoyNyAwIG9iagpbIF0KZW5kb2JqCjEgMCBvYmoKPDwgL1RpdGxlIDIyIDAgUiAvUHJvZHVj" +
            "ZXIgMjMgMCBSIC9DcmVhdG9yIDI0IDAgUiAvQ3JlYXRpb25EYXRlIDI1IDAgUiAvTW9kRGF0ZQoy" +
            "NSAwIFIgL0tleXdvcmRzIDI2IDAgUiAvQUFQTDpLZXl3b3JkcyAyNyAwIFIgPj4KZW5kb2JqCjI4" +
            "IDAgb2JqCjw8IC9GaWx0ZXIgL1N0YW5kYXJkIC9WIDQgL1IgNCAvTGVuZ3RoIDEyOCAvQ0YgPDwg" +
            "L1N0ZENGIDw8IC9BdXRoRXZlbnQgL0RvY09wZW4KL0NGTSAvQUVTVjIgL0xlbmd0aCAxNiA+PiA+" +
            "PiAvU3RtRiAvU3RkQ0YgL1N0ckYgL1N0ZENGIC9PIDxiYWRhZDFlODY0NDI2OTk0MjcxMTZkM2U1" +
            "ZDUyNzFiYzgwYTI3ODE0ZmM1ZTgwZjgxNWVmZWVmODM5MzU0YzVmPgovVSA8YTMyMWM0ZWI5YTNl" +
            "NTk3ZjhiMTI4Njk5ZTU5ZTM5ZTcwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD4gL1Ag" +
            "LTQKPj4KZW5kb2JqCnhyZWYKMCAyOQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMTEyNTQgMDAw" +
            "MDAgbiAKMDAwMDAwMDM4NyAwMDAwMCBuIAowMDAwMDAzNDAwIDAwMDAwIG4gCjAwMDAwMDAwMjIg" +
            "MDAwMDAgbiAKMDAwMDAwMDM2OCAwMDAwMCBuIAowMDAwMDAwNDkxIDAwMDAwIG4gCjAwMDAwMDMz" +
            "NjQgMDAwMDAgbiAKMDAwMDAwMzU0NyAwMDAwMCBuIAowMDAwMDAwMDAwIDAwMDAwIG4gCjAwMDAw" +
            "MDkwMzAgMDAwMDAgbiAKMDAwMDAwMDYwMCAwMDAwMCBuIAowMDAwMDAzMzQzIDAwMDAwIG4gCjAw" +
            "MDAwMDM0ODMgMDAwMDAgbiAKMDAwMDAwNDE2NiAwMDAwMCBuIAowMDAwMDA0NDA3IDAwMDAwIG4g" +
            "CjAwMDAwMDkwMDkgMDAwMDAgbiAKMDAwMDAwOTUzNSAwMDAwMCBuIAowMDAwMDA5MTk5IDAwMDAw" +
            "IG4gCjAwMDAwMDk1MTUgMDAwMDAgbiAKMDAwMDAwOTc3NSAwMDAwMCBuIAowMDAwMDEwNzQ1IDAw" +
            "MDAwIG4gCjAwMDAwMTA3NjUgMDAwMDAgbiAKMDAwMDAxMDgzOSAwMDAwMCBuIAowMDAwMDEwOTk1" +
            "IDAwMDAwIG4gCjAwMDAwMTEwNjcgMDAwMDAgbiAKMDAwMDAxMTE1OSAwMDAwMCBuIAowMDAwMDEx" +
            "MjM0IDAwMDAwIG4gCjAwMDAwMTEzOTggMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAyOSAvUm9v" +
            "dCAxMyAwIFIgL0VuY3J5cHQgMjggMCBSIC9JbmZvIDEgMCBSIC9JRCBbIDw2Njg3NTZkYjFlMjky" +
            "ZWEwMjUwMWU5ZTc5YTI2MWUzMD4KPDY2ODc1NmRiMWUyOTJlYTAyNTAxZTllNzlhMjYxZTMwPiBd" +
            "ID4+CnN0YXJ0eHJlZgoxMTY5OAolJUVPRgo="
        ).dataByDecodingBase64();
        
        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertEquals(status, PDFReader.Status.passwordRequired);
            expectation.call(reader.authenticate, reader, "test", function(status, document){
                TKAssertEquals(status, PDFReader.Status.open);
                TKAssertNotNull(document);
                var page = document.page(0);
                expectation.call(page.getContentsData, page, function(data){
                    TKAssertNotNull(data);
                    var expected = [
                    'q Q q 0 0 612 792 re W n /Cs1 cs 1 1 1 sc 0 792 m 612 792 l 612 0 l 0 0 l',
                    'h f Q q 68.79627 72 474.4075 651.2037 re W n /Cs1 cs 0 0 0 sc q 1 0 0 1 72 711',
                    'cm BT 11 0 0 11 0 0 Tm /TT1 1 Tf (This is a test PDF \xdele generated by Pages.)',
                    'Tj ET Q q 1 0 0 1 72 711 cm BT 11 0 0 11 207.801 0 Tm /TT3 1 Tf (!) Tj ET',
                    'Q q 1 0 0 1 72 687 cm BT 11 0 0 11 0 0 Tm /TT1 1 Tf (It is intended to validate the PDFKit javascript framework.)',
                    'Tj ET Q Q'
                    ].join('\n').latin1();
                    TKAssertObjectEquals(data, expected);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2);
    },

    _pdfForObjects: function(objects, trailer){
        var id;
        var lines = ["%PDF-1.2"];
        var offset = 9;
        var offsets = [];
        var i, l;
        for (i = 0, l = objects.length; i < l; ++i){
            offsets.push(offset);
            id = i + 1;
            lines.push("%d 0 obj".sprintf(id));
            offset += lines[lines.length - 1].length + 1;
            lines.push(objects[i]);
            offset += lines[lines.length - 1].length + 1;
            lines.push("endobj");
            offset += lines[lines.length - 1].length + 1;
        }
        var startxref = offset;
        lines.push("xref");
        lines.push("0 %d".sprintf(objects.length + 1));
        lines.push("%010d %05d f\r".sprintf(0, 65535));
        for (i = 0, l = offsets.length; i < l; ++i){
            lines.push("%010d %05d n\r".sprintf(offsets[i], 0));
        }
        lines.push("trailer");
        lines.push(trailer);
        lines.push("startxref");
        lines.push("%d".sprintf(startxref));
        lines.push("%%EOF");
        var pdf = lines.join("\n").latin1();
        return pdf;
    }

});