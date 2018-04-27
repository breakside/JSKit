// #import "UIKit/UIWindow.js"
// #import "UIKit/UIMenu.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSPoint, JSConstraintBox, JSBinarySearcher, JSSize, JSLazyInitProperty, UIView, UIWindow, JSDynamicProperty, UIMenuBar, JSRect, JSInsets, UIMenuBarItemCollectionView, UIMenuBarItemView, UIMenuBarItem, UILabel, UIImageView, JSFont, JSTextAlignment, JSColor, UIMenuDefaultStyler, UILayerCornerRadii */
'use strict';

JSClass("UIMenuBar", UIWindow, {

    // MARK: - Creating a Menu Bar

    init: function(){
        UIMenuBar.$super.init.call(this);
        this._commonInit();
    },

    initWithSpec: function(spec, values){
        UIMenuBar.$super.initWithSpec.call(this, spec, values);
        this._commonInit();
        if ('highlightColor' in values){
            this._highlightColor = spec.resolvedValue(values.highlightColor);
        }
        if ('textColor' in values){
            this._textColor = spec.resolvedValue(values.textColor);
        }
        if ('highlightedTextColor' in values){
            this._highlightedTextColor = spec.resolvedValue(values.highlightedTextColor);
        }
        if ('font' in values){
            this._font = JSFont.initWithSpec(spec, values.font);
        }
        if ('menu' in values){
            this.menu = spec.resolvedValue(values.menu);
        }
    },

    _commonInit: function(){
        this._itemPadding = JSInsets(3, 7);
        this._edgeInsets = JSInsets(0, 10);
        this._leftBarItems = [];
        this._rightBarItems = [];
        this._menuBarItems = [];
        this._leftItemViews = [];
        this._rightItemViews = [];
        this._menuItemViews = [];
        this.contentView = UIView.init();
        this._clipView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        this.contentView.addSubview(this._clipView);
        // this.backgroundColor = JSColor.initWithRGBA(1, 1, 1, 0.95);
        this._font = JSFont.systemFontOfSize(14).fontWithWeight(JSFont.Weight.regular);
        this._textColor = UIMenuDefaultStyler.shared.textColor;
        this._highlightColor = UIMenuDefaultStyler.shared.highlightColor;
        this._highlightedTextColor = UIMenuDefaultStyler.shared.highlightedTextColor;
    },

    // MARK: - Window Properies

    canBecomeKeyWindow: function(){
        return true;
    },

    canBecomeMainWindow: function(){
        return false;
    },

    // MARK: - Style

    highlightColor: JSDynamicProperty('_highlightColor', null),
    textColor: JSDynamicProperty('_textColor', null),
    highlightedTextColor: JSDynamicProperty('_highlightedTextColor', null),
    font: JSDynamicProperty('_font', null),
    itemPadding: JSDynamicProperty('_itemPadding', null),
    edgeInsets: JSDynamicProperty('_edgeInsets', null),
    shouldReceiveTrackingInBack: true,
    level: UIWindow.Level.front,

    setFont: function(font){
        this._font = font;
        this._updateItemViewStyles(this._leftItemViews);
        this._updateItemViewStyles(this._rightItemViews);
        this._updateItemViewStyles(this._menuItemViews);
        this.setNeedsLayout();
    },

    // MARK: - Items

    leftBarItems: JSDynamicProperty('_leftBarItems', null),
    rightItems: JSDynamicProperty('_rightBarItems', null),
    _menuBarItems: null,
    menu: JSDynamicProperty('_menu', null),
    _highlightedItemView: null,

    setLeftItems: function(leftBarItems){
        this._leftBarItems = leftBarItems || [];
        this._updateItemViews(this._leftItemViews, this._leftBarItems);
        this.setNeedsLayout();
    },

    setRightItems: function(rightItems){
        this._rightBarItems = rightItems || [];
        this._updateItemViews(this._rightItemViews, this._rightBarItems);
        this.setNeedsLayout();
    },

    setMenu: function(menu){
        this._menu = menu;
        this._menuBarItems = [];
        var menuItem;
        var barItem;
        for (var i = 0, l = menu.items.length; i < l; ++i){
            menuItem = menu.items[i];
            barItem = UIMenuBarItem.initWithTitle(menuItem.title);
            barItem.menu = menuItem.submenu;
            this._menuBarItems.push(barItem);
        }
        this._updateItemViews(this._menuItemViews, this._menuBarItems);
        this.setNeedsLayout();
    },

    _updateItemViews: function(itemViews, items){
        var itemView;
        for (var i = 0, l = items.length; i < l; ++i){
            if (i < itemViews.length){
                itemView = itemViews[i];
            }else{
                itemView = UIMenuBarItemView.init();
                itemView._menuBar = this;
                itemViews.push(itemView);
                this._clipView.addSubview(itemView);
            }
            itemView.setItem(items[i]);
            itemView.update();
        }
        for (var j = itemViews.length - 1; j >= i; --j){
            itemViews[j]._menuBar = null;
            itemViews[j].removeFromSuperview();
            itemViews.pop();
        }
    },

    _updateItemViewStyles: function(itemViews){
        for (var i = 0, l = itemViews.length; i < l; ++i){
            itemViews[i].update();
        }
    },

    // MARK: - Views & Layout

    _leftItemViews: null,
    _menuItemViews: null,
    _rightItemViews: null,
    submenu: null,

    layoutSubviews: function(){
        UIMenuBar.$super.layoutSubviews.call(this);
        var height = this._font.displayLineHeight + this._itemPadding.top + this._itemPadding.bottom;
        this.bounds = JSRect(0, 0, this.bounds.size.width, height);
        if (this.constraintBox && this.constraintBox.height){
            this.constraintBox.height = height;
        }

        var leftWidth = 0;
        var rightWidth = 0;
        var menuWidth = 0;

        var itemView;
        var itemWidth;
        var i, l;
        var x = this._edgeInsets.left;
        for (i = 0, l = this._leftItemViews.length; i < l; ++i){
            itemView = this._leftItemViews[i];
            itemView.sizeToFit();
            itemWidth = itemView.frame.size.width + this._itemPadding.left + this._itemPadding.right;
            itemView.frame = JSRect(x, 0, itemWidth, height);
            x += itemWidth;
        }
        leftWidth = x;
        for (i = 0, l = this._menuItemViews.length; i < l; ++i){
            itemView = this._menuItemViews[i];
            itemView.sizeToFit();
            itemWidth = itemView.frame.size.width + this._itemPadding.left + this._itemPadding.right;
            itemView.frame = JSRect(x, 0, itemWidth, height);
            x += itemWidth;
        }
        menuWidth = x - leftWidth;
        for (i = 0, l = this._rightItemViews.length; i < l; ++i){
            itemView = this._rightItemViews[i];
            itemView.sizeToFit();
            itemWidth = itemView.frame.size.width + this._itemPadding.left + this._itemPadding.right;
            itemView.frame = JSRect(x, 0, itemWidth, height);
            x += itemWidth;
        }
        rightWidth = x - menuWidth - leftWidth;
        var spacing = this.bounds.size.width - this._edgeInsets.right - x;
        if (spacing > 0){
            for (i = 0, l = this._rightItemViews.length; i < l; ++i){
                itemView = this._rightItemViews[i];
                itemView.position = JSPoint(itemView.position.x + spacing, itemView.position.y);
            }
        }else if (spacing < 0){
            // TODO: show overflow indicator
        }
    },

    setItemPadding: function(itemPadding){
        this._itemPadding = JSInsets(itemPadding);
        this.setNeedsLayout();
    },

    // MARK: - Actions

    _selectMenuItemView: function(itemView){
        if (itemView === this._highlightedItemView){
            return;
        }
        if (this._highlightedItemView){
            this._highlightedItemView.highlighted = false;
        }
        if (this.submenu !== null){
            this.submenu.close();
        }
        this._highlightedItemView = itemView;
        if (this._highlightedItemView){
            this._highlightedItemView.highlighted = true;
            this.submenu = itemView._item.menu;
            this.submenu.delegate = this;
            this.openMenu(this.submenu, itemView);
            this.startMouseTracking(UIView.MouseTracking.all);
        }
    },

    openMenu: function(menu, itemView){
        var window = menu._createWindow();
        if (window.layer.cornerRadius){
            window.layer.cornerRadii = UILayerCornerRadii(0, 0, window.layer.cornerRadius, window.layer.cornerRadius);
        }
        var maxWidth = Math.floor(this.screen.frame.size.width * 0.3);
        var safeFrame = this.screen.frame.rectWithInsets(0, 0);
        var origin = JSPoint(itemView.frame.origin);
        var size = JSSize(window.frame.size);
        origin.y += itemView.frame.size.height;

        var over = origin.x + size.width - safeFrame.origin.x - safeFrame.size.width;
        if (over > 0){
            origin.x -= over;
        }
        if (origin.x < safeFrame.origin.x){
            origin.x = safeFrame.origin.x;
        }

        over = origin.y + size.height - safeFrame.origin.y - safeFrame.size.height;
        if (over > 0){
            size.height -= over;
        }
        menu.window = window;
        window.frame = JSRect(origin, size);
        window.makeVisible();
    },

    menuDidClose: function(menu){
        if (menu === this.submenu){
            this.submenu = null;
            this._highlightedItemView.highlighted = false;
            this._highlightedItemView = null;
            this.stopMouseTracking();
        }
    },

    _itemDownTimestamp: 0,

    mouseDown: function(event){
        var location = event.locationInView(this);
        if (this._clipView.containsPoint(location)){
            var itemView = this._menuItemAtLocation(location);
            if (itemView !== null){
                if (itemView !== this._highlightedItemView){
                    this._itemDownTimestamp = event.timestamp;
                    this._selectMenuItemView(itemView);
                }
            }
        }
    },

    mouseUp: function(event){
        if (event.timestamp - this._itemDownTimestamp < 0.3){
            return;
        }
        var location = event.locationInView(this._clipView);
        if (this._clipView.containsPoint(location)){
            if (this.submenu){
                this.stopMouseTracking();
                this.submenu.closeWithAnimation();
            }
        }else{
            if (this.submenu){
                this.submenu.window.deepestMenuWindow().mouseUp(event);
            }
        }
    },

    mouseDragged: function(event){
        var location = event.locationInView(this._clipView);
        if (this._clipView.containsPoint(location)){
            var itemView = this._menuItemAtLocation(location);
            this._selectMenuItemView(itemView);
        }else{
            this._itemDownTimestamp = 0;
            if (this.submenu){
                this.submenu.window.deepestMenuWindow().mouseDragged(event);
            }
        }
    },

    moveEntered: function(event){
    },

    mouseExited: function(event){
    },

    mouseMoved: function(event){
        if (this.mouseTrackingType === UIView.MouseTracking.none){
            return;
        }
        var location = event.locationInView(this._clipView);
        var itemView = this._menuItemAtLocation(location);
        this._selectMenuItemView(itemView);
    },

    _menuItemAtLocation: function(location){
        if (this._menuItemViews.length === 0){
            return null;
        }
        var comparator = function(x, itemView){
            if (x < itemView.frame.origin.x){
                return -1;
            }
            if (x >= itemView.frame.origin.x + itemView.frame.size.width){
                return 1;
            }
            return 0;
        };
        var searcher = new JSBinarySearcher(this._menuItemViews, comparator);
        var index = searcher.insertionIndexForValue(location.x);
        if (index === 0){
            if (this._leftItemViews.length > 0 && this._menuItemViews[0].frame.origin.x > location.x){
                return null;
            }
        }
        if (index >= this._menuItemViews.length){
            return null;
        }
        return this._menuItemViews[index];
    },

    keyDown: function(event){
        // TODO: keyboard navigation
    }

});

