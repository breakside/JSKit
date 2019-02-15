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
            "712031303020323030203330302034303020726520662051",     // 49      225
            "endstream",                                            // 10      235
            "endobj",                                               //  7      242 (4)
            "4 0 obj",                                              //  8      250
            "48",                                                   //  3      253
            "endobj",                                               //  7      260 (2)
            "2 0 obj",                                              //  8      268
            "<< /Contents 3 0 R /Parent 1 0 R /Type /Page >>",      // 48      316
            "endobj",                                               //  7      323 (xref)
            "xref",
            "0 6",
            "0000000000 65535 f\r",
            "0000000058 00000 n\r",
            "0000000260 00000 n\r",
            "0000000117 00000 n\r",
            "0000000242 00000 n\r",
            "0000000009 00000 n\r",
            "trailer",
            "<< /Root 5 0 R /Size 6 >>",
            "startxref",
            "323",
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
        TKAssertEquals(stream.Length, 48);
        var expected = "q 100 200 300 400 re f Q".utf8();
        TKAssertObjectEquals(stream.data, expected);

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
            "Gap9`0JkI[0EP]n+>s8[U/Zh'Kg5W$6j5%",                           // 35      225
            "endstream",                                                    // 10      235
            "endobj",                                                       //  7      242 (4)
            "4 0 obj",                                                      //  8      250
            "34",                                                           //  3      253
            "endobj",                                                       //  7      260 (2)
            "2 0 obj",                                                      //  8      268
            "<< /Contents 3 0 R /Parent 1 0 R /Type /Page >>",              // 48      316
            "endobj",                                                       //  7      323 (xref)
            "xref",
            "0 6",
            "0000000000 65535 f\r",
            "0000000058 00000 n\r",
            "0000000260 00000 n\r",
            "0000000117 00000 n\r",
            "0000000242 00000 n\r",
            "0000000009 00000 n\r",
            "trailer",
            "<< /Root 5 0 R /Size 6 >>",
            "startxref",
            "323",
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
        TKAssertEquals(stream.Length, 34);
        var expected = "q 100 200 300 400 re f Q".utf8();
        TKAssertObjectEquals(stream.data, expected);

        // example from PDF specification
        data = [
            "%PDF-1.7",                                                     //  9        9 (5)
            "5 0 obj",                                                      //  8       17
            "<< /Pages 1 0 R /Type /Catalog >>",                            // 34       51
            "endobj",                                                       //  7       58 (1)
            "1 0 obj",                                                      //  8       66
            "<< /Kids [ 2 0 R ] /Count 1 /Type /Pages >>",                  // 44      110
            "endobj",                                                       //  7      117 (3)
            "3 0 obj",                                                      //  8      125
            "<< /Length 4 0 R /Filter [/ASCII85Decode /LZWDecode] >>",      // 56      181
            "stream",                                                       // 7       188 
            "J..)6T`?p&<!J9%_[umg\"B7/Z7KNXbN'S+,*Q/&\"OLT'F",              // 46      234
            "LIDK#!n`$\"<Atdi`\\Vn%b%)&'cA*VnK\\CJY(sF>c!Jnl@",             // 46      280
            "RM]WM;jjH6Gnc75idkL5]+cPZKEBPWdR>FF(kj1_R%W_d",                // 46      326
            "&/jS!;iuad7h?[L-F$+]]0A3Ck*$I0KZ?;<)CJtqi65Xb",                // 46      372
            "Vc3\\n5ua:Q/=0$W<#N3U;H,MQKqfg1?:lUpR;6oN[C2E4",               // 46      418
            "ZNr8Udn.'p+?#X+1>0Kuk$bCDF/(3fL5]Oq)^kJZ!C2H1",                // 46      464
            "'TO]Rl?Q:&'<5&iP!$Rq;BXRecDN[IJB`,)o8XJOSJ9sD",                // 46      510
            "S]hQ;Rj@!ND)bD_q&C\\g:inYC%)&u#:u,M6Bm%IY!Kb1+",               // 46      556
            "\":aAa'S`ViJglLb8<W9k6Yl\\\\0McJQkDeLWdPN?9A'jX*",             // 46      602
            "al>iG1p&i;eVoK&juJHs9%;Xomop\"5KatWRT\"JQ#qYuL,",              // 46      648
            "JD?M$0QP)lKn06l1apKDC@\\qJ4B!!(5m+j.7F790m(Vj8",               // 46      694
            "8l8Q:_CZ(Gm1%X\\N1&u!FKHMB~>",                                 // 28      722
            "endstream",                                                    // 10      732
            "endobj",                                                       //  7      739 (4)
            "4 0 obj",                                                      //  8      747
            "534",                                                          //  4      751
            "endobj",                                                       //  7      758 (2)
            "2 0 obj",                                                      //  8      766
            "<< /Contents 3 0 R /Parent 1 0 R /Type /Page >>",              // 48      814
            "endobj",                                                       //  7      821 (xref)
            "xref",
            "0 6",
            "0000000000 65535 f\r",
            "0000000058 00000 n\r",
            "0000000758 00000 n\r",
            "0000000117 00000 n\r",
            "0000000739 00000 n\r",
            "0000000009 00000 n\r",
            "trailer",
            "<< /Root 5 0 R /Size 6 >>",
            "startxref",
            "821",
            "%%EOF"
        ].join("\n").utf8();

        reader = PDFReader.initWithData(data);
        doc = reader.getDocument();
        TKAssertEquals(doc.Pages.Count, 1);
        TKAssertEquals(doc.Pages.Kids.length, 1);
        page = doc.Pages.Kids[0];
        TKAssert(page instanceof PDFPageObject);
        stream = page.Contents;
        TKAssert(stream instanceof PDFObject);
        TKAssertEquals(stream.Length, 534);
        expected = [
            "2 J",
            "BT",
            "/F1 12 Tf",
            "0 Tc",
            "0 Tw",
            "72.5 712 TD",
            "[(Unfiltered streams can be read easily) 65 (, )] TJ",
            "0 -14 TD",
            "[(b) 20 (ut generally tak) 10 (e more space than \\311)] TJ",
            "T* (compressed streams.) Tj",
            "0 -28 TD",
            "[(Se) 25 (v) 15 (eral encoding methods are a) 20 (v) 25 (ailable in PDF) 80 (.)] TJ",
            "0 -14 TD",
            "(Some are used for compression and others simply) Tj",
            "T* [(to represent binary data in an ) 55 (ASCII format.)] TJ",
            "T* (Some of the compression filters are \\",
            "suitable ) Tj",
            "T* (for both data and images, while others are \\",
            "suitable only ) Tj",
            "T* (for continuous-tone images.) Tj",
            "ET"
        ].join("\n").utf8();
        TKAssertObjectEquals(stream.data, expected);
    }

});