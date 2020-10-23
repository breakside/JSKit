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

// #import Foundation
// #import "UIEvent.js"
// #import "UIView.js"
/* global UIMenu */
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
            if (spec.containsKey("view")){
                this.view = spec.valueForKey("view", UIView);
            }
            if (spec.containsKey("accessibilityIdentifier")){
                this.accessibilityIdentifier = spec.valueForKey("accessibilityIdentifier");
            }
            if (spec.containsKey("accessibilityLabel")){
                this._accessibilityLabel = spec.valueForKey("accessibilityLabel");
            }
            if (spec.containsKey("accessibilityHint")){
                this.accessibilityHint = spec.valueForKey("accessibilityHint");
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
        this.accessibilitySubrole = UIAccessibility.Subrole.separator;
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
    },

    // MARK: - Accessibility

    // Visibility
    isAccessibilityElement: true,
    accessibilityHidden: JSReadOnlyProperty(),
    accessibilityLayer: null,
    accessibilityFrame: JSReadOnlyProperty(),

    // Role
    accessibilityRole: UIAccessibility.Role.menuItem,
    accessibilitySubrole: null,

    // Label
    accessibilityIdentifier: null,
    accessibilityLabel: JSDynamicProperty("_accessibilityLabel", null),
    accessibilityHint: null,

    // Value
    accessibilityValue: null,
    accessibilityValueRange: null,
    accessibilityChecked: JSReadOnlyProperty(),

    // Properties
    accessibilityTextualContext: null,
    accessibilityMenu: JSReadOnlyProperty(),
    accessibilityRowIndex: null,
    accessibilitySelected: null,
    accessibilityExpanded: null,
    accessibilityOrientation: null,

    // Children
    accessibilityParent: JSReadOnlyProperty(),
    accessibilityElements: JSReadOnlyProperty(),

    getAccessibilityLabel: function(){
        if (this._accessibilityLabel !== null){
            return this._accessibilityLabel;
        }
        return this._title;
    },

    getAccessibilityFrame: function(){
        return this.styler.frameForMenu(this);
    },

    getAccessibilityElements: function(){
        return [];
    },

    getAccessibilityHidden: function(){
        return this._isHidden || this._isAlternate;
    },

    getAccessibilityMenu: function(){
        return this._submenu;
    },

    getAccessibilityChecked: function(){
        // TODO: distinguish between checkable items and not
        return null;        
    },

    getAccessibilityParent: function(){
        return this.menu;
    }

});

UIMenuItem.State = {
    off: 0,
    on: 1,
    mixed: 2
};
