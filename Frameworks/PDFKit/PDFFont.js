// #import FontKit
// #import "PDFObject.js"
// #import "PDFCMap.js"
// #import "PDFOperationIterator.js"
'use strict';

(function(){

var logger = JSLog("PDFKit", "Font");

JSGlobalObject.PDFFont = function(){
    if (this === undefined){
        return new PDFFont();
    }
};

JSGlobalObject.PDFFont.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFName("Font") },
    Subtype:        PDFObjectProperty,

    load: {
        value: function PDFFont_load(completion, target){
            completion.call(target);
        }
    },

    stringFromData: {
        value: function PDFFont_stringFromData(data){
            return null;
        }
    },

    fontCompatibleStringFromData: {
        value: function PDFFont_stringFromData(data){
            return null;
        }
    },

    widthOfData: {
        value: function PDFFont_widthOfData(data, characterSpacing){
            return 0;
        }
    },

    foundationFontOfSize: {
        value: function PDFFont_foundationFontOfSize(size){
            return null;
        }
    }
});

var SimpleFontPrototype = Object.create(PDFFont.prototype, {
    Name:           PDFObjectProperty,
    BaseFont:       PDFObjectProperty,
    FirstChar:      PDFObjectProperty,
    LastChar:       PDFObjectProperty,
    Widths:         PDFObjectProperty,
    FontDescriptor: PDFObjectProperty,
    Encoding:       PDFObjectProperty,
    ToUnicode:      PDFObjectProperty,

    encoding: {
        writable: true,
        value: null
    },

    stringDecoder: {
        writable: true,
        value: null,
    },

    embeddedOpenTypeFont: {
        writable: true,
        value: null,
    },

    foundationFontDescriptor: {
        writable: true,
        value: null,
    },

    /// Get the user-meaninful string from the PDF-encoded string data.
    ///
    /// Useful for extracting text content.
    /// 
    /// If this font contains a ToUnicode map, use it.  Otherwise, use
    /// the Encoding entry or the embedded font's built-in encoding.
    stringFromData: {
        value: function PDFSimpleFont_stringFromData(data){
            var str = "";
            for (var i = 0, l = data.length; i < l; ++i){
                str += this.stringDecoder.stringFromCode(data[i]);
            }
            return str;
        }
    },

    /// Get a string that, when rendered with the font, will reproduce the
    /// expected glyphs, even if the returned string content might be meaningless to
    /// the user.
    ///
    /// Some PDFs include fonts that completely remap a standard encoding.  In such
    /// case, the rendering system needs a string, but not the user-meaningful string.
    ///
    /// Basically, decode the data, but do not consider the ToUnicode entry,
    /// and only consider the Encoding or built in font's encoding.
    fontCompatibleStringFromData: {
        value: function PDFSimpleFont_fontCompatibleStringFromData(data){
            // If we don't have an embedded font, we'll be interacting with a
            // system font that we can assume has a proper unicode encoding,
            // so it's best to use the stringDecoder.
            var decoder = this.stringDecoder;

            // However, if we have an embedded font, we want to skip the ToUnicode
            // decoder and only use a decoder that makes sense for the font.
            if (this.embeddedOpenTypeFont){
                decoder = this.encoding;
            }
            var str = "";
            for (var i = 0, l = data.length; i < l; ++i){
                str += decoder.stringFromCode(data[i]);
            }
            return str;
        }
    },

    widthOfData: {
        value: function PDFSimpleFont_widthOfData(data, characterSpacing, wordSpacing){
            if (data.length === 0){
                return 0;
            }
            if (!this.Widths){
                return 0;
            }
            var index;
            var width = 0;
            var min = this.FirstChar;
            var max = this.LastChar;
            var missingWidth = 0;
            var spaceCount = 0;
            if (this.FontDescriptor){
                missingWidth = this.FontDescriptor.MissingWidth || 0;
            }
            for (var i = 0, l = data.length; i < l; ++i){
                index = data[i];
                if (index >= min && index <= max){
                    width += this.Widths[index - min];
                }else{
                    width += missingWidth;
                }
                if (data[i] == 0x20){
                    ++spaceCount;
                }
            }
            return width / 1000 + characterSpacing * data.length + spaceCount * wordSpacing;
        }
    },

    load: {
        value: function PDFSimpleFont_load(completion, target){

            var loadFontFile = function(){
                if (!this.FontDescriptor || !this.FontDescriptor.getOpenTypeFont){
                    next.call(this);
                    return;
                }
                var map = null;
                var diffs = [];
                if (this.Encoding){
                    if (this.Encoding instanceof PDFName){
                        map = SingleByteEncoding.Named[this.Encoding] || null;
                    }else{
                        if (this.Encoding.BaseEncoding){
                            map = SingleByteEncoding.Named[this.Encoding.BaseEncoding] || null;
                        }
                        if (this.Encoding.Differences){
                            diffs = this.Encoding.Differences;
                        }
                    }
                }
                var info = {
                    singleByteEncoding: map,
                    diffs: diffs,
                    widths: this.Widths,
                    firstWidth: this.FirstChar,
                    lastWidth: this.LastChar
                };
                this.FontDescriptor.getOpenTypeFont(info, function(font){
                    this.embeddedOpenTypeFont = font;
                    this.foundationFontDescriptor = PDFOpenTypeFontDescriptor.initWithFont(this.embeddedOpenTypeFont, this);
                    next.call(this);
                }, this);
            };

            var loadUnicodeDecoder = function(){
                if (!this.ToUnicode){
                    next.call(this);
                    return;
                }
                this.ToUnicode.getData(function(cmapData){
                    this.stringDecoder = ToUnicodeCMap(cmapData);
                    next.call(this);
                }, this);
            };

            var loadEncoding = function(){
                var map = null;
                var diffs = [];
                if (this.Encoding){
                    if (this.Encoding instanceof PDFName){
                        map = SingleByteEncoding.Named[this.Encoding] || null;
                    }else{
                        if (this.Encoding.BaseEncoding){
                            map = SingleByteEncoding.Named[this.Encoding.BaseEncoding] || null;
                        }
                        if (map === null && this.FontDescriptor && this.FontDescriptor.embeddedTrueTypeFont){
                            map = SingleByteEncoding.StandardEncoding;
                        }
                        if (this.Encoding.Differences){
                            diffs = this.Encoding.Differences;
                        }
                    }
                }
                if (map === null){
                    // It's possible to have an Encoding dict with diffs, but
                    // no specified base encoding.  In such a scenario, we look to
                    // the embedded font for the implicit base encoding.
                    if (this.FontDescriptor){
                        if (this.FontDescriptor.embeddedOpenType1Font){
                            // TODO: extract encoding map from type 1 font
                        }else if (this.FontDescriptor.embeddedCompactFont){
                            if (this.FontDescriptor.embeddedCompactFont.encoding){
                                map = this.FontDescriptor.embeddedCompactFont.encoding.getByteMap();
                            }
                        }else if (this.FontDescriptor.embeddedTrueTypeFont){
                            // If an embedded true type font does not have a specified Encoding,
                            // we're supposed to look for particular cmaps, but it's not entirely
                            // clear what do do with them.
                            var unicode = this.FontDescriptor.embeddedTrueTypeFont.tables.cmap.getMap([3, 1]);
                            if (unicode){
                                // ok, we have a unicode cmap, but what does that say about the
                                // PDF's encoding?
                                map = SingleByteEncoding.StandardEncoding;
                            }else{
                                var macRoman = this.FontDescriptor.embeddedTrueTypeFont.tables.cmap.getMap([1, 0]);
                                if (macRoman){
                                    // If we don't have a unicode cmap, but do have a mac cmap,
                                    // assume MacOS encoding, which is a little different from
                                    // PDF's MacRoman encoding
                                    map = SingleByteEncoding.MacOSEncoding;
                                }else{
                                    // And if we don't have a mac cmap, well, ???
                                    map = SingleByteEncoding.StandardEncoding;
                                }
                            }
                        }else if (this.FontDescriptor.embeddedOpenTypeFont){
                            // If an embedded open type font does not have a specified Encoding,
                            // it's unclear which encoding we're supposed fallback to.
                            map = SingleByteEncoding.StandardEncoding;
                        }
                    }
                }
                if (map === null){
                    // If we don't have a specified encoding or an embedded encoding, then
                    // we either fallback to a symbolic encoding or the standard encoding.
                    map = SingleByteEncoding.Symbolic[this.BaseFont] || SingleByteEncoding.StandardEncoding;
                }
                this.encoding = SingleByteEncoding(map, diffs);
                if (this.stringDecoder === null){
                    this.stringDecoder = this.encoding;
                }
                next.call(this);
            };

            var createFallbackDescriptor = function(){
                if (this.foundationFontDescriptor === null){
                    this.foundationFontDescriptor = PDFStandardFontDescriptor.initWithPDFFont(this);
                }
                next.call(this);
            };

            var steps = [
                loadFontFile,
                loadUnicodeDecoder,
                loadEncoding,
                createFallbackDescriptor
            ];
            var stepIndex = -1;
            var next = function(){
                ++stepIndex;
                if (stepIndex < steps.length){
                    steps[stepIndex].call(this);
                }else{
                    completion.call(target);
                }
            };

            if (this.FontDescriptor){
                this.FontDescriptor.load(next, this);
            }else{
                next.call(this);
            }
        }
    },

    foundationFontOfSize: {
        value: function PDFSimpleFont_foundationFontOfSize(size){
            if (this.foundationFontDescriptor){
                return JSFont.initWithDescriptor(this.foundationFontDescriptor, size);
            }
            return null;
        }
    }
});

