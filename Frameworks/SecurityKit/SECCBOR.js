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

var logger = JSLog("securitykit", "cbor");

JSGlobalObject.SECCBOR = {

    parse: function(data){
        var parser = SECCBORParser.initWithData(data);
        return parser.parse();
    }

};

JSClass("SECCBORParser", JSObject, {

    offset: 0,
    encodeDataAsBase64URL: false,

    initWithData: function(data){
        this.data = data;
        this.offset = 0;
    },

    parse: function(){
        return this.readNext();
    },

    readNext: function(){
        if (this.offset >= this.data.length){
            return null;
        }
        var b = this.data[this.offset++];
        var info = b & 0x1F;
        var majorType = (b & 0xE0) >> 5;
        switch (majorType){
            case SECCBOR.MajorType.unsignedInteger:
                return this.readUnsignedInteger(info);
            case SECCBOR.MajorType.negativeInteger:
                return this.readNegativeInteger(info);
            case SECCBOR.MajorType.byteString:
                return this.readByteString(info);
            case SECCBOR.MajorType.utf8:
                return this.readUTF8(info);
            case SECCBOR.MajorType.array:
                return this.readArray(info);
            case SECCBOR.MajorType.dictionary:
                return this.readDictionary(info);
            case SECCBOR.MajorType.tag:
                return this.readTag(info);
            case SECCBOR.MajorType.other:
                return this.readOther(info);
        }
        return null;
    },

    readUnsignedInteger: function(info){
        if (info < 24){
            return info;
        }
        if (info === 24){
            return this.data[this.offset++];
        }
        var a, b, c, d;
        if (info === 25){
            a = this.data[this.offset++];
            b = this.data[this.offset++];
            return (a << 8) | b;
        }
        if (info === 26){
            a = this.data[this.offset++];
            b = this.data[this.offset++];
            c = this.data[this.offset++];
            d = this.data[this.offset++];
            return (a << 24) | (b << 16) | (c << 8) | d;
        }
        if (info === 27){
            var dataView = this.data.subdataInRange(JSRange(this.offset, 8)).dataView();
            this.offset += 8;
            a = dataView.getUint32(0);
            b = dataView.getUint32(4);
            c = Math.pow(2, 32) * a + b;
            if (c > Number.MAX_SAFE_INTEGER){
                logger.warn("cannot retain full precision of 64 bit integer");
                // TODO: use BigInt if available
            }
            return c;
        }
        throw new Error("Unexpected info for unsigned integer at %d".sprintf(this.offset - 1));
    },

    readNegativeInteger: function(info){
        var n = this.readUnsignedInteger(info);
        return -1 - n;
    },

    readByteString: function(info, forceData){
        if (info === 31){
            var chunks = [];
            var chunk = this.readNext();
            while (chunk !== breakIndicator){
                if (!(chunk instanceof JSData)){
                    throw new Error("non-data chunk found in indefinite length byte string");
                }
                chunks.push(chunk);
                chunk = this.readNext();
            }
            return JSData.initWithChunks(chunks);
        }
        var length = this.readUnsignedInteger(info);
        var data = this.data.subdataInRange(JSRange(this.offset, length));
        this.offset += length;
        if (!forceData && this.encodeDataAsBase64URL){
            return data.base64URLStringRepresentation();
        }
        return data;
    },

    readUTF8: function(info){
        if (info === 31){
            var str = "";
            var chunk = this.readNext();
            while (chunk !== breakIndicator){
                if (typeof(chunk) !== "string"){
                    throw new Error("non-text chunk found in indefinite length text string");
                }
                str += chunk;
                chunk = this.readNext();
            }
            return str;
        }
        var data = this.readByteString(info, true);
        return data.stringByDecodingUTF8();
    },

    readArray: function(info){
        var array = [];
        var item;
        if (info === 31){
            item = this.readNext();
            while (item !== breakIndicator){
                array.push(item);
                item = this.readNext();
            }
            return array;
        }
        var count = this.readUnsignedInteger(info);
        for (var i = 0; i < count; ++i){
            item = this.readNext();
            array.push(item);
        }
        return array;
    },

    readDictionary: function(info){
        var dictionary = {};
        var key;
        var value;
        if (info === 31){
            key = this.readNext();
            while (key !== breakIndicator){
                value = this.readNext();
                dictionary[key] = value;
                key = this.readNext();
            }
            return dictionary;
        }
        var count = this.readUnsignedInteger(info);
        for (var i = 0; i < count; ++i){
            key = this.readNext();
            value = this.readNext();
            dictionary[key] = value;
        }
        return dictionary;
    },

    readTag: function(info){
        this.readUnsignedInteger(info);
        return this.readNext();
    },

    readOther: function(info){
        if (info <= 23){
            if (info === 20){
                return false;
            }
            if (info === 21){
                return true;
            }
            if (info === 22){
                return null;
            }
            if (info === 23){
                return undefined;
            }
        }
        if (info === 24){
            info = this.bytes[this.offset++];
            return undefined;
        }
        if (info === 25){
            // TODO: 16 bit IEEE 754 float
            this.offset += 2;
            return undefined;
        }
        if (info === 26){
            // TODO: 32 bit IEEE 754 float
            this.offset += 4;
            return undefined;
        }
        if (info === 27){
            // TODO: 64 bit IEEE 754 float
            this.offset += 2;
            return undefined;
        }
        if (info < 31){
            return undefined;
        }
        if (info === 31){
            return breakIndicator;
        }
    },

});

SECCBOR.MajorType = {
    unsignedInteger: 0,
    negativeInteger: 1,
    byteString: 2,
    utf8: 3,
    array: 4,
    dictionary: 5,
    tag: 6,
    other: 7
};

var breakIndicator = {};

})();