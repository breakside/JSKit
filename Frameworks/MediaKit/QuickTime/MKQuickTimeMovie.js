// #import "MKQuickTimeAtom.js"
// #import "MKQuickTimeMovieHeader.js"
// #import "MKQuickTimeTrack.js"
// #import "MKQuickTimeUserData.js"
// #import "MKQuickTimeMeta.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeMovie", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.moov,

    initWithData: function(data){
        MKQuickTimeMovie.$super.initWithData.call(this, data);
        this.registerAtomClass(MKQuickTimeMovieHeader);
        this.registerAtomClass(MKQuickTimeTrack);
        this.registerAtomClass(MKQuickTimeUserData);
        this.registerAtomClass(MKQuickTimeMeta);
        this.readAtoms(8);
    },

    movieHeader: JSReadOnlyProperty(),

    getMovieHeader: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.mvhd);
    },

    tracks: JSReadOnlyProperty(),

    getTracks: function(){
        return this.atomsOfType(MKQuickTimeAtom.Type.trak);
    },

    trackForID: function(trackID){
        var i, l;
        var tracks = this.tracks;
        for (i = 0, l = tracks.length; i < l; ++i){
            if (tracks[i].trackID === trackID){
                return tracks[i];
            }
        }
        return null;
    },

    videoTracks: JSReadOnlyProperty(),

    getVideoTracks: function(){
        var i, l;
        var tracks = this.tracks;
        var videoTracks = [];
        for (i = 0, l = tracks.length; i < l; ++i){
            if (tracks[i].enabled && tracks[i].inMovie && tracks[i].isVideo){
                videoTracks.push(tracks[i]);
            }
        }
        return videoTracks;
    },

    audioTracks: JSReadOnlyProperty(),

    getAudioTracks: function(){
        var i, l;
        var tracks = this.tracks;
        var videoTracks = [];
        for (i = 0, l = tracks.length; i < l; ++i){
            if (tracks[i].enabled && tracks[i].inMovie && tracks[i].isAudio){
                videoTracks.push(tracks[i]);
            }
        }
        return videoTracks;
    },

});

})();