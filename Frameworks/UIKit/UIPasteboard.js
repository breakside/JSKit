// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIPasteboard */
'use strict';

JSClass("UIPasteboard", JSObject, {

    _valuesByType: null,
    types: JSReadOnlyProperty(),

    init: function(){
        this._valuesByType = {};
    },

    getTypes: function(){
        return Object.keys(this._valuesByType);
    },

    setValueForType: function(value, type){
        this._valuesByType[type] = [value];
    },

    valueForType: function(type){
        if (!this.containsType(type)){
            return null;
        }
        return this._valuesByType[type][0];
    },

    containsType: function(type){
        return (type in this._valuesByType) && this._valuesByType[type].length > 0;
    },

    containsAnyType: function(types){
        for (var i = 0, l = types.length; i < l; ++i){
            if (this.containsType(types[i])){
                return true;
            }
        }
        return false;
    },

    copy: function(other){
        var types = other.types;
        for (var i = 0, l = types.length; i < l; ++i){
            this.setValueForType(other.valueForType(types[i]));
        }
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
    }
});

UIPasteboard.ContentType = {
    plainText: 'text/plain',
    html: 'text/html',
    files: 'Files'
};