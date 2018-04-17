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
    _itemsByTag: null,

    _commonInit: function(){
        this._items = [];
        this._itemsByTag = {};
        this._font = JSFont.systemFontOfSize(JSFont.systemFontSize).fontWithWeight(JSFont.Weight.regular);
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

    insertItemAtIndex: function(item, index){
        this.items.splice(index, 0, item);
        item.menu = this;
        if (item.tag !== null){
            this._itemsByTag[item.tag] = item;
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
        var firstResponder = UIApplication.sharedApplication.mainWindow.firstResponder;
        var item;
        var target;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            if (!item.submenu){
                target = item.target;
                if (target === null){
                    target = firstResponder.targetForAction(item.action, item);
                }
                item.enabled = target !== null && (!target.canPerformAction || target.canPerformAction(item.action, item));
            }
        }
    },

    openAtLocationInView: function(location, view){
        this.openWithItemAtLocationInView(null, location, view);
    },

    openWithItemAtLocationInView: function(targetItem, location, view){
        this.updateEnabled();
        this.window = UIMenuWindow.init();
        this.window.setMenu(this);

        var origin = view.convertPointToView(location, null);
        var itemLocation = this.window.locationOfItem(targetItem);
        origin.x -= itemLocation.x;
        origin.y -= itemLocation.y;

        var screen = view.window.screen;
        var safeFrame = screen.availableFrame.rectWithInsets(0, 7);
        var maximumWidth = view.window.screen.frame.size.width * 0.3;

        var size = JSSize(this.window.frame.size);
        if (size.width < this.minimumWidth){
            size.width = this.minimumWidth;
        }
        if (size.width > maximumWidth){
            size.width = maximumWidth;
        }
        if (origin.y < safeFrame.origin.y){
            this.window.setContentOffset(JSPoint(0, safeFrame.origin.y - origin.y));
            origin.y = safeFrame.origin.y;
        }
        if (origin.y + size.height > safeFrame.origin.y + safeFrame.size.height){
            size.height = safeFrame.origin.y + safeFrame.size.height - origin.y;
        }

        this.window.frame = JSRect(origin, size);
        this.window.makeKeyAndVisible();
    },

    close: function(){
        this.window.close();
        this.window = null;
    }

});

})();