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

// #import "Promise+JS.js"
// #import "JSObject.js"
// #import "UnicodeChar.js"
// #import "Zlib.js"
// #import "CoreTypes.js"
// #import "JSURLSession.js"
/* global JSFont */
'use strict';

(function(){

JSClass("JSFontDescriptor", JSObject, {

    family: JSReadOnlyProperty('_family', null),
    // These next two properties have defaults that really should come from JSFont
    // enums, but that would create a circular import loop, so we'll just make an exception
    // and hard code static values
    weight: JSReadOnlyProperty('_weight', 400),
    style: JSReadOnlyProperty('_style', "normal"),
    name: JSReadOnlyProperty('_name', null),
    face: JSReadOnlyProperty('_face', null),
    postScriptName: JSReadOnlyProperty('_postScriptName', null),
    ascender: JSReadOnlyProperty('_ascender', 0),
    descender: JSReadOnlyProperty('_descender', 0),
    unitsPerEM: JSReadOnlyProperty('_unitsPerEM', 0),

    descriptorWithWeight: function(weight){
        return JSFontDescriptor.descriptorWithFamily(this.family, weight, this.style) || this;
    },

    bolderDescriptor: function(){
        var weight = this._weight + 300;
        return this.descriptorWithWeight(weight);
    },

    descriptorWithStyle: function(style){
        return JSFontDescriptor.descriptorWithFamily(this.family, this.weight, style) || this;
    },

    glyphForCharacter: function(character){
        return 0;
    },

    characterForGlyph: function(glyph){
        return UnicodeChar(0xfffd);
    },

    charactersForGlyphs: function(glyphs){
        var chars = [];
        for (var i = 0, l = glyphs.length; i < l; ++i){
            chars.push(this.characterForGlyph(glyphs[i]));
        }
        return chars;
    },

    stringForGlyphs: function(glyphs){
        var points = [];
        var chars = this.charactersForGlyphs(glyphs);
        for (var i = 0, l = chars.length; i < l; ++i){
            points.push(chars[i].code);
        }
        return String.fromCodePoint.apply(undefined, points);
    },

    widthOfGlyph: function(glyphIndex){
        return 0;
    },

    widthOfCharacter: function(character){
        var glyph = this.glyphForCharacter(character);
        return this.widthOfGlyph(glyph);
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        completion.call(target, null);
        return completion.promise;
    }

});

JSFontDescriptor.system = null;

JSFontDescriptor.descriptorsByFamily = {
};

JSFontDescriptor.registerDescriptor = function(descriptor){
    if (!(descriptor._family in JSFontDescriptor.descriptorsByFamily)){
        JSFontDescriptor.descriptorsByFamily[descriptor._family] = {};
    }
    if (!(descriptor._weight in JSFontDescriptor.descriptorsByFamily[descriptor._family])){
        JSFontDescriptor.descriptorsByFamily[descriptor._family][descriptor._weight] = {};
    }
    if (!(descriptor._style in JSFontDescriptor.descriptorsByFamily[descriptor._family][descriptor._weight])){
        JSFontDescriptor.descriptorsByFamily[descriptor._family][descriptor._weight][descriptor._style] = descriptor;
    }
};

JSFontDescriptor.descriptorWithFamily = function(family, weight, style){
    var weights = JSFontDescriptor.descriptorsByFamily[family] || {};
    var styles = weights[weight] || {};
    return styles[style] || null;
};

JSClass("JSDataFontDescriptor", JSFontDescriptor, {

    data: null,

    initWithData: function(data){
        this.data = data;
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        completion.call(target, this.data);
        return completion.promise;
    }

});

JSClass("JSResourceFontDescriptor", JSFontDescriptor, {

    bundle: null,
    metadata: null,

    initWithMetadata: function(bundle, metadata){
        this.bundle = bundle;
        this.metadata = metadata;
        this._family = metadata.font.family;
        this._weight = metadata.font.weight;
        this._style = metadata.font.style;
        this._name = metadata.font.name;
        this._postScriptName = metadata.font.postscript_name;
        this._face = metadata.font.face;
        this._ascender = metadata.font.ascender;
        this._descender = metadata.font.descender;
        this._unitsPerEM = metadata.font.unitsPerEM;
        this._cache = {
            widths64: metadata.font.widths,
            cmap64: metadata.font.cmap,
            cmap: null,
            widths: null,
        };
        JSResourceFontDescriptor.descriptorsByName[metadata.font.unique_identifier] = this;
    },

    glyphForCharacter: function(character){
        if (!this._cache.cmap){
            var cmapBytes = Zlib.uncompress(this._cache.cmap64.data.dataByDecodingBase64());
            this._cache.cmap = {
                tables: new CMap(this._cache.cmap64.format, cmapBytes),
                map: {},
                reverseMap: {}
            };
        }
        var glyphIndex = this._cache.cmap.map[character.code];
        if (glyphIndex === undefined){
            this._cache.cmap.map[character.code] = glyphIndex = this._cache.cmap.tables.glyphForCharacterCode(character.code);
            this._cache.cmap.reverseMap[glyphIndex] = character.code;
        }
        return glyphIndex;
    },

    // IMPORTANT: This only works of the glyphs have previously been looked up by glyphForCharacter
    characterForGlyph: function(glyph){
        if (!this._cache.cmap){
            return null;
        }
        var code = this._cache.cmap.reverseMap[glyph];
        if (code === undefined){
            return null;
        }
        return UnicodeChar(code);
    },

    // IMPORTANT: This only works of the glyphs have previously been looked up by glyphForCharacter
    stringForGlyphs: function(glyphs){
        if (!this._cache.cmap){
            return null;
        }
        var i, l;
        var codes = [];
        for (i = 0, l = glyphs.length; i < l; ++i){
            codes.push(this._cache.cmap.reverseMap[glyphs[i]]);
        }
        return String.fromCodePoint.apply(undefined, codes);
    },
    
    // IMPORTANT: This only works of the glyphs have previously been looked up by glyphForCharacter
    charactersForGlyphs: function(glyphs){
        var chars = [];
        for (var i = 0, l = glyphs.length; i < l; ++i){
            chars.push(this.characterForGlyph(glyphs[i]));
        }
        return chars;
    },

    widthOfGlyph: function(glyphIndex){
        if (!this._cache.widths){
            if (this._cache.widths64){
                var widths = Zlib.uncompress(this._cache.widths64.dataByDecodingBase64());
                if (widths.length > 1){
                    this._cache.widths = widths.dataView();
                }else{
                    delete this._cache.widths64;
                    return 0;
                }
            }else{
                return 0;
            }
        }
        var byteOffset = glyphIndex * 2;
        if (byteOffset < this._cache.widths.byteLength - 1){
            return this._cache.widths.getUint16(byteOffset) / this._unitsPerEM;
        }
        return this._cache.widths.getUint16(this._cache.widths.byteLength - 2) / this._unitsPerEM;
    },

    getData: function(completion, target){
        return this.bundle.getResourceData(this.metadata, completion, target);
    }

});

JSResourceFontDescriptor.descriptorsByName = {
};

JSClass("JSURLFontDescriptor", JSFontDescriptor, {

    url: null,

    initWithURL: function(url, family, weight, style){
        this.url = url;
        this._family = family;
        this._weight = weight;
        this._style = style;
        this._postScriptName = "%s-%s".sprintf(family.replace(" ", ""), this.face.replce(" ", ""));
        // this._ascender
        // this._descender
        // this._unitsPerEM
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.rejectNonNullSecondArgument);
        }
        var session = JSURLSession.shared;
        var task = session.dataTaskWithURL(this.url, function(error){
            if (error !== null){
                completion.call(target, null, error);
                return;
            }
            try{
                task.response.assertSuccess();
            }catch (e){
                completion.call(target, null, e);
                return;
            }
            completion.call(target, task.response.data, null);
        });
        task.resume();
        return completion.promise;
    },

    face: JSLazyInitProperty(function(){
        if (this.weight === JSFont.Weight.regular){
            if (this.style === JSFont.Style.italic){
                return "Italic";
            }
            return "Regular";
        }
        var name = "";
        switch (this.weight){
            case JSFont.Weight.ultraLight:
                name = "UltraLight";
                break;
            case JSFont.Weight.thin:
                name = "Thin";
                break;
            case JSFont.Weight.light:
                name = "Light";
                break;
            case JSFont.Weight.medium:
                name = "Medium";
                break;
            case JSFont.Weight.semibold:
                name = "SemiBold";
                break;
            case JSFont.Weight.bold:
                name = "Bold";
                break;
            case JSFont.Weight.heavy:
                name = "Heavy";
                break;
            case JSFont.Weight.black:
                name = "Black";
                break;
        }
        if (this.style === JSFont.Style.italic){
            name += " Italic";
        }
        return name;
    }),

});

