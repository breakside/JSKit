// #import "UIButton.js"
// #import "UIImageView.js"
// #import "UILabel.js"
/* global JSClass, UIView, UIImageView, UIControl, JSObject, JSSize, JSDynamicProperty, JSLazyInitProperty, JSImage, UIButton, UIToolbarItem, UIToolbarItemView, UIToolbarItemSpaceView, UILabel, JSTextAlignment */
'use strict';

JSClass("UIToolbarItem", JSObject, {

    toolbar: null,
    identifier: 0,
    title: JSDynamicProperty('_title', null),
    tooltip: JSDynamicProperty('_tooltip', null),
    image: JSDynamicProperty('_image', null),
    target: JSDynamicProperty('_target', null),
    action: JSDynamicProperty('_action', null),
    enabled: JSDynamicProperty('_enabled', true),
    view: JSDynamicProperty('_view', null),
    minimumSize: JSDynamicProperty('_minimumSize', null),
    maximumSize: JSDynamicProperty('_maximumSize', null),
    menuFormRepresentation: null,

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        this._commonItemInit();
    },

    initWithImage: function(image, target, action){
        this._image = image;
        this._target = target;
        this._action = action;
        this._commonItemInit();
    },

    initWithView: function(view, target, action){
        this._view = view;
        this._target = target;
        this._action = action;
        this._commonItemInit();
    },

    initWithSpec: function(spec, values){
        UIToolbarItem.$super.initWithSpec.call(this, spec, values);
        if ('identifier' in values){
            this.identifier = spec.resolvedEnum(values.identifier, UIToolbarItem.Identifier);
        }
        if ('title' in values){
            this._title = spec.resolvedValue(values.title);
        }
        if ('tooltip' in values){
            this._tooltip = spec.resolvedValue(values.tooltip);
        }
        if ('image' in values){
            this._image = JSImage.initWithResourceName(spec.resolvedValue(values.image));
        }
        if ('view' in values){
            this._view = spec.resolvedValue(values.view, "UIView");
        }
        if ('enabled' in values){
            this._enabled = spec.resolvedValue(values.enabled);
        }
        if ('minimumSize' in values){
            this._minimumSize = spec.resolvedValue(values.minimumSize);
        }
        if ('maximumSize' in values){
            this._maximumSize = spec.resolvedValue(values.maximumSize);
        }
        if ('target' in values){
            this._target = spec.resolvedValue(values.target);
        }
        if ('action' in values){
            this._action = spec.resolvedValue(values.action);
        }
        if ('menuFormRepresentation' in values){
            this.menuFormRepresentation = spec.resolvedValue(values.menuFormRepresentation, "UIMenuItem");
        }
        this._commonItemInit();
    },

    _commonItemInit: function(){
        if (this._view !== null){
            if (this._minimumSize === null){
                var size = JSSize(this._view.intrinsicSize);
                if (size.width == UIView.noIntrinsicSize){
                    size.width = this._view.frame.width;
                }
                this._minimumSize = size;
            }
            if (this._maximumSize === null){
                this._maximumSize = JSSize(this._minimumSize);
            }
        }
        if (this._view && this._view.isKindOfClass(UIControl)){
            this._view.addTargetedAction(this, this.performAction);
        }
    },

    performAction: function(){
        this.toolbar.window.application.sendAction(this._action, this._target, this);
    },

    validate: function(){
        if (!this.action){
            return;
        }
        var target = this.toolbar.window.application.firstTargetForAction(this.action, this.target, this);
        this._enabled = target !== null && target.canPerformAction(this.action);
        if (this._view !== null && this._view.isKindOfClass(UIControl)){
            this._view.enabled = this.enabled;
        }
    }

});

JSClass("UIToolbarItemView", UIView, {

    contentView: null,
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    _handlesEvents: false,
    active: false,
    stylerProperties: null,

    initWithItem: function(item){
        UIToolbarItemView.$super.init.call(this);
        this.item = item;
        this.stylerProperties = {};
    },

    item: JSDynamicProperty('_item', null),

    setItem: function(item){
        this._item = item;
        if (item.view){
            this.contentView = item.view;
        }else{
            switch (item.identifier){
                case UIToolbarItem.Identifier.space:
                    this.contentView = UIToolbarItemSpaceView.initWithWidth(item.minimumWidth ? item.minimumWidth.width : item.toolbar.imageSize);
                    this._handlesEvents = false;
                    break;
                case UIToolbarItem.Identifier.flexibleSpace:
                    this.contentView = UIToolbarItemSpaceView.initWithWidth(0);
                    this._handlesEvents = false;
                    break;
                default:
                    this.contentView = UIImageView.initWithImage(item.image);
                    this._handlesEvents = true;
                    break;
            }
        }
        this.contentView.tooltip = item.tooltip;
        this.addSubview(this.contentView);
    },

    _createTitleLabel: function(){
        var label = UILabel.init();
        label.textAlignment = JSTextAlignment.center;
        this.addSubview(label);
        return label;
    },

    layoutSubviews: function(){
        this._item.toolbar.window._styler.layoutToolbarItemView(this);
    },

    getIntrinsicSize: function(){
        var minWidth = this._item.minimumWidth;
        if (!isNaN(minWidth) && minWidth > 0){
            return JSSize(minWidth, UIView.noIntrinsicSize);
        }
        var contentSize = this.contentView.intrinsicSize;
        if (this._item.toolbar.showsTitles){
            var titleSize = this.titleLabel.intrinsicSize;
            return JSSize(Math.max(contentSize.width, titleSize.width), UIView.noIntrinsicSize);
        }
        return contentSize;
    },

    mouseDown: function(event){
        if (!this._handlesEvents){
            UIToolbarItemView.$super.mouseDown.call(this, event);
            return;
        }
        if (!this._item.enabled){
            return;
        }
        this.active = true;
        this.item.toolbar.window._styler.updateToolbarItemView(this);
    },

    mouseDragged: function(event){
        if (!this._handlesEvents){
            UIToolbarItemView.$super.mouseDragged.call(this, event);
            return;
        }
        if (!this._item.enabled){
            return;
        }
        var location = event.locationInView(this);
        var active = this.containsPoint(location);
        if (active != this.active){
            this.active = active;
            this.item.toolbar.window._styler.updateToolbarItemView(this);
        }
    },

    mouseUp: function(event){
        if (!this._handlesEvents){
            UIToolbarItemView.$super.mouseUp.call(this, event);
            return;
        }
        if (!this._item.enabled){
            return;
        }
        if (this.active){
            this.item.performAction();
            this.active = false;
            this.item.toolbar.window._styler.updateToolbarItemView(this);
        }
    }

});

JSClass("UIToolbarItemSpaceView", UIView, {

    width: 0,

    initWithWidth: function(width){
        UIToolbarItemSpaceView.$super.init.call(this);
        this.width = width;
    },

    getIntrinsicSize: function(){
        return JSSize(this.width, UIView.noIntrinsicSize);
    }

});

UIToolbarItem.Identifier = {
    custom: 0,
    space: 1,
    flexibleSpace: 2
};