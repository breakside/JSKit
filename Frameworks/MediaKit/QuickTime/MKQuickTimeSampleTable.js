// #import "MKQuickTimeAtom.js"
// #import "MKQuickTimeTimeToSample.js"
// #import "MKQuickTimeSampleDescription.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");


JSClass("MKQuickTimeSampleTable", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.stbl,

    initWithData: function(data){
        MKQuickTimeSampleTable.$super.initWithData.call(this, data);
        this.registerAtomClass(MKQuickTimeTimeToSample);
        this.registerAtomClass(MKQuickTimeSampleDescription);
        this.readAtoms(8);
    },

    timeToSample: JSReadOnlyProperty(),

    getTimeToSample: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.stts);
    },

    sampleDescription: JSReadOnlyProperty(),

    getSampleDescription: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.stsd);
    },

    sampleDurations: JSReadOnlyProperty(),

    getSampleDurations: function(){
        var timeToSample = this.timeToSample;
        var durations = [];
        if (timeToSample !== null){
            var i, l;
            for (i = 0, l = timeToSample.numberOfEntries; i < l; ++i){
                durations.push(timeToSample.durationAtIndex(i));
            }
        }
        return durations;
    },

    sampleCounts: JSReadOnlyProperty(),

    getSampleCounts: function(){
        var timeToSample = this.timeToSample;
        var counts = [];
        if (timeToSample !== null){
            var i, l;
            for (i = 0, l = timeToSample.numberOfEntries; i < l; ++i){
                counts.push(timeToSample.countAtIndex(i));
            }
        }
        return counts;
    },

    audioSampleRates: JSReadOnlyProperty(),

    getAudioSampleRates: function(){
        var description = this.sampleDescription;
        if (description === null){
            return [];
        }
        return description.audioSampleRates;
    },

    sampleFormats: JSReadOnlyProperty(),

    getSampleFormats: function(){
        var description = this.sampleDescription;
        if (description === null){
            return [];
        }
        return description.formats;
    }

});

})();