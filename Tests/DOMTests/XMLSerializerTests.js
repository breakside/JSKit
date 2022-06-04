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

    testDoctype: function(){
        var parser = new DOMParser();
        var xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE something>',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        var document = parser.parseFromString(xml, "text/xml");
        var serializer = new XMLSerializer();
        var str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);

        parser = new DOMParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE something PUBLIC "-//SOMETHING//" "http://something.somewhere/test">',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        document = parser.parseFromString(xml, "text/xml");
        serializer = new XMLSerializer();
        str = serializer.serializeToString(document);
        TKAssertEquals(str, xml);

        parser = new DOMParser();
        xml = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE something SYSTEM "http://something.somewhere/test">',
            '<abc>',
            '  <test>testing 123</test>',
            '  <c one="1" two="2"/>',
            '</abc>'
        ].join("\n");
        document = parser.parseFromString(xml, "text/xml");
        serializer = new XMLSerializer();
        str = serializer.serializeToString(document);
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