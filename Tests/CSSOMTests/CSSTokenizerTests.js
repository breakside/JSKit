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

// #import CSSOM
// #import TestKit
"use strict";

JSClass("CSSTokenizerTests", TKTestSuite, {

    testIdentifier: function(){
        var css = "test";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSIdentifierToken);
        TKAssertEquals(tokens[0].name, "test");

        css = "test Test _test -test --test";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 9);
        TKAssertInstance(tokens[0], CSSIdentifierToken);
        TKAssertInstance(tokens[1], CSSWhitespaceToken);
        TKAssertInstance(tokens[2], CSSIdentifierToken);
        TKAssertInstance(tokens[3], CSSWhitespaceToken);
        TKAssertInstance(tokens[4], CSSIdentifierToken);
        TKAssertInstance(tokens[5], CSSWhitespaceToken);
        TKAssertInstance(tokens[6], CSSIdentifierToken);
        TKAssertInstance(tokens[7], CSSWhitespaceToken);
        TKAssertInstance(tokens[8], CSSIdentifierToken);
        TKAssertEquals(tokens[0].name, "test");
        TKAssertEquals(tokens[2].name, "Test");
        TKAssertEquals(tokens[4].name, "_test");
        TKAssertEquals(tokens[6].name, "-test");
        TKAssertEquals(tokens[8].name, "--test");

        TKAssertEquals(tokens[0].toString(), "test");
        TKAssertEquals(tokens[2].toString(), "Test");
        TKAssertEquals(tokens[8].toString(), "--test");
    },

    testWhitespace: function(){
        var css = "\n\n\ttest    \t  \r\nTest\r_test \f \f\t \n";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 7);
        TKAssertInstance(tokens[0], CSSWhitespaceToken);
        TKAssertInstance(tokens[1], CSSIdentifierToken);
        TKAssertInstance(tokens[2], CSSWhitespaceToken);
        TKAssertInstance(tokens[3], CSSIdentifierToken);
        TKAssertInstance(tokens[4], CSSWhitespaceToken);
        TKAssertInstance(tokens[5], CSSIdentifierToken);
        TKAssertInstance(tokens[6], CSSWhitespaceToken);
        TKAssertEquals(tokens[1].name, "test");
        TKAssertEquals(tokens[3].name, "Test");
        TKAssertEquals(tokens[5].name, "_test");
        TKAssertEquals(tokens[0].whitespace, "\n\n\t");
        TKAssertEquals(tokens[2].whitespace, "    \t  \r\n");
        TKAssertEquals(tokens[4].whitespace, "\r");
        TKAssertEquals(tokens[6].whitespace, " \f \f\t \n");

        TKAssertEquals(tokens[0].toString(), "\n\n\t");
        TKAssertEquals(tokens[2].toString(), "    \t  \r\n");
        TKAssertEquals(tokens[6].toString(), " \f \f\t \n");
    },

    testComment: function(){
        var css = "/*\n    this is a comment\n    two lines\n*/\n/**/Test/*comment*/_test/*  comment  */";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 7);
        TKAssertInstance(tokens[0], CSSCommentToken);
        TKAssertInstance(tokens[1], CSSWhitespaceToken);
        TKAssertInstance(tokens[2], CSSCommentToken);
        TKAssertInstance(tokens[3], CSSIdentifierToken);
        TKAssertInstance(tokens[4], CSSCommentToken);
        TKAssertInstance(tokens[5], CSSIdentifierToken);
        TKAssertInstance(tokens[6], CSSCommentToken);
        TKAssertEquals(tokens[3].name, "Test");
        TKAssertEquals(tokens[5].name, "_test");
        TKAssertEquals(tokens[1].whitespace, "\n");
        TKAssertEquals(tokens[0].text, "\n    this is a comment\n    two lines\n");
        TKAssertEquals(tokens[2].text, "");
        TKAssertEquals(tokens[4].text, "comment");
        TKAssertEquals(tokens[6].text, "  comment  ");

        TKAssertEquals(tokens[0].toString(), "/*\n    this is a comment\n    two lines\n*/");
        TKAssertEquals(tokens[2].toString(), "/**/");
        TKAssertEquals(tokens[4].toString(), "/*comment*/");
        TKAssertEquals(tokens[6].toString(), "/*  comment  */");
    },

    testString: function(){
        var css = "'test' 'tes\\'t' \"Test\" \"Tes\\\"t\" 'te\\\nst'";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 9);
        TKAssertInstance(tokens[0], CSSStringToken);
        TKAssertInstance(tokens[1], CSSWhitespaceToken);
        TKAssertInstance(tokens[2], CSSStringToken);
        TKAssertInstance(tokens[3], CSSWhitespaceToken);
        TKAssertInstance(tokens[4], CSSStringToken);
        TKAssertInstance(tokens[5], CSSWhitespaceToken);
        TKAssertInstance(tokens[6], CSSStringToken);
        TKAssertInstance(tokens[7], CSSWhitespaceToken);
        TKAssertInstance(tokens[8], CSSStringToken);
        TKAssertEquals(tokens[0].quote, "'");
        TKAssertEquals(tokens[0].value, "test");
        TKAssertEquals(tokens[2].quote, "'");
        TKAssertEquals(tokens[2].value, "tes't");
        TKAssertEquals(tokens[4].quote, '"');
        TKAssertEquals(tokens[4].value, 'Test');
        TKAssertEquals(tokens[6].quote, '"');
        TKAssertEquals(tokens[6].value, 'Tes"t');
        TKAssertEquals(tokens[8].quote, "'");
        TKAssertEquals(tokens[8].value, "test");

        TKAssertEquals(tokens[0].toString(), "'test'");
        TKAssertEquals(tokens[2].toString(), "'tes\\'t'");
        TKAssertEquals(tokens[4].toString(), '"Test"');
        TKAssertEquals(tokens[6].toString(), '"Tes\\"t"');
        TKAssertEquals(tokens[0].toString(), "'test'");
    },

    testNumbers: function(){
        var css = "1,12,123,1.23,.123,1e23";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSNumberToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSNumberToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSNumberToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSNumberToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSNumberToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSNumberToken);
        TKAssertExactEquals(tokens[0].value, 1);
        TKAssertExactEquals(tokens[2].value, 12);
        TKAssertExactEquals(tokens[4].value, 123);
        TKAssertFloatEquals(tokens[6].value, 1.23);
        TKAssertFloatEquals(tokens[8].value, 0.123);
        TKAssertFloatEquals(tokens[10].value, 1e23);

        TKAssertEquals(tokens[0].toString(), "1");
        TKAssertEquals(tokens[2].toString(), "12");
        TKAssertEquals(tokens[4].toString(), "123");
        TKAssertEquals(tokens[6].toString(), "1.23");
        TKAssertEquals(tokens[8].toString(), "0.123"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "1e+23"); // rewritten with + exponent

        css = "+1,+12,+123,+1.23,+.123,+1e23";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSNumberToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSNumberToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSNumberToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSNumberToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSNumberToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSNumberToken);
        TKAssertExactEquals(tokens[0].value, 1);
        TKAssertExactEquals(tokens[2].value, 12);
        TKAssertExactEquals(tokens[4].value, 123);
        TKAssertFloatEquals(tokens[6].value, 1.23);
        TKAssertFloatEquals(tokens[8].value, 0.123);
        TKAssertFloatEquals(tokens[10].value, 1e23);

        // all rewritten without leading plus
        TKAssertEquals(tokens[0].toString(), "1");
        TKAssertEquals(tokens[2].toString(), "12");
        TKAssertEquals(tokens[4].toString(), "123");
        TKAssertEquals(tokens[6].toString(), "1.23");
        TKAssertEquals(tokens[8].toString(), "0.123"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "1e+23"); // rewritten with + exponent

        css = "-1,-12,-123,-1.23,-.123,-1e23";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSNumberToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSNumberToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSNumberToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSNumberToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSNumberToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSNumberToken);
        TKAssertExactEquals(tokens[0].value, -1);
        TKAssertExactEquals(tokens[2].value, -12);
        TKAssertExactEquals(tokens[4].value, -123);
        TKAssertFloatEquals(tokens[6].value, -1.23);
        TKAssertFloatEquals(tokens[8].value, -0.123);
        TKAssertFloatEquals(tokens[10].value, -1e23);

        TKAssertEquals(tokens[0].toString(), "-1");
        TKAssertEquals(tokens[2].toString(), "-12");
        TKAssertEquals(tokens[4].toString(), "-123");
        TKAssertEquals(tokens[6].toString(), "-1.23");
        TKAssertEquals(tokens[8].toString(), "-0.123"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "-1e+23"); // rewritten with + exponent
    },

    testDimensions: function(){
        var css = "1px,12em,123abc,1.23test,.123_abc,1e23ABC";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSDimensionToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSDimensionToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSDimensionToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSDimensionToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSDimensionToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSDimensionToken);
        TKAssertExactEquals(tokens[0].value, 1);
        TKAssertExactEquals(tokens[2].value, 12);
        TKAssertExactEquals(tokens[4].value, 123);
        TKAssertFloatEquals(tokens[6].value, 1.23);
        TKAssertFloatEquals(tokens[8].value, 0.123);
        TKAssertFloatEquals(tokens[10].value, 1e23);
        TKAssertEquals(tokens[0].units, "px");
        TKAssertEquals(tokens[2].units, "em");
        TKAssertEquals(tokens[4].units, "abc");
        TKAssertEquals(tokens[6].units, "test");
        TKAssertEquals(tokens[8].units, "_abc");
        TKAssertEquals(tokens[10].units, "ABC");

        TKAssertEquals(tokens[0].toString(), "1px");
        TKAssertEquals(tokens[2].toString(), "12em");
        TKAssertEquals(tokens[4].toString(), "123abc");
        TKAssertEquals(tokens[6].toString(), "1.23test");
        TKAssertEquals(tokens[8].toString(), "0.123_abc"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "1e+23ABC"); // rewritten with + exponent

        css = "+1px,+12em,+123abc,+1.23test,+.123_abc,+1e23ABC";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSDimensionToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSDimensionToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSDimensionToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSDimensionToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSDimensionToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSDimensionToken);
        TKAssertExactEquals(tokens[0].value, 1);
        TKAssertExactEquals(tokens[2].value, 12);
        TKAssertExactEquals(tokens[4].value, 123);
        TKAssertFloatEquals(tokens[6].value, 1.23);
        TKAssertFloatEquals(tokens[8].value, 0.123);
        TKAssertFloatEquals(tokens[10].value, 1e23);
        TKAssertEquals(tokens[0].units, "px");
        TKAssertEquals(tokens[2].units, "em");
        TKAssertEquals(tokens[4].units, "abc");
        TKAssertEquals(tokens[6].units, "test");
        TKAssertEquals(tokens[8].units, "_abc");
        TKAssertEquals(tokens[10].units, "ABC");

        // all rewritten without leading plus
        TKAssertEquals(tokens[0].toString(), "1px");
        TKAssertEquals(tokens[2].toString(), "12em");
        TKAssertEquals(tokens[4].toString(), "123abc");
        TKAssertEquals(tokens[6].toString(), "1.23test");
        TKAssertEquals(tokens[8].toString(), "0.123_abc"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "1e+23ABC"); // rewritten with + exponent

        css = "-1px,-12em,-123abc,-1.23test,-.123_abc,-1e23ABC";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSDimensionToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSDimensionToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSDimensionToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSDimensionToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSDimensionToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSDimensionToken);
        TKAssertExactEquals(tokens[0].value, -1);
        TKAssertExactEquals(tokens[2].value, -12);
        TKAssertExactEquals(tokens[4].value, -123);
        TKAssertFloatEquals(tokens[6].value, -1.23);
        TKAssertFloatEquals(tokens[8].value, -0.123);
        TKAssertFloatEquals(tokens[10].value, -1e23);
        TKAssertEquals(tokens[0].units, "px");
        TKAssertEquals(tokens[2].units, "em");
        TKAssertEquals(tokens[4].units, "abc");
        TKAssertEquals(tokens[6].units, "test");
        TKAssertEquals(tokens[8].units, "_abc");
        TKAssertEquals(tokens[10].units, "ABC");

        TKAssertEquals(tokens[0].toString(), "-1px");
        TKAssertEquals(tokens[2].toString(), "-12em");
        TKAssertEquals(tokens[4].toString(), "-123abc");
        TKAssertEquals(tokens[6].toString(), "-1.23test");
        TKAssertEquals(tokens[8].toString(), "-0.123_abc"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "-1e+23ABC"); // rewritten with + exponent
    },

    testPercentages: function(){
        var css = "1%,12%,123%,1.23%,.123%,1e23%";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSPercentageToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSPercentageToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSPercentageToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSPercentageToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSPercentageToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSPercentageToken);
        TKAssertExactEquals(tokens[0].value, 1);
        TKAssertExactEquals(tokens[2].value, 12);
        TKAssertExactEquals(tokens[4].value, 123);
        TKAssertFloatEquals(tokens[6].value, 1.23);
        TKAssertFloatEquals(tokens[8].value, 0.123);
        TKAssertFloatEquals(tokens[10].value, 1e23);

        TKAssertEquals(tokens[0].toString(), "1%");
        TKAssertEquals(tokens[2].toString(), "12%");
        TKAssertEquals(tokens[4].toString(), "123%");
        TKAssertEquals(tokens[6].toString(), "1.23%");
        TKAssertEquals(tokens[8].toString(), "0.123%"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "1e+23%"); // rewritten with + exponent

        css = "+1%,+12%,+123%,+1.23%,+.123%,+1e23%";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSPercentageToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSPercentageToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSPercentageToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSPercentageToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSPercentageToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSPercentageToken);
        TKAssertExactEquals(tokens[0].value, 1);
        TKAssertExactEquals(tokens[2].value, 12);
        TKAssertExactEquals(tokens[4].value, 123);
        TKAssertFloatEquals(tokens[6].value, 1.23);
        TKAssertFloatEquals(tokens[8].value, 0.123);
        TKAssertFloatEquals(tokens[10].value, 1e23);

        // all rewritten without leading plus
        TKAssertEquals(tokens[0].toString(), "1%");
        TKAssertEquals(tokens[2].toString(), "12%");
        TKAssertEquals(tokens[4].toString(), "123%");
        TKAssertEquals(tokens[6].toString(), "1.23%");
        TKAssertEquals(tokens[8].toString(), "0.123%"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "1e+23%"); // rewritten with + exponent

        css = "-1%,-12%,-123%,-1.23%,-.123%,-1e23%";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 11);
        TKAssertInstance(tokens[0], CSSPercentageToken);
        TKAssertInstance(tokens[1], CSSCommaToken);
        TKAssertInstance(tokens[2], CSSPercentageToken);
        TKAssertInstance(tokens[3], CSSCommaToken);
        TKAssertInstance(tokens[4], CSSPercentageToken);
        TKAssertInstance(tokens[5], CSSCommaToken);
        TKAssertInstance(tokens[6], CSSPercentageToken);
        TKAssertInstance(tokens[7], CSSCommaToken);
        TKAssertInstance(tokens[8], CSSPercentageToken);
        TKAssertInstance(tokens[9], CSSCommaToken);
        TKAssertInstance(tokens[10], CSSPercentageToken);
        TKAssertExactEquals(tokens[0].value, -1);
        TKAssertExactEquals(tokens[2].value, -12);
        TKAssertExactEquals(tokens[4].value, -123);
        TKAssertFloatEquals(tokens[6].value, -1.23);
        TKAssertFloatEquals(tokens[8].value, -0.123);
        TKAssertFloatEquals(tokens[10].value, -1e23);

        TKAssertEquals(tokens[0].toString(), "-1%");
        TKAssertEquals(tokens[2].toString(), "-12%");
        TKAssertEquals(tokens[4].toString(), "-123%");
        TKAssertEquals(tokens[6].toString(), "-1.23%");
        TKAssertEquals(tokens[8].toString(), "-0.123%"); // rewritten with leading 0
        TKAssertEquals(tokens[10].toString(), "-1e+23%"); // rewritten with + exponent
    },

    testHash: function(){
        var css = "#";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSDelimToken);
        TKAssertEquals(tokens[0].char, "#");

        TKAssertEquals(tokens[0].toString(), "#");

        css = "#test";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSHashToken);
        TKAssertEquals(tokens[0].name, "test");
        TKAssertEquals(tokens[0].type, "id");

        TKAssertEquals(tokens[0].toString(), "#test");

        css = "#9test";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSHashToken);
        TKAssertEquals(tokens[0].name, "9test");
        TKAssertNull(tokens[0].type);

        TKAssertEquals(tokens[0].toString(), "#9test");
    },

    testAt: function(){
        var css = "@";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSDelimToken);
        TKAssertEquals(tokens[0].char, "@");

        TKAssertEquals(tokens[0].toString(), "@");

        css = "@test";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSAtKeywordToken);
        TKAssertEquals(tokens[0].name, "test");

        TKAssertEquals(tokens[0].toString(), "@test");

        css = "@9test";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 2);
        TKAssertInstance(tokens[0], CSSDelimToken);
        TKAssertEquals(tokens[0].char, "@");
        TKAssertInstance(tokens[1], CSSDimensionToken);
        TKAssertEquals(tokens[1].value, 9);
        TKAssertEquals(tokens[1].units, "test");

        TKAssertEquals(tokens[0].toString(), "@");
        TKAssertEquals(tokens[1].toString(), "9test");
    },

    testDelimiters: function(){
        var css = "()[]{},:;<><!---->.";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 14);
        TKAssertInstance(tokens[0], CSSOpenParenToken);
        TKAssertInstance(tokens[1], CSSCloseParenToken);
        TKAssertInstance(tokens[2], CSSOpenSquareToken);
        TKAssertInstance(tokens[3], CSSCloseSquareToken);
        TKAssertInstance(tokens[4], CSSOpenCurlyToken);
        TKAssertInstance(tokens[5], CSSCloseCurlyToken);
        TKAssertInstance(tokens[6], CSSCommaToken);
        TKAssertInstance(tokens[7], CSSColonToken);
        TKAssertInstance(tokens[8], CSSSemicolonToken);
        TKAssertInstance(tokens[9], CSSDelimToken);
        TKAssertEquals(tokens[9].char, "<");
        TKAssertInstance(tokens[10], CSSDelimToken);
        TKAssertEquals(tokens[10].char, ">");
        TKAssertInstance(tokens[11], CSSCDOToken);
        TKAssertInstance(tokens[12], CSSCDCToken);
        TKAssertInstance(tokens[13], CSSDelimToken);
        TKAssertEquals(tokens[13].char, ".");

        TKAssertEquals(tokens[0].toString(), "(");
        TKAssertEquals(tokens[1].toString(), ")");
        TKAssertEquals(tokens[2].toString(), "[");
        TKAssertEquals(tokens[3].toString(), "]");
        TKAssertEquals(tokens[4].toString(), "{");
        TKAssertEquals(tokens[5].toString(), "}");
        TKAssertEquals(tokens[6].toString(), ",");
        TKAssertEquals(tokens[7].toString(), ":");
        TKAssertEquals(tokens[8].toString(), ";");
        TKAssertEquals(tokens[9].toString(), "<");
        TKAssertEquals(tokens[10].toString(), ">");
        TKAssertEquals(tokens[11].toString(), "<!--");
        TKAssertEquals(tokens[12].toString(), "-->");
        TKAssertEquals(tokens[13].toString(), ".");
    },

    testFunctions: function(){
        var css = "test()";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 2);
        TKAssertInstance(tokens[0], CSSFunctionToken);
        TKAssertEquals(tokens[0].name, "test");
        TKAssertInstance(tokens[1], CSSCloseParenToken);

        TKAssertEquals(tokens[0].toString(), "test(");
        TKAssertEquals(tokens[1].toString(), ")");

        css = "--test('one',2, 3.4)";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 8);
        TKAssertInstance(tokens[0], CSSFunctionToken);
        TKAssertInstance(tokens[1], CSSStringToken);
        TKAssertInstance(tokens[2], CSSCommaToken);
        TKAssertInstance(tokens[3], CSSNumberToken);
        TKAssertInstance(tokens[4], CSSCommaToken);
        TKAssertInstance(tokens[5], CSSWhitespaceToken);
        TKAssertInstance(tokens[6], CSSNumberToken);
        TKAssertInstance(tokens[7], CSSCloseParenToken);
        TKAssertEquals(tokens[0].name, "--test");
        TKAssertEquals(tokens[1].value, "one");
        TKAssertEquals(tokens[3].value, 2);
        TKAssertFloatEquals(tokens[6].value, 3.4);

        TKAssertEquals(tokens[0].toString(), "--test(");
        TKAssertEquals(tokens[1].toString(), "'one'");
        TKAssertEquals(tokens[2].toString(), ",");
        TKAssertEquals(tokens[3].toString(), "2");
        TKAssertEquals(tokens[4].toString(), ",");
        TKAssertEquals(tokens[5].toString(), " ");
        TKAssertEquals(tokens[6].toString(), "3.4");
        TKAssertEquals(tokens[7].toString(), ")");
    },

    testURL: function(){
        var css = "url(one)";
        var tokenizer = CSSTokenizer.initWithCSSText(css);
        var tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSURLToken);
        TKAssertEquals(tokens[0].url, "one");

        TKAssertEquals(tokens[0].toString(), "url(one)");

        css = "url( one/there#hash )";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 1);
        TKAssertInstance(tokens[0], CSSURLToken);
        TKAssertEquals(tokens[0].url, "one/there#hash");

        TKAssertEquals(tokens[0].toString(), "url(one/there#hash)"); // rewritten without whitespace

        css = "url('one/there#hash')";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 3);
        TKAssertInstance(tokens[0], CSSFunctionToken);
        TKAssertEquals(tokens[0].name, "url");
        TKAssertInstance(tokens[1], CSSStringToken);
        TKAssertEquals(tokens[1].value, "one/there#hash");
        TKAssertInstance(tokens[2], CSSCloseParenToken);


        TKAssertEquals(tokens[0].toString(), "url(");
        TKAssertEquals(tokens[1].toString(), "'one/there#hash'");
        TKAssertEquals(tokens[2].toString(), ")");

        css = "url( \"one/there#hash\" )";
        tokenizer = CSSTokenizer.initWithCSSText(css);
        tokens = tokenizer.tokenize();
        TKAssertEquals(tokens.length, 4);
        TKAssertInstance(tokens[0], CSSFunctionToken);
        TKAssertEquals(tokens[0].name, "url");
        TKAssertInstance(tokens[1], CSSStringToken);
        TKAssertEquals(tokens[1].value, "one/there#hash");
        TKAssertInstance(tokens[2], CSSWhitespaceToken);
        TKAssertEquals(tokens[2].whitespace, " ");
        TKAssertInstance(tokens[3], CSSCloseParenToken);

        TKAssertEquals(tokens[0].toString(), "url(");
        TKAssertEquals(tokens[1].toString(), "\"one/there#hash\"");
        TKAssertEquals(tokens[2].toString(), " ");
        TKAssertEquals(tokens[3].toString(), ")");
    },

});