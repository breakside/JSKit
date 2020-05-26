// #import Foundation
// #import "UILayoutAnchor.js"
'use strict';

JSClass("UILayoutGuide", JSObject, {

    view: null,
    frame: null,

    layoutItemView: JSLazyInitProperty('_getLayoutItemView'),

    _getLayoutItemView: function(){
        return this.view;
    },


    bottomAnchor: JSLazyInitProperty('_createBottomAnchor'),
    topAnchor: JSLazyInitProperty('_createTopAnchor'),
    leftAnchor: JSLazyInitProperty('_createLeftAnchor'),
    rightAnchor: JSLazyInitProperty('_createRightAnchor'),
    leadingAnchor: JSLazyInitProperty('_createLeadingAnchor'),
    trailingAnchor: JSLazyInitProperty('_createTrailingAnchor'),
    widthAnchor: JSLazyInitProperty('_createWidthAnchor'),
    heightAnchor: JSLazyInitProperty('_createHeightAnchor'),
    centerXAnchor: JSLazyInitProperty('_createCenterXAnchor'),
    centerYAnchor: JSLazyInitProperty('_createCenterYAnchor'),

    _createBottomAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.bottom);
    },

    _createTopAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.top);
    },

    _createLeftAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.left);
    },

    _createRightAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.right);
    },

    _createLeadingAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.leading);
    },

    _createTrailingAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.trailing);
    },

    _createWidthAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.width);
    },

    _createHeightAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.height);
    },

    _createCenterXAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.centerX);
    },

    _createCenterYAnchor: function(){
        return UILayoutAnchor.initWithItemAttribute(this, UILayoutAttribute.centerY);
    },

    addConstraint: function(constraint){
        this.superview.addConstraint(constraint);
    },

    removeConstraint: function(constraint){
        this.superview.removeConstraint(constraint);
    }

});