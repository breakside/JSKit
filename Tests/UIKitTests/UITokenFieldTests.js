// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, UITokenField, JSRect, JSRange, JSAttributedString, UITextAttachmentView, UITokenFieldTokenView, JSFont, JSFontDescriptor, UITokenFieldTestsFont */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("UITokenFieldTests", TKTestSuite, {

    testNoDelegate: function(){
        var field = UITokenField.initWithFrame(JSRect(0, 0, 500, 21));
        field.font = UITokenFieldTestsFont.init();

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
        TKAssertEquals(attachment.view.labelView.text, "hello");

        field.insertText("test");
        TKAssertEquals(field.text, "\uFFFCtest");
        field.insertNewline();
        TKAssertEquals(field.text.length, 2);
        TKAssertEquals(field.text, "\uFFFC\uFFFC");
        TKAssertEquals(field.selections.length, 1);
        TKAssertEquals(field.selections[0].range.location, 2);
        TKAssertEquals(field.selections[0].range.length, 0);
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 0);
        TKAssertEquals(attachment.view.labelView.text, "hello");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.labelView.text, "test");

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
        TKAssertEquals(attachment.view.labelView.text, "three");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.labelView.text, "hello");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 2);
        TKAssertEquals(attachment.view.labelView.text, "test");

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
        TKAssertEquals(attachment.view.labelView.text, "three");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.labelView.text, "four");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 2);
        TKAssertEquals(attachment.view.labelView.text, "test");

        field.deleteBackward();
        TKAssertEquals(field.text.length, 2);
        TKAssertEquals(field.text, "\uFFFC\uFFFC");
        TKAssertEquals(field.selections.length, 1);
        TKAssertEquals(field.selections[0].range.location, 1);
        TKAssertEquals(field.selections[0].range.length, 0);
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 0);
        TKAssertEquals(attachment.view.labelView.text, "three");
        attachment = field.attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, 1);
        TKAssertEquals(attachment.view.labelView.text, "test");
    }

});

JSClass("UITokenFieldTestsFont", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("UITokenFieldTestsFont", JSFont.Weight.regular, JSFont.Style.normal);
        this._fullName = "UITokenFieldTestsFont";
        this._postScriptName = "UITokenFieldTestsFont";
        this._faceName = "UITokenFieldTestsFont";
        this._unitsPerEM = 2048;
        this._ascenderInUnits = 1900;
        this._descenderInUnits = -500;
        this._pointSize = 14.0;
        this._calculateMetrics();
    },

    glyphForCharacter: function(character){
        if (character.code == 0x2026){ // ellipsis
            return 1;
        }
        if (character.code == 0x200B){ // zero-width space
            return 4;
        }
        if (character.code >= 0x61){  // lowercase, {, }, |, ~
            return 2;
        }
        return 3; // uppercase, digits, most punctuation

    },

    widthOfGlyph: function(glyph){
        if (glyph === 0){
            return 30;
        }
        if (glyph == 1){
            return 10;
        }
        if (glyph == 2){
            return 20;
        }
        if (glyph == 3){
            return 30;
        }
        if (glyph == 4){
            return 0;
        }
    }
});