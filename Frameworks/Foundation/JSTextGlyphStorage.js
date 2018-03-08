// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSRange */
'use strict';

(function(){

JSClass("JSTextGlyphStorage", JSObject, {

    font: null,
    width: 0,
    range: null,
    utf16: null,
    _characterWidths: null,

    initWithFont: function(font, location){
        this.font = font;
        this.range = JSRange(location, 0);
        this.utf16 = "";
        this._characterWidths = [];
    },

    fontContainingCharacter: function(character){
        if (this.font.containsGlyphForCharacter(character.code)){
            return this.font;
        }
        var i = 0;
        while (i < this.fallbackFonts.length){
            if (this.fallbackFonts[i].containsGlyphForCharacter(character.code)){
                return this.fallbackFonts[i];
            }
        }
        return this.font;
    },

    pushExtra: function(utf16){
        this.push(utf16, true);
    },

    push: function(utf16, preserveRange){
        // TODO: normalizing iterator?
        // TODO: stop if fallback font is requied
        if (!preserveRange){
            this.range.length += utf16.length;
        }
        this.utf16 += utf16;
        var iterator = utf16.unicodeIterator();
        var startingFont = this.fontContainingCharacter(iterator.character);
        var width;
        while (iterator.character !== null){
            if (!iterator.character.isLineBreak){ // FIXME: Do we need this check, or are line break characters always 0 in fonts?
                width = this.font.widthOfCharacter(iterator.character);
            }else{
                width = 0;
            }
            this._characterWidths.push(width);
            this.width += width;
            for (var i = iterator.index + 1; i < iterator.nextIndex; ++i){
                this._characterWidths.push(0);
            }
            iterator.increment();
        }
    },

    trimTrailingWhitespace: function(length){
        this.truncate(this.range.length - length, true);
    },

    truncate: function(length, preserveRange){
        if (!preserveRange){
            this.range.length = length;
        }
        this.utf16 = this.utf16.substr(0, length);
        for (var i = this._characterWidths.length - 1; i >= length; --i){
            this.width -= this._characterWidths[i];
            this._characterWidths.pop();
        }
    }

});

})();