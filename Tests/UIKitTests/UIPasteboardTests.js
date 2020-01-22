// #import UIKit
// #import TestKit
'use strict';

JSClass("UIPasteboardTests", TKTestSuite, {

    testString: function(){
        var pasteboard = UIPasteboard.init();
        pasteboard.setStringForType("hello", UIPasteboard.ContentType.plainText);
        TKAssert(pasteboard.containsType(UIPasteboard.ContentType.plainText));
        var value = pasteboard.stringForType(UIPasteboard.ContentType.plainText);
        TKAssertEquals(value, "hello");
    }

});