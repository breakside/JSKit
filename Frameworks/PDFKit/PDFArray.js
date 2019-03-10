// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFArray */
'use strict';

JSGlobalObject.PDFArray = function(){
    if (this === undefined){
        return new PDFArray();
    }
};

JSGlobalObject.PDFArray.prototype = Object.create(PDFObject.prototype, {

    length: {
        enumerable: false,
        writable: true,
        value: 0
    },

    toString: {
        value: function PDFArray_toString(){
            var str = "[ ";
            for (var i = 0, l = this.length; i < l; ++i){
                str += "%s ".sprintf(this[i]);
            }
            str += "]";
            return str;
        }
    }

});