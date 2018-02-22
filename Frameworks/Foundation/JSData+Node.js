// #import "Foundation/JSData.js"
/* global JSData, Buffer*/
'use strict';

JSData.definePropertiesFromExtensions({

    nodeBuffer: function(){
        return Buffer.from(this.bytes.buffer, this.bytes.byteOffset, this.length);
    }
});