// #global Uint8Array

JSClass("JSData", JSObject, {

    bytes: null,
    length: null,

    initWithLength: function(length){
        this.bytes = new Uint8Array(length);
        this.length = length;
    },

    initWithBytes: function(bytes){
        this.bytes = bytes;
        this.length = this.bytes.length;
    }

});