JSGlobalObject.PDFType1Font = function(){
    if (this === undefined){
        return new PDFType1Font();
    }
};

JSGlobalObject.PDFType1Font.prototype = Object.create(SimpleFontPrototype, {
    Subtype:        { enumerable: true, value: PDFName("Type1") },
});

JSGlobalObject.PDFTrueTypeFont = function(){
    if (this === undefined){
        return new PDFTrueTypeFont();
    }
};

JSGlobalObject.PDFTrueTypeFont.prototype = Object.create(SimpleFontPrototype, {
    Subtype:    { enumerable: true, value: PDFName("TrueType") },
});

JSGlobalObject.PDFMMType1Font = function(){
    if (this === undefined){
        return new PDFMMType1Font();
    }
};

JSGlobalObject.PDFMMType1Font.prototype = Object.create(SimpleFontPrototype, {
    Subtype:        { enumerable: true, value: PDFName("MMType1") }
});

JSGlobalObject.PDFType0Font = function(){
    if (this === undefined){
        return new PDFType0Font();
    }
};

JSGlobalObject.PDFType0Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("Type0") },
    BaseFont:       PDFObjectProperty,
    Encoding:       PDFObjectProperty,
    DescendantFonts: PDFObjectProperty,
    ToUnicode:      PDFObjectProperty,

    stringDecoder: {
        writable: true,
        value: null
    },

    embeddedOpenTypeFont: {
        writable: true,
        value: null
    },

    foundationFontDescriptor: {
        writable: true,
        value: null
    },

    load: {
        value: function PDFType0Font_load(completion, target){
            var descendant = this.DescendantFonts[0];

            var loadFontFile = function(){
                descendant.FontDescriptor.getOpenTypeFont({}, function(font){
                    this.embeddedOpenTypeFont = font;
                    this.foundationFontDescriptor = PDFOpenTypeFontDescriptor.initWithFont(this.embeddedOpenTypeFont, descendant);
                    next.call(this);
                }, this);
            };

            var loadUnicodeDecoder = function(){
                if (!this.ToUnicode){
                    next.call(this);
                    return;
                }
                this.ToUnicode.getData(function(cmapData){
                    if (cmapData !== null){
                        this.stringDecoder = ToUnicodeCMap(cmapData);
                        if (this.Encoding == "Identity-H" || this.Encoding == "Identity-V"){
                            Object.defineProperty(this, 'stringFromData', {value: this.stringFromDataIdentityToUnicode});
                        }
                    }
                    // TODO: support all the other CJK standard CMaps?
                    // TODO: support custom CMaps?
                    next.call(this);
                }, this);
            };

            var steps = [
                loadFontFile,
                loadUnicodeDecoder
            ];
            var stepIndex = -1;
            var next = function(){
                ++stepIndex;
                if (stepIndex < steps.length){
                    steps[stepIndex].call(this);
                }else{
                    completion.call(target);
                }
            };
            descendant.FontDescriptor.load(next, this);
        }
    },

    stringFromData: {
        configurable: true,
        value: function PDFType0Font_stringFromData(data){
            return null;
        }
    },

    fontCompatibleStringFromData: {
        configurable: true,
        value: function PDFType0Font_fontCompatibleStringFromData(data){
            return this.stringFromData(data);
        }
    },

    stringFromDataIdentityToUnicode: {
        value: function PDFType0Font_stringFromData(data){
            var dataView = data.dataView();
            var str = "";
            for (var i = 0, l = data.length; i < l; i += 2){
                str += this.stringDecoder.stringFromCode(dataView.getUint16(i));
            }
            return str;
        }
    },

    widthOfData: {
        value: function PDFType0Font_widthOfData(data, characterSpacing){
            return 0;
        }
    },

    foundationFontOfSize: {
        value: function PDFType0Font_foundationFontOfSize(size){
            if (this.foundationFontDescriptor){
                return JSFont.initWithDescriptor(this.foundationFontDescriptor, size);
            }
            return null;
        }
    }
});

var CIDFontPrototype = Object.create(PDFObject.prototype, {

});

JSGlobalObject.PDFCIDType0Font = function(){
    if (this === undefined){
        return new PDFCIDType0Font();
    }
};

JSGlobalObject.PDFCIDType0Font.prototype = Object.create(CIDFontPrototype, {
    Subtype:        { enumerable: true, value: PDFName("CIDFontType0") }
});

JSGlobalObject.PDFCIDType2Font = function(){
    if (this === undefined){
        return new PDFCIDType2Font();
    }
};

JSGlobalObject.PDFCIDType2Font.prototype = Object.create(CIDFontPrototype, {
    Subtype:        { enumerable: true, value: PDFName("CIDFontType1") }
});

JSGlobalObject.PDFType3Font = function(){
    if (this === undefined){
        return new PDFType3Font();
    }
};

JSGlobalObject.PDFType3Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("Type3") },
});

JSClass("PDFStandardFontDescriptor", JSFontDescriptor, {

    _fixedWidth: 0,
    _characterWidths: null,

    initWithPDFFont: function(pdfFont){
        var standard = StandardFonts[pdfFont.BaseFont];
        if (!standard){
            return null;
        }
        this.standard = standard;
        this._family = standard.family;
        this._weight = standard.weight;
        this._style = standard.style;
        this._postScriptName = standard.name;
        this._name = standard.name;
        this._face = "";
        this._ascender = standard.ascender;
        this._descender = standard.descender;
        this._unitsPerEM = 1000;
        this._cssFamily = standard.cssFamily;
        this._fixedWidth = (standard.fixedWidth || 0) / this._unitsPerEM;
        this._characterWidths = standard.characterWidths;
        if (this._fixedWidth){
            Object.defineProperty(this, 'widthOfCharacter', {
                configurable: true,
                value: this.widthOfCharacterFixed
            });
        }else{
            Object.defineProperty(this, 'widthOfCharacter', {
                configurable: true,
                value: this.widthOfCharacterVariable
            });
        }
    },

    cssString: function(pointSize, lineHeight){
        return '%d %s %fpx/%fpx %s'.sprintf(
            this._weight,
            this._style,
            pointSize,
            lineHeight,
            this._cssFamily
        );
    },

    widthOfCharacterFixed: function(character){
        return this._fixedWidth;
    },

    widthOfCharacterVariable: function(character){
        return (this._characterWidths[character.code] || 0) / this._unitsPerEM;
    }

});

var descriptorId = 0;

JSClass("PDFOpenTypeFontDescriptor", FNTFontDescriptor, {

    pdfFont: null,
    missingWidth: 0,

    initWithFont: function(otf, pdfFont){
        if (otf === null){
            return null;
        }
        this.pdfFont = pdfFont;
        PDFOpenTypeFontDescriptor.$super.initWithOpenTypeFont.call(this, otf);
        var pdfDescriptor = this.pdfFont.FontDescriptor;
        this._family = "PDFKit%d".sprintf(descriptorId++);
        this._weight = pdfDescriptor.Weight || JSFont.Weight.regular;
        this._style = (pdfDescriptor.Flags & 0x40) ? JSFont.Style.italic : JSFont.Style.normal;
        this._postScriptName = pdfDescriptor.FontName.valueDecodingUTF8();
        this._name = this._postScriptName;
        this._face = "";
        if ('MissingWidth' in pdfDescriptor){
            this.missingWidth = pdfDescriptor.MissingWidth;
        }
    }

});

var SingleByteEncoding = function(map, diffs){
    if (this === undefined){
        return new SingleByteEncoding(map, diffs);
    }
    if (diffs){
        // Make a copy of the base map so we can overwite entries
        this._map = [];
        var i, l;
        for (i = 0, l = map.length; i < l; ++i){
            this._map[i] = map[i];
        }

        // Overwrite
        var codeOrName;
        var code;
        for (i = 0, l = diffs.length; i < l; ++i){
            codeOrName = diffs[i];
            if (typeof(codeOrName) == "number"){
                code = codeOrName;
            }else{
                this._map[code] = FNTAdobeNamesToUnicode[codeOrName];
                ++code;
            }
        }
    }else{
        this._map = map;
    }
};

SingleByteEncoding.prototype = {
    _map: null,

    stringFromCode: function(code){
        if (code < 256){
            return String.fromUnicode(this._map[code]);
        }
        return String.fromUnicode(0xfffd);
    }
};

