/* global JSGlobalObject, JSMediaType, JSCopy */
'use strict';

JSGlobalObject.JSMediaType = function(str, parameters){
    if (this === undefined){
        return new JSMediaType(str, parameters);
    }
    if (str instanceof JSMediaType){
        this.mime = str.mime;
        this.type = str.type;
        this.subtype = str.subtype;
        this.parameters = JSCopy(str.parameters);
        return;
    }
    if (parameters !== undefined){
        this.parameters = JSCopy(parameters);
    }else{
        this.parameters = {};
    }
    str = str.toLowerCase();
    var index = str.indexOf(';');
    var l = str.length;
    if (index < 0){
        this.mime = str.trim();
    }else{
        this.mime = str.substr(0, index).trim();
        ++index;
        var c;
        var i = index;
        var name;
        while (i < l){
            c = str.charAt(i);
            if (c == '='){
                name = str.substr(index, i - index).trim();
                ++i;
                index = i;
                if (i < l){
                    c = str.charAt(i);
                    if (c == '"'){
                        ++i;
                        ++index;
                        while (i < l && str.charAt(i) != '"'){
                            ++i;
                        }
                        if (name.length){
                            this.parameters[name] = str.substr(index, i - index);
                        }
                        while (i < l && str.charAt(i) != ';'){
                            ++i;
                        }
                    }else{
                        while (i < l && str.charAt(i) != ';'){
                            ++i;
                        }
                        if (name.length){
                            this.parameters[name] = str.substr(index, i - index).trim();
                        }
                    }
                    ++i;
                    index = i;
                }else{
                    if (name.length){
                        this.parameters[name] = '';
                    }
                }
            }else{
                ++i;
                if (c == ";"){
                    index = i;
                }
            }
        }
    }
    index = this.mime.indexOf('/');
    if (index >= 0){
        this.type = this.mime.substr(0, index);
        this.subtype = this.mime.substr(index + 1);
    }else{
        this.type = this.mime;
        this.subtype = '';
    }
};

JSMediaType.prototype = {
    mime: null,
    type: null,
    subtype: null,
    parameters: null,

    toString: function(){
        var str = this.mime;
        var value;
        for (var name in this.parameters){
            str += "; " + name + '=';
            value = this.parameters[name];
            str += '"' + value + '"';
        }
        return str;
    }
};