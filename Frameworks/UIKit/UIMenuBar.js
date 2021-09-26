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

// #import "UIWindow.js"
// #import "UIMenu.js"
// #import "UIMenuView.js"
// #import "JSColor+UIKit.js"
'use strict';

JSClass("UIMenuBar", UIWindow, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Menu Bar

    init: function(){
        this._styler = UIWindow.Styler.custom;
        UIMenuBar.$super.init.call(this);
        this._commonInit();
    },

    initWithSpec: function(spec){
        this._styler = UIWindow.Styler.custom;
        UIMenuBar.$super.initWithSpec.call(this, spec);
        this._commonInit();
        if (spec.containsKey('highlightColor')){
            this._highlightColor = spec.valueForKey("highlightColor", JSColor);
        }
        if (spec.containsKey('textColor')){
            this._textColor = spec.valueForKey("textColor", JSColor);
        }
        if (spec.containsKey('highlightedTextColor')){
            this._highlightedTextColor = spec.valueForKey("highlightedTextColor", JSColor);
        }
        if (spec.containsKey('font')){
            this._font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey('menu')){
            this.menu = spec.valueForKey("menu", UIMenu);
        }
        var i, l, item;
        var items;
        if (spec.containsKey('leftBarItems')){
            items = [];
            var leftBarItems = spec.valueForKey('leftBarItems');
            for (i = 0, l = leftBarItems.length; i < l; ++i){
                item = leftBarItems.valueForKey(i, UIMenuBarItem);
                items.push(item);
            }
            this.leftBarItems = items;
        }
        if (spec.containsKey('rightBarItems')){
            items = [];
            var rightBarItems = spec.valueForKey('rightBarItems');
            for (i = 0, l = rightBarItems.length; i < l; ++i){
                item = rightBarItems.valueForKey(i, UIMenuBarItem);
                items.push(item);
            }
            this.rightBarItems = items;
        }
        if (spec.containsKey('itemPadding')){
            this._itemPadding = spec.valueForKey("itemPadding", JSInsets);
        }
    },

    _commonInit: function(){
        this._itemPadding = JSInsets(3, 7);
        this._edgeInsets = JSInsets(0, 10);
        this._itemViewsByItemId = {};
        this._leftBarItems = [];
        this._rightBarItems = [];
        this._menuBarItems = [];
        this._leftItemViews = [];
        this._rightItemViews = [];
        this._menuItemViews = [];
        this.contentView = UIView.init();
        this._clipView = UIView.init();
        this.contentView.addSubview(this._clipView);
        this.backgroundColor = JSColor.menuBar;
        this._font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        this._textColor = JSColor.menuBarText;
        this._highlightColor = JSColor.highlight;
        this._highlightedTextColor = JSColor.highlightedText;
    },

    // --------------------------------------------------------------------
    // MARK: - Window Properies

    canBecomeKeyWindow: function(){
        return false;
    },

    canBecomeMainWindow: function(){
        return false;
    },

    didBecomeVisible: function(){
        UIMenuBar.$super.didBecomeVisible.call(this);
        this.windowServer.postNotificationsForAccessibilityElementCreated(this);
    },

    didClose: function(){
        this.windowServer.postNotificationsForAccessibilityElementDestroyed(this);
        UIMenuBar.$super.didClose.call(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Delegate

    delegate: null,

    // --------------------------------------------------------------------
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

    // --------------------------------------------------------------------
    // MARK: - Items

    primaryMenuItem: null,
    leftBarItems: JSDynamicProperty('_leftBarItems', null),
    rightBarItems: JSDynamicProperty('_rightBarItems', null),
    _menuBarItems: null,
    menu: JSDynamicProperty('_menu', null),
    _highlightedItemView: null,

    setLeftBarItems: function(leftBarItems){
        var i, l;
        for (i = 0, l = this._leftBarItems.length; i < l; ++i){
            this._leftBarItems[i]._menuBar = null;
        }
        this._leftBarItems = leftBarItems || [];
        for (i = 0, l = this._leftBarItems.length; i < l; ++i){
            this._leftBarItems[i]._menuBar = this;
        }
        this._updateItemViews(this._leftItemViews, this._leftBarItems, UIMenuBarButton);
        this.setNeedsLayout();
    },

    setRightBarItems: function(rightBarItems){
        var i, l;
        for (i = 0, l = this._rightBarItems.length; i < l; ++i){
            this._rightBarItems[i]._menuBar = null;
        }
        this._rightBarItems = rightBarItems || [];
        for (i = 0, l = this._rightBarItems.length; i < l; ++i){
            this._rightBarItems[i]._menuBar = this;
        }
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
            barItem._menuBar = this;
            this._menuBarItems.push(barItem);
        }
        this.primaryMenuItem = this._menuBarItems[0];
        this._updateItemViews(this._menuItemViews, this._menuBarItems, UIMenuBarItemView);
        this.setNeedsLayout();
    },

    _updateItemViews: function(itemViews, items, viewClass){
        var itemView;
        var item;
        for (var i = 0, l = items.length; i < l; ++i){
            item = items[i];
            if (i < itemViews.length){
                itemView = itemViews[i];
            }else{
                itemView = viewClass.init();
                itemView._menuBar = this;
                itemViews.push(itemView);
                this._clipView.addSubview(itemView);
            }
            this._itemViewsByItemId[item.objectID] = itemView;
            itemView.setItem(item);
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

    _itemViewsByItemId: null,

    viewForItem: function(item){
        return this._itemViewsByItemId[item.objectID];
    },

    // --------------------------------------------------------------------
    // MARK: - Views & Layout

    _leftItemViews: null,
    _menuItemViews: null,
    _rightItemViews: null,
    submenu: null,
    windowController: null,

    reload: function(){
        this._itemViewsByItemId = {};
        this._updateItemViews(this._leftItemViews, this._leftBarItems, UIMenuBarButton);
        this._updateItemViews(this._menuItemViews, this._menuBarItems, UIMenuBarItemView);
        this._updateItemViews(this._rightItemViews, this._rightBarItems, UIMenuBarButton);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        UIMenuBar.$super.layoutSubviews.call(this);
        var height = this._font.displayLineHeight + this._itemPadding.height;
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
            if (!itemView.hidden){
                x += itemWidth;
            }
        }
        leftWidth = x;
        for (i = 0, l = this._menuItemViews.length; i < l; ++i){
            itemView = this._menuItemViews[i];
            itemView.sizeToFit();
            itemWidth = itemView.frame.size.width + this._itemPadding.left + this._itemPadding.right;
            itemView.frame = JSRect(x, 0, itemWidth, height);
            if (!itemView.hidden){
                x += itemWidth;
            }
        }
        menuWidth = x - leftWidth;
        for (i = 0, l = this._rightItemViews.length; i < l; ++i){
            itemView = this._rightItemViews[i];
            itemView.sizeToFit();
            itemWidth = itemView.frame.size.width + this._itemPadding.left + this._itemPadding.right;
            itemView.frame = JSRect(x, 0, itemWidth, height);
            if (!itemView.hidden){
                x += itemWidth;
            }
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

    rectForItem: function(item){
        var view = this.viewForItem(item);
        if (view !== null){
            return view.convertRectToView(view.bounds, this);
        }
        return JSRect.Zero(0, 0, 0, this.bounds.size.height);
    },

    // --------------------------------------------------------------------
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
        if (this.windowController){
            this.windowController.delegate = null;
            this.windowController.close();
            this.windowController = null;
            this.makeKey();
        }
        this._highlightedItemView = itemView;
        var windowController;
        if (this._highlightedItemView){
            this._highlightedItemView.highlighted = true;
            if (itemView._item.menu){
                this.submenu = itemView._item.menu;
                this.submenu.delegate = this;
                this.openMenu(this.submenu, itemView);
            }else if (itemView._item.windowControllerClass){
                windowController = itemView._item.windowControllerClass.init();
                this.openWindowControllerUnderItem(windowController, itemView._item);
            }else if (itemView._item.delegate !== null && itemView._item.delegate.windowControllerForMenuBarItem){
                windowController = itemView._item.delegate.windowControllerForMenuBarItem(itemView._item);
                if (windowController !== null && windowController !== undefined){
                    this.openWindowControllerUnderItem(windowController, itemView._item);
                }
            }
        }
    },

    openWindowControllerUnderItem: function(windowController, item){
        var itemView = this.viewForItem(item);
        this._highlightedItemView = itemView;
        this._highlightedItemView.highlighted = true;
        this.windowController = windowController;
        this.windowController.delegate = this;
        var window = this.windowController.window;
        var maxWidth = Math.floor(this.screen.frame.size.width * 0.3);
        window.frame = JSRect(0, 0, maxWidth, 0);
        window.sizeToFit();
        window.maskedCorners = UILayer.Corners.maxY;
        this.positionWindowUnderItemView(window, itemView);
        this.windowController.autoPositionWindow = false;
        this.windowController.makeKeyAndOrderFront();
    },

    openMenu: function(menu, itemView){
        menu.updateEnabled();
        var window = menu.styler.createWindowForMenu(menu);
        window.maskedCorners = UILayer.Corners.maxY;
        this.positionWindowUnderItemView(window, itemView);
        menu.stylerProperties.window = window;
        window.makeKeyAndOrderFront();
    },

    positionWindowUnderItemView: function(window, itemView){
        var safeFrame = this.screen.frame.rectWithInsets(0, 0, 4, 0);
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
        window.frame = JSRect(origin, size);
    },

    windowControllerDidClose: function(windowController){
        this.windowController.delegate = null;
        this.windowController = null;
        this._highlightedItemView.highlighted = false;
        this._highlightedItemView = null;
        this.receivesAllEvents = false;
        this.stopMouseTracking();
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
        // The menu bar has special consideration for the left and right edges in order
        // to make it easier for users to hit the items even if there is visible padding.
        // - a hit to the left of the leftmost item is still considered to hit the item
        // - a hit to the right of the rightmost item is still considered to hit the item
        var edgeItemView = null;
        var i = 0;
        while (i < this._leftItemViews.length && this._leftItemViews[i].hidden){
            ++i;
        }
        if (i < this._leftItemViews.length){
            edgeItemView = this._leftItemViews[i];
        }
        if (edgeItemView !== null && location.x < edgeItemView.convertPointToView(JSPoint(0,0), this).x){
            return edgeItemView;
        }
        i = this._rightItemViews.length - 1;
        while (i >= 0 && this._rightItemViews[i].hidden){
            --i;
        }
        if (i >= 0){
            edgeItemView = this._rightItemViews[i];
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
                this.submenu.stylerProperties.window.deepestMenuWindow().mouseDragged(event);
            }
        }
    },

    mouseDownOnItemView: function(itemView, event){
        if (itemView._item.menu || itemView._item.windowControllerClass || (itemView._item.delegate && itemView._item.delegate.windowControllerForMenuBarItem)){
            if (itemView !== this._highlightedItemView){
                this._selectMenuItemView(itemView);
                this._itemDownTimestamp = event.timestamp;
            }else if (this.windowController){
                this.windowController.close();
            }
        }else{
            this.stopMouseTracking();
            this.receivesAllEvents = false;
            if (this.submenu){
                this.submenu.close();
            }
        }
    },

    mouseDraggedOnItemView: function(itemView, event){
        if (!itemView._item.menu){
            return;
        }
        var location = event.locationInView(this._clipView);
        if (!this._clipView.containsPoint(location)){
            this._itemDownTimestamp = UIEvent.minimumTimestamp;
        }
        if (this.submenu){
            this.submenu.stylerProperties.window.deepestMenuWindow().mouseDragged(event);
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
                this.submenu.stylerProperties.window.deepestMenuWindow().mouseUp(event);
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
    },

    performKeyEquivalent: function(event){
        var item = this._menu._itemForKeyEquivalent(event);
        if (item === null){
            return true;
        }
        return false;
    },

    accessibilityRole: UIAccessibility.Role.menuBar,

    getAccessibilityElements: function(){
        var elements = JSCopy(this.leftBarItems || []);
        return elements.concat(this._menuBarItems || []).concat(this.rightBarItems || []);
    }

});

JSProtocol("UIMenuBarDelegate", JSProtocol, {

    windowControllerForMenuBarItem: function(menuBarItem){}

});

JSClass("UIMenuBarItem", JSObject, {
    title: JSDynamicProperty('_title', null),
    image: null,
    imagePosition: 1,
    target: null,
    action: null,
    menu: null,
    delegate: null,
    windowControllerClass: null,
    tooltip: null,
    customView: null,
    hidden: JSDynamicProperty('_hidden', null),
    state: JSReadOnlyProperty('_state', 0),
    active: JSDynamicProperty(null, null, 'isActive'),
    _menuBar: null,

    initWithSpec: function(spec){
        UIMenuBarItem.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('title')){
            this._title = spec.valueForKey("title");
        }
        if (spec.containsKey('image')){
            this.image = spec.valueForKey("image", JSImage);
        }
        if (spec.containsKey('imagePosition')){
            this.imagePosition = spec.valueForKey("imagePosition", UIMenuBarItem.ImagePosition);
        }
        if (spec.containsKey('target')){
            this.target = spec.valueForKey("target");
        }
        if (spec.containsKey('action')){
            this.action = spec.valueForKey("action");
        }
        if (spec.containsKey('customView')){
            this.customView = spec.valueForKey("customView", UIView);
        }
        if (spec.containsKey('tooltip')){
            this.tooltip = spec.valueForKey("tooltip");
        }
        if (spec.containsKey('menu')){
            this.menu = spec.valueForKey("menu", UIMenu);
        }
        if (spec.containsKey('windowControllerClass')){
            this.windowControllerClass = JSClass.FromName(spec.valueForKey("windowControllerClass"));
        }
        if (spec.containsKey("accessibilityIdentifier")){
            this.accessibilityIdentifier = spec.valueForKey("accessibilityIdentifier");
        }
        if (spec.containsKey("accessibilityLabel")){
            this._accessibilityLabel = spec.valueForKey("accessibilityLabel");
        }
        if (spec.containsKey("accessibilityHint")){
            this.accessibilityHint = spec.valueForKey("accessibilityHint");
        }
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey("delegate");
        }
    },

    initWithTitle: function(title, action, target){
        this._title = title;
        this.action = action || null;
        this.target = target || null;
    },

    setTitle: function(title){
        this._title = title;
        if (this._menuBar !== null){
            this._menuBar.reload();
        }
    },

    setHidden: function(hidden){
        this._hidden = hidden;
        if (this._menuBar !== null){
            this._menuBar.reload();
        }
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
    },

    // Visibility
    isAccessibilityElement: true,
    accessibilityHidden: false,
    accessibilityLayer: JSReadOnlyProperty(),
    accessibilityFrame: JSReadOnlyProperty(),

    // Role
    accessibilityRole: UIAccessibility.Role.menuBarItem,
    accessibilitySubrole: null,

    // Label
    accessibilityIdentifier: null,
    accessibilityLabel: JSDynamicProperty("_accessibilityLabel", null),
    accessibilityHint: null,

    // Value
    accessibilityValue: null,
    accessibilityValueRange: null,
    accessibilityChecked: null,
    accessibilityOrientation: null,

    // Properties
    accessibilityTextualContext: null,
    accessibilityMenu: JSReadOnlyProperty(),
    accessibilityRowIndex: null,
    accessibilitySelected: null,
    accessibilityExpanded: null,

    // Children
    accessibilityParent: JSReadOnlyProperty(),
    accessibilityElements: JSReadOnlyProperty(),

    getAccessibilityElements: function(){
        return [];
    },

    getAccessibilityLayer: function(){
        if (this._menuBar !== null){
            var view = this._menuBar.viewForItem(this);
            if (view !== null){
                return view.layer;
            }
        }
        return null;
    },

    getAccessibilityFrame: function(){
        if (this._menuBar !== null){
            var view = this._menuBar.viewForItem(this);
            if (view !== null){
                return view.convertRectToScreen(view.bonds);
            }
        }
        return null;
    },

    getAccessibilityMenu: function(){
        return this.menu;
    },

    getAccessibilityLabel: function(){
        if (this._accessibilityLabel !== null){
            return this._accessibilityLabel;
        }
        return this._title;
    },

    getAccessibilityParent: function(){
        return this._menuBar;
    }

});