SingleByteEncoding.Named = {
    MacRomanEncoding:  [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x00c4,0x00c5,0x00c7,0x00c9,0x00d1,0x00d6,0x00dc,0x00e1,0x00e0,0x00e2,0x00e4,0x00e3,0x00e5,0x00e7,0x00e9,0x00e8,0x00ea,0x00eb,0x00ed,0x00ec,0x00ee,0x00ef,0x00f1,0x00f3,0x00f2,0x00f4,0x00f6,0x00f5,0x00fa,0x00f9,0x00fb,0x00fc,0x2020,0x00b0,0x00a2,0x00a3,0x00a7,0x2022,0x00b6,0x00df,0x00ae,0x00a9,0x2122,0x00b4,0x00a8,0xfffd,0x00c6,0x00d8,0xfffd,0x00b1,0xfffd,0xfffd,0x00a5,0x00b5,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00aa,0x00ba,0xfffd,0x00e6,0x00f8,0x00bf,0x00a1,0x00ac,0xfffd,0x0192,0xfffd,0xfffd,0x00ab,0x00bb,0x2026,0xfffd,0x00c0,0x00c3,0x00d5,0x0152,0x0153,0x2013,0x2014,0x201c,0x201d,0x2018,0x2019,0x00f7,0xfffd,0x00ff,0x0178,0x2044,0x00a4,0x2039,0x203a,0xfb01,0xfb02,0x2021,0x00b7,0x201a,0x201e,0x2030,0x00c2,0x00ca,0x00c1,0x00cb,0x00c8,0x00cd,0x00ce,0x00cf,0x00cc,0x00d3,0x00d4,0xfffd,0x00d2,0x00da,0x00db,0x00d9,0x0131,0x02c6,0x02dc,0x00af,0x02d8,0x02d9,0x02da,0x00b8,0x02dd,0x02db,0x02c7],
    MacExpertEncoding: [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0xf721,0xf6f8,0xf7a2,0xf724,0xf6e4,0xf726,0xf7b4,0x207d,0x207e,0x2025,0x2024,0x002c,0x002d,0x002e,0x2044,0xf730,0xf731,0xf732,0xf733,0xf734,0xf735,0xf736,0xf737,0xf738,0xf739,0x003a,0x003b,0xfffd,0xf6de,0xfffd,0xf73f,0xfffd,0xfffd,0xfffd,0xfffd,0xf7f0,0xfffd,0xfffd,0x00bc,0x00bd,0x00be,0x215b,0x215c,0x215d,0x215e,0x2153,0x2154,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfb00,0xfb01,0xfb02,0xfb03,0xfb04,0x208d,0xfffd,0x208e,0xf6f6,0xf6e5,0xf760,0xf761,0xf762,0xf763,0xf764,0xf765,0xf766,0xf767,0xf768,0xf769,0xf76a,0xf76b,0xf76c,0xf76d,0xf76e,0xf76f,0xf770,0xf771,0xf772,0xf773,0xf774,0xf775,0xf776,0xf777,0xf778,0xf779,0xf77a,0x20a1,0xf6dc,0xf6dd,0xf6fe,0xfffd,0xfffd,0xf6e9,0xf6e0,0xfffd,0xfffd,0xfffd,0xfffd,0xf7e1,0xf7e0,0xf7e2,0xf7e4,0xf7e3,0xf7e5,0xf7e7,0xf7e9,0xf7e8,0xf7ea,0xf7eb,0xf7ed,0xf7ec,0xf7ee,0xf7ef,0xf7f1,0xf7f3,0xf7f2,0xf7f4,0xf7f6,0xf7f5,0xf7fa,0xf7f9,0xf7fb,0xf7fc,0xfffd,0x2078,0x2084,0x2083,0x2086,0x2088,0x2087,0xf6fd,0xfffd,0xf6df,0x2082,0xfffd,0xf7a8,0xfffd,0xf6f5,0xf6f0,0x2085,0xfffd,0xf6e1,0xf6e7,0xf7fd,0xfffd,0xf6e3,0xfffd,0xfffd,0xf7fe,0xfffd,0x2089,0x2080,0xf6ff,0xf7e6,0xf7f8,0xf7bf,0x2081,0xf6f9,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xf7b8,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xf6fa,0x2012,0xf6e6,0xfffd,0xfffd,0xfffd,0xfffd,0xf7a1,0xfffd,0xf7ff,0xfffd,0x00b9,0x00b2,0x00b3,0x2074,0x2075,0xfffd,0x2077,0x2079,0x2070,0xfffd,0xf6ec,0xf6f1,0xf6f3,0xfffd,0xfffd,0xf6ed,0xf6f2,0xf6eb,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xf6ee,0xf6fb,0xf6f4,0xf7af,0xf6ea,0x207f,0xf6ef,0xf6e2,0xf6e8,0xf6f7,0xf6fc,0xfffd,0xfffd,0xfffd,0x2076],
    WinAnsiEncoding:   [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x20ac,0xfffd,0x201a,0x0192,0x201e,0x2026,0x2020,0x2021,0x02c6,0x2030,0x0160,0x2039,0x0152,0xfffd,0x017d,0xfffd,0xfffd,0x2018,0x2019,0x201c,0x201d,0x2022,0x2013,0x2014,0x02dc,0x2122,0x0161,0x203a,0x0153,0xfffd,0x017e,0x0178,0xfffd,0x00a1,0x00a2,0x00a3,0x00a4,0x00a5,0x00a6,0x00a7,0x00a8,0x00a9,0x00aa,0x00ab,0x00ac,0xfffd,0x00ae,0x00af,0x00b0,0x00b1,0x00b2,0x00b3,0x00b4,0x00b5,0x00b6,0x00b7,0x00b8,0x00b9,0x00ba,0x00bb,0x00bc,0x00bd,0x00be,0x00bf,0x00c0,0x00c1,0x00c2,0x00c3,0x00c4,0x00c5,0x00c6,0x00c7,0x00c8,0x00c9,0x00ca,0x00cb,0x00cc,0x00cd,0x00ce,0x00cf,0x00d0,0x00d1,0x00d2,0x00d3,0x00d4,0x00d5,0x00d6,0x00d7,0x00d8,0x00d9,0x00da,0x00db,0x00dc,0x00dd,0x00de,0x00df,0x00e0,0x00e1,0x00e2,0x00e3,0x00e4,0x00e5,0x00e6,0x00e7,0x00e8,0x00e9,0x00ea,0x00eb,0x00ec,0x00ed,0x00ee,0x00ef,0x00f0,0x00f1,0x00f2,0x00f3,0x00f4,0x00f5,0x00f6,0x00f7,0x00f8,0x00f9,0x00fa,0x00fb,0x00fc,0x00fd,0x00fe,0x00ff],
};

SingleByteEncoding.Symbolic = {
    // TODO:
    Symbol: [],
    ZapfDingbats: [],
};

