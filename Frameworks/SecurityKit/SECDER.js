// #import Foundation
'use strict';

(function(){

var DERHeaderData = function(tag, length){
    if (this !== undefined){
        throw new Error("Use the function form of DERHeaderData");
    }
    if (length <= 0xF){
        return JSData.initWithArray([tag, length]);
    }
    if (length <= 0xFF){
        return JSData.initWithArray([tag, 0x81, length]);
    }
    if (length <= 0xFFFF){
        return JSData.initWithArray([tag, 0x82, (length >> 8) & 0xFF, length & 0xFF]);
    }
    if (length <= 0xFFFFFF){
        return JSData.initWithArray([tag, 0x83, (length >> 16) & 0xFF, (length >> 8) & 0xFF, length & 0xFF]);
    }
    if (length <= 0xFFFFFFFF){
        return JSData.initWithArray([tag, 0x84, (length >> 24) & 0xFF, (length >> 16) & 0xFF, (length >> 8) & 0xFF, length & 0xFF]);
    }
    throw new Error("Length too big to encode");
};

JSGlobalObject.SECDERInteger = function(integerData){
    if (this === undefined){
        return new SECDERInteger(integerData);
    }
    if ((integerData[0] & 0x80) == 0x80){
        // Add leading zero byte to confirm that the integer is positive
        this.integerData = JSData.initWithLength(integerData.length + 1);
        integerData.copyTo(this.integerData, 1);
    }else{
        this.integerData = integerData;
    }
    this.headerData = DERHeaderData(0x02, this.integerData.length);
    this.length = this.headerData.length + this.integerData.length;
};

SECDERInteger.prototype = {

    copyTo: function(data, startIndex){
        this.headerData.copyTo(data, startIndex);
        startIndex += this.headerData.length;
        this.integerData.copyTo(data, startIndex);
    }

};

JSGlobalObject.SECDERSequence = function(values){
    if (this === undefined){
        return new SECDERSequence(values);
    }
    var valuesLength = 0;
    this.values = values;
    for (var i = 0, l = this.values.length; i < l; ++i){
        valuesLength += this.values[i].length;
    }
    this.headerData = DERHeaderData(0x30, valuesLength);
    this.length = this.headerData.length + valuesLength;
};

SECDERSequence.prototype = {

    copyTo: function(data, startIndex){
        this.headerData.copyTo(data, startIndex);
        startIndex += this.headerData.length;
        var value;
        for (var i = 0, l = this.values.length; i < l; ++i){
            value = this.values[i];
            value.copyTo(data, startIndex);
            startIndex += value.length;
        }
    }

};

JSClass("SECDERParser", JSObject, {

    initWithPEM: function(pem, name){
        if (pem instanceof JSData){
            pem = pem.stringByDecodingUTF8();
        }
        var lines = pem.split("\n");
        var line;
        for (var i = lines.length - 1; i >= 0; --i){
            line = lines[i];
            if (line.length > 0 && line[line.length - 1] == "\r"){
                line = lines[i] = line.substr(0, line.length - 1);
            }
            if (line.length === 0){
                lines.splice(i, 1);
            }
        }
        if (lines.length < 2){
            throw new Error("Not a PEM");
        }
        if (lines[0] != "-----BEGIN %s-----".sprintf(name)){
            throw new Error("Expecting BEGIN %s".sprintf(name));
        }
        if (lines[lines.length - 1] != "-----END %s-----".sprintf(name)){
            throw new Error("Expecting END %s".sprintf(name));
        }
        var encoded = lines.slice(1, lines.length - 1).join("");
        var der = encoded.dataByDecodingBase64();
        return this.initWithData(der);
    },

    initWithData: function(data){
        this.data = data;
        this.length = data.length;
    },

    data: null,
    length: null,
    offset: 0,

    parse: function(){
        return this.parseValue();
    },

    parseValue: function(){
        if (this.offset === this.length){
            throw new Error("Unexpected end of data");
        }
        var tag = this.data[this.offset++];
        switch (tag){
            case 0x030:
                return this.parseSequence();
            case 0x02:
                return this.parseInteger();
            default:
                return this.parseUnknown();
        }
    },

    parseSequence: function(){
        var length = this.parseLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var values = [];
        while (this.offset < end){
            values.push(this.parseValue());
        }
        if (this.offset !== end){
            throw new Error("Sequence length mismatch");
        }
        return values;
    },

    parseInteger: function(){
        var length = this.parseLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        if (this.data[this.offset] === 0){
            ++this.offset;
        }
        var integerData = this.data.subdataInRange(JSRange(this.offset, end - this.offset));
        this.offset = end;
        return integerData;
    },

    parseUnknown: function(){
        var length = this.parseLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        this.offset = end;
        return null;
    },

    parseLength: function(){
        if (this.offset === this.length){
            throw new Error("Unexpected end of data");
        }
        var length = this.data[this.offset++];
        if ((length & 0x80) === 0){
            return length;
        }
        if (this.offset === this.length){
            throw new Error("Unexpected end of data");
        }
        var lengthOfLength = (length & 0x7F);
        if (this.offset + lengthOfLength > this.length){
            throw new Error("Unexpected end of data");
        }
        var a, b, c, d;
        a = this.data[this.offset++];
        if (lengthOfLength == 1){
            return a;
        }
        b = this.data[this.offset++];
        if (lengthOfLength == 2){
            return (a << 8) | b;
        }
        c = this.data[this.offset++];
        if (lengthOfLength == 3){
            return (a << 16) | (b << 8) | c;
        }
        d = this.data[this.offset++];
        if (lengthOfLength == 4){
            return (a << 24) | (b << 16) | (c << 16) | d;
        }
        throw new Error("Length too large");
    }

});

})();