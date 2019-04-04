// #import DOM
// #import TestKit
/* global JSClass, TKTestSuite, TKExpectation, XMLParser */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals, TKAssertArrayEquals */
'use strict';

(function(){

JSClass('XMLParserTests', TKTestSuite, {

    testBasicXML: function(){
        var parser = new XMLParser();
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        var listener = TestListener();
        parser.parse(xml, listener);
        var expected = [
            "beginDocument",
            "beginElement",
            "abc",
            "null",
            "false",
            "beginElement",
            "test",
            "null",
            "false",
            "handleText",
            "testing 123",
            "endElement",
            "beginElement",
            "c",
            "null",
            "one",
            "1",
            "two",
            "2",
            "true",
            "endElement"
        ];
        TKAssertArrayEquals(listener.output, expected);
    },

    testNamespaces: function(){
        var parser = new XMLParser();
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<abc:root xmlns:abc="http://breakside.io/test">',
            '  <abc:test>testing 123</abc:test>',
            '  <c one="1" two="2"/>',
            '</abc:root>'
        ].join("\n");
        var listener = TestListener();
        parser.parse(xml, listener);
        var expected = [
            "beginDocument",
            "beginElement",
            "root",
            "http://breakside.io/test",
            "false",
            "beginElement",
            "test",
            "http://breakside.io/test",
            "false",
            "handleText",
            "testing 123",
            "endElement",
            "beginElement",
            "c",
            "null",
            "one",
            "1",
            "two",
            "2",
            "true",
            "endElement"
        ];
        TKAssertArrayEquals(listener.output, expected);


        parser = new XMLParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<root xmlns="http://breakside.io/test">',
            '  <test>testing 123</test>',
            '  <abc:c xmlns:abc="http://breakside.io/test2" one="1" two="2"/>',
            '</root>'
        ].join("\n");
        listener = TestListener();
        parser.parse(xml, listener);
        expected = [
            "beginDocument",
            "beginElement",
            "root",
            "http://breakside.io/test",
            "false",
            "beginElement",
            "test",
            "http://breakside.io/test",
            "false",
            "handleText",
            "testing 123",
            "endElement",
            "beginElement",
            "c",
            "http://breakside.io/test2",
            "one",
            "1",
            "two",
            "2",
            "true",
            "endElement"
        ];
        TKAssertArrayEquals(listener.output, expected);

        parser = new XMLParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<root xmlns="http://breakside.io/test">',
            '  <test xmlns="http://breakside.io/test2">',
            '    <c one="1" two="2"/>',
            '  </test>',
            '</root>'
        ].join("\n");
        listener = TestListener();
        parser.parse(xml, listener);
        expected = [
            "beginDocument",
            "beginElement",
            "root",
            "http://breakside.io/test",
            "false",
            "beginElement",
            "test",
            "http://breakside.io/test2",
            "false",
            "beginElement",
            "c",
            "http://breakside.io/test2",
            "one",
            "1",
            "two",
            "2",
            "true",
            "endElement",
            "endElement"
        ];
        TKAssertArrayEquals(listener.output, expected);

        parser = new XMLParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<a:root xmlns:a="http://breakside.io/test">',
            '  <a:test xmlns:a="http://breakside.io/test2">',
            '    <c one="1" two="2"/>',
            '  </a:test>',
            '  <a:test2/>',
            '</a:root>'
        ].join("\n");
        listener = TestListener();
        parser.parse(xml, listener);
        expected = [
            "beginDocument",
            "beginElement",
            "root",
            "http://breakside.io/test",
            "false",
            "beginElement",
            "test",
            "http://breakside.io/test2",
            "false",
            "beginElement",
            "c",
            "null",
            "one",
            "1",
            "two",
            "2",
            "true",
            "endElement",
            "beginElement",
            "test2",
            "http://breakside.io/test",
            "true",
            "endElement"
        ];
        TKAssertArrayEquals(listener.output, expected);
    },

    testCommentsAndCData: function(){
        var parser = new XMLParser();
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!-- Start of document -->',
            '<abc>',
            '  <test><![CDATA[anything<goes>&here;]]></test>',
            '  <!-- another',
            '  comment -->',
            '</abc>'
        ].join("\n");
        var listener = TestListener();
        parser.parse(xml, listener);
        var expected = [
            "beginDocument",
            "handleComment",
            " Start of document ",
            "beginElement",
            "abc",
            "null",
            "false",
            "beginElement",
            "test",
            "null",
            "false",
            "handleCDATA",
            "anything<goes>&here;",
            "endElement",
            "handleComment",
            " another\n  comment ",
            "endElement"
        ];
        TKAssertArrayEquals(listener.output, expected);
    },

    testHTML: function(){
        var parser = new XMLParser();
        parser.isHTML = true;
        var xml = [
            '<!DOCTYPE html>',
            '<html>',
            '  <head>',
            '    <link href="sheet.css" type="text/css">',
            '    <script type="text/javascript" src="script.js"></script>',
            '    <script type="text/javascript">',
            '      // scripts can include < & special chars &amp;',
            '      if (0 < 1){',
            '      }',
            '    </script>',
            '  </head>',
            '  <body>',
            '  </body>',
            '</html>'
        ].join("\n");
        var listener = TestListener();
        parser.parse(xml, listener);
        var expected = [
            "beginDocument",
            "handleDocumentType",
            "html",
            "null",
            "null",
            "beginElement",
            "html",
            "null",
            "false",
            "beginElement",
            "head",
            "null",
            "false",
            "beginElement",
            "link",
            "null",
            "href",
            "sheet.css",
            "type",
            "text/css",
            "true",
            "beginElement",
            "script",
            "null",
            "type",
            "text/javascript",
            "src",
            "script.js",
            "false",
            "endElement",
            "beginElement",
            "script",
            "null",
            "type",
            "text/javascript",
            "false",
            "handleText",
            "\n      // scripts can include < & special chars &amp;\n      if (0 < 1){\n      }\n    ",
            "endElement",
            "endElement",
            "beginElement",
            "body",
            "null",
            "false",
            "endElement",
            "endElement"
        ];
        TKAssertArrayEquals(listener.output, expected);
    }

});

var TestListener = function(){
    var output = [];
    var obj = {
        beginDocument: function(){
            output.push("beginDocument");
        },
        handleDocumentType: function(name, publicId, systemId){
            output.push("handleDocumentType");
            output.push(String(name));
            output.push(String(publicId));
            output.push(String(systemId));
        },
        handleProcessingInstruction: function(name, data){
            output.push("handleProcessingInstruction");
            output.push(String(name));
            output.push(String(data));
        },
        handleComment: function(text){
            output.push("handleComment");
            output.push(String(text));
        },
        handleCDATA: function(text){
            output.push("handleCDATA");
            output.push(String(text));
        },
        beginElement: function(name, namespace, attributes, isClosed){
            output.push("beginElement");
            output.push(String(name));
            output.push(String(namespace));
            for (var k in attributes){
                output.push(String(k));
                output.push(String(attributes[k]));
            }
            output.push(String(isClosed));
        },
        handleText: function(text){
            output.push("handleText");
            output.push(String(text));
        },
        endElement: function(){
            output.push("endElement");
        },
    };
    Object.defineProperty(obj, 'output', {get: function(){ return output; }});
    return obj;
};

})();