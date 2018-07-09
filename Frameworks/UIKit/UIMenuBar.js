// #import "UIKit/UIWindow.js"
// #import "UIKit/UIMenu.js"
/* global JSClass, JSObject, JSImage, JSReadOnlyProperty, UIWindowCustomStyler, UILayer, JSPoint, JSBinarySearcher, JSSize, JSLazyInitProperty, UIView, UIWindow, JSDynamicProperty, UIMenuBar, JSRect, JSInsets, UIMenuBarItemCollectionView, UIMenuBarItemView, UIMenuBarItem, UILabel, UIImageView, JSFont, JSTextAlignment, JSColor, UIMenuDefaultStyler, UIMenuBarButton */
'use strict';

JSClass("UIMenuBar", UIWindow, {

    // MARK: - Creating a Menu Bar

    init: function(){
        this._styler = UIWindowCustomStyler.shared;
        UIMenuBar.$super.init.call(this);
        this._commonInit();
    },

    initWithSpec: function(spec, values){
        this._styler = UIWindowCustomStyler.shared;
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
        var i, l, item;
        if ('leftBarItems' in values){
            var leftBarItems = [];
            for (i = 0, l = values.leftBarItems.length; i < l; ++i){
                item = spec.resolvedValue(values.leftBarItems[i]);
                leftBarItems.push(item);
            }
            this.leftBarItems = leftBarItems;
        }
        if ('rightBarItems' in values){
            var rightBarItems = [];
            for (i = 0, l = values.rightBarItems.length; i < l; ++i){
                item = spec.resolvedValue(values.rightBarItems[i]);
                rightBarItems.push(item);
            }
            this.rightBarItems = rightBarItems;
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
        this._clipView = UIView.init();
        this.contentView.addSubview(this._clipView);
        // this.backgroundColor = JSColor.initWithRGBA(1, 1, 1, 0.95);
        this._font = JSFont.systemFontOfSize(JSFont.systemFontSize).fontWithWeight(JSFont.Weight.regular);
        this._textColor = UIMenuDefaultStyler.shared.textColor;
        this._highlightColor = UIMenuDefaultStyler.shared.highlightColor;
        this._highlightedTextColor = UIMenuDefaultStyler.shared.highlightedTextColor;
    },

    // MARK: - Window Properies

    canBecomeKeyWindow: function(){
        return false;
    },

    canBecomeMainWindow: function(){
        return false;
    },

    // MARK: - Style

    isOpaque: true,
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

    primaryMenuItem: null,
    leftBarItems: JSDynamicProperty('_leftBarItems', null),
    rightBarItems: JSDynamicProperty('_rightBarItems', null),
    _menuBarItems: null,
    menu: JSDynamicProperty('_menu', null),
    _highlightedItemView: null,

    setLeftBarItems: function(leftBarItems){
        this._leftBarItems = leftBarItems || [];
        this._updateItemViews(this._leftItemViews, this._leftBarItems, UIMenuBarButton);
        this.setNeedsLayout();
    },

    setRightBarItems: function(rightBarItems){
        this._rightBarItems = rightBarItems || [];
        this._updateItemViews(this._rightItemViews, this._rightBarItems, UIMenuBarButton);
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
        this.primaryMenuItem = this._menuBarItems[0];
        this._updateItemViews(this._menuItemViews, this._menuBarItems, UIMenuBarItemView);
        this.setNeedsLayout();
    },

    _updateItemViews: function(itemViews, items, viewClass){
        var itemView;
        for (var i = 0, l = items.length; i < l; ++i){
            if (i < itemViews.length){
                itemView = itemViews[i];
            }else{
                itemView = viewClass.init();
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
        this._clipView.frame = this.bounds;

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
            // removing delegate first becuase we don't want the close notification;
            // it would disable mouse tracking that we want to keep active so the
            // user can move back over a menu
            this.submenu.delegate = null;
            this.submenu.close();
            this.submenu = null;
            this.makeKey();
        }
        this._highlightedItemView = itemView;
        if (this._highlightedItemView){
            this._highlightedItemView.highlighted = true;
            this.submenu = itemView._item.menu;
            this.submenu.delegate = this;
            this.openMenu(this.submenu, itemView);
        }
    },

    openMenu: function(menu, itemView){
        var window = menu._createWindow();
        window.maskedCorners = UILayer.Corners.maxY;
        var maxWidth = Math.floor(this.screen.frame.size.width * 0.3);
        var safeFrame = this.screen.frame.rectWithInsets(0, 0);
        var origin = JSPoint(itemView.frame.origin);
        var size = JSSize(window.frame.size);
        origin.y += itemView.frame.size.height;

        var over = origin.x + size.width - safeFrame.origin.x - safeFrame.size.width;
        if (over > 0){
            origin.x = origin.x + itemView.frame.size.width - size.width;
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
        window.makeKeyAndVisible();
    },

    menuDidClose: function(menu){
        if (menu === this.submenu){
            this.submenu.delegate = null;
            this.submenu = null;
            this._highlightedItemView.highlighted = false;
            this._highlightedItemView = null;
            this.receivesAllEvents = false;
            this.stopMouseTracking();
        }
    },

    menuDidNavigateLeft: function(menu){
        var itemView;
        for (var i = 0, l = this._menuItemViews.length; i < l; ++i){
            itemView = this._menuItemViews[i];
            if (itemView === this._highlightedItemView){
                this._selectMenuItemView(this._menuItemViews[(i + this._menuItemViews.length - 1) % this._menuItemViews.length]);
                break;
            }
        }
    },

    menuDidNavigateRight: function(menu){
        var itemView;
        for (var i = 0, l = this._menuItemViews.length; i < l; ++i){
            itemView = this._menuItemViews[i];
            if (itemView === this._highlightedItemView){
                this._selectMenuItemView(this._menuItemViews[(i + 1) % this._menuItemViews.length]);
                break;
            }
        }
    },

    hitTest: function(location){
        var edgeItemView = null;
        if (this._leftItemViews.length > 0){
            edgeItemView = this._leftItemViews[0];
        }
        if (edgeItemView !== null && location.x < edgeItemView.convertPointToView(JSPoint(0,0), this).x){
            return edgeItemView;
        }
        if (this._rightItemViews.length > 0){
            edgeItemView = this._rightItemViews[this._rightItemViews.length - 1];
        }
        if (edgeItemView !== null && location.x > edgeItemView.convertPointToView(JSPoint(edgeItemView.bounds.size.width,0), this).x){
            return edgeItemView;
        }
        return UIMenuBar.$super.hitTest.call(this, location);
    },

    _itemDownTimestamp: UIEvent.minimumTimestamp,

    mouseDown: function(event){
        var location = event.locationInView(this);
        var itemView = null;
        if (this._clipView.containsPoint(location)){
            itemView = this._menuItemAtLocation(location);
            if (itemView !== null){
                this.mouseDownOnItemView(itemView, event);
                this.startMouseTracking(UIView.MouseTracking.all);
            }
        }
        if (itemView === null){
            this.stopMouseTracking();
            this.receivesAllEvents = false;
            if (this.submenu){
                this.submenu.closeWithAnimation();
            }
        }
    },

    mouseUp: function(event){
        this.mouseUpOnItemView(null, event);
    },

    mouseDragged: function(event){
        var location = event.locationInView(this._clipView);
        if (this._clipView.containsPoint(location)){
            var itemView = this._menuItemAtLocation(location);
            this._selectMenuItemView(itemView);
        }else{
            this._itemDownTimestamp = UIEvent.minimumTimestamp;
            if (this.submenu){
                this.submenu.window.deepestMenuWindow().mouseDragged(event);
            }
        }
    },

    mouseDownOnItemView: function(itemView, event){
        if (!itemView._item.menu){
            this.stopMouseTracking();
            this.receivesAllEvents = false;
            if (this.submenu){
                this.submenu.close();
            }
            return;
        }
        if (itemView !== this._highlightedItemView){
            this._selectMenuItemView(itemView);
            this._itemDownTimestamp = event.timestamp;
        }
    },

    mouseDraggedOnItemView: function(itemView, event){
        if (!itemView._item.menu){
            return;
        }
        this._itemDownTimestamp = UIEvent.minimumTimestamp;
        if (this.submenu){
            this.submenu.window.deepestMenuWindow().mouseDragged(event);
        }
    },

    mouseUpOnItemView: function(itemView, event){
        if (itemView && !itemView._item.menu){
            return;
        }
        if (event.timestamp - this._itemDownTimestamp < 0.3){
            return;
        }
        var location = event.locationInView(this._clipView);
        if (this._clipView.containsPoint(location)){
            this.stopMouseTracking();
            this.receivesAllEvents = false;
            if (this.submenu){
                this.submenu.closeWithAnimation();
            }
        }else{
            if (this.submenu){
                this.submenu.window.deepestMenuWindow().mouseUp(event);
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
        if (this._highlightedItemView && this._highlightedItemView.isKindOfClass(UIMenuBarButton)){
            return;
        }
        var location = event.locationInView(this._clipView);
        var itemView = this._menuItemAtLocation(location);
        this._selectMenuItemView(itemView);
        // If we've moved away from a menu, its submenu will close,
        // but we want to keep tracking active so the user can move
        // back.  Hoever, if the user does not move back, we need to
        // know to stop tracking.  So in this case with no submenu open,
        // we'll take all events and stop tracking on a mouse down
        this.receivesAllEvents = itemView === null;
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
    },

    keyUp: function(event){
    }

});

JSClass("UIMenuBarItem", JSObject, {
    title: null,
    image: null,
    target: null,
    action: null,
    menu: null,
    tooltip: null,
    customView: null,
    state: JSReadOnlyProperty('_state', 0),
    active: JSDynamicProperty(null, null, 'isActive'),

    initWithSpec: function(spec, values){
        UIMenuBarItem.$super.initWithSpec.call(this, spec, values);
        if ('title' in values){
            this.title = spec.resolvedValue(values.title);
        }
        if ('image' in values){
            this.image = JSImage.initWithResourceName(spec.resolvedValue(values.image), spec.bundle);
        }
        if ('target' in values){
            this.target = spec.resolvedValue(values.target);
        }
        if ('action' in values){
            this.action = values.action;
        }
        if ('customView' in values){
            this.customView = spec.resolvedValue(values.customView);
        }
        if ('tooltip' in values){
            this.tooltip = spec.resolvedValue(values.tooltip);
        }
        if ('menu' in values){
            this.menu = spec.resolvedValue(values.menu);
        }
    },

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

    initWithCustomView: function(customView, action, target){
        this.customView = customView;
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
    _customView: null,
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
        this._imageView = UIImageView.initWithRenderMode(UIImageView.RenderMode.template);
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
        if (!this.customView){
            if (this._titleLabel){
                var font = this._menuBar.font;
                if (this._item === this._menuBar.primaryMenuItem){
                    font = font.fontWithWeight(JSFont.Weight.bold);
                }
                this._titleLabel.font = font;
                this._titleLabel.textColor = textColor;
            }
            if (this._imageView){
                this._imageView.templateColor = textColor;
            }
        }
    },

    setItem: function(item){
        this._item = item;
        this.tooltip = item.tooltip;
        if (item.customView){
            if (this._customView !== null && this._customView !== item.customView){
                this._customView.removeFromSuperview();
            }
            this._customView = item.customView;
            if (this._customView.superview !== this){
                this.addSubview(this._customView);
            }
            if (this._titleLabel !== null){
                this._titleLabel.hidden = true;
            }
            if (this._imageView !== null){
                this._imageView.hidden = true;
            }
        }else{
            if (this._customView !== null){
                this._customView.removeFromSuperview();
            }
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
        }
    },

    sizeToFit: function(){
        if (this._titleLabel){
            this._titleLabel.sizeToFit();
            this.bounds = JSRect(0, 0, this._titleLabel.frame.size.width, this._titleLabel.frame.size.height);
        }else if (this._imageView){
            this._imageView.frame = JSRect(0, 0, this._imageView.image.size.width, this._imageView.image.size.height);
            this.bounds = JSRect(0, 0, this._imageView.frame.size);
        }
    },

    layoutSubviews: function(){
        if (this._titleLabel){
            this._titleLabel.position = JSPoint(Math.floor(this.bounds.size.width / 2.0), Math.floor(this.bounds.size.height / 2.0));
        }
        if (this._imageView){
            this._imageView.position = this.bounds.center;
        }
    }

});

JSClass("UIMenuBarButton", UIMenuBarItemView, {

    mouseDown: function(event){
        this._menuBar.mouseDownOnItemView(this, event);
        if (!this._item.menu){
            this.highlighted = true;
        }
    },

    mouseDragged: function(event){
        this._menuBar.mouseDraggedOnItemView(this, event);
        if (!this._item.menu){
            var location = event.locationInView(this);
            this.highlighted = this.containsPoint(location);
        }
    },

    mouseUp: function(event){
        this._menuBar.mouseUpOnItemView(this, event);
        if (!this._item.menu){
            if (this.highlighted){
                this.highlighted = false;
                this.window.application.sendAction(this._item.action, this._item.target, this._item);
            }
        }
    }

});