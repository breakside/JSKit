// #import Foundation
// #import "UIMenuItem.js"
// #import "UIApplication.js"
// #import "UIPlatform.js"
// #import "UIEvent.js"
// #import "UIWindow.js"
/* global UIMenuWindow */
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
            this._styler = UIMenu.Styler.default;
        }
        this.stylerProperties = {};
    },

    init: function(){
        this._commonInit();
    },

    initWithStyler: function(styler){
        this._styler = styler;
        this._commonInit();
    },

    initWithSpec: function(spec){
        UIMenu.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('styler')){
            this._styler = spec.valueForKey("styler", UIMenu.Styler);
        }
        this._commonInit();
        var item;
        if (spec.containsKey('items')){
            var items = spec.valueForKey('items');
            for (var i = 0, l = items.length; i < l; ++i){
                item = items.valueForKey(i, UIMenuItem);
                this.addItem(item);
            }
        }
    },

    // MARK: - Delegate

    delgate: null,

    // MARK: - Display Properties

    styler: JSDynamicProperty('_styler', null),

    getStyler: function(){
        if (this.supermenu){
            return this.supermenu.styler;
        }
        return this._styler;
    },

    stylerProperties: null,
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

    automaticallyUpdates: true,

    updateEnabled: function(){
        this._highlightedItem = null;
        var item;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            item.highlighted = false;
            if (this.automaticallyUpdates && !item.submenu){
                this._udpateItemEnabled(item);
            }
        }
    },

    _udpateItemEnabled: function(item){
        if (typeof(item.action) === 'function'){
            return;
        }
        var target = item.target;
        if (target === null){
            target = UIApplication.shared.firstTargetForAction(item.action, this._getContextTarget(), item);
        }
        if (item.action == 'undo' || item.action == 'redo'){
            if (target !== null && target.getUndoManager){
                var manager = target.getUndoManager();
                if (manager){
                    if  (!item._originalTitle){
                        item._originalTitle = item.title;
                    }
                    if (item.action == 'undo'){
                        item.title = manager.titleForUndoMenuItem;
                    }else{
                        item.title = manager.titleForRedoMenuItem;
                    }
                }else if (item._originalTitle){
                    item.title = item._originalTitle;
                }
            }else if (item._originalTitle){
                item.title = item._originalTitle;
            }
        }
        item.enabled = target !== null && (!target.canPerformAction || target.canPerformAction(item.action, item));
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
                                this._udpateItemEnabled(item);
                                if (item.enabled){
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

    _contextTarget: null,

    _getContextTarget: function(){
        if (this.supermenu){
            return this.supermenu._getContextTarget();
        }
        return this._contextTarget;
    },

    openAdjacentToView: function(view, preferredPlacement, spacing){
        this._styler.presentMenuAdjacentToView(this, view, preferredPlacement, spacing);
    },

    openWithItemAtLocationInView: function(targetItem, location, view){
        this._styler.presentMenuWithItemAtLocationInView(this, targetItem, location, view);
    },

    openAtLocationInContextView: function(location, view){
        this._contextTarget = view;
        this._styler.presentMenuWithFirstItemRightOfRectInView(this, JSRect(location, JSSize(1,0)), view);
    },

    // MARK: - Closing

    close: function(){
        this._dismiss(false);
    },

    closeWithAnimation: function(){
        this._dismiss(false);
    },

    _dismiss: function(animated){
        this._contextTarget = null;
        this._styler.dismissMenu(this, animated, function(){
            if (this.delegate && this.delegate.menuDidClose){
                this.delegate.menuDidClose(this);
            }
        }, this);
    },

});

UIMenu.Placement = {
    below: 0,
    right: 1,
    above: 2,
    left: 3
};

JSClass("UIMenuStyler", JSObject, {

    presentMenuAdjacentToView: function(menu, view, preferredPlacement, spacing){
    },

    presentMenuWithItemAtLocationInView: function(menu, targetItem, location, view){
    },

    presentMenuWithFirstItemRightOfRectInView: function(menu, rect, view){
    },

    dismissMenu: function(menu, animated, completion, target){
    },

    getItemTitleOffset: function(menu){
        return JSPoint.Zero;
    }

});

