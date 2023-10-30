// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeTimeToSample", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.stts,
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
        MKQuickTimeTimeToSample.$super.initWithData.call(this, data);
        if (data.length < 16){
            throw new Error("expecting at least 16 bytes for stts atom");
        }
        var n = this.numberOfEntries;
        var l = 16 + 8 * n;
        if (data.length < l){
            throw new Error("expecting at least %d bytes for stts atom with %d entries".sprintf(l, n));
        }
    },

    getNumberOfEntries: function(){
        return this.dataView.getUint32(12);
    },

    countAtIndex: function(index){
        var i = 16 + index * 8;
        if (i >= 16 && i < this.data.length){
            return this.dataView.getUint32(i);
        }
        return null;
    },

    durationAtIndex: function(index){
        var i = 16 + index * 8;
        if (i >= 16 && i < this.data.length){
            return this.dataView.getUint32(i + 4);
        }
        return null;
    }

});

})();