// #import "Foundation/JSString.js"
/* global JSString */
'use strict';

var JSMIMEHeaderMap = function(){
    if (this === undefined){
        return new JSMIMEHeaderMap();
    }else{
        this.headers = [];
    }
};

JSMIMEHeaderMap.prototype = {
    headers: null,

    parse: function(headers){
        var lines = headers.split("\r\n");
        var line;
        var name;
        for (var i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            name = line.split(': ', 1)[0];
            this.add(name, line.substr(name.length + 2));
        }
    },

    add: function(name, value){
        this.headers.push(JSMIMEHeader(name, value));
    },

    unset: function(name){
        var header;
        if (typeof(name) == "string"){
            name = JSString.initWithNativeString(name);
        }
        var lowerName = name.lowercaseString();
        for (var i = this.headers.length - 1; i >= 0; --i){
            header = this.headers[i];
            if (header.name.isEqualToString(lowerName)){
                this.headers.splice(i, 1);
            }
        }
    },

    set: function(name, value){
        this.unset(name);
        this.add(name, value);
    },

    get: function(name){
        return this.getAll(name)[0];
    },

    getAll: function(name){
        var values = [];
        var header;
        if (typeof(name) == "string"){
            name = JSString.initWithNativeString(name);
        }
        var lowerName = name.lowercaseString();
        for (var i = 0, l = this.headers.length; i < l; ++i){
            header = this.headers[i];
            if (header.name.isEqualToString(lowerName)){
                values.push(header.value);
            }
        }
        return values;
    }
};

var JSMIMEHeader = function(name, value){
    if (this === undefined){
        return new JSMIMEHeader(name, value);
    }else{
        if (typeof(name) == "string"){
            name = JSString.initWithNativeString(name);
        }
        if (typeof(value) == "string"){
            value  = JSString.initWithNativeString(value);
        }
        this.name = name;
        this.value = value;
    }
};