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
    number: null,

    videoSoftMuted: JSDynamicProperty('_videoSoftMuted', false),
    audioSoftMuted: JSDynamicProperty('_audioSoftMuted', false),
    videoStreamMuted: JSReadOnlyProperty('_videoStreamMuted', false),
    audioStreamMuted: JSReadOnlyProperty('_audioStreamMuted', false),

    videoMuted: JSReadOnlyProperty(),
    audioMuted: JSReadOnlyProperty(),

    getVideoMuted: function(){
        return this._videoSoftMuted || this._videoStreamMuted;
    },

    getAudioMuted: function(){
        return this._audioSoftMuted || this._audioStreamMuted;
    },

    setAudioSoftMuted: function(muted){
        if (muted === this._audioSoftMuted){
            return;
        }
        var change = !this._audioStreamMuted;
        if (change){
            this.willChangeValueForKey("audioMuted");
        }
        this._audioSoftMuted = muted;
        if (change){
            this.didChangeValueForKey("audioMuted");
        }
    },

    setVideoSoftMuted: function(muted){
        if (muted === this._videoSoftMuted){
            return;
        }
        var change = !this._videoStreamMuted;
        if (change){
            this.willChangeValueForKey("videoMuted");
        }
        this._videoSoftMuted = muted;
        if (change){
            this.didChangeValueForKey("videoMuted");
        }
    },

    _setAudioStreamMuted: function(muted){
        if (muted === this._audioStreamMuted){
            return;
        }
        var change = !this._audioSoftMuted;
        if (change){
            this.willChangeValueForKey("audioMuted");
        }
        this._audioStreamMuted = muted;
        if (change){
            this.didChangeValueForKey("audioMuted");
        }
    },

    _setVideoStreamMuted: function(muted){
        if (muted === this._videoStreamMuted){
            return;
        }
        var change = !this._videoSoftMuted;
        if (change){
            this.willChangeValueForKey("videoMuted");
        }
        this._videoStreamMuted = muted;
        if (change){
            this.didChangeValueForKey("videoMuted");
        }
    }

});