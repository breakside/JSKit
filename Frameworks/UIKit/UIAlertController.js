// #import "UIKit/UIViewController.js"
// #import "UIKit/UIStackView.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIButton.js"
// #import "UIKit/UIPopupWindow.js"
// #import "UIKit/UIAlertAction.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSInsets, JSTextAlignment, JSSize, JSColor, JSFont, UIViewController, UIStackView, UILabel, UIButton, UIPopupWindow, UIAlertController, UIAlertAction */
'use strict';

JSClass("UIAlertController", UIViewController, {

    initWithTitle: function(title, message){
        this.title = title;
        this.message = message;
        this._actions = [];
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

    _padding: 10,
    _titleLabel: null,
    _messageLabel: null,
    _primaryStackView: null,
    _actionsStackView: null,
    _actionButtons: null,

    viewDidLoad: function(){
        UIAlertController.$super.viewDidLoad.call(this);
        this._primaryStackView = UIStackView.init();
        this._primaryStackView.viewSpacing = this._padding;
        if (this.title !== null && this.title !== ''){
            this._titleLabel = UILabel.init();
            this._titleLabel.maximumNumberOfLines = 2;
            this._titleLabel.textAlignment = JSTextAlignment.center;
            this._titleLabel.text = this.title;
            this._titleLabel.font = this._titleLabel.font.fontWithWeight(JSFont.Weight.bold);
            this._primaryStackView.addSubview(this._titleLabel);
        }
        if (this.message !== null && this.message !== ''){
            this._messageLabel = UILabel.init();
            this._messageLabel.maximumNumberOfLines = 0;
            this._messageLabel.font = this._messageLabel.font.fontWithPointSize(JSFont.Size.detail);
            this._messageLabel.textAlignment = JSTextAlignment.center;
            this._messageLabel.text = this.message;
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
        var button = UIButton.init();
        button.titleLabel.text = action.title;
        button.titleLabel.font = button.titleLabel.font.fontWithPointSize(JSFont.Size.detail);
        var insets = JSInsets(button.titleInsets);
        insets.left += this._padding;
        insets.right += this._padding;
        button.titleInsets = insets;
        button.addTargetedAction(this, function(){
            if (action.action){
                action.action.call(action.target);
            }
            this.dismiss();
        });
        switch (action.style){
            case UIAlertAction.Style.destructive:
                button.titleLabel.font = button.titleLabel.font.fontWithWeight(JSFont.Weight.bold);
                button.titleLabel.textColor = JSColor.initWithRGBA(204/255,0,0);
                break;
        }
        return button;
    },

    viewDidLayoutSubviews: function(){
        this._primaryStackView.frame = this.view.bounds;
    },

    contentSizeThatFitsSize: function(size){
        var maxWidth;
        var height = 0;
        var minWidth = 140;
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
        var popupWindow = UIPopupWindow.init();
        popupWindow.contentViewController = this;
        popupWindow.escapeClosesWindow = this._cancelAction !== null;
        // TODO: how to call the cancel action when escape is pressed?
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