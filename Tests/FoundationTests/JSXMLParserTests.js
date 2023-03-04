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
// #import Foundation
'use strict';

(function(){

JSClass('JSXMLParserTests', TKTestSuite, {

    setup: function(){
        this.resetOutput();
    },

    resetOutput: function(){
        this.output = [];
    },

    testBasicXML: function(){
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        var parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        parser.parse();
        var expected = [
            "beginDocument",
            "beginElement",
            "abc",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "handleText",
            "testing 123",
            "endElement",
            "test",
            "null",
            "null",
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
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n",
            "endElement",
            "abc",
            "null",
            "null"
        ];
        TKAssertArrayEquals(this.output, expected);
    },

    testNamespaces: function(){
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<abc:root xmlns:abc="http://breakside.io/test">',
            '  <abc:test>testing 123</abc:test>',
            '  <c one="1" two="2"/>',
            '</abc:root>'
        ].join("\n");
        var parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        parser.parse();
        var expected = [
            "beginDocument",
            "beginElement",
            "root",
            "abc",
            "http://breakside.io/test",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "abc",
            "http://breakside.io/test",
            "handleText",
            "testing 123",
            "endElement",
            "test",
            "abc",
            "http://breakside.io/test",
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
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n",
            "endElement",
            "root",
            "abc",
            "http://breakside.io/test",
        ];
        TKAssertArrayEquals(this.output, expected);


        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<root xmlns="http://breakside.io/test">',
            '  <test>testing 123</test>',
            '  <abc:c xmlns:abc="http://breakside.io/test2" one="1" two="2"/>',
            '</root>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        expected = [
            "beginDocument",
            "beginElement",
            "root",
            "null",
            "http://breakside.io/test",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "http://breakside.io/test",
            "handleText",
            "testing 123",
            "endElement",
            "test",
            "null",
            "http://breakside.io/test",
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
            "endElement",
            "c",
            "abc",
            "http://breakside.io/test2",
            "handleText",
            "\n",
            "endElement",
            "root",
            "null",
            "http://breakside.io/test",
        ];
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<root xmlns="http://breakside.io/test">',
            '  <test xmlns="http://breakside.io/test2">',
            '    <c one="1" two="2"/>',
            '  </test>',
            '</root>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        expected = [
            "beginDocument",
            "beginElement",
            "root",
            "null",
            "http://breakside.io/test",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "http://breakside.io/test2",
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
            "endElement",
            "c",
            "null",
            "http://breakside.io/test2",
            "handleText",
            "\n  ",
            "endElement",
            "test",
            "null",
            "http://breakside.io/test2",
            "handleText",
            "\n",
            "endElement",
            "root",
            "null",
            "http://breakside.io/test",
        ];
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<a:root xmlns:a="http://breakside.io/test">',
            '  <a:test xmlns:a="http://breakside.io/test2">',
            '    <c one="1" two="2"/>',
            '  </a:test>',
            '  <a:test2/>',
            '</a:root>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        expected = [
            "beginDocument",
            "beginElement",
            "root",
            "a",
            "http://breakside.io/test",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "a",
            "http://breakside.io/test2",
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
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n  ",
            "endElement",
            "test",
            "a",
            "http://breakside.io/test2",
            "handleText",
            "\n  ",
            "beginElement",
            "test2",
            "a",
            "http://breakside.io/test",
            "endElement",
            "test2",
            "a",
            "http://breakside.io/test",
            "handleText",
            "\n",
            "endElement",
            "root",
            "a",
            "http://breakside.io/test",
        ];
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<xml:root>',
            '  <xml:test>',
            '    <c one="1" two="2"/>',
            '  </xml:test>',
            '  <xml:test2/>',
            '</xml:root>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        expected = [
            "beginDocument",
            "beginElement",
            "root",
            "xml",
            "http://www.w3.org/XML/1998/namespace",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "xml",
            "http://www.w3.org/XML/1998/namespace",
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
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n  ",
            "endElement",
            "test",
            "xml",
            "http://www.w3.org/XML/1998/namespace",
            "handleText",
            "\n  ",
            "beginElement",
            "test2",
            "xml",
            "http://www.w3.org/XML/1998/namespace",
            "endElement",
            "test2",
            "xml",
            "http://www.w3.org/XML/1998/namespace",
            "handleText",
            "\n",
            "endElement",
            "root",
            "xml",
            "http://www.w3.org/XML/1998/namespace",
        ];
        TKAssertArrayEquals(this.output, expected);
    },

    testCommentsAndCData: function(){
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!-- Start of document -->',
            '<abc>',
            '  <test><![CDATA[anything<goes>&here;]]></test>',
            '  <!-- another',
            '  comment -->',
            '</abc>'
        ].join("\n");
        var parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        parser.parse();
        var expected = [
            "beginDocument",
            "handleComment",
            " Start of document ",
            "beginElement",
            "abc",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "handleCDATA",
            "anything<goes>&here;",
            "endElement",
            "test",
            "null",
            "null",
            "handleText",
            "\n  ",
            "handleComment",
            " another\n  comment ",
            "handleText",
            "\n",
            "endElement",
            "abc",
            "null",
            "null",
        ];
        TKAssertArrayEquals(this.output, expected);
    },

    testHTML: function(){
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
        var parser = JSXMLParser.initWithString(xml);
        parser.mode = JSXMLParser.Mode.html;
        parser.delegate = this;
        parser.parse();
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
            "handleText",
            "\n  ",
            "beginElement",
            "head",
            "null",
            "null",
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
            "endElement",
            "link",
            "null",
            "null",
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
            "endElement",
            "script",
            "null",
            "null",
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
            "handleText",
            "\n      // scripts can include < & special chars &amp;\n      if (0 < 1){\n      }\n    ",
            "endElement",
            "script",
            "null",
            "null",
            "handleText",
            "\n  ",
            "endElement",
            "head",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "body",
            "null",
            "null",
            "handleText",
            "\n  ",
            "endElement",
            "body",
            "null",
            "null",
            "handleText",
            "\n",
            "endElement",
            "html",
            "null",
            "null",
        ];
        TKAssertArrayEquals(this.output, expected);
    },

    testDoctypes: function(){
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        var parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        parser.parse();
        var expected = [
            "beginDocument",
            "handleDocumentType",
            "name",
            "null",
            "null",
            "beginElement",
            "abc",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "handleText",
            "testing 123",
            "endElement",
            "test",
            "null",
            "null",
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
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n",
            "endElement",
            "abc",
            "null",
            "null",
        ];
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name',
            '>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name [',
            ']>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name SYSTEM "test">',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        expected = [
            "beginDocument",
            "handleDocumentType",
            "name",
            "null",
            "test",
            "beginElement",
            "abc",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "handleText",
            "testing 123",
            "endElement",
            "test",
            "null",
            "null",
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
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n",
            "endElement",
            "abc",
            "null",
            "null",
        ];
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name PUBLIC "test" "test2">',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        expected = [
            "beginDocument",
            "handleDocumentType",
            "name",
            "test",
            "test2",
            "beginElement",
            "abc",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "handleText",
            "testing 123",
            "endElement",
            "test",
            "null",
            "null",
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
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n",
            "endElement",
            "abc",
            "null",
            "null",
        ];
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name PUBLIC "test" "test2" []>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name PUBLIC "test" "test2" [',
            ']>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        TKAssertArrayEquals(this.output, expected);

        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE name PUBLIC "test" "test2" [',
            '  <!ENTITY entity1 "hello">',
            '  <!ENTITY entity2 "world">',
            ']>',
            '<abc>',
            '  <test>&entity1;</test>',
            '  <c one="&entity2;" two="2"/>',
            '</abc>'
        ].join("\n");
        parser = JSXMLParser.initWithString(xml);
        parser.delegate = this;
        this.resetOutput();
        parser.parse();
        expected = [
            "beginDocument",
            "handleDocumentType",
            "name",
            "test",
            "test2",
            "beginElement",
            "abc",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "test",
            "null",
            "null",
            "handleText",
            "hello",
            "endElement",
            "test",
            "null",
            "null",
            "handleText",
            "\n  ",
            "beginElement",
            "c",
            "null",
            "null",
            "one",
            "null",
            "null",
            "world",
            "two",
            "null",
            "null",
            "2",
            "endElement",
            "c",
            "null",
            "null",
            "handleText",
            "\n",
            "endElement",
            "abc",
            "null",
            "null",
        ];
        TKAssertArrayEquals(this.output, expected);
    },

    xmlParserDidBeginDocument: function(parser){
        TKAssertInstance(parser, JSXMLParser);
        this.output.push("beginDocument");
    },

    xmlParserFoundDocumentType: function(parser, name, publicId, systemId){
        TKAssertInstance(parser, JSXMLParser);
        this.output.push("handleDocumentType");
        this.output.push(String(name));
        this.output.push(String(publicId));
        this.output.push(String(systemId));
    },

    xmlParserFoundProcessingInstruction: function(parser, name, data){
        TKAssertInstance(parser, JSXMLParser);
        this.output.push("handleProcessingInstruction");
        this.output.push(String(name));
        this.output.push(String(data));
    },

    xmlParserFoundComment: function(parser, text){
        TKAssertInstance(parser, JSXMLParser);
        this.output.push("handleComment");
        this.output.push(String(text));
    },

    xmlParserFoundCDATA: function(parser, text){
        TKAssertInstance(parser, JSXMLParser);
        this.output.push("handleCDATA");
        this.output.push(String(text));
    },

    xmlParserDidBeginElement: function(parser, name, prefix, namespace, attributes){
        TKAssertInstance(parser, JSXMLParser);
        TKAssertInstance(attributes, JSXMLAttributeArray);
        this.output.push("beginElement");
        this.output.push(String(name));
        this.output.push(String(prefix));
        this.output.push(String(namespace));
        var attr;
        for (var i = 0, l = attributes.length; i < l; ++i){
            attr = attributes[i];
            this.output.push(String(attr.name));
            this.output.push(String(attr.prefix));
            this.output.push(String(attr.namespace));
            this.output.push(String(attr.value));
        }
    },

    xmlParserFoundText: function(parser, text){
        TKAssertInstance(parser, JSXMLParser);
        this.output.push("handleText");
        this.output.push(String(text));
    },

    xmlParserDidEndElement: function(parser, name, prefix, namespace){
        TKAssertInstance(parser, JSXMLParser);
        this.output.push("endElement");
        this.output.push(String(name));
        this.output.push(String(prefix));
        this.output.push(String(namespace));
    },

});

