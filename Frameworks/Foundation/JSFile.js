// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSFile, JSDataFile */
'use strict';

JSClass("JSFile", JSObject, {

    url: JSReadOnlyProperty(null, null, 'getURL'),
    name: JSReadOnlyProperty('_name', null),
    contentType: JSReadOnlyProperty('_contentType', null),
    size: JSReadOnlyProperty('_size', 0),
    extension: JSReadOnlyProperty(),
    nameWithoutExtension: JSReadOnlyProperty(),

    initWithData: function(data, name, contentType){
        return JSDataFile.initWithData(data, name, contentType);
    },

    initWithPlaceholder: function(name, contentType){
        this._name = name;
        this._contentType = contentType;
    },

    readData: function(completion, target){
    },

    readDataRange: function(range, completion, target){
    },

    getURL: function(){
        return null;
    },

    close: function(){
    },

    getExtension: function(){
        if (this._name === null){
            return '';
        }
        var i = this._name.lastIndexOf('.');
        if (i > 0){
            return this._name.substr(i + 1);
        }
        return '';
    },

    getNameWithoutExtension: function(){
        if (this._name === null){
            return '';
        }
        var i = this._name.lastIndexOf('.');
        if (i > 0){
            return this._name.substr(0, i);
        }
        return '';
    }

});

JSClass("JSDataFile", JSFile, {

    _data: null,

    initWithData: function(data, name, contentType){
        this._data = data;
        this._name = name;
        this._contentType = contentType;
        this._size = data.length;
    },

    readData: function(completion, target){
        completion.call(target, this._data);
    },

    readDataRange: function(range, completion, target){
        completion.call(target, this._data.subdataInRange(range));
    }

});