'use strict';

var PDFLexical = {

    isWhitespaceByte: function(x){
        return x === 0x00 || x === 0x09 || x === 0x0A || x === 0x0C || x === 0x0D || x === 0x20;
    },

    isHexadecimalByte: function(x){
        return (x >= 0x30 && x <= 0x39) || (x >= 0x41 && x <= 0x46) || (x >= 0x61 && x <= 0x66);
    }

};