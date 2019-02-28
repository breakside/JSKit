// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, JSClass, JSFont, JSData, PDFObject, PDFObjectProperty, PDFFont, PDFName, PDFType1Font, PDFType0Font, PDFTrueTypeFont, PDFMMType1Font, PDFType3Font, PDFCIDFontType0Font, PDFCIDFontType1Font, PDFOperationIterator */
'use strict';

(function(){

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

    widthOfData: {
        value: function PDFFont_widthOfData(data){
            return 0;
        }
    },

    foundationFontOfSize: {
        value: function PDFFont_foundationFontOfSize(size){
            return JSFont.systemFontOfSize(size);
        }
    }
});

JSGlobalObject.PDFType1Font = function(){
    if (this === undefined){
        return new PDFType1Font();
    }
};

JSGlobalObject.PDFType1Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("Type1") },
    Name:           PDFObjectProperty,
    BaseFont:       PDFObjectProperty,
    FirstChar:      PDFObjectProperty,
    LastChar:       PDFObjectProperty,
    Widths:         PDFObjectProperty,
    FontDescriptor: PDFObjectProperty,
    Encoding:       PDFObjectProperty,
    ToUnicode:      PDFObjectProperty,

    stringFromData: {
        value: function PDFType1Font_stringFromData(data){
            var str = "";
            var code;
            var unicode;
            for (var i = 0, l = data.length; i < l; ++i){
                code = data[i];
                str += this._cachedEncoding.stringForByte(code);
            }
            return str;
        }
    },

    widthOfData: {
        value: function PDFType1Font_widthOfData(data){
            if (!this.W){
                return 0;
            }
            var index;
            var width = 0;
            var min = this.FirstChar;
            var max = this.LastChar;
            for (var i = 0, l = data.length; i < l; ++i){
                index = data[i];
                if (index >= min && index <= max){
                    width += this.W[index - min];
                }else if (this.FontDescriptor){
                    width += this.FontDescriptor.MissingWidth || 0;
                }
            }
            return width / 1000;
        }
    },

    _cachedEncoding: {
        writable: true,
        value: null,
    },
    _cachedFoundationFont: {
        writable: true,
        value: null,
    },

    load: {
        value: function PDFType1Font_load(completion, target){
            // fill in missing values from standard font, if possible
            var standard = StandardFonts[this.BaseFont];
            if (standard){
                if (!this.W){
                    this.W = standard.W;
                    this.FirstChar = standard.FirstChar;
                    this.LastChar = standard.LastChar;
                }
                if (!this.FontDescriptor){
                    this.FontDescriptor = standard.FontDescriptor;
                }
            }

            var loadFontFile = function(){
                if (!this.FontDescriptor){
                    next.call(this);
                    return;
                }
                if (this.FontDescriptor.FontFile2){
                    this.FontDescriptor.FontFile2.getData(function(ttf){
                        // TODO: make JSFont from ttf and descriptor info
                        next.call(this);       
                    }, this);
                }else if (this.FontDescriptor.FontFile3 && this.FontDescriptor.FontFile3.SubType == "OpenType"){
                    this.FontDescriptor.FontFile3.getData(function(otf){
                        // TODO: make JSFont from otf and descriptor info
                        next.call(this);
                    }, this);
                }else{
                    next.call(this);
                }
            };

            var loadUnicode = function(){
                if (!this.ToUnicode){
                    next.call(this);
                    return;
                }
                this.ToUnicode.getData(function(cmap){
                    // TODO: use this.ToUnicode.UseCMap, if present
                    this._cachedEncoding = ToUnicodeEncoding(cmap);
                    next.call(this);
                }, this);
            };

            var loadEncoding = function(){
                if (this._cachedEncoding){
                    next.call(this);
                    return;
                }
                var base;
                if (this.Encoding){
                    if (this.Encoding instanceof PDFName){
                        this._cachedEncoding = SingleByteEncoding(this.Encoding);
                    }else{
                        base = this.Encoding.BaseEncoding;
                        if (!base){
                            // TODO: use built in font encoding as base if font file is embedded
                        }
                    }
                }else{
                    // TODO: use the font's built in encoding as base if file is embedded
                }
                if (!this._cachedEncoding){
                    if (!base){
                        switch (this.BaseFont.toString()){
                            case "Symbol":
                                base = PDFName("SymbolEncoding");
                                break;
                            case "ZapfDingbats":
                                base = PDFName("ZapfDingbatsEncoding");
                                break;
                            default:
                                base = PDFName("StandardEncoding");
                                break;
                        }
                    }
                    this._cachedEncoding = SingleByteEncoding(base, this.Encoding.Differences);
                }
                next.call(this);
            };

            var steps = [
                loadFontFile,
                loadUnicode,
                loadEncoding
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
    }
});

JSGlobalObject.PDFTrueTypeFont = function(){
    if (this === undefined){
        return new PDFTrueTypeFont();
    }
};

JSGlobalObject.PDFTrueTypeFont.prototype = Object.create(PDFType1Font.prototype, {
    Subtype:    { enumerable: true, value: PDFName("TrueType") },
});

JSGlobalObject.PDFType0Font = function(){
    if (this === undefined){
        return new PDFType0Font();
    }
};

JSGlobalObject.PDFType0Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("Type0") }
});

JSGlobalObject.PDFMMType1Font = function(){
    if (this === undefined){
        return new PDFMMType1Font();
    }
};

JSGlobalObject.PDFMMType1Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("MMType1") }
});

JSGlobalObject.PDFType3Font = function(){
    if (this === undefined){
        return new PDFType3Font();
    }
};

JSGlobalObject.PDFType3Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("Type3") },
});

