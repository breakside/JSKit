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

JSClass("MKVideoPlayer", UIView, {

    initWithFrame: function(frame){
        MKVideoPlayer.$super.initWithFrame.call(this, frame);
        this.backgroundColor = JSColor.black;
    },

    initWithSpec: function(spec){
        MKVideoPlayer.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("mirrored")){
            this.mirrored = spec.valueForKey("mirrored");
        }
        this.backgroundColor = JSColor.black;
    },

    videoView: JSLazyInitProperty('_createVideoView'),

    _createVideoView: function(){
        var view = MKVideoView.init();
        view.backgroundColor = JSColor.black;
        this.addSubview(view);
        this.setNeedsLayout();
        return view;
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
    },

    layoutSubviews: function(){
        this.videoView.frame = this.bounds;
        if (this._mirrored){
            this.videoView.transform = JSAffineTransform.Translated(this.videoView.bounds.size.width, 0).scaledBy(-1, 1);
        }else{
            this.videoView.transform = JSAffineTransform.Identity;
        }
    }

});