JSClass("JSXMLAttributeArrayTests", TKTestSuite, {

    testConstructor: function(){
        var attrs = JSXMLAttributeArray();
        TKAssertInstance(attrs, JSXMLAttributeArray);
        TKAssertInstance(attrs, Array);

        attrs = new JSXMLAttributeArray();
        TKAssertInstance(attrs, JSXMLAttributeArray);
        TKAssertInstance(attrs, Array);
    },

    testPush: function(){
        var attrs = JSXMLAttributeArray();
        attrs.push({
            name: "test",
            prefix: null,
            namespace: null,
            value: null
        });
        TKAssertExactEquals(attrs.length, 1);
        TKAssertExactEquals(attrs[0].name, "test");
        TKAssertExactEquals(attrs.containsName("test"), true);
        TKAssertExactEquals(attrs.valueForName("test"), null);
        TKAssertExactEquals(attrs.containsName("other"), false);
        TKAssertExactEquals(attrs.containsName("test", "http://breakside.io/xml"), false);

        attrs.push({
            name: "other",
            prefix: null,
            namespace: null,
            value: "testing"
        });
        TKAssertExactEquals(attrs.length, 2);
        TKAssertExactEquals(attrs[0].name, "test");
        TKAssertExactEquals(attrs[1].name, "other");
        TKAssertExactEquals(attrs.containsName("test"), true);
        TKAssertExactEquals(attrs.valueForName("test"), null);
        TKAssertExactEquals(attrs.containsName("other"), true);
        TKAssertExactEquals(attrs.valueForName("other"), "testing");
        TKAssertExactEquals(attrs.containsName("test", "http://breakside.io/xml"), false);

        attrs.push({
            name: "test",
            prefix: "xyz",
            namespace: "http://breakside.io/xml",
            value: "hello"
        });
        TKAssertExactEquals(attrs.length, 3);
        TKAssertExactEquals(attrs[0].name, "test");
        TKAssertExactEquals(attrs[1].name, "other");
        TKAssertExactEquals(attrs[2].name, "test");
        TKAssertExactEquals(attrs[2].prefix, "xyz");
        TKAssertExactEquals(attrs[2].namespace, "http://breakside.io/xml");
        TKAssertExactEquals(attrs.containsName("test"), true);
        TKAssertExactEquals(attrs.valueForName("test"), null);
        TKAssertExactEquals(attrs.containsName("other"), true);
        TKAssertExactEquals(attrs.valueForName("other"), "testing");
        TKAssertExactEquals(attrs.containsName("test", "http://breakside.io/xml"), true);
        TKAssertExactEquals(attrs.valueForName("test", "http://breakside.io/xml"), "hello");
    }

});

})();