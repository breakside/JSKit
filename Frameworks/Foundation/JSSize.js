'use strict';
/* global JSGlobalObject, JSSize */

JSGlobalObject.JSSize = function JSSize(width, height){
    if (this === undefined){
        if (width === null){
            return null;
        }
        return new JSSize(width, height);
    }else{
        if (width instanceof JSSize){
            this.width = width.width;
            this.height = width.height;
        }else{
            if (isNaN(width) || isNaN(height)){
                throw new Error("Creating size with NaN");
            }
            this.width = width;
            this.height = height;
        }
    }
};

JSSize.prototype = {
    width: 0,
    height: 0,

    isEqual: function(other){
        return this.width == other.width && this.height == other.height;
    },

    toString: function(){
        return "%sx%s".sprintf(this.width, this.height);
    }
};

JSSize.initWithSpec = function(spec){
    if (spec.numberValue !== null){
        return JSSize(spec.numberValue, spec.numberValue);
    }
    if (spec.stringValue !== null){
        var parts = spec.stringValue.parseNumberArray();
        if (parts.length === 2){
            return JSSize(parts[0], parts[1]);
        }
        return null;
    }
    if (spec.containsKey('width') && spec.containsKey('height')){
        return JSSize(spec.valueForKey("width"), spec.valueForKey("height"));
    }
    return null;
};

Object.defineProperty(JSSize, 'Zero', {
    get: function(){
        return new JSSize(0, 0);
    }
});