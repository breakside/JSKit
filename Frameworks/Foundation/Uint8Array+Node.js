// #feature Uint8Array
'use strict';

Object.defineProperties(Uint8Array.prototype, {

    nodeBuffer: {
        enumerable: false,
        value: function(){
            return Buffer.from(this.buffer, this.byteOffset, this.length);
        }
    }

});