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

// #import UIKit
// #import TestKit
'use strict';

JSClass("UITokenFieldTests", TKTestSuite, {

    testNoDelegate: function(){
        var field = UITokenField.initWithFrame(JSRect(0, 0, 500, 21));
        field.font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);

        field.becomeFirstResponder();
        field.setSelectionRange(JSRange(0, 0));
        field.insertText("hello");
        TKAssertEquals(field.text, "hello");

        field.insertNewline();
        TKAssertEquals(field.text.length, 1);
        TKAssertEquals(field.text, "\uFFFC");
        TKAssertEquals(field.selections.length, 1);
        TKAssertEquals(field.selections[0].range.location, 1);
        TKAssertEquals(field.selections[0].range.length, 0);
        var attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 0);
        TKAssertNotUndefined(attachment);
        TKAssert(attachment.isKindOfClass(UITextAttachmentView));
        TKAssert(attachment.view.isKindOfClass(UITokenFieldTokenView));
        TKAssertEquals(attachment.view.tokenLabel.text, "hello");

        field.insertText("test");
        TKAssertEquals(field.text, "\uFFFCtest");
        field.insertNewline();
        TKAssertEquals(field.text.length, 2);
        TKAssertEquals(field.text, "\uFFFC\uFFFC");
        TKAssertEquals(field.selections.length, 1);
        TKAssertEquals(field.selections[0].range.location, 2);
        TKAssertEquals(field.selections[0].range.length, 0);
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 0);
        TKAssertEquals(attachment.view.tokenLabel.text, "hello");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.tokenLabel.text, "test");

        field.setSelectionRange(JSRange(0, 0));
        field.insertText("three");
        TKAssertEquals(field.text, "three\uFFFC\uFFFC");
        field.insertNewline();
        TKAssertEquals(field.text.length, 3);
        TKAssertEquals(field.text, "\uFFFC\uFFFC\uFFFC");
        TKAssertEquals(field.selections.length, 1);
        TKAssertEquals(field.selections[0].range.location, 1);
        TKAssertEquals(field.selections[0].range.length, 0);
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 0);
        TKAssertEquals(attachment.view.tokenLabel.text, "three");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.tokenLabel.text, "hello");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 2);
        TKAssertEquals(attachment.view.tokenLabel.text, "test");

        field.setSelectionRange(JSRange(1, 1));
        field.insertText("four");
        TKAssertEquals(field.text, "\uFFFCfour\uFFFC");
        field.insertNewline();
        TKAssertEquals(field.text.length, 3);
        TKAssertEquals(field.text, "\uFFFC\uFFFC\uFFFC");
        TKAssertEquals(field.selections.length, 1);
        TKAssertEquals(field.selections[0].range.location, 2);
        TKAssertEquals(field.selections[0].range.length, 0);
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 0);
        TKAssertEquals(attachment.view.tokenLabel.text, "three");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.tokenLabel.text, "four");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 2);
        TKAssertEquals(attachment.view.tokenLabel.text, "test");

        field.deleteBackward();
        TKAssertEquals(field.text.length, 2);
        TKAssertEquals(field.text, "\uFFFC\uFFFC");
        TKAssertEquals(field.selections.length, 1);
        TKAssertEquals(field.selections[0].range.location, 1);
        TKAssertEquals(field.selections[0].range.length, 0);
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 0);
        TKAssertEquals(attachment.view.tokenLabel.text, "three");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.tokenLabel.text, "test");
    }

});