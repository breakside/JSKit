// Copyright © 2020 Breakside Inc.  MIT License.
// #import UIKit
/* global JSClass, UIView, BreadcrumbView, UILabel, UIMenu, JSImage, JSRect, JSPoint, JSSize, JSInsets, JSColor, UIPopupButton, UIPopupButtonStyler, _BreadcrumbPopupButtonStyler, UIImageView, JSFont, UIMenuDefaultStyler, _BreadcrumbMenuStyler */
'use strict';

JSClass("BreadcrumbView", UIView, {

    popupButtons: null,
    popupStyler: null,
    componentsByButtonIndex: null,
    target: null,
    action: null,

    initWithSpec: function(spec, values){
        BreadcrumbView.$super.initWithSpec.call(this, spec, values);
        if ('target' in values){
            this.target = spec.resolvedValue(values.target);
            if ('action' in values){
                this.action = this.target[values.action];
            }
        }
        if ('highlightColor' in values){
            this._menuHighlightColor = spec.resolvedValue(values.highlightColor);
        }
    },

    awakeFromSpec: function(){
        this.popupButtons = [];
        this.componentsByButtonIndex = [];
        this.popupStyler = _BreadcrumbPopupButtonStyler.init();
        if (this._menuHighlightColor){
            this.popupStyler.menuStyler.highlightColor = this._menuHighlightColor;
        }
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        var button;
        var x = 0;
        var h = this.bounds.size.height - 1;
        var available = this.bounds.size.width;
        var w;
        for (var i = 0, l = this.popupButtons.length; i < l; ++i){
            button = this.popupButtons[i];
            button.sizeToFitSize(available, h);
            w = button.frame.size.width;
            button.frame = JSRect(x, 0, w, h);
            x += w;
            available -= w;
        }
    },

    setComponents: function(components){
        var parent = null;
        if (components.length > 1){
            parent = components[0];
            components = components.slice(1);
        }
        var i, l;
        var component;
        var button;
        var sibling;
        var j, k;
        var item;
        this.componentsByButtonIndex = [];
        for (i = 0, l = components.length; i < l; ++i){
            component = components[i];
            if (i < this.popupButtons.length){
                button = this.popupButtons[i];
                // FIXME: don't update the menu if it hasn't changed
                button.removeAllItems();
            }else{
                button = UIPopupButton.initWithStyler(this.popupStyler);
                button.sendsActionForReselect = true;
                button.addAction("selectComponent", this);
                this.popupButtons.push(button);
                this.addSubview(button);
            }
            if (parent){
                this.componentsByButtonIndex.push(parent.children);
                for (j = 0, k = parent.children.length; j < k; ++j){
                    sibling = parent.children[j];
                    item = button.addItemWithTitle(sibling.name);
                    if (sibling.kind == 'topic'){
                        item.enabled = false;
                    }else{
                        item.image = imageByKind[sibling.kind](sibling);
                    }
                    if (sibling.url === component.url){
                        button.selectedIndex = j;
                    }
                }
            }
            button.titleLabel.text = component.name;
            button.imageView.image = imageByKind[component.kind](component);
            button.enabled = parent !== null;
            button.indicatorView.hidden = i == l - 1;
            parent = component;
        }
        for (j = this.popupButtons.length - 1; j >= i; --j){
            this.popupButtons[j].removeFromSuperview();
            this.popupButtons.pop();
        }
        this.setNeedsLayout();
    },

    selectComponent: function(button){
        for (var i = 0, l = this.popupButtons.length; i < l; ++i){
            if (button === this.popupButtons[i]){
                var component = this.componentsByButtonIndex[i][button.selectedIndex];
                if (this.target && this.action){
                    this.action.call(this.target, component);
                    return;
                }
            }
        }
    }
});

