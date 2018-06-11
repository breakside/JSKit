// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, UIResponder, UIEvent, UIWindow, TKAssert, TKAssertExactEquals, TKTestSuite, JSPoint, TKAssertEquals */
'use strict';

JSClass("UIResponderTests", TKTestSuite, {

    testEvents: function(){
        var window = UIWindow.init();

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

        event = UIEvent.initKeyEventWithType(UIEvent.Type.keyDown, 1, window, 5);
        TKAssertEquals(responder2.keyDownCount, 0);
        responder1.keyDown(event);
        TKAssertEquals(responder2.keyDownCount, 1);

        event = UIEvent.initKeyEventWithType(UIEvent.Type.keyUp, 1, window, 5);
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

    }

});