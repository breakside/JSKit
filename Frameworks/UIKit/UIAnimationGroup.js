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

// #import "UIAnimation.js"
'use strict';

JSClass('UIAnimationGroup', UIAnimation, {
    animations: null,
    layer: JSDynamicProperty('_layer', null),
    isComplete: false,

    init: function(){
        this.animations = [];
    },

    getLayer: function(){
        return this._layer;
    },

    addAnimation: function(animation){
        this.animations.push(animation);
        animation.layer = this._layer;
    },

    setLayer: function(layer){
        this._layer = layer;
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.layer = layer;
        }
    },

    updateForTime: function(t){
        var animation;
        var allComplete = true;
        this._percentComplete = 1;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.updateForTime(t);
            if (animation.percentComplete < this._percentComplete){
                this._percentComplete = animation.percentComplete;
            }
            if (allComplete && !animation.isComplete){
                allComplete = false;
            }
        }
        this.isComplete = allComplete;
    }
});