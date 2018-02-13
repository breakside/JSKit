// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSRange */
'use strict';

(function(){

JSClass("JSTextGlyphStorage", JSObject, {

    font: null,
    width: 0,
    range: null,

    initWithFont: function(font, location){
        this.font = font;
        this.range = JSRange(location, 0);
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

    push: function(utf16){
        // TODO: normalizing iterator?
        var iterator = utf16.unicodeIterator();
        var startingFont = this.fontContainingCharacter(iterator.character);
        while (iterator.character !== null){
            this.width += this.font.widthOfCharacter(iterator.character.code);
            iterator.increment();
        }
    },

    pop: function(){
    }

});

})();