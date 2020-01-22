// #import Foundation
// #import TestKit
'use strict';

JSClass("JSMediaTypeTests",TKTestSuite, {

    testBasic: function(){
        var media = JSMediaType("text/html");
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.type, "text");
        TKAssertEquals(media.subtype, "html");

        media = JSMediaType("TEXT/HTML");
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.type, "text");
        TKAssertEquals(media.subtype, "html");

        media = JSMediaType(" text/html  ");
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.type, "text");
        TKAssertEquals(media.subtype, "html");
    },

    testParameters: function(){
        var media = JSMediaType("text/html; charset=utf-8");
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.parameters.charset, "utf-8");

        media = JSMediaType("  text/html;   CHARSET=UTF-8   ");
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.parameters.charset, "utf-8");

        media = JSMediaType('text/html; charset="utf-8"');
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.parameters.charset, "utf-8");

        media = JSMediaType('text/html; charset=utf-8; other=12345');
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.parameters.charset, "utf-8");
        TKAssertEquals(media.parameters.other, "12345");

        media = JSMediaType('text/html; charset="utf-8"  ; other=12345  ');
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.parameters.charset, "utf-8");
        TKAssertEquals(media.parameters.other, "12345");

        media = JSMediaType('text/html; charset="utf-8"  ; other="  white spaces  "  ');
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.parameters.charset, "utf-8");
        TKAssertEquals(media.parameters.other, "  white spaces  ");

        media = JSMediaType('text/html;charset="utf-8";other="  white spaces  "');
        TKAssertEquals(media.mime, "text/html");
        TKAssertEquals(media.parameters.charset, "utf-8");
        TKAssertEquals(media.parameters.other, "  white spaces  ");
    },

    testBad: function(){
        var media = JSMediaType("asdf");
        TKAssertEquals(media.mime, "asdf");
        TKAssertEquals(media.type, "asdf");
        TKAssertExactEquals(media.subtype, "");

        media = JSMediaType("/asdf");
        TKAssertEquals(media.mime, "/asdf");
        TKAssertEquals(media.type, "");
        TKAssertExactEquals(media.subtype, "asdf");

        media = JSMediaType("asdf/");
        TKAssertEquals(media.mime, "asdf/");
        TKAssertEquals(media.type, "asdf");
        TKAssertExactEquals(media.subtype, "");

        media = JSMediaType('one;;;one=;=asdf;two=hi;three=" hello');
        TKAssertEquals(media.mime, "one");
        TKAssertEquals(media.type, "one");
        TKAssertExactEquals(media.subtype, "");
        TKAssertExactEquals(media.parameters.one, "");
        TKAssertEquals(media.parameters.two, "hi");
        TKAssertEquals(media.parameters.three, " hello");
    },

    testInitParameters: function(){
        var media = JSMediaType("application/json", {charset: 'utf-8'});
        TKAssertEquals(media.mime, 'application/json');
        TKAssertEquals(media.type, 'application');
        TKAssertEquals(media.subtype, 'json');
        TKAssertEquals(media.parameters.charset, 'utf-8');
    },

    testToString: function(){
        var media = JSMediaType("application/json", {charset: 'utf-8'});
        var str = media.toString();
        TKAssertEquals(str, 'application/json; charset="utf-8"');
    }

});