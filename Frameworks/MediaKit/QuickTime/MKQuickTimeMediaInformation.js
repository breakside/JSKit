// #import "MKQuickTimeAtom.js"
// #import "MKQuickTimeSampleTable.js"
// #import "MKQuickTimeVideoMediaInformationHeader.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeMediaInformation", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.minf,

    initWithData: function(data){
        MKQuickTimeMediaInformation.$super.initWithData.call(this, data);
        this.registerAtomClass(MKQuickTimeSampleTable);
        this.registerAtomClass(MKQuickTimeVideoMediaInformationHeader);
        this.readAtoms(8);
    },

    sampleTable: JSReadOnlyProperty(),

    getSampleTable: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.stbl);
    },

    videoMediaInformationHeader: JSReadOnlyProperty(),

    getVideoMediaInformationHeader: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.vmhd);
    },

    sampleDurations: JSReadOnlyProperty(),

    getSampleDurations: function(){
        var sampleTable = this.sampleTable;
        if (sampleTable === null){
            return [];
        }
        return sampleTable.sampleDurations;
    },

    sampleCounts: JSReadOnlyProperty(),

    getSampleCounts: function(){
        var sampleTable = this.sampleTable;
        if (sampleTable === null){
            return [];
        }
        return sampleTable.sampleCounts;
    },

    audioSampleRates: JSReadOnlyProperty(),

    getAudioSampleRates: function(){
        var sampleTable = this.sampleTable;
        if (sampleTable === null){
            return [];
        }
        return sampleTable.audioSampleRates;
    },

    sampleFormats: JSReadOnlyProperty(),

    getSampleFormats: function(){
        var sampleTable = this.sampleTable;
        if (sampleTable === null){
            return [];
        }
        return sampleTable.sampleFormats;
    }

});

})();