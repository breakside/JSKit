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
'use strict';

(function(){

JSClass("UICheckbox", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    on: JSDynamicProperty('_isOn', false, 'isOn'),
    mixed: JSDynamicProperty('_isMixed', false, 'isMixed'),

    initWithSpec: function(spec){
        UICheckbox.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('font')){
            this._titleLabel.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey('title')){
            this._titleLabel.text = spec.valueForKey("title");
        }
    },

    commonUIControlInit: function(){
        UICheckbox.$super.commonUIControlInit.call(this);
        this._titleLabel = UILabel.init();
        this._titleLabel.textAlignment = JSTextAlignment.left;
        this._titleLabel.backgroundColor = JSColor.clear;
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UICheckbox.Styler.default;
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
        UICheckbox.$super.mouseDown.call(this, event);
    },

    mouseDragged: function(event){
        if (this.enabled){
            var location = event.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UICheckbox.$super.mouseDragged.call(this, event);
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.active){
                this._toggle();
            }
            return;
        }
        UICheckbox.$super.mouseUp.call(this, event);
    },

    touchesBegan: function(touches, event){
        if (this.enabled){
            this.active = true;
            return;
        }
        UICheckbox.$super.touchesBegan.call(this, touches, event);
    },

    touchesMoved: function(touches, event){
        if (this.enabled){
            var touch = touches[0];
            var location = touch.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UICheckbox.$super.touchesMoved.call(this, touches, event);
    },

    touchesEnded: function(touches, event){
        if (this.enabled){
            if (this.active){
                this._toggle();
            }
            return;
        }
        UICheckbox.$super.touchesEnded.call(this, touches, event);
    },

    touchesCanceled: function(touches, event){
        if (this.enabled){
            this.active = false;
            return;
        }
        UICheckbox.$super.touchesCanceled.call(this, touches, event);
    }, 

    keyDown: function(event){
        if (event.key === UIEvent.Key.space){
            this.active = true;
            return;
        }
        UICheckbox.$super.keyDown.call(this, event);
    },

    keyUp: function(event){
        if (event.key === UIEvent.Key.space){
            if (this.active){
                this._toggle();
                return;
            }
        }
        UICheckbox.$super.keyUp.call(this, event);
    },

    _toggle: function(){
        this.on = !this.on;
        this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
        this.active = false;
        this.didChangeValueForBinding('on');
    },

    setOn: function(isOn){
        this._isMixed = false;
        this._isOn = isOn;
        this._styler.updateControl(this);
        this.postAccessibilityNotification(UIAccessibility.Notification.valueChanged);
    },

    setMixed: function(isMixed){
        this._isMixed = isMixed;
        this._isOn = false;
        this._styler.updateControl(this);
        this.postAccessibilityNotification(UIAccessibility.Notification.valueChanged);
    },

    getFirstBaselineOffsetFromTop: function(){
        if (this._titleLabel !== null){
            this.layoutIfNeeded();
            return this.convertPointFromView(JSPoint(0, this._titleLabel.firstBaselineOffsetFromTop), this._titleLabel).y;
        }
        return this.bounds.size.height;
    },

    getLastBaselineOffsetFromBottom: function(){
        if (this._titleLabel !== null){
            this.layoutIfNeeded();
            return this.convertPointFromView(JSPoint(0, this._titleLabel.lastBaselineOffsetFromBottom), this._titleLabel).y;
        }
        return 0;
    },

    // -------------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.checkbox,

    getAccessibilityLabel: function(){
        if (this._accessibilityLabel !== null){
            return this._accessibilityLabel;
        }
        if (this._titleLabel !== null){
            return this._titleLabel.text;
        }
        return null;
    },

    accessibilityChecked: JSReadOnlyProperty(),

    getAccessibilityChecked: function(){
        if (this.mixed){
            return UIAccessibility.Checked.mixed;
        }
        if (this.on){
            return UIAccessibility.Checked.on;
        }
        return UIAccessibility.Checked.off;
    },

});

UICheckbox.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UICheckbox_getDefaultStyler(){
            var styler = UICheckboxDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UICheckbox_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }
});

JSClass("UICheckboxStyler", UIControlStyler, {

});

