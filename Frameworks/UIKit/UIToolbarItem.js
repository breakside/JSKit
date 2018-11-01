// #import "UIKit/UIButton.js"
/* global JSClass, JSObject, JSDynamicProperty, JSImage, UIButton, UIToolbarItem */
'use strict';

JSClass("UIToolbarItem", JSObject, {

    toolbar: null,
    identifier: 0,
    title: JSDynamicProperty('_title', null),
    icon: JSDynamicProperty('_icon', null),
    target: null,
    action: null,
    enabled: JSDynamicProperty('_enabled', true),
    customView: JSDynamicProperty('_customView', null),
    minimumWidth: JSDynamicProperty('_minimumWidth', null),

    initWithSpec: function(spec, values){
        UIToolbarItem.$super.initWithSpec.call(this, spec, values);
        if ('identifier' in values){
            this.identifier = spec.resolvedEnum(values.identifier, UIToolbarItem.Identifier);
        }
        if ('title' in values){
            this._title = spec.resolvedValue(values.title);
        }
        if ('icon' in values){
            this._icon = JSImage.initWithResourceName(spec.resolvedValue(values.icon));
        }
        if ('customView' in values){
            this.customView = spec.resolvedValue(values.customView, "UIView");
        }
        if ('enabled' in values){
            this._enabled = spec.resolvedValue(values.enabled);
        }
        if ('minimumWidth' in values){
            this._minimumWidth = spec.resolvedValue(values.minimumWidth);
        }
    }

});

JSClass("UIToolbarItemButton", UIButton, {

});

JSClass("UIToolbarItemSpaceView", UIView, {

});

UIToolbarItem.Identifier = {
    custom: 0,
    space: 1,
    flexibleSpace: 2
};