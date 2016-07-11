// #import "PDFKit/PDFPredictorFilter.js"
// #import "LZW/LZW.js"
// #import "JSKit/JSKit.js"
/* global JSClass, PDFPredictorFilter, JSData, PDFLZWFilter, LZWStream */
'use strict';

JSClass("PDFLZWFilter", PDFPredictorFilter, {

    bitIncreaseOffset: 1,

    initWithParametersDictionary: function(params){
        PDFLZWFilter.$super.initWithParametersDictionary.call(this, params);
        this.bitIncreaseOffset = params.EarlyChange;
    },

    decodePrimaryData: function(data){
        var stream = new LZWStream(data.bytes);
        stream.bitIncreaseOffset = this.bitIncreaseOffset;
        stream.uncompress();
        return JSData.initWithBytes(stream.output);
    },

    encodePrimaryData: function(data){
        var stream = new LZWStream(data.bytes);
        stream.bitIncreaseOffset = this.bitIncreaseOffset;
        stream.compress();
        return JSData.initWithBytes(stream.output);
    }
});