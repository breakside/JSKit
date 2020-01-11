// #import "UIView.js"
// #import "UIToolbarItem.js"
// #import "UIButton.js"
// #import "UIImageView.js"
/* global JSClass, JSObject, JSInsets, JSRect, JSImage, JSBundle, JSPoint, JSSize, JSReadOnlyProperty, JSDynamicProperty, JSLazyInitProperty, UIToolbar, UIView, UIToolbarView, UIToolbarItem, UIToolbarItemView, UIButton, UIMenu, UIPopupButton, UIImageView, UIButtonCustomStyler */
'use strict';

(function(){

JSClass("UIToolbar", JSObject, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Toolbar

    init: function(){
        this._items = [];
        this._imageSize = UIToolbar.ImageSize.default;
    },

    initWithSpec: function(spec){
        UIToolbar.$super.initWithSpec.call(this, spec);
        this._items = [];
        var item;
        if (spec.containsKey('imageSize')){
            this._imageSize = spec.valueForKey("imageSize", UIToolbar.ImageSize);
        }else{
            this._imageSize = UIToolbar.ImageSize.default;
        }
        if (spec.containsKey('items')){
            var items = spec.valueForKey("items");
            for (var i = 0, l = items.length; i < l; ++i){
                item = items.valueForKey(i, UIToolbarItem);
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
    },

    // --------------------------------------------------------------------
    // MARK: - Display Options

    showsTitles: JSDynamicProperty('_showsTitles', false),
    imageSize: JSDynamicProperty('_imageSize', 0),

    // --------------------------------------------------------------------
    // MARK: - Window

    window: null,

    // --------------------------------------------------------------------
    // MARK: - Validation

    validateItems: function(){
        var item;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            item.validate();
        }
    }

});

UIToolbar.ImageSize = {
    default: 32,
    small: 24
};

JSClass("UIToolbarView", UIView, {

    stylerProperties: null,

    initWithToolbar: function(toolbar){
        UIToolbarView.$super.init.call(this);
        this.toolbar = toolbar;
    },

    initWithFrame: function(frame){
        UIToolbarView.$super.initWithFrame.call(this, frame);
        this.stylerProperties = {};
        this._itemViews = [];
        this._itemInsets = JSInsets(0, 7);
    },

    toolbar: JSDynamicProperty('_toolbar', null),

    setToolbar: function(toolbar){
        this._toolbar = toolbar;
        var styler = toolbar.window._styler;
        var itemView;
        var i, l;
        for (i = this._itemViews.length - 1; i >= 0; --i){
            itemView = this._itemViews[i];
            itemView.removeFromSuperview();
        }
        this._itemViews = [];
        var size = JSSize.Zero;
        var w, h;
        var item;
        for (i = 0, l = toolbar.items.length; i < l; ++i){
            item = toolbar.items[i];
            if (item.identifier == UIToolbarItem.Identifier.space){
                w = toolbar.imageSize;
                h = 0;
            }else if (item.identifier == UIToolbarItem.Identifier.flexibleSpace){
                w = 0;
                h = 0;
            }else{
                if (item.view){
                    w = item.minimumSize.width;
                    h = item.minimumSize.height;
                }else{
                    w = item.image.size.width * toolbar.imageSize / item.image.size.height;
                    h = toolbar.imageSize;
                }
            }
            if (h > size.height){
                size.height = h;
            }
            size.width += w;
            itemView = UIToolbarItemView.initWithItem(item);
            styler.updateToolbarItemView(itemView);
            this._itemViews.push(itemView);
            this.addSubview(itemView);
        }
        this._minimumItemsSize = size;
    },

    itemViews: JSReadOnlyProperty('_itemViews', null),
    _minimumItemsSize: null,

    overflowButton: JSLazyInitProperty('_createOverflowButton', '_overflowButton'),
    overflowMenu: null,

    _createOverflowButton: function(){
        var windowStyler = this._toolbar.window._styler;
        var styler = UIButtonCustomStyler.initWithColor(windowStyler.toolbarTitleColor);
        var button = UIButton.initWithStyler(styler);
        button.image = images.toolbarOverflow;
        button.addAction("_showOverflowMenu", this);
        this.addSubview(button);
        return button;
    },

    createOverflowMenuAtItemIndex: function(index){
        var overflowItems = [];
        var i, l;
        var item;
        var menuItem;
        var items = this._toolbar.items;
        for (i = index, l = items.length; i < l; ++i){
            item = items[i];
            if (item.identifier == UIToolbarItem.Identifier.custom){
                overflowItems.push(item);
            }
        }
        if (overflowItems.length > 0){
            this.overflowMenu = UIMenu.init();
            for (i = 0, l = overflowItems.length; i < l; ++i){
                item = overflowItems[i];
                if (item.menuFormRepresentation !== null){
                    this.overflowMenu.addItem(item.menuFormRepresentation);
                }else if (item.view !== null && item.view.isKindOfClass(UIPopupButton)){
                    menuItem = this.overflowMenu.addItemWithTitle(item.title);
                    menuItem.submenu = item.view.menu;
                }else{
                    this.overflowMenu.addItemWithTitle(item.title, item.action, item.target);
                }
            }
        }else{
            this.overflowMenu = null;
        }
    },

    showOverflowMenu: function(){
        if (this.overflowMenu === null){
            return;
        }
        this.overflowMenu.openAdjacentToView(this.overflowButton, UIMenu.placement.below);
    },

    itemInsets: JSDynamicProperty('_itemInsets', null),

    setItemInsets: function(itemInsets){
        this._itemInsets = JSInsets(itemInsets);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        this._toolbar.window._styler.layoutToolbarView(this);
    }

});

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    toolbarOverflow: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIToolbarOverflow", this.bundle);
            Object.defineProperty(this, 'toolbarOverflow', {value: image.imageWithRenderingMode(JSImage.RenderMode.template) });
            return this.toolbarOverflow;
        }
    },

});

})();