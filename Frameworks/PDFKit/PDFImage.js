// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import ImageKit
// #import "PDFXObject.js"
// #import "PDFColorSpace.js"
// #import "PDFFilter.js"
'use strict';

(function(){

var logger = JSLog("pdfkit", "image");

JSGlobalObject.PDFImage = function(){
    if (this === undefined){
        return new PDFImage();
    }
};

JSGlobalObject.PDFImage.prototype = Object.create(PDFXObject.prototype, {
    Subtype:            { enumerable: true, value: PDFName("Image") },
    Width:              PDFObjectProperty,
    Height:             PDFObjectProperty,
    ColorSpace:         PDFObjectProperty,
    BitsPerComponent:   PDFObjectProperty,
    Intent:             PDFObjectProperty,
    ImageMask:          PDFObjectProperty,
    Mask:               PDFObjectProperty,
    Decode:             PDFObjectProperty,
    Interpolate:        PDFObjectProperty,
    Alternates:         PDFObjectProperty,
    SMask:              PDFObjectProperty,
    SMaskInData:        PDFObjectProperty,
    Name:               PDFObjectProperty,
    StructParent:       PDFObjectProperty,
    ID:                 PDFObjectProperty,
    OPI:                PDFObjectProperty,
    Metadata:           PDFObjectProperty,
    OC:                 PDFObjectProperty,

    filters: {
        value: function PDFStream_getFilters(){
            // Preserving compressed image data can be helpful when trying to extract
            // an image.  For example, we can wrap DCT data as a jpeg instead of decoding
            // fully only to re-encode right away.
            // Therefore, we'll advertise that we have no filters (except Crypt, so decryption
            // can still work), and take care of any decoding ourselves.
            var parent = (Object.getOwnPropertyDescriptor(PDFXObject.prototype, 'filters') || Object.getOwnPropertyDescriptor(PDFStream.prototype, 'filters')).value;
            var filters = parent.call(this);
            if (filters.length > 0 && filters[0].name == "Crypt"){
                return [filters[0]];
            }
            return [];
        }
    },

    _getImageData: {
        value: function PDFImage_getImageData(completion, target){
            var parent = (Object.getOwnPropertyDescriptor(PDFXObject.prototype, 'filters') || Object.getOwnPropertyDescriptor(PDFStream.prototype, 'filters')).value;
            var filters = parent.call(this);
            var final = filters[filters.length - 1];
            var wrapper = this._wrapBitmapData;
            var colorSpace = this.ImageMask ? PDFColorSpace.deviceGray : PDFColorSpace(this.ColorSpace);
            if (filters.length > 0){
                if (final.name == "DCTDecode" && !this.SMask && (!final.params || !final.params.ColorTransform) && !this.Decode){
                    // Rather than decoding and re-encoding a jpeg, just wrap the DCT encoded data
                    // - image must not have an SMask (alpha channel)
                    // - data must not use Decode arrays
                    // - filter must not use a ColorTransform

                    // TODO: inspect data for APP14 Adobe marker with inverted colors flag
                    // If so, we need to decode ourselves
                    filters.pop();
                    wrapper = this._wrapJPEGData;
                }else if (final.name == "JPXDecode"){
                    // Rather than decoding and re-encoding a jpeg2000, just wrap the JPX encode data
                    // Er, maybe not...only Safari supports JPEG 2000 as of 2019
                    // If we decode ourselves, there are some aspects of JPX that are unique,
                    // such as not requiring a ColorSpace
                    filters.pop();
                    wrapper = this._wrapJPEG2000Data;
                }else if (final.name == "FlateDecode" && final.params && final.params.Predictor >= 10 && !this.SMask && !this.Decode){
                    // Flate encode data might be easy to wrap as a PNG, provided certain conditions are met
                    // - data must use a PNG predictor (>= 10)
                    // - image must not have an SMask (alpha channel)
                    // - image must not use Decode arrays
                    // - image must use a compatible color space & bit depth
                    //
                    // If these conditions aren't met, we'll just extract the raw bitmap
                    // and then re-encode as a PNG
                    var colorType = -1;
                    if (colorSpace === PDFColorSpace.deviceGray){
                        colorType = 0; // grayscale
                    }else if (colorSpace instanceof PDFColorSpaceCIEGray){
                        colorType = 0;
                    }else if (colorSpace === PDFColorSpace.deviceRGB){
                        colorType = 2; // truecolor
                    }else if (colorSpace instanceof PDFColorSpaceCIERGB){
                        colorType = 2;
                    }else if (colorSpace instanceof PDFColorSpaceICCBased){
                        if (colorSpace.numberOfComponents == 1){
                            colorType = 0;
                        }else if (colorSpace.numberOfComponents == 3){
                            colorType = 2;
                        }
                    }
                    if (colorType === 0){
                        if (this.BitsPerComponent != 1 && this.BitsPerComponent != 2 && this.BitsPerComponent != 4 && this.BitsPerComponent != 8 && this.BitsPerComponent != 16){
                            colorType = -1;
                        }
                    }else if (colorType == 2){
                        if (this.BitsPerComponent != 8 && this.BitsPerComponent != 16){
                            colorType = -1;
                        }
                    }
                    if (colorType != -1){
                        filters.pop();
                        wrapper = this._wrapPNGData;
                    }
                }
            }
            this.getData(function(data){
                var _filters = PDFFilter.CreateChain(filters);
                for (var i = 0, l = _filters.length; data !== null && i < l; ++i){
                    try{
                        data = _filters[i].decode(data);
                    }catch (e){
                        data = null;
                    }
                }
                if (data === null){
                    completion.call(target, null);
                    return;
                }
                wrapper.call(this, data, colorSpace, function(wrapped){
                    completion.call(target, wrapped); 
                });
            }, this);
        }
    },

    _getFullyDecodedData: {
        value: function PDFImage_getImageData(completion, target){
            var parent = (Object.getOwnPropertyDescriptor(PDFXObject.prototype, 'filters') || Object.getOwnPropertyDescriptor(PDFStream.prototype, 'filters')).value;
            var filters = parent.call(this);
            this.getData(function(data){
                var _filters = PDFFilter.CreateChain(filters);
                for (var i = 0, l = _filters.length; data !== null && i < l; ++i){
                    try{
                        data = _filters[i].decode(data);
                    }catch (e){
                        data = null;
                    }
                }
                if (data === null){
                    completion.call(target, null);
                    return;
                }
                completion.call(target, data);
            }, this);
        }
    },

    _wrapBitmapData: {
        value: function PDFImage_wrapBitmapData(data, colorSpace, completion, target){
            // Currently no support for DeviceN color space
            // - Need to add support in PDFColorSpace, at least for alternate fallbacks
            // - Need to support painting from arbitrary number of input components (currenty only have optimized functions for 1, 3 or 4)
            if (colorSpace instanceof PDFColorSpaceDeviceN){
                completion.call(target, null);
                return;
            }

            colorSpace.load(function(){
                var size = JSSize(this.Width, this.Height);
                var bitsPerComponent = this.ImageMask ? 1 : this.BitsPerComponent;
                var numberOfComponents = colorSpace ? colorSpace.numberOfComponents : 1;
                var bytesPerInputRow = Math.ceil(numberOfComponents * bitsPerComponent * size.width / 8);
                var bytesPerOutputRow = 4 * size.width;
                var bitmapData = JSData.initWithLength(bytesPerOutputRow * size.height);
                var i = 0;
                var o = 0;
                var colors = new ColorLookup(colorSpace, this.Decode, bitsPerComponent);
                var paintfn = paint["input_%d_%d".sprintf(numberOfComponents, bitsPerComponent)];
                for (var row = 0; row < size.height; ++row, i += bytesPerInputRow, o += bytesPerOutputRow){
                    paintfn(data, i, bytesPerInputRow, size.width, bitmapData, o, colors);
                }
                var encode = function(){
                    var bitmap = IKBitmap.initWithData(bitmapData, size);
                    var png = bitmap.encodedData(IKBitmap.Format.png);
                    completion.call(target, png);
                };

                // Alpha channel is specified in the related SMask image
                if (this.SMask){
                    this.SMask._getFullyDecodedData(function(data){
                        var i, o;
                        var l;
                        // TODO: undo preblending with values from Matte property
                        if (this.SMask.BitsPerComponent == 8){
                            if (data.length * 4 == bitmapData.length){
                                i = 0;
                                o = 3;
                                for (l = data.length; i < l; ++i, o += 4){
                                    bitmapData[o] = data[i];
                                }
                            }
                        }else if (this.SMask.BitsPerComponent == 16){
                            if (data.length * 2 == bitmapData.length){
                                i = 0;
                                o = 3;
                                // down-sampling to 8 bits per component by reading
                                // only the high order byte
                                for (l = data.length; i < l; i += 2, o += 4){
                                    bitmapData[o] = data[i];
                                }
                            }
                        }
                        // TODO: support other bit depths
                        // TODO: what if bitmap and SMap dimensions don't match?
                        encode();
                    }, this);
                }else{
                    encode();
                }
            }, this);
        }
    },

    _wrapJPEGData: {
        value: function PDFImage_wrapJPEGData(data, colorSpace, completion, target){
            completion.call(target, data);
        }
    },

    _wrapJPEG2000Data: {
        value: function PDFImage_wrapJPEG2000Data(data, colorSpace, completion, target){
            logger.warn("JPEG2000 format not supported in most browsers");
            completion.call(target, data);
        }
    },

    _wrapPNGData: {
        value: function PDFImage_wrapPNGData(data, colorSpace, completion, target){
            colorSpace.load(function(){
                var Chunk = IKEncoderPNG.Chunk;

                var i, l;
                var chunks = [];

                // Header
                var header = new Chunk("IHDR", 13);
                header.dataView.setUint32(0, this.Width);
                header.dataView.setUint32(4, this.Height);
                header.dataView.setUint8(8, this.BitsPerComponent); // bit depth
                header.dataView.setUint8(9, colorSpace.numberOfComponents == 1 ? 0 : 2); // color type (0 = grayscale, 2 = truecolor)
                header.dataView.setUint8(10, 0); // compression method (0 = flate)
                header.dataView.setUint8(11, 0); // filter method (0 = adaptive)
                header.dataView.setUint8(12, 0); // interlace method (0 = none)
                chunks.push(header);

                var chrm;
                var gamma;

                if (colorSpace instanceof PDFColorSpaceCIEGray){
                    gamma = new Chunk("gAMA", 4);
                    gamma.dataView.setUint32(0, Math.round(colorSpace.gamma * 100000));
                    chunks.push(gamma);
                    chrm = new Chunk("cHRM", 32);
                    chrm.dataView.setUint32(0, Math.round(colorSpace.whitePoint[0] * 100000));
                    chrm.dataView.setUint32(4, Math.round(colorSpace.whitePoint[1] * 100000));
                    chrm.dataView.setUint32(8, 0);
                    chrm.dataView.setUint32(12, 0);
                    chrm.dataView.setUint32(16, 0);
                    chrm.dataView.setUint32(20, 0);
                    chrm.dataView.setUint32(24, 0);
                    chrm.dataView.setUint32(28, 0);
                    chunks.push(chrm);
                }else if (colorSpace instanceof PDFColorSpaceCIERGB){
                    gamma = new Chunk("gAMA", 4);
                    gamma.dataView.setUint32(0, Math.round((colorSpace.gamma[0] + colorSpace.gamma[1] + colorSpace.gamma[2]) / 3 * 100000));
                    chunks.push(gamma);
                    chrm = new Chunk("cHRM", 32);
                    chrm.dataView.setUint32(0, Math.round(colorSpace.whitePoint[0] * 100000));
                    chrm.dataView.setUint32(4, Math.round(colorSpace.whitePoint[1] * 100000));
                    chrm.dataView.setUint32(8, Math.round(colorSpace.matrix[0] * 100000));
                    chrm.dataView.setUint32(12, Math.round(colorSpace.matrix[1] * 100000));
                    chrm.dataView.setUint32(16, Math.round(colorSpace.matrix[3] * 100000));
                    chrm.dataView.setUint32(20, Math.round(colorSpace.matrix[4] * 100000));
                    chrm.dataView.setUint32(24, Math.round(colorSpace.matrix[6] * 100000));
                    chrm.dataView.setUint32(28, Math.round(colorSpace.matrix[7] * 100000));
                    chunks.push(chrm);
                }else if (colorSpace instanceof PDFColorSpaceICCBased){
                    var compressed = Zlib.compress(colorSpace.iccData);
                    var iccp = new Chunk("iCCP", 5 + compressed.length);
                    iccp.dataView.setUint8(0, 0x49); // i
                    iccp.dataView.setUint8(1, 0x63); // c
                    iccp.dataView.setUint8(2, 0x63); // c
                    iccp.dataView.setUint8(3, 0); // null (end of string)
                    iccp.dataView.setUint8(4, 0); // compression method (0 = flate)
                    compressed.copyTo(iccp.data, 5);
                    chunks.push(iccp);
                }

                // Compressed data
                var offset = 0;
                var length;
                do {
                    length = Math.min(0xFFFF, data.length - offset);
                    var idat = new Chunk("IDAT", length);
                    data.subdataInRange(JSRange(offset, length)).copyTo(idat.data, 8);
                    offset += length;
                } while (offset < data.length);

                // End
                chunks.push(new Chunk("IEND"));

                // Checksum and combine all chunk data
                var chunk;
                var dataChunks = [];
                for (i = 0, l = chunks.length; i < l; ++i){
                    chunk = chunks[i];
                    chunk.calculateChecksum();
                    dataChunks.push(chunk.data);
                }
                var png = JSData.initWithChunks(dataChunks);
                completion.call(target, png);
            }, this);
        }
    },

    foundationImage: {
        writable: true,
        value: null,
    },

    load: {
        value: function PDFImage_load(completion, target){
            this._getImageData(function(data){
                if (data !== null){
                    this.foundationImage = JSImage.initWithData(data, JSSize(this.Width, this.Height));
                }
                completion.call(target, null);
            }, this);
        }
    },
});

var interpolate = function(x, xMin, xMax, yMin, yMax){
    return yMin + ((x - xMin) * ((yMax - yMin) / (xMax - xMin)));
};

var ColorLookup = function(colorSpace, decode, bitsPerComponent){
    if (this === undefined){
        return new ColorLookup(colorSpace);
    }
    switch (bitsPerComponent){
        case 1:
            this.max = 1;
            break;
        case 2:
            this.max = 3;
            break;
        case 4:
            this.max = 15;
            break;
        case 8:
            this.max = 255;
            break;
        case 16:
            // we're passing truncated values, to 16 bits per component should act as if it's only 8 bits per component
            this.max = 255;
            break;
    }
    this.colorSpace = colorSpace;
    if (decode){
        this.decode = decode;
    }else{
        if (colorSpace instanceof PDFColorSpaceICCBased){
            colorSpace = colorSpace.alternate;
        }
        if (colorSpace === PDFColorSpace.deviceGray){
            this.decode = [0, 1];
        }else if (colorSpace === PDFColorSpace.deviceRGB){
            this.decode = [0, 1, 0, 1, 0, 1];
        }else if (colorSpace === PDFColorSpace.deviceCMYK){
            this.decode = [0, 1, 0, 1, 0, 1, 0, 1];
        }else if (colorSpace instanceof PDFColorSpaceCIEGray){
            this.decode = [0, 1];
        }else if (colorSpace instanceof PDFColorSpaceCIERGB){
            this.decode = [0, 1, 0, 1, 0, 1];
        }else if (colorSpace instanceof PDFColorSpaceCIELab){
            this.decode = [0, 100, colorSpace.range[0], colorSpace.range[1], colorSpace.range[2], colorSpace.range[3]];
        }else if (colorSpace instanceof PDFColorSpaceIndexed){
            this.decode = [0, this.max];
        }else if (colorSpace instanceof PDFColorSpaceSeparation){
            this.decode = [0, 1];
        }else if (colorSpace instanceof PDFColorSpaceDeviceN){
            this.decode = [];
            for (var i = 0; i < colorSpace.numberOfComponents; ++i){
                this.decode.push(0, 1);
            }
        }
    }
    this._cache = {};
};

ColorLookup.prototype = {
    lookup1: function(a){
        var rgba = this._cache[a];
        if (rgba){
            return rgba;
        }
        var color = this.colorSpace.colorFromComponents([
            interpolate(a, 0, this.max, this.decode[0], this.decode[1])
        ]);
        this._cache[a] = rgba = [
            Math.round(color.red * 255),
            Math.round(color.green * 255),
            Math.round(color.blue * 255),
            Math.round(color.alpha * 255)
        ];
        return rgba;
    },
    lookup3: function(a, b, c){
        var k = (a << 16) | (b << 8) | c;
        var rgba = this._cache[k];
        if (rgba){
            return rgba;
        }
        var color = this.colorSpace.colorFromComponents([
            interpolate(a, 0, this.max, this.decode[0], this.decode[1]),
            interpolate(b, 0, this.max, this.decode[2], this.decode[3]),
            interpolate(c, 0, this.max, this.decode[4], this.decode[5])
        ]);
        this._cache[k] = rgba = [
            Math.round(color.red * 255),
            Math.round(color.green * 255),
            Math.round(color.blue * 255),
            Math.round(color.alpha * 255)
        ];
        return rgba;
    },
    lookup4: function(a, b, c, d){
        var k = (a << 24) | (b << 16) | (c << 8) | d;
        var rgba = this._cache[k];
        if (rgba){
            return rgba;
        }
        var color = this.colorSpace.colorFromComponents([
            interpolate(a, 0, this.max, this.decode[0], this.decode[1]),
            interpolate(b, 0, this.max, this.decode[2], this.decode[3]),
            interpolate(c, 0, this.max, this.decode[4], this.decode[5]),
            interpolate(d, 0, this.max, this.decode[6], this.decode[7])
        ]);
        this._cache[k] = rgba = [
            Math.round(color.red * 255),
            Math.round(color.green * 255),
            Math.round(color.blue * 255),
            Math.round(color.alpha * 255)
        ];
        return rgba;
    }
};

var paint = {

    input_1_1: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0x80, s = 7; s >= 0 && col < cols; mask >>= 1, --s, ++col){
                rgba = colors.lookup1((b & mask) >> s);
                output[o++] = rgba[0];
                output[o++] = rgba[1];
                output[o++] = rgba[2];
                output[o++] = rgba[3];
            }
        }
    },

    input_1_2: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0xC0, s = 6; s >= 0 && col < cols; mask >>= 2, s -= 2, ++col){
                rgba = colors.lookup1((b & mask) >> s);
                output[o++] = rgba[0];
                output[o++] = rgba[1];
                output[o++] = rgba[2];
                output[o++] = rgba[3];
            }
        }
    },

    input_1_4: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0xF0, s = 4; s >= 0 && col < cols; mask >>= 4, s -= 4, ++col){
                rgba = colors.lookup1((b & mask) >> s);
                output[o++] = rgba[0];
                output[o++] = rgba[1];
                output[o++] = rgba[2];
                output[o++] = rgba[3];
            }
        }
    },

    input_1_8: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var rgba;
        for (var l = i + cols; i < l; ++i){
            rgba = colors.lookup1(input[i]);
            output[o++] = rgba[0];
            output[o++] = rgba[1];
            output[o++] = rgba[2];
            output[o++] = rgba[3];
        }
    },

    input_1_16: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var rgba;
        // donsampling by only considering high order byte
        for (var l = i + cols * 2; i < l; i += 2){
            rgba = colors.lookup1(input[i]);
            output[o++] = rgba[0];
            output[o++] = rgba[1];
            output[o++] = rgba[2];
            output[o++] = rgba[3];
        }
    },

    input_3_1: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        var components = [0, 0, 0];
        var c = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0x80, s = 7; s >= 0 && col < cols; mask >>= 1, --s){
                components[c++] = (b & mask) >> s;
                if (c == 3){
                    rgba = colors.lookup3(c[0], c[1], c[2]);
                    output[o++] = rgba[0];
                    output[o++] = rgba[1];
                    output[o++] = rgba[2];
                    output[o++] = rgba[3];
                    ++col;
                    c = 0;
                }
            }
        }
    },

    input_3_2: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        var components = [0, 0, 0];
        var c = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0xC0, s = 6; s >= 0 && col < cols; mask >>= 2, s -= 2){
                components[c++] = (b & mask) >> s;
                if (c == 3){
                    rgba = colors.lookup3(c[0], c[1], c[2]);
                    output[o++] = rgba[0];
                    output[o++] = rgba[1];
                    output[o++] = rgba[2];
                    output[o++] = rgba[3];
                    ++col;
                    c = 0;
                }
            }
        }
    },

    input_3_4: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        var components = [0, 0, 0];
        var c = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0xF0, s = 4; s >= 0 && col < cols; mask >>= 4, s -= 4, ++col){
                components[c++] = (b & mask) >> s;
                if (c == 3){
                    rgba = colors.lookup3(c[0], c[1], c[2]);
                    output[o++] = rgba[0];
                    output[o++] = rgba[1];
                    output[o++] = rgba[2];
                    output[o++] = rgba[3];
                    ++col;
                    c = 0;
                }
            }
        }
    },

    input_3_8: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var rgba;
        for (var l = i + cols * 3; i < l; i += 3){
            rgba = colors.lookup3(input[i], input[i + 1], input[i + 2]);
            output[o++] = rgba[0];
            output[o++] = rgba[1];
            output[o++] = rgba[2];
            output[o++] = rgba[3];
        }
    },

    input_3_16: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var rgba;
        // donsampling by only considering high order byte
        for (var l = i + cols * 6; i < l; i += 6){
            rgba = colors.lookup3(input[i], input[i + 2], input[i + 4]);
            output[o++] = rgba[0];
            output[o++] = rgba[1];
            output[o++] = rgba[2];
            output[o++] = rgba[3];
        }
    },

    input_4_1: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        var components = [0, 0, 0, 0];
        var c = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0x80, s = 7; s >= 0 && col < cols; mask >>= 1, --s){
                components[c++] = (b & mask) >> s;
                if (c == 4){
                    rgba = colors.lookup3(c[0], c[1], c[2], c[3]);
                    output[o++] = rgba[0];
                    output[o++] = rgba[1];
                    output[o++] = rgba[2];
                    output[o++] = rgba[3];
                    ++col;
                    c = 0;
                }
            }
        }
    },

    input_4_2: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        var components = [0, 0, 0, 0];
        var c = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0xC0, s = 6; s >= 0 && col < cols; mask >>= 2, s -= 2){
                components[c++] = (b & mask) >> s;
                if (c == 4){
                    rgba = colors.lookup3(c[0], c[1], c[2], c[3]);
                    output[o++] = rgba[0];
                    output[o++] = rgba[1];
                    output[o++] = rgba[2];
                    output[o++] = rgba[3];
                    ++col;
                    c = 0;
                }
            }
        }
    },

    input_4_4: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var b;
        var rgba;
        var col = 0;
        var components = [0, 0, 0, 0];
        var c = 0;
        for (var l = i + bytesPerInputRow; i < l; ++i){
            b = input[i];
            for (var mask = 0xF0, s = 4; s >= 0 && col < cols; mask >>= 4, s -= 4, ++col){
                components[c++] = (b & mask) >> s;
                if (c == 4){
                    rgba = colors.lookup4(c[0], c[1], c[2], c[3]);
                    output[o++] = rgba[0];
                    output[o++] = rgba[1];
                    output[o++] = rgba[2];
                    output[o++] = rgba[3];
                    ++col;
                    c = 0;
                }
            }
        }
    },

    input_4_8: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var rgba;
        for (var l = i + cols * 4; i < l; i += 4){
            rgba = colors.lookup3(input[i], input[i + 1], input[i + 2], input[i + 3]);
            output[o++] = rgba[0];
            output[o++] = rgba[1];
            output[o++] = rgba[2];
            output[o++] = rgba[3];
        }
    },

    input_4_16: function(input, i, bytesPerInputRow, cols, output, o, colors){
        var rgba;
        // donsampling by only considering high order byte
        for (var l = i + cols * 8; i < l; i += 8){
            rgba = colors.lookup3(input[i], input[i + 2], input[i + 4], input[i + 6]);
            output[o++] = rgba[0];
            output[o++] = rgba[1];
            output[o++] = rgba[2];
            output[o++] = rgba[3];
        }
    }
};

})();