JSGlobalObject.PDFCIDFontType0Font = function(){
    if (this === undefined){
        return new PDFCIDFontType0Font();
    }
};

JSGlobalObject.PDFCIDFontType0Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("CIDFontType0") }
});

JSGlobalObject.PDFCIDFontType1Font = function(){
    if (this === undefined){
        return new PDFCIDFontType1Font();
    }
};

JSGlobalObject.PDFCIDFontType1Font.prototype = Object.create(PDFFont.prototype, {
    Subtype:        { enumerable: true, value: PDFName("CIDFontType1") }
});

var SingleByteEncoding = function(base, diffs){
    if (this === undefined){
        return new SingleByteEncoding(base, diffs);
    }
    this._map = SingleByteEncoding[base];
    if (diffs){
        var map = this._map;
        this._map = [];
        var i, l;
        for (i = 0, l = map.length; i < l; ++i){
            this._map[i] = map[i];
        }
        var codeOrName;
        var code;
        for (i = 0, l = diffs.length; i < l; ++i){
            codeOrName = diffs[i];
            if (typeof(codeOrName) == "number"){
                code = codeOrName;
            }else{
                this._map[code] = AdobeNamesToUnicode[codeOrName];
                ++code;
            }
        }
    }
};

SingleByteEncoding.prototype = {
    _map: null,

    stringForByte: function(byte){
        return String.fromUnicode(this._map[byte]);
    }
};

