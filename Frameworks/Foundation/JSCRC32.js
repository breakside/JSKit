"use strict";

JSGlobalObject.JSCRC32 = function(data){
    if (this === undefined){
        var crc = new JSCRC32();
        crc.update(data);
        return crc.final;
    }
    this.workpad = new Uint32Array([0xFFFFFFFF, 0]);
};

JSCRC32.prototype = Object.create({}, {

    workpad: {writable: true, value: null},

    update: {
        value: function JSCRC32_update(data){
            for (var i = 0, l = data.length; i < l; ++i){
                this.workpad[1] = this.workpad[0] ^ data[i];
                this.workpad[0] = JSCRC32.table[this.workpad[1] & 0xFF] ^ ((this.workpad[0] >> 8) & 0xFFFFFF);
            }
        }
    },

    final: {
        get: function JSCRC32_final(){
            this.workpad[0] = this.workpad[0] ^ 0xFFFFFFFF;
            return this.workpad[0];
        }
    }

});

Object.defineProperty(JSCRC32, 'table', {
    configurable: true,
    get: function(){
        var table = new Uint32Array(256);
        for (var i = 0; i < 256; ++i){
            table[i] = i;
            for (var j = 0; j < 8; ++j){
                if (table[i] & 1){
                    table[i] = 0xEDB88320 ^ ((table[i] >> 1) & 0x7FFFFFFF);
                }else{
                    table[i] = (table[i] >> 1) & 0x7FFFFFFF;
                }
            }
        }
        Object.defineProperty(JSCRC32, 'table', {value: table});
        return table;
    }
});