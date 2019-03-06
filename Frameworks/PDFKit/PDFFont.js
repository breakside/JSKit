// #import "FontKit/FontKit.js"
// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFFontEncoding.js"
// #import "PDFKit/PDFCMap.js"
/* global JSGlobalObject, JSClass, JSLog, UUID, JSFont, JSFontDescriptor, FNTOpenTypeFont, FNTFontDescriptor, FNTType1Font, PDFStandardFontDescriptor, PDFOpenTypeFontDescriptor, JSData, PDFObject, PDFObjectProperty, PDFFont, PDFName, PDFType1Font, PDFType0Font, PDFTrueTypeFont, PDFMMType1Font, PDFType3Font, PDFCIDType0Font, PDFCIDType2Font, PDFOperationIterator, PDFCMap, PDFAdobeNamesToUnicode */
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
            // fill in missing values from standard font, if possible
            var standard = StandardFonts[this.BaseFont];
            if (standard){
                if (!this.Widths){
                    this.Widths = standard.Widths;
                    this.FirstChar = standard.FirstChar;
                    this.LastChar = standard.LastChar;
                }
                if (!this.FontDescriptor){
                    this.FontDescriptor = standard.FontDescriptor;
                }
            }

            var loadFontFile = function(){
                if (!this.FontDescriptor || !this.FontDescriptor.getOpenTypeData){
                    next.call(this);
                    return;
                }
                this.FontDescriptor.getOpenTypeData(function(otf){
                    if (otf){
                        this.embeddedOpenTypeFont = FNTOpenTypeFont.initWithData(otf);
                        this.foundationFontDescriptor = PDFOpenTypeFontDescriptor.initWithFont(this.embeddedOpenTypeFont, this);
                    }
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
                        if (this.Encoding.Differences){
                            diffs = this.Encoding.Differences;
                        }
                    }
                }
                if (map === null && this.embeddedOpenTypeFont){
                    var windowsUnicode = this.embeddedOpenTypeFont.tables.cmap.getMap([3, 1]);
                    if (windowsUnicode){
                        map = SingleByteEncoding.WinUnicodeEncoding;
                    }else{
                        var macRoman = this.embeddedOpenTypeFont.tables.cmap.getMap([1, 0]);
                        if (macRoman){
                            map = SingleByteEncoding.MacOSEncoding;
                        }
                    }
                }
                if (map === null){
                    map = SingleByteEncoding.Symbolic[this.BaseFont] || SingleByteEncoding.StandardEncoding;
                }
                this.encoding = SingleByteEncoding(map, diffs);
                if (this.stringDecoder === null){
                    this.stringDecoder = this.encoding;
                }
                next.call(this);
            };

            var createFallbackDescriptor = function(){
                if (this.foundationFontDescriptor === null && standard){
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
            next.call(this);
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
                descendant.FontDescriptor.getOpenTypeData(function(otf){
                    if (otf){
                        this.embeddedOpenTypeFont = FNTOpenTypeFont.initWithData(otf);
                        this.foundationFontDescriptor = PDFOpenTypeFontDescriptor.initWithFont(this.embeddedOpenTypeFont, descendant);
                    }
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
            next.call(this);
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

    initWithPDFFont: function(pdfFont){
        var pdfDescriptor = pdfFont.FontDescriptor;
        this._family = pdfDescriptor.FontFamily.stringByDecodingLatin1();
        this._weight = pdfDescriptor.Weight || JSFont.Weight.regular;
        this._style = (pdfDescriptor.Flags & 0x40) ? JSFont.Style.italic : JSFont.Style.normal;
        this._postScriptName = pdfDescriptor.FontName.valueDecodingUTF8();
        this._name = this._postScriptName;
        this._face = "";
        this._ascender = pdfDescriptor.Ascent;
        this._descender = pdfDescriptor.Descent;
        this._unitsPerEM = 1000;
    }
});

var descriptorId = 0;

JSClass("PDFOpenTypeFontDescriptor", FNTFontDescriptor, {

    pdfFont: null,
    missingWidth: 0,

    initWithFont: function(otf, pdfFont){
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
                this._map[code] = PDFAdobeNamesToUnicode[codeOrName];
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
                        this.codeToString[code] = PDFAdobeNamesToUnicode[unicode[i]].stringByDecodingUTF16BE();
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
                this.codeToString[code] = PDFAdobeNamesToUnicode[unicode] || 0xfffd;
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

var StandardFonts = {
    "Times-Roman": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [250,333,408,500,500,833,778,333,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,333,500,500,167,500,500,500,500,180,444,500,333,333,556,556,0,500,500,500,250,0,453,350,333,444,444,500,1000,1000,0,444,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,889,0,276,0,0,0,0,611,722,889,310,0,0,0,0,0,667,0,0,0,278,0,0,278,500,722,500],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Times-Roman"),
            FontFamily: "Times".latin1(),
            Weight: 400,
            Flags: 0,
            Ascent: 683,
            Descent: -217
        }
    },
    "Times-Bold": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [250,333,555,500,500,1000,833,333,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,556,556,444,389,333,556,500,722,500,500,444,394,220,394,520,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,333,500,500,167,500,500,500,500,278,500,500,333,333,556,556,0,500,500,500,250,0,540,350,333,500,500,500,1000,1000,0,500,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,300,0,0,0,0,667,778,1000,330,0,0,0,0,0,722,0,0,0,278,0,0,278,500,722,556],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Times-Bold"),
            FontFamily: "Times".latin1(),
            Weight: 700,
            Flags: 0,
            Ascent: 683,
            Descent: -217
        }
    },
    "Times-Italic": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [250,333,420,500,500,833,778,333,333,333,500,675,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,675,675,675,500,920,611,611,667,722,611,611,722,722,333,444,667,556,833,667,722,611,722,611,500,556,722,611,833,611,556,556,389,278,389,422,500,333,500,500,444,500,444,278,500,500,278,278,444,278,722,500,500,500,500,389,389,278,500,444,667,444,444,389,400,275,400,541,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,389,500,500,167,500,500,500,500,214,556,500,333,333,500,500,0,500,500,500,250,0,523,350,333,556,556,500,889,1000,0,500,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,889,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,889,0,276,0,0,0,0,556,722,944,310,0,0,0,0,0,667,0,0,0,278,0,0,278,500,667,500],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Times-Italic"),
            FontFamily: "Times".latin1(),
            Weight: 400,
            Flags: 0x40,
            Ascent: 683,
            Descent: -217
        }
    },
    "Times-BoldItalic": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [250,389,555,500,500,833,778,333,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,832,667,667,667,722,667,667,722,778,389,500,667,611,889,722,722,611,722,667,556,611,722,667,889,667,611,611,333,278,333,570,500,333,500,500,444,500,444,333,500,556,278,278,500,278,778,556,500,500,500,389,389,278,556,444,667,500,444,389,348,220,348,570,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,389,500,500,167,500,500,500,500,278,500,500,333,333,556,556,0,500,500,500,250,0,500,350,333,500,500,500,1000,1000,0,500,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,944,0,266,0,0,0,0,611,722,944,300,0,0,0,0,0,722,0,0,0,278,0,0,278,500,722,500],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Times-BoldItalic"),
            FontFamily: "Times".latin1(),
            Weight: 700,
            Flags: 0x40,
            Ascent: 683,
            Descent: -217
        }
    },
    // Notice Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.
    "Helvetica": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [278,278,355,556,556,889,667,222,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,222,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,580,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,333,556,556,167,556,556,556,556,191,333,556,333,333,500,500,0,556,556,556,278,0,537,350,222,333,333,556,1000,1000,0,611,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,370,0,0,0,0,556,778,1000,365,0,0,0,0,0,889,0,0,0,278,0,0,222,611,944,611],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Helvetica"),
            FontFamily: "Helvetica".latin1(),
            Weight: 400,
            Flags: 0,
            Ascent: 718,
            Descent: -207
        }
    },
    // Notice Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.
    "Helvetica-Bold": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [278,333,474,556,556,889,722,278,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,278,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,333,556,556,167,556,556,556,556,238,500,556,333,333,611,611,0,556,556,556,278,0,556,350,278,500,500,556,1000,1000,0,611,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,370,0,0,0,0,611,778,1000,365,0,0,0,0,0,889,0,0,0,278,0,0,278,611,944,611],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Helvetica-Bold"),
            FontFamily: "Helvetica".latin1(),
            Weight: 700,
            Flags: 0,
            Ascent: 718,
            Descent: -207
        }
    },
    "Helvetica-Oblique": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [278,278,355,556,556,889,667,222,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,222,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,333,556,556,167,556,556,556,556,191,333,556,333,333,500,500,0,556,556,556,278,0,537,350,222,333,333,556,1000,1000,0,611,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,370,0,0,0,0,556,778,1000,365,0,0,0,0,0,889,0,0,0,278,0,0,222,611,944,611],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Helvetica-Oblique"),
            FontFamily: "Helvetica".latin1(),
            Weight: 400,
            Flags: 0x40,
            Ascent: 718,
            Descent: -207
        }
    },
    "Helvetica-BoldOblique": {
        // FIXME: widths ordering should be based on Encoding
        Widths: [278,333,474,556,556,889,722,278,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,278,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,333,556,556,167,556,556,556,556,238,500,556,333,333,611,611,0,556,556,556,278,0,556,350,278,500,500,556,1000,1000,0,611,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,370,0,0,0,0,611,778,1000,365,0,0,0,0,0,889,0,0,0,278,0,0,278,611,944,611],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: PDFName("Helvetica-BoldOblique"),
            FontFamily: "Helvetica".latin1(),
            Weight: 700,
            Flags: 0x40,
            Ascent: 718,
            Descent: -207
        }
    },
    "Courier": {
    },
    "Courier-Bold": {
    },
    "Courier-Oblique": {
    },
    "Courier-BoldOblique": {
    },
    "Symbol": {
    },
    "ZapfDingbats": {
    }
};

})();