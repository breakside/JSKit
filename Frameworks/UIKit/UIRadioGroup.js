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
// #import "UIEvent.js"
// #import "JSColor+UIKit.js"
'use strict';

(function(){

JSClass("UIRadioGroup", UIControl, {

    buttons: null,
    selectedIndex: JSDynamicProperty('_selectedIndex', -1),

    initWithSpec: function(spec){
        UIRadioGroup.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('options')){
            var options = spec.valueForKey('options');
            for (var i = 0, l = options.length; i < l; ++i){
                this.addItemWithTitle(options.valueForKey(i));
            }
        }
    },

    commonUIControlInit: function(){
        UIRadioGroup.$super.commonUIControlInit.call(this);
        if (this._styler === null){
            this._styler = UIRadioGroup.Styler.default;
        }
        this.buttons = [];
    },

    addItemWithTitle: function(title){
        var button = UIRadioButton.initWithStyler(this._styler.buttonStyler);
        button.titleLabel.text = title;
        button._index = this.buttons.length;
        button._group = this;
        var nextKeyView;
        if (button._index === 0){
            nextKeyView = this.nextKeyView;
            this.nextKeyView = button;
            button.nextKeyView = nextKeyView;
        }else{
            nextKeyView = this.buttons[this.buttons.length - 1].nextKeyView;
            this.buttons[this.buttons.length - 1].nextKeyView = button;
            button.nextKeyView = nextKeyView;
        }
        this.buttons.push(button);
        this.addSubview(button);
        this.setNeedsLayout();
    },

    _selectRadioButtonAtIndex: function(index){
        if (this.selectedIndex != index){
            this.selectedIndex = index;
            this.didChangeValueForBinding('selectedIndex');
            this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
        }
    },

    setSelectedIndex: function(selectedIndex){
        if (this.selectedIndex != selectedIndex){
            if (this._selectedIndex >= 0){
                this.buttons[this._selectedIndex].on = false;
            }
            this._selectedIndex = selectedIndex;
            if (this._selectedIndex >= 0){
                this.buttons[this._selectedIndex].on = true;
            }
        }
    },

    setNextKeyView: function(nextKeyView){
        if (this.buttons !== null && this.buttons.length > 0){
            this.buttons[this.buttons.length - 1].nextKeyView = nextKeyView;
        }else{
            UIRadioGroup.$super.setNextKeyView.call(this, nextKeyView);
        }
    },

    setEnabled: function(isEnabled){
        if (isEnabled !== this.enabled){
            this.enabled = isEnabled;
            for (var i = 0, l = this.buttons.length; i < l; ++i){
                this.buttons[i].enabled = isEnabled;
            }
        }
    },

    isAccessibilityElement: true,

    accessibilityRole: UIAccessibility.Role.radioGroup,

    getAccessibilityElements: function(){
        return this.buttons;
    }

});

UIRadioGroup.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIRadioGroup_getDefaultStyler(){
            var styler = UIRadioGroupDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIRadioGroup_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }
});

JSClass("UIRadioGroupStyler", UIControlStyler, {

    buttonStyler: null,
    lineHeight: 1.2,

    layoutControl: function(group){
        var y = 0;
        var button;
        for (var i = 0, l = group.buttons.length; i < l; ++i){
            button = group.buttons[i];
            button.frame = JSRect(0, y, group.bounds.size.width, button.titleLabel.font.displayLineHeight);
            y += Math.floor(button.frame.size.height * this.lineHeight);
        }
    }

});

JSClass("UIRadioGroupDefaultStyler", UIRadioGroupStyler, {

    init: function(){
        this.buttonStyler = UIRadioButton.Styler.default;
    }

});

JSClass("UIRadioButton", UIControl, {

    _group: null,
    _index: null,
    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    on: JSDynamicProperty('_isOn', false, 'isOn'),

    initWithTitle: function(title){
        UIRadioButton.$super.init.call(this);
        this.titleLabel.text = title;
    },

    initWithSpec: function(spec){
        UIRadioButton.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('font')){
            this._titleLabel.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey('title')){
            this._titleLabel.text = spec.valueForKey("title");
        }
    },

    commonUIControlInit: function(){
        UIRadioButton.$super.commonUIControlInit.call(this);
        this._titleLabel = UILabel.init();
        this._titleLabel.textAlignment = JSTextAlignment.left;
        this._titleLabel.backgroundColor = JSColor.clear;
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UIRadioButton.Styler.default;
        }
        this.hasOverState = this._styler.showsOverState;
        this._styler.initializeControl(this);
    },

    getTitleLabel: function(){
        return this._titleLabel;
    },

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
            return;
        }
        UIRadioButton.$super.mouseDown.call(this, event);
    },

    mouseDragged: function(event){
        if (this.enabled){
            var location = event.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UIRadioButton.$super.mouseDragged.call(this, event);
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.active){
                this._select();
            }
            return;
        }
        UIRadioButton.$super.mouseUp.call(this, event);
    },

    touchesBegan: function(touches, event){
        if (this.enabled){
            this.active = true;
            return;
        }
        UIRadioButton.$super.touchesBegan.call(this, touches, event);
    },

    touchesMoved: function(touches, event){
        if (this.enabled){
            var touch = touches[0];
            var location = touch.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UIRadioButton.$super.touchesMoved.call(this, touches, event);
    },

    touchesEnded: function(touches, event){
        if (this.enabled){
            if (this.active){
                this._select();
            }
            return;
        }
        UIRadioButton.$super.touchesEnded.call(this, touches, event);
    },

    touchesCanceled: function(touches, event){
        if (this.enabled){
            this.active = false;
            return;
        }
        UIRadioButton.$super.touchesCanceled.call(this, touches, event);
    }, 

    keyDown: function(event){
        if (event.key === UIEvent.Key.space){
            this.active = true;
            return;
        }
        UIRadioButton.$super.keyDown.call(this, event);
    },

    keyUp: function(event){
        if (event.key === UIEvent.Key.space){
            if (this.active){
                this._select();
                return;
            }
        }
        UIRadioButton.$super.keyUp.call(this, event);
    },

    _select: function(){
        this._group._selectRadioButtonAtIndex(this._index);
        this.active = false;
    },

    setOn: function(isOn){
        this._isOn = isOn;
        this._styler.updateControl(this);
    },

    isAccessibilityElement: true,

    accessibilityRole: UIAccessibility.Role.radioButton,

    accessibilityChecked: JSReadOnlyProperty(),

    getAccessibilityChecked: function(){
        if (this.on){
            return UIAccessibility.Checked.on;
        }
        return UIAccessibility.Checked.off;
    },

    getAccessibilityLabel: function(){
        var label = UIRadioButton.$super.getAccessibilityLabel.call(this);
        if (label !== null){
            return label;
        }
        if (this._titleLabel !== null){
            return this._titleLabel.text;
        }
        return null;
    }

});

