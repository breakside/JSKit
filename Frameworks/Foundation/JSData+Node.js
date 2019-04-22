// #import "JSData.js"
/* global JSData, Buffer*/
'use strict';

Object.defineProperties(JSData, {
    initWithNodeBuffer: {
        value: function JSData_initWithNodeBuffer(buffer){
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
        }
    }
});

Object.defineProperties(JSData.prototype, {
    nodeBuffer: {
        value: function JSData_nodeBuffer(){
            return Buffer.from(this.buffer, this.byteOffset, this.length);
        }
    }
});