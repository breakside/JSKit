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
    },

    toString: {
        value: function PDFObject_toString(){
            if (this._indirect){
                return "%d %d R".sprintf(this._indirect.objectID, this._indirect.generation);
            }
            var str = "<< ";
            for (var k in this){
                str += "/%s %s ".sprintf(k, this[k]);
            }
            str += ">>";
            return str;
        }
    }

});

JSGlobalObject.PDFObjectProperty = {
    enumerable: false,
    configurable: true,
    writable: true,
    value: null
};