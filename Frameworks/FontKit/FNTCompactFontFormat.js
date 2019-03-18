// #import "Foundation/Foundation.js"
// #import "FontKit/FNTOpenTypeConstructor.js"
// #import "FontKit/FNTAdobeNames.js"
/* global Int16Array, Int32Array, JSClass, JSDeepCopy, JSObject, JSRange, FNTOpenTypeConstructor, FNTOpenTypeFontTableCFF, FNTOpenTypeFontCmap12, FNTAdobeNamesToUnicode */
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
        if (this.info.Encoding){
            this.encoding = new CFFIndex(this.dataView, this.info.Encoding);
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
    },

    getTopDictionary: function(i){
        var data = this.topDicts.objectDataAtIndex(i);
        return this._decodeDictionary(data, topFieldMap, topDefaults);
    },

    getPrivateDictionary: function(offset, length){
        var data = this.data.subdataInRange(JSRange(offset, length));
        this._decodeDictionary(data, privateFieldMap, privateDefaults);
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
                operands.push(139 - b);
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

    getOpenTypeData: function(completion, target){
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
        var ascender = 0;
        var descender = 0;
        if (this.info.FontBBox){
            otf.head.setBoundingBox(this.info.FontBBox);
            ascender = this.info.FontBBox[3];
            descender = this.info.FontBBox[1];
            if (this.private.BlueValues.length > 2){
                ascender = this.private.BlueValues[this.private.BlueValues.length - 2];
            }
            if (this.private.OtherBlues && this.private.OtherBlues.length > 1){
                descender = this.private.OtherBlues[1];
            }
        }
        otf.setLineHeight(ascender, descender);

        // widths
        // TODO: left side bearing?
        var widths = [];
        var charString;
        var i, l;
        var charStringView;
        var op;
        var width;
        var w;
        if (this.info.CharstringType == 2){
            for (i = 0, l = this.charStrings.count; i < l; ++i){
                // extract width from Type 2 format & add to nominalWidthX, or use default
                // If the first item in the charString is an encoded number, it's the width stored
                // as the difference from nominalWidthX
                charString = new CharString(this.charStrings.objectDataAtIndex(i));
                op = charString.next();
                if ('number' in op){
                    widths.push(Math.round(op.number + this.private.nominalWidthX));
                }else{
                    widths.push(this.private.defaultWidthX);
                }
            }
        }else{
            for (i = 0, l = this.charStrings.count; i < l; ++i){
                // extract width from Type 1 format, or use default
                // Should start with s w hsbsw
                // or sx sy wx wy sbw
                charString = new CharString(this.charStrings.objectDataAtIndex(i));
                op = charString.next();
                width = 0;
                if ('number' in op){
                    op = charString.next();
                    if ('number' in op){
                        w = op.number;
                        op = charString.next();
                        if ('number' in op){
                            w = op.number;
                            op = charString.next();
                            if ('number' in op){
                                op = charString.next();
                                if (op.operator == 12){
                                    op = charString.next();
                                    if (op.operator == 7){
                                        width = w;
                                    }
                                }
                            }
                        }else{
                            if (op.operator == 13){
                                width = w;
                            }
                        }
                    }
                }
                widths.push(width);
            }
        }

        otf.hhea.numberOfHMetrics = widths.length;
        otf.hmtx.setWidths(widths);

        // cmap
        var map;
        if (this.charset){
            var unicodeToGlyph = this.charset.getUnicodeMap();
            map = FNTOpenTypeFontCmap12.initWithUnicodeMap(unicodeToGlyph);
        }else{
            map = FNTOpenTypeFontCmap12.initWithUnicodeMap([]);
        }
        otf.cmap.addMap(3, 10, map);

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
        return {operator: b};
    }
};

var fieldTypes = {
    number: function(n){ return n; },
    boolean: function(n){ return n !== 0; },
    sid: function(n){ return this.getString(n); },
    array: function(){ Array.prototype.slice.call(arguments, 0); },
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
            this.getUnicodeMap = this.getUnicodeMap0;
            break;
        case 1:
            this.getUnicodeMap = this.getUnicodeMap1;
            break;
        case 2:
            this.getUnicodeMap = this.getUnicodeMap2;
            break;
        default:
            throw new Error("Invalid charset format: %d".sprintf(this.format));
    }
};

CharacterSet.prototype = {

    getUnicodeMap0: function(){
        var sid;
        var map = [];
        var name;
        var code;
        var offset = this.offset + 1;
        for (var glyph = 1, last = this.font.charStrings.count - 1; glyph < last; ++glyph, offset += 2){
            sid = this.dataView.getUint16(offset);
            name = this.font.getString(sid);
            code = FNTAdobeNamesToUnicode[name];
            if (code){
                map.push([code, glyph]);
            }
        }
        return map;
    },

    getUnicodeMap1: function(){
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
                ++code;
                ++glyph;
                for (; remaining > 0; --remaining, ++code, ++glyph){
                    map.push([code, glyph]);
                }
            }else{
                glyph += remaining + 1;
            }
            offset += 3;
        }while (glyph < this.font.charStrings.count);
        return map;
    },

    getUnicodeMap2: function(){
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
                ++code;
                ++glyph;
                for (; remaining > 0; --remaining, ++code, ++glyph){
                    map.push([code, glyph]);
                }
            }else{
                glyph += remaining + 1;
            }
            offset += 4;
        }while (glyph < this.font.charStrings.count);
        return map;
    }

};

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