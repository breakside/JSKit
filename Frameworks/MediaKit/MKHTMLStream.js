// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "MKStream.js"
// #feature navigator.mediaDevices
// jshint browser: true
'use strict';

JSClass("MKHTMLStream", MKStream, {

    initWithHTMLMediaStream: function(htmlMediaStream){
        this.htmlMediaStream = htmlMediaStream;
        this.htmlVideoTrack = htmlMediaStream.getVideoTracks()[0] || null;
        this.htmlAudioTrack = htmlMediaStream.getAudioTracks()[0] || null;
    },

    muteAudio: function(){
        if (this.htmlAudioTrack !== null){
            this.htmlAudioTrack.enabled = false;
        }
    },

    unmuteAudio: function(){
        if (this.htmlAudioTrack !== null){
            this.htmlAudioTrack.enabled = true;
        }
    },

    videoResolution: JSLazyInitProperty('_getVideoResolution'),

    _getVideoResolution: function(){
        var settings;
        if (this.htmlVideoTrack !== null){
            settings = this.htmlVideoTrack.getSettings();
            if (settings.width !== 0 && settings.height !== 0){
                return JSSize(settings.width, settings.height);
            }
        }
        return null;
    },

    htmlMediaStream: null,
    htmlVideoTrack: null,
    htmlAudioTrack: null,

});

MKStream.requestLocalVideo = function(completion, target){
    if (!completion){
        completion = Promise.completion();
    }
    var constraints = {
        audio: true,
        video: true
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function(htmlMediaStream){
        var stream = MKHTMLStream.initWithHTMLMediaStream(htmlMediaStream);
        completion.call(target, stream);
    }, function(error){
        completion.call(target, null);
    });
    return completion.promise;
};