// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSSize, JSRange, JSPoint, JSDynamicProperty, JSReadOnlyProperty */
'use strict';

(function(){

JSClass("JSTextRun", JSObject, {

    origin: JSReadOnlyProperty('_origin', JSPoint.Zero),
    size: JSReadOnlyProperty('_size', JSSize.Zero),
    range: JSReadOnlyProperty('_range', JSRange.Zero),

    initWithAttributes: function(attributes){
        this._origin = JSPoint.Zero;
        this._size = JSSize.Zero;
        this._range = JSRange.Zero;
    },

    drawInContext: function(context){
    },

    addUserPerceivedCharacter: function(utf16){
    },

    removeTrailingCharacter: function(utf16Width){
    },

    addAttachment: function(attachment, size){
    },

    characterIndexAtPoint: function(point){
    },

    rectForCharacterAtIndex: function(index){
    }

});

})();