// #import "UIKit/UIView.js"
// #import "UIKit/UIMenu.js"
/* global JSClass, UIView */
'use strict';

JSClass("UIMenuBar", UIView, {

    menu: JSDynamicProperty('_menu', null),
    leftItems: null,
    rightItems: null,

    _leftView: null,
    _rightView: null,
    _menuView: null,

    init: function(){
    },

    layoutSubviews: function(){
    }

});