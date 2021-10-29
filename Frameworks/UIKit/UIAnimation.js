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

JSClass('UIAnimation', JSObject, {
    completionFunction: null,
    isComplete: false,
    percentComplete: JSDynamicProperty('_percentComplete', 0),

    updateForTime: function(t){
    },

    pause: function(){
    },

    resume: function(){
    },

    reverse: function(){
    }

});

UIAnimation.Timing = Object.create({}, {
    linear: {
        value: function(t){
            return t;
        }
    },

    cubicBezier: {
        value: function(controlPoint1, controlPoint2){
            var curve = JSCubicBezier(JSPoint.Zero, controlPoint1, controlPoint2, JSPoint(1, 1));
            return function UIAnimation_Timing_cubicBezier(t){
                var y = curve.yForX(t);
                if (y.length > 0){
                    return y[0];
                }
                return 0;
            };
        }
    }
});

Object.defineProperties(UIAnimation.Timing, {

    easeIn: {
        value: UIAnimation.Timing.cubicBezier(JSPoint(0.4, 0), JSPoint(1, 1))
    },

    easeOut: {
        value: UIAnimation.Timing.cubicBezier(JSPoint(0, 0), JSPoint(0.6, 1))
    },

    easeInOut: {
        value: UIAnimation.Timing.cubicBezier(JSPoint(0.4, 0), JSPoint(0.6, 1))
    },

    bounce: {
        value: UIAnimation.Timing.cubicBezier(JSPoint(0.4, 0.5), JSPoint(0.6, 1.45))
    }

});

UIAnimation.interpolationForValues = function(from, to){
    if (from === undefined || to === undefined || from === null || to === null){
        return UIAnimation.interpolateNull;
    }
    if (typeof(from) === 'number'){
        return UIAnimation.interpolateNumber;
    }
    if (from instanceof JSPoint){
        return UIAnimation.interpolatePoint;
    }
    if (from instanceof JSSize){
        return UIAnimation.interpolateSize;
    }
    if (from instanceof JSRect){
        return UIAnimation.interpolateRect;
    }
    if (from instanceof JSAffineTransform){
        return UIAnimation.interpolateAffineTransform;
    }
    if (from.isKindOfClass && from.isKindOfClass(JSColor)){
        return UIAnimation.interpolateColor;
    }
    if (from.animationInterpolation){
        return from.animationInterpolation;
    }
    return UIAnimation.interpolateNull;
};

UIAnimation.interpolateNull = function(from, to, progress){
    return from;
};

UIAnimation.interpolateNumber = function(from, to, progress){
     return from + (to - from) * progress;
};

UIAnimation.interpolatePoint = function(from, to, progress){
    return JSPoint(
        from.x + (to.x - from.x) * progress,
        from.y + (to.y - from.y) * progress
    );
};

UIAnimation.interpolateSize = function(from, to, progress){
    return JSSize(
        from.width + (to.width - from.width) * progress,
        from.height + (to.height - from.height) * progress
    );
};

UIAnimation.interpolateRect = function(from, to, progress){
    return JSRect(
        from.origin.x + (to.origin.x - from.origin.x) * progress,
        from.origin.y + (to.origin.y - from.origin.y) * progress,
        from.size.width + (to.size.width - from.size.width) * progress,
        from.size.height + (to.size.height - from.size.height) * progress
    );
};

UIAnimation.interpolateAffineTransform = function(from, to, progress){
    return JSAffineTransform(
        from.a + (to.a - from.a) * progress,
        from.b + (to.b - from.b) * progress,
        from.c + (to.c - from.c) * progress,
        from.d + (to.d - from.d) * progress,
        from.tx + (to.tx - from.tx) * progress,
        from.ty + (to.ty - from.ty) * progress
    );
};

UIAnimation.interpolateColor = function(from, to, progress){
    var mixed = from.space.mixedComponents(from.components, to.components, progress);
    mixed.push(from.components[from.space.numberOfComponents] + (to.components[to.space.numberOfComponents] - from.components[from.space.numberOfComponents]) * progress);
    return JSColor.initWithSpaceAndComponents(from.space, mixed);
};

UIAnimation.interpolate1Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.space, [
        from.components[0] + (to.components[0] - from.components[0]) * progress
    ]);
};

UIAnimation.interpolate2Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.space, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress
    ]);
};

UIAnimation.interpolate3Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.space, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress,
        from.components[2] + (to.components[2] - from.components[2]) * progress
    ]);
};

UIAnimation.interpolate4Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.space, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress,
        from.components[2] + (to.components[2] - from.components[2]) * progress,
        from.components[3] + (to.components[3] - from.components[3]) * progress
    ]);
};

UIAnimation.Duration = {
    transition: 0.2
};