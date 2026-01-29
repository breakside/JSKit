// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeMediaHeader", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.mdhd,
    version: JSReadOnlyProperty(),
    flags: JSReadOnlyProperty(),
    timeScale: JSReadOnlyProperty(),
    duration: JSReadOnlyProperty(),

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

    initWithData: function(data){
        MKQuickTimeMediaHeader.$super.initWithData.call(this, data);
        if (data.length < 12){
            Error("expecting at least 12 bytes for mdhd atom");
        }
        if (this.version > 1){
            throw new Error("Unsupported mdhd version: %d".sprintf(this.version));
        }
        if (this.version === 1){
            if (data.length < 40){
                throw new Error("expecting at least 40 bytes for mdhd v1 atom");
            }
        }
        if (data.length < 28){
            throw new Error("expecting at least 28 bytes for mdhd atom");
        }
    },

    dictionaryRepresentation: function(){
        return {
            type: MKQuickTimeAtom.stringForType(this.type),
            version: this.version,
            timeScale: this.timeScale,
            duration: this.duration
        };
    },

});

})();