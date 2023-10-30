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
        return this.dataView.getUint32(20);
    },

    getDuration: function(){
        return this.dataView.getUint32(24);
    },

    initWithData: function(data){
        if (data.length < 28){
            throw new Error("expecting at least 28 bytes for mdhd atom");
        }
        MKQuickTimeMediaHeader.$super.initWithData.call(this, data);
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