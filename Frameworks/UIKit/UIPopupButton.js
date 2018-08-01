// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
// #import "UIKit/UIMenu.js"
/* global JSClass, JSObject, UIControl, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSColor, UIPopupButton, JSTextAlignment, JSPoint, UIView, JSFont, UIPopupButtonStyler, UIPopupButtonDefaultStyler, JSRect, JSImage, JSBundle, UIImageView, JSSize, JSInsets, UIMenu, UIMenuItem */
'use strict';

(function(){

JSClass("UIPopupButton", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    indicatorView: JSReadOnlyProperty('_indicatorView', null),
    menu: JSReadOnlyProperty('_menu', null),
    selectedIndex: JSDynamicProperty('_selectedIndex', 0),
    _selectedItem: null,

    initWithSpec: function(spec, values){
        UIPopupButton.$super.initWithSpec.call(this, spec, values);
        if ('font' in values){
            this._titleLabel.font = JSFont.initWithSpec(spec, values.font);
        }
        if ('title' in values){
            this._titleLabel.text = spec.resolvedValue(values.title);
        }
        if ('options' in values){
            for (var i = 0, l = values.options.length; i < l; ++i){
                this.addItemWithTitle(spec.resolvedValue(values.options[i]));
            }
        }
    },

    commonUIControlInit: function(){
        UIPopupButton.$super.commonUIControlInit.call(this);
        this._menu = UIMenu.init();
        this._titleLabel = UILabel.init();
        this._titleLabel.backgroundColor = JSColor.clearColor;
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        this._indicatorView = UIImageView.initWithImage(images.popupIndicator);
        this.addSubview(this._indicatorView);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UIPopupButton.defaultStyler;
        }
        this.hasOverState = this._styler.showsOverState;
        this._styler.initializeControl(this);
    },

    // MARK: - Adding Items

    addItemWithTitle: function(title){
        var item = this.menu.addItemWithTitle(title, 'menuDidSelectItem', this);
        if (this.menu.items.length === 1){
            this.titleLabel.text = title;
            this._selectedItem = item;
            this._selectedItem.state = UIMenuItem.State.on;
        }
    },

    getTitleLabel: function(){
        return this._titleLabel;
    },

    mouseDown: function(event){
        if (this.enabled){
            this.active = true;
            var popup = this;
            var font = this.titleLabel.font;
            var itemTitleOffset = this.menu.itemTitleOffset;
            var itemOrigin = JSPoint(this.titleLabel.frame.origin.x - itemTitleOffset.x, this.titleLabel.frame.origin.y - itemTitleOffset.y);
            this.menu.minimumWidth = this.indicatorView.frame.origin.x - itemOrigin.x;
            this.menu.font = font;
            this.menu.delegate = this;
            this.menu.openWithItemAtLocationInView(this._selectedItem, itemOrigin, this);
        }else{
            UIPopupButton.$super.mouseDown.call(this, event);
        }
    },

    menuDidSelectItem: function(item){
        this.titleLabel.text = item.title;
        if (this._selectedIndex != item.index){
            this.selectedIndex = item.index;
            this.sendActionsForEvent(UIControl.Event.valueChanged);
        }
        this.active = false;
        this.menu.delegate = null;
    },

    menuDidClose: function(menu){
        this.active = false;
        this.menu.delegate = null;
    },

    setSelectedIndex: function(index){
        if (index === this._selectedIndex){
            return;
        }
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

});

JSClass("UIPopupButtonStyler", UIControlStyler, {

});

JSClass("UIPopupButtonDefaultStyler", UIPopupButtonStyler, {

    showsOverState: false,

    initializeControl: function(button){
        button.layer.borderWidth = 1;
        button.layer.cornerRadius = 3;
        button.layer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        button.layer.shadowOffset = JSPoint(0, 1);
        button.layer.shadowRadius = 1;
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button.layer.backgroundColor    = UIPopupButtonDefaultStyler.DisabledBackgroundColor;
            button.layer.borderColor        = UIPopupButtonDefaultStyler.DisabledBorderColor;
            button.titleLabel.textColor     = UIPopupButtonDefaultStyler.DisabledTitleColor;
        }else if (button.active){
            button.layer.backgroundColor    = UIPopupButtonDefaultStyler.ActiveBackgroundColor;
            button.layer.borderColor        = UIPopupButtonDefaultStyler.ActiveBorderColor;
            button.titleLabel.textColor     = UIPopupButtonDefaultStyler.ActiveTitleColor;
        }else{
            button.layer.backgroundColor    = UIPopupButtonDefaultStyler.NormalBackgroundColor;
            button.layer.borderColor        = UIPopupButtonDefaultStyler.NormalBorderColor;
            button.titleLabel.textColor     = UIPopupButtonDefaultStyler.NormalTitleColor;
        }
    },

    layoutControl: function(button){
        var height = button.titleLabel.font.displayLineHeight;
        var insets = JSInsets(3, 7, 3, 4);
        var indicatorSize = JSSize(height, height);
        button.indicatorView.frame = JSRect(button.bounds.size.width - insets.right - indicatorSize.width, insets.top, indicatorSize.width, indicatorSize.height);
        button.titleLabel.frame = JSRect(insets.left, insets.top, button.indicatorView.frame.origin.x - insets.left, height);
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
            Object.defineProperty(this, 'popupIndicator', {value: JSImage.initWithResourceName("UIPopupButtonIndicator", this.bundle) });
            return this.popupIndicator;
        }
    },

});

Object.defineProperties(UIPopupButton, {
    defaultStyler: {
        configurable: true,
        get: function UIPopupButton_getDefaultStyler(){
            Object.defineProperty(UIPopupButton, 'defaultStyler', {writable: true, value: UIPopupButtonDefaultStyler.shared});
            return UIPopupButton.defaultStyler;
        },
        set: function UIPopupButton_setDefaultStyler(defaultStyler){
            Object.defineProperty(UIPopupButton, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    }
});

})();