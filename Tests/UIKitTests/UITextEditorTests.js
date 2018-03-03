// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
// #import "MockWindowServer.js"
/* global JSClass, TKTestSuite, UITextEditor, MockWindowServer, UITextLayer, JSRange */
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
    },

    testDeleteBackward: function(){
        // TODO: delete with no selection range
        // TODO: delete at start of doc
        // TODO: delete with selection range
        // TODO: delete with mutliple selections (some with range, some without)
    }

});

})();