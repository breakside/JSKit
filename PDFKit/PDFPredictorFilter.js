// #import "PDFKit/PDFFilter.js"
/* global JSClass, PDFFilter, Deflate */
'use strict';

JSClass("PDFPredictorFilter", PDFFilter, {

    predictor: 1,
    colorSamples: 1,
    bitsPerComponent: 8,
    columns: 1,

    initWithParametersDictionary: function(params){
        if (params.Predictor){
            this.predictor = params.Predictor;
        }
        if (params.Colors){
            this.colorSamples = params.Colors;
        }
        if (params.BitsPerComponent){
            this.bitsPerComponent = params.BitsPerComponent;
        }
        if (params.Columns){
            this.columns = params.Columns;
        }
    },

    decode: function(data){
        var decoded = this.decodePrimaryData(data);
        if (this.predictor > 1){
            throw new Error("PDFKit filter does not support predictors");
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