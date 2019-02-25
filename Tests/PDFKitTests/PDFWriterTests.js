// #import "PDFKit/PDFKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, PDFWriter, PDFWriterStream, PDFWriterTestsStringStream, PDFDocument, PDFPage, PDFPages, PDFStream, PDFName */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("PDFWriterTests", TKTestSuite, {

    testFormat: function(){
        var writer = PDFWriter.init();

        // Numbers
        TKAssertEquals(writer.format("%n", 0), "0");
        TKAssertEquals(writer.format("%n", 1), "1");
        TKAssertEquals(writer.format("%n", -1), "-1");
        TKAssertEquals(writer.format("%n", 1.2), "1.2");
        TKAssertEquals(writer.format("%n", -1.2), "-1.2");
        TKAssertEquals(writer.format("%n", 1.2345678987654), "1.2345678988");
        TKAssertEquals(writer.format("%n", -1.2345678987654), "-1.2345678988");
        TKAssertEquals(writer.format("%n", 1.2345678901234), "1.2345678901");
        TKAssertEquals(writer.format("%n", -1.2345678901234), "-1.2345678901");
        TKAssertEquals(writer.format("%n", 10000000000000), "9999999999.9999999999");
        TKAssertEquals(writer.format("%n", -10000000000000), "-9999999999.9999999999");
        TKAssertEquals(writer.format("%n", 5.0000000000001), "5");
        TKAssertEquals(writer.format("%n", -5.0000000000001), "-5");
        TKAssertEquals(writer.format("%n", 5.9999999999999), "6");
        TKAssertEquals(writer.format("%n", -5.9999999999999), "-6");
        TKAssertEquals(writer.format("%n", null), "0");
        TKAssertEquals(writer.format("%n", null / null), "0");
        TKAssertEquals(writer.format("%n", undefined), "0");
        TKAssertEquals(writer.format("%n", Infinity), "9999999999.9999999999");
        TKAssertEquals(writer.format("%n", -Infinity), "-9999999999.9999999999");

        // Bools
        TKAssertEquals(writer.format("%b", true), "true");
        TKAssertEquals(writer.format("%b", false), "false");
        TKAssertEquals(writer.format("%b", "asdf"), "false");
        TKAssertEquals(writer.format("%b", 0), "false");
        TKAssertEquals(writer.format("%b", 1), "false");
        TKAssertEquals(writer.format("%b", null), "false");
        TKAssertEquals(writer.format("%b", undefined), "false");
        TKAssertEquals(writer.format("%b", Infinity), "false");
        TKAssertEquals(writer.format("%b", null / null), "false");

        // TODO: Names
        TKAssertEquals(writer.format("%N", "Test"), "/Test");
        TKAssertEquals(writer.format("%N", "Hello, World!"), "/Hello,#20World!");
        TKAssertEquals(writer.format("%N", "\x01\x02\xA0\xFF"), "/#01#02#A0#FF");

        // TODO: regular strings

        // TODO: PDF strings
    },

    testEmptyDocument: function(){
        var stream = PDFWriterTestsStringStream.init();
        var writer = PDFWriter.initWithStream(stream);
        var isClosed = false;

        var doc = PDFDocument();

        writer.writeObject(doc);
        writer.close(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var expected = [
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
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testEmptyPage: function(){
        var stream = PDFWriterTestsStringStream.init();
        var writer = PDFWriter.initWithStream(stream);
        var isClosed = false;

        var doc = PDFDocument();
        var pages = PDFPages();
        var page = PDFPage();

        writer.indirect(pages, page);

        doc.Pages = pages;
        page.Parent = pages;
        pages.Kids = [page];
        pages.Count = 1;

        writer.writeObject(page);
        writer.writeObject(pages);
        writer.writeObject(doc);
        writer.close(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var expected = [
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
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testStreamObject: function(){
        var stream = PDFWriterTestsStringStream.init();
        var writer = PDFWriter.initWithStream(stream);
        var isClosed = false;

        var doc = PDFDocument();
        var pages = PDFPages();
        var page = PDFPage();
        var content = PDFStream();

        writer.indirect(pages, page, content);

        page.Parent = pages;
        page.Contents = content;
        pages.Kids = [page];
        pages.Count = 1;
        doc.Pages = pages;
        content.Length = writer.createIndirect();

        writer.writeObject(doc);
        writer.writeObject(pages);
        writer.beginStreamObject(content);
        writer.writeStreamData("q 100 200 300 400 re f Q".utf8());
        writer.endStreamObject();
        content.Length.resolvedValue = 24;
        writer.writeObject(content.Length);
        writer.writeObject(page);
        writer.close(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var expected = [
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
            "<< /Parent 1 0 R /Contents 3 0 R /Type /Page >>",      // 48      268
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
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testNumber: function(){
        // zero
        var stream = PDFWriterTestsStringStream.init();
        var writer = PDFWriter.initWithStream(stream);
        var isClosed = false;
        var doc = PDFDocument();
        doc.XNumber = 0;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        var expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 0 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "56", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Positive Integer
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = 12;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 12 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "57", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Negative Integer
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = -12;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber -12 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "58", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Positive Real
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = 12.34;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 12.34 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "60", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Negative Real
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = -12.34;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber -12.34 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "61", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Decimal Rounding (Positive, Up)
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = 12.345678987654;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 12.3456789877 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "68", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Decimal Rounding (Positive, Down)
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = 12.345678912345;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 12.3456789123 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "68", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Decimal Rounding (Negative, Up)
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = -12.345678987654;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber -12.3456789877 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "69", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Decimal Rounding (Negative, Down)
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = -12.345678912345;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber -12.3456789123 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "69", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Decimal Rounding (To Zero)
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = 12.000000000001234;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 12 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "57", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // NaN
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = null / null;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 0 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "56", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Infinity
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = 1 / 0;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 9999999999.9999999999 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "76", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));

        // Max
        stream = PDFWriterTestsStringStream.init();
        writer = PDFWriter.initWithStream(stream);
        isClosed = false;
        doc = PDFDocument();
        doc.XNumber = 1000000000000;
        writer.writeObject(doc);
        writer.close(function(){ isClosed = true; });
        TKAssert(isClosed);
        expected = ["%PDF-1.7", "1 0 obj", "<< /XNumber 9999999999.9999999999 /Type /Catalog >>", "endobj", "xref", "0 2", "0000000000 65535 f\r", "0000000009 00000 n\r", "trailer", "<< /Root 1 0 R /Size 2 >>", "startxref", "76", "%%EOF"];
        TKAssertEquals(stream.string, expected.join("\n"));
    }

});

JSClass("PDFWriterTestsStringStream", PDFWriterStream, {

    string: null,

    init: function(){
        this.string = "";
    },

    write: function(bytes, offset, length){
        for (; offset < length; ++offset){
            this.string += String.fromCharCode(bytes[offset]);
        }
    },

    close: function(callback){
        callback();
    }
});