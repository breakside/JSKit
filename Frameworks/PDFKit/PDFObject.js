/* global JSGlobalObject, PDFObject */
'use strict';

JSGlobalObject.PDFObject = function(){
    if (this === undefined){
        return new PDFObject();
    }
};

JSGlobalObject.PDFObject.prototype = Object.create({}, {

    _indirect: {
        enumerable: false,
        configurable: true,
        writable: false,
        value: null
    },

    indirect: {
        enumerable: false,
        configurable: false,
        set: function(indirect){
            Object.defineProperty(this, '_indirect', {
                enumerable: false,
                configurable: true,
                value: indirect
            });
        },
        get: function(){
            return this._indirect;
        }
    }

});

JSGlobalObject.PDFObjectProperty = {
    enumerable: false,
    configurable: true,
    writable: true,
    value: null
};