SingleByteEncoding.MacRomanEncoding =  [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x00c4,0x00c5,0x00c7,0x00c9,0x00d1,0x00d6,0x00dc,0x00e1,0x00e0,0x00e2,0x00e4,0x00e3,0x00e5,0x00e7,0x00e9,0x00e8,0x00ea,0x00eb,0x00ed,0x00ec,0x00ee,0x00ef,0x00f1,0x00f3,0x00f2,0x00f4,0x00f6,0x00f5,0x00fa,0x00f9,0x00fb,0x00fc,0x2020,0x00b0,0x00a2,0x00a3,0x00a7,0x2022,0x00b6,0x00df,0x00ae,0x00a9,0x2122,0x00b4,0x00a8,0xfffd,0x00c6,0x00d8,0xfffd,0x00b1,0xfffd,0xfffd,0x00a5,0x00b5,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00aa,0x00ba,0xfffd,0x00e6,0x00f8,0x00bf,0x00a1,0x00ac,0xfffd,0x0192,0xfffd,0xfffd,0x00ab,0x00bb,0x2026,0xfffd,0x00c0,0x00c3,0x00d5,0x0152,0x0153,0x2013,0x2014,0x201c,0x201d,0x2018,0x2019,0x00f7,0xfffd,0x00ff,0x0178,0x2044,0x00a4,0x2039,0x203a,0xfb01,0xfb02,0x2021,0x00b7,0x201a,0x201e,0x2030,0x00c2,0x00ca,0x00c1,0x00cb,0x00c8,0x00cd,0x00ce,0x00cf,0x00cc,0x00d3,0x00d4,0xfffd,0x00d2,0x00da,0x00db,0x00d9,0x0131,0x02c6,0x02dc,0x00af,0x02d8,0x02d9,0x02da,0x00b8,0x02dd,0x02db,0x02c7];
SingleByteEncoding.MacExpertEncoding = [0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x0020,0xf721,0xf6f8,0xf7a2,0xf724,0xf6e4,0xf726,0xf7b4,0x207d,0x207e,0x2025,0x2024,0x002c,0x002d,0x002e,0x2044,0xf730,0xf731,0xf732,0xf733,0xf734,0xf735,0xf736,0xf737,0xf738,0xf739,0x003a,0x003b,0xfffd,0xf6de,0xfffd,0xf73f,0xfffd,0xfffd,0xfffd,0xfffd,0xf7f0,0xfffd,0xfffd,0x00bc,0x00bd,0x00be,0x215b,0x215c,0x215d,0x215e,0x2153,0x2154,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfb00,0xfb01,0xfb02,0xfb03,0xfb04,0x208d,0xfffd,0x208e,0xf6f6,0xf6e5,0xf760,0xf761,0xf762,0xf763,0xf764,0xf765,0xf766,0xf767,0xf768,0xf769,0xf76a,0xf76b,0xf76c,0xf76d,0xf76e,0xf76f,0xf770,0xf771,0xf772,0xf773,0xf774,0xf775,0xf776,0xf777,0xf778,0xf779,0xf77a,0x20a1,0xf6dc,0xf6dd,0xf6fe,0xfffd,0xfffd,0xf6e9,0xf6e0,0xfffd,0xfffd,0xfffd,0xfffd,0xf7e1,0xf7e0,0xf7e2,0xf7e4,0xf7e3,0xf7e5,0xf7e7,0xf7e9,0xf7e8,0xf7ea,0xf7eb,0xf7ed,0xf7ec,0xf7ee,0xf7ef,0xf7f1,0xf7f3,0xf7f2,0xf7f4,0xf7f6,0xf7f5,0xf7fa,0xf7f9,0xf7fb,0xf7fc,0xfffd,0x2078,0x2084,0x2083,0x2086,0x2088,0x2087,0xf6fd,0xfffd,0xf6df,0x2082,0xfffd,0xf7a8,0xfffd,0xf6f5,0xf6f0,0x2085,0xfffd,0xf6e1,0xf6e7,0xf7fd,0xfffd,0xf6e3,0xfffd,0xfffd,0xf7fe,0xfffd,0x2089,0x2080,0xf6ff,0xf7e6,0xf7f8,0xf7bf,0x2081,0xf6f9,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xf7b8,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xf6fa,0x2012,0xf6e6,0xfffd,0xfffd,0xfffd,0xfffd,0xf7a1,0xfffd,0xf7ff,0xfffd,0x00b9,0x00b2,0x00b3,0x2074,0x2075,0xfffd,0x2077,0x2079,0x2070,0xfffd,0xf6ec,0xf6f1,0xf6f3,0xfffd,0xfffd,0xf6ed,0xf6f2,0xf6eb,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xf6ee,0xf6fb,0xf6f4,0xf7af,0xf6ea,0x207f,0xf6ef,0xf6e2,0xf6e8,0xf6f7,0xf6fc,0xfffd,0xfffd,0xfffd,0x2076];
SingleByteEncoding.WinAnsiEncoding =   [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x20ac,0xfffd,0x201a,0x0192,0x201e,0x2026,0x2020,0x2021,0x02c6,0x2030,0x0160,0x2039,0x0152,0xfffd,0x017d,0xfffd,0xfffd,0x2018,0x2019,0x201c,0x201d,0x2022,0x2013,0x2014,0x02dc,0x2122,0x0161,0x203a,0x0153,0xfffd,0x017e,0x0178,0xfffd,0x00a1,0x00a2,0x00a3,0x00a4,0x00a5,0x00a6,0x00a7,0x00a8,0x00a9,0x00aa,0x00ab,0x00ac,0xfffd,0x00ae,0x00af,0x00b0,0x00b1,0x00b2,0x00b3,0x00b4,0x00b5,0x00b6,0x00b7,0x00b8,0x00b9,0x00ba,0x00bb,0x00bc,0x00bd,0x00be,0x00bf,0x00c0,0x00c1,0x00c2,0x00c3,0x00c4,0x00c5,0x00c6,0x00c7,0x00c8,0x00c9,0x00ca,0x00cb,0x00cc,0x00cd,0x00ce,0x00cf,0x00d0,0x00d1,0x00d2,0x00d3,0x00d4,0x00d5,0x00d6,0x00d7,0x00d8,0x00d9,0x00da,0x00db,0x00dc,0x00dd,0x00de,0x00df,0x00e0,0x00e1,0x00e2,0x00e3,0x00e4,0x00e5,0x00e6,0x00e7,0x00e8,0x00e9,0x00ea,0x00eb,0x00ec,0x00ed,0x00ee,0x00ef,0x00f0,0x00f1,0x00f2,0x00f3,0x00f4,0x00f5,0x00f6,0x00f7,0x00f8,0x00f9,0x00fa,0x00fb,0x00fc,0x00fd,0x00fe,0x00ff];
SingleByteEncoding.StandardEncoding =  [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00a1,0x00a2,0x00a3,0x2044,0x00a5,0x0192,0x00a7,0x00a4,0x0027,0x201c,0x00ab,0x2039,0x203a,0xfb01,0xfb02,0xfffd,0x2013,0x2020,0x2021,0x00b7,0xfffd,0x00b6,0x2022,0x201a,0x201e,0x201d,0x00bb,0x2026,0x2030,0xfffd,0x00bf,0xfffd,0x0060,0x00b4,0x02c6,0x02dc,0x00af,0x02d8,0x02d9,0x00a8,0xfffd,0x02da,0x00b8,0xfffd,0x02dd,0x02db,0x02c7,0x2014,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00c6,0xfffd,0x00aa,0xfffd,0xfffd,0xfffd,0xfffd,0x0141,0x00d8,0x0152,0x00ba,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00e6,0xfffd,0xfffd,0xfffd,0x0131,0xfffd,0xfffd,0x0142,0x00f8,0x0153,0x00df,0xfffd,0xfffd,0xfffd,0xfffd];
SingleByteEncoding.PDFDocEncoding =    [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x17,0x17,0x2d8,0x2c7,0x2c6,0x2d9,0x2dd,0x2db,0x2da,0x2dc,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x2022,0x2020,0x2021,0x2026,0x2014,0x2013,0x0192,0x2044,0x2039,0x203a,0x2212,0x2030,0x201e,0x201c,0x201d,0x2018,0x2019,0x201a,0x2122,0xfb01,0xfb02,0x0141,0x0152,0x0160,0x0178,0x017d,0x0131,0x0142,0x0153,0x0161,0x017e,0xfffd,0x20ac,0x00a1,0x00a2,0x00a3,0x00a4,0x00a5,0x00a6,0x00a7,0x00a8,0x00a9,0x00aa,0x00ab,0x00ac,0xfffd,0x00ae,0x00af,0x00b0,0x00b1,0x00b2,0x00b3,0x00b4,0x00b5,0x00b6,0x00b7,0x00b8,0x00b9,0x00ba,0x00bb,0x00bc,0x00bd,0x00be,0x00bf,0x00c0,0x00c1,0x00c2,0x00c3,0x00c4,0x00c5,0x00c6,0x00c7,0x00c8,0x00c9,0x00ca,0x00cb,0x00cc,0x00cd,0x00ce,0x00cf,0x00d0,0x00d1,0x00d2,0x00d3,0x00d4,0x00d5,0x00d6,0x00d7,0x00d8,0x00d9,0x00da,0x00db,0x00dc,0x00dd,0x00de,0x00df,0x00e0,0x00e1,0x00e2,0x00e3,0x00e4,0x00e5,0x00e6,0x00e7,0x00e8,0x00e9,0x00ea,0x00eb,0x00ec,0x00ed,0x00ee,0x00ef,0x00f0,0x00f1,0x00f2,0x00f3,0x00f4,0x00f5,0x00f6,0x00f7,0x00f8,0x00f9,0x00fa,0x00fb,0x00fc,0x00fd,0x00fe,0x00ff];
// TODO:
SingleByteEncoding.SymbolEncoding = [];
SingleByteEncoding.ZapfDingbatsEncoding = [];

