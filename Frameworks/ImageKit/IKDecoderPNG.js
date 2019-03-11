// https://www.w3.org/TR/2003/REC-PNG-20031110/
// #import "ImageKit/IKDecoder.js"
// #import "ImageKit/IKBitmap.js"
// #import "ImageKit/IKColorSpace.js"
/* global IKDecoder, IKBitmap, JSClass, JSSize, JSPoint, IKDecoderPNG, ZlibStream, JSData, IKColorSpace */
'use strict';

(function(){

JSClass("IKDecoderPNG", IKDecoder, {

    format: IKBitmap.Format.png,

    bitmapData: null,
    colorSpace: null,
    size: null,
    bitDepth: 0,
    colorType: 0,
    compressionMethod: 0,
    filterMethod: 0,
    interlaceMethod: 0,
    dataView: null,
    error: null,
    dataStream: null,
    chroma: null,
    gamma: null,
    sRGB: null,
    alphaSamples: null,
    bytesPerRow: 0,
    pass: 0,
    lastScanline: null,
    scanline: null,
    scanlineLength: 0,
    paintOffset: 0,
    paintAdvance: 0,

    getBitmap: function(){
        if (this.data.length < 20){
            this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidData, 0, "Not enough data for a valid PNG file");
        }
        if (this.data[0] != 0x89 ||
            this.data[1] != 0x50 ||
            this.data[2] != 0x4E ||
            this.data[3] != 0x47 ||
            this.data[4] != 0x0D ||
            this.data[5] != 0x0A ||
            this.data[6] != 0x1A ||
            this.data[7] != 0x0A){
            this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidData, 0, "PNG magic bytes not valid");
        }
        if (this.error === null && (
            this.data[12] != 0x49 ||
            this.data[13] != 0x48 ||
            this.data[14] != 0x44 ||
            this.data[15] != 0x52)){
            this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidData, 0, "IHDR not found in initial block position");
        }
        if (this.error === null && (((this.data[8] << 24) | (this.data[9] << 16) | (this.data[10] << 8) | this.data[11]) < 13)){
            this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidData, 0, "IHDR length too short");
        }
        if (this.error === null){
            this.dataView = this.data.dataView();
            this.readSections();
        }
        return IKBitmap.initWithData(this.bitmapData, this.size, this.colorSpace);
    },

    readSections: function(){
        var offset = 8;
        var length;
        var type;
        var check;
        var section;
        var method;
        var crc;
        do {
            length = this.dataView.getUint32(offset);
            if (offset + length + 12 > this.dataView.byteLength){
                this.bitmapData = null;
                this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.lengthBeyondEnd, offset, "Length of section extends beyond available data");
            }else{
                offset += 4;
                type = String.fromCharCode(this.dataView.getUint8(offset), this.dataView.getUint8(offset + 1), this.dataView.getUint8(offset + 2), this.dataView.getUint8(offset + 3));
                method = this['read_' + type];
                offset += 4;
                if (method){
                    section = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + offset, length);
                    offset += length;
                    check = this.dataView.getUint32(offset);
                    offset += 4;
                    crc = new CRC();
                    crc.update(new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + offset - length - 8, 4));
                    crc.update(section);
                    if (check == crc.final){
                        method.call(this, section, offset - length - 8);
                    }else{
                        this.bitmapData = null;
                        this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.crcFailed, offset - 4, "CRC for '%s' failed".sprintf(type));
                    }
                }else{
                    offset += length + 4;   
                }
            }
        } while (offset < this.dataView.byteLength - 4 && type != 'IEND' && this.bitmapData !== null);
    },

    isValid: function(){
        if (!this.isValidColorTypeAndBitDepth()){
            return false;
        }
        if (this.compressionMethod != IKDecoderPNG.CompressionMethod.deflate){
            this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidCompression, 8, "Invalid compression methond: %d".sprintf(this.compressionMethod));
            return false;
        }
        if (this.filterMethod != IKDecoderPNG.FilterMethod.adaptive){
            this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidFilter, 8, "Invalid filter methond: %d".sprintf(this.filterMethod));
            return false;
        }
        if (this.interlaceMethod != IKDecoderPNG.InterlaceMethod.standard && this.interlaceMethod != IKDecoderPNG.InterlaceMethod.adam7){
            this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidInterlace, 8, "Invalid interlace methond: %d".sprintf(this.interlaceMethod));
            return false;
        }
        return true;
    },

    isValidColorTypeAndBitDepth: function(){
        switch (this.colorType){
            case IKDecoderPNG.ColorType.grayscale:
                return (this.bitDepth == IKDecoderPNG.BitDepth.one || this.bitDepth == IKDecoderPNG.BitDepth.two || this.bitDepth == IKDecoderPNG.BitDepth.four || this.bitDepth == IKDecoderPNG.BitDepth.eight || this.bitDepth == IKDecoderPNG.BitDepth.sixteen);
            case IKDecoderPNG.ColorType.truecolor:
                return (this.bitDepth == IKDecoderPNG.BitDepth.eight || this.bitDepth == IKDecoderPNG.BitDepth.sixteen);
            case IKDecoderPNG.ColorType.indexed:
                return (this.bitDepth == IKDecoderPNG.BitDepth.one || this.bitDepth == IKDecoderPNG.BitDepth.two || this.bitDepth == IKDecoderPNG.BitDepth.four || this.bitDepth == IKDecoderPNG.BitDepth.eight);
            case IKDecoderPNG.ColorType.grayscaleWithAlpha:
                return (this.bitDepth == IKDecoderPNG.BitDepth.eight || this.bitDepth == IKDecoderPNG.BitDepth.sixteen);
            case IKDecoderPNG.ColorType.truecolorWithAlpha:
                return (this.bitDepth == IKDecoderPNG.BitDepth.eight || this.bitDepth == IKDecoderPNG.BitDepth.sixteen);
        }
        this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.invalidColorTypeAndDepth, 8, "Invalid color type and depth combination: %d color, %d bits".sprintf(this.colorType, this.bitDepth));
        return false;
    },

    read_IHDR: function(data){
        if (data.length >= 13){
            var header = data.dataView();
            this.size = JSSize(header.getUint32(0), header.getUint32(4));
            this.bitDepth = data[8];
            this.colorType = data[9];
            this.compressionMethod = data[10];
            this.filterMethod = data[11];
            this.interlaceMethod = data[12];
            if (this.isValid()){
                switch (this.colorType){
                    case IKDecoderPNG.ColorType.grayscale:
                        this.numberOfComponents = 1;
                        this.alphaSamples = [-1];
                        break;
                    case IKDecoderPNG.ColorType.truecolor:
                        this.numberOfComponents = 3;
                        this.alphaSamples = [-1, -1, -1];
                        break;
                    case IKDecoderPNG.ColorType.indexed:
                        this.numberOfComponents = 1;
                        break;
                    case IKDecoderPNG.ColorType.grayscaleWithAlpha:
                        this.numberOfComponents = 2;
                        break;
                    case IKDecoderPNG.ColorType.truecolorWithAlpha:
                        this.numberOfComponents = 4;
                        break;
                }
                this.paintScanline = this['paintScanline_' + this.colorType + '_' + this.bitDepth];
                this.bytesPerRow = this.size.width * this.bitDepth / 8 * this.numberOfComponents;
                switch  (this.interlaceMethod){
                    case IKDecoderPNG.InterlaceMethod.standard:
                        this.pass = 0;
                        break;
                    case IKDecoderPNG.InterlaceMethod.adam7:
                        this.pass = 1;
                        break;
                }
                this.filterByteOffset = (this.bitDepth < 8) ? 1 : (this.numberOfComponents * this.bitDepth / 8);
                this.bitmapData = JSData.initWithLength(this.size.width * this.size.height * 4);
            }
        }
    },

    read_cHRM: function(data){
        if (this.dataStream !== null || this.bitmapData === null || this.sRGB !== null){
            return;
        }
        var chroma = data.dataView();
        if (data.length >= 32){
            this.chroma = {
                white:  JSPoint(chroma.getUint32(0)  / 100000,  chroma.getUint32(4)  / 100000),
                red:    JSPoint(chroma.getUint32(8)  / 100000,  chroma.getUint32(12) / 100000),
                green:  JSPoint(chroma.getUint32(16) / 100000,  chroma.getUint32(20) / 100000),
                blue:   JSPoint(chroma.getUint32(24) / 100000,  chroma.getUint32(28) / 100000)
            };
        }
    },

    read_gAMA: function(data){
        if (this.dataStream !== null || this.bitmapData === null || this.sRGB !== null){
            return;
        }
        if (data.length >= 4){
            var gamma = data.dataView();
            this.gamma = gamma.getUint32(0) / 100000;
        }
    },

    read_iCCP: function(data){
        if (this.dataStream !== null || this.bitmapData === null || this.sRGB !== null){
            return;
        }
        // IKBitmap is currently defined as only supporting the sRGBA color space
        // So it only makes sense to use the color space info if either:
        // 1. We do the conversion to sRGB ourselves
        // 2. We update IKBitmap to allow different color spaces and do no coversion ourselves
        // this.colorSpace = IKColorSpace.initWithProfileData(data);
    },

    read_sRGB: function(data){
        if (this.dataStream !== null || this.bitmapData === null){
            return;
        }
        this.gamma = null;
        this.chroma = null;
        if (data.length >= 1){
            this.sRGB = data[0];
        }
    },

    read_PLTE: function(data){
        if (this.dataStream !== null || this.bitmapData === null){
            return;
        }
        if (this.colorType != IKDecoderPNG.ColorType.indexed){
            return;
        }
        if (data.length % 3 !== 0){
            return;
        }
        this.palette = [];
        var entries = data.length / 3;
        var i = 0;
        var r, g, b;
        while (i < data.length){
            r = data[i++];
            g = data[i++];
            b = data[i++];
            this.palette.push([r, g, b, 255]);
        }
    },

    read_tRNS: function(data){
        if (this.dataStream !== null || this.bitmapData === null){
            return;
        }
        var trans = data.dataView();
        if (this.colorType == IKDecoderPNG.ColorType.grayscale){
            if (data.length >= 2){
                this.alphaSamples = [trans.getUint16(0)];
            }
        }else if (this.colorType == IKDecoderPNG.ColorType.truecolor){
            if (data.length >= 6){
                this.alphaSamples = [trans.getUint16(0), trans.getUint16(2), trans.getUint16(4)];
            }
        }else if (this.colorType == IKDecoderPNG.ColorType.indexed){
            if (this.palette !== null && data.length >= this.palette.length){
                for (var i = 0, l = this.palette.length && i < data.length; i < l; ++i){
                    this.palette[i][3] = data[i];
                }
            }
        }
    },

    read_IDAT: function(data, offset){
        if (this.dataStream === null){
            if (this.colorType == IKDecoderPNG.ColorType.indexed && this.palette === null){
                this.error = new IKDecoderPNGError(IKDecoderPNG.ErrorCode.missingPalette, offset, "PLTE not found before first IDAT");
                this.bitmapData = null;
                return;
            }
            this.scanline = JSData.initWithLength(this.bytesPerRow + 1);
            this.dataStream = new ZlibStream();
            this.dataStream.output = this.scanline;
        }
        var output;
        this.dataStream.input = data;
        do {
            this.dataStream.outputOffset = this.scanlineLength;
            output = this.dataStream.uncompress();
            this.scanlineLength += output.length;
            if (this.scanlineLength == this.scanline.length){
                this.readScanline();
            }
        }while (output.length > 0);
    },

    read_IEND: function(data){
        this.dataStream = null;
        this.correctColors();
    },

    correctColors: function(){
        // TODO: actually correct colors
        if (this.chroma){
        }
        if (this.gamma !== null){
        }
    },

    readScanline: function(){
        switch (this.scanline[0]){
            case 0:
                this.unfilter0();
                break;
            case 1:
                this.unfilter1();
                break;
            case 2:
                this.unfilter2();
                break;
            case 3:
                this.unfilter3();
                break;
            case 4:
                this.unfilter4();
                break;
        }
        this.paintScanline();
        // TODO: adjust expected scan line length, paintOffset, and set lastScanline to null if at the end of an interlaced pass
        this.copyScanline();
        this.scanlineLength = 0;
    },

    copyScanline: function(){
        if (this.lastScanline === null){
            this.lastScanline = this.scanline;
        }else{
            this.scanline.copyTo(this.lastScanline);
        }
    },

    paintScanline_2_8: function(){
        // RGB 8bpc
        var alpha;
        for (var i = 1; i < this.scanlineLength;){
            alpha = (this.scanline[i] === this.alphaSamples[0] && this.scanline[i + 1] == this.alphaSamples[1] && this.scanline[i + 2] == this.alphaSamples[2]) ? 0 : 255;
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.bitmapData[this.paintOffset++] = alpha;
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_2_16: function(){
        // RGB 16bpc
        var alpha;
        var r, g, b;
        for (var i = 1; i < this.scanlineLength; i += 6){
            r = (this.scanline[i] << 8) | this.scanline[i + 1];
            g = (this.scanline[i + 2] << 8) | this.scanline[i + 3];
            b = (this.scanline[i + 4] << 8) | this.scanline[i + 5];
            alpha = (r == this.alphaSamples[0] && g == this.alphaSamples[1] && b == this.alphaSamples[2]) ? 0 : 255;
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (r + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (g + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (b + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = alpha;
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_6_8: function(){
        // RGBA 8bpc
        for (var i = 1; i < this.scanlineLength;){
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_6_16: function(){
        // RGBA 16bpc
        for (var i = 1; i < this.scanlineLength; i += 8){
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (((this.scanline[i] << 8) | this.scanline[i + 1]) + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (((this.scanline[i + 2] << 8) | this.scanline[i + 3]) + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (((this.scanline[i + 4] << 8) | this.scanline[i + 5]) + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (((this.scanline[i + 6] << 8) | this.scanline[i + 7]) + 0x7F) >> 8);
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_1: function(){
        // Gray 1bpc
        var v;
        var alpha;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0x80, shift = 7; b > 0; b >>= 1, shift--){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                alpha = (v == this.alphaSamples[0]) ? 0 : 255;
                this.bitmapData[this.paintOffset++] = v ? 255 : 0;
                this.bitmapData[this.paintOffset++] = v ? 255 : 0;
                this.bitmapData[this.paintOffset++] = v ? 255 : 0;
                this.bitmapData[this.paintOffset++] = alpha;
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_2: function(){
        // Gray 2bpc
        var v;
        var alpha;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xC0, shift = 6; b > 0; b >>= 2, shift -= 2){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                alpha = (v == this.alphaSamples[0]) ? 0 : 255;
                v = (v << 6) | (v << 4) | (v << 2) | v;
                this.bitmapData[this.paintOffset++] = v;
                this.bitmapData[this.paintOffset++] = v;
                this.bitmapData[this.paintOffset++] = v;
                this.bitmapData[this.paintOffset++] = alpha;
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_4: function(){
        // Gray 4bpc
        var v;
        var alpha;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xF0, shift = 4; b > 0; b >>= 4, shift -= 4){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                alpha = (v == this.alphaSamples[0]) ? 0 : 255;
                v = (v << 4) | v;
                this.bitmapData[this.paintOffset++] = v;
                this.bitmapData[this.paintOffset++] = v;
                this.bitmapData[this.paintOffset++] = v;
                this.bitmapData[this.paintOffset++] = alpha;
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_8: function(){
        // Gray 8bpc
        var alpha;
        for (var i = 1; i < this.scanlineLength; ++i){
            alpha = (this.scanline[i] == this.alphaSamples[0]) ? 0 : 255;
            this.bitmapData[this.paintOffset++] = this.scanline[i];
            this.bitmapData[this.paintOffset++] = this.scanline[i];
            this.bitmapData[this.paintOffset++] = this.scanline[i];
            this.bitmapData[this.paintOffset++] = alpha;
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_16: function(){
        // Gray 16bpc
        var alpha;
        var w;
        for (var i = 1; i < this.scanlineLength; i += 2){
            w = (this.scanline[i] << 8) | this.scanline[i + 1];
            alpha = (w == this.alphaSamples[0]) ? 0 : 255;
            w = Math.min(0xFF, (w + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = w;
            this.bitmapData[this.paintOffset++] = w;
            this.bitmapData[this.paintOffset++] = w;
            this.bitmapData[this.paintOffset++] = alpha;
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_4_8: function(){
        // Gray w/ Alpha 8bpc
        for (var i = 1; i < this.scanlineLength;){
            this.bitmapData[this.paintOffset++] = this.scanline[i];
            this.bitmapData[this.paintOffset++] = this.scanline[i];
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.bitmapData[this.paintOffset++] = this.scanline[i++];
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_4_16: function(){
        // Gray w/ Alpha 16bpc
        var w;
        for (var i = 1; i < this.scanlineLength; i += 4){
            w = Math.min(0xFF, (((this.scanline[i] << 8) | this.scanline[i + 1]) + 0x7F) >> 8);
            this.bitmapData[this.paintOffset++] = w;
            this.bitmapData[this.paintOffset++] = w;
            this.bitmapData[this.paintOffset++] = w;
            this.bitmapData[this.paintOffset++] = Math.min(0xFF, (((this.scanline[i + 2] << 8) | this.scanline[i + 3]) + 0x7F) >> 8);
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_1: function(){
        // Indexed 1bpc
        var color;
        var v;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0x80, shift = 7; b > 0; b >>= 1, --shift){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                color = this.palette[v];
                this.bitmapData[this.paintOffset++] = color[0];
                this.bitmapData[this.paintOffset++] = color[1];
                this.bitmapData[this.paintOffset++] = color[2];
                this.bitmapData[this.paintOffset++] = color[3];
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_2: function(){
        // Indexed 2bpc
        var color;
        var v;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xC0, shift = 6; b > 0; b >>= 2, shift -= 2){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                color = this.palette[v];
                this.bitmapData[this.paintOffset++] = color[0];
                this.bitmapData[this.paintOffset++] = color[1];
                this.bitmapData[this.paintOffset++] = color[2];
                this.bitmapData[this.paintOffset++] = color[3];
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_4: function(){
        // Indexed 4bpc
        var color;
        var v;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xF0, shift = 4; b > 0; b >>= 4, shift -= 4){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                color = this.palette[v];
                this.bitmapData[this.paintOffset++] = color[0];
                this.bitmapData[this.paintOffset++] = color[1];
                this.bitmapData[this.paintOffset++] = color[2];
                this.bitmapData[this.paintOffset++] = color[3];
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_8: function(){
        // Indexed 8bpc
        var color;
        for (var i = 1; i < this.scanlineLength; ++i){
            color = this.palette[this.scanline[i]];
            this.bitmapData[this.paintOffset++] = color[0];
            this.bitmapData[this.paintOffset++] = color[1];
            this.bitmapData[this.paintOffset++] = color[2];
            this.bitmapData[this.paintOffset++] = color[3];
        }
    },

    unfilter0: function(){
        // No-op
    },

    unfilter1: function(){
        var i;
        for (i = 1 + this.filterByteOffset; i < this.scanlineLength; ++i){
            this.scanline[i] = this.scanline[i] + this.scanline[i - this.filterByteOffset];
        }
    },

    unfilter2: function(){
        var i;
        if (this.lastScanline !== null){
            for (i = 1; i < this.scanlineLength; ++i){
                this.scanline[i] = this.scanline[i] + this.lastScanline[i];
            }
        }
    },

    unfilter3: function(){
        var i;
        if (this.lastScanline === null){
            for (i = 1 + this.filterByteOffset; i < this.scanlineLength; ++i){
                this.scanline[i] = this.scanline[i] + (this.scanline[i - this.filterByteOffset] >> 1);
            }
        }else{
            for (i = 1; i < 1 + this.filterByteOffset; ++i){
                this.scanline[i] = this.scanline[i] + (this.lastScanline[i] >> 1);
            }
            for (; i < this.scanlineLength; ++i){
                this.scanline[i] = this.scanline[i] + ((this.scanline[i - this.filterByteOffset] + this.lastScanline[i]) >> 1);
            }
        }
    },

    unfilter4: function(){
        var i;
        if (this.lastScanline === null){
            for (i = 1 + this.filterByteOffset; i < this.scanlineLength; ++i){
                this.scanline[i] = this.scanline[i] + Paeth(this.scanline[i - this.filterByteOffset], 0, 0);
            }
        }else{
            for (i = 1; i < 1 + this.filterByteOffset; ++i){
                this.scanline[i] = this.scanline[i] + Paeth(0, this.lastScanline[i], 0);
            }
            for (; i < this.scanlineLength; ++i){
                this.scanline[i] = this.scanline[i] + Paeth(this.scanline[i - this.filterByteOffset], this.lastScanline[i], this.lastScanline[i - this.filterByteOffset]);
            }
        }
    }

});

var Paeth = function(a, b, c){
    var p = a + b - c;
    var pa = Math.abs(p - a);
    var pb = Math.abs(p - b);
    var pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc){
        return a;
    }
    if (pb <= pc){
        return b;
    }
    return c;
};

IKDecoderPNG.BitDepth = {
    one: 1,
    two: 2,
    four: 4,
    eight: 8,
    sixteen: 16
};

IKDecoderPNG.ColorType = {
    grayscale: 0,
    truecolor: 2,
    indexed: 3,
    grayscaleWithAlpha: 4,
    truecolorWithAlpha: 6
};

IKDecoderPNG.CompressionMethod = {
    deflate: 0
};

IKDecoderPNG.FilterMethod = {
    adaptive: 0
};

IKDecoderPNG.InterlaceMethod = {
    standard: 0,
    adam7: 1
};

IKDecoderPNG.ErrorCode = {
    invalidData: 1,
    lengthBeyondEnd: 2,
    crcFailed: 3,
    invalidCompression: 4,
    invalidFilter: 5,
    invalidInterlace: 6,
    invalidColorTypeAndDepth: 7,
    missingPalette: 8
};

var IKDecoderPNGError = function(code, byteOffset, msg){
    if (this === undefined){
        return new IKDecoderPNGError(code, byteOffset, msg);
    }
    this.name = "IKDecoderPNGError";
    this.code = code;
    this.byteOffset = byteOffset;
    this.msg = msg;
};

IKDecoderPNGError.prototype = Object.create(Error.prototype);

var CRC = function(data){
    if (this === undefined){
        var crc = new CRC();
        crc.update(data);
        return crc.final;
    }
    this.workpad = new Uint32Array([0xFFFFFFFF, 0]);
};

CRC.prototype = Object.create({}, {

    workpad: {writable: true, value: null},

    update: {
        value: function CRC_update(data){
            for (var i = 0, l = data.length; i < l; ++i){
                this.workpad[1] = this.workpad[0] ^ data[i];
                this.workpad[0] = CRC.table[this.workpad[1] & 0xFF] ^ ((this.workpad[0] >> 8) & 0xFFFFFF);
            }
        }
    },

    final: {
        get: function CRC_final(){
            this.workpad[0] = this.workpad[0] ^ 0xFFFFFFFF;
            return this.workpad[0];
        }
    }

});

Object.defineProperty(CRC, 'table', {
    configurable: true,
    get: function(){
        var table = new Uint32Array(256);
        for (var i = 0; i < 256; ++i){
            table[i] = i;
            for (var j = 0; j < 8; ++j){
                if (table[i] & 1){
                    table[i] = 0xEDB88320 ^ ((table[i] >> 1) & 0x7FFFFFFF);
                }else{
                    table[i] = (table[i] >> 1) & 0x7FFFFFFF;
                }
            }
        }
        Object.defineProperty(CRC, 'table', {value: table});
        return table;
    }
});

IKDecoderPNG.CRC = CRC;

})();