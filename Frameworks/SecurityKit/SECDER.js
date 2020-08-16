// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

JSGlobalObject.SECDEROctetString = function(data){
    if (this === undefined){
        return new SECDEROctetString(data);
    }
    this.data = data;
    this.headerData = DERHeaderData(0x04, this.data.length);
    this.length = this.headerData.length + this.data.length;
};

SECDEROctetString.prototype = {

    copyTo: function(data, startIndex){
        this.headerData.copyTo(data, startIndex);
        startIndex += this.headerData.length;
        this.data.copyTo(data, startIndex);
    }

};

JSGlobalObject.SECDERObjectIdentifier = function(string){
    if (this === undefined){
        return new SECDERObjectIdentifier(string);
    }
    this.string = string;
    var nodes = this.string.split(".");
    var i, l;
    for (i = 0, l = nodes.length; i < l; ++i){
        nodes[i] = parseInt(nodes[i]);
    }
    var bytes = [nodes[0] * 40 + nodes[1]];
    var node;
    for (i = 2, l = nodes.length; i < l; ++i){
        node = nodes[i];
        if (node < 128){
            bytes.push(node);
        }else{
            bytes.push(0x80 | ((node & 0x3F80) >> 7));
            bytes.push(node & 0x7F);
        }
    }
    this.data = JSData.initWithArray(bytes);
    this.headerData = DERHeaderData(0x04, this.data.length);
    this.length = this.headerData.length + this.data.length;
};

SECDERObjectIdentifier.prototype = {

    copyTo: function(data, startIndex){
        this.headerData.copyTo(data, startIndex);
        startIndex += this.headerData.length;
        this.data.copyTo(data, startIndex);
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

    read: function(){
        return this.readNext();
    },

    readNext: function(){
        if (this.offset === this.length){
            throw new Error("Unexpected end of data");
        }
        var tag = this.data[this.offset++];
        switch (tag){
            case 0x02:
                return this.readInteger();
            case 0x04:
                return this.readOctetString();
            case 0x06:
                return this.readObjectIdentifier();
            case 0x30:
                return this.readSequence();
            default:
                return this.readUnknown();
        }
    },

    readLength: function(){
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
    },

    readOctetString: function(){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var data = this.data.subdataInRange(JSRange(this.offset, end - this.offset));
        this.offset = end;
        return data;
    },

    readInteger: function(){
        var length = this.readLength();
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

    readObjectIdentifier: function(){
        var data = this.readOctetString();
        var nodes = [];
        nodes[0] = Math.floor(data[0] / 40);
        nodes[1] = data[0] - nodes[0] * 40;
        var a, b;
        for (var i = 1, l = data.length; i < l; ++i){
            a = data[i];
            if (a < 128){
                nodes.push(a);
            }else{
                ++i;
                if (i < l){
                    b = data[i];
                    nodes.push(((a & 0x7F) << 7) | (b & 0x7F));
                }else{
                    throw new Error("Unexpected end of object identifier");
                }
            }
        }
        return nodes.join(".");
    },

    readSequence: function(){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var values = [];
        while (this.offset < end){
            values.push(this.readNext());
        }
        if (this.offset !== end){
            throw new Error("Sequence length mismatch");
        }
        return values;
    },

    readUnknown: function(){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        this.offset = end;
        return null;
    }

});

})();