JSClass("UIMenuBarItem", JSObject, {
    title: null,
    image: null,
    target: null,
    action: null,
    menu: null,
    state: JSReadOnlyProperty('_state', 0),
    active: JSDynamicProperty(null, null, 'isActive'),

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
    },

    _toggleState: function(flag, on){
        if (on){
            this._state |= flag;
        }else{
            this._state &= ~flag;
        }
    },

    isActive: function(){
        return (this._state & UIMenuBarItem.State.active) === UIMenuBarItem.State.active;
    },

    setActive: function(active){
        this._toggleState(UIMenuBarItem.State.active, active);
    }

});

UIMenuBarItem.State = {
    normal: 0,
    active: 1 << 0
};

JSClass("UIMenuBarItemView", UIView, {

    titleLabel: JSLazyInitProperty('_createTitleLabel'),
    imageView: JSLazyInitProperty('_createImageView'),
    _item: null,
    _menuBar: null,
    _titleLabel: null,
    _imageView: null,
    highlighted: JSDynamicProperty('_isHighlighted', false, 'isHighlighted'),

    init: function(){
        UIMenuBarItemView.$super.init.call(this);
    },

    _createTitleLabel: function(){
        this._titleLabel = UILabel.init();
        this.addSubview(this._titleLabel);
        return this._titleLabel;
    },

    _createImageView: function(){
        this._imageView = UIImageView.init();
        this.addSubview(this._imageView);
        return this._imageView;
    },

    setHighlighted: function(isHighlighted){
        this._isHighlighted = isHighlighted;
        this.update();
    },

    update: function(){
        var textColor = this._menuBar.textColor;
        if (this._isHighlighted){
            textColor = this._menuBar.highlightedTextColor;
            this.backgroundColor = this._menuBar.highlightColor;
        }else{
            this.backgroundColor = null;
        }
        if (this._titleLabel){
            this._titleLabel.font = this._menuBar.font;
            this._titleLabel.textColor = textColor;
        }
        if (this._imageView){
            this._imageView.templateColor = textColor;
        }
    },

    setItem: function(item){
        this._item = item;
        if (item.title){
            this.titleLabel.hidden = false;
            this.titleLabel.text = item.title;
        }else if (this._titleLabel !== null){
            this._titleLabel.hidden = true;
        }
        if (item.image){
            this.imageView.hidden = false;
            this.imageView.image = item.image;
        }else if (this._imageView !== null){
            this._imageView.hidden = true;
        }
    },

    sizeToFit: function(){
        if (this._titleLabel){
            this._titleLabel.sizeToFit();
            this.bounds = JSRect(0, 0, this._titleLabel.frame.size.width, this._titleLabel.frame.size.height);
        }
    },

    layoutSubviews: function(){
        if (this._titleLabel){
            this._titleLabel.position = JSPoint(Math.floor(this.bounds.size.width / 2.0), Math.floor(this.bounds.size.height / 2.0));
        }
    }

});