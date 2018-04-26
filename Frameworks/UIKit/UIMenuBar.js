// #import "UIKit/UIView.js"
// #import "UIKit/UIMenu.js"
/* global JSClass, JSObject, UIView, JSDynamicProperty, UIMenuBar, JSRect, JSInsets */
'use strict';

JSClass("UIMenuBar", UIView, {

    // MARK: - Style

    backgroundColor: JSDynamicProperty('_backgroundColor', null),
    highlightColor: JSDynamicProperty('_backgroundColor', null),
    textColor: JSDynamicProperty('_textColor', null),
    highlightedTextColor: JSDynamicProperty('_highlightedTextColor', null),
    font: JSDynamicProperty('_font', null),
    itemPadding: JSDynamicProperty('_itemPadding', null),

    // MARK: - Items

    leftItems: JSDynamicProperty('_leftItems', null),
    rightItems: JSDynamicProperty('_rightItems', null),
    menu: JSDynamicProperty('_menu', null),

    _leftView: null,
    _rightView: null,
    _menuView: null,

    init: function(){
        UIMenuBar.$super.initWithFrame.call(this, JSRect(0, 0, 600, 20));
        this._itemPadding = JSInsets(2, 7);
        this._leftItems = [];
        this._rightItems = [];
    },

    setLeftItems: function(leftItems){
        this._leftItems = leftItems;
        this._leftView.reload();
        this.setNeedsLayout();
    },

    setRightItems: function(rightItems){
        this._rightItems = rightItems;
        this._rightView.reload();
        this.setNeedsLayout();
    },

    setMenu: function(menu){
        this._menu = menu;
        this._menuView.reload();
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        this._leftView.sizeToFit();
    },

});

JSClass("UIMenuBarItem", JSObject, {
    title: null,
    image: null,
    target: null,
    action: null,

    initWithTitle: function(title, action, target){
        this.title = title;
        this.action = action || null;
        this.target = target || null;
    },

    initWithImage: function(image, action, target){
        this.image = image;
        this.action = action || null;
        this.target = target || null;
    },

    performAction: function(){
        this.action.call(this.target, this);
    }

});

JSClass("UIMenuBarItemCollectionView", UIView, {

    itemViews: null,

    initWithFrame: function(){
    },

    sizeToFit: function(){
    }

});

JSClass("UIMenuBarItemView", UIView, {

    titleLabel: null,
    imageView: null,

    setItem: function(item){
        this.titleLabel.text = item.title || '';
        this.imageView.image = item.image;
    },

    sizeToFit: function(){
    },

    layoutSubviews: function(){
    },

    mouseDown: function(event){
        // TODO: perform action
    },

    mouseEntered: function(event){
    },

});