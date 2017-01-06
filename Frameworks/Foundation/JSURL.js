// #import "Foundation/JSObject.js"
// #import "Foundation/JSString.js"
/* global JSClass, JSObject, JSDynamicProperty, JSString */

'use strict';

JSClass("JSURL", JSObject, {

    scheme: null,
    userInfo: null,
    host: null,
    port: null,
    path: null,
    query: null,
    fragment: null,

    initWithString: function(str){
        if (typeof(str) == "string"){
            str = JSString.initWithNativeString(str);
        }
        this._parseString(str);
    },

    initWithUTF8Data: function(data){
        var str = JSString.initWithData(data, JSString.Encoding.utf8);
        this.initWithString(str);
    },

    _parseString: function(str){
        // TODO:
    },

    percentEncodedString: function(){
        // TODO:
    }

});