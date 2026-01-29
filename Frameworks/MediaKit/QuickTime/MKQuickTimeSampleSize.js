// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeSampleSize", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.stsz,
    version: JSReadOnlyProperty(),
    flags: JSReadOnlyProperty(),
    sampleSize: JSReadOnlyProperty(),
    numberOfEntries: JSReadOnlyProperty(),

    getVersion: function(){
        return this.data[8];
    },

    getFlags: function(){
        return this.dataView.getUint32(8) & 0x00FFFFFF;
    },

    initWithData: function(data){
        MKQuickTimeSampleSize.$super.initWithData.call(this, data);
        if (data.length < 20){
            throw new Error("expecting at least 20 bytes for stsz atom");
        }
        if (this.version > 0){
            throw new Error("Unsupported stsz version: %d".sprintf(this.version));
        }
    },

    getSampleSize: function(){
        return this.dataView.getUint32(12);
    },

    getNumberOfEntries: function(){
        return this.dataView.getUint32(16);
    },

    sizeAtIndex: function(index){
        if (this.sampleSize !== 0){
            return this.sampleSize;
        }
        var i = 20 + index * 4;
        if (i >= 20 && i < this.data.length){
            return this.dataView.getUint32(i);
        }
        return null;
    }

});

})();