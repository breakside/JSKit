// #import Foundation
'use strict';

(function(){

var DERHeaderData = function(tag, length){
    if (this !== undefined){
        throw new Error("Use the function form of DERHeaderData");
    }
    if (length < 128){
        return JSData.initWithArray([tag, length]);
    }
    if (length <= 0xFF){
        return JSData.initWithArray([tag, 0x81, length]);
    }
    if (length < 0xFFFF){
        return JSData.initWithArray([tag, 0x82, (length >> 8) & 0xFF, length & 0xFF]);
    }
    if (length < 0xFFFFFF){
        return JSData.initWithArray([tag, 0x83, (length >> 16) & 0xFF, (length >> 8) & 0xFF, length & 0xFF]);
    }
    if (length < 0xFFFFFFFF){
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
    this.values = values;
    var valuesLength = 0;
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

})();