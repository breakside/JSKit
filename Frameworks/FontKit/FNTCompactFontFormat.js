// #import "Foundation/Foundation.js"
// #import "FontKit/FNTOpenTypeConstructor.js"
/* global JSClass, JSObject, JSRange, FNTOpenTypeConstructor */
'use strict';

(function(){

JSClass("FNTCompactFontFormat", JSObject, {

    data: null,
    dataView: null,
    numberOfFonts: 0,
    name: null,
    info: null,
    private: null,

    initWithData: function(data){
        this.data = data;
        this.dataView = data.dataView();
        return;
        // disabling full init until it works
        var major = this.dataView.getUint8(0);
        var minor = this.dataView.getUint8(1);
        if (major != 1){
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
        // Encodings
        // Charsets
        // FDSelect (CIDFonts only)
        // CharStrings Index (per font)
        // Font Dict Index (per font, CID Only)
        // Private Dict (per font)
        // Local Subroutines Index (per-font or per-Private DICT for CIDFonts)
        // Copyright and Trademark
        this.name = this.names.objectDataAtIndex(0).stringByDecodingLatin1();
        this.info = this.getTopDictionary(0);
        this.private = this.getPrivateDictionary(this.info.Private[1], this.info.Private[0]);
    },

    getTopDictionary: function(i){
        var data = this.topDicts.objectDataAtIndex(i);
        return this._decodeDictionary(data, [
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
        ], {
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
        });
    },

    getPrivateDictionary: function(offset, length){
        var data = this.data.subdataInRange(JSRange(offset, length));
        this._decodeDictionary(data, [
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
        ], {
            BlueScale: 0.039625,
            BlueShift: 7,
            BlueFuzz: 1,
            ForceBold: false,
            LanguageGroup: 0,
            ExpansionFactor: 0.06,
            initialRandomSeed: 0,
            defaultWidthX: 0,
            nominalWidthX: 0
        });
    },

    _decodeDictionary: function(data, fieldMap, defaultValues){
        var info = defaultValues || {};
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
                field = data[i++];
                if (typeof(field[1]) == "object"){
                    field = field[i][data[i++]];
                }
                info[field[0]] = fieldTypes[field[1]].apply(this, operands);
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
        completion.call(target, null);
        return completion.promise;
        // disabling open type construction until it works
        var constructor = FNTOpenTypeConstructor.init();
        // head  Font header
        constructor.head.setUintsPerEM(Math.round(1 / this.info.FontMatrix[0]));
        constructor.head.setBoundingBox(this.info.FontBBox[0], this.info.FontBBox[1], this.info.FontBBox[2], this.info.FontBBox[3]);
        if (this.info.ItalicAngle){
            constructor.head.setItalic();
        }
        if (this.info.Weight == "Bold" || this.info.Weight == "Black"){
            constructor.head.setBold();
        }
        // hhea  Horizontal header
        var ascender = this.info.FontBBox[3];
        var descender = this.info.FontBBox[1];
        if (this.private.BlueValues.length > 2){
            ascender = this.private.BlueValues[this.private.BlueValues.length - 2];
        }
        if (this.private.OtherBlues && this.private.OtherBlues.length > 1){
            descender = this.private.OtherBlues[1];
        }
        constructor.setLineHeight(ascender, descender);
        constructor.hhea.setNumberOfHMetrics(0); // FIXME
        // hmtx  Horizontal metrics
        constructor.hmtx.setWidths([]); // FIXME
        // maxp  Maximum profile
        constructor.maxp.setNumberOfGlyphs(0); // FIXME
        // cmap  Character to glyph mapping
        // name  Naming table
        // OS/2  OS/2 and Windows specific metrics
        // post  PostScript information
        constructor.addTable('CFF ', this.data);
        constructor.getData(completion, target);
        return completion.promise;
    }

});

var fieldTypes = {
    number: function(n){ return n; },
    boolean: function(n){ return n !== 0; },
    sid: function(n){ return this.getString(n); },
    array: function(){ Array.prototype.slice.apply(arguments, 0); },
    delta: function(){
        var n = Array.prototype.slice.apply(arguments, 0);
        for (var i = 1, l = n.length; i < l; ++i){
            n[i] += n[i - 1];
        }
        if (n.length === 1){
            return n[0];
        }
        return n;
    }
};

var CFFIndex = function(dataView, offset, dataSize){
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