var CMap = function(format, data){
    if (this === undefined){
        return new CMap(format, data);
    }
    this.data = data.dataView();
    this.glyphForCharacterCode = this['glyphForCharacterCode_format' + format];
    var init = this['init_format' + format];
    if (init){
        init.call(this);
    }
};

CMap.prototype = {

    // Format 0 - 8 bit map
    // Not used for unicode encodings because an 8 bit character
    // map doesn't make any sense.  No need to support.

    // Format 2 - 8/16 bit map for Chinese and Japanese
    // Not used for unicode encodings.  No need to support.

    // Format 4 - 16 bit sparse ranges
    //
    // Unlike the Format 12 sparse array, Format 4
    // searching is a little complicated.
    //
    // We'll ignore the search range stuff and just do
    // a binary search using start and end codes.
    //
    // If a matching group is found, use idRangeOffset
    // and idDelta to determine the glyph.
    //
    // 1. If idRangeOffset is 0, the glyph is just the
    //    character code + idDelta
    // 2. Otherwise, isRangeOffset specifies how many
    //    bytes ahead the glyph is.
    //    (offset for idRangeOffset) + idRangeOffset + 2 * (code - start)
    // 
    // +----------+---------------------+
    // | Uint16   | numberOfGroups * 2  |
    // +----------+---------------------+
    // | Uint16   | searchRange         |
    // +----------+---------------------+
    // | Uint16   | entrySelector       |
    // +----------+---------------------+
    // | Uint16   | rangeShift          |
    // +----------+---------------------+
    // | Uint16[] | endCodes            |
    // +----------+---------------------+
    // | Uint16   | reserved            |
    // +----------+---------------------+
    // | Uint16[] | startCodes          |
    // +----------+---------------------+
    // | Uint16[] | idDeltas            |
    // +----------+---------------------+
    // | Uint16[] | idRangeOffsets      |
    // +----------+---------------------+
    // | Uint16[] | glyphs              |
    // +----------+---------------------+

    init_format4: function(){
        this.numberOfGroups = this.data.getUint16(0) / 2;
        this.endOffset = 8;
        this.startOffset = this.endOffset + 2 * this.numberOfGroups + 2;
        this.idDeltaOffset = this.startOffset + 2 * this.numberOfGroups;
        this.idRangeOffset = this.idDeltaOffset + 2 * this.numberOfGroups;
    },

    glyphForCharacterCode_format4: function(code){
        var start;
        var end;
        var idDelta;
        var idRangeOffset;
        var min = 0;
        var max = this.numberOfGroups;
        var mid;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            start = this.data.getUint16(this.startOffset + 2 * mid);
            end = this.data.getUint16(this.endOffset + 2 * mid);
            if (code < start){
                max = mid;
            }else if (code > end){
                min = mid + 1;
            }else{
                idDelta = this.data.getInt16(this.idDeltaOffset + 2 * mid);
                idRangeOffset = this.data.getUint16(this.idRangeOffset + 2 * mid);
                if (idRangeOffset === 0){
                    return (code + idDelta) % 0xFFFF;
                }
                return this.data.getUint16(this.idRangeOffset + 2 * mid + idRangeOffset + 2 * (code - start));
            }
        }
        return 0;
    },

    // Format 6 - 16 bit trimmed table
    //
    // One table for a range of character codes. Typically
    // used when the font's glyphs are for a contiguous range
    // of characters, and all of them are 16-bit characters.
    //
    // +----------+----------------+
    // | Uint16   | firstCharCode  |
    // +----------+----------------+
    // | Uint16   | count          |
    // +----------+----------------+
    // | Uint16[] | glyphs         |
    // +----------+----------------+

    init_format6: function(){
        this.range = JSRange(this.data.getUint16(0), this.data.getUint16(2));
    },

    glyphForCharacterCode_format6: function(code){
        if (!this.range.contains(code)){
            return 0;
        }
        return this.data.getUint16(4 + 2 * (code - this.range.location));
    },

    // Format 8 - mixed 16 and 32 bit.  Use of format 8 is discouraged,
    // and the jskit compiler changes format 8 into format 12, so we never
    // have to deal with it here anyway.


    // Format 10 - 32-bit trimmed table
    //
    // One table for a range of character codes.  Typically
    // used when the font's glyphs are for a contiguous range
    // of characters.
    //
    // +----------+----------------+
    // | Uint32   | firstCharCode  |
    // +----------+----------------+
    // | Uint32   | count          |
    // +----------+----------------+
    // | Uint16[] | glyphs         |
    // +----------+----------------+

    init_format10: function(){
        this.range = JSRange(this.data.getUint32(0), this.data.getUint32(4));
    },

    glyphForCharacterCode_format10: function(code){
        if (!this.range.contains(code)){
            return 0;
        }
        return this.data.getUint16(8 + 2 * (code - this.range.location));
    },

    // Format 12 - 32-bit sparse tables
    // 
    // +----------+----------------+
    // | Uint32   | numberOfGroups |
    // +----------+----------------+
    // | Group[n] | Group array    |
    // +----------+----------------+
    // 
    // Group:
    // +--------+-----------------+
    // | Uint32 | firstCharCode   |
    // +--------+-----------------+
    // | Uint32 | endCharCode     |
    // +--------+-----------------+
    // | Uint32 | firstGlyphIndex |
    // +--------+-----------------+

    init_format12: function(){
        this.numberOfGroups = this.data.getUint32(0);
    },

    glyphForCharacterCode_format12: function(code){
        var min = 0;
        var max = this.numberOfGroups;
        var mid;
        var start;
        var end;
        var i;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            i = 4 + mid * 12;
            start = this.data.getUint32(i);
            end = this.data.getUint32(i + 4);
            if (code < start){
                max = mid;
            }else if (code > end){
                min = mid + 1;
            }else{
                return this.data.getUint32(i + 8) + (code - start);
            }
        }
        return 0;
    },

    // Format 13 - Many to one
    // 
    // Almost identical to format 12, but all characters
    // in a group map to the same glyph, rather than mapping
    // to sequential glyphs.  Typically only used for a
    // "Last Resort" font.
    //
    // +----------+----------------+
    // | Uint32   | numberOfGroups |
    // +----------+----------------+
    // | Group[n] | Group array    |
    // +----------+----------------+
    // 
    // Group:
    // +--------+-----------------+
    // | Uint32 | firstCharCode   |
    // +--------+-----------------+
    // | Uint32 | endCharCode     |
    // +--------+-----------------+
    // | Uint32 | glyphIndex      |
    // +--------+-----------------+

    init_format13: function(){
        this.numberOfGroups = this.data.getUint32(0);
    },

    glyphForCharacterCode_format13: function(code){
        var min = 0;
        var max = this.numberOfGroups;
        var mid;
        var start;
        var end;
        var i;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            i = 4 + mid * 12;
            start = this.data.getUint32(i);
            end = this.data.getUint32(i + 4);
            if (code < start){
                max = mid;
            }else if (code > end){
                min = mid + 1;
            }else{
                return this.data.getUint32(i + 8);
            }
        }
        return 0;
    },

    // TODO: Format 14 - Unicode Variations
};

