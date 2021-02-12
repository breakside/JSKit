// #import SearchKit
// #import TestKit
"use strict";

JSClass("SEStandardTokenizerTests", TKTestSuite, {

    testAll: function(){
        var tokenizer = SEStandardTokenizer.initWithString("Test one two");
        var words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("a b c");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "a b c");

        tokenizer = SEStandardTokenizer.initWithString("");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "");

        tokenizer = SEStandardTokenizer.initWithString("a");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "a");

        tokenizer = SEStandardTokenizer.initWithString(".");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "");

        tokenizer = SEStandardTokenizer.initWithString("..");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "");

        tokenizer = SEStandardTokenizer.initWithString(" ");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "");

        tokenizer = SEStandardTokenizer.initWithString("  ");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "");

        tokenizer = SEStandardTokenizer.initWithString(" Test   one  two  ");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("\nTest\r\none\rtwo\r\n");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("'Test',one&two!");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("He said, \"Hello, world!\"");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "he said hello world");

        tokenizer = SEStandardTokenizer.initWithString("He said, \"It's a wonderful world.\"");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "he said it's a wonderful world");

        tokenizer = SEStandardTokenizer.initWithString("Test. One. Two.");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("Test.  One.  Two.");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("Test.  One.  Two.");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("test.one:two");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");

        tokenizer = SEStandardTokenizer.initWithString("(test) one[two]");
        words = tokenizer.all();
        TKAssertEquals(words.join(" "), "test one two");
    }

});