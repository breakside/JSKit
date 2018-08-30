// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSUndoManager */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSUndoManagerTests", TKTestSuite, {

    testUndo: function(){
        var manager = JSUndoManager.init();
        TKAssert(!manager.canUndo);
        var undone1 = false;
        var undone2 = false;
        manager.registerUndo(this, function(){
            undone1 = true;
        });
        TKAssert(!undone1);
        TKAssert(!undone2);
        manager.registerUndo(this, function(){
            undone2 = true;
        });
        TKAssert(!undone1);
        TKAssert(!undone2);
        TKAssert(manager.canUndo);
        manager.undo();
        TKAssert(!undone1);
        TKAssert(undone2);
        TKAssert(manager.canUndo);
        manager.undo();
        TKAssert(undone1);
        TKAssert(undone2);
        TKAssert(!manager.canUndo);
    },

    testRedo: function(){
        var manager = JSUndoManager.init();
        TKAssert(!manager.canRedo);
        var redone1 = false;
        var redone2 = false;
        manager.registerUndo(this, function(){
            manager.registerUndo(this, function(){
                redone1 = true;
                manager.registerUndo(this, function(){
                    redone1 = false;
                });
            });
        });
        manager.registerUndo(this, function(){
            manager.registerUndo(this, function(){
                redone2 = true;
                manager.registerUndo(this, function(){
                    redone2 = false;
                    manager.registerUndo(this, function(){
                        redone2 = true;
                    });
                });
            });
        });
        TKAssert(!redone1);
        TKAssert(!redone2);
        TKAssert(!manager.canRedo);
        manager.undo();
        TKAssert(!redone1);
        TKAssert(!redone2);
        TKAssert(manager.canRedo);
        manager.redo();
        TKAssert(!redone1);
        TKAssert(redone2);
        TKAssert(!manager.canRedo);
        manager.undo();
        TKAssert(!redone1);
        TKAssert(!redone2);
        TKAssert(manager.canRedo);
        manager.undo();
        TKAssert(!redone1);
        TKAssert(!redone2);
        TKAssert(manager.canRedo);
        manager.redo();
        TKAssert(redone1);
        TKAssert(!redone2);
        TKAssert(manager.canRedo);
        manager.registerUndo(this, function(){
        });
        TKAssert(!manager.canRedo);
    },

    testGrouping: function(){
        var manager = JSUndoManager.init();
        var x = 0;
        var changes = [];
        var change = function(value){
            manager.registerUndo(undefined, change, x);
            x = value;
            changes.push(value);
        };
        change(1);
        change(2);
        change(3);
        manager.beginUndoGrouping();
        change(4);
        change(5);
        manager.endUndoGrouping();
        change(6);
        manager.beginUndoGrouping();
        change(7);
        manager.beginUndoGrouping();
        change(8);
        change(9);
        manager.endUndoGrouping();
        change(10);
        manager.endUndoGrouping();

        TKAssertEquals(changes.length, 10);
        TKAssertEquals(changes[0], 1);
        TKAssertEquals(changes[1], 2);
        TKAssertEquals(changes[2], 3);
        TKAssertEquals(changes[3], 4);
        TKAssertEquals(changes[4], 5);
        TKAssertEquals(changes[5], 6);
        TKAssertEquals(changes[6], 7);
        TKAssertEquals(changes[7], 8);
        TKAssertEquals(changes[8], 9);
        TKAssertEquals(changes[9], 10);
        TKAssertEquals(x, 10);
        manager.undo();
        TKAssertEquals(changes.length, 14);
        TKAssertEquals(changes[10], 9);
        TKAssertEquals(changes[11], 8);
        TKAssertEquals(changes[12], 7);
        TKAssertEquals(changes[13], 6);
        TKAssertEquals(x, 6);
        manager.redo();
        TKAssertEquals(changes.length, 18);
        TKAssertEquals(changes[14], 7);
        TKAssertEquals(changes[15], 8);
        TKAssertEquals(changes[16], 9);
        TKAssertEquals(changes[17], 10);
        TKAssertEquals(x, 10);
        manager.undo();
        TKAssertEquals(changes.length, 22);
        TKAssertEquals(changes[18], 9);
        TKAssertEquals(changes[19], 8);
        TKAssertEquals(changes[20], 7);
        TKAssertEquals(changes[21], 6);
        TKAssertEquals(x, 6);
        manager.undo();
        TKAssertEquals(changes.length, 23);
        TKAssertEquals(changes[22], 5);
        TKAssertEquals(x, 5);
        manager.undo();
        TKAssertEquals(changes.length, 25);
        TKAssertEquals(changes[23], 4);
        TKAssertEquals(changes[24], 3);
        TKAssertEquals(x, 3);
        manager.undo();
        TKAssertEquals(changes.length, 26);
        TKAssertEquals(changes[25], 2);
        TKAssertEquals(x, 2);
        manager.undo();
        TKAssertEquals(changes.length, 27);
        TKAssertEquals(changes[26], 1);
        TKAssertEquals(x, 1);
    },

    testActionName: function(){
        var manager = JSUndoManager.init();
        var x = 0;
        var y = 0;
        var z = 0;
        var changeX = function(value){
            manager.registerUndo(undefined, changeX, x);
            manager.setActionName("Change X");
            x = value;
        };
        var changeY = function(value){
            manager.registerUndo(undefined, changeY, y);
            manager.setActionName("Change Y");
            y = value;
        };
        var changeZ = function(value){
            manager.registerUndo(undefined, changeZ, z);
            z = value;
        };

        TKAssertEquals(manager.titleForUndoMenuItem, "Undo");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        changeX(1);
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change X");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        manager.undo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo Change X");
        manager.redo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change X");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        changeY(1);
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change Y");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        manager.undo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change X");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo Change Y");
        manager.undo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo Change X");
        manager.redo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change X");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo Change Y");
        manager.redo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change Y");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        changeZ(1);
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        manager.undo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change Y");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        manager.beginUndoGrouping();
        changeX(2);
        changeY(2);
        manager.endUndoGrouping();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        manager.beginUndoGrouping();
        changeX(3);
        changeY(3);
        manager.endUndoGrouping();
        manager.setActionName("Change XY");
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo Change XY");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo");
        manager.undo();
        TKAssertEquals(manager.titleForUndoMenuItem, "Undo");
        TKAssertEquals(manager.titleForRedoMenuItem, "Redo Change XY");
    }

});