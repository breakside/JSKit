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

// #import UIKit
'use strict';

JSProtocol("MKVideoViewDelegate", JSProtocol, {
    videoViewDidChangeResolution: function(videoView){}
});

JSClass("MKVideoView", UIView, {

    playbackState: JSReadOnlyProperty('_playbackState', 0),

    delegate: null,

    play: function(){
    },

    pause: function(){
    },

    mute: function(){
    },

    asset: null,

    videoResolution: null,

    getIntrinsicSize: function(){
        if (this.videoResolution !== null && this.videoResolution.width > 0 && this.videoResolution.height > 0){
            return this.videoResolution;
        }
        return JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
    }
    
});

MKVideoView.PlaybackState = {
    notPlaying: 0,
    playing: 1,
    paused: 2
};