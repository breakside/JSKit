// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSSize, JSRange, JSRect, JSPoint, JSDynamicProperty, JSReadOnlyProperty */
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
        var x = 0;
        var widths = this._glyphStorage._characterWidths;
        for (var i = 0, l = widths.length; i < l && x < point.x; ++i){
            x += widths[i];
        }                     
        if (x > point.x && i > 0){
            var over = x - point.x;
            var lastWidth = widths[i - 1];
            if (x - point.x > (lastWidth / 2)){
                i -= 1;
            }
        }
        return this.range.location + i;
    },

    rectForCharacterAtIndex: function(index){
        if (this._glyphStorage === null){
            return JSRect(JSPoint.Zero, this._size);
        }
        var x = 0;
        var widths = this._glyphStorage._characterWidths;
        for (var i = 0, l = widths.length; i < index && i < l; ++i){
            x += widths[i];
        }
        return JSRect(x, 0, i < l ? widths[i] : 0, this._size.height);
    }

});

})();