// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import "FNTOpenTypeFont.js"
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
            this._weight = Math.floor(os2.usWeightClass / 100) * 100;
            this._style = (os2.fsSelection & 0x1) ? JSFont.Style.italic : JSFont.Style.normal;
        }
        var name = font.tables.name;
        if (name){
            this._family = name.family;
            this._postScriptName = name.postscript;
            this._face = name.face;
            this._name = name.fullName;
        }
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