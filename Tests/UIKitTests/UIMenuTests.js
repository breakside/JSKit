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

JSClass("UIMenuTests", TKTestSuite, {

    _createMenuWithItemCount: function(itemCount, longestItemTitle){
        if (longestItemTitle === undefined){
            longestItemTitle = "This is an item with a really long title that gets truncated";
        }
        var menu = UIMenu.init();
        var descriptor = JSTestFontDescriptor.initWithName("Test");
        descriptor.fixedWidth = true;
        menu.font = JSFont.initWithDescriptor(descriptor, 14.0);
        menu.font._displayLineHeight = 16;
        menu.font._displayAscender = 12;
        menu.font._displayDescender = 4;
        menu.addItemWithTitle(longestItemTitle);
        for (var i = 1; i < itemCount; ++i){
            menu.addItemWithTitle("i");
        }
        return menu;
    },

    setup: function(){
        this.app = UIMockApplication.init();
        this.windowServer = this.app.windowServer;
        this.baseWindow = UIRootWindow.initWithApplication(this.app);
        this.baseWindow.contentView = UIView.init();
        this.testView = UIView.initWithFrame(JSRect(20, 30, 40, 50));
        this.baseWindow.contentView.addSubview(this.testView);
        this.baseWindow.makeKeyAndOrderFront();
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
    },

    _assertItemIndexesAreConsistent: function(menu){
        var item;
        for (var i = 0, l = menu.items.length; i < l; ++i){
            item = menu.items[i];
            TKAssertEquals(item.index, i);
        }
    },

    testInsertItem: function(){
        var item;
        var menu = UIMenu.init();
        menu.addItemWithTitle("a");
        this._assertItemIndexesAreConsistent(menu);

        item = UIMenuItem.initWithTitle("b");
        menu.insertItemAtIndex(item, 0);
        this._assertItemIndexesAreConsistent(menu);

        item = UIMenuItem.initWithTitle("c");
        menu.insertItemAtIndex(item, 1);
        this._assertItemIndexesAreConsistent(menu);

        item = UIMenuItem.initWithTitle("d");
        menu.insertItemAtIndex(item, 3);
        this._assertItemIndexesAreConsistent(menu);

        item = UIMenuItem.initWithTitle("e");
        menu.insertItemAtIndex(item, 3);
        this._assertItemIndexesAreConsistent(menu);
    },

    testRemoveItem: function(){
        var item;
        var menu = UIMenu.init();
        menu.addItemWithTitle("a");
        menu.addItemWithTitle("b");
        menu.addItemWithTitle("c");
        menu.addItemWithTitle("d");
        menu.addItemWithTitle("e");
        this._assertItemIndexesAreConsistent(menu);

        menu.removeItemAtIndex(1);
        this._assertItemIndexesAreConsistent(menu);

        menu.removeItemAtIndex(0);
        this._assertItemIndexesAreConsistent(menu);

        menu.removeItemAtIndex(2);
        this._assertItemIndexesAreConsistent(menu);

        menu.removeItemAtIndex(0);
        this._assertItemIndexesAreConsistent(menu);
    },

    testOpenAdjacentToView: function(){
        // Screen frame is 0,0 1500x1000
        // Safe rect is 7,4 1486x992
        // max width is floor(1486 * .3) = 445

        var menu;

        // Min width
        menu = this._createMenuWithItemCount(2, "i");
        menu.minimumWidth = 100;
        menu.openAdjacentToView(this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.size.width, 100);
        menu.close();

        // Max width
        menu = this._createMenuWithItemCount(2);
        menu.openAdjacentToView(this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.size.width, 445);
        menu.close();

        // Below
        this.testView.frame = JSRect(20, 30, 40, 50);
        menu = this._createMenuWithItemCount(7, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.below);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 20);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 80);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 112);
        menu.close();

        // Below, not enough room, but better than above
        this.testView.frame = JSRect(20, 550, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.below);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 20);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 600);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertEquals(menu.stylerProperties.window.frame.size.height, 396);
        menu.close();

        // Below, not enough room
        this.testView.frame = JSRect(20, 900, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.below);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 20);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 900);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Above
        this.testView.frame = JSRect(20, 800, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.above);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 20);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 800);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Above, not enough room, but better than below
        this.testView.frame = JSRect(20, 400, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.above);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 20);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 396);
        menu.close();

        // Above, not enough room
        this.testView.frame = JSRect(20, 200, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.above);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 20);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 250);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Right
        this.testView.frame = JSRect(20, 30, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.right);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 60);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Right, not enough room below
        this.testView.frame = JSRect(20, 900, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.right);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 60);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Right, not enough room, but ok on left
        this.testView.frame = JSRect(1400, 30, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.right);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1400);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Right, not enough room either side
        this.testView.frame = JSRect(20, 30, 1400, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.right);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Right, not enough room either side, more room on left
        this.testView.frame = JSRect(60, 30, 1400, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.right);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Left
        this.testView.frame = JSRect(1000, 30, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.left);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1000);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Left, not enough room below
        this.testView.frame = JSRect(1000, 900, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.left);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1000);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Left, not enough room, but ok on right
        this.testView.frame = JSRect(200, 30, 40, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.left);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 240);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Left, not enough room either side
        this.testView.frame = JSRect(60, 30, 1400, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.left);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Left, not enough room either side, more room on right
        this.testView.frame = JSRect(20, 30, 1400, 50);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.left);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 30);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Offscreen (top left)
        this.testView.frame = JSRect(-100, -100, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.below);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.above);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAdjacentToView(this.testView, UIMenu.Placement.left);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAdjacentToView(this.testView, UIMenu.Placement.right);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Offscreen (bottom right)
        this.testView.frame = JSRect(1600, 1100, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.below);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAdjacentToView(this.testView, UIMenu.Placement.above);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAdjacentToView(this.testView, UIMenu.Placement.left);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAdjacentToView(this.testView, UIMenu.Placement.right);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
    },

    testOpenAtLocationInContextView: function(){
        // Screen frame is 0,0 1500x1000
        // Safe rect is 7,4 1486x992
        // max width is floor(1486 * .3) = 445
        // item 1 is offset at 0,5 from window (FIXME: how can we make the tests not depend on this?)

        var item1Offset = JSPoint(0, 5);
        var menu;
        
        // Min width
        menu = this._createMenuWithItemCount(2, "i");
        menu.minimumWidth = 100;
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.size.width, 100);
        menu.close();

        // Max width
        menu = this._createMenuWithItemCount(2);
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.size.width, 445);
        menu.close();

        // Enough room to the right & bottom
        this.testView.frame = JSRect(10, 20, 30, 40);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 16);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 25 - item1Offset.y);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Enough room to the right, not enough to the bottom
        this.testView.frame = JSRect(10, 600, 30, 40);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 16);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Not enough room to the right, enough on bottom
        this.testView.frame = JSRect(1400, 20, 30, 40);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1405);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 25 - item1Offset.y);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // not enough room on right or bottom
        this.testView.frame = JSRect(1400, 600, 30, 40);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1405);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Offscreen (top left)
        this.testView.frame = JSRect(-100, -100, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Offscreen (bottom right)
        this.testView.frame = JSRect(1600, 1100, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openAtLocationInContextView(JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
    },

    testOpenWithItemAtLocationInView: function(){
        // Screen frame is 0,0 1500x1000
        // Safe rect is 7,4 1486x992
        // max width is floor(1486 * .3) = 445
        // item 1 is offset at 0,5 from window (FIXME: how can we make the tests not depend on this?)

        var item1Offset = JSPoint(0, 5);
        var itemHeight = 20;
        var menu;
        
        // Min width
        menu = this._createMenuWithItemCount(2, "i");
        menu.minimumWidth = 100;
        menu.openWithItemAtLocationInView(menu.items[0], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.size.width, 100);
        menu.close();

        // Max width
        menu = this._createMenuWithItemCount(2);
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.size.width, 445);
        menu.close();

        // Enough room for whole menu
        this.testView.frame = JSRect(100, 200, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.contentOffset.y, 0);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 105 - item1Offset.x);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 205 - item1Offset.y - itemHeight);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Not enough room up top, but enough to scroll
        // item 20 should be at 105,205
        // height 5 + 400 + 20 + 60 + 5
        // available is 201....405-201 = 204
        // height should be 490 - 204  = 286
        this.testView.frame = JSRect(100, 200, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[20], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.contentOffset.y, 204);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 105 - item1Offset.x);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 286);
        menu.close();

        // Not enough room up top, not even to scroll
        this.testView.frame = JSRect(100, 30, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[23], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.contentOffset.y, 0);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 105 - item1Offset.x);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Not enough room at bottom, but enough to scroll
        this.testView.frame = JSRect(100, 800, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 105 - item1Offset.x);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        menu.close();

        // Not enough room up top, not even to scroll
        this.testView.frame = JSRect(100, 970, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[0], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 105 - item1Offset.x);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Offscreen (top left)
        this.testView.frame = JSRect(-100, -100, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x, 7);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y, 4);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();

        // Offscreen (bottom right)
        this.testView.frame = JSRect(1600, 1100, 10, 20);
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu = this._createMenuWithItemCount(24, "Item Seven");
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
        menu.openWithItemAtLocationInView(menu.items[1], JSPoint(5, 5), this.testView);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.x + menu.stylerProperties.window.frame.size.width, 1493);
        TKAssertEquals(menu.stylerProperties.window.frame.origin.y + menu.stylerProperties.window.frame.size.height, 996);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.width, 200);
        TKAssertGreaterThanOrEquals(menu.stylerProperties.window.frame.size.height, 480);
        menu.close();
    }

});