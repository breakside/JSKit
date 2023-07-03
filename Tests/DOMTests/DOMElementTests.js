// #import DOM
// #import TestKit
"use strict";

JSClass("DOMElementTests", TKTestSuite, {

    testInnerHTML: function(){
        var document = DOM.createHTMLDocument();
        var p = document.body.appendChild(document.createElement("p"));
        document.body.setAttribute("class", "test");
        p.appendChild(document.createTextNode("testing "));
        var b = p.appendChild(document.createElement("b"));
        b.appendChild(document.createTextNode("123"));
        p.appendChild(document.createTextNode(" & <abc>"));
        document.body.appendChild(document.createElement("br"));
        var html = document.body.innerHTML;
        TKAssert(html === "<p>testing <b>123</b> &amp; &lt;abc></p><br>" || html === "<p>testing <b>123</b> &amp; &lt;abc&gt;</p><br>");
    }

});