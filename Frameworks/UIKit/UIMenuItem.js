// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, UIMenuSeparatorItemView, UIMenuItem, UIMenu */
'use strict';

JSClass("UIMenuItem", JSObject, {

    menu: null,
    title: JSDynamicProperty('_title', null),
    keyEquivalent: JSDynamicProperty('_keyEquivalent', null),
    image: JSDynamicProperty('_image', null),
    onImage: JSDynamicProperty('_onImage', null),
    offImage: JSDynamicProperty('_offImage', null),
    mixedImage: JSDynamicProperty('_mixedImage', null),
    hidden: JSDynamicProperty('_isHidden', false, 'isHidden'),
    state: JSDynamicProperty('_state', 0),
    tag: JSDynamicProperty('_tag', null),
    indentationLevel: JSDynamicProperty('_indentationLevel', 0),
    enabled: JSDynamicProperty('_isEnabled', false, 'isEnabled'),
    highlighted: JSDynamicProperty('_isHighlighted', false, 'isHighlighted'),
    submenu: JSDynamicProperty('_submenu', null),
    textColor: JSReadOnlyProperty(),
    alternate: JSDynamicProperty('_isAlternate', false, 'isAlternate'),
    target: null,
    action: null,
    view: null,

    initWithSpec: function(spec, values){
        if ('separator' in values){
            this.initSeparator();
            return;
        }
        if ('title' in values){
            this._title = spec.resolvedValue(values.title);
        }
        if ('action' in values){
            this.action = spec.resolvedValue(values.action);
        }
        if ('target' in values){
            this.target = spec.resolvedValue(values.target);
        }
        if ('submenu' in values){
            this._submenu = UIMenu.initWithSpec(spec, values.submenu);
            this._isEnabled = true;
        }
        if ('tag' in values){
            this.tag = spec.resolvedValue(values.tag);
        }
        if ('indentationLevel' in values){
            this._indentationLevel = spec.resolvedValue(values.indentationLevel);
        }
        if ('keyEquivalent' in values){
            this._keyEquivalent = spec.resolvedValue(values.keyEquivalent);
        }
        if ('alternate' in values){
            this._isAlternate = !!values.alternate;
        }
        // TODO: image
    },

    initWithTitle: function(title, action){
        this._title = title;
    },

    initSeparator: function(){
        this.view = UIMenuSeparatorItemView.init();
    },

    getTextColor: function(){
        if (this.menu === null){
            return null;
        }
        if (this.enabled){
            if (this.highlighted){
                return this.menu.highlightedTextColor;
            }
            return this.menu.textColor;
        }
        return this.menu.disabledTextColor;
    }

});

UIMenuItem.State = {
    off: 0,
    on: 1,
    mixed: 2
};