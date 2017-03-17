// #import "Foundation/String+JS.js"
/* global */
'use strict';

var JSMIMEHeaderMap = function(other){
    if (this === undefined){
        if (other === null){
            return other;
        }
        return new JSMIMEHeaderMap(other);
    }else{
        this.headers = [];
        if (other instanceof JSMIMEHeaderMap){
            for (var i = 0, l = other.headers.length; i < l; ++i){
                this.headers.push(JSMIMEHeader(other.headers[i]));
            }
        }
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
        var lowerName = name.lowercaseString();
        for (var i = this.headers.length - 1; i >= 0; --i){
            header = this.headers[i];
            if (header.name == lowerName){
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
        var lowerName = name.lowercaseString();
        for (var i = 0, l = this.headers.length; i < l; ++i){
            header = this.headers[i];
            if (header.name == lowerName){
                values.push(header.value);
            }
        }
        return values;
    }
};

var JSMIMEHeader = function(name, value){
    if (this === undefined){
        if (name === null){
            return null;
        }
        return new JSMIMEHeader(name, value);
    }else{
        if (name instanceof JSMIMEHeader){
            this.name = name.name;
            this.value = name.value;
        }else{
            this.name = name;
            this.value = value;
        }
    }
};