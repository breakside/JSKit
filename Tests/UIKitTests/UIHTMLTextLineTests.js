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

// #import Foundation
// #import TestKit
'use strict';

JSClass("UIHTMLTextLineTests", TKTestSuite, {

    requiredEnvironment: "html",

    testTruncatedLine: function(){

        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var attributedString = JSAttributedString.initWithString('01234567891 This is a test of a text line', attributes);
        attributedString.addAttributeInRange("underline", true, JSRange(26, 15));
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(12, 29));

        // no need to truncate
        var truncated = line.truncatedLine(670);
        TKAssertEquals(truncated.size.width, 660);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 29);
        TKAssertEquals(truncated.runs.length, 2);
        TKAssertEquals(truncated.runs[0].textNode.nodeValue, "This is a test");
        TKAssertEquals(truncated.runs[1].textNode.nodeValue, " of a text line");
        TKAssertExactEquals(truncated.element.childNodes.length, 2);
        TKAssertExactEquals(truncated.element.childNodes[0], truncated.runs[0].element);
        TKAssertExactEquals(truncated.element.childNodes[1], truncated.runs[1].element);

        // need to pop a character
        truncated = line.truncatedLine(659);
        TKAssertNotExactEquals(truncated, line);
        TKAssertEquals(truncated.size.width, 650);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 28);
        TKAssertEquals(truncated.runs.length, 3);
        TKAssertEquals(truncated.runs[0].textNode.nodeValue, "This is a test");
        TKAssertEquals(truncated.runs[1].textNode.nodeValue, " of a text lin");
        TKAssertEquals(truncated.runs[2].textNode.nodeValue, "\u2026");
        TKAssertExactEquals(truncated.element.childNodes.length, 3);
        TKAssertExactEquals(truncated.element.childNodes[0], truncated.runs[0].element);
        TKAssertExactEquals(truncated.element.childNodes[1], truncated.runs[1].element);
        TKAssertExactEquals(truncated.element.childNodes[2], truncated.runs[2].element);

        // need to pop entire second run
        truncated = line.truncatedLine(330);
        TKAssertNotExactEquals(truncated, line);
        TKAssertEquals(truncated.size.width, 330);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 14);
        TKAssertEquals(truncated.runs.length, 2);
        TKAssertEquals(truncated.runs[0].textNode.nodeValue, "This is a test");
        TKAssertEquals(truncated.runs[1].textNode.nodeValue, "\u2026");
        TKAssertExactEquals(truncated.element.childNodes.length, 2);
        TKAssertExactEquals(truncated.element.childNodes[0], truncated.runs[0].element);
        TKAssertExactEquals(truncated.element.childNodes[1], truncated.runs[1].element);

        // need to pop into first run
        truncated = line.truncatedLine(320);
        TKAssertNotExactEquals(truncated, line);
        TKAssertEquals(truncated.size.width, 310);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 13);
        TKAssertEquals(truncated.runs.length, 2);
        TKAssertEquals(truncated.runs[0].textNode.nodeValue, "This is a tes");
        TKAssertEquals(truncated.runs[1].textNode.nodeValue, "\u2026");
        TKAssertExactEquals(truncated.element.childNodes.length, 2);
        TKAssertExactEquals(truncated.element.childNodes[0], truncated.runs[0].element);
        TKAssertExactEquals(truncated.element.childNodes[1], truncated.runs[1].element);

        // room for only ellipsis
        truncated = line.truncatedLine(15);
        TKAssertNotExactEquals(truncated, line);
        TKAssertEquals(truncated.size.width, 10);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 0);
        TKAssertEquals(truncated.runs.length, 1);
        TKAssertEquals(truncated.runs[0].textNode.nodeValue, "\u2026");
        TKAssertExactEquals(truncated.element.childNodes.length, 1);
        TKAssertExactEquals(truncated.element.childNodes[0], truncated.runs[0].element);

        // no room for even ellipsis
        truncated = line.truncatedLine(5);
        TKAssertNotExactEquals(truncated, line);
        TKAssertEquals(truncated.size.width, 0);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 0);
        TKAssertEquals(truncated.runs.length, 0);
        TKAssertExactEquals(truncated.element.childNodes.length, 0);
    }

});