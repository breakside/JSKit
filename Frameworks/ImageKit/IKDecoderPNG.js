// #import "ImageKit/IKDecoder.js"
// #import "Zlib/Zlib.js"
/* global IKDecoder, JSClass, JSSize, DataView, JSPoint, IKDecoderPNG, ZlibStream, ArrayBuffer */
'use strict';

(function(){

JSClass("IKDecoderPNG", IKDecoder, {

    callback: null,
    size: null,
    bitDepth: 0,
    colorType: 0,
    compressionMethod: 0,
    filterMethod: 0,
    interlaceMethod: 0,
    dataView: null,
    bitmapBytes: null,
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
    expectedScanlineLength: 0,
    paintOffset: 0,
    paintAdvance: 0,

    decodeData: function(data, callback){
        var bytes = data.bytes;
        this.callback = callback;
        this.dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
        this.readSections();
        callback(this.bitmapBytes);
    },

    readSections: function(){
        var offset = 8;
        var length;
        var type;
        var check;
        var section;
        var method;
        do {
            length = this.dataView.getUint32(offset);
            if (offset + length + 12 > this.dataView.byteLength){
                this.bitmapBytes = null;
            }else{
                offset += 4;
                type = String.fromCharCode(this.dataView.getUint8(offset), this.dataView.getUint8(offset + 1), this.dataView.getUint8(offset + 2), this.dataView.getUint8(offset + 3));
                method = this['read_' + type];
                if (method){
                    section = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + offset, length);
                    offset += length;
                    check = this.dataView.getUint32(offset);
                    offset += 4;
                    if (check == crc(section)){
                        method.call(this, section);
                    }else{
                        this.bitmapBytes = null;
                    }
                }else{
                    offset += length + 4;   
                }
            }
        } while (offset < this.dataView.byteLength - 4 && type != 'IEND' && this.bitmapBytes !== null);
    },

    isValid: function(){
        if (!this.isValidColorTypeAndBitDepth()){
            return false;
        }
        if (this.compressionMethod != IKDecoderPNG.CompressionMethod.deflate){
            return false;
        }
        if (this.filterMethod != IKDecoderPNG.FilterMethod.adaptive){
            return false;
        }
        if (this.interlaceMethod != IKDecoderPNG.InterlaceMethod.standard && this.interlaceMethod != IKDecoderPNG.InterlaceMethod.adam7){
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
        return false;
    },

    read_IHDR: function(bytes){
        if (bytes.length >= 13){
            var header = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
            this.size = JSSize(header.getUint32(0), header.getUint32(4));
            this.bitDepth = bytes[8];
            this.colorType = bytes[9];
            this.compressionMethod = bytes[10];
            this.filterMethod = bytes[11];
            this.interlaceMethod = bytes[12];
            if (this.isValid()){
                switch (this.colorType){
                    case IKDecoderPNG.ColorType.grayscale:
                        this.numberOfComponents = 1;
                        break;
                    case IKDecoderPNG.ColorType.truecolor:
                        this.numberOfComponents = 2;
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
                        this.expectedScanlineLength = this.bytesPerRow + 1;
                        break;
                    case IKDecoderPNG.InterlaceMethod.adam7:
                        this.pass = 1;
                        break;
                }
                this.filterByteOffset = (this.bitDepth < 8) ? 1 : (this.numberOfComponents * this.bitDepth / 8);
                this.bitmapBytes = new Uint8Array(this.bytesPerRow * this.size.height);
            }
        }
    },

    read_cHRM: function(bytes){
        if (this.dataStream !== null || this.bitmapBytes === null){
            return;
        }
        var chroma = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
        if (bytes.length >= 32){
            this.chroma = {
                white:  JSPoint(chroma.getUint32(0)  / 100000,  chroma.getUint32(4)  / 100000),
                red:    JSPoint(chroma.getUint32(8)  / 100000,  chroma.getUint32(12) / 100000),
                green:  JSPoint(chroma.getUint32(16) / 100000,  chroma.getUint32(20) / 100000),
                blue:   JSPoint(chroma.getUint32(24) / 100000,  chroma.getUint32(28) / 100000)
            };
        }
    },

    read_gAMA: function(bytes){
        if (this.dataStream !== null || this.bitmapBytes === null){
            return;
        }
        if (bytes.length >= 4){
            var gamma = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
            this.gamma = gamma.getUint32(0) / 100000;
        }
    },

    read_iCCP: function(bytes){
        if (this.dataStream !== null || this.bitmapBytes === null){
            return;
        }
        // TODO: if we want to support color profiles
    },

    read_sRGB: function(bytes){
        if (this.dataStream !== null || this.bitmapBytes === null){
            return;
        }
        if (bytes.length >= 1){
            this.sRGB = bytes[0];
        }
    },

    read_PLTE: function(bytes){
        if (this.dataStream !== null || this.bitmapBytes === null){
            return;
        }
        if (bytes.length % 3 !== 0){
            return;
        }
        this.palette = [];
        var entries = bytes.length / 3;
        var i = 0;
        var r, g, b;
        while (i < bytes.length){
            r = bytes[i++];
            g = bytes[i++];
            b = bytes[i++];
            this.palette.push([r, g, b]);
        }
    },

    read_tRNS: function(bytes){
        if (this.dataStream !== null || this.bitmapBytes === null){
            return;
        }
        var trans = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
        if (this.colorType == IKDecoderPNG.ColorType.grayscale){
            if (bytes.length >= 2){
                this.alphaSamples = [trans.getUint16(0)];
            }
        }else if (this.colorType == IKDecoderPNG.ColorType.truecolor){
            if (bytes.length >= 6){
                this.alphaSamples = [trans.getUint16(0), trans.getUint16(2), trans.getUint16(4)];
            }
        }else if (this.colorType == IKDecoderPNG.ColorType.indexed){
            if (this.palette !== null && bytes.length >= this.palette.length){
                this.alphaSamples = [];
                for (var i = 0, l = this.palette.length && i < bytes.length; i < l; ++i){
                    this.alphaSamples.push(bytes[i]);
                }
                for (; i < l; ++i){
                    this.alphaSamples.push(255);
                }
            }
        }
    },

    read_IDAT: function(bytes){
        if (this.dataStream === null){
            this.dataStream = new ZlibStream();
            this.dataStream.outputBuffer = new ArrayBuffer(this.bytesPerRow + 1);
        }
        var output;
        this.dataStream.input = bytes;
        do {
            output = this.dataStream.inflate();
            this.receive(output);
        }while (output.length > 0);
    },

    read_IEND: function(bytes){
        this.dataStream = null;
        this.correctColors();
    },

    correctColors: function(){
        if (this.chroma){

        }
    },

    receive: function(bytes){
        var i = 0;
        var l = bytes.length;
        while (i < l){
            for (; i < l && this.scanlineLength < this.expectedScanlineLength; ++i){
                this.scanline[this.scanlineLength++] = bytes[i];
            }
            if (this.scanlineLength == this.expectedScanlineLength){
                this.readScanline();
            }
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
        this.lastScanline = this.scanline;
        this.scanlineLength = 0;
    },

    paintScanline_2_8: function(){
        // RGB 8bpc
        for (var i = 1; i < this.scanlineLength;){
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_2_16: function(){
        // RGB 16bpc
        for (var i = 1; i < this.scanlineLength; i += 6){
            // TODO: rounding
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i + 2];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i + 4];
            this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_6_8: function(){
        // RGBA 8bpc
        for (var i = 1; i < this.scanlineLength;){
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_6_16: function(){
        // RGBA 8bpc
        for (var i = 1; i < this.scanlineLength; i += 8){
            // TODO: rounding
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i + 2];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i + 4];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i + 6];
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_1: function(){
        // Gray 1bpc
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0x80; b > 0; b >>= 1){
                // TODO: don't overrun bitmap row
                this.bitmapBytes[this.paintOffset++] = (this.scanline[i] & b) ? 255 : 0;
                this.bitmapBytes[this.paintOffset++] = (this.scanline[i] & b) ? 255 : 0;
                this.bitmapBytes[this.paintOffset++] = (this.scanline[i] & b) ? 255 : 0;
                this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_2: function(){
        // Gray 2bpc
        var v;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xC0, shift = 6; b > 0; b >>= 2, shift -= 2){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                v = (v << 6) | (v << 4) | (v << 2) | v;
                this.bitmapBytes[this.paintOffset++] = v;
                this.bitmapBytes[this.paintOffset++] = v;
                this.bitmapBytes[this.paintOffset++] = v;
                this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_4: function(){
        // Gray 4bpc
        var v;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xF0, shift = 4; b > 0; b >>= 4, shift -= 4){
                // TODO: don't overrun bitmap row
                v = (this.scanline[i] & b) >> shift;
                v = (v << 4) | v;
                this.bitmapBytes[this.paintOffset++] = v;
                this.bitmapBytes[this.paintOffset++] = v;
                this.bitmapBytes[this.paintOffset++] = v;
                this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_8: function(){
        // Gray 8bpc
        for (var i = 1; i < this.scanlineLength; ++i){
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_0_16: function(){
        // Gray 16bpc
        for (var i = 1; i < this.scanlineLength; i += 2){
            // TODO: rounding
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_4_8: function(){
        // Gray w/ Alpha 8bpc
        for (var i = 1; i < this.scanlineLength;){
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i++];
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_4_16: function(){
        // Gray w/ Alpha 16bpc
        for (var i = 1; i < this.scanlineLength; i += 4){
            // TODO: rounding
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i];
            this.bitmapBytes[this.paintOffset++] = this.scanline[i + 2];
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_1: function(){
        // Indexed 1bpc
        var color;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0x80; b > 0; b >>= 1){
                // TODO: don't overrun bitmap row
                color = this.palette[this.scanline[i]];
                this.bitmapBytes[this.paintOffset++] = color[0];
                this.bitmapBytes[this.paintOffset++] = color[1];
                this.bitmapBytes[this.paintOffset++] = color[2];
                this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_2: function(){
        // Indexed 2bpc
        var color;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xC0, shift = 6; b > 0; b >>= 2, shift -= 2){
                // TODO: don't overrun bitmap row
                color = this.palette[this.scanline[i]];
                this.bitmapBytes[this.paintOffset++] = color[0];
                this.bitmapBytes[this.paintOffset++] = color[1];
                this.bitmapBytes[this.paintOffset++] = color[2];
                this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_4: function(){
        // Indexed 4bpc
        var color;
        for (var i = 1; i < this.scanlineLength; ++i){
            for (var b = 0xF0, shift = 4; b > 0; b >>= 4, shift -= 4){
                // TODO: don't overrun bitmap row
                color = this.palette[this.scanline[i]];
                this.bitmapBytes[this.paintOffset++] = color[0];
                this.bitmapBytes[this.paintOffset++] = color[1];
                this.bitmapBytes[this.paintOffset++] = color[2];
                this.bitmapBytes[this.paintOffset++] = 255;  // TODO: use alpha from tRNS
            }
            this.paintOffset += this.paintAdvance;
        }
    },

    paintScanline_3_8: function(){
        // Indexed 8bpc
        var color;
        for (var i = 1; i < this.scanlineLength; ++i){
            color = this.palette[this.scanline[i]];
            this.bitmapBytes[this.paintOffset++] = color[0];
            this.bitmapBytes[this.paintOffset++] = color[1];
            this.bitmapBytes[this.paintOffset++] = color[2];
            this.bitmapBytes[this.paintOffset++] = 255; // TODO: use alpha from tRNS
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
    },

    unfilter4: function(){
    }

});

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

var crc = function(bytes){
    var check = new Uint32Array(1);
    check[0] = 0xFFFF;
    return check[0];
};

})();