// #import PDFKit
// #import TestKit
/* global JSClass, TKTestSuite, PDFReader */
/* global PDFIndirectObject, PDFName, PDFObject, PDFDocument, PDFPages, PDFPage, PDFResources, PDFGraphicsStateParameters, PDFStream, PDFTrailer, PDFFont, PDFType1Font, PDFTrueTypeFont, PDFImage */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("PDFASCII85FilterTests", TKTestSuite, {

    testDecode: function(){
        var data = "!!*-'\"9eu7#RLhG$k3[W&-~>".utf8();
        var filter = PDFASCII85Filter.init();
        var decoded = filter.decode(data);
        var expected = JSData.initWithArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        TKAssertObjectEquals(decoded, expected);

        data = "FD,B0+DGm>@3AN<;cF)~>".utf8();
        filter = PDFASCII85Filter.init();
        decoded = filter.decode(data);
        expected = "this is a TEST\n".utf8()
        TKAssertObjectEquals(decoded, expected);
    },

    testDecodeWithWhitespace: function(){
        var data = "  ! ! *\n-\t'\"9eu   7#RL\r\nhG$ \r k3[W&-~\n>".utf8();
        var filter = PDFASCII85Filter.init();
        var decoded = filter.decode(data);
        var expected = JSData.initWithArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        TKAssertObjectEquals(decoded, expected);

        data = " F  D   ,    B\n0\n\n+\n\n\nD\n\n\n\nG\r    \tm\n>\n\n@3AN<;cF)~>\n\n\r\n\r\r\t".utf8();
        filter = PDFASCII85Filter.init();
        decoded = filter.decode(data);
        expected = "this is a TEST\n".utf8()
        TKAssertObjectEquals(decoded, expected);
    },

    testDecodeWithLeftoverBytes: function(){
        var data = "@/~>".utf8();
        var filter = PDFASCII85Filter.init();
        var decoded = filter.decode(data);
        var expected = "a".utf8();
        TKAssertObjectEquals(decoded, expected);

        data = "@:B~>".utf8();
        filter = PDFASCII85Filter.init();
        decoded = filter.decode(data);
        expected = "ab".utf8();
        TKAssertObjectEquals(decoded, expected);

        data = "@:E^~>".utf8();
        filter = PDFASCII85Filter.init();
        decoded = filter.decode(data);
        expected = "abc".utf8();
        TKAssertObjectEquals(decoded, expected);

        data = "@:E_W~>".utf8();
        filter = PDFASCII85Filter.init();
        decoded = filter.decode(data);
        expected = "abcd".utf8();
        TKAssertObjectEquals(decoded, expected);

        data = "@:E_WAH~>".utf8();
        filter = PDFASCII85Filter.init();
        decoded = filter.decode(data);
        expected = "abcde".utf8();
        TKAssertObjectEquals(decoded, expected);
    },

    testEncode: function(){
        var data = JSData.initWithArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        var filter = PDFASCII85Filter.init();
        var encoded = filter.encode(data);
        var expected = "!!*-'\"9eu7#RLhG$k3[W&-~>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = "this is a TEST\n".utf8()
        filter = PDFASCII85Filter.init();
        encoded = filter.encode(data);
        expected = "FD,B0+DGm>@3AN<;cF)~>".utf8();
        TKAssertObjectEquals(encoded, expected);
    },

    testEncodeLineWrapping: function(){
        var data = "test".utf8();
        var filter = PDFASCII85Filter.init();
        filter.maximumLineLength = 4;
        var encoded = filter.encode(data);
        var expected = "FCfN\n8~>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = "testi".utf8();
        filter = PDFASCII85Filter.init();
        filter.maximumLineLength = 4;
        encoded = filter.encode(data);
        expected = "FCfN\n8B`~\n>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = "testin".utf8();
        filter = PDFASCII85Filter.init();
        filter.maximumLineLength = 4;
        encoded = filter.encode(data);
        expected = "FCfN\n8Bl3\n~>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = "testing".utf8();
        filter = PDFASCII85Filter.init();
        filter.maximumLineLength = 4;
        encoded = filter.encode(data);
        expected = "FCfN\n8Bl7\nP~>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = "testing ".utf8();
        filter = PDFASCII85Filter.init();
        filter.maximumLineLength = 4;
        encoded = filter.encode(data);
        expected = "FCfN\n8Bl7\nQ+~>".utf8();
        TKAssertObjectEquals(encoded, expected);
    },
});