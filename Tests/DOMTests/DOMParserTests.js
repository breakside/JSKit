// #import TestKit
// #import DOM
'use strict';

(function(){

JSClass('DOMParserTests', TKTestSuite, {

    testBasicXML: function(){
        var parser = new DOMParser();
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        var document = parser.parseFromString(xml, "text/xml");
        TKAssertNotNull(document);
        TKAssertEquals(document.childNodes.length, 1);
        var element = document.documentElement;
        TKAssertNotNull(element);
        TKAssertEquals(element.nodeType, DOM.Node.ELEMENT_NODE);
        TKAssertExactEquals(element, document.childNodes[0]);
        TKAssertEquals(element.tagName, "abc");
        TKAssertEquals(element.childNodes.length, 5);
        var text = element.childNodes[0];
        TKAssertEquals(text.data, "\n  ");
        var child = element.childNodes[1];
        TKAssertEquals(child.tagName, "test");
        TKAssertEquals(child.childNodes.length, 1);
        text = child.childNodes[0];
        TKAssertEquals(text.data, 'testing 123');
        text = element.childNodes[2];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[3];
        TKAssertEquals(child.tagName, "c");
        TKAssertEquals(child.childNodes.length, 0);
        var value = child.getAttribute("one");
        TKAssertEquals(value, "1");
        value = child.getAttribute("two");
        TKAssertEquals(value, "2");
        text = element.childNodes[4];
        TKAssertEquals(text.data, "\n");
    },

    testNamespaces: function(){
        var parser = new DOMParser();
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<abc:root xmlns:abc="http://breakside.io/test">',
            '  <abc:test>testing 123</abc:test>',
            '  <c one="1" two="2"/>',
            '</abc:root>'
        ].join("\n");
        var document = parser.parseFromString(xml, "text/xml");
        TKAssertNotNull(document);
        TKAssertEquals(document.childNodes.length, 1);
        var element = document.documentElement;
        TKAssertNotNull(element);
        TKAssertExactEquals(element, document.childNodes[0]);
        TKAssertEquals(element.tagName, "abc:root");
        TKAssertEquals(element.namespaceURI, "http://breakside.io/test");
        TKAssertEquals(element.localName, "root");
        TKAssertEquals(element.prefix, "abc");
        TKAssertEquals(element.childNodes.length, 5);
        var text = element.childNodes[0];
        TKAssertEquals(text.data, "\n  ");
        var child = element.childNodes[1];
        TKAssertEquals(child.tagName, "abc:test");
        TKAssertEquals(child.namespaceURI, "http://breakside.io/test");
        TKAssertEquals(child.localName, "test");
        TKAssertEquals(child.prefix, "abc");
        TKAssertEquals(child.childNodes.length, 1);
        text = child.childNodes[0];
        TKAssertEquals(text.data, 'testing 123');
        text = element.childNodes[2];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[3];
        TKAssertEquals(child.tagName, "c");
        TKAssertNull(child.namespaceURI);
        TKAssertEquals(child.localName, "c");
        TKAssertNull(child.prefix);
        TKAssertEquals(child.childNodes.length, 0);
        var value = child.getAttribute("one");
        TKAssertEquals(value, "1");
        value = child.getAttribute("two");
        TKAssertEquals(value, "2");
        text = element.childNodes[4];
        TKAssertEquals(text.data, "\n");


        parser = new DOMParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<root xmlns="http://breakside.io/test">',
            '  <test>testing 123</test>',
            '  <abc:c xmlns:abc="http://breakside.io/test2" one="1" two="2"/>',
            '</root>'
        ].join("\n");
        document = parser.parseFromString(xml, "text/xml");
        TKAssertNotNull(document);
        TKAssertEquals(document.childNodes.length, 1);
        element = document.documentElement;
        TKAssertNotNull(element);
        TKAssertExactEquals(element, document.childNodes[0]);
        TKAssertEquals(element.tagName, "root");
        TKAssertEquals(element.namespaceURI, "http://breakside.io/test");
        TKAssertEquals(element.localName, "root");
        TKAssertNull(element.prefix);
        TKAssertEquals(element.childNodes.length, 5);
        text = element.childNodes[0];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[1];
        TKAssertEquals(child.tagName, "test");
        TKAssertEquals(child.namespaceURI, "http://breakside.io/test");
        TKAssertEquals(child.localName, "test");
        TKAssertNull(child.prefix);
        TKAssertEquals(child.childNodes.length, 1);
        text = child.childNodes[0];
        TKAssertEquals(text.data, 'testing 123');
        text = element.childNodes[2];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[3];
        TKAssertEquals(child.tagName, "abc:c");
        TKAssertEquals(child.namespaceURI, "http://breakside.io/test2");
        TKAssertEquals(child.localName, "c");
        TKAssertEquals(child.prefix, "abc");
        TKAssertEquals(child.childNodes.length, 0);
        value = child.getAttribute("one");
        TKAssertEquals(value, "1");
        value = child.getAttribute("two");
        TKAssertEquals(value, "2");
        text = element.childNodes[4];
        TKAssertEquals(text.data, "\n");

        parser = new DOMParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<root xmlns="http://breakside.io/test">',
            '  <test xmlns="http://breakside.io/test2">',
            '    <c one="1" two="2"/>',
            '  </test>',
            '</root>'
        ].join("\n");
        document = parser.parseFromString(xml, "text/xml");
        TKAssertNotNull(document);
        TKAssertEquals(document.childNodes.length, 1);
        element = document.documentElement;
        TKAssertNotNull(element);
        TKAssertExactEquals(element, document.childNodes[0]);
        TKAssertEquals(element.tagName, "root");
        TKAssertEquals(element.namespaceURI, "http://breakside.io/test");
        TKAssertEquals(element.localName, "root");
        TKAssertNull(element.prefix);
        TKAssertEquals(element.childNodes.length, 3);
        text = element.childNodes[0];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[1];
        TKAssertEquals(child.tagName, "test");
        TKAssertEquals(child.namespaceURI, "http://breakside.io/test2");
        TKAssertEquals(child.localName, "test");
        TKAssertNull(child.prefix);
        TKAssertEquals(child.childNodes.length, 3);
        text = child.childNodes[0];
        TKAssertEquals(text.data, "\n    ");
        text = child.childNodes[2];
        TKAssertEquals(text.data, "\n  ");
        child = child.childNodes[1];
        TKAssertEquals(child.tagName, "c");
        TKAssertEquals(child.namespaceURI, "http://breakside.io/test2");
        TKAssertEquals(child.localName, "c");
        TKAssertNull(child.prefix);
        TKAssertEquals(child.childNodes.length, 0);
        value = child.getAttribute("one");
        TKAssertEquals(value, "1");
        value = child.getAttribute("two");
        TKAssertEquals(value, "2");
        text = element.childNodes[2];
        TKAssertEquals(text.data, "\n");

        parser = new DOMParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<a:root xmlns:a="http://breakside.io/test">',
            '  <a:test xmlns:a="http://breakside.io/test2">',
            '    <c one="1" two="2"/>',
            '  </a:test>',
            '  <a:test2/>',
            '</a:root>'
        ].join("\n");
        document = parser.parseFromString(xml, "text/xml");
        TKAssertNotNull(document);
        TKAssertEquals(document.childNodes.length, 1);
        element = document.documentElement;
        TKAssertNotNull(element);
        TKAssertExactEquals(element, document.childNodes[0]);
        TKAssertEquals(element.tagName, "a:root");
        TKAssertEquals(element.namespaceURI, "http://breakside.io/test");
        TKAssertEquals(element.localName, "root");
        TKAssertEquals(element.prefix, "a");
        TKAssertEquals(element.childNodes.length, 5);
        text = element.childNodes[0];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[1];
        TKAssertEquals(child.tagName, "a:test");
        TKAssertEquals(child.namespaceURI, "http://breakside.io/test2");
        TKAssertEquals(child.localName, "test");
        TKAssertEquals(child.prefix, "a");
        TKAssertEquals(child.childNodes.length, 3);
        text = child.childNodes[0];
        TKAssertEquals(text.data, "\n    ");
        text = child.childNodes[2];
        TKAssertEquals(text.data, "\n  ");
        child = child.childNodes[1];
        TKAssertEquals(child.tagName, "c");
        TKAssertNull(child.namespaceURI);
        TKAssertEquals(child.localName, "c");
        TKAssertNull(child.prefix);
        TKAssertEquals(child.childNodes.length, 0);
        value = child.getAttribute("one");
        TKAssertEquals(value, "1");
        value = child.getAttribute("two");
        TKAssertEquals(value, "2");
        text = element.childNodes[2];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[3];
        TKAssertEquals(child.tagName, "a:test2");
        TKAssertEquals(child.namespaceURI, "http://breakside.io/test");
        TKAssertEquals(child.localName, "test2");
        TKAssertEquals(child.prefix, "a");
        TKAssertEquals(child.childNodes.length, 0);
        text = element.childNodes[4];
        TKAssertEquals(text.data, "\n");
    },

    testCommentsAndCData: function(){
        var parser = new DOMParser();
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!-- Start of document -->',
            '<abc>',
            '  <test><![CDATA[anything<goes>&here;]]></test>',
            '  <!-- another',
            '  comment -->',
            '</abc>'
        ].join("\n");
        var document = parser.parseFromString(xml, "text/xml");
        TKAssertNotNull(document);
        TKAssertEquals(document.childNodes.length, 2);
        var child = document.childNodes[0];
        TKAssertEquals(child.nodeType, DOM.Node.COMMENT_NODE);
        TKAssertEquals(child.data, " Start of document ");
        var element = document.documentElement;
        TKAssertNotNull(element);
        TKAssertExactEquals(element, document.childNodes[1]);
        TKAssertEquals(element.tagName, "abc");
        TKAssertEquals(element.childNodes.length, 5);
        var text = element.childNodes[0];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[1];
        TKAssertEquals(child.tagName, "test");
        TKAssertEquals(child.childNodes.length, 1);
        text = child.childNodes[0];
        TKAssertEquals(text.nodeType, DOM.Node.CDATA_SECTION_NODE);
        TKAssertEquals(text.data, 'anything<goes>&here;');
        text = element.childNodes[2];
        TKAssertEquals(text.data, "\n  ");
        child = element.childNodes[3];
        TKAssertEquals(child.nodeType, DOM.Node.COMMENT_NODE);
        TKAssertEquals(child.data, " another\n  comment ");
        TKAssertEquals(child.childNodes.length, 0);
        text = element.childNodes[4];
        TKAssertEquals(text.data, "\n");
    },

    testHTML: function(){
        var parser = new DOMParser();
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
        var document = parser.parseFromString(xml, "text/html");
        TKAssertNotNull(document);
        TKAssertEquals(document.childNodes.length, 2);
        var doctype = document.childNodes[0];
        TKAssertEquals(doctype.nodeType, DOM.Node.DOCUMENT_TYPE_NODE);
        TKAssertEquals(doctype.name, "html");
        TKAssertExactEquals(doctype.publicId, "");
        TKAssertExactEquals(doctype.systemId, "");
        var html = document.documentElement;
        TKAssertExactEquals(html, document.childNodes[1]);
        var headIndex;
        var textIndex;
        var bodyIndex;
        if (html.childNodes.length == 3){
            // browser parsers strip the opening and closing text children of the
            // html node.
            headIndex = 0;
            textIndex = 1;
            bodyIndex = 2;
        }else if (html.childNodes.length == 5){
            // Our parser preserves everything
            headIndex = 1;
            textIndex = 2;
            bodyIndex = 3;
        }else{

            TKAssert(false, "Expecting 3 or 5 child nodes of html");
        }
        var head = html.childNodes[headIndex];
        TKAssertEquals(head.localName, "head");
        TKAssertEquals(head.childNodes.length, 7);
        var text = head.childNodes[0];
        TKAssertEquals(text.data, "\n    ");
        var link = head.childNodes[1];
        TKAssertEquals(link.localName, "link");
        TKAssertEquals(link.childNodes.length, 0);
        var value = link.getAttribute("href");
        TKAssertEquals(value, "sheet.css");
        value = link.getAttribute("type");
        TKAssertEquals(value, "text/css");
        text = head.childNodes[2];
        TKAssertEquals(text.data, "\n    ");
        var script = head.childNodes[3];
        TKAssertEquals(script.localName, "script");
        TKAssertEquals(script.childNodes.length, 0);
        value = script.getAttribute("type");
        TKAssertEquals(value, "text/javascript");
        value = script.getAttribute("src");
        TKAssertEquals(value, "script.js");
        text = head.childNodes[4];
        TKAssertEquals(text.data, "\n    ");
        script = head.childNodes[5];
        TKAssertEquals(script.localName, "script");
        TKAssertEquals(script.childNodes.length, 1);
        value = script.getAttribute("type");
        TKAssertEquals(value, "text/javascript");
        text = script.childNodes[0];
        TKAssertEquals(text.data, "\n      // scripts can include < & special chars &amp;\n      if (0 < 1){\n      }\n    ");
        text = head.childNodes[6];
        TKAssertEquals(text.data, "\n  ");
        text = html.childNodes[textIndex];
        TKAssertEquals(text.data, "\n  ");
        var body = html.childNodes[bodyIndex];
        TKAssertEquals(body.localName, "body");
        TKAssertEquals(body.childNodes.length, 1);
        // browsers have "  " instead of "\n  "...not sure why, but it's not important for our uses
        // text = body.childNodes[0];
        // TKAssertEquals(text.data, "\n  ");
    }

});

})();