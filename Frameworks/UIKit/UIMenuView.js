// #import "UIKit/UIMenu.js"
// #import "UIKit/UIMenuItem.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, JSLazyInitProperty, JSReadOnlyProperty, JSDynamicProperty, UIWindow, UIMenu, UIView, JSColor, JSSize, JSRect, UILabel, UIImageView, UIMenuItem, JSTextAlignment, JSInsets, JSPoint, UILayer, JSConstraintBox, UIMenuWindow, UIMenuView, UIMenuItemView, JSBinarySearcher, JSTimer, JSURL, JSImage, JSBundle */
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
    _styler: null,
    _menu: null,
    _itemIndexesByItemViewId: null,
    _itemViewIndexesByItemId: null,
    _scrollTimer: null,
    _scrollDistance: 0,
    _isShowingAlternates: false,
    _isClosing: false,

    // -----------------------------------------------------------------------
    // MARK: - Creating a Menu Window

    initWithMenu: function(menu){
        UIMenuWindow.$super.init.call(this);
        this._styler = menu.styler;
        this.contentView = UIView.init();
        this.upIndicatorView = UIView.initWithConstraintBox({top: 0, left: 0, right: 0, height: 16});
        this.upIndicatorImageView = UIImageView.initWithImage(images.scrollUp, UIImageView.RenderMode.template);
        this.upIndicatorImageView.constraintBox = JSConstraintBox.Size(this.upIndicatorImageView.frame.size.width, this.upIndicatorImageView.frame.size.height);
        this.upIndicatorView.addSubview(this.upIndicatorImageView);
        this.downIndicatorView = UIView.initWithConstraintBox({bottom: 0, left: 0, right: 0, height: 16});
        this.downIndicatorImageView = UIImageView.initWithImage(images.scrollDown, UIImageView.RenderMode.template);
        this.downIndicatorImageView.constraintBox = JSConstraintBox.Size(this.downIndicatorImageView.frame.size.width, this.downIndicatorImageView.frame.size.height);
        this.downIndicatorView.addSubview(this.downIndicatorImageView);
        this.clipView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
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
        this._mouseUpTimer = JSTimer.scheduledTimerWithInterval(0.15, function(){
            this._mouseUpTimer = null;
        }, this);
    },

    // -----------------------------------------------------------------------
    // MARK: - Upating the Window Contents

    setMenu: function(menu){
        this._menu = menu;
        this._styler.initializeMenu(menu, this);
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
        this.bounds = JSRect(0, 0, menuSize.width, menuSize.height + this.clipView.constraintBox.top + this.clipView.constraintBox.bottom);
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

    mouseMoved: function(event){
        this._lastMoveLocation = event.locationInView(this);
        this._adjustHighlightForLocation(this._lastMoveLocation);
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

    _mouseUpTimer: null,

    hitTest: function(location){
        var hit = UIMenuWindow.$super.hitTest.call(this, location);
        if (hit !== null){
            return hit;
        }
        // Take all events
        // Since the Window Server checks menu windows first for hits,
        // always returning ourself means that we'll get all clicks on the
        // screen, allowing us to dismiss ourself when a click is outside
        // of our view.
        return this;
    },

    mouseUp: function(event){
        if (this._mouseUpTimer !== null){
            return true;
        }
        if (this._isClosing){
            return;
        }
        this._performActionForHighlightedItem();
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
            }
        }else if (event.keyCode == 37){
            if (this._menu.supermenu && this._menu.supermenu.window){
                this.close();
            }
        }else if (event.keyCode == 13){
            this._performActionForHighlightedItem();
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
            if (this._mouseUpTimer !== null){
                this._mouseUpTimer.invalidate();
                this._mouseUpTimer = null;
            }
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
            if (item.enabled && (this._isShowingAlternates || !item.alternate)){
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
            if (item.enabled && (this._isShowingAlternates || !item.alternate)){
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

    _performActionForHighlightedItem: function(){
        var item = this._menu.highlightedItem;
        if (item){
            if (item.submenu){
                this.openHighlightedSubmenu(true);
            }else{
                this._isClosing = true;
                this.stopMouseTracking();
                this._highlightItem(null);
                var timer = JSTimer.scheduledTimerWithInterval(0.05, function(){
                    this._highlightItem(item);
                    timer = JSTimer.scheduledTimerWithInterval(0.05, function(){
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
        this._menu.didClose();
        this._menu = null;
    },

    closeAll: function(){
        var top = this._menu;
        while (top.supermenu !== null && top.supermenu.window !== null){
            top = top.supermenu;
        }
        top.window.close();
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
                view = UIView.init();
                item.menu.styler.initializeSeparatorView(view);
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

JSClass("UIMenuItemView", UIView, {

    titleLabel: null,
    imageView: JSLazyInitProperty('_createImageView'),
    stateImageView: JSLazyInitProperty('_createStateImageView'),
    submenuImageView: JSLazyInitProperty('_createSubmenuImageView'),
    keyLabel: JSLazyInitProperty('_createKeyLabel'),
    keyModifierLabel: JSLazyInitProperty('_createKeyModifierLabel'),
    _imageView: null,
    _stateImageView: null,
    _submenuImageView: null,
    _keyLabel: null,
    _keyModifierLabel: null,
    _styler: null,
    _item: null,

    initWithStyler: function(styler){
        UIMenuItemView.$super.init.call(this);
        this.titleLabel = UILabel.init();
        this.addSubview(this.titleLabel);
        this._styler = styler;
        this._styler.initializeItemView(this);
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
            // FIXME: get get modifier string from item properties
            this.keyModifierLabel.text = "\u2303\u2318";
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
        this._styler.updateItemView(this, this._item);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        this._styler.layoutItemView(this, this._item);
    },

    sizeToFit: function(){
        this._styler.sizeItemViewToFit(this, this._item);
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
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("com.owenshaw.JSKit.UIKit") });
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