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
        return this.dataView.getUint32(20);
    },

    getDuration: function(){
        return this.dataView.getUint32(24);
    },

    getPreferredRate: function(){
        return this.dataView.getUint16(28) + this.dataView.getUint16(30) / 0x10000;
    },

    getPosterTime: function(){
        return this.dataView.getUint32(78);
    },

    initWithData: function(data){
        if (data.length < 98){
            throw new Error("expecting at least 98 bytes for mvhd atom");
        }
        MKQuickTimeMovieHeader.$super.initWithData.call(this, data);
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