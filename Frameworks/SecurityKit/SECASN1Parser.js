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
// #import "SECASN1.js"
'use strict';

(function(){

JSClass("SECASN1Parser", JSObject, {

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
        return this.initWithDER(der);
    },

    initWithDER: function(der){
        this.der = der;
        this.length = der.length;
    },

    der: null,
    length: null,
    offset: 0,

    parse: function(){
        return this.readNext();
    },

    readNext: function(){
        if (this.offset === this.length){
            throw new Error("Unexpected end of data");
        }
        var tag = this.der[this.offset++];
        var constructed = (tag & 0x20) == 0x20;
        var className = (tag & 0xC0) >> 6;
        var tagNumber = tag & 0x1F;
        if (tagNumber == 0x1F){
            tagNumber = 0;
            var more;
            do {
                if (this.offset === this.length){
                    throw new Error("Unexpected end of data");
                }
                more = this.der[this.offset++];
                tagNumber <<= 7;
                tagNumber |= more & 0x7F;
            }while (more & 0x80 == 0x80);
        }
        if (className == SECASN1Value.ClassName.universal){
            if (!constructed){
                switch (tagNumber){
                    case 0x01:
                        return this.readBoolean();
                    case 0x02:
                        return this.readInteger();
                    case 0x03:
                        return this.readBitString();
                    case 0x04:
                        return this.readOctetString();
                    case 0x06:
                        return this.readObjectIdentifier();
                    case 0x0C:
                        return this.readUTF8String();
                }
            }else{
                switch (tagNumber){
                    case 0x10:
                        return this.readSequence();
                }
            }
        }else if (className === SECASN1Value.ClassName.contextSpecific && constructed){
            return this.readOptional(tagNumber);
        }
        return this.readUnknown(tag);
    },

    readLength: function(){
        if (this.offset === this.length){
            throw new Error("Unexpected end of data");
        }
        var length = this.der[this.offset++];
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
        a = this.der[this.offset++];
        if (lengthOfLength == 1){
            return a;
        }
        b = this.der[this.offset++];
        if (lengthOfLength == 2){
            return (a << 8) | b;
        }
        c = this.der[this.offset++];
        if (lengthOfLength == 3){
            return (a << 16) | (b << 8) | c;
        }
        d = this.der[this.offset++];
        if (lengthOfLength == 4){
            return (a << 24) | (b << 16) | (c << 16) | d;
        }
        throw new Error("Length too large");
    },

    readBoolean: function(){
        var length = this.readLength();
        if (length != 1){
            throw new Error("Invalid boolean length");
        }
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var value = this.der[this.offset] !== 0x00;
        ++this.offset;
        return SECASN1Boolean.initWithValue(value);
    },

    readInteger: function(){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var signed = true;
        if (this.der[this.offset] === 0){
            ++this.offset;
            signed = false;
        }
        var integerData = this.der.subdataInRange(JSRange(this.offset, end - this.offset));
        this.offset = end;
        return SECASN1Integer.initWithData(integerData, signed);
    },

    readBitString: function(){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var unusedBits = this.der[this.offset++];
        var data = this.der.subdataInRange(JSRange(this.offset, end - this.offset));
        this.offset = end;
        return SECASN1BitString.initWithData(data, unusedBits);
    },

    readOctetString: function(){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var data = this.der.subdataInRange(JSRange(this.offset, end - this.offset));
        this.offset = end;
        return SECASN1OctetString.initWithData(data);
    },

    readObjectIdentifier: function(){
        var data = this.readOctetString().data;
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
        return SECASN1ObjectIdentifier.initWithNodes(nodes);
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
        return SECASN1Sequence.initWithValues(values);
    },

    readUTF8String: function(){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var utf8 = this.der.subdataInRange(JSRange(this.offset, end - this.offset));
        this.offset = end;
        return SECASN1UTF8String.initWithUTF8(utf8);
    },

    readOptional: function(classNumber){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var value = this.readNext();
        if (this.offset !== end){
            throw new Error("Optional length mismatch");
        }
        return SECASN1Optional.initWithValue(value, classNumber);
    },

    readUnknown: function(tag){
        var length = this.readLength();
        var end = this.offset + length;
        if (end > this.length){
            throw new Error("Unexpected end of data");
        }
        var data = this.der.subdataInRange(JSRange(this.offset, end - this.offset));
        this.offset = end;
        return SECASN1Unknown.initWithTag(tag, data);
    }

});

})();