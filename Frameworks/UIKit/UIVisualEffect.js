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

    animationInterpolation: function(from, to, progress){
        return UIBlurEffect.initWithRadius(from.radius + (to.radius - from.radius) * progress);
    }

});

JSClass("UIGrayscaleEffect", UIVisualEffect, {

    value: 1,

    initWithValue: function(value){
        this.value = value;
    },

    animationInterpolation: function(from, to, progress){
        return UIGrayscaleEffect.initWithValue(from.value + (to.value - from.value) * progress);
    }

});

JSClass("UISepiaEffect", UIVisualEffect, {

    value: 1,

    initWithValue: function(value){
        this.value = value;
    },

    animationInterpolation: function(from, to, progress){
        return UISepiaEffect.initWithValue(from.value + (to.value - from.value) * progress);
    }

});

JSClass("UIDesaturateEffect", UIVisualEffect, {

    value: 1,

    initWithValue: function(value){
        this.value = value;
    },

    animationInterpolation: function(from, to, progress){
        return UIDesaturateEffect.initWithValue(from.value + (to.value - from.value) * progress);
    }

});