UIMenuBarItem.ImagePosition = {
    left: 0,
    right: 1
};

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
    _imagePosition: 0,
    _titleImageSpacing: 3,
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
        this._imageView.automaticRenderMode = JSImage.RenderMode.template;
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
        if (!this._customView){
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
        this._imagePosition = item.imagePosition;
        this.hidden = item.hidden;
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
        var size;
        if (this._customView !== null){
            this._customView.sizeToFit();
            size = this._customView.frame.size;
        }else{
            if (this._titleLabel){
                this._titleLabel.sizeToFit();
                size = JSSize(this._titleLabel.frame.size);
                if (this._imageView){
                    this._imageView.sizeToFit();
                    size.width += this._titleImageSpacing + this._imageView.frame.size.width;
                }
            }else if (this._imageView){
                this._imageView.sizeToFit();
                size = this._imageView.frame.size;
            }
        }
        this.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutSubviews: function(){
        if (this._customView){
            this._customView.position = this.bounds.center;
        }else{
            if (this._titleLabel){
                if (this._imageView){
                    var x0 = (this.bounds.size.width - this._titleLabel.frame.size.width - this._titleImageSpacing - this._imageView.frame.size.width) / 2;
                    if (this._imagePosition == UIMenuBarItem.ImagePosition.right){
                        this._titleLabel.position = JSPoint(x0 + this._titleLabel.frame.size.width / 2, this.bounds.size.height / 2);
                        this._imageView.position = JSPoint(x0 + this._titleLabel.frame.size.width + this._titleImageSpacing + this._imageView.frame.size.width / 2, this.bounds.size.height / 2);
                    }else{
                        this._titleLabel.position = JSPoint(x0 + this._imageView.frame.size.width + this._titleImageSpacing + this._titleLabel.frame.size.width / 2, this.bounds.size.height / 2);
                        this._imageView.position = JSPoint(x0 + this._imageView.frame.size.width / 2, this.bounds.size.height / 2);
                    }
                }else{
                    this._titleLabel.position = this.bounds.center;
                }
            }else if (this._imageView){
                this._imageView.position = this.bounds.center;
            }
        }
    }

});

JSClass("UIMenuBarButton", UIMenuBarItemView, {

    shouldSendAction: function(){
        if (this._item.menu !== null){
            return false;
        }
        if (this._item.windowControllerClass !== null){
            return false;
        }
        if (this._item.delegate !== null && this._item.delegate.windowControllerForMenuBarItem){
            return false;
        }
        return true;
    },

    mouseDown: function(event){
        this._menuBar.mouseDownOnItemView(this, event);
        if (this.shouldSendAction()){
            this.highlighted = true;
        }
    },

    mouseDragged: function(event){
        this._menuBar.mouseDraggedOnItemView(this, event);
        if (this.shouldSendAction()){
            var location = event.locationInView(this);
            this.highlighted = this.containsPoint(location);
        }
    },

    mouseUp: function(event){
        this._menuBar.mouseUpOnItemView(this, event);
        if (this.shouldSendAction()){
            if (this.highlighted){
                this.highlighted = false;
                this.window.application.sendAction(this._item.action, this._item.target, this._item);
            }
        }
    }

});