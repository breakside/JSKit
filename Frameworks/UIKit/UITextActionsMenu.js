// #import "UIPopupWindow.js"
// #import "UIButton.js"
// #import "UIStackView.js"
"use strict";

JSClass("UITextActionsMenu", JSObject, {

    delegate: null,

    initWithActions: function(actions){
        this.actions = actions;
    },

    openAtLocationInView: function(location, sourceView){
        if (this._window !== null){
            this._window.orderFront();
        }else{
            var window = UITextActionsMenuWindow.init(UITextActionsMenu.Styler.default);
            window.contentInsets = JSInsets.Zero;
            var buttons = [];
            var button;
            var action;
            for (var i = 0, l = this.actions.length; i < l; ++i){
                action = this.actions[i];
                button = UIButton.initWithStyler(UITextActionsMenu.ButtonStyler.default);
                button.titleLabel.text = action.title;
                button.addAction(action.action, action.target);
                button.addAction("close", this);
                buttons.push(button);
            }
            var stackView = UIStackView.initWithArrangedSubviews(buttons);
            stackView.cornerRadius = window.cornerRadius;
            stackView.clipsToBounds = true;
            stackView.backgroundColor = JSColor.separator;
            stackView.viewSpacing = 1;
            stackView.axis = UIStackView.Axis.horizontal;
            window.contentView = stackView;
            window.openAtLocationInView(location, sourceView, UIPopupWindow.Placement.above, false);
            this._window = window;
        }
    },

    close: function(){
        if (this._window !== null){
            this._window.close();
            this._window = null;
            if (this.delegate && this.delegate.textActionsMenuDidClose){
                this.delegate.textActionsMenuDidClose(this);
            }
        }
    },

    _window: null,

});

UITextActionsMenu.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function(){
            var styler = UIPopupWindowStyler.init();
            styler.cornerRadius = 7;
            Object.defineProperty(this, "default", {value: styler, writable: true});
            return styler;
        },
        set: function(value){
            Object.defineProperty(this, "default", {value: value, writable: true});
        }
    }

});

UITextActionsMenu.ButtonStyler = Object.create({}, {

    default: {
        configurable: true,
        get: function(){
            var styler = UIButtonCustomStyler.initWithBackgroundColor(JSColor.background, JSColor.highlight);
            styler.titleInsets = JSInsets(10, 10, 10, 10);
            Object.defineProperty(this, "default", {value: styler, writable: true});
            return styler;
        },
        set: function(value){
            Object.defineProperty(this, "default", {value: value, writable: true});
        }
    }

});

JSClass("UITextActionsMenuWindow", UIPopupWindow, {

    canBecomeKey: false,

});