JSClass("UICheckboxDefaultStyler", UICheckboxStyler, {

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

    init: function(){
        this.normalBackgroundColor = UICheckboxDefaultStyler.NormalBackgroundColor;
        this.disabledBackgroundColor = UICheckboxDefaultStyler.DisabledBackgroundColor;
        this.activeBackgroundColor = UICheckboxDefaultStyler.ActiveBackgroundColor;
        this.normalBorderColor = UICheckboxDefaultStyler.NormalBorderColor;
        this.disabledBorderColor = UICheckboxDefaultStyler.DisabledBorderColor;
        this.activeBorderColor = UICheckboxDefaultStyler.ActiveBorderColor;
        this.normalTitleColor = UICheckboxDefaultStyler.NormalTitleColor;
        this.disabledTitleColor = UICheckboxDefaultStyler.DisabledTitleColor;
        this.activeTitleColor = UICheckboxDefaultStyler.ActiveTitleColor;
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        this.shadowOffset = JSPoint(0, 1);
    },

    initializeControl: function(checkbox){
        checkbox.stylerProperties.boxLayer = UILayer.init();
        checkbox.stylerProperties.boxLayer.borderWidth = 1;
        checkbox.stylerProperties.boxLayer.cornerRadius = 3;
        checkbox.stylerProperties.boxLayer.shadowColor = this.shadowColor;
        checkbox.stylerProperties.boxLayer.shadowOffset = this.shadowOffset;
        checkbox.stylerProperties.boxLayer.shadowRadius = this.shadowRadius;
        checkbox.stylerProperties.indicatorView = UIImageView.init();
        checkbox.insertSubviewAtIndex(checkbox.stylerProperties.indicatorView, 0);
        checkbox.layer.insertSublayerAtIndex(checkbox.stylerProperties.boxLayer, 0);
        checkbox.setNeedsLayout();
        this.updateControl(checkbox);
    },

    updateControl: function(checkbox){
        if (!checkbox.enabled){
            checkbox.stylerProperties.boxLayer.backgroundColor    = this.disabledBackgroundColor;
            checkbox.stylerProperties.boxLayer.backgroundGradient = this.disabledBackgroundGradient;
            checkbox.stylerProperties.boxLayer.borderColor        = this.disabledBorderColor;
            checkbox.titleLabel.textColor                         = this.disabledTitleColor;
        }else if (checkbox.active){
            checkbox.stylerProperties.boxLayer.backgroundColor    = this.activeBackgroundColor;
            checkbox.stylerProperties.boxLayer.backgroundGradient = this.activeBackgroundGradient;
            checkbox.stylerProperties.boxLayer.borderColor        = this.activeBorderColor;
            checkbox.titleLabel.textColor                         = this.activeTitleColor;
        }else{
            checkbox.stylerProperties.boxLayer.backgroundColor    = this.normalBackgroundColor;
            checkbox.stylerProperties.boxLayer.backgroundGradient = this.normalBackgroundGradient;
            checkbox.stylerProperties.boxLayer.borderColor        = this.normalBorderColor;
            checkbox.titleLabel.textColor                         = this.normalTitleColor;
        }
        checkbox.stylerProperties.indicatorView.templateColor = checkbox.titleLabel.textColor;
        if (checkbox.on){
            checkbox.stylerProperties.indicatorView.hidden = false;
            checkbox.stylerProperties.indicatorView.image = images.checkboxOn;
        }else if (checkbox.mixed){
            checkbox.stylerProperties.indicatorView.hidden = false;
            checkbox.stylerProperties.indicatorView.image = images.checkboxMixed;
        }else{
            checkbox.stylerProperties.indicatorView.hidden = true;
        }
    },

    layoutControl: function(checkbox){
        var height = checkbox._titleLabel.font.displayLineHeight;
        var boxSize = JSSize(height, height);
        checkbox.stylerProperties.boxLayer.frame = JSRect(JSPoint.Zero, boxSize);
        checkbox.stylerProperties.indicatorView.frame = checkbox.stylerProperties.boxLayer.frame;
        var x = boxSize.width + this.titleSpacing;
        checkbox._titleLabel.frame = JSRect(x, 0, checkbox.bounds.size.width - x, height);
    },

    sizeControlToFitSize: function(checkbox, maxSize){
        var height = checkbox._titleLabel.font.displayLineHeight;
        var maxTitleSize = JSSize(maxSize);
        var boxWidth = height + this.titleSpacing;
        maxTitleSize.width -= boxWidth;
        checkbox._titleLabel.sizeToFitSize(maxTitleSize);
        checkbox.bounds = JSRect(0, 0, boxWidth + checkbox._titleLabel.frame.size.width, height);
    },

    intrinsicSizeOfControl: function(checkbox){
        var size = JSSize(checkbox._titleLabel.intrinsicSize);
        size.width += size.height + this.titleSpacing;
        return size;
    },

    focusRingPathForControl: function(checkbox){
        var layer = checkbox.stylerProperties.boxLayer;
        var transform = layer.transformFromSuperlayer();
        var boxPath = layer.backgroundPath(transform);
        return boxPath;
    }

});

UICheckboxDefaultStyler.NormalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
UICheckboxDefaultStyler.ActiveBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UICheckboxDefaultStyler.DisabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);

UICheckboxDefaultStyler.NormalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
UICheckboxDefaultStyler.ActiveBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
UICheckboxDefaultStyler.DisabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);

UICheckboxDefaultStyler.NormalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UICheckboxDefaultStyler.ActiveTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UICheckboxDefaultStyler.DisabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    checkboxOn: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UICheckboxOn", this.bundle);
            Object.defineProperty(this, 'checkboxOn', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.checkboxOn;
        }
    },

    checkboxMixed: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UICheckboxMixed", this.bundle);
            Object.defineProperty(this, 'checkboxMixed', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.checkboxMixed;
        }
    },

});

})();