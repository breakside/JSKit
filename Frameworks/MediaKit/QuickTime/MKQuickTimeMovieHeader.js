// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeMovieHeader", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.mvhd,
    version: JSReadOnlyProperty(),
    flags: JSReadOnlyProperty(),
    timeScale: JSReadOnlyProperty(),
    duration: JSReadOnlyProperty(),
    preferredRate: JSReadOnlyProperty(),
    posterTime: JSReadOnlyProperty(),

    getVersion: function(){
        return this.data[8];
    },

    getFlags: function(){
        return this.dataView.getUint32(8) & 0x00FFFFFF;
    },

    getTimeScale: function(){
        if (this.version === 1){
            return this.dataView.getUint32(28);
        }
        // version 0
        return this.dataView.getUint32(20);
    },

    getDuration: function(){
        if (this.version === 1){
            return this._getUint64(32);
        }
        // version 0
        return this.dataView.getUint32(24);
    },

    getPreferredRate: function(){
        if (this.version === 1){
            return this.dataView.getUint16(40) + this.dataView.getUint16(42) / 0x10000;
        }
        // version 0
        return this.dataView.getUint16(28) + this.dataView.getUint16(30) / 0x10000;
    },

    getPosterTime: function(){
        if (this.version === 1){
            return this.dataView.getUint32(90);
        }
        // version 0
        return this.dataView.getUint32(78);
    },

    initWithData: function(data){
        MKQuickTimeMovieHeader.$super.initWithData.call(this, data);
        if (data.length < 12){
            Error("expecting at least 12 bytes for mvhd atom");
        }
        if (this.version > 1){
            throw new Error("Unsupported mvhd version: %d".sprintf(this.version));
        }
        if (this.version === 1){
            if (data.length < 110){
                throw new Error("expecting at least 110 bytes for mvhd v1 atom");
            }
        }
        if (data.length < 98){
            throw new Error("expecting at least 98 bytes for mvhd atom");
        }
    },

    dictionaryRepresentation: function(){
        return {
            type: MKQuickTimeAtom.stringForType(this.type),
            version: this.version,
            timeScale: this.timeScale,
            duration: this.duration,
            preferredRate: this.preferredRate,
            posterTime: this.posterTime
        };
    },

});

})();