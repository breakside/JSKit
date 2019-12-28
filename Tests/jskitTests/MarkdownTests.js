// #import jskit
// #import TestKit
// #import DOM
/* global JSClass, TKTestSuite, Markdown, DOM, JSURL */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals, TKAssertArrayEquals */
'use strict';

JSClass("MarkdownTests", TKTestSuite, {

    testParagraphs: function(){
        var str = "This is a test of our\nmarkdown parser's ability to\nparse & read paragraphs.\n\nThis example should\ninclude three...\n\n...paragraphs";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read paragraphs.");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This example should include three...");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...paragraphs");
    },

    testHeaders: function(){
        var str = "Testing 123\n=====\n\nThis is a test\nof markdown headers";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "h1");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Testing 123");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");

        str = "Testing 123\n--\n\nThis is a test\nof markdown headers";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "h2");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Testing 123");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");

        // single line break
        str = "Testing 123\n=====\nThis is a test\nof markdown headers\nAnother header\n=";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "h1");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Testing 123");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");
        TKAssertEquals(elements[2].tagName, "h1");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "Another header");

        // leading hash
        str = "# Testing 123\nThis is a test\nof markdown headers";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "h1");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Testing 123");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");

        str = "## Testing 123\nThis is a test\nof markdown headers";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "h2");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Testing 123");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");

        // trailing hash
        str = "# Testing 123 #\nThis is a test\nof markdown headers";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "h1");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Testing 123");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");

        str = "## Testing 123 ##\nThis is a test\nof markdown headers";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "h2");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Testing 123");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");

        // inline styles
        str = "Headers do not have *inline* **styles** or `code`\n=====\n\nThis is a test\nof markdown headers";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "h1");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "Headers do not have *inline* **styles** or `code`");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This is a test of markdown headers");
    },

    testEmphasis: function(){
        var str = "This is a *test* of **markdown**";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 4);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a ");
        TKAssertEquals(elements[0].childNodes[1].tagName, "em");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].data, "test");
        TKAssertEquals(elements[0].childNodes[2].data, " of ");
        TKAssertEquals(elements[0].childNodes[3].tagName, "strong");
        TKAssertEquals(elements[0].childNodes[3].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[3].childNodes[0].data, "markdown");

        // strong at start
        str = "**This** is a *test* of markdown";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 4);
        TKAssertEquals(elements[0].childNodes[0].tagName, "strong");
        TKAssertEquals(elements[0].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].childNodes[0].data, "This");
        TKAssertEquals(elements[0].childNodes[1].data, " is a ");
        TKAssertEquals(elements[0].childNodes[2].tagName, "em");
        TKAssertEquals(elements[0].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].data, "test");
        TKAssertEquals(elements[0].childNodes[3].data, " of markdown");

        // em at end
        str = "This is a **test** of *markdown*";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 4);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a ");
        TKAssertEquals(elements[0].childNodes[1].tagName, "strong");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].data, "test");
        TKAssertEquals(elements[0].childNodes[2].data, " of ");
        TKAssertEquals(elements[0].childNodes[3].tagName, "em");
        TKAssertEquals(elements[0].childNodes[3].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[3].childNodes[0].data, "markdown");

        // em at start
        str = "*This* is a **test** of markdown";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 4);
        TKAssertEquals(elements[0].childNodes[0].tagName, "em");
        TKAssertEquals(elements[0].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].childNodes[0].data, "This");
        TKAssertEquals(elements[0].childNodes[1].data, " is a ");
        TKAssertEquals(elements[0].childNodes[2].tagName, "strong");
        TKAssertEquals(elements[0].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].data, "test");
        TKAssertEquals(elements[0].childNodes[3].data, " of markdown");
    },

    testInlineCode: function(){
        var str = "This is a `test` of `markdown`";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 4);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a ");
        TKAssertEquals(elements[0].childNodes[1].tagName, "code");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].data, "test");
        TKAssertEquals(elements[0].childNodes[2].data, " of ");
        TKAssertEquals(elements[0].childNodes[3].tagName, "code");
        TKAssertEquals(elements[0].childNodes[3].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[3].childNodes[0].data, "markdown");

        str = "`This` is a test of `markdown`";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 3);
        TKAssertEquals(elements[0].childNodes[0].tagName, "code");
        TKAssertEquals(elements[0].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].childNodes[0].data, "This");
        TKAssertEquals(elements[0].childNodes[1].data, " is a test of ");
        TKAssertEquals(elements[0].childNodes[2].tagName, "code");
        TKAssertEquals(elements[0].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].data, "markdown");
    },

    testInlineCodeLink: function(){
        var str = "This is a `test` of `markdown`(Test.markdown)";
        var markdown = Markdown.initWithString(str);
        var delegate = {
            urlForMarkdownCode: function(markdown, code){
                if (code === 'test'){
                    return JSURL.initWithString('../test.html');
                }
                if (code === 'markdown'){
                    return JSURL.initWithString('../markdown.html');
                }
                if (code === 'Test.markdown'){
                    return JSURL.initWithString('../Test/markdown.html');
                }
                return null;
            }
        };
        markdown.delegate = delegate;
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 4);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a ");
        TKAssertEquals(elements[0].childNodes[1].tagName, "code");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].tagName, "a");
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].getAttribute("href"), "../test.html");
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].childNodes[0].data, "test");
        TKAssertEquals(elements[0].childNodes[2].data, " of ");
        TKAssertEquals(elements[0].childNodes[3].tagName, "code");
        TKAssertEquals(elements[0].childNodes[3].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[3].childNodes[0].tagName, "a");
        TKAssertEquals(elements[0].childNodes[3].childNodes[0].getAttribute("href"), "../Test/markdown.html");
        TKAssertEquals(elements[0].childNodes[3].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[3].childNodes[0].childNodes[0].data, "markdown");

        str = "`This` is a test of `markdown`(Test.markdown) links in code";
        markdown = Markdown.initWithString(str);
        markdown.delegate = delegate;
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 4);
        TKAssertEquals(elements[0].childNodes[0].tagName, "code");
        TKAssertEquals(elements[0].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].childNodes[0].data, "This");
        TKAssertEquals(elements[0].childNodes[1].data, " is a test of ");
        TKAssertEquals(elements[0].childNodes[2].tagName, "code");
        TKAssertEquals(elements[0].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].tagName, "a");
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].getAttribute("href"), "../Test/markdown.html");
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].childNodes[0].data, "markdown");
        TKAssertEquals(elements[0].childNodes[3].data, " links in code");
    },

    testLinks: function(){
        var str = "This is a test of [markdown](https://daringfireball.net/projects/markdown/syntax) links";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 3);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of ");
        TKAssertEquals(elements[0].childNodes[1].tagName, "a");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].data, "markdown");
        TKAssertEquals(elements[0].childNodes[1].getAttribute("href"), "https://daringfireball.net/projects/markdown/syntax");
        TKAssertEquals(elements[0].childNodes[2].data, " links");
    },

    testImages: function(){
        var str = "This is a test of ![markdown](https://daringfireball.net/projects/markdown/syntax) images";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 3);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of ");
        TKAssertEquals(elements[0].childNodes[1].tagName, "img");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 0);
        TKAssertEquals(elements[0].childNodes[1].getAttribute("alt"), "markdown");
        TKAssertEquals(elements[0].childNodes[1].getAttribute("src"), "https://daringfireball.net/projects/markdown/syntax");
        TKAssertEquals(elements[0].childNodes[2].data, " images");  
    },

    testBlockquote: function(){
        var str = "This is a test of our\nmarkdown parser's ability to\nparse & read paragraphs.\n\n> This example should\n> include three...\n\n...paragraphs";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read paragraphs.");
        TKAssertEquals(elements[1].tagName, "blockquote");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This example should include three...");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...paragraphs");

        // > only on first line
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read paragraphs.\n\n> This example should\ninclude three...\n\n...paragraphs";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read paragraphs.");
        TKAssertEquals(elements[1].tagName, "blockquote");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This example should include three...");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...paragraphs");

        // > only on first line, other lines indented
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read paragraphs.\n\n> This example should\n  include three...\n\n...paragraphs";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read paragraphs.");
        TKAssertEquals(elements[1].tagName, "blockquote");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This example should include three...");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...paragraphs");

        // first block
        str = "> This example should\n  include three...\n\n...paragraphs";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "blockquote");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This example should include three...");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "...paragraphs");

        // final block
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read paragraphs.\n\n> This example should\n  include three...";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read paragraphs.");
        TKAssertEquals(elements[1].tagName, "blockquote");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This example should include three...");

        // only block
        str = "> This example should\n  include three...";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 1);
        TKAssertEquals(elements[0].tagName, "blockquote");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This example should include three...");

        // single line breaks
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read paragraphs.\n> This example should\n> include three...\n\n...paragraphs";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read paragraphs.");
        TKAssertEquals(elements[1].tagName, "blockquote");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "This example should include three...");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...paragraphs");
    },

    testUnorderedList: function(){
        var str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n* First item\n* Second item\n* Third item\n\n...done";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ul");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");

        // one leading space
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n * First item\n * Second item\n * Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ul");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");

        // two leading spaces
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n  * First item\n  * Second item\n  * Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ul");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");

        // first block
        str = "* First item\n* Second item\n* Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "ul");
        TKAssertEquals(elements[0].childNodes.length, 3);
        TKAssertEquals(elements[0].childNodes[0].tagName, "li");
        TKAssertEquals(elements[0].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[0].childNodes[1].tagName, "li");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[0].childNodes[2].tagName, "li");
        TKAssertEquals(elements[0].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "...done");

        // final block
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n* First item\n* Second item\n* Third item";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ul");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");

        // single line breaks
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n* First item\n* Second item\n* Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ul");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");
    },

    testOrderedList: function(){
        var str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n1. First item\n2. Second item\n3. Third item\n\n...done";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ol");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");

        // one leading space (all same number)
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n 1. First item\n 1. Second item\n 1. Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ol");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");

        // two leading spaces (arbitrary number)
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n  100. First item\n  100. Second item\n  100. Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ol");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");

        // first block (all same number)
        str = "1. First item\n1. Second item\n1. Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "ol");
        TKAssertEquals(elements[0].childNodes.length, 3);
        TKAssertEquals(elements[0].childNodes[0].tagName, "li");
        TKAssertEquals(elements[0].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[0].childNodes[1].tagName, "li");
        TKAssertEquals(elements[0].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[0].childNodes[2].tagName, "li");
        TKAssertEquals(elements[0].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[1].tagName, "p");
        TKAssertEquals(elements[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].data, "...done");

        // final block (decreasing numbers)
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n\n100. First item\n2. Second item\n1. Third item";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 2);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ol");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");

        // single line breaks
        str = "This is a test of our\nmarkdown parser's ability to\nparse & read lists.\n1. First item\n2. Second item\n3. Third item\n\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of our markdown parser's ability to parse & read lists.");
        TKAssertEquals(elements[1].tagName, "ol");
        TKAssertEquals(elements[1].childNodes.length, 3);
        TKAssertEquals(elements[1].childNodes[0].tagName, "li");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[0].childNodes[0].data, "First item");
        TKAssertEquals(elements[1].childNodes[1].tagName, "li");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[1].childNodes[0].data, "Second item");
        TKAssertEquals(elements[1].childNodes[2].tagName, "li");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertEquals(elements[1].childNodes[2].childNodes[0].data, "Third item");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");
    },

    testCodeBlock: function(){
        var str = "This is a test of\ncode blocks\n\n````\nclass Test extendsJSObject(){\n\n  init(){\n  }\n\n}\n````\n\n...done";
        var markdown = Markdown.initWithString(str);
        var document = DOM.createDocument();
        var elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of code blocks");
        TKAssertEquals(elements[1].tagName, "div");
        TKAssertEquals(elements[1].getAttribute("class"), "code");
        TKAssertEquals(elements[1].childNodes.length, 6);
        TKAssertEquals(elements[1].childNodes[0].tagName, "div");
        TKAssertEquals(elements[1].childNodes[0].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[0].childNodes[0].data, "class Test extendsJSObject(){");
        TKAssertEquals(elements[1].childNodes[1].tagName, "div");
        TKAssertEquals(elements[1].childNodes[1].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[1].childNodes[0].data, "\n");
        TKAssertEquals(elements[1].childNodes[2].tagName, "div");
        TKAssertEquals(elements[1].childNodes[2].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[2].childNodes[0].data, "  init(){");
        TKAssertEquals(elements[1].childNodes[3].tagName, "div");
        TKAssertEquals(elements[1].childNodes[3].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[3].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[3].childNodes[0].data, "  }");
        TKAssertEquals(elements[1].childNodes[4].tagName, "div");
        TKAssertEquals(elements[1].childNodes[4].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[4].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[4].childNodes[0].data, "\n");
        TKAssertEquals(elements[1].childNodes[5].tagName, "div");
        TKAssertEquals(elements[1].childNodes[5].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[5].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[5].childNodes[0].data, "}");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");

        // single line breaks
        str = "This is a test of\ncode blocks\n````\nclass Test extendsJSObject(){\n\n  init(){\n  }\n\n}\n````\n...done";
        markdown = Markdown.initWithString(str);
        document = DOM.createDocument();
        elements = markdown.htmlElementsForDocument(document);
        TKAssertEquals(elements.length, 3);
        TKAssertEquals(elements[0].tagName, "p");
        TKAssertEquals(elements[0].childNodes.length, 1);
        TKAssertEquals(elements[0].childNodes[0].data, "This is a test of code blocks");
        TKAssertEquals(elements[1].tagName, "div");
        TKAssertEquals(elements[1].getAttribute("class"), "code");
        TKAssertEquals(elements[1].childNodes.length, 6);
        TKAssertEquals(elements[1].childNodes[0].tagName, "div");
        TKAssertEquals(elements[1].childNodes[0].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[0].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[0].childNodes[0].data, "class Test extendsJSObject(){");
        TKAssertEquals(elements[1].childNodes[1].tagName, "div");
        TKAssertEquals(elements[1].childNodes[1].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[1].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[1].childNodes[0].data, "\n");
        TKAssertEquals(elements[1].childNodes[2].tagName, "div");
        TKAssertEquals(elements[1].childNodes[2].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[2].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[2].childNodes[0].data, "  init(){");
        TKAssertEquals(elements[1].childNodes[3].tagName, "div");
        TKAssertEquals(elements[1].childNodes[3].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[3].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[3].childNodes[0].data, "  }");
        TKAssertEquals(elements[1].childNodes[4].tagName, "div");
        TKAssertEquals(elements[1].childNodes[4].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[4].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[4].childNodes[0].data, "\n");
        TKAssertEquals(elements[1].childNodes[5].tagName, "div");
        TKAssertEquals(elements[1].childNodes[5].getAttribute("class"), "line");
        TKAssertEquals(elements[1].childNodes[5].childNodes.length, 1);
        TKAssertExactEquals(elements[1].childNodes[5].childNodes[0].data, "}");
        TKAssertEquals(elements[2].tagName, "p");
        TKAssertEquals(elements[2].childNodes.length, 1);
        TKAssertEquals(elements[2].childNodes[0].data, "...done");
    }

});