JSClass("_BreadcrumbPopupButtonStyler", UIPopupButtonStyler, {

    showsOverState: false,
    titleInsets: null,
    normalBackgroundColor: null,
    disabledBackgroundColor: null,
    activeBackgroundColor: null,
    borderWidth: 1,
    cornerRadius: 3,
    shadowRadius: 1,
    indicatorSpacing: 0,

    init: function(){
        this.titleInsets = JSInsets(3, 7, 3, 4);
        this.menuStyler = _BreadcrumbMenuStyler.init();
        this.menuStyler.disabledTextColor = JSColor.initWithWhite(0.5);
        this.menuStyler.itemPadding = JSInsets(4, 3, 4, 7);
    },

    initializeControl: function(button){
        button.titleInsets = this.titleInsets;
        button.titleLabel.font = JSFont.systemFontOfSize(JSFont.Size.detail);
        button.layer.borderWidth = 0;
        button._titleLabel.textColor = JSColor.initWithWhite(51/255.0);
        button._indicatorView.templateColor = JSColor.initWithWhite(0.8);
        button._indicatorView.image = JSImage.initWithResourceName("BreadcrumbSeparator");
        this.updateControl(button);
    },

    updateControl: function(button){
    },

    layoutControl: function(button){
        var height = button.titleLabel.font.displayLineHeight;
        var insets = button._titleInsets;
        var indicatorSize = button.indicatorView.image.size;
        var imageSize = 16;
        var y = (button.bounds.size.height - indicatorSize.height) / 2.0;
        button.indicatorView.frame = JSRect(button.bounds.size.width - insets.right - indicatorSize.width, y, indicatorSize.width, indicatorSize.height);
        button._imageView.hidden = button._imageView.image === null;
        var x = insets.left;
        if (!button._imageView.hidden){
            y = (button.bounds.size.height - imageSize) / 2;
            button._imageView.frame = JSRect(x, y, imageSize, imageSize);
            x += imageSize + button._imageTitleSpacing;
        }
        y = (button.bounds.size.height - height) / 2;
        button.titleLabel.frame = JSRect(x, y, button.indicatorView.frame.origin.x - x - this.indicatorSpacing, height);
    },

    intrinsicSizeOfControl: function(button){
        var size = JSSize(button._titleInsets.left + button._titleInsets.right, button._titleInsets.top + button._titleInsets.bottom);
        var titleSize = button._titleLabel.intrinsicSize;
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

JSClass("_BreadcrumbMenuStyler", UIMenuDefaultStyler, {

    updateItemView: function(view, item){
        _BreadcrumbMenuStyler.$super.updateItemView.call(this, view, item);
        if (!item.enabled){
            view.titleLabel.font = item.menu.font.fontWithWeight(JSFont.Weight.bold);
        }
    }

});

var imageByKind = {
    'index': function(){ return images.frameworkIcon; },
    'class': function(){ return images.classIcon; },
    'constructor': function(){ return images.constructorIcon; },
    'document': function(){ return images.docIcon; },
    'enum': function(){ return images.enumIcon; },
    'framework': function(){ return images.frameworkIcon; },
    'function': function(){ return images.functionIcon; },
    'init': function(){ return images.initIcon; },
    'method': function(component){ return component.static ? images.staticmethodIcon : images.methodIcon; },
    'property': function(component){ return component.static ? images.staticpropertyIcon : images.propertyIcon; },
    'protocol': function(){ return images.protocolIcon; },
    'spec': function(){ return images.specIcon; },
    'specproperty': function(){ return images.specpropertyIcon; },
    'command': function(){ return images.commandIcon; },
    'argv': function(){ return images.argvIcon; },
    'dictionary': function(){ return images.docIcon; },
    'dictproperty': function(component){ return images.propertyIcon; },
};

var images = JSImage.resourceCache([
    'classIcon',
    'constructorIcon',
    'docIcon',
    'enumIcon',
    'frameworkIcon',
    'functionIcon',
    'initIcon',
    'methodIcon',
    'propertyIcon',
    'protocolIcon',
    'staticmethodIcon',
    'staticpropertyIcon',
    'specIcon',
    'specpropertyIcon',
    'commandIcon',
    'argvIcon'
]);