UIRadioButton.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIRadioButton_getDefaultStyler(){
            var styler = UIRadioButtonDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIRadioButton_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }
});

JSClass("UIRadioButtonStyler", UIControlStyler, {

});

JSClass("UIRadioButtonDefaultStyler", UIRadioButtonStyler, {

    showsOverState: false,
    titleSpacing: 3,
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
    shadowColor: null,
    shadowOffset: null,
    shadowRadius: 1,
    borderWidth: 1,

    init: function(){
        this.normalBackgroundColor = JSColor.controlBackground;
        this.disabledBackgroundColor = JSColor.disabledControlBackground;
        this.activeBackgroundColor = JSColor.activeControlBackground;
        this.normalBorderColor = JSColor.controlBorder;
        this.disabledBorderColor = JSColor.disabledControlBorder;
        this.activeBorderColor = JSColor.activeControlBorder;
        this.normalTitleColor = JSColor.controlTitle;
        this.disabledTitleColor = JSColor.disabledControlTitle;
        this.activeTitleColor = JSColor.activeControlTitle;
        this.shadowColor = JSColor.controlShadow;
        this.shadowOffset = JSPoint(0, 1);
    },

    initializeControl: function(button){
        button.stylerProperties.boxLayer = UILayer.init();
        button.stylerProperties.boxLayer.borderWidth = this.borderWidth;
        button.stylerProperties.boxLayer.shadowColor = this.shadowColor;
        button.stylerProperties.boxLayer.shadowOffset = this.shadowOffset;
        button.stylerProperties.boxLayer.shadowRadius = this.shadowRadius;
        button.stylerProperties.indicatorView = UIImageView.initWithImage(images.radioOn);
        button.insertSubviewAtIndex(button.stylerProperties.indicatorView, 0);
        button.layer.insertSublayerAtIndex(button.stylerProperties.boxLayer, 0);
        button.setNeedsLayout();
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button.stylerProperties.boxLayer.backgroundColor    = this.disabledBackgroundColor;
            button.stylerProperties.boxLayer.backgroundGradient = this.disabledBackgroundGradient;
            button.stylerProperties.boxLayer.borderColor        = this.disabledBorderColor;
            button.titleLabel.textColor                         = this.disabledTitleColor;
        }else if (button.active){
            button.stylerProperties.boxLayer.backgroundColor    = this.activeBackgroundColor;
            button.stylerProperties.boxLayer.backgroundGradient = this.activeBackgroundGradient;
            button.stylerProperties.boxLayer.borderColor        = this.activeBorderColor;
            button.titleLabel.textColor                         = this.activeTitleColor;
        }else{
            button.stylerProperties.boxLayer.backgroundColor    = this.normalBackgroundColor;
            button.stylerProperties.boxLayer.backgroundGradient = this.normalBackgroundGradient;
            button.stylerProperties.boxLayer.borderColor        = this.normalBorderColor;
            button.titleLabel.textColor                         = this.normalTitleColor;
        }
        button.stylerProperties.indicatorView.templateColor = button.titleLabel.textColor;
        button.stylerProperties.indicatorView.hidden = !button.on;
    },

    layoutControl: function(button){
        var height = button.titleLabel.font.displayLineHeight;
        var boxSize = JSSize(height, height);
        button.stylerProperties.boxLayer.cornerRadius = boxSize.width / 2;
        button.stylerProperties.boxLayer.frame = JSRect(JSPoint.Zero, boxSize);
        button.stylerProperties.indicatorView.frame = button.stylerProperties.boxLayer.frame;
        var x = boxSize.width + this.titleSpacing;
        button.titleLabel.frame = JSRect(x, 0, button.bounds.size.width - x, height);
    },

    focusRingPathForControl: function(button){
        var layer = button.stylerProperties.boxLayer;
        var transform = layer.transformFromSuperlayer();
        var boxPath = layer.backgroundPath(transform);
        return boxPath;
    }

});

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    radioOn: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIRadioButtonOn", this.bundle);
            Object.defineProperty(this, 'radioOn', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.radioOn;
        }
    },

});

})();