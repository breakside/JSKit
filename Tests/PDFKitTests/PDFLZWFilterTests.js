// #import PDFKit
// #import Testkit
/* global JSClass, TKTestSuite, PDFLZWFilter */
/* global PDFIndirectObject, PDFName, PDFObject, PDFDocument, PDFPages, PDFPage, PDFResources, PDFGraphicsStateParameters, PDFStream, PDFTrailer, PDFFont, PDFType1Font, PDFTrueTypeFont, PDFImage */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("PDFLZWFilterTests", TKTestSuite, {

    testInit: function(){
        var filter = PDFLZWFilter.init();
        TKAssertExactEquals(filter.bitIncreaseOffset, 1);

        filter = PDFLZWFilter.initWithParametersDictionary({});
        TKAssertExactEquals(filter.bitIncreaseOffset, 1);

        filter = PDFLZWFilter.initWithParametersDictionary({EarlyChange: 2});
        TKAssertExactEquals(filter.bitIncreaseOffset, 2);
    },

    testDecode: function(){
        // First page of `TIFF 6.pdf` specification (PDF is drm encrypted; decrypted object 1039 0 using 18a30f1983febc0bd627 as rc4 key)
        var data = "gAxEBnEAwgogGwxGQgG45hZyMogM0HM4NgUEg0GhMLhsPiMTg0VgxHiwgNMHJUHNQghZ3EAxgxNEBbLsGMgNHMaHI3Fw1EBtBo1Gk6nk+NgNKYNIRUBovI0+gRUMwNG0Zg9Vlg1GM9EA1Gw5EBUoEGKhyBshs9hMYNFBUJJGIwpKhqppGGcvsNTGQ0g8GvcsGlgGt7rliBotGAuGAwu5UO9sKRlOxpOZpN5uhGKuV0GN8q2dwA4rmBqNAxGKGFRx4oIxpNxhNggLgzGUCJR1N0RGYsl45h2bi0Lz8LGY4GVcqsLwwoLgywfAp1QvM4vogsE5lgxsGG0+L5WrIJkN5iiJEyRlNhvOBlORzEBBOZzN5jNJhOmWN3Qu14qVpFqthsGwbrCIjDsSxbVLY8LxoiKY8jmOgyja9wkjcMY3jkOEMPsMoyOAgz/hcGMBQItgYhqHCfCGNAwjkNgywgy4QCkN4ww8ub/K2GUdxK7oYO+tgoBcJ4XBAIQ3jwhichhD4QRDEcBipAsfQSFAmje3A6DC1wQCsNIyju3ghiCEEyhyoYZhyFqGsXJsQwDKMpwOxiwtWIoWibLY2B1MoyMkOY6jgFr1vay4gRtBgXQuNrgCKpgcQGmCBKAoSDUkECjqSpa6uk/qwKssAZhmvzarCsc6wUEELjgPIQDeiY6DQygQDm9b6DMNIxvs/FVDCzDyIlLA3DIkz8xwpy7qiqYqBUtg0DoOg4B0F4XjvawXUQ8lFDeNoXinQMNDkOgXioMoxjQJw3wiOYXWeNo2TdAAYqjOTUKitYUV9G66RBAESSktIqXwM1o2mF+CDhbDxW1RYXjgOoxBfbIyhe8w7PQ9T2W+OFw3HeMRX/Aq23NdF1RgF4oCII1cReOdGqYgIA0=".dataByDecodingBase64();
        var filter = PDFLZWFilter.initWithParametersDictionary({});
        var decoded = filter.decode(data);
        var expected = [
            '1 g 0 0 612 792 re f 0 g',
            '1 g 0 0 612 792 re f 0 g',
            '0 G',
            '1 i 0 J 0 j 2 w 10 M []0 d',
            '90 697.5 m',
            '540 697.5 l',
            'S',
            'BT',
            '/F5 1 Tf',
            '60 0 0 60 251.5 569 Tm',
            '0 Tr',
            '0 g',
            '0 Tc',
            '(TIFF)Tj',
            '/F3 1 Tf',
            '24 0 0 24 249 524.5 Tm',
            '-0.003 Tw',
            '(Revision 6.0)Tj',
            '14 0 0 14 248.5 491 Tm',
            '-0.001 Tw',
            '(Final \\321 June 3, 1992)Tj',
            '12 0 0 12 382.5 602 Tm',
            '(\\252)Tj',
            '/F5 1 Tf',
            '9 0 0 9 90 219 Tm',
            '-0.002 Tw',
            '(Adobe Developers Association)Tj',
            '/F3 1 Tf',
            '0 -1.667 TD',
            '-0.001 Tw',
            '(Adobe Systems Incorporated)Tj',
            '0 -1.167 TD',
            '(1585 Charleston Road)Tj',
            '0 -1.222 TD',
            '-0.002 Tw',
            '(P.O. Box 7900)Tj',
            '0 -1.167 TD',
            '-0.001 Tw',
            '(Mountain View, CA   94039-7900)Tj',
            '0 -1.667 TD',
            '-0.003 Tw',
            '(E-Mail:  devsup-person@adobe.com)Tj',
            'ET',
            '87 101 m',
            '540 101 l',
            'S',
            'BT',
            '/F5 1 Tf',
            '9 0 0 9 330 221 Tm',
            '0 Tw',
            '(A copy of this specification can be found in)Tj',
            '/F3 1 Tf',
            'T*',
            '(http://www.adobe.com/Support/TechNotes.html)Tj',
            '0 -1.611 TD',
            '-0.001 Tc',
            '(and)Tj',
            '0 -1.667 TD',
            '0 Tc',
            '(ftp://ftp.adobe.com/pub/adobe/DeveloperSupport/)Tj',
            '0 -1.167 TD',
            '(TechNotes/PDFfiles)Tj',
            'ET',
            ''
        ].join('\r').utf8();
        TKAssertObjectEquals(decoded, expected);
    }
});