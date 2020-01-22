// #import PDFKit
// #import TestKit
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
            TKAssert(document instanceof PDFDocument);
            TKAssertEquals(document.Type, "Catalog");
            TKAssertExactEquals(document.pageCount, 0);
            TKAssertNull(document.Pages);
        });
        this.wait(expectation, 2);
    },

    testLinesAfterEOF: function(){
        // Apparently, trailing data after %%EOF is acceptable...have seen it
        // in the wild with files that work fine in Preview
        // NOTE: the files in question were linearized, which may have helped
        // Preview deal with the issue, but even if we don't read the linearized
        // stuff, we should still handle a mostly-correct PDF file without complaint
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
            "%%EOF",
            "",
            "",
            "-- Extra comment"
        ].join("\n").utf8();


        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            TKAssert(document instanceof PDFDocument);
            TKAssertEquals(document.Type, "Catalog");
            TKAssertExactEquals(document.pageCount, 0);
            TKAssertNull(document.Pages);
        });
        this.wait(expectation, 2);
    },

    testCommentAfterEOF: function(){
        // Apparently, trailing data after %%EOF is acceptable...have seen it
        // in the wild with files that work fine in Preview
        // NOTE: the files in question were linearized, which may have helped
        // Preview deal with the issue, but even if we don't read the linearized
        // stuff, we should still handle a mostly-correct PDF file without complaint
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
            "%%EOF hello there"
        ].join("\n").utf8();


        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            TKAssert(document instanceof PDFDocument);
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
            TKAssert(document.Pages instanceof PDFPages);
            TKAssertNull(document.Pages.Parent);
            TKAssertEquals(document.Pages.Count, 1);
            TKAssertEquals(document.Pages.Kids.length, 1);
            var page = document.Pages.Kids[0];
            TKAssert(page instanceof PDFPage);
            TKAssertNull(page.Contents);
        });
        this.wait(expectation, 2);
    },

    testCrossReferenceStream: function(){
        var data = [
            "%PDF-1.7",
            "1 0 obj",
            "<< /Pages 3 0 R /Type /Catalog >>",
            "endobj",
            "2 0 obj",
            "<< /Type /ObjStm /N 2 /First 9 /Length 84 >>",
            "stream",
            "3 0 4 44",
            "<< /Kids [ 4 0 R ] /Count 1 /Type /Pages >>",
            "<< /Parent 3 0 R /Type /Page >>",
            "endstream",
            "enobj",
            "5 0 obj",
            "<< /Type /Xref /Filter /ASCIIHexDecode /Length 67 /Root 1 0 R /Size 6 /W [1 2 1] >>",
            "stream",
            "00 FFFF FF",
            "01 0009 00",
            "01 003a 00",
            "02 0002 00",
            "02 0002 01",
            "01 00Db 00>",
            "endstream",
            "endobj",
            "startxref",
            "219",
            "%%EOF"
        ].join("\n").utf8();

        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        expectation.call(reader.open, reader, function(status, document){
            TKAssertExactEquals(status, PDFReader.Status.open);
            TKAssertNotNull(document);
            TKAssert(document instanceof PDFDocument);
            TKAssert(document.Pages instanceof PDFPages);
            TKAssertEquals(document.pageCount, 1);
            TKAssertNull(document.Pages.Parent);
            TKAssertEquals(document.Pages.Count, 1);
            TKAssertEquals(document.Pages.Kids.length, 1);
            var page = document.Pages.Kids[0];
            TKAssert(page instanceof PDFPage);
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
            TKAssertEquals(bounds.origin.x, 14);
            TKAssertEquals(bounds.origin.y, 36);
            TKAssertEquals(bounds.size.width, 40);
            TKAssertEquals(bounds.size.height, 41);
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
            TKAssert(page instanceof PDFPage);
            var stream = page.Contents;
            TKAssert(stream instanceof PDFStream);
            TKAssertEquals(stream.Length, 24);
            expectation.call(stream.getData, stream, function(data){
                var expected = "q 100 200 300 400 re f Q".utf8();
                TKAssertObjectEquals(data, expected);
            });
        });
        this.wait(expectation, 2);
    },

    testSplitStream: function(){
        var data = this._pdfForObjects([
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Count 1 /Kids [ 3 0 R] >>",
            "<< /Type /Page /Contents [4 0 R 5 0 R] /Parent 2 0 R >>",
            "<< /Length 9 >>\nstream\nq 100 200\nendstream",
            "<< /Length 15 >>\nstream\n 300 400 re f Q\nendstream",
            ], "<< /Root 1 0 R /Size 6 >>");
        var reader = PDFReader.initWithData(data);
        var expectation = TKExpectation.init();
        var Op = PDFStreamOperation.Operator;
        expectation.call(reader.open, reader, function(status, document){
            var page = document.page(0);
            expectation.call(page.getOperationIterator, page, function(iterator){
                TKAssertNotNull(iterator);
                var operation = iterator.next();
                TKAssertNotNull(operation);
                TKAssertEquals(operation.operator, Op.pushState);
                TKAssertExactEquals(operation.operands.length, 0);
                operation = iterator.next();
                TKAssertEquals(operation.operator, Op.rectangle);
                TKAssertExactEquals(operation.operands.length, 4);
                TKAssertEquals(operation.operands[0], 100);
                TKAssertEquals(operation.operands[1], 200);
                TKAssertEquals(operation.operands[2], 300);
                TKAssertEquals(operation.operands[3], 400);
                operation = iterator.next();
                TKAssertEquals(operation.operator, Op.fillPath);
                TKAssertExactEquals(operation.operands.length, 0);
                operation = iterator.next();
                TKAssertEquals(operation.operator, Op.popState);
                TKAssertExactEquals(operation.operands.length, 0);
                operation = iterator.next();
                TKAssertNull(operation);
            }, this);
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
        // md5.add(JSData.initWithArray([0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A]));
        // md5.add(JSData.initWithArray([0xBE,0x62,0x2A,0xC8,0xFC,0xCD,0x91,0x1E,0x93,0x93,0x51,0xB3,0xF5,0x43,0xF5,0x12,0x5F,0xF9,0xB1,0x18,0x7B,0x5F,0xD0,0xB2,0xE4,0xC8,0x2B,0xC5,0x26,0x0E,0x12,0x6B]));
        // md5.add(JSData.initWithArray([0xf4,0xff,0x00,0x00]));
        // md5.add(JSData.initWithArray([0x6e,0x8e,0x47,0xf8,0x99,0xe5,0x08,0xdd,0x04,0x5e,0x25,0x02,0xe8,0x33,0xbd,0xac]));
        // md5.finish();
        // var documentKey = md5.digest().truncatedToLength(5);
        // md5 = new JSMD5Hash();
        // md5.start();
        // md5.add(documentKey);
        // md5.add(JSData.initWithArray([0x05,0x00,0x00,0x00,0x00]));
        // md5.finish();
        // var objectKey = SECDataKey.initWithData(md5.digest().truncatedToLength(10));
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
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "test-encrypted", "pdf", function(data){
            TKAssertNotNull(data);
            var reader = PDFReader.initWithData(data);
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