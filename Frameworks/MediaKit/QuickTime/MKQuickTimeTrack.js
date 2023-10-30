// #import "MKQuickTimeAtom.js"
// #import "MKQuickTimeTrackHeader.js"
// #import "MKQuickTimeMedia.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeTrack", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.trak,

    initWithData: function(data){
        MKQuickTimeTrack.$super.initWithData.call(this, data);
        this.registerAtomClass(MKQuickTimeTrackHeader);
        this.registerAtomClass(MKQuickTimeMedia);
        this.readAtoms(8);
    },

    trackHeader: JSReadOnlyProperty(),

    getTrackHeader: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.tkhd);
    },

    media: JSReadOnlyProperty(),

    getMedia: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.mdia);
    },

    isVideo: JSReadOnlyProperty(),

    getIsVideo: function(){
        var media = this.media;
        if (media === null){
            return false;
        }
        var handler = media.mediaHandler;
        if (handler === null){
            return false;
        }
        return (handler.componentType === MKQuickTimeMediaHandler.ComponentType.unspecified || handler.componentType === MKQuickTimeMediaHandler.ComponentType.mhlr) && handler.componentSubtype === MKQuickTimeMediaHandler.ComponentSubtype.vide;
    },

    isAudio: JSReadOnlyProperty(),

    getIsAudio: function(){
        var media = this.media;
        if (media === null){
            return false;
        }
        var handler = media.mediaHandler;
        if (handler === null){
            return false;
        }
        return (handler.componentType === MKQuickTimeMediaHandler.ComponentType.unspecified || handler.componentType === MKQuickTimeMediaHandler.ComponentType.mhlr) && handler.componentSubtype === MKQuickTimeMediaHandler.ComponentSubtype.soun;
    },

    inMovie: JSReadOnlyProperty(),

    getInMovie: function(){
        var header = this.trackHeader;
        if (header === null){
            return false;
        }
        return header.inMovie;
    },

    enabled: JSReadOnlyProperty(),

    getEnabled: function(){
        var header = this.trackHeader;
        if (header === null){
            return false;
        }
        return header.enabled;
    },

    videoResolution: JSReadOnlyProperty(),

    getVideoResolution: function(){
        var header = this.trackHeader;
        if (header === null){
            return null;
        }
        return header.videoResolution;
    },

    videoFrameRates: JSReadOnlyProperty(),

    getVideoFrameRates: function(){
        var media = this.media;
        if (media === null){
            return [];
        }
        return media.videoFrameRates;
    },

    averageVideoFrameRate: JSReadOnlyProperty(),

    getAverageVideoFrameRate: function(){
        var media = this.media;
        if (media === null){
            return [];
        }
        return media.averageVideoFrameRate;
    },

    audioSampleRates: JSReadOnlyProperty(),

    getAudioSampleRates: function(){
        var media = this.media;
        if (media === null){
            return [];
        }
        return media.audioSampleRates;
    },

    sampleFormats: JSReadOnlyProperty(),

    getSampleFormats: function(){
        var media = this.media;
        if (media === null){
            return [];
        }
        return media.sampleFormats;
    }

});

})();