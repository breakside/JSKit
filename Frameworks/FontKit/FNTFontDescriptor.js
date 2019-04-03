// #import Foundation
// #import "FontKit/FNTOpenTypeFont.js"
/* global JSClass, JSDataFontDescriptor, FNTFontDescriptor, FNTOpenTypeFont, JSFont, UnicodeChar */
'use strict';

JSClass("FNTFontDescriptor", JSDataFontDescriptor, {

    font: null,
    _glyphToCharacterMap: null,
    _characterToGlyphMap: null,

    initWithOpenTypeData: function(data){
        var font = FNTOpenTypeFont.initWithData(data);
        this.initWithOpenTypeFont(font);
    },

    initWithOpenTypeFont: function(font){
        FNTFontDescriptor.$super.initWithData.call(this, font.data);
        this.font = font;
        var head = this.font.tables.head;
        if (head){            
            this._unitsPerEM = head.unitsPerEM;
        }
        var hhea = this.font.tables.hhea;
        if (hhea){
            this._ascender = hhea.ascender;
            this._descender = hhea.descender;
        }
        var os2 = this.font.tables['OS/2'];
        if (os2){
            this._weight = Math.floor(os2.weight / 100) * 100;
            this._style = (os2.selection & 0x1) ? JSFont.Style.italic : JSFont.Style.normal;
        }
        // this._family
        // this._name
        // this._face
        // this._postScriptName
        this._characterToGlyphMap = {};
        this._glyphToCharacterMap = {};
    },

    glyphForCharacter: function(character){
        var code = character.code;
        var glyphIndex = this._characterToGlyphMap[code];
        if (glyphIndex === undefined){
            glyphIndex = this.font.glyphForCharacter(character);
            if (glyphIndex !== 0){
                this._glyphToCharacterMap[glyphIndex] = code;
            }
        }
        return glyphIndex;
    },

    characterForGlyph: function(glyphIndex){
        var code = this._glyphToCharacterMap[glyphIndex];
        if (code === undefined){
            code = 0xfffd;
        }
        return UnicodeChar(code);
    },

    widthOfGlyph: function(glyphIndex){
        return this.font.widthOfGlyph(glyphIndex);
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        completion.call(target, this.font.data);
        return completion.promise;
    }

});