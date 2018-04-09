// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSSize, JSRect */
'use strict';

JSClass("JSTextAttachment", JSObject, {

    size: JSReadOnlyProperty('_size', null),
    image: JSDynamicProperty('_image', null),
    baselineAdjustment: 0,

    init: function(){
        this._size = JSSize.Zero;
    },

    initWithImage: function(image){
        this._image = image;
        this._size = JSSize(image.size);
    },

    layout: function(font, lineWidth){
        if (this._size.width > lineWidth){
            this._size = JSSize(lineWidth, this._size.height * lineWidth / this._size.width);
        }
    },

    drawInContextAtPoint: function(context, point){
        context.drawImage(this._image, JSRect(point, this._size));
    }

});