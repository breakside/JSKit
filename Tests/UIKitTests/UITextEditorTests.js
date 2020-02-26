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
// #import "MockWindowServer.js"
'use strict';

(function(){

JSClass("UITextEditorTests", TKTestSuite, {

    windowServer: null,
    textLayer: null,

    setup: function(){
        this.windowServer = MockWindowServer.init();
        this.textLayer = UITextLayer.init();
        this.textLayer.font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        this.windowServer.displayServer.layerInserted(this.textLayer);
        this.windowServer.displayServer.updateDisplay();
    },

    teardown: function(){
        var responder = this.windowServer.textInputManager.responder;
        if (responder !== null){
            responder.resignFirstResponder();
        }
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
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 2);
        TKAssertEquals(editor.selections[0].insertionLocation, 7);

        // existing range with start insertion point
        editor.setSelectionRange(JSRange(5, 3), UITextEditor.SelectionInsertionPoint.start);
        TKAssertEquals(editor.selections[0].insertionLocation, 5);
        editor.moveBackwardAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 4);

        // multiple selection
        editor.setSelectionRanges([JSRange(0, 0), JSRange(1, 0), JSRange(2, 1), JSRange(7, 0)], UITextEditor.SelectionInsertionPoint.start);
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
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 18);

        // existing range with start insertion point
        editor.setSelectionRange(JSRange(22, 2), UITextEditor.SelectionInsertionPoint.start);
        TKAssertEquals(editor.selections[0].insertionLocation, 22);
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
        TKAssertEquals(editor.selections[0].range.length, 19);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        editor.moveToBeginningOfDocumentAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 19);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // selection with range and start insertion point
        editor.setSelectionRange(JSRange(19, 3), UITextEditor.SelectionInsertionPoint.start);
        TKAssertEquals(editor.selections[0].insertionLocation, 19);
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
        TKAssertEquals(editor.selections[0].range.location, 6);
        TKAssertEquals(editor.selections[0].range.length, 2);
        TKAssertEquals(editor.selections[0].insertionLocation, 6);

        // selection with range and end insertion point
        editor.setSelectionRange(JSRange(5, 3), UITextEditor.SelectionInsertionPoint.end);
        TKAssertEquals(editor.selections[0].insertionLocation, 8);
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
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 2);
        TKAssertEquals(editor.selections[0].insertionLocation, 24);
        editor.moveWordForwardAndModifySelection();


        // selection with range and end insertion point
        editor.setSelectionRange(JSRange(19, 3), UITextEditor.SelectionInsertionPoint.end);
        TKAssertEquals(editor.selections[0].insertionLocation, 22);
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
        TKAssertEquals(editor.selections[0].range.location, 22);
        TKAssertEquals(editor.selections[0].range.length, 13);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);

        // selection with range and end insertion point
        editor.setSelectionRange(JSRange(19, 3), UITextEditor.SelectionInsertionPoint.end);
        TKAssertEquals(editor.selections[0].insertionLocation, 22);
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
        editor.setSelectionRanges([JSRange(10, 0), JSRange(11, 0), JSRange(19, 1), JSRange(21, 0)], UITextEditor.SelectionInsertionPoint.start);
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
        TKAssertEquals(editor.selections[0].range.length, 10);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // with range and start insertion point
        editor.setSelectionRange(JSRange(40, 10), UITextEditor.SelectionInsertionPoint.start);
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 20);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // range spanning lines
        editor.setSelectionRange(JSRange(40, 50), UITextEditor.SelectionInsertionPoint.start);
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 60);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // range spanning lines (end insertion)
        editor.setSelectionRange(JSRange(40, 50), UITextEditor.SelectionInsertionPoint.end);
        editor.moveToBeginningOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 10);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // multiple selections
        editor.setSelectionRanges([JSRange(10, 0), JSRange(12, 2), JSRange(41, 0), JSRange(70, 10)], UITextEditor.SelectionInsertionPoint.start);
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

        // with range and start insertion point
        editor.setSelectionRange(JSRange(40, 10), UITextEditor.SelectionInsertionPoint.start);
        editor.moveToEndOfLineAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 50);
        TKAssertEquals(editor.selections[0].range.length, 11);
        TKAssertEquals(editor.selections[0].insertionLocation, 61);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // with range and end insertion point
        editor.setSelectionRange(JSRange(40, 10), UITextEditor.SelectionInsertionPoint.end);
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

    testMoveUp: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        // 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60|70
        // T        h     i     s     _        i     s     _        a     _        t     e     s     t     _        o     f     _        a     _        m     u     l     t     i     l     i     n     e     _    |
        // t     e     x     t     _        f     i     e     l     d     _        t     h     a     t     _        s     h     o     u     l     d     _        w     r     a     p     _        t     o     _    |
        // t     h     r     e     e     _        l     i     n     e     s     .                                                                                                                                  |
        // T        h     e     n     _        b     r     e     a     k     _        t     o     _        a     _        f     o     u     r     t     h     .                                                    |
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(5, 0));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of line
        editor.setSelectionRange(JSRange(30, 0));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // greater than half a character
        editor.setSelectionRange(JSRange(79, 0));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 67);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // less than half a character
        editor.setSelectionRange(JSRange(38, 0));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // exactly half a character
        editor.setSelectionRange(JSRange(50, 0));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // past end of line
        editor.setSelectionRange(JSRange(95, 0));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection range
        editor.setSelectionRange(JSRange(10, 1));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(34, 1));
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        editor.setSelectionRanges([JSRange(0, 0), JSRange(10, 1), JSRange(30, 0), JSRange(35, 0), JSRange(71, 2), JSRange(97, 0)]);
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 4);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 5);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 40);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 73);
        TKAssertEquals(editor.selections[3].range.length, 0);

        // affinity
        editor.setSelectionRange(JSRange(61, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        this.textLayer.text =
            "This_is_a_test_of_a_multiline" +
            "_text field that should wrap t " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(60, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 29);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap " +
            "tothree lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(58, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveUp();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 27);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveDown: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        // 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60|70
        // T        h     i     s     _        i     s     _        a     _        t     e     s     t     _        o     f     _        a     _        m     u     l     t     i     l     i     n     e     _    |
        // t     e     x     t     _        f     i     e     l     d     _        T        h     a     t     _        s     h     o     u     l     d     _        w     r     a     p     _        t     o     _ |
        // t     h     r     e     e     _        l     i     n     e     s     .                                                                                                                                  |
        // T        h     e     n     _        b     r     e     a     k     _        t     o     _        a     _        f     o     u     r     t     h     .                                                    |
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field That should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // last line
        editor.setSelectionRange(JSRange(80, 0));
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 97);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // start of line
        editor.setSelectionRange(JSRange(30, 0));
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 61);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // greater than half a character
        editor.setSelectionRange(JSRange(11, 0));
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 42);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // less than half a character
        editor.setSelectionRange(JSRange(21, 0));
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 52);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // exactly half a character
        editor.setSelectionRange(JSRange(16, 0));
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 47);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // past end of line
        editor.setSelectionRange(JSRange(50, 0));
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // selection range
        editor.setSelectionRange(JSRange(10, 1), UITextEditor.SelectionInsertionPoint.start);
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 42);
        TKAssertEquals(editor.selections[0].range.length, 0);
        editor.setSelectionRange(JSRange(90, 1));
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 97);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // multiple selections
        editor.setSelectionRanges([JSRange(0, 0), JSRange(30, 0), JSRange(35, 0), JSRange(71, 2), JSRange(97, 0), JSRange(86, 1)]);
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 5);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[1].range.location, 61);
        TKAssertEquals(editor.selections[1].range.length, 0);
        TKAssertEquals(editor.selections[2].range.location, 66);
        TKAssertEquals(editor.selections[2].range.length, 0);
        TKAssertEquals(editor.selections[3].range.location, 86);
        TKAssertEquals(editor.selections[3].range.length, 0);
        TKAssertEquals(editor.selections[4].range.location, 97);
        TKAssertEquals(editor.selections[4].range.length, 0);

        // affinity
        editor.setSelectionRange(JSRange(30, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 60);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);

        this.textLayer.text =
            "This is a test of a multiline{" +
            "text_field_that_should_wrap_to" +
            "_three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(29, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 60);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap " +
            "tothree lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(58, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveDown();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 72);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveUpAndModifySelection: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        // 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60|70
        // T        h     i     s     _        i     s     _        a     _        t     e     s     t     _        o     f     _        a     _        m     u     l     t     i     l     i     n     e     _    |
        // t     e     x     t     _        f     i     e     l     d     _        t     h     a     t     _        s     h     o     u     l     d     _        w     r     a     p     _        t     o     _    |
        // t     h     r     e     e     _        l     i     n     e     s     .                                                                                                                                  |
        // T        h     e     n     _        b     r     e     a     k     _        t     o     _        a     _        f     o     u     r     t     h     .                                                    |
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // first line
        editor.setSelectionRange(JSRange(5, 0));
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // start of line
        editor.setSelectionRange(JSRange(30, 0));
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 30);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);

        // greater than half a character
        editor.setSelectionRange(JSRange(79, 0));
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 67);
        TKAssertEquals(editor.selections[0].range.length, 12);
        TKAssertEquals(editor.selections[0].insertionLocation, 67);

        // less than half a character
        editor.setSelectionRange(JSRange(38, 0));
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 7);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 7);

        // exactly half a character
        editor.setSelectionRange(JSRange(50, 0));
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 19);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 19);

        // past end of line
        editor.setSelectionRange(JSRange(95, 0));
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 22);
        TKAssertEquals(editor.selections[0].insertionLocation, 73);

        // selection range with start insertion point
        editor.setSelectionRange(JSRange(10, 1), UITextEditor.SelectionInsertionPoint.start);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 11);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        editor.setSelectionRange(JSRange(34, 1), UITextEditor.SelectionInsertionPoint.start);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 4);

        // selection range with end insertion point
        editor.setSelectionRange(JSRange(10, 1), UITextEditor.SelectionInsertionPoint.end);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 10);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        editor.setSelectionRange(JSRange(34, 1), UITextEditor.SelectionInsertionPoint.end);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 5);
        TKAssertEquals(editor.selections[0].range.length, 29);
        TKAssertEquals(editor.selections[0].insertionLocation, 5);

        // selection range spanning lines with start insertion point
        editor.setSelectionRange(JSRange(34, 46), UITextEditor.SelectionInsertionPoint.start);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 4);
        TKAssertEquals(editor.selections[0].range.length, 76);
        TKAssertEquals(editor.selections[0].insertionLocation, 4);

        // selection range spanning lines with end insertion point
        editor.setSelectionRange(JSRange(34, 46), UITextEditor.SelectionInsertionPoint.end);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 34);
        TKAssertEquals(editor.selections[0].range.length, 34);
        TKAssertEquals(editor.selections[0].insertionLocation, 68);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 34);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[0].insertionLocation, 37);
        editor.setSelectionRange(JSRange(34, 28), UITextEditor.SelectionInsertionPoint.end);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 31);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[0].insertionLocation, 31);

        // multiple selections
        editor.setSelectionRanges([JSRange(0, 0), JSRange(10, 1), JSRange(30, 0), JSRange(35, 0), JSRange(71, 2), JSRange(97, 0)], UITextEditor.SelectionInsertionPoint.start);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 35);
        TKAssertEquals(editor.selections[0].insertionLocation, 0);
        TKAssertEquals(editor.selections[1].range.location, 40);
        TKAssertEquals(editor.selections[1].range.length, 57);
        TKAssertEquals(editor.selections[1].insertionLocation, 40);

        // affinity
        editor.setSelectionRange(JSRange(61, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        this.textLayer.text =
            "This_is_a_test_of_a_multiline" +
            "_text field that should wrap t " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(60, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 29);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 29);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap " +
            "tothree lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(58, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveUpAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 27);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 27);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testMoveDownAndModifySelection: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        // 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60|70
        // T        h     i     s     _        i     s     _        a     _        t     e     s     t     _        o     f     _        a     _        m     u     l     t     i     l     i     n     e     _    |
        // t     e     x     t     _        f     i     e     l     d     _        T        h     a     t     _        s     h     o     u     l     d     _        w     r     a     p     _        t     o     _ |
        // t     h     r     e     e     _        l     i     n     e     s     .                                                                                                                                  |
        // T        h     e     n     _        b     r     e     a     k     _        t     o     _        a     _        f     o     u     r     t     h     .                                                    |
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field That should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        // last line
        editor.setSelectionRange(JSRange(80, 0));
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 80);
        TKAssertEquals(editor.selections[0].range.length, 17);
        TKAssertEquals(editor.selections[0].insertionLocation, 97);

        // start of line
        editor.setSelectionRange(JSRange(30, 0));
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 61);

        // greater than half a character
        editor.setSelectionRange(JSRange(11, 0));
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 11);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 42);

        // less than half a character
        editor.setSelectionRange(JSRange(21, 0));
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 21);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 52);

        // exactly half a character
        editor.setSelectionRange(JSRange(16, 0));
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 16);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 47);

        // past end of line
        editor.setSelectionRange(JSRange(50, 0));
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 50);
        TKAssertEquals(editor.selections[0].range.length, 23);
        TKAssertEquals(editor.selections[0].insertionLocation, 73);

        // selection range with end insertion point
        editor.setSelectionRange(JSRange(10, 1), UITextEditor.SelectionInsertionPoint.end);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 10);
        TKAssertEquals(editor.selections[0].range.length, 32);
        TKAssertEquals(editor.selections[0].insertionLocation, 42);
        editor.setSelectionRange(JSRange(90, 1), UITextEditor.SelectionInsertionPoint.end);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 90);
        TKAssertEquals(editor.selections[0].range.length, 7);
        TKAssertEquals(editor.selections[0].insertionLocation, 97);

        // selection range with start insertion point
        editor.setSelectionRange(JSRange(10, 1), UITextEditor.SelectionInsertionPoint.start);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 11);
        TKAssertEquals(editor.selections[0].range.length, 30);
        TKAssertEquals(editor.selections[0].insertionLocation, 41);
        editor.setSelectionRange(JSRange(90, 1), UITextEditor.SelectionInsertionPoint.start);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 91);
        TKAssertEquals(editor.selections[0].range.length, 6);
        TKAssertEquals(editor.selections[0].insertionLocation, 97);

        // multiline selection with end insertion point
        editor.setSelectionRange(JSRange(2, 66), UITextEditor.SelectionInsertionPoint.end);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 2);
        TKAssertEquals(editor.selections[0].range.length, 79);
        TKAssertEquals(editor.selections[0].insertionLocation, 81);

        // multiline selection with start insertion point
        editor.setSelectionRange(JSRange(2, 66), UITextEditor.SelectionInsertionPoint.start);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 33);
        TKAssertEquals(editor.selections[0].range.length, 35);
        TKAssertEquals(editor.selections[0].insertionLocation, 33);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 64);
        TKAssertEquals(editor.selections[0].range.length, 4);
        TKAssertEquals(editor.selections[0].insertionLocation, 64);
        editor.setSelectionRange(JSRange(36, 4), UITextEditor.SelectionInsertionPoint.start);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 27);
        TKAssertEquals(editor.selections[0].insertionLocation, 67);

        // multiple selections
        editor.setSelectionRanges([JSRange(0, 0), JSRange(30, 0), JSRange(35, 0), JSRange(71, 2), JSRange(97, 0), JSRange(86, 1)]);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 2);
        TKAssertEquals(editor.selections[0].range.location, 0);
        TKAssertEquals(editor.selections[0].range.length, 66);
        TKAssertEquals(editor.selections[0].insertionLocation, 66);
        TKAssertEquals(editor.selections[1].range.location, 71);
        TKAssertEquals(editor.selections[1].range.length, 26);
        TKAssertEquals(editor.selections[1].insertionLocation, 97);

        // affinity
        editor.setSelectionRange(JSRange(30, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 30);
        TKAssertEquals(editor.selections[0].insertionLocation, 60);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);

        this.textLayer.text =
            "This is a test of a multiline{" +
            "text_field_that_should_wrap_to" +
            "_three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(29, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 29);
        TKAssertEquals(editor.selections[0].range.length, 31);
        TKAssertEquals(editor.selections[0].insertionLocation, 60);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        this.textLayer.text =
            "This is a test of a multiline " +
            "text field that should wrap " +
            "tothree lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();
        editor.setSelectionRange(JSRange(58, 0), UITextEditor.SelectionInsertionPoint.start, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        editor.moveDownAndModifySelection();
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 58);
        TKAssertEquals(editor.selections[0].range.length, 14);
        TKAssertEquals(editor.selections[0].insertionLocation, 72);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
    },

    testHandleMouseDown: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        // 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60|70
        // T        h     i     s     _        i     s     _        a     _        t     e     s     t     _        o     f     _        a     _        m     u     l     t     i     l     i     n     e     _    |
        // t     e     x     t     _        f     i     e     l     d     _        T        h     a     t     _        s     h     o     u     l     d     _        w     r     a     p     _        t     o     _ |
        // t     h     r     e     e     _        l     i     n     e     s     .                                                                                                                                  |
        // T        h     e     n     _        b     r     e     a     k     _        t     o     _        a     _        f     o     u     r     t     h     .                                                    |
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field That should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        editor.didBecomeFirstResponder();

        var mockWindow = {};

        // start of word
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1.0, mockWindow, JSPoint(110, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 1.01, mockWindow, JSPoint(110, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // mid word
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 2.0, mockWindow, JSPoint(150, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 37);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 2.01, mockWindow, JSPoint(150, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 37);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // mid letter
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 3.0, mockWindow, JSPoint(159, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 37);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 3.01, mockWindow, JSPoint(159, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 37);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 4.0, mockWindow, JSPoint(160, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 38);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 4.01, mockWindow, JSPoint(160, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 38);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 5.0, mockWindow, JSPoint(161, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 38);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 5.01, mockWindow, JSPoint(161, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 38);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // past end of line (soft break)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 6.0, mockWindow, JSPoint(700, 5), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 6.01, mockWindow, JSPoint(700, 5), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // past end of line (hard break)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 7.0, mockWindow, JSPoint(300, 41), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 7.01, mockWindow, JSPoint(300, 41), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);
    },

    testHandleMouseDownRepeatedOnce: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        // 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60|70
        // T        h     i     s     _        i     s     _        a     _        t     e     s     t     _        o     f     _        a     _        m     u     l     t     i     l     i     n     e     _    |
        // t     e     x     t     _        f     i     e     l     d     _        T        h     a     t     _        s     h     o     u     l     d     _        w     r     a     p     _        t     o     _ |
        // t     h     r     e     e     _        l     i     n     e     s     .                                                                                                                                  |
        // T        h     e     n     _        b     r     e     a     k     _        t     o     _        a     _        f     o     u     r     t     h     .                                                    |
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field That should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        editor.didBecomeFirstResponder();

        // select word at start
        var mockWindow = {};
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1.0, mockWindow, JSPoint(110, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 1.03, mockWindow, JSPoint(110, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1.05, mockWindow, JSPoint(110, 25), UIEvent.Modifier.none, 2);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 40);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 1.07, mockWindow, JSPoint(110, 25), UIEvent.Modifier.none, 2);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 40);

        // select word in middle
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 3.0, mockWindow, JSPoint(160, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 38);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 3.02, mockWindow, JSPoint(160, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 38);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 3.05, mockWindow, JSPoint(160, 25), UIEvent.Modifier.none, 2);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 40);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 3.08, mockWindow, JSPoint(160, 25), UIEvent.Modifier.none, 2);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 40);

        // select word at end
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 5.0, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 5.01, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 5.05, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 2);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 41);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 5.06, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 2);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 41);

        // select after line end (soft break)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 7.0, mockWindow, JSPoint(700, 5), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 7.03, mockWindow, JSPoint(700, 5), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 7.05, mockWindow, JSPoint(700, 5), UIEvent.Modifier.none, 2);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 29);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 7.07, mockWindow, JSPoint(700, 5), UIEvent.Modifier.none, 2);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 29);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);

        // select after line end (hard break)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 9.0, mockWindow, JSPoint(300, 41), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 9.03, mockWindow, JSPoint(300, 41), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 9.05, mockWindow, JSPoint(300, 41), UIEvent.Modifier.none, 2);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 74);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 9.07, mockWindow, JSPoint(300, 41), UIEvent.Modifier.none, 2);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 73);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 74);

        // move location after first down (far)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 11.0, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 11.01, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 11.05, mockWindow, JSPoint(400, 50), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 92);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 11.055, mockWindow, JSPoint(400, 50), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 92);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 11.06, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 11.065, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // move location after first down (near)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 13.0, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 13.03, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 13.05, mockWindow, JSPoint(221, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 13.055, mockWindow, JSPoint(221, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 13.06, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 13.065, mockWindow, JSPoint(220, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseUpAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 40);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // TODO: selecting word merges with selection before
        // TODO: selecting word merges with selection after
        // TODO: selecting word merges with selections before and after
    },

    _testHandleMouseDownRepeatedTwice: function(){
        // select line with hard break
        // select line with soft break
        // select line with location after end
        // move location after second down
        // selecting line merges with selection before
        // selecting line merges with selection after
        // selecting line merges with selections before and after

    },

    testHandleMouseDraggedSelection: function(){
        var editor = UITextEditor.initWithTextLayer(this.textLayer);

        this.textLayer.frame = JSRect(0, 0, 670, 1000);
        this.textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        // 0                             1                             2                             3                             4                             5                             6    
        // 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60 70 80 90 00 10 20 30 40 50 60|70
        // T        h     i     s     _        i     s     _        a     _        t     e     s     t     _        o     f     _        a     _        m     u     l     t     i     l     i     n     e     _    |
        // t     e     x     t     _        f     i     e     l     d     _        T        h     a     t     _        s     h     o     u     l     d     _        w     r     a     p     _        t     o     _ |
        // t     h     r     e     e     _        l     i     n     e     s     .                                                                                                                                  |
        // T        h     e     n     _        b     r     e     a     k     _        t     o     _        a     _        f     o     u     r     t     h     .                                                    |
        this.textLayer.text =
            "This is a test of a multiline " +
            "text field That should wrap to " +
            "three lines.\n" + 
            "Then break to a fourth.";
        this.textLayer.layoutIfNeeded();

        editor.didBecomeFirstResponder();

        var mockWindow = {};
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1.0, mockWindow, JSPoint(110, 25), UIEvent.Modifier.none, 1);
        editor.handleMouseDownAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);

        // forward, but not enough to select a new char
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.01, mockWindow, JSPoint(115, 25));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);

        // forward, enough to select a new char
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.02, mockWindow, JSPoint(130, 30));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 1);
        TKAssertEquals(editor.selections[0].insertionLocation, 36);

        // back to deselect the char
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.03, mockWindow, JSPoint(115, 20));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 0);
        TKAssertEquals(editor.selections[0].insertionLocation, 35);

        // back a few chars
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.04, mockWindow, JSPoint(45, 22));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 32);
        TKAssertEquals(editor.selections[0].range.length, 3);
        TKAssertEquals(editor.selections[0].insertionLocation, 32);

        // forward a lot
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.05, mockWindow, JSPoint(500, 22));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 18);
        TKAssertEquals(editor.selections[0].insertionLocation, 53);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);

        // beyond end of line (soft break)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.06, mockWindow, JSPoint(700, 22));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 26);
        TKAssertEquals(editor.selections[0].insertionLocation, 61);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.afterPreviousCharacter);

        // back
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.07, mockWindow, JSPoint(200, 22));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 40);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);

        // down to next line
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.08, mockWindow, JSPoint(200, 41));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 36);
        TKAssertEquals(editor.selections[0].insertionLocation, 71);

        // beyond end of line (hard break)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.09, mockWindow, JSPoint(300, 41));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 38);
        TKAssertEquals(editor.selections[0].insertionLocation, 73);

        // back to start of line
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.10, mockWindow, JSPoint(0, 41));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 26);
        TKAssertEquals(editor.selections[0].insertionLocation, 61);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);

        // up
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.11, mockWindow, JSPoint(0, 20));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 30);
        TKAssertEquals(editor.selections[0].range.length, 5);
        TKAssertEquals(editor.selections[0].insertionLocation, 30);
        TKAssertEquals(editor.selections[0].affinity, UITextEditor.SelectionAffinity.beforeCurrentCharacter);

        // up
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.12, mockWindow, JSPoint(50, 5));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 2);
        TKAssertEquals(editor.selections[0].range.length, 33);
        TKAssertEquals(editor.selections[0].insertionLocation, 2);

        // above first line
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.13, mockWindow, JSPoint(50, -5));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 2);
        TKAssertEquals(editor.selections[0].range.length, 33);
        TKAssertEquals(editor.selections[0].insertionLocation, 2);

        // over
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.14, mockWindow, JSPoint(470, -5));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 20);
        TKAssertEquals(editor.selections[0].range.length, 15);
        TKAssertEquals(editor.selections[0].insertionLocation, 20);

        // down
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.15, mockWindow, JSPoint(470, 5));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 20);
        TKAssertEquals(editor.selections[0].range.length, 15);
        TKAssertEquals(editor.selections[0].insertionLocation, 20);

        // down
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.16, mockWindow, JSPoint(470, 25));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 17);
        TKAssertEquals(editor.selections[0].insertionLocation, 52);

        // down
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.17, mockWindow, JSPoint(470, 41));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 38);
        TKAssertEquals(editor.selections[0].insertionLocation, 73);

        // down
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.17, mockWindow, JSPoint(470, 55));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 60);
        TKAssertEquals(editor.selections[0].insertionLocation, 95);

        // down (lower than final line)
        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1.17, mockWindow, JSPoint(470, 70));
        editor.handleMouseDraggedAtLocation(event.locationInWindow, event);
        TKAssertEquals(editor.selections.length, 1);
        TKAssertEquals(editor.selections[0].range.location, 35);
        TKAssertEquals(editor.selections[0].range.length, 60);
        TKAssertEquals(editor.selections[0].insertionLocation, 95);
    }

});

})();