// #import "Foundation/CoreTypes.js"
// #import "Foundation/String+JS.js"
// #import "Foundation/JSData.js"
/* global JSRange, JSData, JSGlobalObject, JSFormFieldMap, JSFormField */
'use strict';

(function(){

JSGlobalObject.JSFormFieldMap = function(other){
    if (this === undefined){
        if (other === null){
            return other;
        }
        return new JSFormFieldMap(other);
    }else{
        this.fields = [];
        if (other instanceof JSFormFieldMap){
            for (var i = 0, l = other.fields.length; i < l; ++i){
                this.fields.push(JSFormField(other.fields[i]));
            }
        }
    }
};

JSFormFieldMap.prototype = {
    fields: null,

    decode: function(urlEncodedData, decodePlusAsSpace){
        var bytes = urlEncodedData.bytes;
        var l = bytes.length;
        var start = 0;
        var i = 0;
        var name = null;
        var value;
        while (i < l){
            if (name === null){
                if (bytes[i] == 0x3D){
                    name = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                    start = i + 1;
                }else if (bytes[i] == 0x26){
                    name = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                    this.add(name, null);
                    name = null;
                    start = i + 1;
                }
            }else{
                if (bytes[i] == 0x26){
                    value = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                    this.add(name, value);
                    name = null;
                    start = i + 1;
                }
            }
            ++i;
        }
        if (i > start){
            if (name === null){
                name = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                this.add(name, null);
            }else{
                value = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                this.add(name, value);
            }
        }
    },

    encode: function(reserved, encodeSpaceAsPlus){
        var totalLength = 0;
        var dataList = [];
        var field;
        var data;
        var i, l;
        var ampersand = JSData.initWithBytes(Uint8Array.from([0x26]));
        var equals = JSData.initWithBytes(Uint8Array.from([0x3D]));
        for (i = 0, l = this.fields.length; i < l; ++i){
            field = this.fields[i];
            if (i > 0){
                dataList.push(ampersand);
                totalLength += 1;
            }
            data = field.name.utf8().dataByEncodingPercentEscapes(reserved, encodeSpaceAsPlus);
            dataList.push(data);
            totalLength += data.length;
            if (field.value !== null){
                dataList.push(equals);
                totalLength += 1;
                data = field.value.utf8().dataByEncodingPercentEscapes(reserved, encodeSpaceAsPlus);
                dataList.push(data);
                totalLength += data.length;
            }
        }
        var encoded = new Uint8Array(totalLength);
        var j = 0;
        for (i = 0, l = dataList.length; i < l; ++i){
            data = dataList[i];
            for (var ii = 0, ll = data.bytes.length; ii < ll; ++ii){
                encoded[j++] = data.bytes[ii];
            }
        }
        return JSData.initWithBytes(encoded);
    },

    add: function(name, value){
        this.fields.push(JSFormField(name, value));
    },

    unset: function(name){
        var header;
        var lowerName = name.lowercaseString();
        for (var i = this.fields.length - 1; i >= 0; --i){
            header = this.fields[i];
            if (header.name == lowerName){
                this.fields.splice(i, 1);
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
        for (var i = 0, l = this.fields.length; i < l; ++i){
            header = this.fields[i];
            if (header.name == lowerName){
                values.push(header.value);
            }
        }
        return values;
    }
};

JSGlobalObject.JSFormField = function(name, value){
    if (this === undefined){
        if (name === null){
            return null;
        }
        return new JSFormField(name, value);
    }else{
        if (name instanceof JSFormField){
            this.name = name.name;
            this.value = name.value;
        }else{
            if (value === undefined){
                value = null;
            }
            if (value !== null && typeof(value) != "string"){
                value = String(value);
            }
            this.name = name;
            this.value = value;
        }
    }
};

})();