// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIPasteboard, JSFileEnumerator */
'use strict';

(function(){

var valueSetter = function(value, type){
    this._valuesByType[type] = [value];
};

var valueAppender = function(value, type){
    if (!(type in this._valuesByType)){
        this._valuesByType[type] = [];
    }
    this._valuesByType[type].push(value);
};

var valueGetter = function(type){
    var values = multiValueGetter.call(this, type);
    if (values.length > 0){
        return values[0];
    }
    return null;
};

var multiValueGetter = function(type){
    if (this.containsType(type)){
        return this._valuesByType[type];
    }
    return [];
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

    stringForType: function(type){
        var strings = this.stringsForType(type);
        if (strings.length > 0){
            return strings[0];
        }
        return null;
    },

    stringsForType: multiValueGetter,
    addStringForType: valueAppender,

    setDataForType: valueSetter,

    dataForType: function(type){
        var dataList = this.dataListForType(type);
        if (dataList.length > 0){
            return dataList[0];
        }
        return null;
    },

    dataListForType: multiValueGetter,
    addDataForType: valueAppender,

    setObjectForType: valueSetter,

    objectForType: function(type){
        var objects = this.objectsForType(type);
        if (objects.length > 0){
            return objects[0];
        }
        return null;
    },

    objectsForType: multiValueGetter,
    addObjectForType: valueAppender,

    addFile: function(file){
        this._files.push(file);
    },

    fileEnumerator: JSReadOnlyProperty('_fileEnumerator', null),

    getFileEnumerator: function(){
        return JSFileEnumerator.initWithFiles(this._files);
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