SingleByteEncoding.MacOSEncoding =     [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0x00c4,0x00c5,0x00c7,0x00c9,0x00d1,0x00d6,0x00dc,0x00e1,0x00e0,0x00e2,0x00e4,0x00e3,0x00e5,0x00e7,0x00e9,0x00e8,0x00ea,0x00eb,0x00ed,0x00ec,0x00ee,0x00ef,0x00f1,0x00f3,0x00f2,0x00f4,0x00f6,0x00f5,0x00fa,0x00f9,0x00fb,0x00fc,0x2020,0x00b0,0x00a2,0x00a3,0x00a7,0x2022,0x00b6,0x00df,0x00ae,0x00a9,0x2122,0x00b4,0x00a8,0x2260,0x00c6,0x00d8,0x221e,0x00b1,0x2264,0x2265,0x00a5,0x00b5,0x2202,0x2211,0x220f,0x03c0,0x222b,0x00aa,0x00ba,0x03a9,0x00e6,0x00f8,0x00bf,0x00a1,0x00ac,0x221a,0x0192,0x2248,0x2206,0x00ab,0x00bb,0x2026,0x00a0,0x00c0,0x00c3,0x00d5,0x0152,0x0153,0x2013,0x2014,0x201c,0x201d,0x2018,0x2019,0x00f7,0x25ca,0x00ff,0x0178,0x2044,0x20ac,0x2039,0x203a,0xfb01,0xfb02,0x2021,0x00b7,0x201a,0x201e,0x2030,0x00c2,0x00ca,0x00c1,0x00cb,0x00c8,0x00cd,0x00ce,0x00cf,0x00cc,0x00d3,0x00d4,0xf8ff,0x00d2,0x00da,0x00db,0x00d9,0x0131,0x02c6,0x02dc,0x00af,0x02d8,0x02d9,0x02da,0x00b8,0x02dd,0x02db,0x02c7];
SingleByteEncoding.WinUnicodeEncoding =[0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1a,0x1b,0x1c,0x1d,0x1e,0x1f,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0x7f,0x80,0x81,0x82,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8a,0x8b,0x8c,0x8d,0x8e,0x8f,0x90,0x91,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9a,0x9b,0x9c,0x9d,0x9e,0x9f,0xa0,0xa1,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,0xa8,0xa9,0xaa,0xab,0xac,0xad,0xae,0xaf,0xb0,0xb1,0xb2,0xb3,0xb4,0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xbb,0xbc,0xbd,0xbe,0xbf,0xc0,0xc1,0xc2,0xc3,0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xcb,0xcc,0xcd,0xce,0xcf,0xd0,0xd1,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xdb,0xdc,0xdd,0xde,0xdf,0xe0,0xe1,0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,0xeb,0xec,0xed,0xee,0xef,0xf0,0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,0xf9,0xfa,0xfb,0xfc,0xfd,0xfe,0xff,];
SingleByteEncoding.StandardEncoding =  [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00a1,0x00a2,0x00a3,0x2044,0x00a5,0x0192,0x00a7,0x00a4,0x0027,0x201c,0x00ab,0x2039,0x203a,0xfb01,0xfb02,0xfffd,0x2013,0x2020,0x2021,0x00b7,0xfffd,0x00b6,0x2022,0x201a,0x201e,0x201d,0x00bb,0x2026,0x2030,0xfffd,0x00bf,0xfffd,0x0060,0x00b4,0x02c6,0x02dc,0x00af,0x02d8,0x02d9,0x00a8,0xfffd,0x02da,0x00b8,0xfffd,0x02dd,0x02db,0x02c7,0x2014,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00c6,0xfffd,0x00aa,0xfffd,0xfffd,0xfffd,0xfffd,0x0141,0x00d8,0x0152,0x00ba,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00e6,0xfffd,0xfffd,0xfffd,0x0131,0xfffd,0xfffd,0x0142,0x00f8,0x0153,0x00df,0xfffd,0xfffd,0xfffd,0xfffd];
SingleByteEncoding.PDFDocEncoding =    [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x17,0x17,0x2d8,0x2c7,0x2c6,0x2d9,0x2dd,0x2db,0x2da,0x2dc,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x2022,0x2020,0x2021,0x2026,0x2014,0x2013,0x0192,0x2044,0x2039,0x203a,0x2212,0x2030,0x201e,0x201c,0x201d,0x2018,0x2019,0x201a,0x2122,0xfb01,0xfb02,0x0141,0x0152,0x0160,0x0178,0x017d,0x0131,0x0142,0x0153,0x0161,0x017e,0xfffd,0x20ac,0x00a1,0x00a2,0x00a3,0x00a4,0x00a5,0x00a6,0x00a7,0x00a8,0x00a9,0x00aa,0x00ab,0x00ac,0xfffd,0x00ae,0x00af,0x00b0,0x00b1,0x00b2,0x00b3,0x00b4,0x00b5,0x00b6,0x00b7,0x00b8,0x00b9,0x00ba,0x00bb,0x00bc,0x00bd,0x00be,0x00bf,0x00c0,0x00c1,0x00c2,0x00c3,0x00c4,0x00c5,0x00c6,0x00c7,0x00c8,0x00c9,0x00ca,0x00cb,0x00cc,0x00cd,0x00ce,0x00cf,0x00d0,0x00d1,0x00d2,0x00d3,0x00d4,0x00d5,0x00d6,0x00d7,0x00d8,0x00d9,0x00da,0x00db,0x00dc,0x00dd,0x00de,0x00df,0x00e0,0x00e1,0x00e2,0x00e3,0x00e4,0x00e5,0x00e6,0x00e7,0x00e8,0x00e9,0x00ea,0x00eb,0x00ec,0x00ed,0x00ee,0x00ef,0x00f0,0x00f1,0x00f2,0x00f3,0x00f4,0x00f5,0x00f6,0x00f7,0x00f8,0x00f9,0x00fa,0x00fb,0x00fc,0x00fd,0x00fe,0x00ff];

var ToUnicodeCMap = function(cmapData){
    if (cmapData === null){
        return null;
    }
    if (this === undefined){
        return new ToUnicodeCMap(cmapData);
    }
    this.validRanges = [];
    this._counts = [];
    this.codeToString = {};
    this.codeToStringRanges = [];
    var iterator = PDFOperationIterator.initWithData(cmapData);
    var operation = iterator.next();
    var fn;
    while (operation !== null){
        fn = this[operation.operator];
        if (fn){
            fn.apply(this, operation.operands);
        }
        operation = iterator.next();
    }
};

ToUnicodeCMap.prototype = {

    validRanges: null,
    codeToString: null,
    codeToStringRanges: null,
    _counts: null,

    stringFromCode: function(code){
        var str = this.codeToString[code];
        if (str){
            return str;
        }
        var range;
        for (var i = 0, l = this.codeToStringRanges.length; i < l; ++i){
            range = this.codeToStringRanges[i];
            if (code >= range.low && code <= range.high){
                if (range.prefix){
                    return range.prefix + String.fromUnicode(range.first + code - range.low);
                }
                return String.fromUnicode(range.first + code - range.low);
            }
        }
        return String.fromUnicode(code);
    },

    begincodespacerange: function(count){
        this._counts.push(count);
    },

    endcodespacerange: function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var low;
        var high;
        var a = 0;
        var count = this._counts.pop();
        for (var i = 0; i < count; ++i){
            low = integerFromData(args[a++]);
            high = integerFromData(args[a++]);
            this.validRanges[i] = {low: low, high: high};
        }
    },

    beginbfrange: function(count){
        this._counts.push(count);
    },

    endbfrange: function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var low;
        var high;
        var unicode;
        var a = 0;
        var count = this._counts.pop();
        for (var i = 0; i < count; ++i){
            low = integerFromData(args[a++]);
            high = integerFromData(args[a++]);
            unicode = args[a++];
            if (unicode instanceof JSData){
                if (unicode.length <= 2){
                    this.codeToStringRanges.push({
                        low: low,
                        high: high,
                        first: integerFromData(unicode)
                    });
                }else{
                    this.codeToStringRanges.push({
                        low: low,
                        high: high,
                        prefix: unicode.truncatedToLength(unicode.length - 1).stringByDecodingUTF16BE(),
                        first: unicode[unicode.length - 1]
                    });
                }
            }else{
                for (var code = low, j = 0; code <= high; ++code, ++j){
                    if (unicode[i] instanceof PDFName){
                        this.codeToString[code] = FNTAdobeNamesToUnicode[unicode[i]].stringByDecodingUTF16BE();
                    }else{
                        this.codeToString[code] = unicode[i].stringByDecodingUTF16BE();
                    }
                }
            }
        }
    },

    beginbfchar: function(count){
        this._counts.push(count);
    },

    endbfchar: function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var code;
        var unicode;
        var a = 0;
        var count = this._counts.pop();
        for (var i = 0; i < count; ++i){
            code = integerFromData(args[a++]);
            unicode = args[a++];
            if (unicode instanceof PDFName){
                this.codeToString[code] = FNTAdobeNamesToUnicode[unicode] || 0xfffd;
            }else{
                this.codeToString[code] = unicode.stringByDecodingUTF16BE();
            }
        }
    }

};

var integerFromData = function(data){
    var dataView = data.dataView();
    switch (dataView.byteLength){
        case 0:
            return 0;
        case 1:
            return dataView.getUint8(0);
        case 2:
            return dataView.getUint16(0);
        case 3:
            return (dataView.getUint8(0) << 16) | dataView.getUint16(1);
        case 4:
            return dataView.getUint32(0);
        default:
            throw new Error("Cannot parse integer from data %d bytes long".sprintf(dataView.length));
    }
};

