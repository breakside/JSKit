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

    initWithSpec: function(spec, values){
        UIMenuItem.$super.initWithSpec.call(this, spec, values);
        if ('tag' in values){
            this.tag = spec.resolvedValue(values.tag);
        }
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
            if ('indentationLevel' in values){
                this._indentationLevel = spec.resolvedValue(values.indentationLevel);
            }
            if ('keyEquivalent' in values){
                this.keyEquivalent = spec.resolvedValue(values.keyEquivalent);
            }
            if ('keyModifiers' in values){
                this._keyModifiers = spec.resolvedEnum(values.keyModifiers, UIEvent.Modifier);
            }
            if ('alternate' in values){
                this._isAlternate = !!values.alternate;
            }
            if ('image' in values){
                this._image = JSImage.initWithResourceName(values.image, spec.bundle);
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
