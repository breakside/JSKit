// #import "PDFKit/PDFKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, PDFContext, PDFWriterStream, PDFContextTestsStringStream, JSRect */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

// IMPORTANT:
// 1. These tests check for an exact sequence of PDF objects
// 2. PDF validity does not actually depend on such exact equivalence
// 3. There are many ways to write the same PDF
// 4. Minor changes to PDFContext can therefore cause total test failures
// 5. It might be better to rework these tests to use a PDFReader, validating
//    overall document consistency, and checking specific objects (like first page)
//    for desired content.
JSClass("PDFContextTests", TKTestSuite, {

    testEmptyDocument: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var expected = [
            "%PDF-1.7",
            "1 0 obj",
            "<< /Kids [ ] /Count 0 /Type /Pages >>",
            "endobj",
            "2 0 obj",
            "<< /Pages 1 0 R /Type /Catalog >>",
            "endobj",
            "xref",
            "0 3",
            "0000000000 65535 f ",
            "0000000009 00000 n ",
            "0000000062 00000 n ",
            "trailer",
            "<< /Root 2 0 R /Size 3 >>",
            "startxref",
            "111",
            "%%EOF"
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testEmptyPage: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage();
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var expected = [
            "%PDF-1.7",
            "3 0 obj",
            "<< /Length 2 0 R >>",
            "stream",
            "",
            "endstream",
            "endobj",
            "2 0 obj",
            "0",
            "endobj",
            "5 0 obj",
            "<< >>",
            "endobj",
            "4 0 obj",
            "<< /Contents 3 0 R /Parent 1 0 R /Resources 5 0 R /Type /Page >>",
            "endobj",
            "1 0 obj",
            "<< /Kids [ 4 0 R ] /Count 1 /Type /Pages >>",
            "endobj",
            "6 0 obj",
            "<< /Pages 1 0 R /Type /Catalog >>",
            "endobj",
            "xref",
            "0 7",
            "0000000000 65535 f ",
            "0000000180 00000 n ",
            "0000000062 00000 n ",
            "0000000009 00000 n ",
            "0000000100 00000 n ",
            "0000000079 00000 n ",
            "0000000239 00000 n ",
            "trailer",
            "<< /Root 6 0 R /Size 7 >>",
            "startxref",
            "288",
            "%%EOF"
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testRectangle: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage();
        context.fillRect(JSRect(100, 200, 300, 400));
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var expected = [
            "%PDF-1.7",
            "3 0 obj",
            "<< /Length 2 0 R >>",
            "stream",
            "n 100 200 300 400 re f ",
            "endstream",
            "endobj",
            "2 0 obj",
            "23",
            "endobj",
            "5 0 obj",
            "<< >>",
            "endobj",
            "4 0 obj",
            "<< /Contents 3 0 R /Parent 1 0 R /Resources 5 0 R /Type /Page >>",
            "endobj",
            "1 0 obj",
            "<< /Kids [ 4 0 R ] /Count 1 /Type /Pages >>",
            "endobj",
            "6 0 obj",
            "<< /Pages 1 0 R /Type /Catalog >>",
            "endobj",
            "xref",
            "0 7",
            "0000000000 65535 f ",
            "0000000204 00000 n ",
            "0000000085 00000 n ",
            "0000000009 00000 n ",
            "0000000124 00000 n ",
            "0000000103 00000 n ",
            "0000000263 00000 n ",
            "trailer",
            "<< /Root 6 0 R /Size 7 >>",
            "startxref",
            "312",
            "%%EOF"
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testCircle: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage();
        context.fillEllipseInRect(JSRect(100, 200, 100, 100));
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "n 150 200 m 177.5892 200 200 222.4108 200 250 c 200 277.5892 177.5892 300 150 300 c 122.4108 300 100 277.5892 100 250 c 100 222.4108 122.4108 200 150 200 c h f \n");
    },

    testRoundedRect: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage();
        context.fillRoundedRect(JSRect(100, 200, 100, 100), 20);
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);

        TKAssertEquals(streams[0], "n 100 220 m 100 208.96432 108.96432 200 120 200 c 180 200 l 191.03568 200 200 208.96432 200 220 c 200 280 l 200 291.03568 191.03568 300 180 300 c 120 300 l 108.96432 300 100 291.03568 100 280 c h f \n");
    }

});


JSClass("PDFContextTestsStringStream", PDFWriterStream, {

    string: null,

    init: function(){
        this.string = "";
    },

    write: function(data){
        for (var i = 0, l = data.bytes.length; i < l; ++i){
            this.string += String.fromCharCode(data.bytes[i]);
        }
    },

    close: function(callback){
        callback();
    },

    getStreams: function(){
        var lines = this.string.split("\n");
        var streams = [];
        var stream = null;
        for (var i = 0, l = lines.length; i < l; ++i){
            if (lines[i] == "stream"){
                stream = "";
            }else if (lines[i] == "endstream"){
                streams.push(stream);
                stream = null;
            }else{
                if (stream !== null){
                    stream += lines[i] + "\n";
                }
            }
        }
        return streams;
    }
});