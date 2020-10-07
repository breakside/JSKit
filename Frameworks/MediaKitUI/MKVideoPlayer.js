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
// #import MediaKit
// #import "MKVideoView.js"
'use strict';

JSProtocol("MKVideoPlayerDelegate", JSProtocol, {
    videoPlayerDidChangeResolution: function(videoPlayer){}
});

JSClass("MKVideoPlayer", UIView, {

    initWithFrame: function(frame){
        MKVideoPlayer.$super.initWithFrame.call(this, frame);
        this.clipsToBounds = true;
        // this.backgroundColor = JSColor.black;
    },

    initWithSpec: function(spec){
        MKVideoPlayer.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("mirrored")){
            this.mirrored = spec.valueForKey("mirrored");
        }
        if (spec.containsKey("delegate")){
            this.delegate = spec.valueForKey("delegate");
        }
        if (!spec.containsKey("clipsToBounds")){
            this.clipsToBounds = true;
        }
        // this.backgroundColor = JSColor.black;
    },

    delegate: null,

    videoView: JSLazyInitProperty('_createVideoView'),

    _createVideoView: function(){
        var view = MKVideoView.init();
        view.backgroundColor = JSColor.black;
        view.delegate = this;
        this.addSubview(view);
        this.setNeedsLayout();
        return view;
    },

    videoResolution: JSReadOnlyProperty(),

    getVideoResolution: function(){
        return this.videoView.videoResolution;
    },

    asset: JSDynamicProperty(),

    getAsset: function(){
        return this.videoView.asset;
    },

    setAsset: function(asset){
        this.videoView.asset = asset;
    },

    mirrored: JSDynamicProperty('_mirrored', false),

    setMirrored: function(mirrored){
        this._mirrored = mirrored;
        this.setNeedsLayout();
    },

    play: function(){
        this.videoView.play();
    },

    pause: function(){
        this.videoView.pause();
    },

    mute: function(){
        this.videoView.mute();
    },

    layoutSubviews: function(){
        this.videoView.bounds = JSRect(JSPoint.Zero, this.bounds.size);
        this.videoView.position = this.bounds.center;
        if (this._mirrored){
            this.videoView.transform = JSAffineTransform.Scaled(-1, 1);
        }else{
            this.videoView.transform = JSAffineTransform.Identity;
        }
    },

    getIntrinsicSize: function(){
        return this.videoView.intrinsicSize;
    },

    videoViewDidChangeResolution: function(){
        if (this.delegate && this.delegate.videoPlayerDidChangeResolution){
            this.delegate.videoPlayerDidChangeResolution(this);
        }
    },

});