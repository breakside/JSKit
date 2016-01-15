// #feature Uint32Array
'use strict';

function Adler32(bytes){
    if (this === undefined){
        if (bytes){
            var checker = new Adler32();
            checker.includeBytes(bytes);
            return checker.sum;
        }else{
            return new Adler32();
        }
    }
    this.sum1 = 1;
    this.sum2 = 0;
}

Adler32.prototype = {
    includeBytes: function(bytes){
        for (var i = 0, l = bytes.length; i < l; ++i){
            this.sum1 = (this.sum1 + bytes[i]) % 65521;
            this.sum2 = (this.sum2 + this.sum1) % 65521;
        }
    }
};

Object.defineProperty(Adler32.prototype, 'sum', {
    get: function Adler32_sum(){
        var n = new Uint32Array(1);
        n[0] = (this.sum2 << 16) | this.sum1;
        return n[0];
    }
});