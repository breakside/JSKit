// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeTrackHeader", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.tkhd,
    version: JSReadOnlyProperty(),
    flags: JSReadOnlyProperty(),
    trackID: JSReadOnlyProperty(),
    duration: JSReadOnlyProperty(),
    width: JSReadOnlyProperty(),
    height: JSReadOnlyProperty(),

    getVersion: function(){
        return this.data[8];
    },

    getFlags: function(){
        return this.dataView.getUint32(8) & 0x00FFFFFF;
    },

    enabled: JSReadOnlyProperty(),

    getEnabled: function(){
        return (this.flags & 0x0001) === 0x0001;
    },

    inMovie: JSReadOnlyProperty(),

    getInMovie: function(){
        return (this.flags & 0x0001) === 0x0001;
    },

    getTrackID: function(){
        return this.dataView.getUint32(20);
    },

    getDuration: function(){
        return this.dataView.getUint32(28);
    },

    getWidth: function(){
        return this.dataView.getUint16(84) + this.dataView.getUint16(86) / 0x10000;
    },

    getHeight: function(){
        return this.dataView.getUint16(88) + this.dataView.getUint16(90) / 0x10000;
    },

    videoResolution: JSReadOnlyProperty(),

    getVideoResolution: function(){
        return JSSize(this.width, this.height);
    },

    initWithData: function(data){
        if (data.length < 92){
            throw new Error("expecting at least 92 bytes for tkhd atom");
        }
        MKQuickTimeTrackHeader.$super.initWithData.call(this, data);
    },

    dictionaryRepresentation: function(){
        return {
            type: MKQuickTimeAtom.stringForType(this.type),
            version: this.version,
            enabled: this.enabled,
            inMovie: this.inMovie,
            trackID: this.trackID,
            duration: this.duration,
            width: this.width,
            height: this.height
        };
    },

});

})();