var helveticaWidths = {8706: 476, 8722: 584, 8710: 612, 257: 556, 8364: 556, 343: 333, 273: 556, 258: 667, 8721: 600, 205: 278, 8211: 556, 8212: 1000, 8216: 222, 8217: 222, 8218: 222, 8220: 333, 8221: 333, 8222: 333, 32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191, 40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278, 48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556, 64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611, 91: 278, 92: 278, 93: 278, 94: 469, 95: 556, 96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556, 104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556, 111: 556, 112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722, 120: 500, 121: 500, 122: 500, 123: 334, 124: 260, 125: 334, 126: 584, 193: 667, 209: 722, 279: 556, 536: 667, 195: 667, 366: 722, 537: 500, 8730: 453, 161: 333, 162: 556, 163: 556, 164: 556, 165: 556, 166: 260, 167: 556, 168: 333, 169: 737, 170: 370, 171: 556, 172: 584, 174: 737, 175: 333, 176: 400, 177: 584, 178: 333, 179: 333, 180: 333, 181: 556, 182: 537, 183: 278, 184: 333, 185: 333, 186: 365, 187: 556, 188: 834, 189: 834, 190: 834, 191: 611, 192: 667, 8224: 556, 194: 667, 63171: 250, 196: 667, 197: 667, 710: 333, 8225: 556, 200: 667, 201: 667, 202: 667, 203: 667, 204: 278, 8226: 350, 206: 278, 207: 278, 208: 722, 8804: 549, 210: 778, 211: 778, 212: 778, 213: 778, 214: 778, 215: 584, 728: 333, 729: 333, 730: 333, 731: 333, 732: 333, 733: 333, 222: 667, 223: 611, 224: 556, 225: 556, 226: 556, 227: 556, 228: 556, 8230: 1000, 230: 889, 231: 500, 232: 556, 233: 556, 234: 556, 235: 556, 236: 278, 237: 278, 238: 278, 8805: 549, 240: 556, 241: 556, 242: 556, 243: 556, 244: 556, 245: 556, 246: 556, 247: 584, 248: 611, 249: 556, 250: 556, 251: 556, 252: 556, 253: 500, 254: 556, 255: 500, 256: 667, 64257: 500, 64258: 500, 259: 556, 260: 667, 261: 556, 262: 722, 263: 500, 8482: 1000, 268: 722, 269: 500, 270: 722, 271: 643, 272: 722, 216: 778, 274: 667, 275: 556, 350: 667, 278: 667, 217: 722, 280: 667, 281: 556, 282: 667, 283: 556, 218: 722, 286: 778, 287: 556, 8240: 1000, 290: 778, 219: 722, 220: 722, 298: 278, 299: 278, 302: 278, 221: 667, 304: 278, 305: 278, 351: 500, 310: 667, 311: 500, 313: 556, 314: 222, 315: 556, 316: 222, 317: 556, 318: 299, 198: 1000, 321: 556, 322: 222, 323: 722, 324: 556, 325: 722, 326: 556, 327: 722, 328: 556, 332: 778, 333: 556, 336: 778, 337: 556, 338: 1000, 339: 944, 340: 722, 341: 333, 342: 722, 8249: 333, 344: 722, 345: 333, 346: 667, 347: 500, 8250: 333, 199: 722, 229: 556, 352: 667, 353: 500, 354: 611, 355: 278, 356: 611, 357: 317, 362: 722, 363: 556, 711: 333, 367: 556, 368: 722, 369: 556, 370: 722, 371: 556, 376: 667, 377: 611, 378: 500, 379: 611, 380: 500, 381: 611, 382: 500, 291: 556, 303: 222, 402: 556, 8260: 167, 239: 278, 8800: 549, 9674: 471};
var helveticaBoldWidths = {8706: 494, 8722: 584, 8710: 612, 257: 556, 8364: 556, 343: 389, 273: 611, 258: 722, 8721: 600, 205: 278, 8211: 556, 8212: 1000, 8216: 278, 8217: 278, 8218: 278, 8220: 500, 8221: 500, 8222: 500, 32: 278, 33: 333, 34: 474, 35: 556, 36: 556, 37: 889, 38: 722, 39: 238, 40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278, 48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556, 58: 333, 59: 333, 60: 584, 61: 584, 62: 584, 63: 611, 64: 975, 65: 722, 66: 722, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 722, 73: 278, 74: 556, 75: 722, 76: 611, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611, 91: 333, 92: 278, 93: 333, 94: 584, 95: 556, 96: 333, 97: 556, 98: 611, 99: 556, 100: 611, 101: 556, 102: 333, 103: 611, 104: 611, 105: 278, 106: 278, 107: 556, 108: 278, 109: 889, 110: 611, 111: 611, 112: 611, 113: 611, 114: 389, 115: 556, 116: 333, 117: 611, 118: 556, 119: 778, 120: 556, 121: 556, 122: 500, 123: 389, 124: 280, 125: 389, 126: 584, 193: 722, 209: 722, 279: 556, 536: 667, 195: 722, 366: 722, 537: 556, 8730: 549, 161: 333, 162: 556, 163: 556, 164: 556, 165: 556, 166: 280, 167: 556, 168: 333, 169: 737, 170: 370, 171: 556, 172: 584, 174: 737, 175: 333, 176: 400, 177: 584, 178: 333, 179: 333, 180: 333, 181: 611, 182: 556, 183: 278, 184: 333, 185: 333, 186: 365, 187: 556, 188: 834, 189: 834, 190: 834, 191: 611, 192: 722, 8224: 556, 194: 722, 63171: 250, 196: 722, 197: 722, 710: 333, 8225: 556, 200: 667, 201: 667, 202: 667, 203: 667, 204: 278, 8226: 350, 206: 278, 207: 278, 208: 722, 8804: 549, 210: 778, 211: 778, 212: 778, 213: 778, 214: 778, 215: 584, 728: 333, 729: 333, 730: 333, 731: 333, 732: 333, 733: 333, 222: 667, 223: 611, 224: 556, 225: 556, 226: 556, 227: 556, 228: 556, 8230: 1000, 230: 889, 231: 556, 232: 556, 233: 556, 234: 556, 235: 556, 236: 278, 237: 278, 238: 278, 8805: 549, 240: 611, 241: 611, 242: 611, 243: 611, 244: 611, 245: 611, 246: 611, 247: 584, 248: 611, 249: 611, 250: 611, 251: 611, 252: 611, 253: 556, 254: 611, 255: 556, 256: 722, 64257: 611, 64258: 611, 259: 556, 260: 722, 261: 556, 262: 722, 263: 556, 8482: 1000, 268: 722, 269: 556, 270: 722, 271: 743, 272: 722, 216: 778, 274: 667, 275: 556, 350: 667, 278: 667, 217: 722, 280: 667, 281: 556, 282: 667, 283: 556, 218: 722, 286: 778, 287: 611, 8240: 1000, 290: 778, 219: 722, 220: 722, 298: 278, 299: 278, 302: 278, 221: 667, 304: 278, 305: 278, 351: 556, 310: 722, 311: 556, 313: 611, 314: 278, 315: 611, 316: 278, 317: 611, 318: 400, 198: 1000, 321: 611, 322: 278, 323: 722, 324: 611, 325: 722, 326: 611, 327: 722, 328: 611, 332: 778, 333: 611, 336: 778, 337: 611, 338: 1000, 339: 944, 340: 722, 341: 389, 342: 722, 8249: 333, 344: 722, 345: 389, 346: 667, 347: 556, 8250: 333, 199: 722, 229: 556, 352: 667, 353: 556, 354: 611, 355: 333, 356: 611, 357: 389, 362: 722, 363: 611, 711: 333, 367: 611, 368: 722, 369: 611, 370: 722, 371: 611, 376: 667, 377: 611, 378: 500, 379: 611, 380: 500, 381: 611, 382: 500, 291: 611, 303: 278, 402: 556, 8260: 167, 239: 278, 8800: 549, 9674: 494};

