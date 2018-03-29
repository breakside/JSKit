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

JSGlobalObject.PDFNameObject.prototype = {
    value: null,
};