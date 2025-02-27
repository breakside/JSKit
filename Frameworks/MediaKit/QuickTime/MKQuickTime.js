// #import "MKQuickTimeAtom.js"
// #import "MKQuickTimeFileType.js"
// #import "MKQuickTimeMovie.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTime", MKQuickTimeAtom, {

    initWithData: function(data){
        this.atoms = [];
        this.data = data;
        this.dataView = data.dataView();
        this.registerAtomClass(MKQuickTimeFileType);
        this.registerAtomClass(MKQuickTimeMovie);
        this.readAtoms();
    },

    duration: JSReadOnlyProperty(),

    getDuration: function(){
        var movie = this.movie;
        if (movie === null){
            return -1;
        }
        var header = movie.movieHeader;
        if (header === null){
            return -1;
        }
        return header.duration / header.timeScale;
    },

    posterTime: JSReadOnlyProperty(),

    getPosterTime: function(){
        var movie = this.movie;
        if (movie === null){
            return 0;
        }
        var header = movie.movieHeader;
        if (header === null){
            return 0;
        }
        return header.posterTime / header.timeScale;
    },

    fileType: JSReadOnlyProperty(),

    getFileType: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.ftyp);
    },

    movie: JSReadOnlyProperty(),

    getMovie: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.moov);
    },

    dictionaryRepresentation: function(){
        return {
        };
    },

    videoResolutions: JSReadOnlyProperty(),

    getVideoResolutions: function(){
        var resolutions = [];
        var movie = this.movie;
        if (movie !== null){
            var videoTracks = movie.videoTracks;
            var i, l;
            var track;
            var resolution;
            for (i = 0, l = videoTracks.length; i < l; ++i){
                track = videoTracks[i];
                resolution = track.videoResolution;
                if (resolution !== null){
                    resolutions.push(resolution);
                }
            }
        }
        return resolutions;
    },

    videoTracks: JSReadOnlyProperty(),

    getVideoTracks: function(){
        var movie = this.movie;
        if (movie === null){
            return [];
        }
        return movie.videoTracks;
    },

    audioTracks: JSReadOnlyProperty(),

    getAudioTracks: function(){
        var movie = this.movie;
        if (movie === null){
            return [];
        }
        return movie.audioTracks;
    },

    videoFrameRates: JSReadOnlyProperty(),

    getVideoFrameRates: function(){
        var movie = this.movie;
        if (movie === null){
            return [];
        }
        var tracks = movie.videoTracks;
        var i, l;
        var rates = [];
        for (i = 0, l = tracks.length; i < l; ++i){
            rates = rates.concat(tracks[i].sampleRates);
        }
        return rates;
    },

    audioSampleRates: JSReadOnlyProperty(),

    getAudioSampleRates: function(){
        var movie = this.movie;
        if (movie === null){
            return [];
        }
        var tracks = movie.audioTracks;
        var i, l;
        var rates = [];
        for (i = 0, l = tracks.length; i < l; ++i){
            rates = rates.concat(tracks[i].sampleRates);
        }
        return rates;
    },

    videoFormats: JSReadOnlyProperty(),

    getVideoFormats: function(){
        var movie = this.movie;
        if (movie === null){
            return [];
        }
        var tracks = movie.videoTracks;
        var i, l;
        var formats = [];
        for (i = 0, l = tracks.length; i < l; ++i){
            formats = formats.concat(tracks[i].sampleFormats);
        }
        return formats;
    },

    audioFormats: JSReadOnlyProperty(),

    getAudioFormats: function(){
        var movie = this.movie;
        if (movie === null){
            return [];
        }
        var tracks = movie.audioTracks;
        var i, l;
        var formats = [];
        for (i = 0, l = tracks.length; i < l; ++i){
            formats = formats.concat(tracks[i].sampleFormats);
        }
        return formats;
    },

    metadata: JSReadOnlyProperty(),

    getMetadata: function(){
        var metadata = {
            format: MKQuickTimeAtom.stringForType(this.fileType !== null ? this.fileType.majorBrand : MKQuickTimeFileType.MajorBrand.qt),
            duration: this.duration,
            posterTime: this.posterTime,
            video: false,
            audio: false,
            tracks: []
        };
        var i, l;
        var movie = this.movie;
        if (movie !== null){
            var tracks = movie.tracks;
            var track;
            for (i = 0, l = tracks.length; i < l; ++i){
                track = tracks[i];
                if (track.enabled && track.inMovie){
                    if (track.isVideo){
                        metadata.tracks.push({
                            type: "video",
                            width: track.videoResolution.width,
                            height: track.videoResolution.height,
                            formats: MKQuickTimeAtom.stringsForTypes(track.sampleFormats),
                            frameRates: track.videoFrameRates,
                            averageFrameRate: track.averageVideoFrameRate,
                            bitrate: track.bitrate
                        });
                        metadata.video = true;
                    }else if (track.isAudio){
                        metadata.tracks.push({
                            type: "audio",
                            formats: MKQuickTimeAtom.stringsForTypes(track.sampleFormats),
                            sampleRates: track.audioSampleRates,
                            bitrate: track.bitrate
                        });
                        metadata.audio = true;
                    }
                }
            }
        }
        return metadata;
    },

});

})();