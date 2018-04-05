// #import "PDFKit/PDFKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, PDFContext, PDFWriterStream, PDFContextTestsStringStream, JSRect, JSPoint */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

// IMPORTANT:
// 1. These tests check for an exact sequence of PDF objects and/or stream commands
// 2. PDF validity does not actually depend on such exact equivalence
// 3. There are many ways to write visually identical PDFs
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
            "2 0 obj",
            "<< >>",
            "endobj",
            "1 0 obj",
            "<< /Kids [ ] /Count 0 /Resources 2 0 R /MediaBox [ 0 0 612 792 ] /Type /Pages >>",
            "endobj",
            "3 0 obj",
            "<< /Pages 1 0 R /Type /Catalog >>",
            "endobj",
            "xref",
            "0 4",
            "0000000000 65535 f ",
            "0000000030 00000 n ",
            "0000000009 00000 n ",
            "0000000126 00000 n ",
            "trailer",
            "<< /Root 3 0 R /Size 4 >>",
            "startxref",
            "175",
            "%%EOF"
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testEmptyPage: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage({flipCoordinates: false});
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var expected = [
            "%PDF-1.7",
            "4 0 obj",
            "<< /Length 3 0 R >>",
            "stream",
            "q Q ",
            "endstream",
            "endobj",
            "3 0 obj",
            "4",
            "endobj",
            "6 0 obj",
            "<< >>",
            "endobj",
            "5 0 obj",
            "<< /Contents 4 0 R /Parent 1 0 R /Resources 6 0 R /Type /Page >>",
            "endobj",
            "2 0 obj",
            "<< >>",
            "endobj",
            "1 0 obj",
            "<< /Kids [ 5 0 R ] /Count 1 /Resources 2 0 R /MediaBox [ 0 0 612 792 ] /Type /Pages >>",
            "endobj",
            "7 0 obj",
            "<< /Pages 1 0 R /Type /Catalog >>",
            "endobj",
            "xref",
            "0 8",
            "0000000000 65535 f ",
            "0000000205 00000 n ",
            "0000000184 00000 n ",
            "0000000066 00000 n ",
            "0000000009 00000 n ",
            "0000000104 00000 n ",
            "0000000083 00000 n ",
            "0000000307 00000 n ",
            "trailer",
            "<< /Root 7 0 R /Size 8 >>",
            "startxref",
            "356",
            "%%EOF"
        ];

        TKAssertEquals(stream.string, expected.join("\n"));
    },

    testRectangle: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage({flipCoordinates: false});
        context.fillRect(JSRect(100, 200, 300, 400));
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 100 200 300 400 re f Q \n");
    },

    testCircle: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage({flipCoordinates: false});
        context.fillEllipseInRect(JSRect(100, 200, 100, 100));
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 150 200 m 177.5892 200 200 222.4108 200 250 c 200 277.5892 177.5892 300 150 300 c 122.4108 300 100 277.5892 100 250 c 100 222.4108 122.4108 200 150 200 c h f Q \n");
    },

    testRoundedRect: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;

        context.beginPage({flipCoordinates: false});
        context.fillRoundedRect(JSRect(100, 200, 100, 100), 20);
        context.endPage();

        context.endDocument(function(){
            isClosed = true;
        });

        TKAssert(isClosed);

        var streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);

        TKAssertEquals(streams[0], "q n 100 220 m 100 208.96432 108.96432 200 120 200 c 180 200 l 191.03568 200 200 208.96432 200 220 c 200 280 l 200 291.03568 191.03568 300 180 300 c 120 300 l 108.96432 300 100 291.03568 100 280 c h f Q \n");
    },

    testArc: function(){
        // counter clockwise arc
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;
        context.beginPage({flipCoordinates: false});
        var center = JSPoint(100, 200);
        var radius = 50;
        context.addArc(center, radius, 0, Math.PI / 4, false);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        var streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q 150 200 m 150 213.260824492 144.7321579817 225.9785201369 135.3553390593 235.3553390593 c S Q \n");
    },

    debugArcUsingTangents: function(){
        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;
        context.beginPage();
        var radius = 25;

        context.beginPath();
        context.moveToPoint(50, 50);
        context.addArcUsingTangents(JSPoint(50, 100), JSPoint(100, 100), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(50, 75);
        context.addArcUsingTangents(JSPoint(75, 100), JSPoint(100, 75), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(50, 100);
        context.addArcUsingTangents(JSPoint(100, 100), JSPoint(100, 50), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(100, 100);
        context.addArcUsingTangents(JSPoint(125, 75), JSPoint(100, 50), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(100, 100);
        context.addArcUsingTangents(JSPoint(100, 50), JSPoint(50, 50), radius);
        context.strokePath();

        context.translateBy(-400, 100);

        context.beginPath();
        context.moveToPoint(100, 75);
        context.addArcUsingTangents(JSPoint(75, 50), JSPoint(50, 75), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(75, 50);
        context.addArcUsingTangents(JSPoint(50, 75), JSPoint(75, 100), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(50, 100);
        context.addArcUsingTangents(JSPoint(50, 75), JSPoint(75, 100), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(75, 50);
        context.addArcUsingTangents(JSPoint(100, 100), JSPoint(75, 125), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(75, 50);
        context.addArcUsingTangents(JSPoint(50, 100), JSPoint(75, 125), radius);
        context.strokePath();

        context.translateBy(-400, 100);

        context.beginPath();
        context.moveToPoint(100, 100);
        context.addArcUsingTangents(JSPoint(100, 75), JSPoint(50, 100), radius);
        context.strokePath();

        context.translateBy(100, 0);

        context.beginPath();
        context.moveToPoint(100, 50);
        context.addArcUsingTangents(JSPoint(75, 125), JSPoint(50, 100), radius);
        context.strokePath();

        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        stream.save("/Users/oshaw/Desktop/test.pdf");
    },

    testArcUsingTangents: function(){
        var radius = 25;

        var stream = PDFContextTestsStringStream.init();
        var context = PDFContext.initWithStream(stream);
        var isClosed = false;
        context.beginPage({flipCoordinates: false});
        context.beginPath();
        context.moveToPoint(50, 50);
        context.addArcUsingTangents(JSPoint(50, 100), JSPoint(100, 100), radius);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        var streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 50 50 m 50 75 m 50 75 l 50 88.7946 61.2054 100 75 100 c S Q \n");

        stream = PDFContextTestsStringStream.init();
        context = PDFContext.initWithStream(stream);
        isClosed = false;
        context.beginPage({flipCoordinates: false});
        context.beginPath();
        context.moveToPoint(50, 75);
        context.addArcUsingTangents(JSPoint(75, 100), JSPoint(100, 75), radius);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 50 75 m 57.3223304703 82.3223304703 m 57.3223304703 82.3223304703 l 67.0765856741 92.0765856741 82.9234143259 92.0765856741 92.6776695297 82.3223304703 c S Q \n");

        stream = PDFContextTestsStringStream.init();
        context = PDFContext.initWithStream(stream);
        isClosed = false;
        context.beginPage({flipCoordinates: false});
        context.beginPath();
        context.moveToPoint(50, 100);
        context.addArcUsingTangents(JSPoint(100, 100), JSPoint(100, 50), radius);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 50 100 m 75 100 m 75 100 l 88.7946 100 100 88.7946 100 75 c S Q \n");

        stream = PDFContextTestsStringStream.init();
        context = PDFContext.initWithStream(stream);
        isClosed = false;
        context.beginPage({flipCoordinates: false});
        context.beginPath();
        context.moveToPoint(100, 100);
        context.addArcUsingTangents(JSPoint(125, 75), JSPoint(100, 50), radius);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 100 100 m 107.3223304703 92.6776695297 m 107.3223304703 92.6776695297 l 117.0765856741 82.9234143259 117.0765856741 67.0765856741 107.3223304703 57.3223304703 c S Q \n");

        stream = PDFContextTestsStringStream.init();
        context = PDFContext.initWithStream(stream);
        isClosed = false;
        context.beginPage({flipCoordinates: false});
        context.beginPath();
        context.moveToPoint(100, 100);
        context.addArcUsingTangents(JSPoint(100, 50), JSPoint(50, 50), radius);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 100 100 m 100 75 m 100 75 l 100 61.2054 88.7946 50 75 50 c S Q \n");

        stream = PDFContextTestsStringStream.init();
        context = PDFContext.initWithStream(stream);
        isClosed = false;
        context.beginPage({flipCoordinates: false});
        context.beginPath();
        context.moveToPoint(100, 75);
        context.addArcUsingTangents(JSPoint(75, 50), JSPoint(50, 75), radius);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 100 75 m 92.6776695297 67.6776695297 m 92.6776695297 67.6776695297 l 82.9234143259 57.9234143259 67.0765856741 57.9234143259 57.3223304703 67.6776695297 c S Q \n");

        stream = PDFContextTestsStringStream.init();
        context = PDFContext.initWithStream(stream);
        isClosed = false;
        context.beginPage({flipCoordinates: false});
        context.beginPath();
        context.moveToPoint(75, 50);
        context.addArcUsingTangents(JSPoint(50, 75), JSPoint(75, 100), radius);
        context.strokePath();
        context.endPage();
        context.endDocument(function(){ isClosed = true;});
        TKAssert(isClosed);
        streams = stream.getStreams();
        TKAssertEquals(streams.length, 1);
        TKAssertEquals(streams[0], "q n 75 50 m 67.6776695297 57.3223304703 m 67.6776695297 57.3223304703 l 57.9234143259 67.0765856741 57.9234143259 82.9234143259 67.6776695297 92.6776695297 c S Q \n");
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
    },

    save: function(filename){
        var fs = require('fs');
        fs.writeFileSync(filename, this.string, 'binary');
    }
});