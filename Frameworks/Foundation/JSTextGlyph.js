// #import "Foundation/JSFont.js"
/* global JSGlobalObject, JSTextGlyph */
'use strict';

(function(){

JSGlobalObject.JSTextGlyph = function(length, width){
    if (this === undefined){
        return new JSTextGlyph(length, width);
    }
    this.width = width;
    this.length = length;
};

JSTextGlyph.FromUTF16 = function(utf16, font){
    var width = 0;
    var iterator = utf16.unicodeIterator();
    if (!iterator.character.isLineBreak){ // FIXME: Do we need this check, or are line break characters always 0 in fonts?
        width += font.widthOfCharacter(iterator.character);
    }
    // FIXME: assuming combining marks are 0 width, may not be correct
    return JSTextGlyph(utf16.length, width);
};

})();