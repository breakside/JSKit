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

// #import "UIViewController.js"
// #import "UIStackView.js"
// #import "UILabel.js"
// #import "UIButton.js"
// #import "UIPopupWindow.js"
// #import "UIAlertAction.js"
// #import "JSColor+UIKit.js"
'use strict';

(function(){

JSClass("UIAlertController", UIViewController, {

    initWithTitle: function(title, message){
        this.title = title;
        this.message = message;
        this._actions = [];
        this.popupWindowStyler = UIPopupWindow.Styler.default;
        this.normalButtonStyler = UIAlertController.ButtonStylers.normal;
        this.destructiveButtonStyler = UIAlertController.ButtonStylers.destructive;
    },

    title: null,
    message: null,

    actions: JSReadOnlyProperty('_actions', null),

    addAction: function(action){
        this._actions.push(action);
        if (this._cancelAction === null && action.style === UIAlertAction.Style.cancel){
            this._cancelAction = action;
        }
    },

    addActionWithTitle: function(title, style, action, target){
        var _action = UIAlertAction.initWithTitle(title, style, action, target);
        this.addAction(_action);
    },

    popupWindowStyler: null,
    normalButtonStyler: null,
    defaultButtonStyler: null,
    cancelButtonStyler: null,
    destructiveButtonStyler: null,

    _padding: 10,
    _titleLabel: null,
    _messageLabel: null,
    _primaryStackView: null,
    _actionsStackView: null,
    _actionButtons: null,
    _cancelAction: null,

    viewDidLoad: function(){
        UIAlertController.$super.viewDidLoad.call(this);
        this._primaryStackView = UIStackView.init();
        this._primaryStackView.viewSpacing = this._padding;
        if (this.title !== null && this.title !== ''){
            this._titleLabel = UILabel.init();
            this._titleLabel.maximumNumberOfLines = 2;
            this._titleLabel.textAlignment = JSTextAlignment.center;
            this._titleLabel.text = this.title;
            this._titleLabel.font = this._titleLabel.font.bolderFont();
            this._primaryStackView.addSubview(this._titleLabel);
        }
        if (this.message !== null && this.message !== ''){
            this._messageLabel = UILabel.init();
            this._messageLabel.maximumNumberOfLines = 0;
            this._messageLabel.font = this._messageLabel.font.fontWithPointSize(JSFont.Size.detail);
            this._messageLabel.textAlignment = JSTextAlignment.center;
            this._messageLabel.text = this.message;
            this._messageLabel.accessibilityHidden = false;
            this._primaryStackView.addSubview(this._messageLabel);
        }
        this._actionsStackView = UIStackView.init();
        if (this.actions.length <= 2){
            this._actionsStackView.viewSpacing = this._padding;
            this._actionsStackView.axis = UIStackView.Axis.horizontal;
            this._actionsStackView.distribution = UIStackView.Distribution.equal;
        }else{
            this._actionsStackView.viewSpacing = 4;
            this._actionsStackView.axis = UIStackView.Axis.vertical;
            this._actionsStackView.distribution = UIStackView.Distribution.none;
        }
        var action;
        var button;
        this._actionButtons = [];
        for (var i = 0, l = this.actions.length; i < l; ++i){
            action = this.actions[i];
            button = this._createButtonForAction(action);
            this._actionButtons.push(button);
            this._actionsStackView.addSubview(button);
        }
        this._primaryStackView.addSubview(this._actionsStackView);
        this.view.addSubview(this._primaryStackView);
    },

    _createButtonForAction: function(action){
        var styler = this.normalButtonStyler;
        if (action.style === UIAlertAction.Style.default && this.defaultButtonStyler !== null){
            styler = this.defaultButtonStyler;
        }else if (action.style === UIAlertAction.Style.cancel && this.cancelButtonStyler !== null){
            styler = this.cancelButtonStyler;
        }else if (action.style === UIAlertAction.Style.destructive){
            styler = this.destructiveButtonStyler;
        }
        var button = UIButton.initWithStyler(styler);
        button.titleLabel.text = action.title;
        var insets = JSInsets(button.titleInsets);
        insets.left += this._padding;
        insets.right += this._padding;
        button.titleInsets = insets;
        button.addAction(function(){
            action.perform();
            this.dismiss();
        }, this);
        return button;
    },

    viewDidLayoutSubviews: function(){
        this._primaryStackView.frame = this.view.bounds;
    },

    contentSizeThatFitsSize: function(size){
        var maxWidth;
        var height = 0;
        var minWidth = 200;
        var buttonWidth = 0;
        var w;
        if (this._actionButtons.length === 2){
            buttonWidth = Math.max(this._actionButtons[0].intrinsicSize.width, this._actionButtons[1].intrinsicSize.width);
            maxWidth = buttonWidth * 2 + this._padding;
            height += this._actionButtons[0].intrinsicSize.height;
        }else{
            for (var i = 0, l = this._actionButtons.length; i < l; ++i){
                w = this._actionButtons[i].intrinsicSize.width;
                if (w > buttonWidth){
                    buttonWidth = w;
                }
            }
            maxWidth = Math.max(minWidth, buttonWidth);
        }
        this._primaryStackView.sizeToFitSize(JSSize(maxWidth, Number.MAX_VALUE));
        return JSSize(maxWidth, this._primaryStackView.frame.size.height);
    },

    _popupWindow: null,

    popupAdjacentToView: function(view, preferredPlacement, animated){
        this._popupWindow = this._createPopupWindow();
        view.window.modal = this._popupWindow;
        this._popupWindow.openAdjacentToView(view, preferredPlacement, animated);
    },

    popupCenteredInView: function(view, animated){
        this._popupWindow = this._createPopupWindow();
        view.window.modal = this._popupWindow;
        this._popupWindow.openCenteredInView(view, animated);
    },

    _createPopupWindow: function(){
        var popupWindow = _UIAlertPopupWindow.initWithStyler(this.popupWindowStyler);
        popupWindow.accessibilitySubrole = UIAccessibility.Subrole.alert;
        popupWindow.accessibilityLabel = this.title;
        popupWindow.contentViewController = this;
        popupWindow.escapeClosesWindow = this._cancelAction !== null;
        return popupWindow;
    },

    dismiss: function(){
        if (this._popupWindow === null){
            return;
        }
        this._popupWindow.close();
        this._popupWindow = null;
    }

});

JSClass("_UIAlertPopupWindow", UIPopupWindow, {

    keyDown: function(event){
        if (this.escapeClosesWindow && event.key == UIEvent.Key.escape){
            var action = this.contentViewController._cancelAction;
            if (action !== null){
                action.perform();
            }
            this.contentViewController.dismiss();
        }else{
            _UIAlertPopupWindow.$super.keyDown.call(this, event);
        }
    },

});

UIAlertController.ButtonStylers = Object.create({}, {

    destructive: {
        configurable: true,
        get: function(){
            var styler = UIButtonDefaultStyler.init();
            styler.font = styler.font.fontWithPointSize(JSFont.Size.detail).bolderFont();
            styler.normalTitleColor = JSColor.destructive;
            styler.activeTitleColor = JSColor.destructive.colorDarkenedByPercentage(0.2);
            styler.disabledTitleColor = JSColor.destructive.colorWithAlpha(0.5);
            Object.defineProperty(this, 'destructive', {writable: true, value: styler});
            return styler;
        },
        set: function(styler){
            Object.defineProperty(this, 'destructive', {writable: true, value: styler});
        }
    },

    normal: {
        configurable: true,
        get: function(){
            var styler = UIButtonDefaultStyler.init();
            styler.font = styler.font.fontWithPointSize(JSFont.Size.detail);
            Object.defineProperty(this, 'normal', {writable: true, value: styler});
            return styler;
        },
        set: function(styler){
            Object.defineProperty(this, 'normal', {writable: true, value: styler});
        }
    }

});

})();