var ToUnicodeEncoding = function(cmap){
    if (this === undefined){
        return new ToUnicodeEncoding(cmap);
    }
    this.validRanges = [];
    this._counts = [];
    this.codeToString = {};
    this.codeToStringRanges = [];
    var iterator = PDFOperationIterator.initWithData(cmap);
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

ToUnicodeEncoding.prototype = {

    validRanges: null,
    codeToString: null,
    codeToStringRanges: null,
    _counts: null,

    stringForByte: function(byte){
        var str = this.codeToString[byte];
        if (str){
            return str;
        }
        var range;
        for (var i = 0, l = this.codeToStringRanges.length; i < l; ++i){
            range = this.codeToStringRanges[i];
            if (byte >= range.low && byte <= range.high){
                if (range.prefix){
                    return range.prefix + String.fromUnicode(range.first + byte - range.low);
                }
                return String.fromUnicode(range.first + byte - range.low);
            }
        }
        return String.fromUnicode(0xfffd);
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
                        this.codeToString[code] = AdobeNamesToUnicode[unicode[i]].stringByDecodingUTF16BE();
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
            code = args[a++];
            unicode = args[a++];
            if (unicode instanceof PDFName){
                this.codeToString[code] = AdobeNamesToUnicode[unicode] || 0xfffd;
            }else{
                this.codeToString[code] = unicode.stringByDecodingUTF16BE();
            }
        }
    }

};

