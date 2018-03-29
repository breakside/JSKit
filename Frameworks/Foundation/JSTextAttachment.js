// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSSize */
'use strict';

JSClass("JSTextAttachment", JSObject, {

    size: JSReadOnlyProperty('_size', null),
    image: JSDynamicProperty('_image', null),
    baselineAdjustment: 0,

    init: function(){
        this._size = JSSize.Zero;
    },

    layout: function(lineWidth){
        
    },

    drawInContext: function(context){
        
    }

});