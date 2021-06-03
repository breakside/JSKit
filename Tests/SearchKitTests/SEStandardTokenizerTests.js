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