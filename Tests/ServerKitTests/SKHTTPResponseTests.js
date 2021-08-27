// #import ServerKit
// #import TestKit
"use strict";

JSClass("SKHTTPResponseTests", TKTestSuite, {

    testContentType: function(){
        var response = SKHTTPResponse.init();
        TKAssertNull(response.contentType);
        response.contentType = "application/json";
        TKAssertExactEquals(response.headerMap.get("Content-Type"), "application/json");
        TKAssertInstance(response.contentType, JSMediaType);
        TKAssertEquals(response.contentType.type, "application");
        TKAssertEquals(response.contentType.subtype, "json");

        response.contentType = JSMediaType("text/html");
        TKAssertExactEquals(response.headerMap.get("Content-Type"), "text/html");
        TKAssertInstance(response.contentType, JSMediaType);
        TKAssertEquals(response.contentType.type, "text");
        TKAssertEquals(response.contentType.subtype, "html");
    },

});