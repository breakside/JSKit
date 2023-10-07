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

// #import "UIControl.js"
// #import "UILabel.js"
// #import "UIImageView.js"
// #import "UIMenu.js"
// #import "JSColor+UIKit.js"
'use strict';

(function(){

JSClass("UIPopupButton", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    titleInsets: JSDynamicProperty('_titleInsets', null),
    imageView: JSReadOnlyProperty('_imageView', null),
    indicatorView: JSReadOnlyProperty('_indicatorView', null),
    menu: JSReadOnlyProperty('_menu', null),
    selectedIndex: JSDynamicProperty('_selectedIndex', -1),
    selectedTag: JSDynamicProperty(),
    _selectedItem: null,
    maxTitleWidth: JSDynamicProperty('_maxTitleWidth', null),
    _imageTitleSpacing: 3,
    pullsDown: JSDynamicProperty('_pullsDown', false),
    showsIndicator: JSDynamicProperty('_showsIndicator', true),

    initWithSpec: function(spec){
        if (spec.containsKey('pullsDown')){
            this._pullsDown = spec.valueForKey('pullsDown');
        }
        if (spec.containsKey('showsIndicator')){
            this._showsIndicator = spec.valueForKey('showsIndicator');
        }
        UIPopupButton.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('font')){
            this._titleLabel.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey('title')){
            this._titleLabel.text = spec.valueForKey("title");
        }
        if (spec.containsKey('titleInsets')){
            this._titleInsets = spec.valueForKey("titleInsets", JSInsets);
        }
        if (spec.containsKey('image')){
            this._imageView.image = spec.valueForKey("image", JSImage);
        }
        if (spec.containsKey('menu')){
            this._menu = spec.valueForKey("menu", UIMenu);
        }else if (spec.containsKey('options')){
            var options = spec.valueForKey('options');
            for (var i = 0, l = options.length; i < l; ++i){
                this.addItemWithTitle(options.valueForKey(i));
            }
        }
        if (spec.containsKey("menuAdoptsTitleFont")){
            this.menuAdoptsTitleFont = spec.valueForKey("menuAdoptsTitleFont");
        }
    },

    commonUIControlInit: function(){
        UIPopupButton.$super.commonUIControlInit.call(this);
        this._imageView = UIImageView.init();
        this._imageView.hidden = true;
        this._titleLabel = UILabel.init();
        this._titleLabel.backgroundColor = JSColor.clear;
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        this._indicatorView = UIImageView.init();
        this._updateIndicatorView();
        this._titleInsets = JSInsets.Zero;
        this.addSubview(this._indicatorView);
        this.addSubview(this._imageView);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UIPopupButton.Styler.default;
        }
        this.hasOverState = this._styler.showsOverState;
        this._styler.initializeControl(this);
        this._menu = UIMenu.initWithStyler(this._styler.menuStyler);
        this._menu.automaticallyUpdates = false;
    },

    setPullsDown: function(pullsDown){
        this._pullsDown = pullsDown;
        this._updateIndicatorView();
    },

    setShowsIndicator: function(showsIndicator){
        this._showsIndicator = showsIndicator;
        this.setNeedsLayout();
    },

    _updateIndicatorView: function(){
        if (this._pullsDown){
            this._indicatorView.image = images.pulldownIndicator;
        }else{
            this._indicatorView.image = images.popupIndicator;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Adding Items

    addItemWithTitle: function(title, tag){
        return this.insertItemWithTitleAtIndex(title, this.menu.items.length, tag);
    },

    insertItemWithTitleAtIndex: function(title, index, tag){
        var item = UIMenuItem.initWithTitle(title, "menuDidSelectItem", this);
        item.enabled = true;
        if (tag !== null && tag !== undefined){
            item.tag = tag;
        }
        this.menu.insertItemAtIndex(item, index);
        if (this.menu.items.length === 1){
            this.selectedIndex = index;
            this._selectedItem.state = UIMenuItem.State.on;
            this._updateTitleForItem(this._selectedItem);
        }
        this.invalidateIntrinsicSize();
        return item;
    },

    removeAllItems: function(){
        if (this.menu.items.length > 0){
            this.menu.removeAllItems();
            this.selectedIndex = -1;
            this._updateTitleForItem(null);
            this.invalidateIntrinsicSize();
        }
    },

    getTitleLabel: function(){
        return this._titleLabel;
    },

    getMaxTitleWidth: function(){
        if (this._maxTitleWidth === null){
            this._maxTitleWidth = 0;
            var width;
            var item;
            for (var i = 0, l = this.menu.items.length; i < l; ++i){
                item = this.menu.items[i];
                width = 0;
                if (item.title){
                    width += this._titleLabel.font.widthOfString(item.title);
                    if (item.image){
                        width += this._imageTitleSpacing;
                    }
                }
                if (item.image){
                    width += this._titleLabel.font.displayLineHeight;
                }
                if (width > this._maxTitleWidth){
                    this._maxTitleWidth = Math.ceil(width);
                }
            }
        }
        return this._maxTitleWidth;
    },

    _isMenuOpen: false,

    // -------------------------------------------------------------------------
    // MARK: - Responder

    canBecomeFirstResponder: function(){
        return this.enabled && this.fullKeyboardAccessEnabled;
    },

    becomeFirstResponder: function(){
    },

    resignFirstResponder: function(){
    },

    mouseDown: function(event){
        if (this.enabled){
            this.active = true;
            this.openMenu();
            return;
        }
        UIPopupButton.$super.mouseDown.call(this, event);
    },

    mouseUp: function(event){
        if (this.enabled){
            if (!this._isMenuOpen){
                this.active = false;
            }
            return;
        }
        UIPopupButton.$super.mouseUp.call(this, event);
    },

    mouseDragged: function(event){
        if (this.enabled){
            if (!this._isMenuOpen){
                var location = event.locationInView(this);
                this.active = this.containsPoint(location);
            }
            return;
        }
        return UIPopupButton.$super.mouseDragged.call(this, event);
    },

    touchesBegan: function(touches, event){
        if (this.enabled){
            this.active = true;
            return;
        }
        UIPopupButton.$super.touchesBegan.call(this, touches, event);
    },

    touchesMoved: function(touches, event){
        if (this.enabled){
            var touch = touches[0];
            var location = touch.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UIPopupButton.$super.touchesMoved.call(this, touches, event);
    },

    touchesEnded: function(touches, event){
        if (this.enabled){
            if (this.active){
                this.openMenu();
                this.active = false;
            }
            return;
        }
        UIPopupButton.$super.touchesEnded.call(this, touches, event);
    },

    touchesCanceled: function(touches, event){
        if (this.enabled){
            this.active = false;
            return;
        }
        UIPopupButton.$super.touchesCanceled.call(this, touches, event);
    },

    keyDown: function(event){
        if (event.key === UIEvent.Key.space){
            this.active = true;
            return;
        }
        UIPopupButton.$super.keyDown.call(this, event);
    },

    keyUp: function(event){
        if (event.key === UIEvent.Key.space){
            if (this.active){
                this.openMenu();
                if (!this._isMenuOpen){
                    this.active = false;
                }
                return;
            }
        }
        UIPopupButton.$super.keyUp.call(this, event);
    },

    // -------------------------------------------------------------------------
    // MARK: - Menu

    menuAdoptsTitleFont: true,

    openMenu: function(){
        if (this.menu.items.length > 0){
            if (this.menuAdoptsTitleFont){
                this.menu.font = this.titleLabel.font;
            }
            this.menu.delegate = this;
            if (this._pullsDown){
                this.menu.minimumWidth = this.frame.size.width;
                this.menu.openAdjacentToView(this, UIMenu.Placement.below, 1);
            }else{
                var itemTitleOffset = this.menu.itemTitleOffset;
                var targetView = this._imageView.hidden ? this._titleLabel : this._imageView;
                var itemOrigin = JSPoint(targetView.frame.origin.x - itemTitleOffset.x, targetView.frame.origin.y - itemTitleOffset.y);
                this.menu.minimumWidth = this.indicatorView.frame.origin.x - itemOrigin.x;
                this.menu.openWithItemAtLocationInView(this._selectedItem, itemOrigin, this);
            }
            this.menu.accessibilityParent = this;
            this._isMenuOpen = true;
        }
    },

    sendsActionForReselect: false,

    menuDidSelectItem: function(item){
        this._updateTitleForItem(item);
        if (this._selectedIndex != item.index || this.sendsActionForReselect){
            this.selectedIndex = item.index;
            this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
        }
        this.active = false;
        // this.menu.delegate = null;
    },

    menuDidClose: function(menu){
        this.active = false;
        this.menu.delegate = null;
        this.menu.accessibilityParent = null;
        this._isMenuOpen = false;
    },

    setSelectedIndex: function(index){
        if (index !== this._selectedIndex){
            if (this._selectedItem !== null){
                this._selectedItem.state = UIMenuItem.State.off;
            }
            if (index >= 0 && index < this.menu.items.length){
                this._selectedIndex = index;
                this._selectedItem = this.menu.items[index];
                this._selectedItem.state = UIMenuItem.State.on;
            }else{
                this._selectedItem = null;
                this._selectedIndex = -1;
            }
        }
        this._updateTitleForItem(this._selectedItem);
    },

    _updateTitleForItem: function(item){
        if (this._pullsDown){
            return;
        }
        if (item === null){
            this._titleLabel.text = "";
            this._imageView.image = null;
        }else{
            this._titleLabel.text = item.title;
            this._imageView.image = item.image;
        }
        this.setNeedsLayout();
    },

    getSelectedTag: function(){
        var item = this.menu.items[this._selectedIndex];
        if (item){
            return item.tag;
        }
        return null;
    },

    setSelectedTag: function(tag){
        if (tag === null){
            this.selectedIndex = -1;
        }else{
            var item = this.menu.itemWithTag(tag);
            if (item){
                this.selectedIndex = item.index;
            }else{
                this.selectedIndex = -1;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    getFirstBaselineOffsetFromTop: function(){
        if (this._titleLabel !== null){
            this.layoutIfNeeded();
            return this.convertPointFromView(JSPoint(0, this._titleLabel.firstBaselineOffsetFromTop), this._titleLabel).y;
        }
        return this._titleInsets.top;
    },

    getLastBaselineOffsetFromBottom: function(){
        if (this._titleLabel !==  null){
            this.layoutIfNeeded();
            return this.convertPointFromView(JSPoint(0, this._titleLabel.lastBaselineOffsetFromBottom), this._titleLabel).y;
        }
        return this._titleInsets.bottom;
    },

    setTitleInsets: function(insets){
        this._titleInsets = JSInsets(insets);
        this.setNeedsLayout();
    },

    invalidateIntrinsicSize: function(){
        this._maxTitleWidth = null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.popupButton,

    getAccessibilityLabel: function(){
        var label = UIButton.$super.getAccessibilityLabel.call(this);
        if (label !== null){
            return label;
        }
        if (this._titleLabel !== null){
            return this._titleLabel.text;
        }
        return null;
    },

    accessibilityMenu: JSReadOnlyProperty(),

    getAccessibilityMenu: function(){
        return this._menu;
    },

    getAccessibilityElements: function(){
        if (this._isMenuOpen){
            return [this._menu];
        }
        return [];
    }

});

UIPopupButton.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIPopupButton_getDefaultStyler(){
            var styler = UIPopupButtonDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIPopupButton_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }
});


JSClass("UIPopupButtonStyler", UIControlStyler, {

    menuStyler: null,

    init: function(){
        this.menuStyler = UIMenu.Styler.default;
    },

    initWithSpec: function(spec){
        UIPopupButtonStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("menuStyler")){
            this.menuStyler = spec.valueForKey("menuStyler", UIMenu.Styler);
        }else{
            this.menuStyler = UIMenu.Styler.default;
        }
    }

});

JSClass("UIPopupButtonCustomStyler", UIPopupButtonStyler, {

    titleInsets: null,
    normalBackgroundColor: null,
    disabledBackgroundColor: null,
    overBackgroundColor: null,
    activeBackgroundColor: null,
    normalBackgroundGradient: null,
    overBackgroundGradient: null,
    disabledBackgroundGradient: null,
    activeBackgroundGradient: null,
    normalBorderColor: null,
    disabledBorderColor: null,
    overBorderColor: null,
    activeBorderColor: null,
    normalTitleColor: null,
    overTitleColor: null,
    disabledTitleColor: null,
    activeTitleColor: null,
    borderWidth: 0,
    cornerRadius: 0,
    shadowColor: null,
    shadowOffset: null,
    shadowRadius: 1,
    indicatorSpacing: 0,

    init: function(){
        this.initWithColor(JSColor.text);
    },

    initWithColor: function(color){
        UIPopupButtonCustomStyler.$super.init.call(this);
        this._populateDefaults();
        this.normalTitleColor = color;
        this._fillInMissingColors();
    },

    initWithBackgroundColor: function(backgroundColor, titleColor){
        UIPopupButtonCustomStyler.$super.init.call(this);
        this._populateDefaults();
        this.normalBackgroundColor = backgroundColor;
        this.normalTitleColor = titleColor;
        this._fillInMissingColors();
    },

    initWithSpec: function(spec){
        UIPopupButtonCustomStyler.$super.initWithSpec.call(this, spec);

        this._populateDefaults();

        if (spec.containsKey("titleInsets")){
            this.titleInsets = spec.valueForKey("titleInsets", JSInsets);
        }
        if (spec.containsKey("normalBackgroundColor")){
            this.normalBackgroundColor = spec.valueForKey("normalBackgroundColor", JSColor);
        }
        if (spec.containsKey("overBackgroundColor")){
            this.overBackgroundColor = spec.valueForKey("overBackgroundColor", JSColor);
        }
        if (spec.containsKey("disabledBackgroundColor")){
            this.disabledBackgroundColor = spec.valueForKey("disabledBackgroundColor", JSColor);
        }
        if (spec.containsKey("activeBackgroundColor")){
            this.activeBackgroundColor = spec.valueForKey("activeBackgroundColor", JSColor);
        }
        if (spec.containsKey("normalBackgroundGradient")){
            this.normalBackgroundGradient = spec.valueForKey("normalBackgroundGradient", JSGradient);
        }
        if (spec.containsKey("overBackgroundGradient")){
            this.overBackgroundGradient = spec.valueForKey("overBackgroundGradient", JSGradient);
        }
        if (spec.containsKey("disabledBackgroundGradient")){
            this.disabledBackgroundGradient = spec.valueForKey("disabledBackgroundGradient", JSGradient);
        }
        if (spec.containsKey("activeBackgroundGradient")){
            this.activeBackgroundGradient = spec.valueForKey("activeBackgroundGradient", JSGradient);
        }
        if (spec.containsKey("normalBorderColor")){
            this.normalBorderColor = spec.valueForKey("normalBorderColor", JSColor);
        }
        if (spec.containsKey("overBorderColor")){
            this.overBorderColor = spec.valueForKey("overBorderColor", JSColor);
        }
        if (spec.containsKey("disabledBorderColor")){
            this.disabledBorderColor = spec.valueForKey("disabledBorderColor", JSColor);
        }
        if (spec.containsKey("activeBorderColor")){
            this.activeBorderColor = spec.valueForKey("activeBorderColor", JSColor);
        }
        if (spec.containsKey("normalTitleColor")){
            this.normalTitleColor = spec.valueForKey("normalTitleColor", JSColor);
        }
        if (spec.containsKey("overTitleColor")){
            this.overTitleColor = spec.valueForKey("overTitleColor", JSColor);
        }
        if (spec.containsKey("disabledTitleColor")){
            this.disabledTitleColor = spec.valueForKey("disabledTitleColor", JSColor);
        }
        if (spec.containsKey("activeTitleColor")){
            this.activeTitleColor = spec.valueForKey("activeTitleColor", JSColor);
        }
        if (spec.containsKey("shadowColor")){
            this.shadowColor = spec.valueForKey("shadowColor", JSColor);
        }
        if (spec.containsKey("shadowOffset")){
            this.shadowOffset = spec.valueForKey("shadowOffset", JSPoint);
        }
        if (spec.containsKey("shadowRadius")){
            this.shadowRadius = spec.valueForKey("shadowRadius", Number);
        }
        if (spec.containsKey("borderWidth")){
            this.borderWidth = spec.valueForKey("borderWidth", Number);
        }
        if (spec.containsKey("indicatorSpacing")){
            this.indicatorSpacing = spec.valueForKey("indicatorSpacing", Number);
        }
        if (spec.containsKey("cornerRadius")){
            this.cornerRadius = spec.valueForKey("cornerRadius", Number);
        }

        this._fillInMissingColors();
    },

    _populateDefaults: function(){
        if (this.titleInsets === null){
            this.titleInsets = JSInsets.Zero;
        }
        if (this.shadowOffset === null){
            this.shadowOffset = JSPoint.Zero;
        }
    },

    _fillInMissingColors: function(){
        if (this.normalBackgroundColor !== null){
            if (this.activeBackgroundColor === null){
                this.activeBackgroundColor = this.normalBackgroundColor.colorDarkenedByPercentage(0.2);
            }
            if (this.disabledBackgroundColor === null){
                this.disabledBackgroundColor = this.normalBackgroundColor.colorWithAlpha(0.5);
            }
        }
        if (this.normalBorderColor !== null){
            if (this.activeBorderColor === null){
                this.activeBorderColor = this.normalBorderColor.colorDarkenedByPercentage(0.2);
            }
            if (this.overBorderColor === null){
                this.overBorderColor = this.normalBorderColor.colorDarkenedByPercentage(0.2);
            }
            if (this.disabledBorderColor === null){
                this.disabledBorderColor = this.normalBorderColor.colorWithAlpha(0.5);
            }
        }
        if (this.normalTitleColor === null){
            this.normalTitleColor = JSColor.text;
        }
        if (this.overTitleColor === null){
            this.overTitleColor = this.normalTitleColor.colorDarkenedByPercentage(0.2);
        }
        if (this.activeTitleColor === null){
            this.activeTitleColor = this.normalTitleColor.colorDarkenedByPercentage(0.2);
        }
        if (this.disabledTitleColor === null){
            this.disabledTitleColor = this.normalTitleColor.colorWithAlpha(0.5);
        }
    },

    initializeControl: function(button){
        button.titleInsets = this.titleInsets;
        button.layer.borderWidth = this.borderWidth;
        button.layer.cornerRadius = this.cornerRadius;
        button.layer.shadowColor = this.shadowColor;
        button.layer.shadowOffset = this.shadowOffset;
        button.layer.shadowRadius = this.shadowRadius;
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button.layer.backgroundColor = this.disabledBackgroundColor;
            button.layer.backgroundGradient = this.disabledBackgroundGradient;
            button.layer.borderColor = this.disabledBorderColor;
            button._titleLabel.textColor = this.disabledTitleColor;
            button._imageView.templateColor = this.disabledTitleColor;
            button._indicatorView.templateColor = this.disabledTitleColor;
        }else if (button.over){
            button.layer.backgroundColor = this.overBackgroundColor;
            button.layer.backgroundGradient = this.overBackgroundGradient;
            button.layer.borderColor = this.overBorderColor;
            button._titleLabel.textColor = this.overTitleColor;
            button._imageView.templateColor = this.overTitleColor;
            button._indicatorView.templateColor = this.overTitleColor;
        }else if (button.active){
            button.layer.backgroundColor = this.activeBackgroundColor;
            button.layer.backgroundGradient = this.activeBackgroundGradient;
            button.layer.borderColor = this.activeBorderColor;
            button._titleLabel.textColor = this.activeTitleColor;
            button._imageView.templateColor = this.activeTitleColor;
            button._indicatorView.templateColor = this.activeTitleColor;
        }else{
            button.layer.backgroundColor = this.normalBackgroundColor;
            button.layer.backgroundGradient = this.normalBackgroundGradient;
            button.layer.borderColor = this.normalBorderColor;
            button._titleLabel.textColor = this.normalTitleColor;
            button._imageView.templateColor = this.normalTitleColor;
            button._indicatorView.templateColor = this.normalTitleColor;
        }
    },

    sizeControlToFitSize: function(button, size){
        button.bounds = JSRect(JSPoint.Zero, this.intrinsicSizeOfControl(button));
    },

    layoutControl: function(button){
        var height = button.titleLabel.font.displayLineHeight;
        var insets = button._titleInsets;
        var indicatorSize = JSSize(height, height);
        var indicatorSpacing = this.indicatorSpacing;
        if (!button.showsIndicator){
            indicatorSpacing = 0;
            indicatorSize = JSSize.Zero;
        }
        var imageSize = height;
        button.indicatorView.hidden = !button.showsIndicator;
        button.indicatorView.frame = JSRect(button.bounds.size.width - insets.right - indicatorSize.width, insets.top, indicatorSize.width, indicatorSize.height);
        button._imageView.hidden = button._imageView.image === null;
        var x = insets.left;
        button._imageView.frame = JSRect(x, insets.top, imageSize, imageSize);
        if (!button._imageView.hidden){
            x += imageSize + button._imageTitleSpacing;
        }
        button.titleLabel.frame = JSRect(x, insets.top, button.indicatorView.frame.origin.x - x - indicatorSpacing, height);
    },

    intrinsicSizeOfControl: function(button){
        var size = JSSize(button._titleInsets.left + button._titleInsets.right, button._titleInsets.top + button._titleInsets.bottom);
        var titleSize;
        if (button._pullsDown){
            titleSize = button._titleLabel.intrinsicSize;
        }else{
            titleSize = JSSize(button.maxTitleWidth, button._titleLabel.font.displayLineHeight);
        }
        var imageSize = button._titleLabel.font.displayLineHeight;
        if (button._imageView.image !== null){
            size.width += imageSize + button._imageTitleSpacing;
        }
        size.width += titleSize.width;
        size.height += titleSize.height;
        if (button.showsIndicator){
            size.width += this.indicatorSpacing;
            var indicatorSize = JSSize(titleSize.height, titleSize.height);
            size.width += indicatorSize.width;
        }
        return size;
    },

});

JSClass("UIPopupButtonDefaultStyler", UIPopupButtonCustomStyler, {

    borderWidth: 1,
    cornerRadius: 3,
    shadowRadius: 1,
    indicatorSpacing: 0,

    _populateDefaults: function(){
        if (this.titleInsets === null){
            this.titleInsets = JSInsets(3, 7, 3, 4);
        }
        if (this.shadowColor === null){
            this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        }
        if (this.shadowOffset === null){
            this.shadowOffset = JSPoint(0, 1);
        }
    },

    _fillInMissingColors: function(){
        if (this.normalBackgroundColor === null){
            this.normalBackgroundColor = JSColor.controlBackground;
            if (this.activeBackgroundColor === null){
                this.activeBackgroundColor = JSColor.activeControlBackground;
            }
            if (this.disabledBackgroundColor === null){
                this.disabledBackgroundColor = JSColor.disabledControlBackground;
            }
        }
        if (this.normalBorderColor === null){
            this.normalBorderColor = JSColor.controlBorder;
            if (this.activeBorderColor === null){
                this.activeBorderColor = JSColor.activeControlBorder;
            }
            if (this.disabledBorderColor === null){
                this.disabledBorderColor = JSColor.disabledControlBorder;
            }
        }
        if (this.normalTitleColor === null){
            this.normalTitleColor = JSColor.controlTitle;
        }
        if (this.activeTitleColor === null){
            this.activeTitleColor = JSColor.activeControlTitle;
        }
        if (this.disabledTitleColor === null){
            this.disabledTitleColor = JSColor.disabledControlTitle;
        }
    }

});

JSClass("UIPopupButtonImageStyler", UIPopupButtonStyler, {

    showsOverState: false,
    normalColor: null,
    disabledColor: null,
    activeColor: null,
    normalBackgroundColor: null,
    activeBackgroundColor: null,
    overBackgroundColor: null,
    cornerRadius: 0,
    titleInsets: null,

    init: function(){
        this.initWithColor(JSColor.text);
    },

    initWithColor: function(color){
        UIPopupButtonCustomStyler.$super.init.call(this);
        this.normalColor = color;
        this._fillInMissingColors();
    },

    initWithBackgroundColor: function(backgroundColor, color){
        UIPopupButtonCustomStyler.$super.init.call(this);
        this.normalBackgroundColor = backgroundColor;
        this.normalColor = color;
        this._fillInMissingColors();
    },

    initWithSpec: function(spec){
        UIPopupButtonCustomStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("normalColor")){
            this.normalColor = spec.valueForKey("normalColor", JSColor);
        }
        if (spec.containsKey("disabledColor")){
            this.disabledColor = spec.valueForKey("disabledColor", JSColor);
        }
        if (spec.containsKey("activeColor")){
            this.activeColor = spec.valueForKey("activeColor", JSColor);
        }
        if (spec.containsKey('normalBackgroundColor')){
            this.normalBackgroundColor = spec.valueForKey("normalBackgroundColor", JSColor);
        }
        if (spec.containsKey("activeBackgroundColor")){
            this.activeBackgroundColor = spec.valueForKey("activeBackgroundColor", JSColor);
        }
        if (spec.containsKey("overBackgroundColor")){
            this.overBackgroundColor = spec.valueForKey("overBackgroundColor", JSColor);
            this.showsOverState = true;
        }
        if (spec.containsKey("cornerRadius")){
            this.cornerRadius = spec.valueForKey("cornerRadius", Number);
        }
        if (spec.containsKey("titleInsets")){
            this.titleInsets = spec.valueForKey("titleInsets", JSInsets);
        }
        this._fillInMissingColors();
    },

    _fillInMissingColors: function(){
        if (this.activeColor === null){
            this.activeColor = this.normalColor.colorDarkenedByPercentage(0.2);
        }
        if (this.disabledColor === null){
            this.disabledColor = this.normalColor.colorWithAlpha(0.5);
        }
        if (this.titleInsets === null){
            this.titleInsets = JSInsets.Zero;
        }
        if (this.normalBackgroundColor !== null){
            if (this.activeBackgroundColor === null){
                this.activeBackgroundColor = this.normalBackgroundColor.colorDarkenedByPercentage(0.2);
            }
            if (this.disabledBackgroundColor === null){
                this.disabledBackgroundColor = this.normalBackgroundColor.colorWithAlpha(0.5);
            }
        }
    },

    initializeControl: function(button){
        button._imageView.automaticRenderMode = JSImage.RenderMode.template;
        button._imageView.scaleMode = UIImageView.ScaleMode.center;
        button._titleLabel.hidden = true;
        button._indicatorView.hidden = true;
        button._titleLabel.frame = JSRect.Zero;
        button._indicatorView.frame = JSRect.Zero;
        button._imageView.hidden = false;
        button.cornerRadius = this.cornerRadius;
        button.titleInsets = this.titleInsets;
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button._imageView.templateColor = this.disabledColor;
            button.backgroundColor = this.normalBackgroundColor;
        }else if (button.active){
            button._imageView.templateColor = this.activeColor;
            button.backgroundColor = this.activeBackgroundColor;
        }else{
            button._imageView.templateColor = this.normalColor;
            if (this.showsOverState && button.over){
                button.backgroundColor = this.overBackgroundColor;
            }else{
                button.backgroundColor = this.normalBackgroundColor;
            }
        }
    },

    sizeControlToFitSize: function(button, size){
        button.bounds = JSRect(JSPoint.Zero, this.intrinsicSizeOfControl(button));
    },

    layoutControl: function(button){
        button._imageView.frame = button.bounds.rectWithInsets(button.titleInsets);
    },

    intrinsicSizeOfControl: function(button){
        var size = JSSize(button._imageView.intrinsicSize);
        size.width += button.titleInsets.width;
        size.height += button.titleInsets.height;
        return size;
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

    popupIndicator: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIPopupButtonIndicator", this.bundle);
            Object.defineProperty(this, 'popupIndicator', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.popupIndicator;
        }
    },

    pulldownIndicator: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIPopupButtonPullsDownIndicator", this.bundle);
            Object.defineProperty(this, 'pulldownIndicator', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.pulldownIndicator;
        }
    }

});
})();