var AdobeNamesToUnicode = {
    "A": 0x0041,
    "AE": 0x00c6,
    "AEsmall": 0xf7e6,
    "Aacute": 0x00c1,
    "Aacutesmall": 0xf7e1,
    "Acircumflex": 0x00c2,
    "Acircumflexsmall": 0xf7e2,
    "Acutesmall": 0xf7b4,
    "Adieresis": 0x00c4,
    "Adieresissmall": 0xf7e4,
    "Agrave": 0x00c0,
    "Agravesmall": 0xf7e0,
    "Alpha": 0x0391,
    "Aring": 0x00c5,
    "Aringsmall": 0xf7e5,
    "Asmall": 0xf761,
    "Atilde": 0x00c3,
    "Atildesmall": 0xf7e3,
    "B": 0x0042,
    "Beta": 0x0392,
    "Brevesmall": 0xf6f4,
    "Bsmall": 0xf762,
    "C": 0x0043,
    "Caronsmall": 0xf6f5,
    "Ccedilla": 0x00c7,
    "Ccedillasmall": 0xf7e7,
    "Cedillasmall": 0xf7b8,
    "Chi": 0x03a7,
    "Circumflexsmall": 0xf6f6,
    "Csmall": 0xf763,
    "D": 0x0044,
    "Delta": 0x2206,
    "Dieresissmall": 0xf7a8,
    "Dotaccentsmall": 0xf6f7,
    "Dsmall": 0xf764,
    "E": 0x0045,
    "Eacute": 0x00c9,
    "Eacutesmall": 0xf7e9,
    "Ecircumflex": 0x00ca,
    "Ecircumflexsmall": 0xf7ea,
    "Edieresis": 0x00cb,
    "Edieresissmall": 0xf7eb,
    "Egrave": 0x00c8,
    "Egravesmall": 0xf7e8,
    "Epsilon": 0x0395,
    "Esmall": 0xf765,
    "Eta": 0x0397,
    "Eth": 0x00d0,
    "Ethsmall": 0xf7f0,
    "Euro": 0x20ac,
    "F": 0x0046,
    "Fsmall": 0xf766,
    "G": 0x0047,
    "Gamma": 0x0393,
    "Gravesmall": 0xf760,
    "Gsmall": 0xf767,
    "H": 0x0048,
    "Hsmall": 0xf768,
    "Hungarumlautsmall": 0xf6f8,
    "I": 0x0049,
    "Iacute": 0x00cd,
    "Iacutesmall": 0xf7ed,
    "Icircumflex": 0x00ce,
    "Icircumflexsmall": 0xf7ee,
    "Idieresis": 0x00cf,
    "Idieresissmall": 0xf7ef,
    "Ifraktur": 0x2111,
    "Igrave": 0x00cc,
    "Igravesmall": 0xf7ec,
    "Iota": 0x0399,
    "Ismall": 0xf769,
    "J": 0x004a,
    "Jsmall": 0xf76a,
    "K": 0x004b,
    "Kappa": 0x039a,
    "Ksmall": 0xf76b,
    "L": 0x004c,
    "Lambda": 0x039b,
    "Lslash": 0x0141,
    "Lslashsmall": 0xf6f9,
    "Lsmall": 0xf76c,
    "M": 0x004d,
    "Macronsmall": 0xf7af,
    "Msmall": 0xf76d,
    "Mu": 0x039c,
    "N": 0x004e,
    "Nsmall": 0xf76e,
    "Ntilde": 0x00d1,
    "Ntildesmall": 0xf7f1,
    "Nu": 0x039d,
    "O": 0x004f,
    "OE": 0x0152,
    "OEsmall": 0xf6fa,
    "Oacute": 0x00d3,
    "Oacutesmall": 0xf7f3,
    "Ocircumflex": 0x00d4,
    "Ocircumflexsmall": 0xf7f4,
    "Odieresis": 0x00d6,
    "Odieresissmall": 0xf7f6,
    "Ogoneksmall": 0xf6fb,
    "Ograve": 0x00d2,
    "Ogravesmall": 0xf7f2,
    "Omega": 0x2126,
    "Omicron": 0x039f,
    "Oslash": 0x00d8,
    "Oslashsmall": 0xf7f8,
    "Osmall": 0xf76f,
    "Otilde": 0x00d5,
    "Otildesmall": 0xf7f5,
    "P": 0x0050,
    "Phi": 0x03a6,
    "Pi": 0x03a0,
    "Psi": 0x03a8,
    "Psmall": 0xf770,
    "Q": 0x0051,
    "Qsmall": 0xf771,
    "R": 0x0052,
    "Rfraktur": 0x211c,
    "Rho": 0x03a1,
    "Ringsmall": 0xf6fc,
    "Rsmall": 0xf772,
    "S": 0x0053,
    "Scaron": 0x0160,
    "Scaronsmall": 0xf6fd,
    "Sigma": 0x03a3,
    "Ssmall": 0xf773,
    "T": 0x0054,
    "Tau": 0x03a4,
    "Theta": 0x0398,
    "Thorn": 0x00de,
    "Thornsmall": 0xf7fe,
    "Tildesmall": 0xf6fe,
    "Tsmall": 0xf774,
    "U": 0x0055,
    "Uacute": 0x00da,
    "Uacutesmall": 0xf7fa,
    "Ucircumflex": 0x00db,
    "Ucircumflexsmall": 0xf7fb,
    "Udieresis": 0x00dc,
    "Udieresissmall": 0xf7fc,
    "Ugrave": 0x00d9,
    "Ugravesmall": 0xf7f9,
    "Upsilon": 0x03a5,
    "Upsilon1": 0x03d2,
    "Usmall": 0xf775,
    "V": 0x0056,
    "Vsmall": 0xf776,
    "W": 0x0057,
    "Wsmall": 0xf777,
    "X": 0x0058,
    "Xi": 0x039e,
    "Xsmall": 0xf778,
    "Y": 0x0059,
    "Yacute": 0x00dd,
    "Yacutesmall": 0xf7fd,
    "Ydieresis": 0x0178,
    "Ydieresissmall": 0xf7ff,
    "Ysmall": 0xf779,
    "Z": 0x005a,
    "Zcaron": 0x017d,
    "Zcaronsmall": 0xf6ff,
    "Zeta": 0x0396,
    "Zsmall": 0xf77a,
    "a": 0x0061,
    "aacute": 0x00e1,
    "acircumflex": 0x00e2,
    "acute": 0x00b4,
    "adieresis": 0x00e4,
    "ae": 0x00e6,
    "agrave": 0x00e0,
    "aleph": 0x2135,
    "alpha": 0x03b1,
    "ampersand": 0x0026,
    "ampersandsmall": 0xf726,
    "angle": 0x2220,
    "angleleft": 0x2329,
    "angleright": 0x232a,
    "approxequal": 0x2248,
    "aring": 0x00e5,
    "arrowboth": 0x2194,
    "arrowdblboth": 0x21d4,
    "arrowdbldown": 0x21d3,
    "arrowdblleft": 0x21d0,
    "arrowdblright": 0x21d2,
    "arrowdblup": 0x21d1,
    "arrowdown": 0x2193,
    "arrowhorizex": 0xf8e7,
    "arrowleft": 0x2190,
    "arrowright": 0x2192,
    "arrowup": 0x2191,
    "arrowvertex": 0xf8e6,
    "asciicircum": 0x005e,
    "asciitilde": 0x007e,
    "asterisk": 0x002a,
    "asteriskmath": 0x2217,
    "asuperior": 0xf6e9,
    "at": 0x0040,
    "atilde": 0x00e3,
    "b": 0x0062,
    "backslash": 0x005c,
    "bar": 0x007c,
    "beta": 0x03b2,
    "braceex": 0xf8f4,
    "braceleft": 0x007b,
    "braceleftbt": 0xf8f3,
    "braceleftmid": 0xf8f2,
    "bracelefttp": 0xf8f1,
    "braceright": 0x007d,
    "bracerightbt": 0xf8fe,
    "bracerightmid": 0xf8fd,
    "bracerighttp": 0xf8fc,
    "bracketleft": 0x005b,
    "bracketleftbt": 0xf8f0,
    "bracketleftex": 0xf8ef,
    "bracketlefttp": 0xf8ee,
    "bracketright": 0x005d,
    "bracketrightbt": 0xf8fb,
    "bracketrightex": 0xf8fa,
    "bracketrighttp": 0xf8f9,
    "breve": 0x02d8,
    "brokenbar": 0x00a6,
    "bsuperior": 0xf6ea,
    "bullet": 0x2022,
    "c": 0x0063,
    "caron": 0x02c7,
    "carriagereturn": 0x21b5,
    "ccedilla": 0x00e7,
    "cedilla": 0x00b8,
    "cent": 0x00a2,
    "centinferior": 0xf6df,
    "centoldstyle": 0xf7a2,
    "centsuperior": 0xf6e0,
    "chi": 0x03c7,
    "circlemultiply": 0x2297,
    "circleplus": 0x2295,
    "circumflex": 0x02c6,
    "club": 0x2663,
    "colon": 0x003a,
    "colonmonetary": 0x20a1,
    "comma": 0x002c,
    "commainferior": 0xf6e1,
    "commasuperior": 0xf6e2,
    "congruent": 0x2245,
    "copyright": 0x00a9,
    "copyrightsans": 0xf8e9,
    "copyrightserif": 0xf6d9,
    "currency": 0x00a4,
    "d": 0x0064,
    "dagger": 0x2020,
    "daggerdbl": 0x2021,
    "degree": 0x00b0,
    "delta": 0x03b4,
    "diamond": 0x2666,
    "dieresis": 0x00a8,
    "divide": 0x00f7,
    "dollar": 0x0024,
    "dollarinferior": 0xf6e3,
    "dollaroldstyle": 0xf724,
    "dollarsuperior": 0xf6e4,
    "dotaccent": 0x02d9,
    "dotlessi": 0x0131,
    "dotmath": 0x22c5,
    "dsuperior": 0xf6eb,
    "e": 0x0065,
    "eacute": 0x00e9,
    "ecircumflex": 0x00ea,
    "edieresis": 0x00eb,
    "egrave": 0x00e8,
    "eight": 0x0038,
    "eightinferior": 0x2088,
    "eightoldstyle": 0xf738,
    "eightsuperior": 0x2078,
    "element": 0x2208,
    "ellipsis": 0x2026,
    "emdash": 0x2014,
    "emptyset": 0x2205,
    "endash": 0x2013,
    "epsilon": 0x03b5,
    "equal": 0x003d,
    "equivalence": 0x2261,
    "esuperior": 0xf6ec,
    "eta": 0x03b7,
    "eth": 0x00f0,
    "exclam": 0x0021,
    "exclamdown": 0x00a1,
    "exclamdownsmall": 0xf7a1,
    "exclamsmall": 0xf721,
    "existential": 0x2203,
    "f": 0x0066,
    "ff": 0xfb00,
    "ffi": 0xfb03,
    "ffl": 0xfb04,
    "fi": 0xfb01,
    "figuredash": 0x2012,
    "five": 0x0035,
    "fiveeighths": 0x215d,
    "fiveinferior": 0x2085,
    "fiveoldstyle": 0xf735,
    "fivesuperior": 0x2075,
    "fl": 0xfb02,
    "florin": 0x0192,
    "four": 0x0034,
    "fourinferior": 0x2084,
    "fouroldstyle": 0xf734,
    "foursuperior": 0x2074,
    "fraction": 0x2044,
    "g": 0x0067,
    "gamma": 0x03b3,
    "germandbls": 0x00df,
    "gradient": 0x2207,
    "grave": 0x0060,
    "greater": 0x003e,
    "greaterequal": 0x2265,
    "guillemotleft": 0x00ab,
    "guillemotright": 0x00bb,
    "guilsinglleft": 0x2039,
    "guilsinglright": 0x203a,
    "h": 0x0068,
    "heart": 0x2665,
    "hungarumlaut": 0x02dd,
    "hyphen": 0x002d,
    "hypheninferior": 0xf6e5,
    "hyphensuperior": 0xf6e6,
    "i": 0x0069,
    "iacute": 0x00ed,
    "icircumflex": 0x00ee,
    "idieresis": 0x00ef,
    "igrave": 0x00ec,
    "infinity": 0x221e,
    "integral": 0x222b,
    "integralbt": 0x2321,
    "integralex": 0xf8f5,
    "integraltp": 0x2320,
    "intersection": 0x2229,
    "iota": 0x03b9,
    "isuperior": 0xf6ed,
    "j": 0x006a,
    "k": 0x006b,
    "kappa": 0x03ba,
    "l": 0x006c,
    "lambda": 0x03bb,
    "less": 0x003c,
    "lessequal": 0x2264,
    "logicaland": 0x2227,
    "logicalnot": 0x00ac,
    "logicalor": 0x2228,
    "lozenge": 0x25ca,
    "lslash": 0x0142,
    "lsuperior": 0xf6ee,
    "m": 0x006d,
    "macron": 0x00af,
    "minus": 0x2212,
    "minute": 0x2032,
    "msuperior": 0xf6ef,
    "mu": 0x00b5,
    "multiply": 0x00d7,
    "n": 0x006e,
    "nine": 0x0039,
    "nineinferior": 0x2089,
    "nineoldstyle": 0xf739,
    "ninesuperior": 0x2079,
    "notelement": 0x2209,
    "notequal": 0x2260,
    "notsubset": 0x2284,
    "nsuperior": 0x207f,
    "ntilde": 0x00f1,
    "nu": 0x03bd,
    "numbersign": 0x0023,
    "o": 0x006f,
    "oacute": 0x00f3,
    "ocircumflex": 0x00f4,
    "odieresis": 0x00f6,
    "oe": 0x0153,
    "ogonek": 0x02db,
    "ograve": 0x00f2,
    "omega": 0x03c9,
    "omega1": 0x03d6,
    "omicron": 0x03bf,
    "one": 0x0031,
    "onedotenleader": 0x2024,
    "oneeighth": 0x215b,
    "onefitted": 0xf6dc,
    "onehalf": 0x00bd,
    "oneinferior": 0x2081,
    "oneoldstyle": 0xf731,
    "onequarter": 0x00bc,
    "onesuperior": 0x00b9,
    "onethird": 0x2153,
    "ordfeminine": 0x00aa,
    "ordmasculine": 0x00ba,
    "oslash": 0x00f8,
    "osuperior": 0xf6f0,
    "otilde": 0x00f5,
    "p": 0x0070,
    "paragraph": 0x00b6,
    "parenleft": 0x0028,
    "parenleftbt": 0xf8ed,
    "parenleftex": 0xf8ec,
    "parenleftinferior": 0x208d,
    "parenleftsuperior": 0x207d,
    "parenlefttp": 0xf8eb,
    "parenright": 0x0029,
    "parenrightbt": 0xf8f8,
    "parenrightex": 0xf8f7,
    "parenrightinferior": 0x208e,
    "parenrightsuperior": 0x207e,
    "parenrighttp": 0xf8f6,
    "partialdiff": 0x2202,
    "percent": 0x0025,
    "period": 0x002e,
    "periodcentered": 0x00b7,
    "periodinferior": 0xf6e7,
    "periodsuperior": 0xf6e8,
    "perpendicular": 0x22a5,
    "perthousand": 0x2030,
    "phi": 0x03c6,
    "phi1": 0x03d5,
    "pi": 0x03c0,
    "plus": 0x002b,
    "plusminus": 0x00b1,
    "product": 0x220f,
    "propersubset": 0x2282,
    "propersuperset": 0x2283,
    "proportional": 0x221d,
    "psi": 0x03c8,
    "q": 0x0071,
    "question": 0x003f,
    "questiondown": 0x00bf,
    "questiondownsmall": 0xf7bf,
    "questionsmall": 0xf73f,
    "quotedbl": 0x0022,
    "quotedblbase": 0x201e,
    "quotedblleft": 0x201c,
    "quotedblright": 0x201d,
    "quoteleft": 0x2018,
    "quoteright": 0x2019,
    "quotesinglbase": 0x201a,
    "quotesingle": 0x0027,
    "r": 0x0072,
    "radical": 0x221a,
    "radicalex": 0xf8e5,
    "reflexsubset": 0x2286,
    "reflexsuperset": 0x2287,
    "registered": 0x00ae,
    "registersans": 0xf8e8,
    "registerserif": 0xf6da,
    "rho": 0x03c1,
    "ring": 0x02da,
    "rsuperior": 0xf6f1,
    "rupiah": 0xf6dd,
    "s": 0x0073,
    "scaron": 0x0161,
    "second": 0x2033,
    "section": 0x00a7,
    "semicolon": 0x003b,
    "seven": 0x0037,
    "seveneighths": 0x215e,
    "seveninferior": 0x2087,
    "sevenoldstyle": 0xf737,
    "sevensuperior": 0x2077,
    "sigma": 0x03c3,
    "sigma1": 0x03c2,
    "similar": 0x223c,
    "six": 0x0036,
    "sixinferior": 0x2086,
    "sixoldstyle": 0xf736,
    "sixsuperior": 0x2076,
    "slash": 0x002f,
    "space": 0x0020,
    "spade": 0x2660,
    "ssuperior": 0xf6f2,
    "sterling": 0x00a3,
    "suchthat": 0x220b,
    "summation": 0x2211,
    "t": 0x0074,
    "tau": 0x03c4,
    "therefore": 0x2234,
    "theta": 0x03b8,
    "theta1": 0x03d1,
    "thorn": 0x00fe,
    "three": 0x0033,
    "threeeighths": 0x215c,
    "threeinferior": 0x2083,
    "threeoldstyle": 0xf733,
    "threequarters": 0x00be,
    "threequartersemdash": 0xf6de,
    "threesuperior": 0x00b3,
    "tilde": 0x02dc,
    "trademark": 0x2122,
    "trademarksans": 0xf8ea,
    "trademarkserif": 0xf6db,
    "tsuperior": 0xf6f3,
    "two": 0x0032,
    "twodotenleader": 0x2025,
    "twoinferior": 0x2082,
    "twooldstyle": 0xf732,
    "twosuperior": 0x00b2,
    "twothirds": 0x2154,
    "u": 0x0075,
    "uacute": 0x00fa,
    "ucircumflex": 0x00fb,
    "udieresis": 0x00fc,
    "ugrave": 0x00f9,
    "underscore": 0x005f,
    "union": 0x222a,
    "universal": 0x2200,
    "upsilon": 0x03c5,
    "v": 0x0076,
    "w": 0x0077,
    "weierstrass": 0x2118,
    "x": 0x0078,
    "xi": 0x03be,
    "y": 0x0079,
    "yacute": 0x00fd,
    "ydieresis": 0x00ff,
    "yen": 0x00a5,
    "z": 0x007a,
    "zcaron": 0x017e,
    "zero": 0x0030,
    "zeroinferior": 0x2080,
    "zerooldstyle": 0xf730,
    "zerosuperior": 0x2070,
    "zeta": 0x03b6,

    // Zapf
    "a100": 0x275E,
    "a101": 0x2761,
    "a102": 0x2762,
    "a103": 0x2763,
    "a104": 0x2764,
    "a105": 0x2710,
    "a106": 0x2765,
    "a107": 0x2766,
    "a108": 0x2767,
    "a109": 0x2660,
    "a10": 0x2721,
    "a110": 0x2665,
    "a111": 0x2666,
    "a112": 0x2663,
    "a117": 0x2709,
    "a118": 0x2708,
    "a119": 0x2707,
    "a11": 0x261B,
    "a120": 0x2460,
    "a121": 0x2461,
    "a122": 0x2462,
    "a123": 0x2463,
    "a124": 0x2464,
    "a125": 0x2465,
    "a126": 0x2466,
    "a127": 0x2467,
    "a128": 0x2468,
    "a129": 0x2469,
    "a12": 0x261E,
    "a130": 0x2776,
    "a131": 0x2777,
    "a132": 0x2778,
    "a133": 0x2779,
    "a134": 0x277A,
    "a135": 0x277B,
    "a136": 0x277C,
    "a137": 0x277D,
    "a138": 0x277E,
    "a139": 0x277F,
    "a13": 0x270C,
    "a140": 0x2780,
    "a141": 0x2781,
    "a142": 0x2782,
    "a143": 0x2783,
    "a144": 0x2784,
    "a145": 0x2785,
    "a146": 0x2786,
    "a147": 0x2787,
    "a148": 0x2788,
    "a149": 0x2789,
    "a14": 0x270D,
    "a150": 0x278A,
    "a151": 0x278B,
    "a152": 0x278C,
    "a153": 0x278D,
    "a154": 0x278E,
    "a155": 0x278F,
    "a156": 0x2790,
    "a157": 0x2791,
    "a158": 0x2792,
    "a159": 0x2793,
    "a15": 0x270E,
    "a160": 0x2794,
    "a161": 0x2192,
    "a162": 0x27A3,
    "a163": 0x2194,
    "a164": 0x2195,
    "a165": 0x2799,
    "a166": 0x279B,
    "a167": 0x279C,
    "a168": 0x279D,
    "a169": 0x279E,
    "a16": 0x270F,
    "a170": 0x279F,
    "a171": 0x27A0,
    "a172": 0x27A1,
    "a173": 0x27A2,
    "a174": 0x27A4,
    "a175": 0x27A5,
    "a176": 0x27A6,
    "a177": 0x27A7,
    "a178": 0x27A8,
    "a179": 0x27A9,
    "a17": 0x2711,
    "a180": 0x27AB,
    "a181": 0x27AD,
    "a182": 0x27AF,
    "a183": 0x27B2,
    "a184": 0x27B3,
    "a185": 0x27B5,
    "a186": 0x27B8,
    "a187": 0x27BA,
    "a188": 0x27BB,
    "a189": 0x27BC,
    "a18": 0x2712,
    "a190": 0x27BD,
    "a191": 0x27BE,
    "a192": 0x279A,
    "a193": 0x27AA,
    "a194": 0x27B6,
    "a195": 0x27B9,
    "a196": 0x2798,
    "a197": 0x27B4,
    "a198": 0x27B7,
    "a199": 0x27AC,
    "a19": 0x2713,
    "a1": 0x2701,
    "a200": 0x27AE,
    "a201": 0x27B1,
    "a202": 0x2703,
    "a203": 0x2750,
    "a204": 0x2752,
    "a205": 0x276E,
    "a206": 0x2770,
    "a20": 0x2714,
    "a21": 0x2715,
    "a22": 0x2716,
    "a23": 0x2717,
    "a24": 0x2718,
    "a25": 0x2719,
    "a26": 0x271A,
    "a27": 0x271B,
    "a28": 0x271C,
    "a29": 0x2722,
    "a2": 0x2702,
    "a30": 0x2723,
    "a31": 0x2724,
    "a32": 0x2725,
    "a33": 0x2726,
    "a34": 0x2727,
    "a35": 0x2605,
    "a36": 0x2729,
    "a37": 0x272A,
    "a38": 0x272B,
    "a39": 0x272C,
    "a3": 0x2704,
    "a40": 0x272D,
    "a41": 0x272E,
    "a42": 0x272F,
    "a43": 0x2730,
    "a44": 0x2731,
    "a45": 0x2732,
    "a46": 0x2733,
    "a47": 0x2734,
    "a48": 0x2735,
    "a49": 0x2736,
    "a4": 0x260E,
    "a50": 0x2737,
    "a51": 0x2738,
    "a52": 0x2739,
    "a53": 0x273A,
    "a54": 0x273B,
    "a55": 0x273C,
    "a56": 0x273D,
    "a57": 0x273E,
    "a58": 0x273F,
    "a59": 0x2740,
    "a5": 0x2706,
    "a60": 0x2741,
    "a61": 0x2742,
    "a62": 0x2743,
    "a63": 0x2744,
    "a64": 0x2745,
    "a65": 0x2746,
    "a66": 0x2747,
    "a67": 0x2748,
    "a68": 0x2749,
    "a69": 0x274A,
    "a6": 0x271D,
    "a70": 0x274B,
    "a71": 0x25CF,
    "a72": 0x274D,
    "a73": 0x25A0,
    "a74": 0x274F,
    "a75": 0x2751,
    "a76": 0x25B2,
    "a77": 0x25BC,
    "a78": 0x25C6,
    "a79": 0x2756,
    "a7": 0x271E,
    "a81": 0x25D7,
    "a82": 0x2758,
    "a83": 0x2759,
    "a84": 0x275A,
    "a85": 0x276F,
    "a86": 0x2771,
    "a87": 0x2772,
    "a88": 0x2773,
    "a89": 0x2768,
    "a8": 0x271F,
    "a90": 0x2769,
    "a91": 0x276C,
    "a92": 0x276D,
    "a93": 0x276A,
    "a94": 0x276B,
    "a95": 0x2774,
    "a96": 0x2775,
    "a97": 0x275B,
    "a98": 0x275C,
    "a99": 0x275D,
    "a9": 0x2720
};

var StandardFonts = {
    "Times-Roman": {
    },
    "Times-Bold": {
    },
    "Times-Italic": {
    },
    "Times-BoldItalic": {
    },
    // Notice Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.
    "Helvetica": {
        W: [278,278,355,556,556,889,667,222,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,222,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,580,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,333,556,556,167,556,556,556,556,191,333,556,333,333,500,500,0,556,556,556,278,0,537,350,222,333,333,556,1000,1000,0,611,0,333,333,333,333,333,333,333,333,0,333,333,0,333,333,333,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,370,0,0,0,0,556,778,1000,365,0,0,0,0,0,889,0,0,0,278,0,0,222,611,944,611],
        FirstChar: 32,
        LastChar: 251,
        FontDescriptor: {
            FontName: "Helvetica",
            FontFamily: "Helvetica",
            Weight: "Medium",
            ItalicAngle: 0,
            IsFixedPitch: false,
            CharSet: "ExtendedRoman",
            FontBBox: [-166, -225, 1000, 931],
            CapHeight: 718,
            XHeight: 523,
            Ascender: 718,
            Descender: -207
        }
    },
    "Helvetica-Bold": {
    },
    "Helvetica-Oblique": {
    },
    "Helvetica-BoldOblique": {
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