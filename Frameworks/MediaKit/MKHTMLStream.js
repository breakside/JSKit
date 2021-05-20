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

    addHTMLTrack: function(htmlTrack){
        this.htmlMediaStream.addTrack(htmlTrack);
        if (htmlTrack.kind === "audio"){
            if (this.htmlAudioTrack === null){
                this.htmlAudioTrack = htmlTrack;
            }
        }else if (htmlTrack.kind == "video"){
            if (this.htmlVideoTrack === null){
                this.htmlVideoTrack = htmlTrack;
            }
        }
    },

    audioMuted: JSDynamicProperty(),

    getAudioMuted: function(){
        if (this.htmlAudioTrack){
            return !this.htmlAudioTrack.enabled;
        }
        return true;
    },

    setAudioMuted: function(muted){
        if (this.htmlAudioTrack !== null){
            this.htmlAudioTrack.enabled = !muted;
        }
    },

    videoMuted: JSDynamicProperty(),

    getVideoMuted: function(){
        if (this.htmlVideoTrack){
            return !this.htmlVideoTrack.enabled;
        }
        return true;
    },

    setVideoMuted: function(muted){
        if (this.htmlVideoTrack !== null){
            this.htmlVideoTrack.enabled = !muted;
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

    close: function(){
        if (this.htmlVideoTrack !== null){
            this.htmlVideoTrack.stop();
        }
        if (this.htmlAudioTrack !== null){
            this.htmlAudioTrack.stop();
        }
    }

});

MKStream.openLocalStreamOfType = function(type, completion, target){
    if (!completion){
        completion = Promise.completion();
    }
    var constraints = {
        audio: (type & MKStream.Type.audio) == MKStream.Type.audio,
        video: (type & MKStream.Type.video) == MKStream.Type.video
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function(htmlMediaStream){
        var stream = MKHTMLStream.initWithHTMLMediaStream(htmlMediaStream);
        completion.call(target, stream);
    }, function(error){
        completion.call(target, null);
    });
    return completion.promise;
};