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

// #import "MKVideoView.js"
'use strict';

MKVideoView.definePropertiesFromExtensions({

    asset: JSDynamicProperty('_asset', null),

    setAsset: function(asset){
        this._asset = asset;
        this._updateVideoSource();
    },

    playbackState: 0,

    play: function(){
        this._playbackState = MKVideoView.PlaybackState.playing;
        this._updatePlaybackState();
    },

    pause: function(){
        this._playbackState = MKVideoView.PlaybackState.paused;
        this._updatePlaybackState();
    },

    elementNameForLayer: function(layer){
        return "video";
    },

    layerDidCreateElement: function(layer){
        this.videoElement = layer.element;
        this.videoElement.playsInline = true;
        this.addEventListeners();
        this._updateVideoSource();
        this._updatePlaybackState();
    },

    layerWillDestroyElement: function(layer){
        this.removeEventListeners();
        this.videoElement = null;
    },

    videoElement: null,

    _updateVideoSource: function(){
        if (this.videoElement === null){
            return;
        }
        if (this._asset === null){
            this.videoElement.srcObject = null;
        }else if (this._asset.isKindOfClass(MKHTMLStream)){
            this.videoElement.srcObject = this._asset.htmlMediaStream;
        }else{
            this.videoElement.srcObject = null;
        }
    },

    _updatePlaybackState: function(){
        if (this.videoElement === null){
            return;
        }
        var view = this;
        switch (this._playbackState){
            case MKVideoView.PlaybackState.notPlaying:
                break;
            case MKVideoView.PlaybackState.playing:
                this.videoElement.play().then(function(){
                }, function(error){
                    view._playbackState = MKVideoView.PlaybackState.notPlaying;
                });
                break;
            case MKVideoView.PlaybackState.paused:
                this.videoElement.pause();
                break;
        }
    },

    // MARK: - Events

    handleEvent: function(e){
        this['_event_' + e.type](e);
    },

    addEventListeners: function(){
        // this.videoElement.addEventListener("load", this);
    },

    removeEventListeners: function(){
        // this.videoElement.removeEventListener("load", this);
    }

});

MKVideoView.layerClass = UIHTMLElementLayer;