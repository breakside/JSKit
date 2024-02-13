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

// #import MediaKit
// #import "MKVideoView.js"
'use strict';

(function(){

var logger = JSLog("mediakit", "htmlvideo");

MKVideoView.definePropertiesFromExtensions({

    asset: JSDynamicProperty('_asset', null),

    setAsset: function(asset){
        if (this._asset === null && asset === null){
            return;
        }
        if (this._asset !== null && this._asset.isEqual(asset)){
            return;
        }
        this._asset = asset;
        this._updateVideoSource();
    },

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
            this.videoElement.src = null;
        }else if (this._asset.isKindOfClass(MKHTMLStream)){
            this.videoElement.srcObject = this._asset.htmlMediaStream;
            this.videoElement.src = null;
        }else if (this._asset.isKindOfClass(MKRemoteAsset)){
            this.videoElement.srcObject = null;
            this.videoElement.src = this._asset.url.encodedString;
        }else{
            this.videoElement.srcObject = null;
            this.videoElement.src = null;
        }
        this.videoElement.load();
    },

    _isWaitingForPlay: false,

    _updatePlaybackState: function(){
        if (this.videoElement === null){
            return;
        }
        var view = this;
        switch (this._playbackState){
            case MKVideoView.PlaybackState.notPlaying:
                break;
            case MKVideoView.PlaybackState.playing:
                if (!this._isWaitingForPlay){
                    this._isWaitingForPlay = true;
                    this.videoElement.play().then(function(){
                        view._isWaitingForPlay = false;
                        if (view.delegate && view.delegate.videoViewPlaybackStarted){
                            view.delegate.videoViewPlaybackStarted(view);
                        }
                        if (view._playbackState === MKVideoView.PlaybackState.paused){
                            view.videoElement.pause();
                            if (view.delegate && view.delegate.videoViewPlaybackPaused){
                                view.delegate.videoViewPlaybackPaused(view);
                            }
                        }
                    }, function(error){
                        logger.error("play() failed: %{error}", error);
                        view._isWaitingForPlay = false;
                        view._playbackState = MKVideoView.PlaybackState.notPlaying;
                        if (view.delegate && view.delegate.videoViewPlaybackFailed){
                            view.delegate.videoViewPlaybackFailed(view);
                        }
                    });
                }else{
                    logger.warn("play() requested while still waiting for an earlier play()");
                }
                break;
            case MKVideoView.PlaybackState.paused:
                if (!this._isWaitingForPlay){
                    this.videoElement.pause();
                    if (view.delegate && view.delegate.videoViewPlaybackPaused){
                        view.delegate.videoViewPlaybackPaused(view);
                    }
                }else{
                    logger.warn("pause() requested while still waiting for play()");
                }
                break;
        }
    },

    _updateMuted: function(){
        if (this.videoElement === null){
            return;
        }
        this.videoElement.muted = this.muted;
    },

    playbackTime: JSDynamicProperty(),
    duration: JSReadOnlyProperty(),

    getPlaybackTime: function(){
        if (this.videoElement !== null){
            return this.videoElement.currentTime;
        }
        return 0;
    },

    setPlaybackTime: function(playbackTime){
        if (this.videoElement === null){
            return;
        }
        this.videoElement.currentTime = playbackTime;
    },

    getDuration: function(){
        if (this.videoElement !== null){
            return this.videoElement.duration;
        }
        return 0;
    },

    // MARK: - Events

    handleEvent: function(e){
        this['_event_' + e.type](e);
    },

    addEventListeners: function(){
        this.videoElement.addEventListener("loadmetadata", this);
        this.videoElement.addEventListener("resize", this);
        this.videoElement.addEventListener("canplaythrough", this);
        this.videoElement.addEventListener("ended", this);
        this.videoElement.addEventListener("timeupdate", this);
    },

    removeEventListeners: function(){
        this.videoElement.removeEventListener("loadmetadata", this);
        this.videoElement.removeEventListener("resize", this);
        this.videoElement.removeEventListener("canplaythrough", this);
        this.videoElement.removeEventListener("ended", this);
        this.videoElement.removeEventListener("timeupdate", this);
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

    _event_canplaythrough: function(e){
        if (this.delegate && this.delegate.videoViewCanStartPlayback){
            this.delegate.videoViewCanStartPlayback(this);
        }
    },

    _event_ended: function(e){
        if (this.delegate && this.delegate.videoViewPlaybackPaused){
            this.delegate.videoViewPlaybackPaused(this);
        }
        this._playbackState = MKVideoView.PlaybackState.paused;
    },

    _event_timeupdate: function(e){
        if (this.delegate && this.delegate.videoViewPlaybackTimeUpdated){
            this.delegate.videoViewPlaybackTimeUpdated(this);
        }
    },

});

MKVideoView.layerClass = UIHTMLElementLayer;

})();