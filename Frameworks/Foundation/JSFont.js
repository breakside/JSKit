// #import "Foundation/JSObject.js"
// #import "Foundation/JSFontDescriptor.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/Zlib.js"
// #feature DataView
/* global JSClass, JSObject, JSBundle, JSReadOnlyProperty, JSPoint, JSFont, JSFontDescriptor, DataView, Zlib, JSRange, UnicodeChar */
'use strict';

(function(){

JSClass("JSFont", JSObject, {

    descriptor: JSReadOnlyProperty('_descriptor', null),
    fullName: JSReadOnlyProperty('_fullName', null),
    postScriptName: JSReadOnlyProperty('_postScriptName', null),
    familyName: JSReadOnlyProperty(),
    faceName: JSReadOnlyProperty('_faceName', null),
    pointSize: JSReadOnlyProperty('_pointSize', 0.0),
    ascender: JSReadOnlyProperty('_ascender', 0.0),
    descender: JSReadOnlyProperty('_descender', 0.0),
    lineHeight: JSReadOnlyProperty('_lineHeight', 0.0),
    displayLineHeight: JSReadOnlyProperty('_displayLineHeight', 0),
    displayAscender: JSReadOnlyProperty('_displayAscender', 0),
    displayDescender: JSReadOnlyProperty('_displayDescender', 0),
    leading: JSReadOnlyProperty('_leading', 0.0),
    _unitsPerEM: 0,
    _ascenderInUnits: 0,
    _descenderInUnits: 0,

    initWithSpec: function(spec, values){
        var descriptor = JSFont._systemFontDescriptor;
        var pointSize = JSFont.Size.normal;
        if ('descriptor' in values){
            descriptor = spec.resolvedValue(values.descriptor);
        }else if ('family' in values){
            descriptor = JSFontDescriptor.initWithSpec(spec, values);
        }else{
            if ('weight' in values){
                descriptor = descriptor.descriptorWithWeight(spec.resolvedEnum(values.weight, JSFont.Weight));
            }
            if ('style' in values){
                descriptor = descriptor.descriptorWithStyle(spec.resolvedEnum(values.style, JSFont.Style));
            }
        }
        if ('size' in values){
            pointSize = spec.resolvedEnum(values.size, JSFont.Size);
        }
        if (descriptor !== null){
            return JSFont.fontWithDescriptor(descriptor, pointSize);
        }
        return null;
    },

    getFamilyName: function(){
        return this._descriptor.family;
    },

    fontWithWeight: function(weight){
        if (weight == this.descriptor.weight){
            return this;
        }
        var descriptor = this.descriptor.descriptorWithWeight(weight);
        return JSFont.fontWithDescriptor(descriptor, this.pointSize);
    },

    fontWithStyle: function(style){
        if (style == this.descriptor.style){
            return this;
        }
        var descriptor = this.descriptor.descriptorWithStyle(style);
        return JSFont.fontWithDescriptor(descriptor, this.pointSize);
    },

    fontWithPointSize: function(pointSize){
        if (pointSize == this.descriptor.pointSize){
            return this;
        }
        var descriptor = this.descriptor;
        return JSFont.fontWithDescriptor(descriptor, pointSize);
    },

    _calculateMetrics: function(){
        this._ascender = this._ascenderInUnits / this._unitsPerEM * this.pointSize;
        this._descender = this._descenderInUnits / this._unitsPerEM * this.pointSize;
        this._lineHeight = this._ascender - this._descender;
        this._displayAscender = Math.round(this._ascender);
        this._displayDescender = Math.round(this._descender);
        this._displayLineHeight = this._displayAscender - this._displayDescender;
        this._leading = 0.0;
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
    charactersForGlyphs: function(glyphs){
        var chars = [];
        for (var i = 0, l = glyphs.length; i < l; ++i){
            chars.push(this.characterForGlyph(glyphs[i]));
        }
        return chars;
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

    widthOfString: function(str){
        var iterator = str.unicodeIterator();
        var width = 0;
        while (iterator.index < str.length){
            width += this.widthOfGlyph(this.glyphForCharacter(iterator.character));
            iterator.increment();
        }
        return width;
    },

    widthOfGlyph: function(glyphIndex){
        if (!this._cache.widths){
            if (this._cache.widths64){
                var widthBytes = Zlib.uncompress(this._cache.widths64.dataByDecodingBase64());
                if (widthBytes.length > 1){
                    this._cache.widths = new DataView(widthBytes.buffer, widthBytes.byteOffset, widthBytes.length);
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
            return this._cache.widths.getUint16(byteOffset) / this._unitsPerEM * this.pointSize;
        }
        return this._cache.widths.getUint16(this._cache.widths.byteLength - 2) / this._unitsPerEM * this.pointSize;
    },

    drawGlyphsInContextAtPoint: function(glyphs, context, point){
        // TODO: if this is a color bitmap font (like emojis), use drawImage() instead of showGlyphs()
        context.save();
        context.setFont(this);
        context.showGlyphs(glyphs, [JSPoint(point.x, -point.y - this.lineHeight - this.descender)]);
        context.restore();
    }

});

JSClass("JSAttachmentFont", JSFont, {

    _attachment: null,

    initWithAttachment: function(attachment){
        this._attachment = attachment;
        this._fullName = "";
        this._postScriptName = "";
        this._faceName = "";
        this._pointSize = attachment.size.height;
        this._lineHeight = attachment.size.height + Math.max(0, attachment.baselineAdjustment);
        this._descender = Math.min(0, attachment.baselineAdjustment);
        this._ascender = this._lineHeight + this._descender;
        this._descriptor = JSFontDescriptor.initWithFamily('_JSAttachmentFont+' + attachment.objectID);
    },

    fontWithStyle: function(){
        return this;
    },

    fontWithWeight: function(){
        return this;
    },

    glyphForCharacter: function(character){
        if (character.code === 0xFFFC){
            return 1;
        }
        return 0;
    },

    widthOfGlyph: function(glyph){
        if (glyph === 1){
            return this._attachment.size.width;
        }
        return 0;
    },

    drawGlyphsInContextAtPoint: function(glyphs, context, point){
        if (glyphs.length != 1 || glyphs[0] != 1){
            throw new Error("JSAttachmentFont can only draw a single glyph at a time");
        }
        this._attachment.drawInContextAtPoint(context, point);
    }

});

JSFont._creationHooks = [];

JSFont.addCreationHook = function(method){
    JSFont._creationHooks.push(method);
};

JSFont._fontWithResourceInfo = function(info, pointSize){
    var id = info.unique_identifier;
    var cache = JSFont._cache[id];
    if (!cache){
        cache = JSFont._cache[id] = {
            widths64: info.widths,
            cmap64: info.cmap,
            cmap: null,
            widths: null,
            sizes: {}
        };
    }
    var font = cache.sizes[pointSize];
    if (!font){
        font = JSFont.init();
        font._descriptor = JSFontDescriptor.initWithProperties(info.family, info.weight, info.style);
        font._fullName = info.name;
        font._postScriptName = info.postscript_name;
        font._faceName = info.face;
        font._unitsPerEM = info.unitsPerEM;
        font._ascenderInUnits = info.ascender;
        font._descenderInUnits = info.descender;
        font._pointSize = pointSize;
        font._calculateMetrics();
        for (var i = 0, l = JSFont._creationHooks.length; i < l; ++i){
            JSFont._creationHooks[i].call(font);
        }
        font._cache = cache;
        cache.sizes[pointSize] = font;
    }
    return font;
};

JSFont.fontWithResourceName = function(name, pointSize){
    var ext;
    var extIndex = name.lastIndexOf('.');
    var i, l;
    if (extIndex > 0 && extIndex < name.length - 1){
        ext = name.substr(extIndex + 1);
        name = name.substr(0, extIndex);
    }else{
        ext = "ttf";
    }
    var metadata = JSBundle.mainBundle.metadataForResourceName(name, ext);
    return JSFont._fontWithResourceInfo(metadata.font, pointSize);
};

JSFont.fontWithFamily = function(family, pointSize, weight, style){
    var descriptor = JSFontDescriptor.initWithProperties(family, weight || JSFont.Weight.regular, style || JSFont.Style.normal);
    return JSFont.fontWithDescriptor(descriptor, pointSize);
};

JSFont.fontWithDescriptor = function(descriptor, pointSize){
    var fonts = JSFont._families[descriptor.family] || [];
    var info;
    for (var i = 0, l = fonts.length; i < l; ++i){
        info = fonts[i];
        if (info.weight == descriptor.weight && info.style == descriptor.style){
            return JSFont._fontWithResourceInfo(info, pointSize);
        }
    }
    return null;
};

JSFont.registerBundleFonts = function(bundle){
    var fonts = bundle.fonts();
    for (var i = 0, l = fonts.length; i < l; ++i){
        JSFont.registerFontResource(fonts[i]);
    }
};

JSFont.registerFontResource = function(metadata){
    var info = metadata.font;
    if (!(info.family in JSFont._families)){
        JSFont._families[info.family] = [];
    }
    // TODO: remember resource path so we can load the font data later
    JSFont._families[info.family].push(info);
};

JSFont._systemFontDescriptor = null;

JSFont.registerSystemFontResource = function(resourceName){
    var font = JSFont.fontWithResourceName(resourceName, JSFont.Size.normal);
    JSFont._systemFontDescriptor = font.descriptor;
};

JSFont.registerSystemFont = function(familyName, weight, style){
    JSFont._systemFontDescriptor = JSFontDescriptor.initWithProperties(familyName, weight || JSFont.Weight.regular, style || JSFont.Style.normal);
};

JSFont.registerDummySystemFont = function(){
    var familyName = "Dummy";
    var descriptor = JSFontDescriptor.initWithFamily(familyName);
    var family = [];
    var weights = [
        'ultraLight',
        'thin',
        'light',
        'regular',
        'medium',
        'semibold',
        'bold',
        'heavy',
        'black',
    ];
    var weight;
    var name;
    for (var i = 0; i < weights.length; i++){
        weight = weights[i];
        name = familyName + "-" + weight;
        family.push({
            unique_identifier: name,
            family: descriptor.family,
            weight: JSFont.Weight[weight],
            style: descriptor.style,
            name: name,
            postscript_name: name,
            face: weight,
            unitsPerEM: 2048,
            ascender: 1700,
            descender: -300
        });
    }
    JSFont._systemFontDescriptor = descriptor;
    JSFont._families[familyName] = family;
};

JSFont.unregisterDummySystemFont = function(){
    if (this._systemFontDescriptor){
        delete JSFont._families[this._systemFontDescriptor.family];
        this._systemFontDescriptor = null;
    }
};

JSFont.systemFontOfSize = function(pointSize){
    if (this._systemFontDescriptor === null){
        return null;
    }
    return JSFont.fontWithDescriptor(this._systemFontDescriptor, pointSize);
};

JSFont.Size = {
    detail: 12.0,
    normal: 14.0
};

JSFont.Weight = {
    ultraLight: 100,
    thin: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
    black: 900
};

JSFont.Style = {
    normal: "normal",
    italic: "italic"
};

JSFont._cache = {
};

JSFont._families = {
};

var CMap = function(format, data){
    if (this === undefined){
        return new CMap(format, data);
    }
    this.data = new DataView(data.buffer, data.byteOffset, data.length);
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

})();