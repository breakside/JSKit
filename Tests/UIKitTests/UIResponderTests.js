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
// #import UIKitTesting
'use strict';

JSClass("UIResponderTests", TKTestSuite, {

    setup: function(){
        this.application = UIMockApplication.initEmpty();
    },

    teardown: function(){
        this.application.deinit();
    },

    testEvents: function(){
        var window = UIRootWindow.init();

        var Responder1 = UIResponder.$extend({

            nextResponder: null,

            getNextResponder: function(){
                return this.nextResponder;
            }

        }, "Responder1");

        var Responder2 = UIResponder.$extend({

            mouseDownCount: 0,
            mouseUpCount: 0,
            mouseDraggedCount: 0,
            rightMouseDownCount: 0,
            rightMouseUpCount: 0,
            rightMouseDraggedCount: 0,
            keyDownCount: 0,
            keyUpCount: 0,

            mouseDown: function(event){
                this.mouseDownCount++;
            },

            mouseUp: function(event){
                this.mouseUpCount++;
            },

            mouseDragged: function(event){
                this.mouseDraggedCount++;
            },

            rightMouseDown: function(event){
                this.rightMouseDownCount++;
            },

            rightMouseUp: function(event){
                this.rightMouseUpCount++;
            },

            rightMouseDragged: function(event){
                this.rightMouseDraggedCount++;
            },

            keyDown: function(event){
                this.keyDownCount++;
            },

            keyUp: function(event){
                this.keyUpCount++;
            }

        }, "Responder2");

        var responder1 = Responder1.init();
        var responder2 = Responder2.init();
        responder1.nextResponder = responder2;

        var event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1, window, JSPoint(0, 0));
        TKAssertEquals(responder2.mouseDownCount, 0);
        responder1.mouseDown(event);
        TKAssertEquals(responder2.mouseDownCount, 1);

        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseUp, 1, window, JSPoint(0, 0));
        TKAssertEquals(responder2.mouseUpCount, 0);
        responder1.mouseUp(event);
        TKAssertEquals(responder2.mouseUpCount, 1);

        event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDragged, 1, window, JSPoint(0, 0));
        TKAssertEquals(responder2.mouseDraggedCount, 0);
        responder1.mouseDragged(event);
        TKAssertEquals(responder2.mouseDraggedCount, 1);

        event = UIEvent.initMouseEventWithType(UIEvent.Type.rightMouseDown, 1, window, JSPoint(0, 0));
        TKAssertEquals(responder2.rightMouseDownCount, 0);
        responder1.rightMouseDown(event);
        TKAssertEquals(responder2.rightMouseDownCount, 1);

        event = UIEvent.initMouseEventWithType(UIEvent.Type.rightMouseUp, 1, window, JSPoint(0, 0));
        TKAssertEquals(responder2.rightMouseUpCount, 0);
        responder1.rightMouseUp(event);
        TKAssertEquals(responder2.rightMouseUpCount, 1);

        event = UIEvent.initMouseEventWithType(UIEvent.Type.rightMouseDragged, 1, window, JSPoint(0, 0));
        TKAssertEquals(responder2.rightMouseDraggedCount, 0);
        responder1.rightMouseDragged(event);
        TKAssertEquals(responder2.rightMouseDraggedCount, 1);

        event = UIEvent.initKeyEventWithType(UIEvent.Type.keyDown, 1, window, UIEvent.Key.enter, 0x13);
        TKAssertEquals(responder2.keyDownCount, 0);
        responder1.keyDown(event);
        TKAssertEquals(responder2.keyDownCount, 1);

        event = UIEvent.initKeyEventWithType(UIEvent.Type.keyUp, 1, window, UIEvent.Key.enter, 0x13);
        TKAssertEquals(responder2.keyUpCount, 0);
        responder1.keyUp(event);
        TKAssertEquals(responder2.keyUpCount, 1);

        TKAssertEquals(responder2.mouseDownCount, 1);
        TKAssertEquals(responder2.mouseUpCount, 1);
        TKAssertEquals(responder2.mouseDraggedCount, 1);
        TKAssertEquals(responder2.rightMouseDownCount, 1);
        TKAssertEquals(responder2.rightMouseUpCount, 1);
        TKAssertEquals(responder2.rightMouseDraggedCount, 1);
        TKAssertEquals(responder2.keyDownCount, 1);
        TKAssertEquals(responder2.keyUpCount, 1);

    },

    testCanPerformAction: function(){

        var Responder1 = UIResponder.$extend({

            nextResponder: null,

            test1: function(sender){

            },

            getNextResponder: function(){
                return this.nextResponder;
            }

        }, "Responder1");

        var Responder2 = UIResponder.$extend({

            test1: function(sender){
            },

            test2: function(sender){
            }

        }, "Responder2");

        var responder1 = Responder1.init();
        var responder2 = Responder2.init();
        responder1.nextResponder = responder2;

        TKAssert(responder1.canPerformAction('test1', null));
        TKAssert(!responder1.canPerformAction('test2', null));

        TKAssert(responder2.canPerformAction('test1', null));
        TKAssert(responder2.canPerformAction('test2', null));

    },

    testTargetForAction: function(){

        var Responder1 = UIResponder.$extend({

            nextResponder: null,

            test1: function(sender){

            },

            getNextResponder: function(){
                return this.nextResponder;
            }

        }, "Responder1");

        var Responder2 = UIResponder.$extend({

            test1: function(sender){
            },

            test2: function(sender){
            }

        }, "Responder2");

        var responder1 = Responder1.init();
        var responder2 = Responder2.init();
        responder1.nextResponder = responder2;

        var target = responder1.targetForAction('test1', null);
        TKAssertExactEquals(target, responder1);

        target = responder1.targetForAction('test2', null);
        TKAssertExactEquals(target, responder2);

        target = responder2.targetForAction('test1', null);
        TKAssertExactEquals(target, responder2);

        target = responder2.targetForAction('test2', null);
        TKAssertExactEquals(target, responder2);

    },

    testUndoManager: function(){

        var Responder1 = UIResponder.$extend({

            nextResponder: null,

            test1: function(sender){

            },

            getNextResponder: function(){
                return this.nextResponder;
            }

        }, "Responder1");

        var Responder2 = UIResponder.$extend({

            undoManager: null,

            test1: function(sender){
            },

            test2: function(sender){
            },

            getUndoManager: function(){
                return this.undoManager;
            }

        }, "Responder2");

        var responder1 = Responder1.init();
        var responder2 = Responder2.init();
        responder1.nextResponder = responder2;

        TKAssertNull(responder1.getUndoManager());
        TKAssertNull(responder2.getUndoManager());
        TKAssert(!responder1.canPerformAction('undo'));
        TKAssert(!responder1.canPerformAction('redo'));

        var undoManager = JSUndoManager.init();

        responder2.undoManager = undoManager;
        TKAssertExactEquals(responder1.getUndoManager(), undoManager);
        TKAssertExactEquals(responder2.getUndoManager(), undoManager);

        TKAssert(!responder1.canPerformAction('undo'));
        TKAssert(!responder1.canPerformAction('redo'));

        var undo = function(){
            undoManager.registerUndo(this, undo);
        };

        undoManager.registerUndo(this, undo);
        TKAssert(responder1.canPerformAction('undo'));
        TKAssert(!responder1.canPerformAction('redo'));
        undoManager.undo();
        TKAssert(!responder1.canPerformAction('undo'));
        TKAssert(responder1.canPerformAction('redo'));
    },

});