JSClass("JSTestFontDescriptor", JSFontDescriptor, {

    fixedWidth: false,

    initWithName: function(name, ascender, descender, unitsPerEM){
        this._family = name;
        this._name = name;
        this._face = "Regular";
        this._postScriptName = name;
        this._ascender = (ascender !== undefined) ? ascender : 1900;
        this._descender = (descender !== undefined) ? descender : -500;
        this._unitsPerEM = (unitsPerEM !== undefined) ? unitsPerEM : 2048;
    },

    glyphForCharacter: function(character){
        if (this.fixedWidth){
            return 1;
        }
        if (character.code == 0x2026){ // ellipsis
            return 1;
        }
        if (character.code == 0x200B){ // zero-width space
            return 4;
        }
        if (character.code >= 0x61){  // lowercase, {, }, |, ~
            return 2;
        }
        return 3; // uppercase, digits, most punctuation

    },

    widthOfGlyph: function(glyph){
        if (this.fixedWidth){
            return 20/14.0;
        }
        if (glyph === 0){
            return 30/14;
        }
        if (glyph == 1){
            return 10/14;
        }
        if (glyph == 2){
            return 20/14;
        }
        if (glyph == 3){
            return 30/14;
        }
        if (glyph == 4){
            return 0;
        }
    }

});

})();