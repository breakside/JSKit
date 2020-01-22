// #import TestKit
// #import DOM
'use strict';

(function(){

JSClass('XMLSerializerTests', TKTestSuite, {

    requiredEnvironment: "node",

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
        var serializer = new XMLSerializer();
        var str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);
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
        var serializer = new XMLSerializer();
        var str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);


        parser = new DOMParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<root xmlns="http://breakside.io/test">',
            '  <test>testing 123</test>',
            '  <abc:c xmlns:abc="http://breakside.io/test2" one="1" two="2"/>',
            '</root>'
        ].join("\n");
        document = parser.parseFromString(xml, "text/xml");
        serializer = new XMLSerializer();
        str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);

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
        serializer = new XMLSerializer();
        str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);

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
        serializer = new XMLSerializer();
        str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);
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
        var serializer = new XMLSerializer();
        var str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);
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
        var serializer = new XMLSerializer();
        var str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);
    }

});

})();