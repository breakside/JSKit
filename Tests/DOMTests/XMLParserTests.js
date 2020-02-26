// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import TestKit
// #import DOM
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
            "null",
            "false",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "false",
            "handleText",
            "testing 123",
            "endElement",
            "handleText",
            "\n  ",
            "beginElement",
            "c",
            "null",
            "null",
            "one",
            "null",
            "null",
            "1",
            "two",
            "null",
            "null",
            "2",
            "true",
            "handleText",
            "\n",
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
            "abc",
            "http://breakside.io/test",
            "false",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "abc",
            "http://breakside.io/test",
            "false",
            "handleText",
            "testing 123",
            "endElement",
            "handleText",
            "\n  ",
            "beginElement",
            "c",
            "null",
            "null",
            "one",
            "null",
            "null",
            "1",
            "two",
            "null",
            "null",
            "2",
            "true",
            "handleText",
            "\n",
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
            "null",
            "http://breakside.io/test",
            "false",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "http://breakside.io/test",
            "false",
            "handleText",
            "testing 123",
            "endElement",
            "handleText",
            "\n  ",
            "beginElement",
            "c",
            "abc",
            "http://breakside.io/test2",
            "one",
            "null",
            "null",
            "1",
            "two",
            "null",
            "null",
            "2",
            "true",
            "handleText",
            "\n",
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
            "null",
            "http://breakside.io/test",
            "false",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "http://breakside.io/test2",
            "false",
            "handleText",
            "\n    ",
            "beginElement",
            "c",
            "null",
            "http://breakside.io/test2",
            "one",
            "null",
            "null",
            "1",
            "two",
            "null",
            "null",
            "2",
            "true",
            "handleText",
            "\n  ",
            "endElement",
            "handleText",
            "\n",
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
            "a",
            "http://breakside.io/test",
            "false",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "a",
            "http://breakside.io/test2",
            "false",
            "handleText",
            "\n    ",
            "beginElement",
            "c",
            "null",
            "null",
            "one",
            "null",
            "null",
            "1",
            "two",
            "null",
            "null",
            "2",
            "true",
            "handleText",
            "\n  ",
            "endElement",
            "handleText",
            "\n  ",
            "beginElement",
            "test2",
            "a",
            "http://breakside.io/test",
            "true",
            "handleText",
            "\n",
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
            "null",
            "false",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "false",
            "handleCDATA",
            "anything<goes>&here;",
            "endElement",
            "handleText",
            "\n  ",
            "handleComment",
            " another\n  comment ",
            "handleText",
            "\n",
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
            "null",
            "false",
            "handleText",
            "\n  ",
            "beginElement",
            "head",
            "null",
            "null",
            "false",
            "handleText",
            "\n    ",
            "beginElement",
            "link",
            "null",
            "null",
            "href",
            "null",
            "null",
            "sheet.css",
            "type",
            "null",
            "null",
            "text/css",
            "true",
            "handleText",
            "\n    ",
            "beginElement",
            "script",
            "null",
            "null",
            "type",
            "null",
            "null",
            "text/javascript",
            "src",
            "null",
            "null",
            "script.js",
            "false",
            "endElement",
            "handleText",
            "\n    ",
            "beginElement",
            "script",
            "null",
            "null",
            "type",
            "null",
            "null",
            "text/javascript",
            "false",
            "handleText",
            "\n      // scripts can include < & special chars &amp;\n      if (0 < 1){\n      }\n    ",
            "endElement",
            "handleText",
            "\n  ",
            "endElement",
            "handleText",
            "\n  ",
            "beginElement",
            "body",
            "null",
            "null",
            "false",
            "handleText",
            "\n  ",
            "endElement",
            "handleText",
            "\n",
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
        beginElement: function(name, prefix, namespace, attributes, isClosed){
            output.push("beginElement");
            output.push(String(name));
            output.push(String(prefix));
            output.push(String(namespace));
            var attr;
            for (var i = 0, l = attributes.length; i < l; ++i){
                attr = attributes[i];
                output.push(String(attr.name));
                output.push(String(attr.prefix));
                output.push(String(attr.namespace));
                output.push(String(attr.value));
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