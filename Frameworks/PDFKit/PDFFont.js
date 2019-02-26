// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFFont, PDFName, PDFType1Font, PDFType0Font, PDFTrueTypeFont, PDFMMType1Font, PDFType3Font, PDFCIDFontType0Font, PDFCIDFontType1Font */
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
        value: function PDFType1Font_load(completion, target){
            completion.call(target);
        }
    },

    stringFromData: {
        value: function PDFType1Font_stringFromData(data){
            return null;
        }
    },

    widthOfData: {
        value: function PDFType1Font_widthOfData(data){
            return 0;
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
                code = data.bytes[i];
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
                index = data.bytes[i];
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
            var loadFontFile = function(){
                if (!this.FontDescriptor){
                    next.call(this);
                    return;
                }
                if (this.FontDescriptor.FontFile2){
                    this.FontDescriptor.FontFile2.getData(function(ttf){
                        // TODO: make JSFont from ttf
                        // needs to eventually modify page style and add
                        // a font-face and be accessible via a URL (blob, likely)
                        // 
                        // - UIHTMLDisplayServerContext setFont should take care of adding font-face CSS
                        //   so it somehow needs to know that this a font that hasn't been added yet.
                        //   Maybe all fonts get added to CSS this way instead of via build?
                        next.call(this);       
                    }, this);
                }else if (this.FontDescriptor.FontFile3 && this.FontDescriptor.FontFile3.SubType == "OpenType"){
                    this.FontDescriptor.FontFile3.getData(function(otf){
                        // TODO: make JSFont from ttf
                        // needs to eventually modify page style and add
                        // a font-face and be accessible via a URL (blob, likely)
                        // 
                        // - UIHTMLDisplayServerContext setFont should take care of adding font-face CSS
                        //   so it somehow needs to know that this a font that hasn't been added yet.
                        //   Maybe all fonts get added to CSS this way instead of via build?
                        next.call(this);
                    }, this);
                }else{
                    next.call(this);
                }
            };
            var loadEncoding = function(){
                if (this._cachedEncoding){
                    next.call(this);
                    return;
                }
                // Create encoding object to convert bytes to unicode
                if (this.Encoding){
                    if (this.Encoding instanceof PDFName){
                        this._cachedEncoding = SingleByteEncoding(this.Encoding);
                    }else{
                        if (this.Encoding.BaseEncoding){
                            this._cachedEncoding = SingleByteEncoding(this.Encoding.BaseEncoding, this.Encoding.Differences);
                        }else{
                            // TODO: use built in font encoding if font file is embedded
                            this._cachedEncoding = SingleByteEncoding(PDFName("StandardEncoding"), this.Encoding.Differences);
                        }
                    }
                }else{
                    // TODO: use the font's built in encoding if file is embedded?
                    // TODO: what if it's not embedded?
                    // TODO: maybe standard font stuff...
                }
                next.call(this);
            };

            var steps = [
                loadUnicode,
                loadFontFile,
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
                this._map[code] = namedCharactersToUnicode(codeOrName);
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
// TODO:
// SingleByteEncoding.MacExpertEncoding = [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd];
SingleByteEncoding.WinAnsiEncoding =   [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x20ac,0xfffd,0x201a,0x0192,0x201e,0x2026,0x2020,0x2021,0x02c6,0x2030,0x0160,0x2039,0x0152,0xfffd,0x017d,0xfffd,0xfffd,0x2018,0x2019,0x201c,0x201d,0x2022,0x2013,0x2014,0x02dc,0x2122,0x0161,0x203a,0x0153,0xfffd,0x017e,0x0178,0xfffd,0x00a1,0x00a2,0x00a3,0x00a4,0x00a5,0x00a6,0x00a7,0x00a8,0x00a9,0x00aa,0x00ab,0x00ac,0xfffd,0x00ae,0x00af,0x00b0,0x00b1,0x00b2,0x00b3,0x00b4,0x00b5,0x00b6,0x00b7,0x00b8,0x00b9,0x00ba,0x00bb,0x00bc,0x00bd,0x00be,0x00bf,0x00c0,0x00c1,0x00c2,0x00c3,0x00c4,0x00c5,0x00c6,0x00c7,0x00c8,0x00c9,0x00ca,0x00cb,0x00cc,0x00cd,0x00ce,0x00cf,0x00d0,0x00d1,0x00d2,0x00d3,0x00d4,0x00d5,0x00d6,0x00d7,0x00d8,0x00d9,0x00da,0x00db,0x00dc,0x00dd,0x00de,0x00df,0x00e0,0x00e1,0x00e2,0x00e3,0x00e4,0x00e5,0x00e6,0x00e7,0x00e8,0x00e9,0x00ea,0x00eb,0x00ec,0x00ed,0x00ee,0x00ef,0x00f0,0x00f1,0x00f2,0x00f3,0x00f4,0x00f5,0x00f6,0x00f7,0x00f8,0x00f9,0x00fa,0x00fb,0x00fc,0x00fd,0x00fe,0x00ff];
SingleByteEncoding.StandardEncoding =  [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00a1,0x00a2,0x00a3,0x2044,0x00a5,0x0192,0x00a7,0x00a4,0x0027,0x201c,0x00ab,0x2039,0x203a,0xfb01,0xfb02,0xfffd,0x2013,0x2020,0x2021,0x00b7,0xfffd,0x00b6,0x2022,0x201a,0x201e,0x201d,0x00bb,0x2026,0x2030,0xfffd,0x00bf,0xfffd,0x0060,0x00b4,0x02c6,0x02dc,0x00af,0x02d8,0x02d9,0x00a8,0xfffd,0x02da,0x00b8,0xfffd,0x02dd,0x02db,0x02c7,0x2014,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00c6,0xfffd,0x00aa,0xfffd,0xfffd,0xfffd,0xfffd,0x0141,0x00d8,0x0152,0x00ba,0xfffd,0xfffd,0xfffd,0xfffd,0xfffd,0x00e6,0xfffd,0xfffd,0xfffd,0x0131,0xfffd,0xfffd,0x0142,0x00f8,0x0153,0x00df,0xfffd,0xfffd,0xfffd,0xfffd];
SingleByteEncoding.PDFDocEncoding =    [0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x13,0x14,0x15,0x17,0x17,0x2d8,0x2c7,0x2c6,0x2d9,0x2dd,0x2db,0x2da,0x2dc,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0xfffd,0x2022,0x2020,0x2021,0x2026,0x2014,0x2013,0x0192,0x2044,0x2039,0x203a,0x2212,0x2030,0x201e,0x201c,0x201d,0x2018,0x2019,0x201a,0x2122,0xfb01,0xfb02,0x0141,0x0152,0x0160,0x0178,0x017d,0x0131,0x0142,0x0153,0x0161,0x017e,0xfffd,0x20ac,0x00a1,0x00a2,0x00a3,0x00a4,0x00a5,0x00a6,0x00a7,0x00a8,0x00a9,0x00aa,0x00ab,0x00ac,0xfffd,0x00ae,0x00af,0x00b0,0x00b1,0x00b2,0x00b3,0x00b4,0x00b5,0x00b6,0x00b7,0x00b8,0x00b9,0x00ba,0x00bb,0x00bc,0x00bd,0x00be,0x00bf,0x00c0,0x00c1,0x00c2,0x00c3,0x00c4,0x00c5,0x00c6,0x00c7,0x00c8,0x00c9,0x00ca,0x00cb,0x00cc,0x00cd,0x00ce,0x00cf,0x00d0,0x00d1,0x00d2,0x00d3,0x00d4,0x00d5,0x00d6,0x00d7,0x00d8,0x00d9,0x00da,0x00db,0x00dc,0x00dd,0x00de,0x00df,0x00e0,0x00e1,0x00e2,0x00e3,0x00e4,0x00e5,0x00e6,0x00e7,0x00e8,0x00e9,0x00ea,0x00eb,0x00ec,0x00ed,0x00ee,0x00ef,0x00f0,0x00f1,0x00f2,0x00f3,0x00f4,0x00f5,0x00f6,0x00f7,0x00f8,0x00f9,0x00fa,0x00fb,0x00fc,0x00fd,0x00fe,0x00ff];

var ToUnicodeEncoding = function(cmap){
    if (this === undefined){
        return new ToUnicodeEncoding(cmap);
    }
    this.validRanges = [];
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

ToUnicodeEncoding.prototype = {

    validRanges: null,
    characterMap: null,

    stringForByte: function(byte){
        // TODO: look at single character map
        // TODO: look at range maps
        // TODO: final fallback should be what?
    },

    begincodespacerange: function(count){
    },

    endcodespacerange: function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var low;
        var high;
        var a = 0;
        for (var i = 0, l = args.length / 2; i < l; ++i){
            low = args[a++];
            high = args[a++];
            this.validRanges[i] = {low: low, high: high};
        }
    },

    beginbfrange: function(count){
    },

    endbfrange: function(){
        var args = Array.prototype.slice.call(arguments, 0);
    },

    beginbfchar: function(count){
    },

    endbfchar: function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var code;
        var unicode;
        var a = 0;
        for (var i = 0, l = args.length / 2; i < l; ++i){
            code = args[a++];
            unicode = args[a++];
            // TODO: add to characterMap
        }
    }

};

var namedCharactersToUnicode = {
"A": 65,
"AE": 198,
"Aacute": 193,
"Acircumflex": 194,
"Adieresis": 196,
"Agrave": 192,
"Aring": 197,
"Atilde": 195,
"B": 66,
"C": 67,
"Ccedilla": 199,
"D": 68,
"E": 69,
"Eacute": 201,
"Ecircumflex": 202,
"Edieresis": 203,
"Egrave": 200,
"Eth": 208,
"Euro": 8364,
"F": 70,
"G": 71,
"H": 72,
"I": 73,
"Iacute": 205,
"Icircumflex": 206,
"Idieresis": 207,
"Igrave": 204,
"J": 74,
"K": 75,
"L": 76,
"Lslash": 321,
"M": 77,
"N": 78,
"NULL": 65533,
"Ntilde": 209,
"O": 79,
"OE": 338,
"Oacute": 211,
"Ocircumflex": 212,
"Odieresis": 214,
"Ograve": 210,
"Oslash": 216,
"Otilde": 213,
"P": 80,
"Q": 81,
"R": 82,
"S": 83,
"Scaron": 352,
"T": 84,
"Thorn": 222,
"U": 85,
"Uacute": 218,
"Ucircumflex": 219,
"Udieresis": 220,
"Ugrave": 217,
"V": 86,
"W": 87,
"X": 88,
"Y": 89,
"Yacute": 221,
"Ydieresis": 376,
"Z": 90,
"Zcaron": 381,
"a": 97,
"aacute": 225,
"acircumflex": 226,
"acute": 180,
"adieresis": 228,
"ae": 230,
"agrave": 224,
"ampersand": 38,
"aring": 229,
"asciicircum": 94,
"asciitilde": 126,
"asterisk": 42,
"at": 64,
"atilde": 227,
"b": 98,
"backslash": 92,
"bar": 124,
"braceleft": 123,
"braceright": 125,
"bracketleft": 91,
"bracketright": 93,
"breve": 728,
"brokenbar": 166,
"bullet": 8226,
"c": 99,
"caron": 711,
"ccedilla": 231,
"cedilla": 184,
"cent": 162,
"circumflex": 710,
"colon": 58,
"comma": 44,
"copyright": 169,
"currency": 164,
"d": 100,
"dagger": 8224,
"daggerdbl": 8225,
"degree": 176,
"dieresis": 168,
"divide": 247,
"dollar": 36,
"dotaccent": 729,
"dotlessi": 305,
"e": 101,
"eacute": 233,
"ecircumflex": 234,
"edieresis": 235,
"egrave": 232,
"eight": 56,
"ellipsis": 8230,
"emdash": 8212,
"endash": 8211,
"equal": 61,
"eth": 240,
"exclam": 33,
"exclamdown": 161,
"f": 102,
"fi": 64257,
"five": 53,
"fl": 64258,
"florin": 402,
"four": 52,
"fraction": 8260,
"g": 103,
"germandbls": 223,
"grave": 96,
"greater": 62,
"guillemotleft": 171,
"guillemotright": 187,
"guilsinglleft": 8249,
"guilsinglright": 8250,
"h": 104,
"hungarumlaut": 733,
"hyphen": 45,
"i": 105,
"iacute": 237,
"icircumflex": 238,
"idieresis": 239,
"igrave": 236,
"j": 106,
"k": 107,
"l": 108,
"less": 60,
"logicalnot": 172,
"lslash": 322,
"m": 109,
"macron": 175,
"minus": 8722,
"mu": 181,
"multiply": 215,
"n": 110,
"nine": 57,
"ntilde": 241,
"numbersign": 35,
"o": 111,
"oacute": 243,
"ocircumflex": 244,
"odieresis": 246,
"oe": 339,
"ogonek": 731,
"ograve": 242,
"one": 49,
"onehalf": 189,
"onequarter": 188,
"onesuperior": 185,
"ordfeminine": 170,
"ordmasculine": 186,
"oslash": 248,
"otilde": 245,
"p": 112,
"paragraph": 182,
"parenleft": 40,
"parenright": 41,
"percent": 37,
"period": 46,
"periodcentered": 183,
"perthousand": 8240,
"plus": 43,
"plusminus": 177,
"q": 113,
"question": 63,
"questiondown": 191,
"quotedbl": 34,
"quotedblbase": 8222,
"quotedblleft": 8220,
"quotedblright": 8221,
"quoteleft": 8216,
"quoteright": 8217,
"quotesinglbase": 8218,
"quotesingle": 39,
"r": 114,
"registered": 174,
"ring": 730,
"s": 115,
"scaron": 353,
"section": 167,
"semicolon": 59,
"seven": 55,
"six": 54,
"slash": 47,
"space": 32,
"sterling": 163,
"t": 116,
"thorn": 254,
"three": 51,
"threequarters": 190,
"threesuperior": 179,
"tilde": 732,
"trademark": 8482,
"two": 50,
"twosuperior": 178,
"u": 117,
"uacute": 250,
"ucircumflex": 251,
"udieresis": 252,
"ugrave": 249,
"underscore": 95,
"v": 118,
"w": 119,
"x": 120,
"y": 121,
"yacute": 253,
"ydieresis": 255,
"yen": 165,
"z": 122,
"zcaron": 382,
"zero": 48
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