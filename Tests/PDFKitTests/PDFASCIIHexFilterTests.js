// #import PDFKit
// #import TestKit
'use strict';

JSClass("PDFASCIIHexFilterTests", TKTestSuite, {

    testDecode: function(){
        var data = "000102030405060708090A0B0C0D0E0F10>".utf8();
        var filter = PDFASCIIHexFilter.init();
        var decoded = filter.decode(data);
        var expected = JSData.initWithArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        TKAssertObjectEquals(decoded, expected);

        data = "74686973206973206120544553540a>".utf8();
        filter = PDFASCIIHexFilter.init();
        decoded = filter.decode(data);
        expected = "this is a TEST\n".utf8()
        TKAssertObjectEquals(decoded, expected);
    },

    testDecodeWithWhitespace: function(){
        var data = "   0001\n0203\n0405\n0607\n0809 0A0B\t0C0D\r0E0F\r\n10\r\n\n\t>".utf8();
        var filter = PDFASCIIHexFilter.init();
        var decoded = filter.decode(data);
        var expected = JSData.initWithArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        TKAssertObjectEquals(decoded, expected);

        data = " 7  4   6    8\n6\n\n9\n\n\n7\n\n\n\n3\t2 0 6 9 7 3 2 0 6 1 2 0 5 4 4 5 5 3 5 4 0 a>".utf8();
        filter = PDFASCIIHexFilter.init();
        decoded = filter.decode(data);
        expected = "this is a TEST\n".utf8()
        TKAssertObjectEquals(decoded, expected);
    },

    testDecodeWithMissingFinalChar: function(){
        var data = "000102030405060708090A0B0C0D0E0F1>".utf8();
        var filter = PDFASCIIHexFilter.init();
        var decoded = filter.decode(data);
        var expected = JSData.initWithArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        TKAssertObjectEquals(decoded, expected);
    },

    testEncode: function(){
        var data = JSData.initWithArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        var filter = PDFASCIIHexFilter.init();
        var encoded = filter.encode(data);
        var expected = "000102030405060708090A0B0C0D0E0F10>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = "this is a TEST\n".utf8()
        filter = PDFASCIIHexFilter.init();
        encoded = filter.encode(data);
        expected = "74686973206973206120544553540A>".utf8();
        TKAssertObjectEquals(encoded, expected);
    },

    testEncodeLineWrapping: function(){
        var data = JSData.initWithArray([0, 1, 2, 3, 4]);
        var filter = PDFASCIIHexFilter.init();
        filter.maximumLineLength = 4;
        var encoded = filter.encode(data);
        var expected = "0001\n0203\n04>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = JSData.initWithArray([0, 1, 2, 3, 4, 5]);
        filter = PDFASCIIHexFilter.init();
        filter.maximumLineLength = 4;
        encoded = filter.encode(data);
        expected = "0001\n0203\n0405\n>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = JSData.initWithArray([0, 1, 2, 3, 4, 5]);
        filter = PDFASCIIHexFilter.init();
        filter.maximumLineLength = 13;
        encoded = filter.encode(data);
        expected = "000102030405>".utf8();
        TKAssertObjectEquals(encoded, expected);

        data = JSData.initWithArray([0, 1, 2, 3, 4, 5]);
        filter = PDFASCIIHexFilter.init();
        filter.maximumLineLength = 12;
        encoded = filter.encode(data);
        expected = "000102030405\n>".utf8();
        TKAssertObjectEquals(encoded, expected);
    },
});