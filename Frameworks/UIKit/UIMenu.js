// #import "Foundation/Foundation.js"
// #import "UIKit/UIMenuItem.js"
// #import "UIKit/UIApplication.js"
// #import "UIKit/UIPlatform.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, JSObject, UIView, JSDynamicProperty, JSReadOnlyProperty, UIMenu, UIPlatform, UIEvent, UIMenuItem, JSSize, JSColor, JSFont, JSRect, JSPoint, UIWindow, UIMenuWindow, UIMenuView, UIMenuItemView, JSInsets, UIApplication, UIMenuStyler, UIMenuDefaultStyler, UILayer, UIAnimationTransaction, UIBasicAnimation */
'use strict';

(function(){

JSClass("UIMenu", JSObject, {

    // MARK: - Creating a Menu

    _commonInit: function(){
        this._items = [];
        this._itemsByTag = {};
        this._font = JSFont.systemFontOfSize(JSFont.Size.normal);
        if (this._font !== null){
            this._font = this._font.fontWithWeight(JSFont.Weight.regular);
        }
        if (this._styler === null){
            this._styler = UIMenu.defaultStyler;
        }
    },

    init: function(){
        this._commonInit();
    },

    initWithStyler: function(styler){
        this._styler = styler;
        this._commonInit();
    },

    initWithSpec: function(spec, values){
        UIMenu.$super.initWithSpec.call(this, spec, values);
        if ('styler' in values){
            this._styler = spec.resolvedValue(values.styler);
        }
        this._commonInit();
        var item;
        if ('items' in values){
            for (var i = 0, l = values.items.length; i < l; ++i){
                item = UIMenuItem.initWithSpec(spec, values.items[i]);
                this.addItem(item);
            }
        }
    },

    // MARK: - Delegate

    delgate: null,

    // MARK: - Display Properties

    styler: JSReadOnlyProperty('_styler', null),
    font: JSDynamicProperty('_font', null),
    showStatusColumn: JSDynamicProperty('_showStatusColumn', true),
    minimumWidth: JSDynamicProperty('_minimumWidth', 48),
    itemTitleOffset: JSReadOnlyProperty(),

    getItemTitleOffset: function(){
        return this._styler.getItemTitleOffset(this);
    },

    // MARK: - Accessing Items

    items: JSReadOnlyProperty('_items', null),
    highlightedItem: JSReadOnlyProperty('_highlightedItem', null),
    _itemsByTag: null,

    itemWithTag: function(tag){
        return this._itemsByTag[tag] || null;
    },

    // MARK: - Adding Items

    addItem: function(item){
        this.insertItemAtIndex(item, this._items.length);
    },

    addItemWithTitle: function(title, action, target){
        var item = UIMenuItem.initWithTitle(title, action, target);
        this.addItem(item);
        return item;
    },

    insertItemAtIndex: function(item, index){
        this._items.splice(index, 0, item);
        item.index = index;
        item.menu = this;
        if (item.tag !== null){
            this._itemsByTag[item.tag] = item;
        }
        if (item.submenu){
            item.submenu.supermenu = this;
        }
        for (var i = index + 1, l = this._items.length; i < l; ++i){
            this._items[i].index = i;
        }
    },

    // MARK: - Removing Items

    removeItemWithTag: function(tag){
        var item = this.itemWithTag(tag);
        if (item !== null){
            this.removeItemAtIndex(item.index);
        }
    },

    removeItem: function(item){
        if (item.menu === this){
            this.removeItemAtIndex(item.index);
        }
    },

    removeItemAtIndex: function(index){
        var item = this._items[index];
        if (item.submenu){
            item.submenu.supermenu = null;
        }
        if (item.tag in this._itemsByTag){
            delete this._itemsByTag[item.tag];
        }
        item.menu = null;
        this._items.splice(index, 1);
        for (var i = index, l = this._items.length; i < l; ++i){
            this._items[i].index = i;
        }
    },

    removeAllItems: function(){
        var item;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            item.menu = null;
            if (item.submenu !== null){
                item.submenu.menu = null;
            }
        }
        this._itemsByTag = {};
        this._items = [];
    },

    // MARK: - Supermenu

    supermenu: null,

    // MARK: - Updating

    updateEnabled: function(){
        this._highlightedItem = null;
        var item;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            item.highlighted = false;
            if (!item.submenu){
                item.enabled = this._isItemEnabled(item);
            }
        }
    },

    _isItemEnabled: function(item){
        var target = item.target;
        if (target === null){
            target = UIApplication.shared.firstTargetForAction(item.action, this._contextTarget, item);
        }
        return target !== null && (!target.canPerformAction || target.canPerformAction(item.action, item));
    },

    // MARK: - Performing Item Actions

    performActionForItem: function(item, contextTarget){
        var target = item.target;
        if (target === null){
            target = contextTarget;
        }
        UIApplication.shared.sendAction(item.action, target, item);
    },

    performKeyEquivalent: function(event){
        var item = this.itemForKeyEquivalent(event);
        if (item !== null){
            this.performActionForItem(item);
            return true;
        }
        return false;
    },

    itemForKeyEquivalent: function(event){
        var item;
        var modifiers;
        if (event.keyCode === 0){
            return null;
        }
        // How to determine the event key equivalent:
        // 1. We could try to use the `event.key` value, which basically comes in
        //    unmodified from the underlying DOM event in an HTML environment, but
        //    the `key` property changes depending on the modifier keys currently
        //    pressed.  If shift is pressed, a `v` becomes `V`.  Capitalization is
        //    easy enough to work around, but the option key can put a completely
        //    different character in the `key` property, like `√`.  And that modified
        //    value changes depending on the keyboard layout, so we don't have a reliable
        //    reversal algorithm.
        // 2. We could try to use the DOM `KeyboardEvent.code` property, because it will
        //    always return 'KeyV' regardless of modifiers.  However, it will also always
        //    return 'KeyV' even if the user has changed their keyboard layout.  So if
        //    they're using a dvorak layout, for example, we still want the shortcut
        //    to be the key that prints a 'v', which is now the `KeyDot` code.
        // 3. The only option that seems to work regardless of layout is to use the
        //    deprecated DOM `KeyboardEvent.keyCode` property, which returnx 0x86
        //    when the user presses the key that prints a 'v', regardless of layout.
        //    This does not account for international layouts that lack a 'v' key,
        //    but that use case needs more investigation to know if the shorcut itself
        //    should change (I'm guessing it probably should)
        var keyEquivalentCode = UIMenu.keyEquivalentCodeForKeyCode(event.keyCode);
        if (keyEquivalentCode !== 0){
            for (var i = 0, l = this._items.length; i < l; ++i){
                item = this._items[i];
                if (!item.hidden){
                    if (item.submenu){
                        item = item.submenu.itemForKeyEquivalent(event);
                        if (item !== null){
                            return item;
                        }
                    }else{
                        modifiers = item.keyModifiers | UIPlatform.shared.commandModifier;
                        if (modifiers == event.modifiers){
                            if (keyEquivalentCode == item._keyEquivalentCode){
                                if (this._isItemEnabled(item)){
                                    return item;
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    },

    // MARK: - Opening a Menu

    window: null,
    _contextTarget: null,

    // Semi-private: used by UIMenuBar
    _createWindow: function(screen){
        this.updateEnabled();
        var window = UIMenuWindow.initWithMenu(this);
        return window;
    },

    _showWindow: function(window, isKey){
        if (isKey === undefined){
            isKey = true;
        }
        this.window = window;
        this.window.makeKeyAndOrderFront();
    },

    _screenMetrics: function(screen){
        var safeFrame = screen.availableFrame.rectWithInsets(4, 7);
        return {
            safeFrame: safeFrame,
            maximumWidth: Math.floor(safeFrame.size.width * 0.3)
        };
    },

    openAdjacentToView: function(view, preferredPlacement){
        if (preferredPlacement === undefined){
            preferredPlacement = UIMenu.Placement.below;
        }
        var window = this._createWindow(view.window.screen);
        var screen = this._screenMetrics(view.window.screen);

        var origin = JSPoint.Zero;
        var size = JSSize(window.frame.size);

        // Ensure we're at least the minimum width
        // (although max width will take precedence)
        if (size.width < this._minimumWidth){
            size.width = this._minimumWidth;
        }

        // Limit width to the max screen width
        if (size.width > screen.maximumWidth){
            size.width = screen.maximumWidth;
        }

        // Figure out how much space we have all around the view
        var viewFrame = view.convertRectToScreen(view.bounds);
        var over;
        var spaces = {
            above: viewFrame.origin.y - screen.safeFrame.origin.y,
            below: screen.safeFrame.origin.y + screen.safeFrame.size.height - viewFrame.origin.y - viewFrame.size.height,
            left: viewFrame.origin.x - screen.safeFrame.origin.x,
            right: screen.safeFrame.origin.x + screen.safeFrame.size.width - viewFrame.origin.x - viewFrame.size.width
        };

        if (preferredPlacement == UIMenu.Placement.above){
            if (spaces.above >= size.height){
                // Place above if there's room
                origin.y = viewFrame.origin.y - size.height;
            }else if (spaces.above * 2 > spaces.below){
                // Place above and adjust height if there's not enough room,
                // but the room that is availble is still preferable to below
                origin.y = screen.safeFrame.origin.y;
                size.height = viewFrame.origin.y - origin.y;
            }else if (spaces.below >= size.height){
                // Place below if there's room
                origin.y = viewFrame.origin.y + viewFrame.size.height;
            }else{
                // Place below and adjust height if there's not enough room
                origin.y = viewFrame.origin.y + viewFrame.size.height;
                size.height = screen.safeFrame.origin.y + screen.safeFrame.size.height - origin.y;
            }
            // Prefer to line up with the left edge
            origin.x = viewFrame.origin.x;
        }else if (preferredPlacement == UIMenu.Placement.left){
            if (spaces.left >= size.width || spaces.left > spaces.right){
                // Place to the left if there's enough room, or if there's
                // more room than on the right
                origin.x = viewFrame.origin.x - size.width;
            }else{
                // Place to the right otherwise
                origin.x = viewFrame.origin.x + viewFrame.size.width;
            }
            // Prefer to line up with the top edge
            origin.y = viewFrame.origin.y;
        }else if (preferredPlacement == UIMenu.Placement.right){
            if (spaces.right >= size.width || spaces.right > spaces.left){
                // Place to the right if there's enough room, or if there's more
                // room than on the left
                origin.x = viewFrame.origin.x + viewFrame.size.width;
            }else{
                // Place to the left otherwise
                origin.x = viewFrame.origin.x - size.width;
            }
            // Prefer to line up with the top edge
            origin.y = viewFrame.origin.y;
        }else{
            if (spaces.below >= size.height){
                // Place below if there's enough room
                origin.y = viewFrame.origin.y + viewFrame.size.height;
            }else if (spaces.below * 2 > spaces.above){
                // Place below and adjust height if there's not enough room,
                // but the available room is still preferable to above
                origin.y = viewFrame.origin.y + viewFrame.size.height;
                size.height = screen.safeFrame.origin.y + screen.safeFrame.size.height - origin.y;
            }else if (spaces.above >= size.height){
                // Place above if there's enough room
                origin.y = viewFrame.origin.y - size.height;
            }else{
                // Place above and adjust height if there's not enough room
                origin.y = screen.safeFrame.origin.y;
                size.height = viewFrame.origin.y - origin.y;
            }
            // Prefer to line up iwth the left edge
            origin.x = viewFrame.origin.x;
        }

        // Adjust our x position if we've overflowed either side
        over = origin.x + size.width - screen.safeFrame.origin.x - screen.safeFrame.size.width;
        if (over > 0){
            origin.x -= over;
        }
        if (origin.x < screen.safeFrame.origin.x){
            origin.x = screen.safeFrame.origin.x;
        }

        // Make sure the height is no taller than the safe space
        if (size.height > screen.safeFrame.size.height){
            size.height = screen.safeFrame.size.height;
        }

        // Adjsut the y position if we've overflowed
        // NOTE: y adjustments should not be necessary in the .above and .below
        // cases becuase they set the origin and height to valid values.
        over = origin.y + size.height - screen.safeFrame.origin.y - screen.safeFrame.size.height;
        if (over > 0){
            origin.y -= over;
        }
        if (origin.y < screen.safeFrame.origin.y){
            origin.y = screen.safeFrame.origin.y;
        }

        window.frame = JSRect(origin, size);
        this._showWindow(window);
    },

    openWithItemAtLocationInView: function(targetItem, location, view){
        var window = this._createWindow(view.window.screen);
        var screen = this._screenMetrics(view.window.screen);
        var size = JSSize(window.frame.size);

        // Ensure we're at least the minimum width
        // (although max width will take precedence)
        if (size.width < this._minimumWidth){
            size.width = this._minimumWidth;
        }

        // Limit width to the max screen width
        if (size.width > screen.maximumWidth){
            size.width = screen.maximumWidth;
        }

        var locationInScreen = view.convertPointToScreen(location);
        var targetLocation = window.locationOfItem(targetItem);

        // Set our origin so the origin of the target item matches the given location
        var origin = JSPoint(locationInScreen.x - targetLocation.x, locationInScreen.y - targetLocation.y);

        // Adjust our x position if we've overflowed
        var over = origin.x + size.width - screen.safeFrame.origin.x - screen.safeFrame.size.width;
        if (over > 0){
            origin.x -= over;
        }
        if (origin.x < screen.safeFrame.origin.x){
            origin.x = screen.safeFrame.origin.x;
        }

        var offset = JSPoint.Zero;

        // If we extend beyond the top of the safe area, adjust our origin, size, and
        // scroll position so to the target item still lines up
        if (origin.y < screen.safeFrame.origin.y){
            over = screen.safeFrame.origin.y - origin.y;
            origin.y = screen.safeFrame.origin.y;
            if (locationInScreen.y >= screen.safeFrame.origin.y && size.height - over >= 60){
                offset.y = over;
                size.height -= over;
            }
        }

        // If we extend beyond the bottom, adjust our height
        over = origin.y + size.height - screen.safeFrame.origin.y - screen.safeFrame.size.height;
        if (over > 0){
            if ((locationInScreen.y >= screen.safeFrame.origin.y + screen.safeFrame.size.height) || (size.height - over < 60)){
                origin.y = screen.safeFrame.origin.y + screen.safeFrame.size.height - size.height;
            }else{
                size.height -= over;
            }
        }

        window.frame = JSRect(origin, size);
        window.layoutIfNeeded();
        window.contentOffset = offset;
        this._showWindow(window);
    },

    openAtLocationInContextView: function(location, view){
        this._contextTarget = view;
        this._openWithFirstItemRightOfRectInView(JSRect(location, JSSize(1,0)), view);
    },

    _openAsSubmenu: function(parentItemView){
        this._contextTarget = this.supermenu._contextTarget;
        this._openWithFirstItemRightOfRectInView(parentItemView.bounds, parentItemView, false);
        this.window.makeKey();
    },

    _openWithFirstItemRightOfRectInView: function(rect, view){
        var window = this._createWindow(view.window.screen);
        var screen = this._screenMetrics(view.window.screen);

        var origin = JSPoint.Zero;
        var size = JSSize(window.frame.size);

        // Ensure we're at least the minimum width
        // (although max width will take precedence)
        if (size.width < this._minimumWidth){
            size.width = this._minimumWidth;
        }

        // Limit width to the max screen width
        if (size.width > screen.maximumWidth){
            size.width = screen.maximumWidth;
        }

        // Figure out how much space we have on either side of the target rect
        // IMPORTANT: target rect is assumed to leave enough room on at least
        // one side.   In our two uses cases 1) submenus, and 2) context menus,
        // this must be true because 1) a menu is < 1/3 screen wide, leaving
        // at least 1/3 on one side, and 2) context menu rects are Zero size
        var viewFrame = view.convertRectToScreen(rect);

        // If our rect if offscreen to the left or right, move it over
        if (viewFrame.origin.x + viewFrame.size.width < screen.safeFrame.origin.x){
            viewFrame.origin.x = screen.safeFrame.origin.x - viewFrame.size.width;
        }else if (viewFrame.origin.x > screen.safeFrame.origin.x + screen.safeFrame.size.width){
            viewFrame.origin.x = screen.safeFrame.origin.x + screen.safeFrame.size.width;
        }

        // If our rect is offscreen to the top, move it down
        if (viewFrame.origin.y < screen.safeFrame.origin.y){
            viewFrame.origin.y = screen.safeFrame.origin.y;
        }

        var over;

        var spaces = {
            left: viewFrame.origin.x - screen.safeFrame.origin.x,
            right: screen.safeFrame.origin.x + screen.safeFrame.size.width - viewFrame.origin.x - viewFrame.size.width
        };

        // Prefer the right side, but use left if there's not enough space
        if (spaces.right >= size.width){
            origin.x = viewFrame.origin.x + viewFrame.size.width;
        }else{
            origin.x = viewFrame.origin.x - size.width;
        }

        // Prefer the y origin at the top of our rect
        origin.y = viewFrame.origin.y;

        // Adjust the y origin so it is even with the top of the first item
        if (this._items.length > 0){
            // NOTE: assuming no scale factor between window and screen
            // Can't convert point to screen coordinates because the window
            // hasn't been added to a screen yet
            origin.y -= window.locationOfItem(this._items[0]).y;
        }

        // Adjust the height so it's no taller than the safe area
        if (size.height > screen.safeFrame.size.height){
            size.height = screen.safeFrame.size.height;
        }

        // Adjust the y origin up if we'd otherwise overflow
        over = origin.y + size.height - screen.safeFrame.origin.y - screen.safeFrame.size.height;
        if (over > 0){
            origin.y -= over;
        }

        // Make sure the y origin is at least 0
        if (origin.y < screen.safeFrame.origin.y){
            origin.y = screen.safeFrame.origin.y;
        }

        window.frame = JSRect(origin, size);
        this._showWindow(window);
    },

    // MARK: - Closing

    isClosing: false,

    close: function(){
        if (this.window.layer.animationsByKey.alpha){
            this.window.layer.removeAnimationForKey('alpha');
        }
        this._contextTarget = null;
        this.window.close();
        this.window = null;
        this.isClosing = false;
        if (this.delegate && this.delegate.menuDidClose){
            this.delegate.menuDidClose(this);
        }
    },

    closeWithAnimation: function(){
        if (this.isClosing){
            return;
        }
        this.isClosing = true;
        var menu = this;
        UIView.animateWithDuration(0.2, function(){
            menu.window.alpha = 0;
        }, function(){
            menu.close();
        });
    }

});

UIMenu.Placement = {
    below: 0,
    right: 1,
    above: 2,
    left: 3
};

JSClass("UIMenuStyler", UIWindowStyler, {

    initializeMenu: function(menu, window){
    },

    layoutMenuWindow: function(window){
    },

    getItemTitleOffset: function(menu){
        return JSPoint.Zero;
    },

    initializeSeparatorView: function(view){
    },

    initializeItemView: function(view){
    },

    updateItemView: function(view, item){
    },

    sizeItemViewToFit: function(view, item){
    },

    layoutItemView: function(view, item){
    },

    layoutSeparatorView: function(view){
    }

});

var defaultTextColor = JSColor.initWithRGBA(51/255, 51/255, 51/255, 1);
var defaultHighlightTextColor = JSColor.initWithRGBA(1, 1, 1, 1);
var defaultDisabledTextColor = JSColor.initWithRGBA(223/255, 223/255, 223/255, 1);
var defaultHighlightColor = JSColor.initWithRGBA(70/255, 153/255, 254/255, 1);
var defaultBackgroundColor = JSColor.initWithRGBA(240/255, 240/255, 240/255, 1);
var defaultBorderColor = JSColor.initWithRGBA(184/255, 184/255, 184/255, 1);

JSClass("UIMenuDefaultStyler", UIMenuStyler, {

    cornerRadius: JSDynamicProperty('_cornerRadius', 6),
    capSize: JSDynamicProperty('_capSize', 5),
    textColor: JSDynamicProperty('_textColor', defaultTextColor),
    disabledTextColor: JSDynamicProperty('_disabledTextColor', defaultDisabledTextColor),
    highlightedTextColor: JSDynamicProperty('_highlightedTextColor', defaultHighlightTextColor),
    highlightColor: JSDynamicProperty('_highlightColor', defaultHighlightColor),
    backgroundColor: JSDynamicProperty('_backgroundColor', defaultBackgroundColor),
    borderColor: JSDynamicProperty('_borderColor', defaultBorderColor),
    borderWidth: JSDynamicProperty('_borderWidth', 0.5),
    itemPadding: JSDynamicProperty('_itemPadding', JSInsets(2, 3, 2, 7)),
    indentationSize: JSDynamicProperty('_indentationSize', 10),
    _keyWidth: 0,

    initWithSpec: function(spec, values){
        UIMenuDefaultStyler.$super.initWithSpec.call(this, spec, values);
        if ('capSize' in values){
            this._capSize = spec.resolvedValue(values.capSize);
        }
        if ('cornerRadius' in values){
            this._cornerRadius = spec.resolvedValue(values.cornerRadius);
        }
        if ('textColor' in values){
            this._textColor = spec.resolvedValue(values.textColor);
        }
        if ('disabledTextColor' in values){
            this._disabledTextColor = spec.resolvedValue(values.disabledTextColor);
        }
        if ('highlightedTextColor' in values){
            this._highlightedTextColor = spec.resolvedValue(values.highlightedTextColor);
        }
        if ('highlightColor' in values){
            this._highlightColor = spec.resolvedValue(values.highlightColor);
        }
        if ('backgroundColor' in values){
            this._backgroundColor = spec.resolvedValue(values.backgroundColor);
        }
        if ('borderColor' in values){
            this._borderColor = spec.resolvedValue(values.borderColor);
        }
        if ('borderWidth' in values){
            this._borderWidth = spec.resolvedValue(values.borderWidth);
        }
    },

    initializeWindow: function(window){
        window.borderColor = this._borderColor;
        window.borderWidth = this._borderWidth;
        window.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
        window.shadowRadius = 14;
        window.cornerRadius = this._cornerRadius;
        window.contentView.backgroundColor = this._backgroundColor;
    },

    initializeMenu: function(menu, window){
        this.initializeWindow(window);
        window.upIndicatorView.backgroundColor = this._backgroundColor;
        window.downIndicatorView.backgroundColor = this._backgroundColor;
        window.upIndicatorImageView.templateColor = this._textColor;
        window.downIndicatorImageView.templateColor = this._textColor;
        window.menuView.backgroundColor = this._backgroundColor;
        this._keyWidth = Math.ceil(menu.font.widthOfString("W"));
    },

    layoutMenuWindow: function(window){
        var contentView = window.contentView;
        window.clipView.frame = contentView.bounds.rectWithInsets(this._capSize, 0);
        var imageSize = window.upIndicatorImageView.image.size;
        window.upIndicatorView.frame = JSRect(0, 0, contentView.bounds.size.width, imageSize.height);
        window.upIndicatorImageView.position = window.upIndicatorView.bounds.center;
        imageSize = window.downIndicatorImageView.image.size;
        window.downIndicatorView.frame = JSRect(0, contentView.bounds.size.height - imageSize.height, contentView.bounds.size.width, imageSize.height);
        window.downIndicatorImageView.position = window.downIndicatorView.bounds.center;
    },

    getTextColorForItem: function(item){
        if (item.enabled){
            if (item.highlighted){
                return this._highlightedTextColor;
            }
            return this._textColor;
        }
        return this._disabledTextColor;
    },

    initializeSeparatorView: function(view){
        view.frame = JSRect(0, 0, 1, 10);
        view.stylerProperties.lineLayer = UILayer.init();
        view.stylerProperties.lineLayer.backgroundColor = this.disabledTextColor;
        view.layer.addSublayer(view.stylerProperties.lineLayer);
    },

    initializeItemView: function(view){
    },

    updateItemView: function(view, item){
        var textColor = this.getTextColorForItem(item);
        view.titleLabel.font = item.menu.font;
        view.titleLabel.textColor = textColor;
        if (view._submenuImageView !== null){
            view.submenuImageView.templateColor = textColor;
        }
        if (item.keyEquivalent){
            view.keyLabel.font = item.menu.font;
            view.keyLabel.textColor = textColor;
            view.keyModifierLabel.font = item.menu.font;
            view.keyModifierLabel.textColor = textColor;
        }
        if (item.highlighted){
            view.backgroundColor = this.highlightColor;
        }else{
            view.backgroundColor = null;
        }
        if (view._stateImageView !== null){
            view.stateImageView.templateColor = textColor;
        }
    },

    sizeItemViewToFit: function(view, item){
        var size = JSSize(this._itemPadding.left + this._itemPadding.right, 0);
        var lineHeight = item.menu.font.displayLineHeight;
        var imageSize = lineHeight;
        if (item.menu.showStatusColumn){
            size.width += imageSize + this._itemPadding.left;
        }
        if (item.image !== null){
            size.width += imageSize + this._itemPadding.left;
        }
        size.width += this._indentationSize * item._indentationLevel;
        view.titleLabel.sizeToFit();
        size.width += view.titleLabel.frame.size.width;
        if (item.submenu !== null){
            size.width += view._submenuImageView.frame.size.width + this._itemPadding.right;
        }else if (item.keyEquivalent){
            view._keyModifierLabel.sizeToFit();
            size.width += this._keyWidth + view._keyModifierLabel.frame.size.width + this._itemPadding.right;
        }else{
            // make sure the right padding is as much as the left
            size.width += this._itemPadding.left - this._itemPadding.right;
            if (item.menu.showStatusColumn){
                size.width += imageSize + this._itemPadding.left;
            }
        }
        size.height = lineHeight + this._itemPadding.top + this._itemPadding.bottom;
        size.width = Math.ceil(size.width);
        size.height = Math.ceil(size.height);
        view.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutItemView: function(view, item){
        var left = this._itemPadding.left;
        var right = view.bounds.size.width - this._itemPadding.right;
        var lineHeight = item.menu.font.displayLineHeight;
        var imageSize = lineHeight;
        if (item.menu.showStatusColumn){
            if (view._stateImageView !== null && !view._stateImageView.hidden){
                view._stateImageView.frame = JSRect(left, this._itemPadding.top, imageSize, imageSize);
            }
            left += imageSize + this._itemPadding.left;
        }
        if (view._imageView !== null && !view._imageView.hidden){
            view._imageView.frame = JSRect(left, this._itemPadding.top, imageSize, imageSize);
            left += imageSize + this._itemPadding.left;
        }
        left += this._indentationSize * item.indentationLevel;
        if (view._submenuImageView !== null && !view._submenuImageView.hidden){
            view._submenuImageView.frame = JSRect(right - view._submenuImageView.frame.size.width, this._itemPadding.top, imageSize, imageSize);
            right -= view._submenuImageView.frame.size.width + this._itemPadding.right;
        }else if (view._keyLabel !== null && !view._keyLabel.hidden){
            view._keyLabel.frame = JSRect(right - this._keyWidth, this._itemPadding.top, this._keyWidth, view._keyLabel.font.displayLineHeight);
            right -= this._keyWidth;
            view._keyModifierLabel.frame = JSRect(right - view._keyModifierLabel.frame.size.width, this._itemPadding.top, view._keyModifierLabel.frame.size.width, view._keyModifierLabel.font.displayLineHeight);
            right -= view._keyModifierLabel.frame.size.width + this._itemPadding.right;
        }else{
            right += this._itemPadding.right - this._itemPadding.left;
            if (item.menu.showStatusColumn){
                right -= imageSize + this._itemPadding.left;
            }
        }
        if (left > right){
            left = right;
        }
        view.titleLabel.frame = JSRect(left, this._itemPadding.top, right - left, lineHeight);
    },

    layoutSeparatorView: function(view){
        var height = 2;
        view.stylerProperties.lineLayer.frame = JSRect(0, (view.bounds.size.height - height) / 2, view.bounds.size.width, height);
    },

    getItemTitleOffset: function(menu){
        var x = this._itemPadding.left;
        var lineHeight = menu.font.displayLineHeight;
        var imageSize = lineHeight;
        if (menu.showStatusColumn){
            x += imageSize + this._itemPadding.left;
        }
        var y = this._itemPadding.top;
        return JSPoint(x, y);
    }

});

Object.defineProperties(UIMenuDefaultStyler, {
    shared: {
        configurable: true,
        get: function UIMenuDefaultStyler_getShared(){
            var shared = UIMenuDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

Object.defineProperties(UIMenu, {
    defaultStyler: {
        configurable: true,
        get: function UIMenu_getDefaultStyler(){
            Object.defineProperty(UIMenu, 'defaultStyler', {writable: true, value: UIMenuDefaultStyler.shared});
            return UIMenu.defaultStyler;
        },
        set: function UIMenu_setDefaultStyler(defaultStyler){
            Object.defineProperty(UIMenu, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    }
});

UIMenu.keyEquivalentCodeForKeyCode = function(keyCode){
    var characterCode = 0;
    // Key code is fairly reliable for ascii letters and numbers
    // 1. First, convert any uppercase ascii letter to its lowercase variant
    if (keyCode >= 0x41 && keyCode <= 0x5A){ // uppercase A-Z
        keyCode += 0x20; // convert to lowercase
    }
    // 2. Next, go ahead and use the number or letter if that's what we have
    if ((keyCode >= 0x30 && keyCode <= 0x39) || (keyCode >= 0x61 && keyCode <= 0x7A)){ // 0-9, a-z
        characterCode = keyCode;
    }else{
        // 3. Look for some special punctuation-based key codes that correspond to common keyboard shortcuts
        // NOTE: punctuation based shortcuts typically don't care if the shift key is pressed or not, meaning
        // that for a key like +/=, the menu should only have a shortcut for either + or =, not both.  This
        // is similar to how a menu cannot have a shortcut for A and a.
        switch (keyCode){
            // equals key or shift+equals (at least for english)
            // Typically used for zooming because of the shared + symbol
            case 0xBB:
                characterCode = 0x3D; // =
                break;
            // minus key or shift+minus (at least for english)
            // Typically used for zooming
            case 0xBD:
                characterCode = 0x2D; // -
                break;
        }
    }
    return UIMenu.keyEquivalentCodeForCharacterCode(characterCode);
};

UIMenu.keyEquivalentCodeForCharacterCode = function(characterCode){
    if (characterCode >= 0x41 && characterCode <= 0x5A){
        characterCode += 0x20;
    }else{
        switch (characterCode){
            // + is Shift+equals, so convert any + to =
            case 0x2B:
                characterCode = 0x3D;
                break;
            // _ is Shift+minu, so convert any _ to -
            case 0x5F:
                characterCode = 0x2D;
                break;
        }
    }
    return characterCode;
};

})();