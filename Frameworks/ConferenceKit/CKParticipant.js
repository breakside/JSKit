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

// #import Foundation
'use strict';

JSClass("CKParticipant", JSObject, {

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
    },

    identifier: null,

    videoSoftMuted: JSReadOnlyProperty('_videoSoftMuted', true),
    audioSoftMuted: JSReadOnlyProperty('_audioSoftMuted', true),
    videoStreamMuted: JSReadOnlyProperty('_videoStreamMuted', true),
    audioStreamMuted: JSReadOnlyProperty('_audioStreamMuted', true),

    videoMuted: JSReadOnlyProperty(),
    audioMuted: JSReadOnlyProperty(),

    getVideoMuted: function(){
        return this._videoSoftMuted || this._videoStreamMuted;
    },

    getAudioMuted: function(){
        return this._audioSoftMuted || this._audioStreamMuted;
    },

    _setAudioSoftMuted: function(muted){
        this.willChangeValueForKey("audioMuted");
        this._audioSoftMuted = muted;
        this.didChangeValueForKey("audioMuted");
    },

    _setVideoSoftMuted: function(muted){
        this.willChangeValueForKey("videoMuted");
        this._videoSoftMuted = muted;
        this.didChangeValueForKey("videoMuted");
    },

    _setAudioStreamMuted: function(muted){
        this.willChangeValueForKey("audioMuted");
        this._audioStreamMuted = muted;
        this.didChangeValueForKey("audioMuted");
    },

    _setVideoStreamMuted: function(muted){
        this.willChangeValueForKey("videoMuted");
        this._videoStreamMuted = muted;
        this.didChangeValueForKey("videoMuted");
    }

});