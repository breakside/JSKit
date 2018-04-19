// #import "Foundation/Foundation.js"
// #import "UIKit/UIMenuItem.js"
// #import "UIKit/UIApplication.js"
/* global JSClass, JSObject, JSDynamicProperty, JSReadOnlyProperty, UIMenu, UIMenuItem, JSSize, JSColor, JSFont, JSRect, JSPoint, UIWindow, UIMenuWindow, UIMenuView, UIMenuItemView, JSInsets, UIApplication */
'use strict';

(function(){

var defaultTextColor = JSColor.initWithRGBA(51/255, 51/255, 51/255, 1);
var defaultHighlightTextColor = JSColor.initWithRGBA(1, 1, 1, 1);
var defaultDisabledTextColor = JSColor.initWithRGBA(223/255, 223/255, 223/255, 1);
var defaultHighlightColor = JSColor.initWithRGBA(70/255, 153/255, 254/255, 1);
var defaultBackgroundColor = JSColor.initWithRGBA(240/255, 240/255, 240/255, 1);
var defaultBorderColor = JSColor.initWithRGBA(184/255, 184/255, 184/255, 1);

JSClass("UIMenu", JSObject, {

    items: JSReadOnlyProperty('_items', null),
    highlightedItem: JSReadOnlyProperty('_highlightedItem', null),
    showStatusColumn: JSDynamicProperty('_showStatusColumn', true),
    font: JSDynamicProperty('_font', null),
    textColor: JSDynamicProperty('_textColor', defaultTextColor),
    disabledTextColor: JSDynamicProperty('_disabledTextColor', defaultDisabledTextColor),
    highlightedTextColor: JSDynamicProperty('_highlightedTextColor', defaultHighlightTextColor),
    highlightColor: JSDynamicProperty('_highlightColor', defaultHighlightColor),
    backgroundColor: JSDynamicProperty('_backgroundColor', defaultBackgroundColor),
    borderColor: JSDynamicProperty('_borderColor', defaultBorderColor),
    itemInsets: JSDynamicProperty('_itemInsets', null),
    minimumWidth: JSDynamicProperty('_minimumWidth', 48),
    supermenu: null,
    _itemsByTag: null,
    _contextTarget: null,

    _commonInit: function(){
        this._items = [];
        this._itemsByTag = {};
        this._font = JSFont.systemFontOfSize(JSFont.systemFontSize);
        if (this._font !== null){
            this._font = this._font.fontWithWeight(JSFont.Weight.regular);
        }
        this._itemInsets = JSInsets(4, 0);
    },

    init: function(){
        this._commonInit();
    },

    initWithSpec: function(spec, values){
        UIMenu.$super.initWithSpec.call(this, spec, values);
        this._commonInit();
        var item;
        if ('items' in values){
            for (var i = 0, l = values.items.length; i < l; ++i){
                item = UIMenuItem.initWithSpec(spec, values.items[i]);
                this.addItem(item);
            }
        }
    },

    itemWithTag: function(tag){
        return this._itemsByTag[tag] || null;
    },

    addItem: function(item){
        this.insertItemAtIndex(item, this._items.length);
    },

    addItemWithTitle: function(title, action){
        var item = UIMenuItem.initWithTitle(title, action);
        this.addItem(item);
    },

    insertItemAtIndex: function(item, index){
        this.items.splice(index, 0, item);
        item.menu = this;
        if (item.tag !== null){
            this._itemsByTag[item.tag] = item;
        }
        if (item.submenu){
            item.submenu.supermenu = this;
        }
    },

    removeItemWithTag: function(tag){
        var item = this.itemWithTag(tag);
        if (item !== null){
            this.removeItem(item);
        }
    },

    removeItem: function(item){
        for (var i = 0, l = this._items.length; i < l; ++i){
            if (this._items[i] === item){
                if (item.submenu){
                    item.submenu.supermenu = null;
                }
                this.removeItemAtIndex(i);
                break;
            }
        }
    },

    removeItemAtIndex: function(index){
        var item = this._items[index];
        item.menu = null;
        this._items.splice(index, 1);
    },

    updateEnabled: function(){
        this._highlightedItem = null;
        var target;
        var item;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            item.highlighted = false;
            if (!item.submenu){
                target = item.target;
                if (target === null){
                    target = UIApplication.sharedApplication.firstTargetForAction(item.action, this._contextTarget, item);
                }
                item.enabled = target !== null && (!target.canPerformAction || target.canPerformAction(item.action, item));
            }
        }
    },

    performActionForItem: function(item, contextTarget){
        var target = item.target;
        if (target !== null){
            target[item.action](item);
        }else{
            UIApplication.sharedApplication.sendAction(item.action, contextTarget, item);
        }
    },

    _createWindow: function(screen){
        this.updateEnabled();
        var window = UIMenuWindow.init();
        window.setMenu(this);
        return window;
    },

    _showWindow: function(window, isKey){
        if (isKey === undefined){
            isKey = true;
        }
        this.window = window;
        if (isKey){
            this.window.windowServer.makeMenuKeyAndVisible(this);
        }else{
            this.window.windowServer.makeMenuVisible(this);
        }
    },

    _screenMetrics: function(screen){
        var safeFrame = screen.availableFrame.rectWithInsets(4, 7);
        return {
            safeFrame: safeFrame,
            maximumWidth: Math.floor(safeFrame.size.width * 0.3)
        };
    },

    openAdjacentToView: function(view, preferredPlacement){
        if (preferredPlacement === undefined){
            preferredPlacement = UIMenu.Placement.below;
        }
        var window = this._createWindow(view.window.screen);
        var screen = this._screenMetrics(view.window.screen);

        var origin = JSPoint.Zero;
        var size = JSSize(window.frame.size);

        // Limit width to the max screen width
        if (size.width > screen.maximumWidth){
            size.width = screen.maximumWidth;
        }

        // Figure out how much space we have all around the view
        var viewFrame = view.convertRectToScreen(view.bounds);
        var over;
        var spaces = {
            above: viewFrame.origin.y - screen.safeFrame.origin.y,
            below: screen.safeFrame.origin.y + screen.safeFrame.size.height - viewFrame.origin.y - viewFrame.size.height,
            left: viewFrame.origin.x - screen.safeFrame.origin.x,
            right: screen.safeFrame.origin.x + screen.safeFrame.size.width - viewFrame.origin.x - viewFrame.size.width
        };

        if (preferredPlacement == UIMenu.Placement.above){
            if (spaces.above >= size.height){
                // Place above if there's room
                origin.y = viewFrame.origin.y - size.height;
            }else if (spaces.above * 2 > spaces.below){
                // Place above and adjust height if there's not enough room,
                // but the room that is availble is still preferable to below
                origin.y = screen.safeFrame.origin.y;
                size.height = viewFrame.origin.y - origin.y;
            }else if (spaces.below >= size.height){
                // Place below if there's room
                origin.y = viewFrame.origin.y + viewFrame.size.height;
            }else{
                // Place below and adjust height if there's not enough room
                origin.y = viewFrame.origin.y + viewFrame.size.height;
                size.height = screen.safeFrame.origin.y + screen.safeFrame.size.height - origin.y;
            }
            // Prefer to line up with the left edge
            origin.x = viewFrame.origin.x;
        }else if (preferredPlacement == UIMenu.Placement.left){
            if (spaces.left >= size.width || spaces.left > spaces.right){
                // Place to the left if there's enough room, or if there's
                // more room than on the right
                origin.x = viewFrame.origin.x - size.width;
            }else{
                // Place to the right otherwise
                origin.x = viewFrame.origin.x + viewFrame.size.width;
            }
            // Prefer to line up with the top edge
            origin.y = viewFrame.origin.y;
        }else if (preferredPlacement == UIMenu.Placement.right){
            if (spaces.right >= size.width || spaces.right > spaces.left){
                // Place to the right if there's enough room, or if there's more
                // room than on the left
                origin.x = viewFrame.origin.x + viewFrame.size.width;
            }else{
                // Place to the left otherwise
                origin.x = viewFrame.origin.x - size.width;
            }
            // Prefer to line up with the top edge
            origin.y = viewFrame.origin.y;
        }else{
            if (spaces.below >= size.height){
                // Place below if there's enough room
                origin.y = viewFrame.origin.y + viewFrame.size.height;
            }else if (spaces.below * 2 > spaces.above){
                // Place below and adjust height if there's not enough room,
                // but the available room is still preferable to above
                origin.y = viewFrame.origin.y + viewFrame.size.height;
                size.height = screen.safeFrame.origin.y + screen.safeFrame.size.height - origin.y;
            }else if (spaces.above >= size.height){
                // Place above if there's enough room
                origin.y = viewFrame.origin.y - size.height;
            }else{
                // Place above and adjust height if there's not enough room
                origin.y = screen.safeFrame.origin.y;
                size.height = viewFrame.origin.y - origin.y;
            }
            // Prefer to line up iwth the left edge
            origin.x = viewFrame.origin.x;
        }

        // Adjust our x position if we've overflowed either side
        over = origin.x + size.width - screen.safeFrame.origin.x - screen.safeFrame.size.width;
        if (over > 0){
            origin.x -= over;
        }
        if (origin.x < screen.safeFrame.origin.x){
            origin.x = screen.safeFrame.origin.x;
        }

        // Make sure the height is no taller than the safe space
        if (size.height > screen.safeFrame.size.height){
            size.height = screen.safeFrame.size.height;
        }

        // Adjsut the y position if we've overflowed
        // NOTE: y adjustments should not be necessary in the .above and .below
        // cases becuase they set the origin and height to valid values.
        over = origin.y + size.height - screen.safeFrame.origin.y - screen.safeFrame.size.height;
        if (over > 0){
            origin.y -= over;
        }
        if (origin.y < screen.safeFrame.origin.y){
            origin.y = screen.safeFrame.origin.y;
        }

        window.frame = JSRect(origin, size);
        this._showWindow(window);
    },

    openWithItemAtLocationInView: function(targetItem, location, view){
        var window = this._createWindow(view.window.screen);
        var screen = this._screenMetrics(view.window.screen);
        var size = JSSize(window.frame.size);

        // Limit width to the max screen width
        if (size.width > screen.maximumWidth){
            size.width = screen.maximumWidth;
        }

        var locationInScreen = view.convertPointToScreen(location);
        var targetLocation = window.locationOfItem(targetItem);

        // Set our origin so the origin of the target item matches the given location
        var origin = JSPoint(locationInScreen.x - targetLocation.x, locationInScreen.y - targetLocation.y);

        // Adjust our x position if we've overflowed
        var over = origin.x + size.width - screen.safeFrame.origin.x - screen.safeFrame.size.width;
        if (over > 0){
            origin.x -= over;
        }
        if (origin.x < screen.safeFrame.origin.x){
            origin.x = screen.safeFrame.origin.x;
        }

        var offset = JSPoint.Zero;

        // If we extend beyond the top of the safe area, adjust our origin, size, and
        // scroll position so to the target item still lines up
        if (origin.y < screen.safeFrame.origin.y){
            over = screen.safeFrame.origin.y - origin.y;
            origin.y = screen.safeFrame.origin.y;
            if (locationInScreen.y >= screen.safeFrame.origin.y && size.height - over >= 60){
                offset.y = over;
                size.height -= over;
            }
        }

        // If we extend beyond the bottom, adjust our height
        over = origin.y + size.height - screen.safeFrame.origin.y - screen.safeFrame.size.height;
        if (over > 0){
            if ((locationInScreen.y >= screen.safeFrame.origin.y + screen.safeFrame.size.height) || (size.height - over < 60)){
                origin.y = screen.safeFrame.origin.y + screen.safeFrame.size.height - size.height;
            }else{
                size.height -= over;
            }
        }

        window.frame = JSRect(origin, size);
        window.layoutIfNeeded();
        window.contentOffset = offset;
        this._showWindow(window);
    },

    openAtLocationInContextView: function(location, view){
        this._contextTarget = view;
        this._openWithFirstItemRightOfRectInView(JSRect(location, JSSize.Zero), view);
    },

    _openAsSubmenu: function(parentItemView){
        this._contextTarget = this.supermenu._contextTarget;
        this._openWithFirstItemRightOfRectInView(parentItemView.bounds, parentItemView);
    },

    _openWithFirstItemRightOfRectInView: function(rect, view){
        var window = this._createWindow(view.window.screen);
        var screen = this._screenMetrics(view.window.screen);

        var origin = JSPoint.Zero;
        var size = JSSize(window.frame.size);

        // Limit width to the max screen width
        if (size.width > screen.maximumWidth){
            size.width = screen.maximumWidth;
        }

        // Figure out how much space we have on either side of the target rect
        // IMPORTANT: target rect is assumed to leave enough room on at least
        // one side.   In our two uses cases 1) submenus, and 2) context menus,
        // this must be true because 1) a menu is < 1/3 screen wide, leaving
        // at least 1/3 on one side, and 2) context menu rects are Zero size
        var viewFrame = view.convertRectToScreen(rect);

        // If our rect if offscreen to the left or right, move it over
        if (viewFrame.origin.x + viewFrame.size.width < screen.safeFrame.origin.x){
            viewFrame.origin.x = screen.safeFrame.origin.x - viewFrame.size.width;
        }else if (viewFrame.origin.x > screen.safeFrame.origin.x + screen.safeFrame.size.width){
            viewFrame.origin.x = screen.safeFrame.origin.x + screen.safeFrame.size.width;
        }

        // If our rect is offscreen to the top, move it down
        if (viewFrame.origin.y < screen.safeFrame.origin.y){
            viewFrame.origin.y = screen.safeFrame.origin.y;
        }

        var over;

        var spaces = {
            left: viewFrame.origin.x - screen.safeFrame.origin.x,
            right: screen.safeFrame.origin.x + screen.safeFrame.size.width - viewFrame.origin.x - viewFrame.size.width
        };

        // Prefer the right side, but use left if there's not enough space
        if (spaces.right >= size.width){
            origin.x = viewFrame.origin.x + viewFrame.size.width;
        }else{
            origin.x = viewFrame.origin.x - size.width;
        }

        // Prefer the y origin at the top of our rect
        origin.y = viewFrame.origin.y;

        // Adjust the y origin so it is even with the top of the first item
        if (this.items.length > 0){
            // NOTE: assuming no scale factor between window and screen
            // Can't convert point to screen coordinates because the window
            // hasn't been added to a screen yet
            origin.y -= window.locationOfItem(this.items[0]).y;
        }

        // Adjust the height so it's no taller than the safe area
        if (size.height > screen.safeFrame.size.height){
            size.height = screen.safeFrame.size.height;
        }

        // Adjust the y origin up if we'd otherwise overflow
        over = origin.y + size.height - screen.safeFrame.origin.y - screen.safeFrame.size.height;
        if (over > 0){
            origin.y -= over;
        }

        // Make sure the y origin is at least 0
        if (origin.y < screen.safeFrame.origin.y){
            origin.y = screen.safeFrame.origin.y;
        }

        window.frame = JSRect(origin, size);
        this._showWindow(window);
    },

    close: function(){
        this._contextTarget = null;
        this.window.close();
        this.window = null;
    }

});

UIMenu.Placement = {
    below: 0,
    right: 1,
    above: 2,
    left: 3
};

})();