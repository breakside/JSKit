// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIPasteboard */
'use strict';

JSClass("UIPasteboard", JSObject, {

    _valuesByType: null,

    init: function(){
        this._valuesByType = {};
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
        return this._valuesByType[type] && this._valuesByType[type].length > 0;
    },

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
    html: 'text/html'
};