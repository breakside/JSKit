// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIAnimation, JSPoint, JSSize, JSRect, JSAffineTransform, JSColor */
'use strict';

JSClass('UIAnimation', JSObject, {
    completionFunction: null,
    isComplete: false,

    updateForTime: function(t){
    }
});

UIAnimation.linearTimingFunction = function(t){
    return t;
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

UIAnimation.interpolate1Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress
    ]);
};

UIAnimation.interpolate2Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress
    ]);
};

UIAnimation.interpolate3Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress,
        from.components[2] + (to.components[2] - from.components[2]) * progress
    ]);
};

UIAnimation.interpolate4Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress,
        from.components[2] + (to.components[2] - from.components[2]) * progress,
        from.components[3] + (to.components[3] - from.components[3]) * progress
    ]);
};