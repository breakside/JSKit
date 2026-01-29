// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeSampleDescription", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.stsd,
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
        MKQuickTimeSampleDescription.$super.initWithData.call(this, data);
        if (data.length < 16){
            throw new Error("expecting at least 16 bytes for stsd atom");
        }
        // version 1 is allowed, but treated like version 0
        if (this.version > 1){
            throw new Error("Unsupported stsd version: %d".sprintf(this.version));
        }
    },

    getNumberOfEntries: function(){
        return this.dataView.getUint32(12);
    },

    formats: JSReadOnlyProperty(),

    getFormats: function(){
        var formats = [];
        var i = 16;
        var l = this.data.length;
        var n = this.numberOfEntries;
        var index = 0;
        var size;
        while (index < n && i < l - 16){
            size = this.dataView.getUint32(i);
            formats.push(this.dataView.getUint32(i + 4));
            i += size;
        }
        return formats;
    },

    audioSampleRates: JSReadOnlyProperty(),

    getAudioSampleRates: function(){
        var rates = [];
        var i = 16;
        var l = this.data.length;
        var n = this.numberOfEntries;
        var index = 0;
        var size;
        while (index < n && i < l - 16){
            size = this.dataView.getUint32(i);
            if (size >= 36){
                rates.push(this.dataView.getUint16(i + 32) + this.dataView.getUint16(i + 34) / 0x10000);
            }
            i += size;
        }
        return rates;
    }

});

})();