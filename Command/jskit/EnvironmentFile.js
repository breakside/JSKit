// #import Foundation
'use strict';

JSClass("EnvironmentFile", JSObject, {

    _valuesByName: null,

    initWithData: function(data){
        this._valuesByName = {};
        var text = data.stringByDecodingUTF8();
        var lines = text.split("\n");
        for (var i = 0, l = lines.length; i < l; ++i){
            this._parseLine(lines[i]);
        }
    },

    _parseLine: function(line){
        if (line.startsWith("#")){
            return;
        }
        var equalsIndex = line.indexOf('=');
        if (equalsIndex < 0){
            return;
        }
        var name = line.substr(0, equalsIndex).trim();
        var value = line.substr(equalsIndex + 1).trim();
        this._valuesByName[name] = value;
    },

    get: function(name, defaultValue){
        if (name in this._valuesByName){
            return this._valuesByName[name];
        }
        return defaultValue;
    }

});