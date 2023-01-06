// Copyright 2023 Breakside Inc.
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
//
// #import Foundation
"use strict";

JSClass("UIVisualEffect", JSObject, {

});

JSClass("UIBlurEffect", UIVisualEffect, {

    radius: 10,

    initWithRadius: function(radius){
        this.radius = radius;
    },

    initWithSpec: function(spec){
        UIBlurEffect.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("radius")){
            this.radius = spec.valueForKey("radius", Number);
        }
    },

    animationInterpolation: function(from, to, progress){
        return UIBlurEffect.initWithRadius(from.radius + (to.radius - from.radius) * progress);
    },

    defaultAnimationValue: function(){
        return UIBlurEffect.initWithRadius(0);
    }

});

JSClass("UIGrayscaleEffect", UIVisualEffect, {

    percentage: 1,

    initWithPercentage: function(percentage){
        this.percentage = percentage;
    },

    initWithSpec: function(spec){
        UIGrayscaleEffect.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("percentage")){
            this.percentage = spec.valueForKey("percentage", Number);
        }
    },

    animationInterpolation: function(from, to, progress){
        return UIGrayscaleEffect.initWithPercentage(from.percentage + (to.percentage - from.percentage) * progress);
    },

    defaultAnimationValue: function(){
        return UIGrayscaleEffect.initWithPercentage(0);
    }

});

JSClass("UISepiaEffect", UIVisualEffect, {

    percentage: 1,

    initWithPercentage: function(percentage){
        this.percentage = percentage;
    },

    initWithSpec: function(spec){
        UISepiaEffect.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("percentage")){
            this.percentage = spec.valueForKey("percentage", Number);
        }
    },

    animationInterpolation: function(from, to, progress){
        return UISepiaEffect.initWithPercentage(from.percentage + (to.percentage - from.percentage) * progress);
    },

    defaultAnimationValue: function(){
        return UISepiaEffect.initWithPercentage(0);
    }

});

JSClass("UIDesaturateEffect", UIVisualEffect, {

    percentage: 1,

    initWithPercentage: function(percentage){
        this.percentage = percentage;
    },

    initWithSpec: function(spec){
        UIDesaturateEffect.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("percentage")){
            this.percentage = spec.valueForKey("percentage", Number);
        }
    },

    animationInterpolation: function(from, to, progress){
        return UIDesaturateEffect.initWithPercentage(from.percentage + (to.percentage - from.percentage) * progress);
    },

    defaultAnimationValue: function(){
        return UIDesaturateEffect.initWithPercentage(0);
    }

});