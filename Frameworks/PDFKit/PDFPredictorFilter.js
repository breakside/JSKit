// #import "PDFKit/PDFFilter.js"
/* global JSClass, JSData, PDFFilter, Deflate, PDFPredictorFilter */
'use strict';

(function(){

JSClass("PDFPredictorFilter", PDFFilter, {

    predictor: 1,
    colorSamples: 1,
    bitsPerComponent: 8,
    columns: 1,

    initWithParametersDictionary: function(params){
        PDFPredictorFilter.$super.initWithParametersDictionary.call(this, params);
        if ('Predictor' in params){
            this.predictor = params.Predictor;
        }
        if ('Colors' in params){
            this.colorSamples = params.Colors;
        }
        if ('BitsPerComponent' in params){
            this.bitsPerComponent = params.BitsPerComponent;
        }
        if ('Columns' in params){
            this.columns = params.Columns;
        }
    },

    decode: function(data){
        var decoded = this.decodePrimaryData(data);
        switch (this.predictor){
            case 1:
                break;
            // case 2:
            //     decoded = tiffPredictor2.call(this, decoded);
            //     break;
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
                decoded = pngFilter.call(this, decoded);
                break;
            default:
                throw new Error("PDFKit filter does not support predictor %d".sprintf(this.predictor));
        }
        return decoded;
    },

    encode: function(data){
        if (this.predictor > 1){
            throw new Error("PDFKit filter does not support predictors");
        }
        return this.encodePrimaryData(data);
    }
});

var tiffPredictor2 = function(data){
};

var pngFilterNone = function(input, i, output, o, count, stride){
    for (var c = 0; c < count; ++c, ++o, ++i){
        output[o] = input[i];
    }
};

var pngFilterSub = function(input, i, output, o, count, stride){
    var c;
    for (c = 0; c < stride; ++c, ++o, ++i){
        output[o] = input[i];
    }
    for (; c < count; ++c, ++i, ++o){
        output[o] = input[i] + output[o - stride];
    }
};

var pngFilterUp = function(input, i, output, o, count, stride){
    for (var c = 0; c < count; ++c, ++o, ++i){
        output[o] = input[i] + (output[o - count] || 0);
    }
};

var pngFilterAverage = function(input, i, output, o, count, stride){
    var c;
    for (c = 0; c < stride; ++c, ++o, ++i){
        output[o] = input[i] + Math.floor((output[o - count] || 0) / 2);
    }
    for (; c < count; ++c, ++i, ++o){
        output[o] = input[i] + Math.floor((output[o - stride] + (output[o - count] || 0)) / 2);
    }
};

var pngFilterPaeth = function(input, i, output, o, count, stride){
    var c;
    for (c = 0; c < stride; ++c, ++o, ++i){
        output[o] = input[i] + pngPaeth(0, output[o - count] || 0, 0);
    }
    for (; c < count; ++c, ++i, ++o){
        output[o] = input[i] + pngPaeth(output[o - stride], output[o - count] || 0, output[o - count - stride] || 0);
    }
};

var pngFilter = function(data){
    var bytesPerRow = Math.ceil(this.columns * this.bitsPerComponent * this.colorSamples / 8);
    var stride = (this.bitsPerComponent < 8) ? 1 : (this.colorSamples * this.bitsPerComponent / 8);
    var rows = data.length / (bytesPerRow + 1);
    var out = JSData.initWithLength(bytesPerRow * rows);
    var i = 0;
    var o = 0;
    var filter;
    for (var row = 0; row < rows; ++row, i += bytesPerRow, o += bytesPerRow){
        filter = _pngFilter[data.bytes[i++]] || pngFilterNone;
        filter(data.bytes, i, out.bytes, o, bytesPerRow, stride);
    }
    return out;
};

var pngPaeth = function(a, b, c){
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

var _pngFilter = [
    pngFilterNone,
    pngFilterSub,
    pngFilterUp,
    pngFilterAverage,
    pngFilterPaeth
];


})();