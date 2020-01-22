// #import Foundation
// #import TestKit
'use strict';

JSClass("JSURLSessionTests", TKTestSuite, {

    testRequest: function(){
        var url = JSURL.initWithString("http://localhost:8088/");
        var expectation = TKExpectation.init();
        var task = expectation.call(JSURLSession.shared.dataTaskWithURL, JSURLSession.shared, url, function(error){
            TKAssertNull(error);
            var response = task.response;
            TKAssertNotNull(response);
            TKAssertEquals(response.statusCode, 200);
            TKAssertNotNull(response.data);
            var html = response.data.stringByDecodingUTF8();
            TKAssert(html.startsWith("<!DOCTYPE html>"));
            TKAssert(html.endsWith("</html>"));
        });
        task.resume();
        this.wait(expectation, 1.0);
    }

});