// #import "Foundation/JSObject.js"
// #import "Foundation/JSImage.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSSize, JSRect, JSImage */
'use strict';

JSClass("JSTextAttachment", JSObject, {

    size: JSReadOnlyProperty('_size', null),
    image: JSDynamicProperty('_image', null),
    representedObject: null,
    baselineAdjustment: 0,

    init: function(){
        this._size = JSSize.Zero;
    },

    initWithImageForFont: function(image, font){
        this._image = image;
        var ratio = image.size.width / image.size.height;
        this._size = JSSize(ratio * font.displayLineHeight, font.displayLineHeight);
        this.baselineAdjustment = font.displayDescender;
    },

    initWithImage: function(image, size){
        if (size === undefined){
            size = image.size;
        }
        this._image = image;
        this._size = JSSize(size);
    },

    initWithImageName: function(name, size){
        var image = JSImage.initWithResourceName(name);
        this.initWithImage(image, size);
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