var StandardFonts = {
    "Times-Roman": {
        name: "Times-Roman",
        family: "Times",
        weight: JSFont.Weight.regular,
        style: JSFont.Style.normal,
        ascender: 683,
        descender: -217,
        cssFamily: 'Times, "Times New Roman", serif',
        characterWidths: {8706: 476, 8722: 564, 8710: 612, 257: 444, 8364: 500, 343: 333, 273: 500, 258: 722, 8721: 600, 205: 333, 8211: 500, 8212: 1000, 8216: 333, 8217: 333, 8218: 333, 8220: 444, 8221: 444, 8222: 444, 32: 250, 33: 333, 34: 408, 35: 500, 36: 500, 37: 833, 38: 778, 39: 180, 40: 333, 41: 333, 42: 500, 43: 564, 44: 250, 45: 333, 46: 250, 47: 278, 48: 500, 49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500, 58: 278, 59: 278, 60: 564, 61: 564, 62: 564, 63: 444, 64: 921, 65: 722, 66: 667, 67: 667, 68: 722, 69: 611, 70: 556, 71: 722, 72: 722, 73: 333, 74: 389, 75: 722, 76: 611, 77: 889, 78: 722, 79: 722, 80: 556, 81: 722, 82: 667, 83: 556, 84: 611, 85: 722, 86: 722, 87: 944, 88: 722, 89: 722, 90: 611, 91: 333, 92: 278, 93: 333, 94: 469, 95: 500, 96: 333, 97: 444, 98: 500, 99: 444, 100: 500, 101: 444, 102: 333, 103: 500, 104: 500, 105: 278, 106: 278, 107: 500, 108: 278, 109: 778, 110: 500, 111: 500, 112: 500, 113: 500, 114: 333, 115: 389, 116: 278, 117: 500, 118: 500, 119: 722, 120: 500, 121: 500, 122: 444, 123: 480, 124: 200, 125: 480, 126: 541, 193: 722, 209: 722, 279: 444, 536: 556, 195: 722, 366: 722, 537: 389, 8730: 453, 161: 333, 162: 500, 163: 500, 164: 500, 165: 500, 166: 200, 167: 500, 168: 333, 169: 760, 170: 276, 171: 500, 172: 564, 174: 760, 175: 333, 176: 400, 177: 564, 178: 300, 179: 300, 180: 333, 181: 500, 182: 453, 183: 250, 184: 333, 185: 300, 186: 310, 187: 500, 188: 750, 189: 750, 190: 750, 191: 444, 192: 722, 8224: 500, 194: 722, 63171: 250, 196: 722, 197: 722, 710: 333, 8225: 500, 200: 611, 201: 611, 202: 611, 203: 611, 204: 333, 8226: 350, 206: 333, 207: 333, 208: 722, 8804: 549, 210: 722, 211: 722, 212: 722, 213: 722, 214: 722, 215: 564, 728: 333, 729: 333, 730: 333, 731: 333, 732: 333, 733: 333, 222: 556, 223: 500, 224: 444, 225: 444, 226: 444, 227: 444, 228: 444, 8230: 1000, 230: 667, 231: 444, 232: 444, 233: 444, 234: 444, 235: 444, 236: 278, 237: 278, 238: 278, 8805: 549, 240: 500, 241: 500, 242: 500, 243: 500, 244: 500, 245: 500, 246: 500, 247: 564, 248: 500, 249: 500, 250: 500, 251: 500, 252: 500, 253: 500, 254: 500, 255: 500, 256: 722, 64257: 556, 64258: 556, 259: 444, 260: 722, 261: 444, 262: 667, 263: 444, 8482: 980, 268: 667, 269: 444, 270: 722, 271: 588, 272: 722, 216: 722, 274: 611, 275: 444, 350: 556, 278: 611, 217: 722, 280: 611, 281: 444, 282: 611, 283: 444, 218: 722, 286: 722, 287: 500, 8240: 1000, 290: 722, 219: 722, 220: 722, 298: 333, 299: 278, 302: 333, 221: 722, 304: 333, 305: 278, 351: 389, 310: 722, 311: 500, 313: 611, 314: 278, 315: 611, 316: 278, 317: 611, 318: 344, 198: 889, 321: 611, 322: 278, 323: 722, 324: 500, 325: 722, 326: 500, 327: 722, 328: 500, 332: 722, 333: 500, 336: 722, 337: 500, 338: 889, 339: 722, 340: 667, 341: 333, 342: 667, 8249: 333, 344: 667, 345: 333, 346: 556, 347: 389, 8250: 333, 199: 667, 229: 444, 352: 556, 353: 389, 354: 611, 355: 278, 356: 611, 357: 326, 362: 722, 363: 500, 711: 333, 367: 500, 368: 722, 369: 500, 370: 722, 371: 500, 376: 722, 377: 611, 378: 444, 379: 611, 380: 444, 381: 611, 382: 444, 291: 500, 303: 278, 402: 500, 8260: 167, 239: 278, 8800: 549, 9674: 471}
    },
    "Times-Bold": {
        name: "Times-Bold",
        family: "Times",
        weight: JSFont.Weight.bold,
        style: JSFont.Style.normal,
        ascender: 683,
        descender: -217,
        cssFamily: 'Times, "Times New Roman", serif',
        characterWidths: {8706: 494, 8722: 570, 8710: 612, 257: 500, 8364: 500, 343: 444, 273: 556, 258: 722, 8721: 600, 205: 389, 8211: 500, 8212: 1000, 8216: 333, 8217: 333, 8218: 333, 8220: 500, 8221: 500, 8222: 500, 32: 250, 33: 333, 34: 555, 35: 500, 36: 500, 37: 1000, 38: 833, 39: 278, 40: 333, 41: 333, 42: 500, 43: 570, 44: 250, 45: 333, 46: 250, 47: 278, 48: 500, 49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500, 58: 333, 59: 333, 60: 570, 61: 570, 62: 570, 63: 500, 64: 930, 65: 722, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 778, 73: 389, 74: 500, 75: 778, 76: 667, 77: 944, 78: 722, 79: 778, 80: 611, 81: 778, 82: 722, 83: 556, 84: 667, 85: 722, 86: 722, 87: 1000, 88: 722, 89: 722, 90: 667, 91: 333, 92: 278, 93: 333, 94: 581, 95: 500, 96: 333, 97: 500, 98: 556, 99: 444, 100: 556, 101: 444, 102: 333, 103: 500, 104: 556, 105: 278, 106: 333, 107: 556, 108: 278, 109: 833, 110: 556, 111: 500, 112: 556, 113: 556, 114: 444, 115: 389, 116: 333, 117: 556, 118: 500, 119: 722, 120: 500, 121: 500, 122: 444, 123: 394, 124: 220, 125: 394, 126: 520, 193: 722, 209: 722, 279: 444, 536: 556, 195: 722, 366: 722, 537: 389, 8730: 549, 161: 333, 162: 500, 163: 500, 164: 500, 165: 500, 166: 220, 167: 500, 168: 333, 169: 747, 170: 300, 171: 500, 172: 570, 174: 747, 175: 333, 176: 400, 177: 570, 178: 300, 179: 300, 180: 333, 181: 556, 182: 540, 183: 250, 184: 333, 185: 300, 186: 330, 187: 500, 188: 750, 189: 750, 190: 750, 191: 500, 192: 722, 8224: 500, 194: 722, 63171: 250, 196: 722, 197: 722, 710: 333, 8225: 500, 200: 667, 201: 667, 202: 667, 203: 667, 204: 389, 8226: 350, 206: 389, 207: 389, 208: 722, 8804: 549, 210: 778, 211: 778, 212: 778, 213: 778, 214: 778, 215: 570, 728: 333, 729: 333, 730: 333, 731: 333, 732: 333, 733: 333, 222: 611, 223: 556, 224: 500, 225: 500, 226: 500, 227: 500, 228: 500, 8230: 1000, 230: 722, 231: 444, 232: 444, 233: 444, 234: 444, 235: 444, 236: 278, 237: 278, 238: 278, 8805: 549, 240: 500, 241: 556, 242: 500, 243: 500, 244: 500, 245: 500, 246: 500, 247: 570, 248: 500, 249: 556, 250: 556, 251: 556, 252: 556, 253: 500, 254: 556, 255: 500, 256: 722, 64257: 556, 64258: 556, 259: 500, 260: 722, 261: 500, 262: 722, 263: 444, 8482: 1000, 268: 722, 269: 444, 270: 722, 271: 672, 272: 722, 216: 778, 274: 667, 275: 444, 350: 556, 278: 667, 217: 722, 280: 667, 281: 444, 282: 667, 283: 444, 218: 722, 286: 778, 287: 500, 8240: 1000, 290: 778, 219: 722, 220: 722, 298: 389, 299: 278, 302: 389, 221: 722, 304: 389, 305: 278, 351: 389, 310: 778, 311: 556, 313: 667, 314: 278, 315: 667, 316: 278, 317: 667, 318: 394, 198: 1000, 321: 667, 322: 278, 323: 722, 324: 556, 325: 722, 326: 556, 327: 722, 328: 556, 332: 778, 333: 500, 336: 778, 337: 500, 338: 1000, 339: 722, 340: 722, 341: 444, 342: 722, 8249: 333, 344: 722, 345: 444, 346: 556, 347: 389, 8250: 333, 199: 722, 229: 500, 352: 556, 353: 389, 354: 667, 355: 333, 356: 667, 357: 416, 362: 722, 363: 556, 711: 333, 367: 556, 368: 722, 369: 556, 370: 722, 371: 556, 376: 722, 377: 667, 378: 444, 379: 667, 380: 444, 381: 667, 382: 444, 291: 500, 303: 278, 402: 500, 8260: 167, 239: 278, 8800: 549, 9674: 494}
    },
    "Times-Italic": {
        name: "Times-Italic",
        family: "Times",
        weight: JSFont.Weight.regular,
        style: JSFont.Style.italic,
        ascender: 683,
        descender: -217,
        cssFamily: 'Times, "Times New Roman", serif',
        characterWidths: {8706: 476, 8722: 675, 8710: 612, 257: 500, 8364: 500, 343: 389, 273: 500, 258: 611, 8721: 600, 205: 333, 8211: 500, 8212: 889, 8216: 333, 8217: 333, 8218: 333, 8220: 556, 8221: 556, 8222: 556, 32: 250, 33: 333, 34: 420, 35: 500, 36: 500, 37: 833, 38: 778, 39: 214, 40: 333, 41: 333, 42: 500, 43: 675, 44: 250, 45: 333, 46: 250, 47: 278, 48: 500, 49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500, 58: 333, 59: 333, 60: 675, 61: 675, 62: 675, 63: 500, 64: 920, 65: 611, 66: 611, 67: 667, 68: 722, 69: 611, 70: 611, 71: 722, 72: 722, 73: 333, 74: 444, 75: 667, 76: 556, 77: 833, 78: 667, 79: 722, 80: 611, 81: 722, 82: 611, 83: 500, 84: 556, 85: 722, 86: 611, 87: 833, 88: 611, 89: 556, 90: 556, 91: 389, 92: 278, 93: 389, 94: 422, 95: 500, 96: 333, 97: 500, 98: 500, 99: 444, 100: 500, 101: 444, 102: 278, 103: 500, 104: 500, 105: 278, 106: 278, 107: 444, 108: 278, 109: 722, 110: 500, 111: 500, 112: 500, 113: 500, 114: 389, 115: 389, 116: 278, 117: 500, 118: 444, 119: 667, 120: 444, 121: 444, 122: 389, 123: 400, 124: 275, 125: 400, 126: 541, 193: 611, 209: 667, 279: 444, 536: 500, 195: 611, 366: 722, 537: 389, 8730: 453, 161: 389, 162: 500, 163: 500, 164: 500, 165: 500, 166: 275, 167: 500, 168: 333, 169: 760, 170: 276, 171: 500, 172: 675, 174: 760, 175: 333, 176: 400, 177: 675, 178: 300, 179: 300, 180: 333, 181: 500, 182: 523, 183: 250, 184: 333, 185: 300, 186: 310, 187: 500, 188: 750, 189: 750, 190: 750, 191: 500, 192: 611, 8224: 500, 194: 611, 63171: 250, 196: 611, 197: 611, 710: 333, 8225: 500, 200: 611, 201: 611, 202: 611, 203: 611, 204: 333, 8226: 350, 206: 333, 207: 333, 208: 722, 8804: 549, 210: 722, 211: 722, 212: 722, 213: 722, 214: 722, 215: 675, 728: 333, 729: 333, 730: 333, 731: 333, 732: 333, 733: 333, 222: 611, 223: 500, 224: 500, 225: 500, 226: 500, 227: 500, 228: 500, 8230: 889, 230: 667, 231: 444, 232: 444, 233: 444, 234: 444, 235: 444, 236: 278, 237: 278, 238: 278, 8805: 549, 240: 500, 241: 500, 242: 500, 243: 500, 244: 500, 245: 500, 246: 500, 247: 675, 248: 500, 249: 500, 250: 500, 251: 500, 252: 500, 253: 444, 254: 500, 255: 444, 256: 611, 64257: 500, 64258: 500, 259: 500, 260: 611, 261: 500, 262: 667, 263: 444, 8482: 980, 268: 667, 269: 444, 270: 722, 271: 544, 272: 722, 216: 722, 274: 611, 275: 444, 350: 500, 278: 611, 217: 722, 280: 611, 281: 444, 282: 611, 283: 444, 218: 722, 286: 722, 287: 500, 8240: 1000, 290: 722, 219: 722, 220: 722, 298: 333, 299: 278, 302: 333, 221: 556, 304: 333, 305: 278, 351: 389, 310: 667, 311: 444, 313: 556, 314: 278, 315: 556, 316: 278, 317: 611, 318: 300, 198: 889, 321: 556, 322: 278, 323: 667, 324: 500, 325: 667, 326: 500, 327: 667, 328: 500, 332: 722, 333: 500, 336: 722, 337: 500, 338: 944, 339: 667, 340: 611, 341: 389, 342: 611, 8249: 333, 344: 611, 345: 389, 346: 500, 347: 389, 8250: 333, 199: 667, 229: 500, 352: 500, 353: 389, 354: 556, 355: 278, 356: 556, 357: 300, 362: 722, 363: 500, 711: 333, 367: 500, 368: 722, 369: 500, 370: 722, 371: 500, 376: 556, 377: 556, 378: 389, 379: 556, 380: 389, 381: 556, 382: 389, 291: 500, 303: 278, 402: 500, 8260: 167, 239: 278, 8800: 549, 9674: 471}
    },
    "Times-BoldItalic": {
        name: "Times-BoldItalic",
        family: "Times",
        weight: JSFont.Weight.bold,
        style: JSFont.Style.italic,
        ascender: 683,
        descender: -217,
        cssFamily: 'Times, "Times New Roman", serif',
        characterWidths: {8706: 494, 8722: 606, 8710: 612, 257: 500, 8364: 500, 343: 389, 273: 500, 258: 667, 8721: 600, 205: 389, 8211: 500, 8212: 1000, 8216: 333, 8217: 333, 8218: 333, 8220: 500, 8221: 500, 8222: 500, 32: 250, 33: 389, 34: 555, 35: 500, 36: 500, 37: 833, 38: 778, 39: 278, 40: 333, 41: 333, 42: 500, 43: 570, 44: 250, 45: 333, 46: 250, 47: 278, 48: 500, 49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500, 58: 333, 59: 333, 60: 570, 61: 570, 62: 570, 63: 500, 64: 832, 65: 667, 66: 667, 67: 667, 68: 722, 69: 667, 70: 667, 71: 722, 72: 778, 73: 389, 74: 500, 75: 667, 76: 611, 77: 889, 78: 722, 79: 722, 80: 611, 81: 722, 82: 667, 83: 556, 84: 611, 85: 722, 86: 667, 87: 889, 88: 667, 89: 611, 90: 611, 91: 333, 92: 278, 93: 333, 94: 570, 95: 500, 96: 333, 97: 500, 98: 500, 99: 444, 100: 500, 101: 444, 102: 333, 103: 500, 104: 556, 105: 278, 106: 278, 107: 500, 108: 278, 109: 778, 110: 556, 111: 500, 112: 500, 113: 500, 114: 389, 115: 389, 116: 278, 117: 556, 118: 444, 119: 667, 120: 500, 121: 444, 122: 389, 123: 348, 124: 220, 125: 348, 126: 570, 193: 667, 209: 722, 279: 444, 536: 556, 195: 667, 366: 722, 537: 389, 8730: 549, 161: 389, 162: 500, 163: 500, 164: 500, 165: 500, 166: 220, 167: 500, 168: 333, 169: 747, 170: 266, 171: 500, 172: 606, 174: 747, 175: 333, 176: 400, 177: 570, 178: 300, 179: 300, 180: 333, 181: 576, 182: 500, 183: 250, 184: 333, 185: 300, 186: 300, 187: 500, 188: 750, 189: 750, 190: 750, 191: 500, 192: 667, 8224: 500, 194: 667, 63171: 250, 196: 667, 197: 667, 710: 333, 8225: 500, 200: 667, 201: 667, 202: 667, 203: 667, 204: 389, 8226: 350, 206: 389, 207: 389, 208: 722, 8804: 549, 210: 722, 211: 722, 212: 722, 213: 722, 214: 722, 215: 570, 728: 333, 729: 333, 730: 333, 731: 333, 732: 333, 733: 333, 222: 611, 223: 500, 224: 500, 225: 500, 226: 500, 227: 500, 228: 500, 8230: 1000, 230: 722, 231: 444, 232: 444, 233: 444, 234: 444, 235: 444, 236: 278, 237: 278, 238: 278, 8805: 549, 240: 500, 241: 556, 242: 500, 243: 500, 244: 500, 245: 500, 246: 500, 247: 570, 248: 500, 249: 556, 250: 556, 251: 556, 252: 556, 253: 444, 254: 500, 255: 444, 256: 667, 64257: 556, 64258: 556, 259: 500, 260: 667, 261: 500, 262: 667, 263: 444, 8482: 1000, 268: 667, 269: 444, 270: 722, 271: 608, 272: 722, 216: 722, 274: 667, 275: 444, 350: 556, 278: 667, 217: 722, 280: 667, 281: 444, 282: 667, 283: 444, 218: 722, 286: 722, 287: 500, 8240: 1000, 290: 722, 219: 722, 220: 722, 298: 389, 299: 278, 302: 389, 221: 611, 304: 389, 305: 278, 351: 389, 310: 667, 311: 500, 313: 611, 314: 278, 315: 611, 316: 278, 317: 611, 318: 382, 198: 944, 321: 611, 322: 278, 323: 722, 324: 556, 325: 722, 326: 556, 327: 722, 328: 556, 332: 722, 333: 500, 336: 722, 337: 500, 338: 944, 339: 722, 340: 667, 341: 389, 342: 667, 8249: 333, 344: 667, 345: 389, 346: 556, 347: 389, 8250: 333, 199: 667, 229: 500, 352: 556, 353: 389, 354: 611, 355: 278, 356: 611, 357: 366, 362: 722, 363: 556, 711: 333, 367: 556, 368: 722, 369: 556, 370: 722, 371: 556, 376: 611, 377: 611, 378: 389, 379: 611, 380: 389, 381: 611, 382: 389, 291: 500, 303: 278, 402: 500, 8260: 167, 239: 278, 8800: 549, 9674: 494}
    },
    // Notice Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.
    "Helvetica": {
        name: "Helvetica",
        family: "Helvetica",
        weight: JSFont.Weight.regular,
        style: JSFont.Style.normal,
        ascender: 718,
        descender: -207,
        cssFamily: 'Helvetica, sans-serif',
        characterWidths: helveticaWidths
    },
    // Notice Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.
    "Helvetica-Bold": {
        name: "Helvetica-Bold",
        family: "Helvetica",
        weight: JSFont.Weight.bold,
        style: JSFont.Style.normal,
        ascender: 718,
        descender: -207,
        cssFamily: 'Helvetica, sans-serif',
        characterWidths: helveticaBoldWidths
    },
    "Helvetica-Oblique": {
        name: "Helvetica-Oblique",
        family: "Helvetica",
        weight: JSFont.Weight.regular,
        style: JSFont.Style.italic,
        ascender: 718,
        descender: -207,
        cssFamily: 'Helvetica, sans-serif',
        characterWidths: helveticaWidths
    },
    "Helvetica-BoldOblique": {
        name: "Helvetica-BoldOblique",
        family: "Helvetica",
        weight: JSFont.Weight.bold,
        style: JSFont.Style.italic,
        ascender: 718,
        descender: -207,
        cssFamily: 'Helvetica, sans-serif',
        characterWidths: helveticaBoldWidths
    },
    "Courier": {
        name: "Courier",
        family: "Courier",
        weight: JSFont.Weight.bold,
        style: JSFont.Style.normal,
        ascender: 629,
        descender: -157,
        fixedWidth: 600,
        cssFamily: 'Courier, "Courier New", monospace'
    },
    "Courier-Bold": {
        name: "Courier-Bold",
        family: "Courier",
        weight: JSFont.Weight.bold,
        style: JSFont.Style.normal,
        ascender: 629,
        descender: -157,
        fixedWidth: 600,
        cssFamily: 'Courier, "Courier New", monospace'
    },
    "Courier-Oblique": {
        name: "Courier-Oblique",
        family: "Courier",
        weight: JSFont.Weight.regular,
        style: JSFont.Style.italic,
        ascender: 629,
        descender: -157,
        fixedWidth: 600,
        cssFamily: 'Courier, "Courier New", monospace'
    },
    "Courier-BoldOblique": {
        name: "Courier-BoldOblique",
        family: "Courier",
        weight: JSFont.Weight.bold,
        style: JSFont.Style.italic,
        ascender: 629,
        descender: -157,
        fixedWidth: 600,
        cssFamily: 'Courier, "Courier New", monospace'
    },
    "Symbol": {
        name: "Symbol",
        family: "Symbol",
        weight: JSFont.Weight.regular,
        style: JSFont.Style.normal,
        ascender: 1090,
        descender: -180,
        cssFamily: 'Symbol',
        characterWidths: {8704: 713, 8706: 494, 8707: 549, 8709: 823, 8710: 612, 8711: 713, 8712: 713, 8713: 713, 8715: 439, 8719: 823, 8721: 713, 8722: 549, 8727: 500, 8730: 549, 8733: 713, 8734: 713, 32: 250, 33: 333, 8226: 460, 35: 500, 37: 833, 38: 778, 8743: 603, 40: 333, 41: 333, 8746: 768, 43: 549, 44: 250, 46: 250, 47: 278, 48: 500, 49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500, 58: 278, 59: 278, 60: 549, 61: 549, 62: 549, 63: 444, 8800: 549, 8260: 167, 8773: 549, 8776: 549, 8629: 658, 91: 333, 93: 333, 95: 500, 9824: 753, 8801: 549, 9827: 753, 8804: 549, 9829: 753, 9830: 753, 63729: 494, 123: 480, 124: 200, 125: 480, 8834: 713, 8835: 713, 8836: 713, 8838: 713, 8839: 713, 8853: 768, 8855: 768, 8869: 658, 8364: 750, 176: 400, 177: 549, 8805: 549, 181: 576, 8736: 768, 8901: 250, 215: 549, 63193: 790, 63194: 790, 63195: 890, 63717: 500, 63718: 603, 63719: 1000, 63720: 790, 63721: 790, 63722: 786, 63723: 384, 63724: 384, 8658: 987, 63726: 384, 8594: 987, 63728: 384, 8744: 603, 63730: 494, 63731: 494, 63732: 494, 63733: 686, 63734: 384, 247: 549, 63736: 384, 63737: 384, 63738: 384, 63739: 384, 63740: 494, 63741: 494, 63742: 494, 63743: 790, 172: 713, 8747: 274, 8465: 686, 8472: 987, 8476: 795, 8992: 686, 8993: 686, 8486: 768, 9001: 329, 9002: 329, 8242: 247, 8243: 411, 8501: 823, 8756: 863, 8593: 603, 8764: 549, 402: 500, 8595: 603, 8230: 1000, 63725: 384, 8592: 987, 913: 722, 914: 667, 915: 603, 8596: 1042, 917: 611, 918: 611, 919: 722, 920: 741, 921: 333, 922: 722, 923: 686, 924: 889, 925: 722, 926: 645, 927: 722, 928: 768, 929: 556, 931: 592, 932: 611, 933: 690, 934: 763, 935: 722, 936: 795, 945: 631, 946: 549, 947: 411, 948: 494, 949: 439, 950: 494, 951: 603, 952: 521, 953: 329, 954: 549, 955: 549, 957: 521, 958: 493, 959: 549, 960: 549, 961: 549, 962: 439, 963: 603, 964: 439, 965: 576, 966: 521, 967: 549, 968: 686, 969: 686, 9674: 494, 63735: 384, 63727: 384, 8656: 987, 977: 631, 978: 620, 8659: 603, 8660: 1042, 981: 603, 982: 713, 8657: 603, 8745: 768}
    },
    "ZapfDingbats": {
        name: "ZapfDingbats",
        family: "ZapfDingbats",
        weight: JSFont.Weight.regular,
        style: JSFont.Style.normal,
        ascender: 981,
        descender: -1,
        cssFamily: 'ZapfDingbats',
        characterWidths: {9733: 816, 9742: 719, 9755: 960, 9758: 939, 32: 278, 10162: 760, 8594: 838, 9312: 788, 9315: 788, 9317: 788, 9824: 626, 9313: 788, 9314: 788, 9827: 776, 9316: 788, 9829: 694, 9830: 595, 9319: 788, 9320: 788, 9321: 788, 8596: 1016, 10172: 927, 9985: 974, 9986: 961, 9987: 974, 9988: 980, 9990: 789, 9991: 790, 9992: 791, 9993: 690, 9996: 549, 9997: 855, 9998: 911, 9999: 933, 10000: 911, 10001: 945, 10002: 974, 10003: 755, 10004: 846, 10005: 762, 10006: 761, 10007: 571, 10008: 677, 10009: 763, 10010: 760, 10011: 759, 10012: 754, 10013: 494, 10014: 552, 10015: 537, 10016: 577, 10017: 692, 10018: 786, 10019: 788, 10020: 788, 10021: 790, 10022: 793, 10023: 794, 10025: 823, 10026: 789, 10027: 841, 10028: 823, 10029: 833, 10030: 816, 10031: 831, 10032: 923, 10033: 744, 10034: 723, 10035: 749, 10036: 790, 10037: 792, 10038: 695, 10039: 776, 10040: 768, 10041: 792, 10042: 759, 10043: 707, 10044: 708, 10045: 682, 10046: 701, 10047: 826, 10048: 815, 10049: 789, 10050: 789, 10051: 707, 10052: 687, 10053: 696, 10054: 689, 10055: 786, 10056: 787, 10057: 713, 10058: 791, 10059: 785, 10061: 873, 10063: 762, 10064: 762, 10065: 759, 10066: 759, 10070: 784, 10072: 138, 10073: 277, 10074: 415, 10075: 392, 10076: 392, 10077: 668, 10078: 668, 10081: 732, 10082: 544, 10083: 544, 10084: 910, 10085: 667, 10086: 760, 10087: 760, 10088: 390, 10089: 390, 10090: 317, 10091: 317, 10092: 276, 10093: 276, 10094: 509, 10095: 509, 10096: 410, 10097: 410, 10098: 234, 10099: 234, 10100: 334, 10101: 334, 10102: 788, 10103: 788, 10104: 788, 10105: 788, 10106: 788, 10107: 788, 10108: 788, 10109: 788, 10110: 788, 10111: 788, 10112: 788, 10113: 788, 10114: 788, 10115: 788, 10116: 788, 10117: 788, 10118: 788, 10119: 788, 10120: 788, 10121: 788, 10122: 788, 10123: 788, 10124: 788, 10125: 788, 10126: 788, 10127: 788, 10128: 788, 10129: 788, 10130: 788, 10131: 788, 10132: 894, 8597: 458, 10136: 748, 10137: 924, 10138: 748, 9318: 788, 10140: 927, 10141: 928, 10142: 928, 10143: 834, 9632: 761, 10145: 828, 10146: 924, 10139: 918, 10148: 917, 10149: 930, 10150: 931, 10151: 463, 10152: 883, 10153: 836, 10154: 836, 10155: 867, 10156: 867, 10157: 696, 10158: 696, 10159: 874, 10161: 874, 9650: 892, 10163: 946, 10164: 771, 10165: 865, 10166: 771, 10167: 888, 10168: 967, 10169: 888, 10170: 831, 10171: 873, 9660: 892, 10173: 970, 10174: 918, 10144: 873, 9670: 788, 9679: 791, 10147: 924, 9687: 438}
    }
};

})();