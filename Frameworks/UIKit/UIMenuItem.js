// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, UIMenuSeparatorItemView, UIMenuItem, UIMenu */
'use strict';

JSClass("UIMenuItem", JSObject, {

    menu: null,
    index: 0,
    title: JSDynamicProperty('_title', null),
    keyEquivalent: JSDynamicProperty('_keyEquivalent', null),
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

    initWithSpec: function(spec, values){
        if ('separator' in values){
            this.initSeparator();
        }else{
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
            if ('keyModifiers' in values){
                this._keyModifiers = spec.resolvedValue(values.keyModifiers);
            }
            if ('alternate' in values){
                this._isAlternate = !!values.alternate;
            }
        }
        // TODO: image
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

    setEnabled: function(isEnabled){
        if (this._isSeparator){
            return;
        }
        this._isEnabled = isEnabled;
    }

});

UIMenuItem.State = {
    off: 0,
    on: 1,
    mixed: 2
};

UIMenuItem.KeyModifiers = {
    none:       0,
    option:     1 << 0,
    control:    1 << 1,
    shift:      1 << 2
};

UIMenuItem.KeyModifiers.optionControl = UIMenuItem.KeyModifiers.option | UIMenuItem.KeyModifiers.control;
UIMenuItem.KeyModifiers.optionShift = UIMenuItem.KeyModifiers.option | UIMenuItem.KeyModifiers.shift;
UIMenuItem.KeyModifiers.optionControlShift = UIMenuItem.KeyModifiers.option | UIMenuItem.KeyModifiers.control | UIMenuItem.KeyModifiers.shift;
UIMenuItem.KeyModifiers.controlShift = UIMenuItem.KeyModifiers.control | UIMenuItem.KeyModifiers.shift;
