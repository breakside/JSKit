// #import "UIButton.js"
// #import "UIImageView.js"
// #import "UILabel.js"
/* global JSClass, UIView, UIImageView, UIControl, JSObject, JSSize, JSDynamicProperty, JSLazyInitProperty, JSImage, UIButton, UIToolbarItem, UIToolbarItemView, UIToolbarItemSpaceView, UILabel, JSTextAlignment, UIMenuItem */
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

    initWithImage: function(image, action, target){
        this._image = image;
        this._target = target;
        this._action = action;
        this._commonItemInit();
    },

    initWithView: function(view, action, target){
        this._view = view;
        this._target = target || null;
        this._action = action || null;
        this._commonItemInit();
    },

    initWithSpec: function(spec){
        UIToolbarItem.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('identifier')){
            this.identifier = spec.valueForKey("identifier", UIToolbarItem.Identifier);
        }
        if (spec.containsKey('title')){
            this._title = spec.valueForKey("title");
        }
        if (spec.containsKey('tooltip')){
            this._tooltip = spec.valueForKey("tooltip");
        }
        if (spec.containsKey('image')){
            this._image = spec.valueForKey("image", JSImage);
        }
        if (spec.containsKey('view')){
            this._view = spec.valueForKey("view", UIView);
        }
        if (spec.containsKey('enabled')){
            this._enabled = spec.valueForKey("enabled");
        }
        if (spec.containsKey('minimumSize')){
            this._minimumSize = spec.valueForKey("minimumSize", JSSize);
        }
        if (spec.containsKey('maximumSize')){
            this._maximumSize = spec.valueForKey("maximumSize", JSSize);
        }
        if (spec.containsKey('target')){
            this._target = spec.valueForKey("target");
        }
        if (spec.containsKey('action')){
            this._action = spec.valueForKey("action");
        }
        if (spec.containsKey('menuFormRepresentation')){
            this.menuFormRepresentation = spec.valueForKey("menuFormRepresentation", UIMenuItem);
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
            this._view.addAction("performAction", this);
        }
    },

    performAction: function(){
        if (this._action !== null){
            this.toolbar.window.application.sendAction(this._action, this._target, this);
        }
    },

    validate: function(){
        if (this.action === null || typeof(this.action) === 'function'){
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
            if (this.contentView.isKindOfClass(UIButton) && this.contentView._imageView){
                this.contentView._imageView.automaticRenderMode = JSImage.RenderMode.template;
            }
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
                    this.contentView.automaticRenderMode = JSImage.RenderMode.template;
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