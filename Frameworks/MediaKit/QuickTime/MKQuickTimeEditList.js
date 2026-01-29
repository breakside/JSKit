// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeEditList", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.elst,
    version: JSReadOnlyProperty(),
    flags: JSReadOnlyProperty(),
    numberOfEntries: JSReadOnlyProperty(),

    getVersion: function(){
        return this.data[8];
    },

    getFlags: function(){
        return this.dataView.getUint32(8) & 0x00FFFFFF;
    },

    initWithData: function(data){
        MKQuickTimeEditList.$super.initWithData.call(this, data);
        if (data.length < 16){
            throw new Error("expecting at least 16 bytes for elst atom");
        }
        if (this.version > 1){
            throw new Error("Unsupported elst version: %d".sprintf(this.version));
        }
    },

    getNumberOfEntries: function(){
        return this.dataView.getUint32(12);
    },

    durationAtIndex: function(index){
        var i;
        if (this.version === 1){
            i = 16 + index * 20;
            if (i >= 16 && i < this.data.length){
                return this._getUint64(i);
            }
            return null;
        }
        // version 0
        i = 16 + index * 12;
        if (i >= 16 && i < this.data.length){
            return this.dataView.getUint32(i);
        }
        return null;
    },

    mediaTimeAtIndex: function(index){
        var i;
        if (this.version === 1){
            i = 16 + index * 20;
            if (i >= 16 && i < this.data.length){
                return this._getUint64(i + 8);
            }
            return null;
        }
        // version 0
        i = 16 + index * 12;
        if (i >= 16 && i < this.data.length){
            return this.dataView.getUint32(i + 4);
        }
        return null;
    },

    mediaRateAtIndex: function(index){
        var i;
        if (this.version === 1){
            i = 16 + index * 20;
            if (i >= 16 && i < this.data.length){
                return this.dataView.getUint16(i + 16) + this.dataView.getUint16(i + 18) / 0x10000;
            }
            return null;
        }
        // version 0
        i = 16 + index * 12;
        if (i >= 16 && i < this.data.length){
            return this.dataView.getUint16(i + 8) + this.dataView.getUint16(i + 10) / 0x10000;
        }
        return null;
    }

});

})();