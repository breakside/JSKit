// #import "Foundation/Foundation.js"
// #import "FontKit/FNTOpenTypeConstructor.js"
// #import "FontKit/FNTAdobeNames.js"
/* global Int16Array, Int32Array, JSClass, JSCopy, JSDeepCopy, JSObject, JSRange, FNTOpenTypeConstructor, FNTOpenTypeFontTableCFF, FNTOpenTypeFontCmap12, FNTAdobeNamesToUnicode */
'use strict';

(function(){

JSClass("FNTCompactFontFormat", JSObject, {

    data: null,
    dataView: null,
    majorVersion: 0,
    minorVersion: 0,
    numberOfFonts: 0,
    name: null,
    info: null,
    private: null,
    encoding: null,
    charset: null,
    charStrings: null,

    initWithData: function(data){
        this.data = data;
        this.dataView = data.dataView();

        this.majorVersion = this.dataView.getUint8(0);
        this.minorVersion = this.dataView.getUint8(1);
        if (this.majorVersion != 1){
            return null;
        }
        var headerSize = this.dataView.getUint8(2);
        var offsetSize = this.dataView.getUint8(3);

        var offset = headerSize;
        this.names = new CFFIndex(this.dataView, offset);
        this.numberOfFonts = this.names.count;
        offset += this.names.length;
        this.topDicts = new CFFIndex(this.dataView, offset);
        offset += this.topDicts.length;
        this.strings = new CFFIndex(this.dataView, offset);
        offset += this.strings.length;
        this.globalSubroutines = new CFFIndex(this.dataView, offset);
        offset += this.globalSubroutines.length;
        // FDSelect (CIDFonts only)
        // Font Dict Index (per font, CID Only)
        // Local Subroutines Index (per-font or per-Private DICT for CIDFonts)
        // Copyright and Trademark
        this.name = this.names.objectDataAtIndex(0).stringByDecodingLatin1();
        this.info = this.getTopDictionary(0);
        if (this.info.Private){
            this.private = this.getPrivateDictionary(this.info.Private[1], this.info.Private[0]);
        }else{
            this.private = privateDefaults;
        }
        if (this.info.CharStrings){
            this.charStrings = new CFFIndex(this.dataView, this.info.CharStrings);
        }
        if (this.info.charset >= 3 && this.charStrings){
            this.charset = new CharacterSet(this.dataView, this.info.charset, this);
        }else{
            if (this.info.charset === 0){
                // TODO: use ISOAdobe charset
            }else if (this.info.charset == 1){
                // TODO: use Expert
            }else if (this.info.charset == 2){
                // TODO: use ExpertSubset
            }
        }
        if (this.info.Encoding){
            this.encoding = new Encoding(this.dataView, this.info.Encoding, this);
        }else{
            if (this.info.Encoding === 0){
                this.encoding = new PredefinedEncoding(PredefinedEncoding.StandardEncoding);
            }
        }
    },

    getTopDictionary: function(i){
        var data = this.topDicts.objectDataAtIndex(i);
        return this._decodeDictionary(data, topFieldMap, topDefaults);
    },

    getPrivateDictionary: function(offset, length){
        var data = this.data.subdataInRange(JSRange(offset, length));
        return this._decodeDictionary(data, privateFieldMap, privateDefaults);
    },

    _decodeDictionary: function(data, fieldMap, defaultValues){
        var info = defaultValues ? JSDeepCopy(defaultValues) : {};
        var i = 0;
        var b;
        var field;
        var operands = [];
        var r;
        while (i < data.length){
            b = data[i++];
            if (b >= 32 && b <= 246){
                operands.push(b - 139);
            }else if (b >= 247 && b <= 250){
                operands.push((b - 247) * 256 + data[i++] + 108);
            }else if (b >= 251 && b <= 254){
                operands.push(-(b - 251) * 256 - data[i++] - 108);
            }else if (b == 28){
                operands.push(Int16Array.from([(data[i] << 8) | data[i + 1]])[0]);
                i += 2;
            }else if (b == 29){
                operands.push(Int32Array.from([(data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]])[0]);
                i += 4;
            }else if (b == 30){
                var str = "";
                while (true){
                    b = data[i++];
                    r = (b & 0xF0) >> 4;
                    if (r < 0xa){
                        str += String.fromCharCode(0x30 + r);
                    }else if (r == 0xa){
                        str += ".";
                    }else if (r == 0x0b){
                        str += "e";
                    }else if (r == 0x0c){
                        str += "e-";
                    }else if (r == 0x0e){
                        str += "-";
                    }else if (r == 0x0f){
                        break;
                    }
                    r = (b & 0xF);
                    if (r < 0xa){
                        str += String.fromCharCode(0x30 + r);
                    }else if (r == 0xa){
                        str += ".";
                    }else if (r == 0x0b){
                        str += "e";
                    }else if (r == 0x0c){
                        str += "e-";
                    }else if (r == 0x0e){
                        str += "-";
                    }else if (r == 0x0f){
                        break;
                    }
                }
                operands.push(parseFloat(str));
            }else{
                field = fieldMap[b];
                if (field){
                    if (typeof(field[1]) == "object"){
                        field = field[1][data[i++]];
                    }
                    if (field){
                        info[field[0]] = fieldTypes[field[1]].apply(this, operands);
                    }
                }
                operands = [];
            }
            
        }
        return info;
    },

    getString: function(sid){
        if (sid < AdobeStandardStrings.length){
            return AdobeStandardStrings[sid];
        }
        return this.strings.objectDataAtIndex(sid - AdobeStandardStrings.length).stringByDecodingLatin1();
    },

    getOpenTypeData: function(externalInfo, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }

        var otf = FNTOpenTypeConstructor.initWithGlyphType(FNTOpenTypeConstructor.GlyphType.compactFontFormat);

        // name
        // All names are mac (1) roman (0) english (0)
        // Must add names in ascending ID order
        if (this.info.FamilyName){
            otf.name.addName(1, 0, 0, 2, this.info.FamilyName.latin1()); // family name (2)
        }
        if (this.info.FullName){
            otf.name.addName(1, 0, 0, 4, this.info.FullName.latin1()); // full name (4)
        }
        otf.name.addName(1, 0, 0, 6, this.name.latin1()); // Postscript name (6)

        // head  Font header
        otf.head.unitsPerEM = Math.round(1 / this.info.FontMatrix[0]);
        otf.setItalicAngle(this.info.ItalicAngle);
        if (this.info.Weight == "Bold" || this.info.Weight == "Black"){
            otf.head.setBold();
        }

        // maxp  Maximum Profile
        otf.maxp.numberOfGlyphs = this.charStrings.count;

        // hhea  Horizontal header
        var bbox = externalInfo.bbox || this.info.FontBBox;
        var ascender = 0;
        var descender = 0;
        if (bbox){
            otf.head.setBoundingBox(bbox);
            ascender = bbox[3];
            descender = bbox[1];
        }
        if (this.private.BlueValues && this.private.BlueValues.length > 2){
            ascender = this.private.BlueValues[this.private.BlueValues.length - 2];
        }
        if (this.private.OtherBlues && this.private.OtherBlues.length > 1){
            descender = this.private.OtherBlues[1];
        }
        if ('ascender' in externalInfo){
            ascender = externalInfo.ascender;
        }
        if ('descender' in externalInfo){
            descender = externalInfo.descender;
        }
        otf.setLineHeight(ascender, descender);

        var i, l;

        // cmap
        var map;
        var unicodeGlyphPairs;
        if (this.charset){
            unicodeGlyphPairs = this.charset.getUnicodeGlyphPairs();
        }else{
            unicodeGlyphPairs = [];
        }
        map = FNTOpenTypeFontCmap12.initWithUnicodeGlyphPairs(unicodeGlyphPairs);
        otf.cmap.addMap(3, 10, map);

        // widths
        // TODO: left side bearing?
        var widths = [0];
        var encoding = externalInfo.singleByteEncoding;
        var code;
        if (!encoding && this.encoding){
            encoding = this.encoding.getByteMap();
        }
        if (encoding){
            if (externalInfo.diffs){
                encoding = JSCopy(encoding);
                var codeOrName;
                for (i = 0, l = externalInfo.diffs.length; i < l; ++i){
                    codeOrName = externalInfo.diffs[i];
                    if (typeof(codeOrName) == "number"){
                        code = codeOrName;
                    }else{
                        encoding[code] = FNTAdobeNamesToUnicode[codeOrName];
                        ++code;
                    }
                }
            }
        }
        if (externalInfo.widths && encoding){
            var glyph;
            for (code = externalInfo.firstWidth; code <= externalInfo.lastWidth; ++code){
                glyph = map.glyphForCharacterCode(encoding[code]);
                if (glyph !== 0){
                    widths[glyph] = externalInfo.widths[code - externalInfo.firstWidth];
                }
            }
            for (i = 0, l = widths.length; i < l; ++i){
                if (widths[i] === undefined){
                    widths[i] = 0;
                }
            }
        }else{
            var charString;
            var charStringView;
            var op;
            var width;
            var w;
            if (this.info.CharstringType == 2){
                for (i = 0, l = this.charStrings.count; i < l; ++i){
                    charString = new CharString(this.charStrings.objectDataAtIndex(i));
                    widths.push(charString.type2Width(externalInfo.nominalWidth || this.private.nominalWidthX, this.private.defaultWidthX));
                }
            }else{
                for (i = 0, l = this.charStrings.count; i < l; ++i){
                    charString = new CharString(this.charStrings.objectDataAtIndex(i));
                    widths.push(charString.type1Width(this.private.defaultWidthX));
                }
            }
        }
        otf.hhea.numberOfHMetrics = widths.length;
        otf.hmtx.setWidths(widths);

        // CFF
        var cff = FNTOpenTypeFontTableCFF.initWithData(this.data);
        otf.addTable(cff);

        otf.getData(completion, target);

        return completion.promise;
    }

});

var topFieldMap = [
    ["version", "sid"],
    ["notice", "sid"],
    ["FullName", "sid"],
    ["FamilyName", "sid"],
    ["Weight", "sid"],
    ["FontBBox", "array"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, [
        ["Copyright", "sid"],
        ["isFixedPitch", "boolean"],
        ["ItalicAngle", "number"],
        ["UnderlinePosition", "number"],
        ["UnderlineThickness", "number"],
        ["PaintType", "number"],
        ["CharstringType", "number"],
        ["FontMatrix", "array"],
        ["StrokeWidth", "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        ["SyntheticBase", "number"],
        ["PostScript", "sid"],
        ["BaseFontName", "sid"],
        ["BaseFontBlend", "delta"]
    ]],
    ["UniqueID", "number"],
    ["XUID", "array"],
    ["charset", "number"],
    ["Encoding", "number"],
    ["CharStrings", "number"],
    ["Private", "array"]
];

var privateFieldMap = [
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    ["BlueValues", "delta"],
    ["OtherBlues", "delta"],
    ["FamilyBlues", "delta"],
    ["FamilyOtherBlues", "delta"],
    ["StdHW", "number"],
    ["StdVW", "number"],
    [null, [
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        [null, "number"],
        ["BlueScale", "number"],
        ["BlueShift", "number"],
        ["BlueFuzz", "number"],
        ["StemSnapH", "delta"],
        ["StemSnapV", "delta"],
        ["ForceBold", "boolean"],
        [null, "number"],
        [null, "number"],
        ["LanguageGroup", "number"],
        ["ExpansionFactor", "number"],
        ["initialRandomSeed", "number"]
    ]],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    [null, "number"],
    ["Subrs", "number"],
    ["defaultWidthX", "number"],
    ["nominalWidthX", "number"]
];

var topDefaults = {
    isFixedPitch: false,
    ItalicAngle: 0,
    UnderlinePosition: -100,
    UnderlineThickness: 50,
    PaintType: 0,
    CharstringType: 2,
    FontMatrix: [0.001,0,0,0.001,0,0],
    FontBBox: [0, 0, 0, 0],
    StrokeWidth: 0,
    charset: 0,
    Encoding: 0
};

var privateDefaults = {
    BlueScale: 0.039625,
    BlueShift: 7,
    BlueFuzz: 1,
    ForceBold: false,
    LanguageGroup: 0,
    ExpansionFactor: 0.06,
    initialRandomSeed: 0,
    defaultWidthX: 0,
    nominalWidthX: 0
};

var CharString = function(data){
    if (this === undefined){
        return new CharString(data);
    }
    this.data = data;
    this.dataView = data.dataView();
    this.offset = 0;
};

CharString.prototype = {
    next: function(){
        if (this.offset >= this.data.length){
            return {};
        }
        var b = this.data[this.offset++];
        if (b >= 32){
            if (b <= 246){
                return {number: b - 139};
            }
            if (b <= 250){
                return {number: (b - 247) * 256 + this.data[this.offset++] + 108};
            }
            if (b <= 254){
                return {number: -(b - 247) * 256 - this.data[this.offset++] - 108};
            }
            var whole = this.dataView.getInt16(this.offset);
            var fraction = this.dataView.getUint16(this.offset + 2) / 0x10000;
            this.offset += 4;
            return {number: whole + fraction};
        }
        if (b == 28){
            b = this.data[this.ofset++];
            return {number: new Int16Array([(b << 8) | this.data[this.offset++]])[0]};
        }
        if (b == 12){
            return {operator: 120 + this.data[this.offset++]};
        }
        return {operator: b};
    },

    type1Width: function(defaultWidth){
        // extract width from Type 1 format, or use default
        // Should start with s w hsbsw
        // or sx sy wx wy sbw
        var stack = [];
        var op = this.next();
        while (op !== null){
            if ('number' in op){
                stack.push(op.number);
            }else{
                if (op.operator == 127){
                    op = this.next();
                    stack.pop();
                    return stack.pop();
                }else if (op.operator == 13){
                    return stack.pop();
                }else{
                    return defaultWidth;
                }
            }
            op = this.next();
        }
        return defaultWidth;
    },

    type2Width: function(nominalWidth, defaultWidth){
        // extract width from Type 2 format & add to nominalWidthX, or use default
        // w? {hs* vs* cm* hm* mt subpath}? {mt subpath}* endchar
        // 
        // hs = hstem or hstemhm command
        // vs = vstem or vstemhm command
        // cm = cntrmask operator
        // hm = hintmask operator
        // mt = moveto (i.e. any of the moveto) operators
        //
        // We need to parse up to the first operator, then see if there's
        // an extra operand at the start of the stack, which would be the
        // width if present.
        var argumentCountByOperator = {
            21: 2,
            22: 1,
            4: 1,
            14: 0,
            1: 'even',
            3: 'even',
            18: 'even',
            23: 'even',
            19: 0,
            20: 0,
        };
        var stack = [];
        var op = this.next();
        var argc = 0;
        while (op !== null){
            if ('number' in op){
                stack.push(op.number);
            }else{
                argc = argumentCountByOperator[op.operator];
                if (argc === undefined){
                    return defaultWidth;
                }else if (argc == 'even'){
                    if (stack.length % 2){
                        return stack[0] + nominalWidth;
                    }
                    return defaultWidth;
                }else{
                    if (stack.length == argc + 1){
                        return stack[0] + nominalWidth;
                    }
                    return defaultWidth;
                }
            }
            op = this.next();
        }
        return defaultWidth;
    }
};

var fieldTypes = {
    number: function(n){ return n; },
    boolean: function(n){ return n !== 0; },
    sid: function(n){ return this.getString(n); },
    array: function(){ return Array.prototype.slice.call(arguments, 0); },
    delta: function(){
        var n = Array.prototype.slice.call(arguments, 0);
        for (var i = 1, l = n.length; i < l; ++i){
            n[i] += n[i - 1];
        }
        if (n.length === 1){
            return n[0];
        }
        return n;
    }
};

var CFFIndex = function(dataView, offset){
    if (this === undefined){
        return new CFFIndex(dataView, offset);
    }
    this.dataView = dataView;
    this.offset = offset;
    this.count = dataView.getUint16(offset);
    if (this.count === 0){
        this.length = 2;
    }else{
        this.offsetSize = dataView.getUint8(offset + 2);
        this.length = this.offsetOfObjectAtIndex(this.count) - this.offset;
    }
};

CFFIndex.prototype = {

    offsetOfObjectAtIndex: function(i){
        return this.offset + 3 + this.offsetSize * (this.count + 1) - 1 + getInt[this.offsetSize](this.dataView, this.offset + 3 + this.offsetSize * i);
    },

    objectDataAtIndex: function(i){
        var offset = this.offsetOfObjectAtIndex(i);
        var length = this.offsetOfObjectAtIndex(i + 1) - offset;
        return new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + offset, length);
    }

};

var CharacterSet = function(dataView, offset, font){
    if (this === undefined){
        return new CharacterSet(dataView, offset, font);
    }
    this.dataView = dataView;
    this.offset = offset;
    this.format = dataView.getUint8(offset);
    this.font = font;
    switch (this.format){
        case 0:
            this.getUnicodeGlyphPairs = this.getUnicodeGlyphPairs0;
            break;
        case 1:
            this.getUnicodeGlyphPairs = this.getUnicodeGlyphPairs1;
            break;
        case 2:
            this.getUnicodeGlyphPairs = this.getUnicodeGlyphPairs2;
            break;
        default:
            throw new Error("Invalid charset format: %d".sprintf(this.format));
    }
};

CharacterSet.prototype = {

    getUnicodeGlyphPairs0: function(){
        var sid;
        var map = [];
        var name;
        var code;
        var offset = this.offset + 1;
        for (var glyph = 1, last = this.font.charStrings.count - 1; glyph <= last; ++glyph, offset += 2){
            sid = this.dataView.getUint16(offset);
            name = this.font.getString(sid);
            code = FNTAdobeNamesToUnicode[name];
            if (code){
                map.push([code, glyph]);
            }
        }
        return map;
    },

    getUnicodeGlyphPairs1: function(){
        var offset = this.offset + 1;
        var glyph = 1;
        var map = [];
        var name;
        var sid;
        var remaining;
        var code;
        do {
            sid = this.dataView.getUint16(offset);
            remaining = this.dataView.getUint8(offset + 2);
            name = this.font.getString(sid);
            code = FNTAdobeNamesToUnicode[name];
            if (code){
                map.push([code, glyph]);
            }
            ++sid;
            ++glyph;
            for (; remaining > 0; --remaining, ++sid, ++glyph){
                name = this.font.getString(sid);
                code = FNTAdobeNamesToUnicode[name];
                if (code){
                    map.push([code, glyph]);
                }
            }
            offset += 3;
        }while (glyph < this.font.charStrings.count);
        return map;
    },

    getUnicodeGlyphPairs2: function(){
        // just like format 1 except remaining is a unit16 instead of unit8
        var offset = this.offset + 1;
        var glyph = 1;
        var map = [];
        var name;
        var sid;
        var remaining;
        var code;
        do {
            sid = this.dataView.getUint16(offset);
            remaining = this.dataView.getUint16(offset + 2);
            name = this.font.getString(sid);
            code = FNTAdobeNamesToUnicode[name];
            if (code){
                map.push([code, glyph]);
            }
            ++sid;
            ++glyph;
            for (; remaining > 0; --remaining, ++sid, ++glyph){
                name = this.font.getString(sid);
                code = FNTAdobeNamesToUnicode[name];
                if (code){
                    map.push([code, glyph]);
                }
            }
            offset += 4;
        }while (glyph < this.font.charStrings.count);
        return map;
    },

    getGlyphToUnicodeMap: function(){
        var pairs = this.getUnicodeGlyphPairs();
        var map = [];
        for (var i = 0, l = pairs.length; i < l; ++i){
            map[pairs[1]] = pairs[0];
        }
        return map;
    }

};

var Encoding = function(dataView, offset, font){
    if (this === undefined){
        return new Encoding(dataView, offset, font);
    }
    this.dataView = dataView;
    this.offset = offset;
    this.format = dataView.getUint8(offset);
    this.hasSupplements = this.format & 0x80;
    if (this.hasSupplements){
        this.format = this.format & 0x7F;
    }
    // TODO: support supplemental encodings
    this.font = font;
    switch (this.format){
        case 0:
            this.getByteMap = this.getByteMap0;
            break;
        case 1:
            this.getByteMap = this.getByteMap1;
            break;
        default:
            throw new Error("Invalid encoding format: %d".sprintf(this.format));
    }
};

Encoding.prototype = {

    getByteMap0: function(){
        var count = this.dataView.getUint8(this.offset + 1);
        var map = [];
        var i, l;
        for (i = 0; i < 256; ++i){
            map[i] = 0xfffd;
        }
        if (this.font.charset){
            var glyphMap = this.font.charset.getGlyphToUnicodeMap();
            var code;
            var unicode;
            for (var glyph = 0; glyph < count; ++glyph){
                code = this.dataView.getUint8(this.offset + 1 + glyph);
                unicode = glyphMap[glyph];
                if (unicode !== undefined){
                    map[code] = unicode;
                }
            }
        }
        return map;
    },

    getByteMap1: function(){
        var count = this.dataView.getUint8(this.offset + 1);
        var first;
        var left;
        var offset = this.offset + 2;
        var map = [];
        var i, l;
        var unicode;
        for (i = 0; i < 256; ++i){
            map[i] = 0xfffd;
        }
        if (this.charset){
            var glyphMap = this.font.charset.getGlyphToUnicodeMap();
            var glyph = 0;
            for (i = 0; i < count; ++i){
                first = this.dataView.getUint8(offset++);
                left = this.dataView.getUint8(offset++);
                for (var code = first; code <= first + left; ++code, ++glyph){
                    unicode = glyphMap[glyph];
                    if (unicode !== undefined){
                        map[code] = unicode;
                    }
                }
            }
        }
        return map;
    }

};

var PredefinedEncoding = function(map){
    if (this === undefined){
        return new PredefinedEncoding(map);
    }
    this.map = map;
};

PredefinedEncoding.prototype = {
    getByteMap: function(){
        return this.map;
    }
};

PredefinedEncoding.StandardEncoding = [0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00a1,0x00a2,0x00a3,0x2044,0x00a5,0x0192,0x00a7,0x00a4,0x0027,0x201c,0x00ab,0x2039,0x203a,0xfb01,0xfb02,0xfffd,0x2013,0x2020,0x2021,0x00b7,0xfffd,0x00b6,0x2022,0x201a,0x201e,0x201d,0x00bb,0x2026,0x2030,0xfffd,0x00bf,0xfffd,0x0060,0x00b4,0x02c6,0x02dc,0x00af,0x02d8,0x02d9,0x00a8,0xfffd,0x02da,0x00b8,0xfffd,0x02dd,0x02db,0x02c7,0x2014,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00c6,0xfffd,0x00aa,0xfffd,0xfffd,0xfffd,0xfffd,0x0141,0x00d8,0x0152,0x00ba,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00e6,0xfffd,0xfffd,0xfffd,0x0131,0xfffd,0xfffd,0x0142,0x00f8,0x0153,0x00df,0xfffd,0xfffd,0xfffd,0xfffd];

var getInt = [
    null,
    function (dataView, offset){ return dataView.getUint8(offset); },
    function (dataView, offset){ return dataView.getUint16(offset); },
    function (dataView, offset){ return (dataView.getUint8(offset) << 16) | dataView.getUint16(offset + 1); },
    function (dataView, offset){ return dataView.getUint32(offset); },
];

var AdobeStandardStrings = [
    ".notdef",
    "space",
    "exclam",
    "quotedbl",
    "numbersign",
    "dollar",
    "percent",
    "ampersand",
    "quoteright",
    "parenleft",
    "parenright",
    "asterisk",
    "plus",
    "comma",
    "hyphen",
    "period",
    "slash",
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "colon",
    "semicolon",
    "less",
    "equal",
    "greater",
    "question",
    "at",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "bracketleft",
    "backslash",
    "bracketright",
    "asciicircum",
    "underscore",
    "quoteleft",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "braceleft",
    "bar",
    "braceright",
    "asciitilde",
    "exclamdown",
    "cent",
    "sterling",
    "fraction",
    "yen",
    "florin",
    "section",
    "currency",
    "quotesingle",
    "quotedblleft",
    "guillemotleft",
    "guilsinglleft",
    "guilsinglright",
    "fi",
    "fl",
    "endash",
    "dagger",
    "daggerdbl",
    "periodcentered",
    "paragraph",
    "bullet",
    "quotesinglbase",
    "quotedblbase",
    "quotedblright",
    "guillemotright",
    "ellipsis",
    "perthousand",
    "questiondown",
    "grave",
    "acute",
    "circumflex",
    "tilde",
    "macron",
    "breve",
    "dotaccent",
    "dieresis",
    "ring",
    "cedilla",
    "hungarumlaut",
    "ogonek",
    "caron",
    "emdash",
    "AE",
    "ordfeminine",
    "Lslash",
    "Oslash",
    "OE",
    "ordmasculine",
    "ae",
    "dotlessi",
    "lslash",
    "oslash",
    "oe",
    "germandbls",
    "onesuperior",
    "logicalnot",
    "mu",
    "trademark",
    "Eth",
    "onehalf",
    "plusminus",
    "Thorn",
    "onequarter",
    "divide",
    "brokenbar",
    "degree",
    "thorn",
    "threequarters",
    "twosuperior",
    "registered",
    "minus",
    "eth",
    "multiply",
    "threesuperior",
    "copyright",
    "Aacute",
    "Acircumflex",
    "Adieresis",
    "Agrave",
    "Aring",
    "Atilde",
    "Ccedilla",
    "Eacute",
    "Ecircumflex",
    "Edieresis",
    "Egrave",
    "Iacute",
    "Icircumflex",
    "Idieresis",
    "Igrave",
    "Ntilde",
    "Oacute",
    "Ocircumflex",
    "Odieresis",
    "Ograve",
    "Otilde",
    "Scaron",
    "Uacute",
    "Ucircumflex",
    "Udieresis",
    "Ugrave",
    "Yacute",
    "Ydieresis",
    "Zcaron",
    "aacute",
    "acircumflex",
    "adieresis",
    "agrave",
    "aring",
    "atilde",
    "ccedilla",
    "eacute",
    "ecircumflex",
    "edieresis",
    "egrave",
    "iacute",
    "icircumflex",
    "idieresis",
    "igrave",
    "ntilde",
    "oacute",
    "ocircumflex",
    "odieresis",
    "ograve",
    "otilde",
    "scaron",
    "uacute",
    "ucircumflex",
    "udieresis",
    "ugrave",
    "yacute",
    "ydieresis",
    "zcaron",
    "exclamsmall",
    "Hungarumlautsmall",
    "dollaroldstyle",
    "dollarsuperior",
    "ampersandsmall",
    "Acutesmall",
    "parenleftsuperior",
    "parenrightsuperior",
    "twodotenleader",
    "onedotenleader",
    "zerooldstyle",
    "oneoldstyle",
    "twooldstyle",
    "threeoldstyle",
    "fouroldstyle",
    "fiveoldstyle",
    "sixoldstyle",
    "sevenoldstyle",
    "eightoldstyle",
    "nineoldstyle",
    "commasuperior",
    "threequartersemdash",
    "periodsuperior",
    "questionsmall",
    "asuperior",
    "bsuperior",
    "centsuperior",
    "dsuperior",
    "esuperior",
    "isuperior",
    "lsuperior",
    "msuperior",
    "nsuperior",
    "osuperior",
    "rsuperior",
    "ssuperior",
    "tsuperior",
    "ff",
    "ffi",
    "ffl",
    "parenleftinferior",
    "parenrightinferior",
    "Circumflexsmall",
    "hyphensuperior",
    "Gravesmall",
    "Asmall",
    "Bsmall",
    "Csmall",
    "Dsmall",
    "Esmall",
    "Fsmall",
    "Gsmall",
    "Hsmall",
    "Ismall",
    "Jsmall",
    "Ksmall",
    "Lsmall",
    "Msmall",
    "Nsmall",
    "Osmall",
    "Psmall",
    "Qsmall",
    "Rsmall",
    "Ssmall",
    "Tsmall",
    "Usmall",
    "Vsmall",
    "Wsmall",
    "Xsmall",
    "Ysmall",
    "Zsmall",
    "colonmonetary",
    "onefitted",
    "rupiah",
    "Tildesmall",
    "exclamdownsmall",
    "centoldstyle",
    "Lslashsmall",
    "Scaronsmall",
    "Zcaronsmall",
    "Dieresissmall",
    "Brevesmall",
    "Caronsmall",
    "Dotaccentsmall",
    "Macronsmall",
    "figuredash",
    "hypheninferior",
    "Ogoneksmall",
    "Ringsmall",
    "Cedillasmall",
    "questiondownsmall",
    "oneeighth",
    "threeeighths",
    "fiveeighths",
    "seveneighths",
    "onethird",
    "twothirds",
    "zerosuperior",
    "foursuperior",
    "fivesuperior",
    "sixsuperior",
    "sevensuperior",
    "eightsuperior",
    "ninesuperior",
    "zeroinferior",
    "oneinferior",
    "twoinferior",
    "threeinferior",
    "fourinferior",
    "fiveinferior",
    "sixinferior",
    "seveninferior",
    "eightinferior",
    "nineinferior",
    "centinferior",
    "dollarinferior",
    "periodinferior",
    "commainferior",
    "Agravesmall",
    "Aacutesmall",
    "Acircumflexsmall",
    "Atildesmall",
    "Adieresissmall",
    "Aringsmall",
    "AEsmall",
    "Ccedillasmall",
    "Egravesmall",
    "Eacutesmall",
    "Ecircumflexsmall",
    "Edieresissmall",
    "Igravesmall",
    "Iacutesmall",
    "Icircumflexsmall",
    "Idieresissmall",
    "Ethsmall",
    "Ntildesmall",
    "Ogravesmall",
    "Oacutesmall",
    "Ocircumflexsmall",
    "Otildesmall",
    "Odieresissmall",
    "OEsmall",
    "Oslashsmall",
    "Ugravesmall",
    "Uacutesmall",
    "Ucircumflexsmall",
    "Udieresissmall",
    "Yacutesmall",
    "Thornsmall",
    "Ydieresissmall",
    "001.000",
    "001.001",
    "001.002",
    "001.003",
    "Black",
    "Bold",
    "Book",
    "Light",
    "Medium",
    "Regular",
    "Roman",
    "Semibold"
];

})();