var defaultTextColor = JSColor.initWithRGBA(51/255, 51/255, 51/255, 1);
var defaultHighlightTextColor = JSColor.initWithRGBA(1, 1, 1, 1);
var defaultDisabledTextColor = JSColor.initWithRGBA(223/255, 223/255, 223/255, 1);
var defaultHighlightColor = JSColor.initWithRGBA(70/255, 153/255, 254/255, 1);
var defaultBackgroundColor = JSColor.initWithRGBA(240/255, 240/255, 240/255, 1);
var defaultBorderColor = JSColor.initWithRGBA(184/255, 184/255, 184/255, 1);

JSClass("UIMenuWindowStyler", UIMenuStyler, {

    cornerRadius: JSDynamicProperty('_cornerRadius', 6),
    capSize: JSDynamicProperty('_capSize', 5),
    textColor: JSDynamicProperty('_textColor', defaultTextColor),
    disabledTextColor: JSDynamicProperty('_disabledTextColor', defaultDisabledTextColor),
    highlightedTextColor: JSDynamicProperty('_highlightedTextColor', defaultHighlightTextColor),
    highlightColor: JSDynamicProperty('_highlightColor', defaultHighlightColor),
    backgroundColor: JSDynamicProperty('_backgroundColor', defaultBackgroundColor),
    borderColor: JSDynamicProperty('_borderColor', defaultBorderColor),
    borderWidth: JSDynamicProperty('_borderWidth', 0.5),
    itemContentInsets: JSDynamicProperty('_itemContentInsets', JSInsets(2, 3, 2, 7)),
    indentationSize: JSDynamicProperty('_indentationSize', 10),
    separatorSize: 10,
    separatorLineWidth: 2,
    shadowColor: null,
    shadowRadius: 14,
    shadowOffset: null,
    _keyWidth: 0,

    init: function(){
        UIMenuWindowStyler.$super.init.call(this);
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
        this.shadowOffset = JSPoint.Zero;
    },

    initWithSpec: function(spec){
        UIMenuWindowStyler.$super.initWithSpec.call(this, spec);
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.2);
        this.shadowOffset = JSPoint.Zero;
        if (spec.containsKey('capSize')){
            this._capSize = spec.valueForKey("capSize");
        }
        if (spec.containsKey('cornerRadius')){
            this._cornerRadius = spec.valueForKey("cornerRadius");
        }
        if (spec.containsKey('textColor')){
            this._textColor = spec.valueForKey("textColor", JSColor);
        }
        if (spec.containsKey('disabledTextColor')){
            this._disabledTextColor = spec.valueForKey("disabledTextColor", JSColor);
        }
        if (spec.containsKey('highlightedTextColor')){
            this._highlightedTextColor = spec.valueForKey("highlightedTextColor", JSColor);
        }
        if (spec.containsKey('highlightColor')){
            this._highlightColor = spec.valueForKey("highlightColor", JSColor);
        }
        if (spec.containsKey('backgroundColor')){
            this._backgroundColor = spec.valueForKey("backgroundColor", JSColor);
        }
        if (spec.containsKey('borderColor')){
            this._borderColor = spec.valueForKey("borderColor", JSColor);
        }
        if (spec.containsKey('borderWidth')){
            this._borderWidth = spec.valueForKey("borderWidth");
        }
        if (spec.containsKey('shadowColor')){
            this.shadowColor = spec.valueForKey("shadowColor", JSColor);
        }
        if (spec.containsKey('shadowOffset')){
            this.shadowOffset = spec.valueForKey("shadowOffset", JSPoint);
        }
        if (spec.containsKey('shadowRadius')){
            this.shadowRadius = spec.valueForKey("shadowRadius");
        }
        if (spec.containsKey('separatorSize')){
            this.separatorSize = spec.valueForKey("separatorSize");
        }
        if (spec.containsKey('separtorLineWidth')){
            this.separtorLineWidth = spec.valueForKey("separtorLineWidth");
        }
    },

    presentMenuAdjacentToView: function(menu, view, preferredPlacement, spacing){
        if (preferredPlacement === undefined){
            preferredPlacement = UIMenu.Placement.below;
        }
        if (spacing === undefined){
            spacing = 0;
        }
        var window = this.createWindowForMenu(menu);
        var screenMetrics = this.metricsForScreen(view.window.screen);

        var origin = JSPoint.Zero;
        var size = JSSize(window.frame.size);

        // Ensure we're at least the minimum width
        // (although max width will take precedence)
        if (size.width < menu._minimumWidth){
            size.width = menu._minimumWidth;
        }

        // Limit width to the max screen width
        if (size.width > screenMetrics.maximumWidth){
            size.width = screenMetrics.maximumWidth;
        }

        // Figure out how much space we have all around the view
        var viewFrame = view.convertRectToScreen(view.bounds);
        var over;
        var spaces = {
            above: viewFrame.origin.y - screenMetrics.safeFrame.origin.y - spacing,
            below: screenMetrics.safeFrame.origin.y + screenMetrics.safeFrame.size.height - viewFrame.origin.y - viewFrame.size.height - spacing,
            left: viewFrame.origin.x - screenMetrics.safeFrame.origin.x - spacing,
            right: screenMetrics.safeFrame.origin.x + screenMetrics.safeFrame.size.width - viewFrame.origin.x - viewFrame.size.width - spacing
        };

        if (preferredPlacement == UIMenu.Placement.above){
            if (spaces.above >= size.height){
                // Place above if there's room
                origin.y = viewFrame.origin.y - size.height - spacing;
            }else if (spaces.above * 2 > spaces.below){
                // Place above and adjust height if there's not enough room,
                // but the room that is availble is still preferable to below
                origin.y = screenMetrics.safeFrame.origin.y;
                size.height = viewFrame.origin.y - origin.y - spacing;
            }else if (spaces.below >= size.height){
                // Place below if there's room
                origin.y = viewFrame.origin.y + viewFrame.size.height + spacing;
            }else{
                // Place below and adjust height if there's not enough room
                origin.y = viewFrame.origin.y + viewFrame.size.height + spacing;
                size.height = screenMetrics.safeFrame.origin.y + screenMetrics.safeFrame.size.height - origin.y - spacing;
            }
            // Prefer to line up with the left edge
            origin.x = viewFrame.origin.x;
        }else if (preferredPlacement == UIMenu.Placement.left){
            if (spaces.left >= size.width || spaces.left > spaces.right){
                // Place to the left if there's enough room, or if there's
                // more room than on the right
                origin.x = viewFrame.origin.x - size.width - spacing;
            }else{
                // Place to the right otherwise
                origin.x = viewFrame.origin.x + viewFrame.size.width + spacing;
            }
            // Prefer to line up with the top edge
            origin.y = viewFrame.origin.y;
        }else if (preferredPlacement == UIMenu.Placement.right){
            if (spaces.right >= size.width || spaces.right > spaces.left){
                // Place to the right if there's enough room, or if there's more
                // room than on the left
                origin.x = viewFrame.origin.x + viewFrame.size.width + spacing;
            }else{
                // Place to the left otherwise
                origin.x = viewFrame.origin.x - size.width - spacing;
            }
            // Prefer to line up with the top edge
            origin.y = viewFrame.origin.y;
        }else{
            if (spaces.below >= size.height){
                // Place below if there's enough room
                origin.y = viewFrame.origin.y + viewFrame.size.height + spacing;
            }else if (spaces.below * 2 > spaces.above){
                // Place below and adjust height if there's not enough room,
                // but the available room is still preferable to above
                origin.y = viewFrame.origin.y + viewFrame.size.height + spacing;
                size.height = screenMetrics.safeFrame.origin.y + screenMetrics.safeFrame.size.height - origin.y - spacing;
            }else if (spaces.above >= size.height){
                // Place above if there's enough room
                origin.y = viewFrame.origin.y - size.height - spacing;
            }else{
                // Place above and adjust height if there's not enough room
                origin.y = screenMetrics.safeFrame.origin.y;
                size.height = viewFrame.origin.y - origin.y - spacing;
            }
            // Prefer to line up iwth the left edge
            origin.x = viewFrame.origin.x;
        }

        // Adjust our x position if we've overflowed either side
        over = origin.x + size.width - screenMetrics.safeFrame.origin.x - screenMetrics.safeFrame.size.width;
        if (over > 0){
            origin.x -= over;
        }
        if (origin.x < screenMetrics.safeFrame.origin.x){
            origin.x = screenMetrics.safeFrame.origin.x;
        }

        // Make sure the height is no taller than the safe space
        if (size.height > screenMetrics.safeFrame.size.height){
            size.height = screenMetrics.safeFrame.size.height;
        }

        // Adjsut the y position if we've overflowed
        // NOTE: y adjustments should not be necessary in the .above and .below
        // cases becuase they set the origin and height to valid values.
        over = origin.y + size.height - screenMetrics.safeFrame.origin.y - screenMetrics.safeFrame.size.height;
        if (over > 0){
            origin.y -= over;
        }
        if (origin.y < screenMetrics.safeFrame.origin.y){
            origin.y = screenMetrics.safeFrame.origin.y;
        }

        window.frame = JSRect(origin, size);
        
        menu.stylerProperties.window = window;
        window.makeKeyAndOrderFront();
    },

    presentMenuWithItemAtLocationInView: function(menu, targetItem, location, view){
        var window = this.createWindowForMenu(menu);
        var screenMetrics = this.metricsForScreen(view.window.screen);
        var size = JSSize(window.frame.size);

        // Ensure we're at least the minimum width
        // (although max width will take precedence)
        if (size.width < menu._minimumWidth){
            size.width = menu._minimumWidth;
        }

        // Limit width to the max screen width
        if (size.width > screenMetrics.maximumWidth){
            size.width = screenMetrics.maximumWidth;
        }

        var locationInScreen = view.convertPointToScreen(location);
        var targetLocation = window.locationOfItem(targetItem);

        // Set our origin so the origin of the target item matches the given location
        var origin = JSPoint(locationInScreen.x - targetLocation.x, locationInScreen.y - targetLocation.y);

        // Adjust our x position if we've overflowed
        var over = origin.x + size.width - screenMetrics.safeFrame.origin.x - screenMetrics.safeFrame.size.width;
        if (over > 0){
            origin.x -= over;
        }
        if (origin.x < screenMetrics.safeFrame.origin.x){
            origin.x = screenMetrics.safeFrame.origin.x;
        }

        var offset = JSPoint.Zero;

        // If we extend beyond the top of the safe area, adjust our origin, size, and
        // scroll position so to the target item still lines up
        if (origin.y < screenMetrics.safeFrame.origin.y){
            over = screenMetrics.safeFrame.origin.y - origin.y;
            origin.y = screenMetrics.safeFrame.origin.y;
            if (locationInScreen.y >= screenMetrics.safeFrame.origin.y + 40 && size.height - over >= 100){
                offset.y = over;
                size.height -= over;
            }
        }

        // If we extend beyond the bottom, adjust our height
        over = origin.y + size.height - screenMetrics.safeFrame.origin.y - screenMetrics.safeFrame.size.height;
        if (over > 0){
            if ((locationInScreen.y >= screenMetrics.safeFrame.origin.y + screenMetrics.safeFrame.size.height) || (size.height - over < 60)){
                origin.y = screenMetrics.safeFrame.origin.y + screenMetrics.safeFrame.size.height - size.height;
            }else{
                size.height -= over;
            }
        }

        window.frame = JSRect(origin, size);
        window.layoutIfNeeded();
        window.contentOffset = offset;

        menu.stylerProperties.window = window;
        window.makeKeyAndOrderFront();
    },

    presentMenuWithFirstItemRightOfRectInView: function(menu, rect, view){
        var window = this.createWindowForMenu(menu);
        var screenMetrics = this.metricsForScreen(view.window.screen);

        var origin = JSPoint.Zero;
        var size = JSSize(window.frame.size);

        // Ensure we're at least the minimum width
        // (although max width will take precedence)
        if (size.width < menu._minimumWidth){
            size.width = menu._minimumWidth;
        }

        // Limit width to the max screen width
        if (size.width > screenMetrics.maximumWidth){
            size.width = screenMetrics.maximumWidth;
        }

        // Figure out how much space we have on either side of the target rect
        // IMPORTANT: target rect is assumed to leave enough room on at least
        // one side.   In our two uses cases 1) submenus, and 2) context menus,
        // menu must be true because 1) a menu is < 1/3 screen wide, leaving
        // at least 1/3 on one side, and 2) context menu rects are Zero size
        var viewFrame = view.convertRectToScreen(rect);

        // If our rect if offscreen to the left or right, move it over
        if (viewFrame.origin.x + viewFrame.size.width < screenMetrics.safeFrame.origin.x){
            viewFrame.origin.x = screenMetrics.safeFrame.origin.x - viewFrame.size.width;
        }else if (viewFrame.origin.x > screenMetrics.safeFrame.origin.x + screenMetrics.safeFrame.size.width){
            viewFrame.origin.x = screenMetrics.safeFrame.origin.x + screenMetrics.safeFrame.size.width;
        }

        // If our rect is offscreen to the top, move it down
        if (viewFrame.origin.y < screenMetrics.safeFrame.origin.y){
            viewFrame.origin.y = screenMetrics.safeFrame.origin.y;
        }

        var over;

        var spaces = {
            left: viewFrame.origin.x - screenMetrics.safeFrame.origin.x,
            right: screenMetrics.safeFrame.origin.x + screenMetrics.safeFrame.size.width - viewFrame.origin.x - viewFrame.size.width
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
        if (menu._items.length > 0){
            // NOTE: assuming no scale factor between window and screen
            // Can't convert point to screen coordinates because the window
            // hasn't been added to a screen yet
            origin.y -= window.locationOfItem(menu._items[0]).y;
        }

        // Adjust the height so it's no taller than the safe area
        if (size.height > screenMetrics.safeFrame.size.height){
            size.height = screenMetrics.safeFrame.size.height;
        }

        // Adjust the y origin up if we'd otherwise overflow
        over = origin.y + size.height - screenMetrics.safeFrame.origin.y - screenMetrics.safeFrame.size.height;
        if (over > 0){
            origin.y -= over;
        }

        // Make sure the y origin is at least 0
        if (origin.y < screenMetrics.safeFrame.origin.y){
            origin.y = screenMetrics.safeFrame.origin.y;
        }

        window.frame = JSRect(origin, size);

        menu.stylerProperties.window = window;
        window.makeKeyAndOrderFront();
    },

    dismissMenu: function(menu, animated, completion, target){
        var window = menu.stylerProperties.window;
        if (!window){
            completion.call(target);
            return;
        }
        menu.stylerProperties.window = null;
        if (window.layer.animationsByKey.alpha){
            window.layer.removeAnimationForKey('alpha');
        }
        if (!animated){
            window.close();
            completion.call(target);
        }else{
            var animator = UIViewPropertyAnimator.initWithDuration(0.25);
            animator.addAnimations(function(){
                window.alpha = 0;
            });
            animator.addCompletion(function(){
                completion.call(target);
            });
            animator.start();
        }
    },

    metricsForScreen: function(screen){
        var safeFrame = screen.availableFrame.rectWithInsets(4, 7);
        return {
            safeFrame: safeFrame,
            maximumWidth: Math.floor(safeFrame.size.width * 0.3)
        };
    },

    createWindowForMenu: function(menu){
        menu.updateEnabled();
        var window = UIMenuWindow.initWithMenu(menu);
        window.borderColor = this._borderColor;
        window.borderWidth = this._borderWidth;
        window.shadowColor = this.shadowColor;
        window.shadowOffset = this.shadowOffset;
        window.shadowRadius = this.shadowRadius;
        window.cornerRadius = this._cornerRadius;
        window.contentView.backgroundColor = this._backgroundColor;
        window.upIndicatorView.backgroundColor = this._backgroundColor;
        window.downIndicatorView.backgroundColor = this._backgroundColor;
        window.upIndicatorImageView.templateColor = this._textColor;
        window.downIndicatorImageView.templateColor = this._textColor;
        window.menuView.backgroundColor = this._backgroundColor;
        window.capSize = this._capSize;
        window.separatorColor = this.disabledTextColor;
        window.separatorLineWidth = this.separtorLineWidth;
        window.separatorSize = this.separatorSize;
        window.itemContentInsets = this._itemContentInsets;
        window.indentationSize = this.indentationSize;
        window.highlightColor = this.highlightColor;
        window.textColor = this.textColor;
        window.highlightedTextColor = this.highlightedTextColor;
        window.disabledTextColor = this.disabledTextColor;
        window.update();
        return window;
    },

    getItemTitleOffset: function(menu){
        var x = this._itemContentInsets.left;
        var lineHeight = menu.font.displayLineHeight;
        var imageSize = lineHeight;
        if (menu.showStatusColumn){
            x += imageSize + this._itemContentInsets.left;
        }
        var y = this._itemContentInsets.top;
        return JSPoint(x, y);
    }

});

UIMenu.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIMenu_getDefaultStyler(){
            var styler = UIMenuWindowStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIMenu_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
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