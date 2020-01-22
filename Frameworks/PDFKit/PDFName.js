'use strict';

JSGlobalObject.PDFName = function(value){
    if (this === undefined){
        return new PDFName(value);
    }
    if (value instanceof PDFName){
        this.value = value.value;
    }else{
        this.value = value;
    }
};

JSGlobalObject.PDFName.prototype = Object.create({}, {
    valueDecodingUTF8: {
        configurable: true,
        enumerable: false,
        value: function(){
            var data = this.value.latin1();
            return data.stringByDecodingUTF8();
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