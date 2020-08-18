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

JSClass("SECASN1Value", JSObject, {

    derTag: 0x00,

    derValueLength: function(){
        throw new Error("Must be implemented by subclass");
    },

    derLength: function(){
        var valueLength = this.derValueLength();
        if (valueLength <= 0xF){
            return 2 + valueLength;
        }
        if (valueLength <= 0xFF){
            return 3 + valueLength;
        }
        if (valueLength <= 0xFFFF){
            return 4 + valueLength;
        }
        if (valueLength <= 0xFFFFFF){
            return 5 + valueLength;
        }
        if (valueLength <= 0xFFFFFFFF){
            return 6 + valueLength;
        }
        throw new Error("Value length too big to encode");
    },

    derRepresentation: function(){
        var length = this.derLength();
        var der = JSData.initWithLength(length);
        var offset = 0;
        offset = this.writeDER(der, offset);
        if (offset != length){
            throw new Error("writeDER length mismatch");
        }
        return der;
    },

    writeDERHeader: function(der, offset){
        var valueLength = this.derValueLength();
        der[offset++] = this.derTag;
        if (valueLength <= 0xF){
            der[offset++] = valueLength;
        }else if (valueLength <= 0xFF){
            der[offset++] = 0x81;
            der[offset++] = valueLength;
        }else if (valueLength <= 0xFFFF){
            der[offset++] = 0x82;
            der[offset++] = (valueLength >> 8) & 0xFF;
            der[offset++] = valueLength & 0xFF;
        }else if (valueLength <= 0xFFFFFF){
            der[offset++] = 0x83;
            der[offset++] = (valueLength >> 16) & 0xFF;
            der[offset++] = (valueLength >> 8) & 0xFF;
            der[offset++] = valueLength & 0xFF;
        }else if (valueLength <= 0xFFFFFFFF){
            der[offset++] = 0x84;
            der[offset++] = (valueLength >> 24) & 0xFF;
            der[offset++] = (valueLength >> 16) & 0xFF;
            der[offset++] = (valueLength >> 8) & 0xFF;
            der[offset++] = valueLength & 0xFF;
        }else{
            throw new Error("Value length too big to encode");
        }
        return offset;
    },

    pemRepresentation: function(tag){
        var der = this.derRepresentation();
        var base64 = der.base64StringRepresentation();
        var pem = "-----BEGIN %s-----\n".sprintf(tag);
        pem += base64;
        pem += "\n-----END %s-----\n".sprintf(tag);
        return pem;
    }

});

SECASN1Value.ClassName = {
    universal: 0x00,
    application: 0x01,
    contextSpecific: 0x02,
    private: 0x03
};

JSClass("SECASN1Boolean", SECASN1Value, {

    initWithValue: function(value){
        this.value = value;
    },

    value: false,

    derTag: 0x01,

    derValueLength: function(){
        return 1;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        der[offset++] = this.value === true ? 0x01 : 0x00;
        return offset;
    }

});

JSClass("SECASN1Integer", SECASN1Value, {

    initWithData: function(data, signed){
        this.data = data;
        this.signed = signed !== true;
    },

    signed: false,
    data: null,

    derTag: 0x02,

    derValueLength: function(){
        if (!this.signed && this.data.length > 0 && (this.data[0] & 0x80) == 0x80){
            return this.data.length + 1;
        }
        return this.data.length;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        if (!this.signed && this.data.length > 0 && (this.data[0] & 0x80) == 0x80){
            der[offset++] = 0;
        }
        this.data.copyTo(der, offset);
        offset += this.data.length;
        return offset;
    }

});

JSClass("SECASN1BitString", SECASN1Value, {

    initWithData: function(data, unusedBits){
        this.data = data;
        this.unusedBits = unusedBits || 0;
    },

    data: null,
    unusedBits: 0,

    derTag: 0x03,

    derValueLength: function(){
        return this.data.length + 1;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        der[offset++] = this.unusedBits;
        this.data.copyTo(der, offset);
        offset += this.data.length;
        return offset;
    }

});

JSClass("SECASN1OctetString", SECASN1Value, {

    initWithData: function(data){
        this.data = data;
    },

    data: null,

    derTag: 0x04,

    derValueLength: function(){
        return this.data.length;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        this.data.copyTo(der, offset);
        offset += this.data.length;
        return offset;
    }

});

JSClass("SECASN1ObjectIdentifier", SECASN1Value, {

    initWithString: function(string){
        this.stringValue = string;
        this.nodes = this.stringValue.split(".");
        for (var i = 0, l = this.nodes.length; i < l; ++i){
            this.nodes[i] = parseInt(this.nodes[i]);
        }
    },

    initWithNodes: function(nodes){
        this.nodes = JSCopy(nodes);
        this.stringValue = this.nodes.join(".");
    },

    stringValue: null,
    nodes: null,

    derTag: 0x06,

    derValueLength: function(){
        var node;
        var length = 1;
        for (var i = 2, l = this.nodes.length; i < l; ++i){
            node = this.nodes[i];
            if (node < 128){
                length += 1;
            }else{
                length += 2;
            }
        }
        return length;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        der[offset++] = this.nodes[0] * 40 + this.nodes[1];
        var node;
        for (var i = 2, l = this.nodes.length; i < l; ++i){
            node = this.nodes[i];
            if (node < 128){
                der[offset++] = node;
            }else{
                der[offset++] = 0x80 | ((node & 0x3F80) >> 7);
                der[offset++] = node & 0x7F;
            }
        }
        return offset;
    }

});

JSClass("SECASN1Sequence", SECASN1Value, {

    initWithValues: function(values){
        this.values = values;
    },

    values: null,

    derTag: 0x30,

    derValueLength: function(){
        var length = 0;
        for (var i = 0, l = this.values.length; i < l; ++i){
            length += this.values[i].derLength();
        }
        return length;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        for (var i = 0, l = this.values.length; i < l; ++i){
            offset = this.values[i].writeDER(der, offset);
        }
        return offset;
    }

});

JSClass("SECASN1UTF8String", SECASN1Value, {

    initWithString: function(stringValue){
        this.stringValue = stringValue;
        this.utf8 = stringValue.utf8();
    },

    initWithUTF8: function(utf8){
        this.utf8 = utf8;
        this.stringValue = String.initWithData(this.utf8, String.Encoding.utf8);
    },

    stringValue: null,
    utf8: null,

    derTag: 0x0C,

    derValueLength: function(){
        return this.utf8.length;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        this.utf8.copyTo(der, offset);
        offset += this.utf8.length;
        return offset;
    }

});

JSClass("SECASN1Optional", SECASN1Value, {

    initWithValue: function(value, classNumber){
        this.value = value;
        this.classNumber = classNumber;
        this.derTag = (SECASN1Value.ClassName.contextSpecific << 6) | 0x20 | this.classNumber;
    },

    value: null,
    classNumber: null,

    derValueLength: function(){
        return this.value.derLength();
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        offset = this.value.writeDER(der, offset);
        return offset;
    }

});

JSClass("SECASN1Unknown", SECASN1Value, {

    initWithTag: function(tag, data){
        this.derTag = tag;
        this.data = data;
    },

    data: null,

    derValueLength: function(){
        return this.data.length;
    },

    writeDER: function(der, offset){
        offset = this.writeDERHeader(der, offset);
        this.data.copyTo(der, offset);
        offset += this.data.length;
        return offset;
    }

});