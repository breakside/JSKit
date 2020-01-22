// #import "PDFFilter.js"
'use strict';

JSClass("PDFCryptFilter", PDFFilter, {

    name: null,

    initWithParametersDictionary: function(parameters){
        this.$super.initWithParametersDictionary.call(this, parameters);
        var name = parameters.Name;
        if (name){
            this.name = name;
        }else{
            this.name = PDFName("Identity");
        }
    },

    decode: function(input){
        throw new Error("PDFCryptFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFCryptFilter encode not implemented");
    }
});