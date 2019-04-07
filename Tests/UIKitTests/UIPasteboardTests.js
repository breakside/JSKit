// #import UIKit
// #import TestKit
/* global JSClass, TKTestSuite, UIPasteboard */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
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