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

// #import "UIMenu.js"
// #import "UIMenuItem.js"
// #import "UIView.js"
// #import "UILabel.js"
// #import "UIImageView.js"
// #import "UIEvent.js"
// #import "UIPlatform.js"
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
    _menu: null,
    _itemIndexesByItemViewId: null,
    _itemViewIndexesByItemId: null,
    _scrollTimer: null,
    _scrollDistance: 0,
    _isShowingAlternates: false,
    _isClosing: false,
    capSize: JSDynamicProperty('_capSize', 5),
    _keyWidth: 0,
    separatorColor: null,
    separatorSize: 10,
    separatorLineWidth: 2,
    itemContentInsets: null,
    indentationSize: 10,
    highlightColor: null,
    textColor: null,
    highlightedTextColor: null,
    disabledTextColor: null,

    // -----------------------------------------------------------------------
    // MARK: - Creating a Menu Window

    initWithMenu: function(menu){
        this._styler = UIWindow.Styler.custom;
        UIMenuWindow.$super.init.call(this);
        this.contentView = UIView.init();
        this.upIndicatorView = UIView.init();
        this.upIndicatorImageView = UIImageView.initWithImage(images.scrollUp);
        this.upIndicatorView.addSubview(this.upIndicatorImageView);
        this.downIndicatorView = UIView.init();
        this.downIndicatorImageView = UIImageView.initWithImage(images.scrollDown);
        this.downIndicatorView.addSubview(this.downIndicatorImageView);
        this.clipView = UIView.init();
        this.menuView = UIMenuView.init();
        this.menuView.menuWindow = this;
        this.contentView.addSubview(this.clipView);
        this.clipView.addSubview(this.menuView);
        this.contentView.addSubview(this.upIndicatorView);
        this.contentView.addSubview(this.downIndicatorView);
        this.upIndicatorView.hidden = true;
        this.downIndicatorView.hidden = true;
        this._itemIndexesByItemViewId = {};
        this._itemViewIndexesByItemId = {};
        this._openEvent = this.windowServer.activeEvent;
        this._keyWidth = Math.ceil(menu.font.widthOfString("W"));
        this._menu = menu;
    },

    // -----------------------------------------------------------------------
    // MARK: - Window Behavior

    receivesAllEvents: true,

    canBecomeKeyWindow: function(){
        // Menus should not change the current key window.  They will still
        // receive key events due to internal logic in UIWindowServer
        return false;
    },

    canBecomeMainWindow: function(){
        // Menus should not change the current main window.
        return false;
    },

    _openEvent: null,

    didBecomeVisible: function(){
        UIMenuWindow.$super.didBecomeVisible.call(this);
        var event = this._openEvent;
        if (event !== null && event.type == UIEvent.Type.leftMouseDown){
            this._openEvent = null;
            var location = event.locationInView(this);
            this._adjustHighlightForLocation(location);
            this._itemDownTimestamp = event.timestamp;
        }
        this.windowServer.postNotificationsForAccessibilityElementCreated(this._menu);
    },

    didClose: function(){
        this.windowServer.postNotificationsForAccessibilityElementDestroyed(this._menu);
        UIMenuWindow.$super.didClose.call(this);
    },

    // -----------------------------------------------------------------------
    // MARK: - Upating the Window Contents

    update: function(){
        var item;
        var itemView;
        var menuSize = JSSize.Zero;
        // TODO: optimize by only drawing those views that fill the screen
        // We don't need to know the true height because we aren't showing a
        // scroll bar, only indicators that there is more.
        // Although, a UI that uses very long menus is poorly designed, so this
        // is a low priority
        for (var i = 0, l = this._menu.items.length; i < l; ++i){
            item = this._menu.items[i];
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
        if (this._menu.supermenu && this._menu.supermenu.stylerProperties.window){
            this._menu.supermenu.stylerProperties.window.setAlternateItemsShown(shown);
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
        var contentView = this.contentView;
        this.clipView.frame = contentView.bounds.rectWithInsets(this._capSize, 0);
        var imageSize = this.upIndicatorImageView.image.size;
        this.upIndicatorView.frame = JSRect(0, 0, contentView.bounds.size.width, imageSize.height);
        this.upIndicatorImageView.position = this.upIndicatorView.bounds.center;
        imageSize = this.downIndicatorImageView.image.size;
        this.downIndicatorView.frame = JSRect(0, contentView.bounds.size.height - imageSize.height, contentView.bounds.size.width, imageSize.height);
        this.downIndicatorImageView.position = this.downIndicatorView.bounds.center;
        contentView.layoutIfNeeded();
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

    viewForItem: function(item){
        return this._itemViewIndexesByItemId[item.objectID] || null;
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

    scrollWheel: function(event){
        var delta = JSPoint(event.scrollingDelta);
        delta.x = 0;
        this.contentOffset = this.contentOffset.adding(delta);
        this._adjustHighlightForLocation(this._lastMoveLocation);
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Tracking

    shouldReceiveTrackingInBack: true,

    mouseMoved: function(event){
        if (this._isClosing){
            return;
        }
        this._lastMoveLocation = event.locationInView(this);
        this._adjustHighlightForLocation(this._lastMoveLocation);
    },

    mouseDragged: function(event){
        if (this._isClosing){
            return;
        }
        var location = event.locationInView(this);
        this._lastMoveLocation = event.locationInView(this);
        this._adjustHighlightForLocation(this._lastMoveLocation);
        if (!this.containsPoint(location)){
            if (this._menu.supermenu !== null && this._menu.supermenu.stylerProperties.window){
                this._menu.supermenu.stylerProperties.window.mouseDragged(event);
            }
        }
    },

    mouseExited: function(event){
        if (this._isClosing){
            return;
        }
        if (!this.submenu){
            this._highlightItem(null);
        }
        if (this._scrollTimer){
            this._scrollTimer.invalidate();
            this._scrollTimer = null;
        }
    },

    mouseEntered: function(event){
        if (this._isClosing){
            return;
        }
        this.makeKey();
        this._lastMoveLocation = event.locationInView(this);
        this._adjustHighlightForLocation(this._lastMoveLocation);
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Events

    _itemDownTimestamp: UIEvent.minimumTimestamp,

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
            if (this._menu.supermenu && this._menu.supermenu.stylerProperties.window){
                this._menu.supermenu.stylerProperties.window.mouseUp(event);
            }else{
                this.closeAll(true);
            }
        }
    },

    mouseDown: function(event){
        if (this._isClosing){
            return;
        }
        var location = event.locationInView(this);
        if (!this.containsPoint(location)){
            if (this._menu.supermenu && this._menu.supermenu.stylerProperties.window){
                this._menu.supermenu.stylerProperties.window.mouseDown(event);
            }else{
                this.closeAll(true);
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
        if (event.key === UIEvent.Key.option){
            this.setAlternateItemsShown(true);
        }else if (event.key == UIEvent.Key.escape){
            this.closeAll();
        }else if (event.key == UIEvent.Key.up){
            this._highlightPreviousItem();
        }else if (event.key == UIEvent.Key.down){
            this._highlightNextItem();
        }else if (event.key == UIEvent.Key.right){
            if (this._menu.highlightedItem && this._menu.highlightedItem.submenu){
                this.openHighlightedSubmenu(true);
            }else{
                if (this._menu.delegate && this._menu.delegate.menuDidNavigateRight){
                    this._menu.delegate.menuDidNavigateRight(this._menu);
                }
            }
        }else if (event.key == UIEvent.Key.left){
            if (this._menu.supermenu && this._menu.supermenu.stylerProperties.window){
                this._menu.close();
            }else{
                if (this._menu.delegate && this._menu.delegate.menuDidNavigateLeft){
                    this._menu.delegate.menuDidNavigateLeft(this._menu);
                }
            }
        }else if (event.key == UIEvent.Key.enter || event.key == UIEvent.Key.space){
            this._performActionForHighlightedItem(true);
        }
        // TODO: select by typing title
    },

    keyUp: function(event){
        if (this._isClosing){
            return;
        }
        if (event.key == UIEvent.Key.option){
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
                var itemView = this.menuView.itemViews[this._itemViewIndexesByItemId[item.objectID]];
                item.highlighted = false;
                itemView.setItem(item);
                var timer = JSTimer.scheduledTimerWithInterval(0.08, function(){
                    item.highlighted = true;
                    itemView.setItem(item);
                    var timer = JSTimer.scheduledTimerWithInterval(0.08, function(){
                        var menu = this._menu;
                        var contextTarget = menu._contextTarget;
                        this.closeAll(true, function(){
                            menu.performActionForItem(item, contextTarget);
                        }, this);
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
            this.submenu.styler.presentMenuWithFirstItemRightOfRectInView(this.submenu, itemView.bounds, itemView);
        }
        if (selectingFirstItem){
            for (var i = 0, l = this.submenu.items.length; i < l; ++i){
                if (this.submenu.items[i].enabled && (this._isShowingAlternates || !this.submenu.items[i].alternate)){
                    this.submenu.stylerProperties.window._highlightItem(this.submenu.items[i]);
                    this.submenu.stylerProperties.window.makeKey();
                    break;
                }
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Closing

    close: function(){
        this._isClosing = true;
        if (this.submenu){
            this.submenu.close();
            this.submenu = null;
        }
        if (this._menu.supermenu && this._menu.supermenu.stylerProperties.window){
            this._menu.supermenu.stylerProperties.window.submenu = null;
        }
        this.stopMouseTracking();
        UIMenuWindow.$super.close.call(this);
    },

    closeAll: function(animated, completion, target){
        var top = this._menu;
        while (top.supermenu !== null && top.supermenu.stylerProperties.window){
            top = top.supermenu;
        }
        if (animated){
            top.closeWithAnimation(completion, target);
        }else{
            top.close();
        }
    },

    // MARK: - Submenus

    deepestMenuWindow: function(){
        if (this.submenu && this.submenu.stylerProperties.window){
            return this.submenu.stylerProperties.window.deepestMenuWindow();
        }
        return this;
    },

    isAccessibilityElement: false

});

JSClass("UIMenuView", UIView, {

    itemViews: null,
    menuWindow: null,

    initWithFrame: function(frame){
        UIMenuView.$super.initWithFrame.call(this, frame);
        this.backgroundColor = JSColor.initWithRGBA(255/255, 255/255, 255/255, 1.0);
        this.itemViews = [];
    },

    addViewForItem: function(item){
        var view = item.view;
        if (view === null){
            if (item.separator){
                view = UIMenuItemSeparatorView.initWithColor(this.menuWindow.separatorColor, this.menuWindow.separatorLineWidth);
                view.frame = JSRect(0, 0, 1, this.menuWindow.separatorSize);
            }else{
                view = UIMenuItemView.init();
                view.contentInsets = this.menuWindow.itemContentInsets;
                view.indentationSize = this.menuWindow.indentationSize;
                view.textColor = this.menuWindow.textColor;
                view.highlightedTextColor = this.menuWindow.highlightedTextColor;
                view.disabledTextColor = this.menuWindow.disabledTextColor;
                view.highlightColor = this.menuWindow.highlightColor;
                view.keyWidth = this.menuWindow._keyWidth;
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

    lineLayer: null,
    size: 0,

    initWithColor: function(color, size){
        UIMenuItemSeparatorView.$super.init.call(this);
        this.size = size;
        this.lineLayer = UILayer.init();
        this.lineLayer.backgroundColor = color;
        this.layer.addSublayer(this.lineLayer);
    },

    layoutSubviews: function(){
        UIMenuItemSeparatorView.$super.layoutSubviews.call(this);
        this.lineLayer.frame = JSRect(0, (this.bounds.size.height - this.size) / 2, this.bounds.size.width, this.size);
    },

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.menuItem,
    accessibilitySubrole: UIAccessibility.Subrole.separator,

    getAccessibilityElements: function(){
        return [];
    }

});

JSClass("UIMenuItemView", UIView, {

    titleLabel: null,
    textColor: null,
    highlightedTextColor: null,
    disabledTextColor: null,
    highlightColor: null,
    keyWidth: null,
    imageView: JSLazyInitProperty('_createImageView'),
    stateImageView: JSLazyInitProperty('_createStateImageView'),
    submenuImageView: JSLazyInitProperty('_createSubmenuImageView'),
    keyLabel: JSLazyInitProperty('_createKeyLabel'),
    keyModifierLabel: JSLazyInitProperty('_createKeyModifierLabel'),
    indentationSize: 0,
    contentInsets: null,
    _imageView: null,
    _stateImageView: null,
    _submenuImageView: null,
    _keyLabel: null,
    _keyModifierLabel: null,
    _menuStyler: null,
    _item: null,

    init: function(){
        UIMenuItemView.$super.init.call(this);
        this.titleLabel = UILabel.init();
        this.addSubview(this.titleLabel);
    },

    _createImageView: function(){
        this._imageView = UIImageView.init();
        this.insertSubviewBelowSibling(this._imageView, this.titleLabel);
        return this._imageView;
    },

    _createStateImageView: function(){
        this._stateImageView = UIImageView.init();
        this.insertSubviewBelowSibling(this._stateImageView, this.titleLabel);
        return this._stateImageView;
    },

    _createSubmenuImageView: function(){
        this._submenuImageView = UIImageView.initWithImage(images.submenu);
        this.insertSubviewAboveSibling(this._submenuImageView, this.titleLabel);
        return this._submenuImageView;
    },

    _createKeyLabel: function(){
        this._keyLabel = UILabel.init();
        this.insertSubviewAboveSibling(this._keyLabel, this.titleLabel);
        return this._keyLabel;
    },

    _createKeyModifierLabel: function(){
        this._keyModifierLabel = UILabel.init();
        this.insertSubviewAboveSibling(this._keyModifierLabel, this.titleLabel);
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
            var modifierText = UIPlatform.shared.stringForKeyModifiers(item.keyModifiers);
            this.keyModifierLabel.text = modifierText;
        }else if (this._keyLabel !== null){
            this._keyLabel.hidden = true;
            this._keyModifierLabel.hidden = true;
        }
        switch (item.state){
            case UIMenuItem.State.off:
                if (item.offImage !== null){
                    this.stateImageView.image = item.offImage;
                }else if (this._stateImageView){
                    this._stateImageView.image = null;
                }
                if (this._stateImageView){
                    this._stateImageView.hidden = this._stateImageView.image === null;
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
        var textColor = this.getTextColorForItem(item);
        this.titleLabel.font = item.menu.font;
        this.titleLabel.textColor = textColor;
        if (this._imageView !== null){
            this._imageView.templateColor = textColor;
        }
        if (this._submenuImageView !== null){
            this.submenuImageView.templateColor = textColor;
        }
        if (item.keyEquivalent){
            this.keyLabel.font = item.menu.font;
            this.keyLabel.textColor = textColor;
            this.keyModifierLabel.font = item.menu.font;
            this.keyModifierLabel.textColor = textColor;
        }
        if (item.highlighted){
            this.backgroundColor = this.highlightColor;
        }else{
            this.backgroundColor = null;
        }
        if (this._stateImageView !== null){
            this.stateImageView.templateColor = textColor;
        }
        this.setNeedsLayout();
    },

    getTextColorForItem: function(item){
        if (item.enabled){
            if (item.highlighted){
                return this.highlightedTextColor;
            }
            return this.textColor;
        }
        return this.disabledTextColor;
    },

    updateItemView: function(view, item){
    },

    layoutSubviews: function(){
        UIMenuItemView.$super.layoutSubviews.call(this);
        var item = this._item;
        var left = this.contentInsets.left;
        var right = this.bounds.size.width - this.contentInsets.right;
        var lineHeight = item.menu.font.displayLineHeight;
        var imageSize = lineHeight;
        if (item.menu.showStatusColumn){
            if (this._stateImageView !== null && !this._stateImageView.hidden){
                this._stateImageView.frame = JSRect(left, this.contentInsets.top, imageSize, imageSize);
            }
            left += imageSize + this.contentInsets.left;
        }
        if (this._imageView !== null && !this._imageView.hidden){
            this._imageView.frame = JSRect(left, this.contentInsets.top, imageSize, imageSize);
            left += imageSize + this.contentInsets.left;
        }
        left += this.indentationSize * item.indentationLevel;
        if (this._submenuImageView !== null && !this._submenuImageView.hidden){
            this._submenuImageView.frame = JSRect(right - this._submenuImageView.frame.size.width, this.contentInsets.top, imageSize, imageSize);
            right -= this._submenuImageView.frame.size.width + this.contentInsets.right;
        }else if (this._keyLabel !== null && !this._keyLabel.hidden){
            this._keyLabel.frame = JSRect(right - this.keyWidth, this.contentInsets.top, this.keyWidth, this._keyLabel.font.displayLineHeight);
            right -= this.keyWidth;
            this._keyModifierLabel.frame = JSRect(right - this._keyModifierLabel.frame.size.width, this.contentInsets.top, this._keyModifierLabel.frame.size.width, this._keyModifierLabel.font.displayLineHeight);
            right -= this._keyModifierLabel.frame.size.width + this.contentInsets.right;
        }else{
            right += this.contentInsets.right - this.contentInsets.left;
            if (item.menu.showStatusColumn){
                right -= imageSize + this.contentInsets.left;
            }
        }
        if (left > right){
            left = right;
        }
        this.titleLabel.frame = JSRect(left, this.contentInsets.top, right - left, lineHeight);
    },

    sizeToFit: function(){
        var item = this._item;
        var size = JSSize(this.contentInsets.width, 0);
        var lineHeight = item.menu.font.displayLineHeight;
        var imageSize = lineHeight;
        if (item.menu.showStatusColumn){
            size.width += imageSize + this.contentInsets.left;
        }
        if (item.image !== null){
            size.width += imageSize + this.contentInsets.left;
        }
        size.width += this.indentationSize * item._indentationLevel;
        this.titleLabel.sizeToFit();
        size.width += this.titleLabel.frame.size.width;
        if (item.submenu !== null){
            size.width += this._submenuImageView.frame.size.width + this.contentInsets.right;
        }else if (item.keyEquivalent){
            this._keyModifierLabel.sizeToFit();
            size.width += this.keyWidth + this._keyModifierLabel.frame.size.width + this.contentInsets.right;
        }else{
            // make sure the right padding is as much as the left
            size.width += this.contentInsets.left - this.contentInsets.right;
            if (item.menu.showStatusColumn){
                size.width += imageSize + this.contentInsets.left;
            }
        }
        size.height = lineHeight + this.contentInsets.top + this.contentInsets.bottom;
        size.width = Math.ceil(size.width);
        size.height = Math.ceil(size.height);
        this.bounds = JSRect(JSPoint.Zero, size);
    },

});

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
            var image = JSImage.initWithResourceName("UIMenuItemSubmenu", this.bundle);
            Object.defineProperty(this, 'submenu', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.submenu;
        }
    },

    stateOn: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIMenuItemOn", this.bundle);
            Object.defineProperty(this, 'stateOn', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.stateOn;
        }
    },

    stateMixed: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIMenuItemMixed", this.bundle);
            Object.defineProperty(this, 'stateMixed', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.stateMixed;
        }
    },

    scrollUp: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIMenuUp", this.bundle);
            Object.defineProperty(this, 'scrollUp', {value:  image.imageWithRenderMode(JSImage.RenderMode.template)});
            return this.scrollUp;
        }
    },

    scrollDown: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIMenuDown", this.bundle);
            Object.defineProperty(this, 'scrollDown', {value:  image.imageWithRenderMode(JSImage.RenderMode.template)});
            return this.scrollDown;
        }
    }

});

})();