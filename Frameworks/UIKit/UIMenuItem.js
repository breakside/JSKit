// #import Foundation
// #import "UIEvent.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSImage, JSDynamicProperty, UIMenuSeparatorItemView, UIMenuItem, UIMenu, UIEvent */
'use strict';

JSClass("UIMenuItem", JSObject, {

    menu: null,
    index: 0,
    title: JSDynamicProperty('_title', null),
    keyEquivalent: JSDynamicProperty('_keyEquivalent', null),
    _keyEquivalentCode: 0,
    keyModifiers: JSDynamicProperty('_keyModifiers', 0),
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
    alternate: JSDynamicProperty('_isAlternate', false, 'isAlternate'),
    separator: JSDynamicProperty('_isSeparator', false, 'isSeparator'),
    target: null,
    action: null,
    view: null,

    initWithSpec: function(spec){
        UIMenuItem.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('tag')){
            this.tag = spec.valueForKey("tag");
        }
        if (spec.containsKey('separator')){
            this.initSeparator();
        }else{
            if (spec.containsKey('title')){
                this._title = spec.valueForKey("title");
            }
            if (spec.containsKey('action')){
                this.action = spec.valueForKey("action");
            }
            if (spec.containsKey('target')){
                this.target = spec.valueForKey("target");
            }
            if (spec.containsKey('submenu')){
                this._submenu = spec.valueForKey("submenu", UIMenu);
                this._isEnabled = true;
            }
            if (spec.containsKey('indentationLevel')){
                this._indentationLevel = spec.valueForKey("indentationLevel");
            }
            if (spec.containsKey('keyEquivalent')){
                this.keyEquivalent = spec.valueForKey("keyEquivalent");
            }
            if (spec.containsKey('keyModifiers')){
                this._keyModifiers = spec.valueForKey("keyModifiers", UIEvent.Modifier);
            }
            if (spec.containsKey('alternate')){
                this._isAlternate = !!spec.valueForKey("alternate");
            }
            if (spec.containsKey('image')){
                this._image = spec.valueForKey("image", JSImage);
            }
        }
    },

    initWithTitle: function(title, action, target){
        this._title = title;
        this.action = action || null;
        this.target = target || null;
    },

    initSeparator: function(){
        this._isSeparator = true;
        this._isEnabled = false;
    },

    setKeyEquivalent: function(keyEquivalent){
        this._keyEquivalent = keyEquivalent;
        if (keyEquivalent !== null){
            this._keyEquivalentCode = UIMenu.keyEquivalentCodeForCharacterCode(keyEquivalent.charCodeAt(0));
        }else{
            this._keyEquivalentCode = 0;
        }
    },

    setEnabled: function(isEnabled){
        if (this._isSeparator){
            return;
        }
        this._isEnabled = isEnabled;
    },

    setTag: function(tag){
        if (this.menu){
            if (this._tag){
                delete this.menu._itemsByTag[this._tag];
            }
            this._tag = tag;
            if (this._tag){
                this.menu._itemsByTag[this._tag] = this;
            }
        }else{
            this._tag = tag;
        }
    }

});

UIMenuItem.State = {
    off: 0,
    on: 1,
    mixed: 2
};
