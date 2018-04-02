// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSTextRun, JSObject, JSSize, JSRange, JSRect, JSPoint, JSDynamicProperty, JSReadOnlyProperty */
'use strict';

(function(){

JSClass("JSTextRun", JSObject, {

    origin: JSReadOnlyProperty('_origin', null),
    size: JSReadOnlyProperty('_size', null),
    range: JSReadOnlyProperty('_range', null),
    glyphs: null,
    glyphCharacterLengths: null,
    attributes: null,
    font: null,

    initWithGlyphs: function(glyphs, glyphCharacterLengths, font, attributes, range){
        this.glyphs = glyphs;
        this.glyphCharacterLengths = glyphCharacterLengths;
        this.attributes = attributes;
        this.font = font;
        this._size = JSSize(0, font.lineHeight);
        for (var i = 0, l = glyphs.length; i < l; ++i){
            this._size.width += font.widthOfGlyph(glyphs[i]);
        }
        this._range = JSRange(range);
        this._origin = JSPoint.Zero;
    },

    drawInContext: function(context){
        // TODO: text matrix?
        // TODO: text position?
        // TODO: attachments
        context.save();
        context.setFont(this.font);
        // TODO: other attributes
        context.showGlyphs(this.glyphs);
        context.restore();
    },

    characterIndexAtPoint: function(point){
        var x = 0;
        if (this.glyphs === null || this.glyphs.length === 0 || x >= point.x){
            return this.range.location;
        }
        var index = this.range.location;
        var glyph;
        var width;
        var characterLength;
        for (var i = 0, l = this.glyphs.length; i < l && x < point.x; ++i){
            glyph = this.glyphs[i];
            width = this.font.widthOfGlyph(glyph);
            characterLength = this.glyphCharacterLengths[i];
            x += width;
            index += characterLength;
        }
        if (x > point.x && i > 0){
            if (x - point.x > (width / 2)){
                index -= characterLength;
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
        var width;
        var characterLength;
        var runningIndex = 0;
        for (var i = 0, l = this.glyphs.length; runningIndex < index && i < l; ++i){
            glyph = this.glyphs[i];
            width = this.font.widthOfGlyph(glyph);
            characterLength = this.glyphCharacterLengths[i];
            x += width;
            runningIndex += characterLength;
        }
        if (i < l){
            width = this.font.widthOfGlyph(this.glyphs[i]);
        }else{
            width = 0;
        }
        return JSRect(x, 0, width, this._size.height);
    },

    copy: function(){
        var run = JSTextRun.init();
        run._origin = JSPoint(this._origin);
        run._size = JSSize(this._size);
        run._range = JSRange(this._range);
        run.attributes = this.attributes;
        run.font = this.font;
        run.glyphs = [];
        run.glyphCharacterLengths = [];
        var i, l;
        for (i = 0, l = this.glyphs.length; i < l; ++i){
            run.glyphs.push(this.glyphs[i]);
        }
        for (i = 0, l = this.glyphCharacterLengths.length; i < l; ++i){
            run.glyphCharacterLengths.push(this.glyphCharacterLengths[i]);
        }
        return run;
    }

});

})();