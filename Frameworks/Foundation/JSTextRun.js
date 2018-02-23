// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSSize, JSRange, JSPoint, JSDynamicProperty, JSReadOnlyProperty */
'use strict';

(function(){

JSClass("JSTextRun", JSObject, {

    origin: JSReadOnlyProperty('_origin', null),
    size: JSReadOnlyProperty('_size', null),
    range: JSReadOnlyProperty('_range', null),
    _glyphStorage: null,

    initWithGlyphStorage: function(glyphStorage, attributes){
        this.init();
        this._glyphStorage = glyphStorage;
        this._size = JSSize(this._glyphStorage.width, this._glyphStorage.font.lineHeight);
        this._range = JSRange(this._glyphStorage.range);
        this._origin = JSPoint.Zero;
    },

    initWithAttachment: function(attachment, size, range){
        this.init();
        this._range = JSRange(range);
        this._size = JSSize(size);
        this._origin = JSPoint.Zero;
    },

    drawInContext: function(context){
    },

    characterIndexAtPoint: function(point){
    },

    rectForCharacterAtIndex: function(index){
    }

});

})();