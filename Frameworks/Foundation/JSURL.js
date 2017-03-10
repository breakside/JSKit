// #import "Foundation/JSObject.js"
// #import "Foundation/JSString.js"
/* global JSClass, JSObject, JSDynamicProperty, JSString, JSReadOnlyProperty */

'use strict';

JSClass("JSURL", JSObject, {

    scheme: null,
    userInfo: null,
    host: null,
    port: null,
    path: null,
    query: null,
    fragment: null,
    encodedString: JSReadOnlyProperty(),
    _encodedString: null,

    initWithString: function(str){
        if (typeof(str) == "string"){
            str = JSString.initWithNativeString(str);
            this._encodedString = str;
        }
        this._parseString(str);
    },

    initWithUTF8Data: function(data){
        var str = JSString.initWithData(data, JSString.Encoding.utf8);
        this.initWithString(str);
    },

    _parseString: function(str){
    },

    getEncodedString: function(){
        return this._encodedString;
    },

    isEqualToURL: function(url){
        return url._encodedString == this._encodedString;
    }

});