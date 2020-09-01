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

    muted: false,

    mute: function(){
        this.muted = true;
        this._updateMuted();
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
        this._updateMuted();
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

    _updateMuted: function(){
        if (this.videoElement === null){
            return;
        }
        this.videoElement.muted = this.muted;
    },

    // MARK: - Events

    handleEvent: function(e){
        this['_event_' + e.type](e);
    },

    addEventListeners: function(){
        this.videoElement.addEventListener("loadmetadata", this);
        this.videoElement.addEventListener("resize", this);
    },

    removeEventListeners: function(){
        this.videoElement.removeEventListener("loadmetadata", this);
        this.videoElement.removeEventListener("resize", this);
    },

    _event_loadmetadata: function(){
        this.videoResolution = JSSize(this.videoElement.videoWidth, this.videoElement.videoHeight);
        if (this.delegate && this.delegate.videoViewDidChangeResolution){
            this.delegate.videoViewDidChangeResolution(this);
        }
    },

    _event_resize: function(){
        this.videoResolution = JSSize(this.videoElement.videoWidth, this.videoElement.videoHeight);
        if (this.delegate && this.delegate.videoViewDidChangeResolution){
            this.delegate.videoViewDidChangeResolution(this);
        }
    },

});

MKVideoView.layerClass = UIHTMLElementLayer;