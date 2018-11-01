// #import "UIKit/UIView.js"
// #import "UIKit/UIToolbarItem.js"
/* global JSClass, JSObject, JSInsets, JSDynamicProperty, UIToolbar, UIView, UIToolbarView */
'use strict';

JSClass("UIToolbar", JSObject, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Toolbar

    init: function(){
        this._items = [];
    },

    initWithSpec: function(spec, values){
        UIToolbar.$super.initWithSpec.call(this, spec, values);
        this._items = [];
        var item;
        if ('items' in values){
            for (var i = 0, l = values.items.length; i < l; ++i){
                item = spec.resolvedValue(values.items[i], "UIToolbarItem");
                this.addItem(item);
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Item Management

    items: JSDynamicProperty('_items', null),

    setItems: function(items){
        var i, l;
        for (i = this._items.length; i >= 0; --i){
            this.removeItemAtIndex(i);
        }
        for (i = 0, l = items.length; i < l; ++i){
            this.addItem(items[i]);
        }
    },

    addItem: function(item){
        this.addItemAtIndex(item, this._items.length);
    },

    addItemAtIndex: function(item, index){
        item.toolbar = this;
        this._items.splice(index, 0, item);
    },

    removeItem: function(item){
        var index = this._items.indexOf(item);
        if (index >= 0){
            this.removeItemAtIndex(index);
        }
    },

    removeItemAtIndex: function(index){
        var item = this._items[index];
        item.toolbar = null;
        this._items.splice(index, 1);
    }

});

JSClass("UIToolbarView", UIView, {

    initWithFrame: function(frame){
        UIToolbarView.$super.initWithFrame.call(this, frame);
        this._itemViews = [];
        this._itemInsets = JSInsets(0, 7);
    },
    
    styler: JSDynamicProperty('_styler', null),

    _itemViews: null,
    itemInsets: JSDynamicProperty('_itemInsets', null),

    setItemInsets: function(itemInsets){
        this._itemInsets = JSInsets(itemInsets);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        var bounds = this.bounds.rectWithInsets(this._itemInsets);
        var i, l;
        var itemsWidth = 0;
        var itemView;
        for (i = 0, l = this._itemViews.length; i < l && itemsWidth < bounds.width; ++i){
            itemView = this._itemViews[i];
            itemsWidth += itemView.frame.size.width;
        }
    }

});