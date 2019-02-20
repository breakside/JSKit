/* global JSGlobalObject, PDFNameObject */
'use strict';

JSGlobalObject.PDFNameObject = function(value){
    if (this === undefined){
        return new PDFNameObject(value);
    }
    if (value instanceof PDFNameObject){
        this.value = value.value;
    }else{
        this.value = value;
    }
};

JSGlobalObject.PDFNameObject.prototype = Object.create({}, {
    valueDecodingUTF8: {
        configurable: true,
        enumerable: false,
        value: function(){
            var data = this.value.latin1();
            return data.bytes.stringByDecodingUTF8();
        }
    },

    toString: {
        configurable: true,
        enumerable: false,
        value: function(){
            return this.value;
        }
    }
});