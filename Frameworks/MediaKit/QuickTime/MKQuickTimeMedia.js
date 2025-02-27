// #import "MKQuickTimeAtom.js"
// #import "MKQuickTimeMediaHeader.js"
// #import "MKQuickTimeMediaHandler.js"
// #import "MKQuickTimeMediaInformation.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeMedia", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.mdia,

    initWithData: function(data){
        MKQuickTimeMedia.$super.initWithData.call(this, data);
        this.registerAtomClass(MKQuickTimeMediaHeader);
        this.registerAtomClass(MKQuickTimeMediaHandler);
        this.registerAtomClass(MKQuickTimeMediaInformation);
        this.readAtoms(8);
    },

    mediaHeader: JSReadOnlyProperty(),

    getMediaHeader: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.mdhd);
    },

    mediaInformation: JSReadOnlyProperty(),

    getMediaInformation: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.minf);
    },

    mediaHandler: JSReadOnlyProperty(),

    getMediaHandler: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.hdlr);
    },

    videoFrameRates: JSReadOnlyProperty(),

    getVideoFrameRates: function(){
        var handler = this.mediaHandler;
        if (handler === null){
            return [];
        }
        if (handler.componentSubtype !== MKQuickTimeMediaHandler.ComponentSubtype.vide){
            return [];
        }
        var info = this.mediaInformation;
        if (info === null){
            return [];
        }
        var header = this.mediaHeader;
        if (header === null){
            return [];
        }
        var rates = [];
        var durations = info.sampleDurations;
        var i, l;
        for (i = 0, l = durations.length; i < l; ++i){
            rates.push(header.timeScale / durations[i]);
        }
        return rates;
    },

    averageVideoFrameRate: JSReadOnlyProperty(),

    getAverageVideoFrameRate: function(){
        var handler = this.mediaHandler;
        if (handler === null){
            return null;
        }
        if (handler.componentSubtype !== MKQuickTimeMediaHandler.ComponentSubtype.vide){
            return null;
        }
        var info = this.mediaInformation;
        if (info === null){
            return null;
        }
        var header = this.mediaHeader;
        if (header === null){
            return null;
        }
        var counts = info.sampleCounts;
        var durations = info.sampleDurations;
        var totalCount = 0;
        var totalSeconds = 0;
        var i, l;
        for (i = 0, l = durations.length; i < l; ++i){
            totalCount += counts[i];
            totalSeconds += (durations[i] * counts[i]) / header.timeScale;
        }
        return totalCount / totalSeconds;
    },

    audioSampleRates: JSReadOnlyProperty(),

    getAudioSampleRates: function(){
        var handler = this.mediaHandler;
        if (handler === null){
            return [];
        }
        if (handler.componentSubtype !== MKQuickTimeMediaHandler.ComponentSubtype.soun){
            return [];
        }
        var info = this.mediaInformation;
        if (info === null){
            return [];
        }
        return info.audioSampleRates;
    },

    sampleFormats: JSReadOnlyProperty(),

    getSampleFormats: function(){
        var info = this.mediaInformation;
        if (info === null){
            return [];
        }
        return info.sampleFormats;
    },

    bitrate: JSReadOnlyProperty(),

    getBitrate: function(){
        var info = this.mediaInformation;
        if (info === null){
            return null;
        }
        var header = this.mediaHeader;
        if (header === null){
            return null;
        }
        var sampleTable = info.sampleTable;
        if (sampleTable === null){
            return null;
        }
        var sizeTable = sampleTable.sampleSize;
        if (sizeTable === null){
            return null;
        }
        var counts = info.sampleCounts;
        var durations = info.sampleDurations;
        var totalSeconds = 0;
        var totalBytes = 0;
        var i, l;
        var j;
        var s = 0;
        for (i = 0, l = durations.length; i < l; ++i){
            for (j = 0; j < counts[i]; ++j, ++s){
                totalBytes += sizeTable.sizeAtIndex(s);
            }
            totalSeconds += (durations[i] * counts[i]) / header.timeScale;
        }
        return (totalBytes * 8) / totalSeconds;
    }

});

})();