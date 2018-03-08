// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
// #import "MockWindowServer.js"
/* global JSClass, TKTestSuite, UITextEditor, UITextEditorTestsFont, MockWindowServer, UITextLayer, JSRange, JSRect, JSFont, JSFontDescriptor, JSLineBreakMode */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

(function(){

JSClass("UITextEditorTests", TKTestSuite, {

    windowServer: null,
    textLayer: null,

    setup: function(){
        this.windowServer = MockWindowServer.init();
        this.textLayer = UITextLayer.init();
        this.windowServer.displayServer.layerInserted(this.textLayer);
        this.windowServer.displayServer.updateDisplay();
    },

    tearDown: function(){
        this.textLayer = null;
        this.windowServer = null;
    },

    testInit: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
    },

    testSetSelectionRange: function(){
        this.textLayer.text = "Hello, world!";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(1, 0));
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(3, 4));
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 3);
        TKAssertEquals(editor.selections[0].range.length, 4);

        // null/undefined (should default to 0,0)
        editor.setSelectionRange(null);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // outside of string range
        editor.setSelectionRange(JSRange(-1, 0));
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(-1, 2));
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 1);
        editor.setSelectionRange(JSRange(0, 100));
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 13);
        editor.setSelectionRange(JSRange(100, 1));
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 13);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // TODO: test layout updates?  Maybe leave exact layout for other test functions,
        //       but check here that layout is requested?
    },

    testSetSelectionRanges: function(){
        this.textLayer.text = "Hello, world!";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRanges([JSRange(1, 0), JSRange(5, 0)]);
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 5);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // out-of-order ranges
        editor.setSelectionRanges([JSRange(5, 0), JSRange(1, 0)]);
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 5);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // empty/null/undefined
        editor.setSelectionRanges([]);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRanges(null);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRanges();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // overlapping
        editor.setSelectionRanges([JSRange(0, 4), JSRange(3, 2)]);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 5);
        editor.setSelectionRanges([JSRange(0, 4), JSRange(3, 2), JSRange(5, 0)]);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 5);
        editor.setSelectionRanges([JSRange(0, 4), JSRange(3, 2), JSRange(5, 1)]);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 6);
        editor.setSelectionRanges([JSRange(0, 4), JSRange(3, 0), JSRange(5, 1)]);
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[1].range.location, 5);
        TKAssertEquals(editor.selections[1].range.length, 1);
        editor.setSelectionRanges([JSRange(0, 4), JSRange(4, 0), JSRange(5, 1)]);
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[1].range.location, 5);
        TKAssertEquals(editor.selections[1].range.length, 1);

        // outside of string range
        editor.setSelectionRanges([JSRange(-1, 4), JSRange(4, 0), JSRange(10, 10), JSRange(20, 0)]);
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[1].range.location, 4);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 10);
        TKAssertEquals(editor.selections[2].range.length, 3);
    },

    testHasSelectionRange: function(){
        this.textLayer.text = "Hello, world!";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(0, 0));
        TKAssertEquals(editor.hasSelectionRange(), false);
        editor.setSelectionRange(JSRange(0, 1));
        TKAssertEquals(editor.hasSelectionRange(), true);
        editor.setSelectionRanges([JSRange(0, 0), JSRange(5, 0)]);
        TKAssertEquals(editor.hasSelectionRange(), false);
        editor.setSelectionRanges([JSRange(0, 0), JSRange(5, 1)]);
        TKAssertEquals(editor.hasSelectionRange(), true);
        editor.setSelectionRanges([JSRange(0, 1), JSRange(5, 1)]);
        TKAssertEquals(editor.hasSelectionRange(), true);
    },

    testInsertText: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        TKAssertEquals(this.textLayer.attributedText.string.length, 0);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.insertText("hello");
        TKAssertEquals(this.textLayer.attributedText.string.length, 5);
        TKAssertEquals(this.textLayer.attributedText.string, "hello");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.insertText(" world!");
        TKAssertEquals(this.textLayer.attributedText.string.length, 12);
        TKAssertEquals(this.textLayer.attributedText.string, "hello world!");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 12);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // insert at another point
        editor.setSelectionRange(JSRange(5, 0));
        editor.insertText(",");
        TKAssertEquals(this.textLayer.attributedText.string.length, 13);
        TKAssertEquals(this.textLayer.attributedText.string, "hello, world!");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 6);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // insert over a selection range
        editor.setSelectionRange(JSRange(0, 1));
        editor.insertText("H");
        TKAssertEquals(this.textLayer.attributedText.string.length, 13);
        TKAssertEquals(this.textLayer.attributedText.string, "Hello, world!");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // insert with multiple selections (some with range, some without)
        editor.setSelectionRanges([JSRange(0, 0), JSRange(5, 1), JSRange(7, 0), JSRange(12, 1)]);
        editor.insertText("*");
        TKAssertEquals(this.textLayer.attributedText.string.length, 15);
        TKAssertEquals(this.textLayer.attributedText.string, "*Hello* *world*");
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 7);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 9);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 15);
        TKAssertEquals(editor.selections[3].range.length, 0);

        // affinity
        this.textLayer.text = "Hello, world!";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.insertText(";");
        TKAssertEquals(editor.selections[0].range.location, 6);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteSelections: function(){
        // delete with no selection range (not a range, shouldn't change anything)
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.insertText("testing");
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(4, 0));
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete at start of doc
        editor.setSelectionRange(JSRange(0, 0));
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete with selection range
        editor.setSelectionRange(JSRange(1, 2));
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 5);
        TKAssertEquals(this.textLayer.attributedText.string, "tting");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(4, 1));
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 4);
        TKAssertEquals(this.textLayer.attributedText.string, "ttin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(0, 1));
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 3);
        TKAssertEquals(this.textLayer.attributedText.string, "tin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(0, 3));
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 0);
        TKAssertEquals(this.textLayer.attributedText.string, "");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete with mutliple selections (some with range, some without)
        this.textLayer.text = "testing 123";
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(3, 0), JSRange(5, 3), JSRange(9, 1), JSRange(11, 0)]);
        editor.deleteSelections();
        TKAssertEquals(this.textLayer.attributedText.string.length, 6);
        TKAssertEquals(this.textLayer.attributedText.string, "tsti13");
        TKAssertEquals(editor.selections.length, 6);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 1);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 2);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 4);
        TKAssertEquals(editor.selections[3].range.length, 0);
        TKAssertEquals(editor.selections[4].range.location, 5);
        TKAssertEquals(editor.selections[4].range.length, 0);
        TKAssertEquals(editor.selections[5].range.location, 6);
        TKAssertEquals(editor.selections[5].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 1), UITextEditor.SelectionInsertionPoint.end, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteSelections();
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteBackward: function(){
        // delete with no selection range
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.insertText("testing");
        TKAssertEquals(this.textLayer.attributedText.string.length, 7);
        TKAssertEquals(this.textLayer.attributedText.string, "testing");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 6);
        TKAssertEquals(this.textLayer.attributedText.string, "testin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 6);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 5);
        TKAssertEquals(this.textLayer.attributedText.string, "testi");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(4, 0));
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 4);
        TKAssertEquals(this.textLayer.attributedText.string, "tesi");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 3);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 3);
        TKAssertEquals(this.textLayer.attributedText.string, "tei");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 2);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete at start of doc
        editor.setSelectionRange(JSRange(0, 0));
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 3);
        TKAssertEquals(this.textLayer.attributedText.string, "tei");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 3);
        TKAssertEquals(this.textLayer.attributedText.string, "tei");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete with selection range
        this.textLayer.text = "testing";
        editor.setSelectionRange(JSRange(1, 2));
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 5);
        TKAssertEquals(this.textLayer.attributedText.string, "tting");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(4, 1));
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 4);
        TKAssertEquals(this.textLayer.attributedText.string, "ttin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(0, 1));
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 3);
        TKAssertEquals(this.textLayer.attributedText.string, "tin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(0, 3));
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 0);
        TKAssertEquals(this.textLayer.attributedText.string, "");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete with mutliple selections
        // if any selection ranges exist, they should be cleared
        this.textLayer.text = "testing 123";
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(3, 0), JSRange(5, 3), JSRange(9, 1), JSRange(11, 0)]);
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 6);
        TKAssertEquals(this.textLayer.attributedText.string, "tsti13");
        TKAssertEquals(editor.selections.length, 6);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 1);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 2);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 4);
        TKAssertEquals(editor.selections[3].range.length, 0);
        TKAssertEquals(editor.selections[4].range.location, 5);
        TKAssertEquals(editor.selections[4].range.length, 0);
        TKAssertEquals(editor.selections[5].range.location, 6);
        TKAssertEquals(editor.selections[5].range.length, 0);
        // if no selection ranges exist, delete backward
        editor.deleteBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 1);
        TKAssertEquals(this.textLayer.attributedText.string, "t");
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 1);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteBackward();
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteWordBackward: function(){
        // single selection, no range
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.insertText("This is a test of word deletion");
        editor.setSelectionRange(JSRange(22, 0));
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 27);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of  deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 18);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 24);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test  deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 15);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of document
        editor.setSelectionRange(JSRange(0, 0));
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 24);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test  deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // empty document
        this.textLayer.text = "";
        editor.setSelectionRange(JSRange(0, 0));
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 0);
        TKAssertEquals(this.textLayer.attributedText.string, "");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // single selection with range
        editor.insertText("This is a test of word deletion");
        editor.setSelectionRange(JSRange(22, 2));
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 29);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of wordeletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 25);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of eletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 18);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        // if any selection have a range, just those should be cleared
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(10, 0), JSRange(14, 0)]);
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 24);
        TKAssertEquals(this.textLayer.attributedText.string, "Tis is a test of eletion");
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 1);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 9);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 13);
        TKAssertEquals(editor.selections[3].range.length, 0);
        // if no selection has a range, delete word backward
        editor.deleteWordBackward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 17);
        TKAssertEquals(this.textLayer.attributedText.string, "is is  of eletion");
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 6);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(9, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteWordBackward();
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteToBeginningOfDocument: function(){
        // single selection, no range
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.insertText("This is a test of document deletion");
        editor.setSelectionRange(JSRange(22, 0));
        editor.deleteToBeginningOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 13);
        TKAssertEquals(this.textLayer.attributedText.string, "ment deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of document
        editor.deleteToBeginningOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 13);
        TKAssertEquals(this.textLayer.attributedText.string, "ment deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection with range
        this.textLayer.text = "This is a test of document deletion";
        editor.setSelectionRange(JSRange(22, 4));
        editor.deleteToBeginningOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 31);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of docu deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // mutliple selection, no range
        this.textLayer.text = "This is a test of document deletion";
        editor.setSelectionRanges([JSRange(22, 0), JSRange(5, 0)]);
        editor.deleteToBeginningOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 13);
        TKAssertEquals(this.textLayer.attributedText.string, "ment deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection, ranges
        this.textLayer.text = "This is a test of document deletion";
        editor.setSelectionRanges([JSRange(22, 0), JSRange(5, 3), JSRange(27, 4)]);
        editor.deleteToBeginningOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 28);
        TKAssertEquals(this.textLayer.attributedText.string, "This a test of document tion");
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 19);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 24);
        TKAssertEquals(editor.selections[2].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteToBeginningOfDocument();
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteForward: function(){
        // delete with no selection range
        this.textLayer.text = "testing";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 6);
        TKAssertEquals(this.textLayer.attributedText.string, "esting");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 5);
        TKAssertEquals(this.textLayer.attributedText.string, "sting");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(4, 0));
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 4);
        TKAssertEquals(this.textLayer.attributedText.string, "stin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete at end of doc
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 4);
        TKAssertEquals(this.textLayer.attributedText.string, "stin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 4);
        TKAssertEquals(this.textLayer.attributedText.string, "stin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete with selection range
        this.textLayer.text = "testing";
        editor.setSelectionRange(JSRange(1, 2));
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 5);
        TKAssertEquals(this.textLayer.attributedText.string, "tting");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(4, 1));
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 4);
        TKAssertEquals(this.textLayer.attributedText.string, "ttin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(0, 1));
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 3);
        TKAssertEquals(this.textLayer.attributedText.string, "tin");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(0, 3));
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 0);
        TKAssertEquals(this.textLayer.attributedText.string, "");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // delete with mutliple selections
        // if any selections have a range, just clear those
        this.textLayer.text = "testing 123";
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(3, 0), JSRange(5, 3), JSRange(9, 1), JSRange(11, 0)]);
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 6);
        TKAssertEquals(this.textLayer.attributedText.string, "tsti13");
        TKAssertEquals(editor.selections.length, 6);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 1);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 2);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 4);
        TKAssertEquals(editor.selections[3].range.length, 0);
        TKAssertEquals(editor.selections[4].range.location, 5);
        TKAssertEquals(editor.selections[4].range.length, 0);
        TKAssertEquals(editor.selections[5].range.location, 6);
        TKAssertEquals(editor.selections[5].range.length, 0);
        // if not selections have a range, delete forward
        editor.deleteForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 1);
        TKAssertEquals(this.textLayer.attributedText.string, "i");
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 1);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteForward();
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);

    },

    testDeleteWordForward: function(){
        // single selection, no range
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.insertText("This is a test of word deletion");
        editor.setSelectionRange(JSRange(14, 0));
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 28);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test word deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 14);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 23);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 14);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of document
        editor.setSelectionRange(JSRange(23, 0));
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 23);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 23);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // empty document
        this.textLayer.text = "";
        editor.setSelectionRange(JSRange(0, 0));
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 0);
        TKAssertEquals(this.textLayer.attributedText.string, "");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // single selection with range
        editor.insertText("This is a test of word deletion");
        editor.setSelectionRange(JSRange(19, 2));
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 29);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of wd deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 28);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of w deletion");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        // if any selection have a range, just clear those selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(20, 0), JSRange(24, 1)]);
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 26);
        TKAssertEquals(this.textLayer.attributedText.string, "Tis is a test of w deleion");
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 1);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 19);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 23);
        TKAssertEquals(editor.selections[3].range.length, 0);
        // If no selection has a range, delete word forward
        editor.deleteWordForward();
        TKAssertEquals(this.textLayer.attributedText.string.length, 16);
        TKAssertEquals(this.textLayer.attributedText.string, " is a test of w ");
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 16);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteWordForward();
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteToEndOfDocument: function(){
        // single selection, no range
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.insertText("This is a test of document deletion");
        editor.setSelectionRange(JSRange(22, 0));
        editor.deleteToEndOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 22);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of docu");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of document
        editor.deleteToEndOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 22);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of docu");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // mutliple selection, no range
        this.textLayer.text = "This is a test of document deletion";
        editor.setSelectionRanges([JSRange(22, 0), JSRange(5, 0)]);
        editor.deleteToEndOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 5);
        TKAssertEquals(this.textLayer.attributedText.string, "This ");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection, ranges
        this.textLayer.text = "This is a test of document deletion";
        editor.setSelectionRanges([JSRange(22, 0), JSRange(5, 3), JSRange(27, 4)]);
        editor.deleteToEndOfDocument();
        TKAssertEquals(this.textLayer.attributedText.string.length, 28);
        TKAssertEquals(this.textLayer.attributedText.string, "This a test of document tion");
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 19);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 24);
        TKAssertEquals(editor.selections[2].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteToEndOfDocument();
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveBackward: function(){
        // single selection
        this.textLayer.text = "Hello, world!";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(5, 0));
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 3);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 2);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // beginning of document
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection with range
        editor.setSelectionRange(JSRange(5, 3));
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(2, 1), JSRange(7, 0)]);
        editor.moveBackward();
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 2);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 6);
        TKAssertEquals(editor.selections[2].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveBackward();
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveWordBackward: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor by word";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 18);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 15);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordBackward();
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // beginning of document
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection with range (range shouldn't matter)
        editor.setSelectionRange(JSRange(19, 3));
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 18);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 15);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(19, 1), JSRange(21, 0)]);
        editor.moveWordBackward();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 18);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(9, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveWordBackward();
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveToBeginningOfDocument: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveToBeginningOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // beginning of document
        editor.moveToBeginningOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveToBeginningOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection with range (range shouldn't matter)
        editor.setSelectionRange(JSRange(19, 3));
        editor.moveToBeginningOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveToBeginningOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(19, 1), JSRange(21, 0)]);
        editor.moveToBeginningOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveToBeginningOfDocument();
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveForward: function(){
        // single selection
        this.textLayer.text = "Hello, world!";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(5, 0));
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 6);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 9);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveForward();
        editor.moveForward();
        editor.moveForward();
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 13);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // beginning of document
        editor.setSelectionRange(JSRange(13, 0));
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 13);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 13);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection with range
        editor.setSelectionRange(JSRange(5, 3));
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 9);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(12, 0), JSRange(13, 0)]);
        editor.moveForward();
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 2);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 13);
        TKAssertEquals(editor.selections[2].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveForward();
        TKAssertEquals(editor.selections[0].range.location, 6);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveWordForward: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor by word";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 24);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 28);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 38);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 43);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of document
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 43);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 43);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection with range (range shouldn't matter)
        editor.setSelectionRange(JSRange(19, 3));
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 24);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 28);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(41, 1), JSRange(40, 0)]);
        editor.moveWordForward();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 43);
        TKAssertEquals(editor.selections[1].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveWordForward();
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveToEndOfDocument: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveToEndOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of document
        editor.moveToEndOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveToEndOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection with range (range shouldn't matter)
        editor.setSelectionRange(JSRange(19, 3));
        editor.moveToEndOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.moveToEndOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(19, 1), JSRange(21, 0)]);
        editor.moveToEndOfDocument();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveToEndOfDocument();
        TKAssertEquals(editor.selections[0].range.location, 11);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveBackwardAndModifySelection: function(){
        // single selection
        this.textLayer.text = "Hello, world!";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(5, 0));
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 4);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 3);
        TKAssertEquals(editor.selections[0].range.length, 2);
        TKAssertEquals(editor.selections[0].insertionLocation, 3);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 2);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[0].insertionLocation, 2);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 1);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 1);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // beginning of document
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // existing range with end insertion point
        editor.setSelectionRange(JSRange(5, 3), UITextEditor.SelectionInsertionPoint.end);
        TKAssertEquals(editor.selections[0].insertionLocation, 8);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 4);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(2, 1), JSRange(7, 0)]);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        TKAssertEquals(editor.selections[1].range.location, 6);
        TKAssertEquals(editor.selections[1].range.length, 1);
        TKAssertEquals(editor.selections[1].insertionLocation, 6);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveWordBackwardAndModifySelection: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor by word";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 18);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 18);
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 15);
        TKAssertEquals(editor.selections[0].range.length, 7);
        TKAssertEquals(editor.selections[0].insertionLocation, 15);
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 12);
        TKAssertEquals(editor.selections[0].insertionLocation, 10);
        editor.moveWordBackwardAndModifySelection();
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 17);
        TKAssertEquals(editor.selections[0].insertionLocation, 5);
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // beginning of document
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // existing range with end insertion point
        editor.setSelectionRange(JSRange(22, 2), UITextEditor.SelectionInsertionPoint.end);
        TKAssertEquals(editor.selections[0].insertionLocation, 24);
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 18);
        TKAssertEquals(editor.selections[0].range.length, 6);
        TKAssertEquals(editor.selections[0].insertionLocation, 18);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(19, 1), JSRange(21, 0)]);
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        TKAssertEquals(editor.selections[1].range.location, 18);
        TKAssertEquals(editor.selections[1].range.length, 3);
        TKAssertEquals(editor.selections[1].insertionLocation, 18);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(9, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveWordBackwardAndModifySelection();
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveToBeginningOfDocumentAndModifySelection: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // beginning of document
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // selection with range and end insertion point
        editor.setSelectionRange(JSRange(19, 3), UITextEditor.SelectionInsertionPoint.end);
        TKAssertEquals(editor.selections[0].insertionLocation, 22);
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(19, 1), JSRange(21, 0)]);
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 21);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveForwardAndModifySelection: function(){
        // single selection
        this.textLayer.text = "Hello, world!";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(8, 0));
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 9);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 2);
        TKAssertEquals(editor.selections[0].insertionLocation, 10);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[0].insertionLocation, 11);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 12);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 13);

        // beginning of document
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 13);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 8);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 13);

        // selection with range and start insertion point
        editor.setSelectionRange(JSRange(5, 3), UITextEditor.SelectionInsertionPoint.start);
        TKAssertEquals(editor.selections[0].insertionLocation, 5);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 9);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(12, 0), JSRange(13, 0)]);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[1].range.location, 12);
        TKAssertEquals(editor.selections[1].range.length, 1);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveForwardAndModifySelection();
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveWordForwardAndModifySelection: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor by word";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 2);
        TKAssertEquals(editor.selections[0].insertionLocation, 24);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 6);
        TKAssertEquals(editor.selections[0].insertionLocation, 28);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 13);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 16);
        TKAssertEquals(editor.selections[0].insertionLocation, 38);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 21);
        TKAssertEquals(editor.selections[0].insertionLocation, 43);

        // end of document
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 21);
        TKAssertEquals(editor.selections[0].insertionLocation, 43);

        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 21);
        TKAssertEquals(editor.selections[0].insertionLocation, 43);


        // selection with range and start insertion point
        editor.setSelectionRange(JSRange(19, 3), UITextEditor.SelectionInsertionPoint.start);
        TKAssertEquals(editor.selections[0].insertionLocation, 19);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 24);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 9);
        TKAssertEquals(editor.selections[0].insertionLocation, 28);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 1), JSRange(41, 1), JSRange(40, 0)]);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 4);
        TKAssertEquals(editor.selections[1].range.location, 40);
        TKAssertEquals(editor.selections[1].range.length, 3);
        TKAssertEquals(editor.selections[1].insertionLocation, 43);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveWordForwardAndModifySelection();
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 2);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveToEndOfDocumentAndModifySelection: function(){
        // single selection
        this.textLayer.text = "This is a test of moving the cursor";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.moveToEndOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 13);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);

        // end of document
        editor.moveToEndOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 13);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);
        editor.moveToEndOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 13);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);

        // selection with range and start insertion point
        editor.setSelectionRange(JSRange(19, 3), UITextEditor.SelectionInsertionPoint.start);
        TKAssertEquals(editor.selections[0].insertionLocation, 19);
        editor.moveToEndOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 16);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);
        editor.moveToEndOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 16);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);

        // multiple selection
        editor.setSelectionRanges([JSRange(10, 0), JSRange(11, 0), JSRange(19, 1), JSRange(21, 0)]);
        editor.moveToEndOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 25);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveToEndOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 6);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testSelectAll: function(){
        // single selection
        this.textLayer.text = "This is a test of select all";
        var editor = UITextEditor.initWithTextLayer(this.textLayer);
        editor.setSelectionRange(JSRange(22, 0));
        editor.selectAll();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 28);

        // already selected
        editor.selectAll();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 28);

        // selection with range (range shouldn't matter)
        editor.setSelectionRange(JSRange(19, 3));
        editor.selectAll();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 28);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(19, 1), JSRange(21, 0)]);
        editor.selectAll();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 28);

        // affinity
        this.textLayer.text = "testing 123";
        editor.setSelectionRange(JSRange(5, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.selectAll();
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 11);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteToBeginningOfLine: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this.textLayer.font = UITextEditorTestsFont.init();
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(10, 0));
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 87);
        TKAssertEquals(this.textLayer.attributedText.string, "test of a multiline text field that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // wrapped line
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(40, 0));
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 87);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline  that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of wrapped line
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 87);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline  that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // hard broken line
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(85, 0));
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 86);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text field that should wrap to three lines.\nto a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 74);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of hard broken line
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 86);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text field that should wrap to three lines.\nto a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 74);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of document
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(0, 0));
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 97);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text field that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // with range
        editor.setSelectionRange(JSRange(40, 10));
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 87);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text fieldld wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // range spanning lines
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(40, 50));
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 47);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text fieldfourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        // first, with ranges that should just clear
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 2), JSRange(41, 0), JSRange(70, 10)]);
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 85);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a te of a multiline text field that should wrap to three linreak to a fourth.");
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 12);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 39);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 68);
        TKAssertEquals(editor.selections[3].range.length, 0);
        // next, without ranges
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 0), JSRange(41, 0), JSRange(70, 0), JSRange(80, 0)]);
        editor.deleteToBeginningOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 59);
        TKAssertEquals(this.textLayer.attributedText.string, "st of a multiline that should wrap to es.\nreak to a fourth.");
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 18);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 38);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 42);
        TKAssertEquals(editor.selections[3].range.length, 0);

        // affinity
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(35, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteToBeginningOfLine();
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testDeleteToEndOfLine: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this.textLayer.font = UITextEditorTestsFont.init();
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(10, 0));
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 77);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a text field that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // wrapped line
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(40, 0));
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 76);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text fieldthree lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of wrapped line (cursor at end, instead of at beginning of next line)
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(61, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 97);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text field that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 61);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // hard broken line
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(65, 0));
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 89);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text field that should wrap to thre\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 65);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of hard broken line, before newline
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(73, 0));
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 97);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text field that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of document
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(97, 0));
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 97);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text field that should wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 97);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // with range
        editor.setSelectionRange(JSRange(40, 10));
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 87);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text fieldld wrap to three lines.\nThen break to a fourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // range spanning lines
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(40, 50));
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 47);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a test of a multiline text fieldfourth.");
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        // first, with ranges that should just clear
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 2), JSRange(41, 0), JSRange(70, 10)]);
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 85);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a te of a multiline text field that should wrap to three linreak to a fourth.");
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 12);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 39);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 68);
        TKAssertEquals(editor.selections[3].range.length, 0);
        // next, without ranges
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 0), JSRange(41, 0), JSRange(70, 0), JSRange(80, 0)]);
        editor.deleteToEndOfLine();
        TKAssertEquals(this.textLayer.attributedText.string.length, 37);
        TKAssertEquals(this.textLayer.attributedText.string, "This is a text field three lin\nThen b");
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 21);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 30);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 37);
        TKAssertEquals(editor.selections[3].range.length, 0);

        // affinity
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(35, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.deleteToEndOfLine();
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveToBeginningOfLine: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this.textLayer.font = UITextEditorTestsFont.init();
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(10, 0));
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // wrapped line
        editor.setSelectionRange(JSRange(40, 0));
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of wrapped line
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // hard broken line
        editor.setSelectionRange(JSRange(85, 0));
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 74);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of hard broken line
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 74);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of document
        editor.setSelectionRange(JSRange(0, 0));
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // with range
        editor.setSelectionRange(JSRange(40, 10));
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // range spanning lines
        editor.setSelectionRange(JSRange(40, 50));
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 2), JSRange(41, 0), JSRange(70, 10)]);
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 30);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 61);
        TKAssertEquals(editor.selections[2].range.length, 0);

        // affinity
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(35, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveToBeginningOfLine();
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveToEndOfLine: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this.textLayer.font = UITextEditorTestsFont.init();
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(10, 0));
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // wrapped line
        editor.setSelectionRange(JSRange(40, 0));
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 61);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // end of wrapped line (cursor at end, instead of at beginning of next line)
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 61);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // hard broken line
        editor.setSelectionRange(JSRange(65, 0));
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // end of hard broken line, before newline
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // TODO: end of hard broken line, after newline 

        // end of document
        editor.setSelectionRange(JSRange(97, 0));
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 97);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // with range
        editor.setSelectionRange(JSRange(40, 10));
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 61);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // range spanning lines
        editor.setSelectionRange(JSRange(40, 50));
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 97);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        // first, with ranges that should just clear
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 2), JSRange(41, 0), JSRange(70, 10)]);
        editor.moveToEndOfLine();
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[1].range.location, 61);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[1].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[2].range.location, 97);
        TKAssertEquals(editor.selections[2].range.length, 0);
    },

    testMoveToBeginningOfLineAndModifySelection: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this.textLayer.font = UITextEditorTestsFont.init();
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(10, 0));
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 10);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // wrapped line
        editor.setSelectionRange(JSRange(40, 0));
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 10);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // start of wrapped line
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 10);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // hard broken line
        editor.setSelectionRange(JSRange(85, 0));
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 74);
        TKAssertEquals(editor.selections[0].range.length, 11);
        TKAssertEquals(editor.selections[0].insertionLocation, 74);

        // start of hard broken line
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 74);
        TKAssertEquals(editor.selections[0].range.length, 11);
        TKAssertEquals(editor.selections[0].insertionLocation, 74);

        // start of document
        editor.setSelectionRange(JSRange(0, 0));
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // with range and end insertion point
        editor.setSelectionRange(JSRange(40, 10), UITextEditor.SelectionInsertionPoint.end);
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 20);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // range spanning lines
        editor.setSelectionRange(JSRange(40, 50));
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 60);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // multiple selections
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 2), JSRange(41, 0), JSRange(70, 10)]);
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 14);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        TKAssertEquals(editor.selections[1].range.location, 30);
        TKAssertEquals(editor.selections[1].range.length, 11);
        TKAssertEquals(editor.selections[1].insertionLocation, 30);
        TKAssertEquals(editor.selections[2].range.location, 61);
        TKAssertEquals(editor.selections[2].range.length, 19);
        TKAssertEquals(editor.selections[2].insertionLocation, 61);

        // affinity
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(35, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveToEndOfLineAndModifySelection: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this.textLayer.font = UITextEditorTestsFont.init();
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(10, 0));
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 20);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // wrapped line
        editor.setSelectionRange(JSRange(40, 0));
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 21);
        TKAssertEquals(editor.selections[0].insertionLocation, 61);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // end of wrapped line (cursor at end, instead of at beginning of next line)
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 21);
        TKAssertEquals(editor.selections[0].insertionLocation, 61);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // hard broken line
        editor.setSelectionRange(JSRange(65, 0));
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 65);
        TKAssertEquals(editor.selections[0].range.length, 8);
        TKAssertEquals(editor.selections[0].insertionLocation, 73);

        // end of hard broken line, before newline
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 65);
        TKAssertEquals(editor.selections[0].range.length, 8);
        TKAssertEquals(editor.selections[0].insertionLocation, 73);

        // end of document
        editor.setSelectionRange(JSRange(97, 0));
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 97);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // with range
        editor.setSelectionRange(JSRange(40, 10));
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 21);
        TKAssertEquals(editor.selections[0].insertionLocation, 61);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // range spanning lines
        editor.setSelectionRange(JSRange(40, 50));
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 57);
        TKAssertEquals(editor.selections[0].insertionLocation, 97);

        // multiple selections
        // first, with ranges that should just clear
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 2), JSRange(41, 0), JSRange(70, 10)]);
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 3);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 20);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[1].range.location, 41);
        TKAssertEquals(editor.selections[1].range.length, 20);
        TKAssertEquals(editor.selections[1].insertionLocation, 61);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        TKAssertEquals(editor.selections[2].range.location, 70);
        TKAssertEquals(editor.selections[2].range.length, 27);
        TKAssertEquals(editor.selections[2].insertionLocation, 97);
    },

    _testMoveUp: function(){
    },

    _testMoveDown: function(){
    },

    _testMoveUpAndModifySelection: function(){
    },

    _testMoveDownAndModifySelection: function(){
    }

    // TODO: UI testing...not clear best approach. Should the internal layers of a selection be fair game?

    // testDidBecomeFirstResponder: function(){
    //     var editor = UITextEditor.initWithTextLayer(this.textLayer);
    //     TKAssertNull(editor.selections[0].cursorLayer.superlayer);
    //     editor.didBecomeFirstResponder();
    //     TKAssertExactEquals(editor.selections[0].cursorLayer.superlayer, this.textLayer);
    //     // TODO: check pending display server updates?
    //     // TODO: cursor blinking
    // },

    // testDidResignFirstResponder: function(){
    //     var editor = UITextEditor.initWithTextLayer(this.textLayer);
    //     TKAssertNull(editor.selections[0].cursorLayer.superlayer);
    //     editor.didBecomeFirstResponder();
    //     TKAssertExactEquals(editor.selections[0].cursorLayer.superlayer, this.textLayer);
    //     editor.didResignFirstResponder();
    //     TKAssertNull(editor.selections[0].cursorLayer.superlayer);
    // },

});

JSClass("UITextEditorTestsFont", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("UITextEditorTestsFont", JSFont.Weight.Regular, JSFont.Style.Normal);
        this._fullName = "UITextEditorTestsFont";
        this._postScriptName = "UITextEditorTestsFont";
        this._faceName = "UITextEditorTestsFont";
        this._unitsPerEM = 2048;
        this._ascenderInUnits = 1900;
        this._descenderInUnits = -500;
        this._pointSize = 14.0;
        this._calculateMetrics();
    },

    containsGlyphForCharacter: function(character){
        return true;
    },

    widthOfCharacter: function(character){
        if (character.code == 0x2026){ // ellipsis
            return 10;
        }
        if (character.code == 0x200B){ // zero-width space
            return 0;
        }
        if (character.code >= 0x61){  // lowercase, {, }, |, ~
            return 20;
        }
        return 30; // uppercase, digits, most punctuation
    }
});

})();