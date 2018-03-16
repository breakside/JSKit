// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSTextGlyph.js"
/* global JSClass, JSTextRun, JSObject, JSSize, JSRange, JSRect, JSPoint, JSDynamicProperty, JSReadOnlyProperty */
'use strict';

(function(){

JSClass("JSTextRun", JSObject, {

    origin: JSReadOnlyProperty('_origin', null),
    size: JSReadOnlyProperty('_size', null),
    range: JSReadOnlyProperty('_range', null),
    glyphs: null,
    attributes: null,
    font: null,

    initWithGlyphs: function(glyphs, font, attributes, range){
        this.glyphs = glyphs;
        this.attributes = attributes;
        this.font = font;
        this._size = JSSize(0, font.lineHeight);
        for (var i = 0, l = glyphs.length; i < l; ++i){
            this._size.width += glyphs[i].width;
        }
        this._range = JSRange(range);
        this._origin = JSPoint.Zero;
    },

    drawInContext: function(context){
    },

    characterIndexAtPoint: function(point){
        var x = 0;
        if (this.glyphs === null || this.glyphs.length === 0 || x >= point.x){
            return this.range.location;
        }
        var index = this.range.location;
        var glyph;
        for (var i = 0, l = this.glyphs.length; i < l && x < point.x; ++i){
            glyph = this.glyphs[i];
            x += glyph.width;
            index += glyph.length;
        }
        if (x > point.x && i > 0){
            if (x - point.x > (glyph.width / 2)){
                index -= glyph.length;
            }
        }
        return index;
    },

    rectForCharacterAtIndex: function(index){
        if (this.glyphs === null){
            return JSRect(JSPoint.Zero, this._size);
        }
        var x = 0;
        var glyph = null;
        var runningIndex = 0;
        for (var i = 0, l = this.glyphs.length; runningIndex < index && i < l; ++i){
            glyph = this.glyphs[i];
            x += glyph.width;
            runningIndex += glyph.length;
        }
        return JSRect(x, 0, i < l ? this.glyphs[i].width : 0, this._size.height);
    },

    copy: function(){
        var run = JSTextRun.init();
        run._origin = JSPoint(this._origin);
        run._size = JSSize(this._size);
        run._range = JSRange(this._range);
        run.attributes = this.attributes;
        run.font = this.font;
        run.glyphs = [];
        for (var i = 0, l = this.glyphs.length; i < l; ++i){
            run.glyphs.push(this.glyphs[i]);
        }
        return run;
    }

});

})();