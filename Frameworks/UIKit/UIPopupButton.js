// #import "UIControl.js"
// #import "UILabel.js"
// #import "UIImageView.js"
// #import "UIMenu.js"
/* global JSClass, JSObject, UIControl, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSColor, UIPopupButton, JSTextAlignment, JSPoint, UIView, JSFont, UIPopupButtonStyler, UIPopupButtonDefaultStyler, JSRect, JSImage, JSBundle, UIImageView, JSSize, JSInsets, UIMenu, UIMenuItem */
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

    initWithSpec: function(spec, values){
        if ('pullsDown' in values){
            this._pullsDown = values.pullsDown;
        }
        UIPopupButton.$super.initWithSpec.call(this, spec, values);
        if ('font' in values){
            this._titleLabel.font = JSFont.initWithSpec(spec, values.font);
        }
        if ('title' in values){
            this._titleLabel.text = spec.resolvedValue(values.title);
        }
        if ('titleInsets' in values){
            this._titleInsets = JSInsets.call(undefined, values.titleInsets.parseNumberArray());
        }
        if ('image' in values){
            this._imageView.image = spec.resolvedValue(values.image, "JSImage");
        }
        if ('options' in values){
            for (var i = 0, l = values.options.length; i < l; ++i){
                this.addItemWithTitle(spec.resolvedValue(values.options[i]));
            }
        }
    },

    commonUIControlInit: function(){
        UIPopupButton.$super.commonUIControlInit.call(this);
        this._menu = UIMenu.initWithStyler(this._styler.menuStyler);
        this._menu.automaticallyUpdates = false;
        this._imageView = UIImageView.init();
        this._imageView.hidden = true;
        this._titleLabel = UILabel.init();
        this._titleLabel.backgroundColor = JSColor.clearColor;
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
    },

    setPullsDown: function(pullsDown){
        this._pullsDown = pullsDown;
        this._updateIndicatorView();
    },

    _updateIndicatorView: function(){
        if (this._pullsDown){
            this._indicatorView.image = images.pulldownIndicator;
        }else{
            this._indicatorView.image = images.popupIndicator;
        }
    },

    // MARK: - Adding Items

    addItemWithTitle: function(title, tag){
        var item = this.menu.addItemWithTitle(title, 'menuDidSelectItem', this);
        item.enabled = true;
        if (tag){
            item.tag = tag;
        }
        if (this.menu.items.length === 1){
            this.selectedIndex = 0;
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

    mouseDown: function(event){
        if (this.enabled){
            this.active = true;
            if (this.menu.items.length > 0){
                this.menu.font = this.titleLabel.font;
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
                this._isMenuOpen = true;
            }
        }else{
            UIPopupButton.$super.mouseDown.call(this, event);
        }
    },

    mouseUp: function(event){
        if (!this.enabled || this._isMenuOpen){
            return UIPopupButton.$super.mouseUp.call(this, event);
        }
        this.active = false;
    },

    mouseDragged: function(event){
        if (!this.enabled || this._isMenuOpen){
            return UIPopupButton.$super.mouseDragged.call(this, event);
        }
        var location = event.locationInView(this);
        this.active = this.containsPoint(location);
    },

    sendsActionForReselect: false,

    menuDidSelectItem: function(item){
        this._updateTitleForItem(item);
        if (this._selectedIndex != item.index || this.sendsActionForReselect){
            this.selectedIndex = item.index;
            this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
        }
        this.active = false;
        this.menu.delegate = null;
    },

    menuDidClose: function(menu){
        this.active = false;
        this.menu.delegate = null;
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

    menuStyler: UIMenu.Styler.default,

});

JSClass("UIPopupButtonDefaultStyler", UIPopupButtonStyler, {

    showsOverState: false,
    titleInsets: null,
    normalBackgroundColor: null,
    disabledBackgroundColor: null,
    activeBackgroundColor: null,
    normalBackgroundGradient: null,
    disabledBackgroundGradient: null,
    activeBackgroundGradient: null,
    normalBorderColor: null,
    disabledBorderColor: null,
    activeBorderColor: null,
    normalTitleColor: null,
    disabledTitleColor: null,
    activeTitleColor: null,
    borderWidth: 1,
    cornerRadius: 3,
    shadowColor: null,
    shadowOffset: null,
    shadowRadius: 1,
    indicatorSpacing: 0,

    init: function(){
        this.titleInsets = JSInsets(3, 7, 3, 4);
        this.normalBackgroundColor = UIPopupButtonDefaultStyler.NormalBackgroundColor;
        this.disabledBackgroundColor = UIPopupButtonDefaultStyler.DisabledBackgroundColor;
        this.activeBackgroundColor = UIPopupButtonDefaultStyler.ActiveBackgroundColor;
        this.normalBorderColor = UIPopupButtonDefaultStyler.NormalBorderColor;
        this.disabledBorderColor = UIPopupButtonDefaultStyler.DisabledBorderColor;
        this.activeBorderColor = UIPopupButtonDefaultStyler.ActiveBorderColor;
        this.normalTitleColor = UIPopupButtonDefaultStyler.NormalTitleColor;
        this.disabledTitleColor = UIPopupButtonDefaultStyler.DisabledTitleColor;
        this.activeTitleColor = UIPopupButtonDefaultStyler.ActiveTitleColor;
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        this.shadowOffset = JSPoint(0, 1);
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

    layoutControl: function(button){
        var height = button.titleLabel.font.displayLineHeight;
        var insets = button._titleInsets;
        var indicatorSize = JSSize(height, height);
        var imageSize = height;
        button.indicatorView.frame = JSRect(button.bounds.size.width - insets.right - indicatorSize.width, insets.top, indicatorSize.width, indicatorSize.height);
        button._imageView.hidden = button._imageView.image === null;
        var x = insets.left;
        if (!button._imageView.hidden){
            button._imageView.frame = JSRect(x, insets.top, imageSize, imageSize);
            x += imageSize + button._imageTitleSpacing;
        }
        button.titleLabel.frame = JSRect(x, insets.top, button.indicatorView.frame.origin.x - x - this.indicatorSpacing, height);
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
        size.width += this.indicatorSpacing;
        var indicatorSize = JSSize(titleSize.height, titleSize.height);
        size.width += indicatorSize.width;
        return size;
    },

    sizeControlToFitSize: function(button, size){
        button.bounds = JSRect(JSPoint.Zero, this.intrinsicSizeOfControl(button));
    },

});

Object.defineProperties(UIPopupButtonDefaultStyler, {
    shared: {
        configurable: true,
        get: function UIPopupButtonDefaultStyler_getShared(){
            var shared = UIPopupButtonDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

UIPopupButtonDefaultStyler.NormalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
UIPopupButtonDefaultStyler.ActiveBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UIPopupButtonDefaultStyler.DisabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);

UIPopupButtonDefaultStyler.NormalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
UIPopupButtonDefaultStyler.ActiveBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
UIPopupButtonDefaultStyler.DisabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);

UIPopupButtonDefaultStyler.NormalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIPopupButtonDefaultStyler.ActiveTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIPopupButtonDefaultStyler.DisabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);

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
            var image = JSImage.initWithResourceName("UICheckboxMixed", this.bundle);
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