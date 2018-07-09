// #import "UIKit/UIMenu.js"
// #import "UIKit/UIMenuItem.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, JSLazyInitProperty, JSReadOnlyProperty, JSDynamicProperty, UIEvent, UIWindow, UIMenu, UIView, JSColor, JSSize, JSRect, UILabel, UIImageView, UIMenuItem, JSTextAlignment, JSInsets, JSPoint, UILayer, UIMenuWindow, UIMenuView, UIMenuItemView, JSBinarySearcher, JSTimer, JSURL, JSImage, JSBundle, UIMenuItemSeparatorView, UIWindowCustomStyler */
'use strict';

(function(){

JSClass("UIMenuWindow", UIWindow, {

    clipView: null,
    menuView: null,
    upIndicatorView: null,
    downIndicatorView: null,
    upIndicatorImageView: null,
    downIndicatorImageView: null,
    contentSize: JSReadOnlyProperty(),
    contentOffset: JSDynamicProperty(),
    responder: null,
    submenu: null,
    submenuTimer: null,
    _menuStyler: null,
    _menu: null,
    _itemIndexesByItemViewId: null,
    _itemViewIndexesByItemId: null,
    _scrollTimer: null,
    _scrollDistance: 0,
    _isShowingAlternates: false,
    _isClosing: false,
    receivesAllEvents: true,

    // -----------------------------------------------------------------------
    // MARK: - Creating a Menu Window

    initWithMenu: function(menu){
        this._styler = UIWindowCustomStyler.shared;
        UIMenuWindow.$super.init.call(this);
        this._menuStyler = menu.styler;
        this.contentView = UIView.init();
        this.upIndicatorView = UIView.init();
        this.upIndicatorImageView = UIImageView.initWithImage(images.scrollUp, UIImageView.RenderMode.template);
        this.upIndicatorView.addSubview(this.upIndicatorImageView);
        this.downIndicatorView = UIView.init();
        this.downIndicatorImageView = UIImageView.initWithImage(images.scrollDown, UIImageView.RenderMode.template);
        this.downIndicatorView.addSubview(this.downIndicatorImageView);
        this.clipView = UIView.init();
        this.menuView = UIMenuView.init();
        this.contentView.addSubview(this.clipView);
        this.clipView.addSubview(this.menuView);
        this.contentView.addSubview(this.upIndicatorView);
        this.contentView.addSubview(this.downIndicatorView);
        this.upIndicatorView.hidden = true;
        this.downIndicatorView.hidden = true;
        this._itemIndexesByItemViewId = {};
        this._itemViewIndexesByItemId = {};
        this.setMenu(menu);
    },

    // -----------------------------------------------------------------------
    // MARK: - Window Behavior

    canBecomeMainWindow: function(){
        // Since menus are basically like modal panels, we never want to be the
        // main view, or take visual focus away from the main view that opened us.
        return false;
    },

    didBecomeVisible: function(){
        UIMenuWindow.$super.didBecomeVisible.call(this);
        var event = this.windowServer.activeEvent;
        if (event !== null && event.type == UIEvent.Type.leftMouseDown){
            var location = event.locationInView(this);
            this._adjustHighlightForLocation(location);
            this._itemDownTimestamp = event.timestamp;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Upating the Window Contents

    setMenu: function(menu){
        this._menu = menu;
        this._menuStyler.initializeMenu(menu, this);
        var item;
        var itemView;
        var menuSize = JSSize.Zero;
        // TODO: optimize by only drawing those views that fill the screen
        // We don't need to know the true height because we aren't showing a
        // scroll bar, only indicators that there is more.
        // Although, a UI that uses very long menus is poorly designed, so this
        // is a low priority
        for (var i = 0, l = menu.items.length; i < l; ++i){
            item = menu.items[i];
            if (!item.hidden){
                this._itemViewIndexesByItemId[item.objectID] = this.menuView.itemViews.length;
                itemView = this.menuView.addViewForItem(item);
                itemView.sizeToFit();
                if (!item.alternate){
                    menuSize.height += itemView.frame.size.height;
                }
                if (itemView.frame.size.width > menuSize.width){
                    menuSize.width = itemView.frame.size.width;
                }
                this._itemIndexesByItemViewId[itemView.objectID] = i;
            }
        }
        this.menuView.bounds = JSRect(JSPoint.Zero, menuSize);
        this.menuView.layoutIfNeeded();
        this.layoutIfNeeded();
        this.bounds = JSRect(0, 0, menuSize.width, menuSize.height + this.contentView.bounds.size.height - this.clipView.frame.size.height);
        this.layoutIfNeeded();
        this.startMouseTracking(UIView.MouseTracking.all);
    },

    // -----------------------------------------------------------------------
    // MARK: - Showing/Hiding Alternate Menu Items

    setAlternateItemsShown: function(shown){
        if (this._menu.supermenu && this._menu.supermenu.window){
            this._menu.supermenu.window.setAlternateItemsShown(shown);
        }
        var item;
        var itemView;
        var previousItem = this._menu.items[0];
        for (var i = 1, l = this._menu.items.length; i < l; ++i){
            item = this._menu.items[i];
            if (item.alternate){
                if (shown && previousItem === this._menu.highlightedItem){
                    this._highlightItem(item);
                }else if (!shown && item === this._menu.highlightedItem){
                    this._highlightItem(previousItem);
                }
                itemView = this.menuView.itemViews[this._itemViewIndexesByItemId[previousItem.objectID]];
                itemView.hidden = shown;
                itemView = this.menuView.itemViews[this._itemViewIndexesByItemId[item.objectID]];
                itemView.hidden = !shown;
            }
            previousItem = item;
        }
        this._isShowingAlternates = shown;
    },

    // -----------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        UIMenuWindow.$super.layoutSubviews.call(this);
        this._menuStyler.layoutMenuWindow(this);
        this.contentView.layoutIfNeeded();
        this.menuView.frame = JSRect(0, 0, this.clipView.bounds.size.width, this.menuView.frame.size.height);
        var offset = this.contentOffset;
        this.upIndicatorView.hidden = offset.y <= 0;
        this.downIndicatorView.hidden = offset.y >= this.menuView.frame.size.height - this.clipView.bounds.size.height;
    },

    locationOfItem: function(item){
        var targetView = this;
        if (item !== null && item !== undefined){
            var itemViewIndex = this._itemViewIndexesByItemId[item.objectID];
            targetView = this.menuView.itemViews[itemViewIndex];
        }
        return this.convertPointFromView(JSPoint.Zero, targetView);
    },

    // -----------------------------------------------------------------------
    // MARK: - Scrolling

    getContentSize: function(){
        return this.menuView.frame.size;
    },

    getContentOffset: function(){
        return this.clipView.bounds.origin;
    },

    setContentOffset: function(offset){
        var y = offset.y;
        if (y < 0){
            y = 0;
        }
        if (y > this.menuView.frame.size.height - this.clipView.bounds.size.height){
            y = this.menuView.frame.size.height - this.clipView.bounds.size.height;
        }
        this.clipView.bounds = JSRect(JSPoint(0, y), this.clipView.bounds.size);
        this.upIndicatorView.hidden = y <= 0;
        this.downIndicatorView.hidden = y >= this.menuView.frame.size.height - this.clipView.bounds.size.height;
    },

    _scrollUp: function(){
        var offset = this.contentOffset;
        if (offset.y <= 10){
            this.contentOffset = JSPoint(0, 0);
            this._scrollTimer.invalidate();
            this._scrollTimer = null;
            this._adjustHighlightForLocation(this._lastMoveLocation);
        }else{
            this.contentOffset = JSPoint(0, offset.y - 10);
        }
    },

    _scrollDown: function(){
        var offset = this.contentOffset;
        var end = this.contentSize.height - this.clipView.bounds.size.height;
        if (offset.y > end - 10){
            this.contentOffset = JSPoint(0, end);
            this._scrollTimer.invalidate();
            this._scrollTimer = null;
            this._adjustHighlightForLocation(this._lastMoveLocation);
        }else{
            this.contentOffset = JSPoint(0, offset.y + 10);
        }
    },

    _scrollItemVisible: function(item){
        var itemView = this.menuView.itemViews[this._itemViewIndexesByItemId[item.objectID]];
        var frame = this.contentView.convertRectFromView(itemView.bounds, itemView);
        var offset = this.contentOffset;
        var distance = 0;
        if (!this.upIndicatorView.hidden){
             distance = this.upIndicatorView.frame.origin.y + this.upIndicatorView.frame.size.height - frame.origin.y;
             if (distance > 0){
                this.contentOffset = JSPoint(0, offset.y - distance);
             }
        }
        if (!this.downIndicatorView.hidden){
            distance = frame.origin.y + frame.size.height - this.downIndicatorView.frame.origin.y;
            if (distance > 0){
                this.contentOffset = JSPoint(0, offset.y + distance);
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Tracking

    shouldReceiveTrackingInBack: true,

    mouseMoved: function(event){
        this._lastMoveLocation = event.locationInView(this);
        this._adjustHighlightForLocation(this._lastMoveLocation);
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        this._lastMoveLocation = event.locationInView(this);
        this._adjustHighlightForLocation(this._lastMoveLocation);
        if (!this.containsPoint(location)){
            if (this._menu.supermenu !== null && this._menu.supermenu.window !== null){
                this._menu.supermenu.window.mouseDragged(event);
            }
        }
    },

    mouseExited: function(event){
        if (!this.submenu){
            this._highlightItem(null);
        }
        if (this._scrollTimer){
            this._scrollTimer.invalidate();
            this._scrollTimer = null;
        }
    },

    mouseEntered: function(event){
        this.makeKey();
        this._lastMoveLocation = event.locationInView(this);
        this._adjustHighlightForLocation(this._lastMoveLocation);
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Events

    _itemDownTimestamp: 0,

    mouseUp: function(event){
        if (event.timestamp - this._itemDownTimestamp < 0.2){
            return;
        }
        if (this._isClosing){
            return;
        }
        var location = event.locationInView(this);
        if (this.containsPoint(location)){
            this._performActionForHighlightedItem();
        }else{
            if (this._menu.supermenu && this._menu.supermenu.window){
                this._menu.supermenu.window.mouseUp(event);
            }else{
                this.closeAll();
            }
        }
    },

    mouseDown: function(event){
        if (this._isClosing){
            return;
        }
        var location = event.locationInView(this);
        if (!this.containsPoint(location)){
            if (this._menu.supermenu && this._menu.supermenu.window){
                this._menu.supermenu.window.mouseDown(event);
            }else{
                this.closeAll();
            }
        }else{
            this._lastMoveLocation = event.locationInView(this);
            this._adjustHighlightForLocation(this._lastMoveLocation);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Key Events

    keyDown: function(event){
        if (this._isClosing){
            return;
        }
        // FIXME: find a better way of checking than using code 18
        if (event.keyCode == 18){
            this.setAlternateItemsShown(true);
        }else if (event.keyCode == 27){
            this.closeAll();
        }else if (event.keyCode == 38){
            this._highlightPreviousItem();
        }else if (event.keyCode == 40){
            this._highlightNextItem();
        }else if (event.keyCode == 39){
            if (this._menu.highlightedItem && this._menu.highlightedItem.submenu){
                this.openHighlightedSubmenu(true);
            }else{
                if (this._menu.delegate && this._menu.delegate.menuDidNavigateRight){
                    this._menu.delegate.menuDidNavigateRight(this._menu);
                }
            }
        }else if (event.keyCode == 37){
            if (this._menu.supermenu && this._menu.supermenu.window){
                this._menu.close();
            }else{
                if (this._menu.delegate && this._menu.delegate.menuDidNavigateRight){
                    this._menu.delegate.menuDidNavigateLeft(this._menu);
                }
            }
        }else if (event.keyCode == 13){
            this._performActionForHighlightedItem(true);
        }
        // TODO: select by typing title
    },

    keyUp: function(event){
        if (this._isClosing){
            return;
        }
        // FIXME: find a better way of checking than using code 18
        if (event.keyCode == 18){
            this.setAlternateItemsShown(false);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Item Highlighting

    _highlightItem: function(item, openingSubmenu){
        if (this._menu.highlightedItem !== item){
            this._itemDownTimestamp = UIEvent.minimumTimestamp;
            if (this._menu.highlightedItem !== null){
                this._menu.highlightedItem.highlighted = false;
                this.menuView.itemViews[this._itemViewIndexesByItemId[this._menu.highlightedItem.objectID]].setItem(this._menu.highlightedItem);
                if (this._menu.highlightedItem.submenu){
                    if (this.submenu !== null){
                        this.submenu.close();
                        this.submenu = null;
                    }else if (this.submenuTimer !== null){
                        this.submenuTimer.invalidate();
                        this.submenuTimer = null;
                    }
                }
            }
            this._menu._highlightedItem = item;
            if (this._menu.highlightedItem !== null){
                this._menu.highlightedItem.highlighted = true;
                this.menuView.itemViews[this._itemViewIndexesByItemId[item.objectID]].setItem(this._menu.highlightedItem);
                if (this._menu.highlightedItem.submenu && openingSubmenu){
                    this.submenuTimer = JSTimer.scheduledTimerWithInterval(0.3, this.openHighlightedSubmenu, this);
                }
            }
        }
    },

    _highlightPreviousItem: function(){
        var index = this._menu.items.length;
        if (this._menu.highlightedItem !== null){
            var itemView = this.menuView.itemViews[this._itemViewIndexesByItemId[this._menu.highlightedItem.objectID]];
            index = this._itemIndexesByItemViewId[itemView.objectID];
        }
        var item;
        --index;
        for (; index >= 0; --index){
            item = this._menu.items[index];
            if (item.enabled && !item.hidden && (this._isShowingAlternates || !item.alternate)){
                this._highlightItem(item);
                this._scrollItemVisible(item);
                break;
            }
        }
    },

    _highlightNextItem: function(){
        var index = -1;
        if (this._menu.highlightedItem !== null){
            var itemView = this.menuView.itemViews[this._itemViewIndexesByItemId[this._menu.highlightedItem.objectID]];
            index = this._itemIndexesByItemViewId[itemView.objectID];
        }
        var item;
        ++index;
        for (; index < this._menu.items.length; ++index){
            item = this._menu.items[index];
            if (item.enabled && !item.hidden && (this._isShowingAlternates || !item.alternate)){
                this._highlightItem(item);
                this._scrollItemVisible(item);
                break;
            }
        }
    },

    _adjustHighlightForLocation: function(location){
        var subviewLocation;
        var highlightedItem = null;
        var itemView;
        var item;
        subviewLocation = this.convertPointToView(location, this.upIndicatorView);
        if (!this.upIndicatorView.hidden && this.upIndicatorView.containsPoint(subviewLocation)){
            if (this._scrollTimer === null){
                this._scrollTimer = JSTimer.scheduledRepeatingTimerWithInterval(0.1, this._scrollUp, this);
            }
        }else{
            subviewLocation = this.convertPointToView(location, this.downIndicatorView);
            if (!this.downIndicatorView.hidden && this.downIndicatorView.containsPoint(subviewLocation)){
                if (this._scrollTimer === null){
                    this._scrollTimer = JSTimer.scheduledRepeatingTimerWithInterval(0.1, this._scrollDown, this);
                }
            }else{
                if (this._scrollTimer !== null){
                    this._scrollTimer.invalidate();
                    this._scrollTimer = null;
                }
                subviewLocation = this.convertPointToView(location, this.clipView);
                if (this.clipView.containsPoint(subviewLocation)){
                    var locationInMenuView = this.convertPointToView(location, this.menuView);
                    itemView = this.menuView.itemViewAtLocation(locationInMenuView);
                    if (itemView !== null){
                        item = this._menu.items[this._itemIndexesByItemViewId[itemView.objectID]];
                        if (item.enabled){
                            highlightedItem = item;
                        }
                    }
                }
            }
        }
        this._highlightItem(highlightedItem, true);
    },

    // -----------------------------------------------------------------------
    // MARK: - Performing Actions

    _performActionForHighlightedItem: function(selectingFirstSubmenuItem){
        var item = this._menu.highlightedItem;
        if (item){
            if (item.submenu){
                this.openHighlightedSubmenu(selectingFirstSubmenuItem);
            }else{
                this._isClosing = true;
                this.stopMouseTracking();
                this._highlightItem(null);
                var timer = JSTimer.scheduledTimerWithInterval(0.08, function(){
                    this._highlightItem(item);
                    timer = JSTimer.scheduledTimerWithInterval(0.08, function(){
                        var menu = this._menu;
                        var contextTarget = menu._contextTarget;
                        this.closeAll();
                        menu.performActionForItem(item, contextTarget);
                    }, this);
                }, this);
            }
        }
    },

    openHighlightedSubmenu: function(selectingFirstItem){
        if (this.submenuTimer !== null){
            this.submenuTimer.invalidate();
            this.submenuTimer = null;
        }
        var item = this._menu.highlightedItem;
        if (!item){
            return;
        }
        var needsOpen = this.submenu === null;
        this.submenu = item.submenu;
        if (!this.submenu){
            return;
        }
        var itemView = this.menuView.itemViews[this._itemViewIndexesByItemId[item.objectID]];
        if (needsOpen){
            this.submenu._openAsSubmenu(itemView);
        }
        if (selectingFirstItem){
            for (var i = 0, l = this.submenu.items.length; i < l; ++i){
                if (this.submenu.items[i].enabled && (this._isShowingAlternates || !this.submenu.items[i].alternate)){
                    this.submenu.window._highlightItem(this.submenu.items[i]);
                    this.submenu.window.makeKey();
                    break;
                }
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Closing

    close: function(){
        if (this.submenu){
            this.submenu.close();
            this.submenu = null;
        }
        if (this._menu.supermenu && this._menu.supermenu.window){
            this._menu.supermenu.window.submenu = null;
        }
        this.stopMouseTracking();
        UIMenuWindow.$super.close.call(this);
        this._menu = null;
    },

    closeAll: function(){
        var top = this._menu;
        while (top.supermenu !== null && top.supermenu.window !== null){
            top = top.supermenu;
        }
        top.close();
    },

    // MARK: - Submenus

    deepestMenuWindow: function(){
        if (this.submenu && this.submenu.window){
            return this.submenu.window.deepestMenuWindow();
        }
        return this;
    }

});

JSClass("UIMenuView", UIView, {

    itemViews: null,

    _commonViewInit: function(){
        UIMenuView.$super._commonViewInit.call(this);
        this.backgroundColor = JSColor.initWithRGBA(255/255, 255/255, 255/255, 1.0);
        this.itemViews = [];
    },

    addViewForItem: function(item){
        var view = item.view;
        if (view === null){
            if (item.separator){
                view = UIMenuItemSeparatorView.initWithStyler(item.menu.styler);
            }else{
                view = UIMenuItemView.initWithStyler(item.menu.styler);
                view.setItem(item);
            }
        }
        view.hidden = item.alternate;
        this.addSubview(view);
        this.itemViews.push(view);
        return view;
    },

    itemViewAtLocation: function(location){
        var searcher = new JSBinarySearcher(this.itemViews, function(y, itemView){
            if (y < itemView.frame.origin.y){
                return -1;
            }
            if (y >= itemView.frame.origin.y + itemView.frame.size.height){
                return 1;
            }
            return 0;
        });
        var index = searcher.insertionIndexForValue(location.y);

        // Since alternate item views overlap with their primary companion, the search may
        // return either the primary or the alternate.  If we got a view that is hidden,
        // then we need to pick either the previous or next item to get the shown companion.
        // Be sure to only pick overlapping items.
        var itemView = this.itemViews[index];
        if (itemView.hidden){
            if (index > 0 && this.itemViews[index - 1].frame.origin.y == itemView.frame.origin.y){
                itemView = this.itemViews[index - 1];
            }else if (index < this.itemViews.length -1 && index > 0 && this.itemViews[index + 1].frame.origin.y == itemView.frame.origin.y){
                itemView = this.itemViews[index + 1];
            }
        }
        if (itemView.hidden){
            return null;
        }
        return itemView;
    },

    layoutSubviews: function(){
        UIMenuView.$super.layoutSubviews.call(this);
        var itemView;
        var y = 0;
        var lastHeight = 0;
        for (var i = 0, l = this.itemViews.length; i < l; ++i){
            itemView = this.itemViews[i];
            if (!itemView.hidden){
                y += lastHeight;
            }
            itemView.frame = JSRect(0, y, this.bounds.size.width, itemView.frame.size.height);
            lastHeight = itemView.frame.size.height;
        }
    }

});

JSClass("UIMenuItemSeparatorView", UIView, {

    _menuStyler: null,
    stylerProperties: null,

    initWithStyler: function(styler){
        UIMenuItemSeparatorView.$super.init.call(this);
        this.stylerProperties = {};
        this._menuStyler = styler;
        this._menuStyler.initializeSeparatorView(this);
    },

    layoutSubviews: function(){
        UIMenuItemSeparatorView.$super.layoutSubviews.call(this);
        this._menuStyler.layoutSeparatorView(this);
    },

});

JSClass("UIMenuItemView", UIView, {

    titleLabel: null,
    imageView: JSLazyInitProperty('_createImageView'),
    stateImageView: JSLazyInitProperty('_createStateImageView'),
    submenuImageView: JSLazyInitProperty('_createSubmenuImageView'),
    keyLabel: JSLazyInitProperty('_createKeyLabel'),
    keyModifierLabel: JSLazyInitProperty('_createKeyModifierLabel'),
    stylerProperties: null,
    _imageView: null,
    _stateImageView: null,
    _submenuImageView: null,
    _keyLabel: null,
    _keyModifierLabel: null,
    _menuStyler: null,
    _item: null,

    initWithStyler: function(styler){
        UIMenuItemView.$super.init.call(this);
        this.titleLabel = UILabel.init();
        this.addSubview(this.titleLabel);
        this.stylerProperties = {};
        this._menuStyler = styler;
        this._menuStyler.initializeItemView(this);
    },

    _createImageView: function(){
        this._imageView = UIImageView.initWithRenderMode(UIImageView.RenderMode.template);
        this.insertSubviewBeforeSibling(this._imageView, this.titleLabel);
        return this._imageView;
    },

    _createStateImageView: function(){
        this._stateImageView = UIImageView.initWithRenderMode(UIImageView.RenderMode.template);
        this.insertSubviewBeforeSibling(this._stateImageView, this.titleLabel);
        return this._stateImageView;
    },

    _createSubmenuImageView: function(){
        this._submenuImageView = UIImageView.initWithImage(images.submenu, UIImageView.RenderMode.template);
        this.insertSubviewAfterSibling(this._submenuImageView, this.titleLabel);
        return this._submenuImageView;
    },

    _createKeyLabel: function(){
        this._keyLabel = UILabel.init();
        this.insertSubviewAfterSibling(this._keyLabel, this.titleLabel);
        return this._keyLabel;
    },

    _createKeyModifierLabel: function(){
        this._keyModifierLabel = UILabel.init();
        this.insertSubviewAfterSibling(this._keyModifierLabel, this.titleLabel);
        return this._keyModifierLabel;
    },

    setItem: function(item){
        this._item = item;
        this.titleLabel.text = item.title;
        if (item.image !== null){
            this.imageView.image = item.image;
        }else if (this._imageView !== null){
            this._imageView.hidden = true;
        }
        if (item.submenu){
            this.submenuImageView.hidden = false;
        }else if (this._submenuImageView !== null){
            this._submenuImageView.hidden = true;
        }
        if (item.keyEquivalent !== null){
            this.keyLabel.hidden = false;
            this.keyLabel.text = item.keyEquivalent.toUpperCase();
            var modifierText = "";
            if (item.keyModifiers & UIMenuItem.KeyModifiers.option){
                modifierText += optionSymbol;
            }
            if (item.keyModifiers & UIMenuItem.KeyModifiers.control){
                modifierText += controlSymbol;
            }
            if (item.keyModifiers & UIMenuItem.KeyModifiers.shift){
                modifierText += shiftSymbol;
            }
            modifierText += commandSymbol;
            this.keyModifierLabel.text = modifierText;
        }else if (this._keyLabel !== null){
            this._keyLabel.hidden = true;
            this._keyModifierLabel.hidden = true;
        }
        switch (item.state){
            case UIMenuItem.State.off:
                if (this._stateImageView){
                    this._stateImageView.hidden = true;
                    this._stateImageView.image = null;
                }
                break;
            case UIMenuItem.State.on:
                this.stateImageView.hidden = false;
                this.stateImageView.image = item.onImage !== null ? item.onImage : images.stateOn;
                break;
            case UIMenuItem.State.mixed:
                this.stateImageView.hidden = false;
                this.stateImageView.image = item.mixedImage !== null ? item.mixedImage : images.stateMixed;
                break;
        }
        this._menuStyler.updateItemView(this, this._item);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        UIMenuItemView.$super.layoutSubviews.call(this);
        this._menuStyler.layoutItemView(this, this._item);
    },

    sizeToFit: function(){
        this._menuStyler.sizeItemViewToFit(this, this._item);
    }

});

var optionSymbol = "\u2325";
var shiftSymbol = "\u21e7";
var commandSymbol = "\u2318";
var controlSymbol = "";

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    submenu: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'submenu', {value: JSImage.initWithResourceName("UIMenuItemSubmenu", this.bundle) });
            return this.submenu;
        }
    },

    stateOn: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'stateOn', {value: JSImage.initWithResourceName("UIMenuItemOn", this.bundle) });
            return this.stateOn;
        }
    },

    stateMixed: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'stateMixed', {value: JSImage.initWithResourceName("UIMenuItemMixed", this.bundle) });
            return this.stateMixed;
        }
    },

    scrollUp: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'scrollUp', {value: JSImage.initWithResourceName("UIMenuUp", this.bundle) });
            return this.scrollUp;
        }
    },

    scrollDown: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'scrollDown', {value: JSImage.initWithResourceName("UIMenuDown", this.bundle) });
            return this.scrollDown;
        }
    }

});

})();