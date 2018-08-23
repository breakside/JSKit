// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIPasteboard */
'use strict';

(function(){

var valueSetter = function(value, type){
    this._valuesByType[type] = [value];
};

var valueGetter = function(type){
    if (this.containsType(type)){
        return this._valuesByType[type][0];
    }
    return null;
};

JSClass("UIPasteboard", JSObject, {

    _valuesByType: null,
    _files: null,
    types: JSReadOnlyProperty(),

    init: function(){
        this._valuesByType = {};
        this._files = [];
    },

    setStringForType: valueSetter,
    stringForType: valueGetter,

    setDataForType: valueSetter,
    dataForType: valueGetter,

    setObjectForType: valueSetter,
    objectForType: valueGetter,

    addFile: function(file){
        this._files.push(file);
    },

    numberOfFiles: function(){
        return this._files.length;
    },

    fileAtIndex: function(index){
        if (index < this._files.length){
            return this._files[index];
        }
        return null;
    },

    getTypes: function(){
        var types = Object.keys(this._valuesByType);
        if (this._files.length > 0){
            types.push(UIPasteboard.ContentType.anyFile);
        }
        return types;
    },

    containsType: function(type){
        if (type === UIPasteboard.ContentType.anyFile){
            return this._files.length > 0;
        }
        return (type in this._valuesByType) && this._valuesByType[type].length > 0;
    },

    containsAnyType: function(types){
        for (var i = 0, l = types.length; i < l; ++i){
            if (this.containsType(types[i])){
                return true;
            }
        }
        return false;
    }

});

Object.defineProperty(UIPasteboard, 'general', {
    configurable: true,
    get: function UIPasteboard_getGeneral(){
        var general = UIPasteboard.init();
        Object.defineProperty(UIPasteboard, 'general', {
            configurable: false,
            writable: false,
            value: general
        });
        return general;
    },
    set: function UIPasteboard_setGeneral(pasteboard){
        Object.defineProperty(UIPasteboard, 'general', {
            configurable: false, 
            writable: false,
            value: pasteboard
        });
    }
});

UIPasteboard.ContentType = {
    plainText: 'text/plain',
    html: 'text/html',
    anyFile: 'Files'
};

})();