/* global JSGlobalObject, JSInsets */
'use strict';

JSGlobalObject.JSInsets = function(top, left, bottom, right){
    if (this === undefined){
        if (top === null){
            return null;
        }
        return new JSInsets(top, left, bottom, right);
    }
    if (top instanceof JSInsets){
        this.top = top.top;
        this.left = top.left;
        this.bottom = top.bottom;
        this.right = top.right;
    }else{
        this.top = top;
        this.left = left === undefined ? this.top : left;
        this.bottom = bottom === undefined ? this.top : bottom;
        this.right = right === undefined ? this.left : right;
    }
};

JSInsets.prototype = {

    insetsWithInsets: function(top, left, bottom, right){
        if (top instanceof JSInsets){
            top = top.top;
            left = top.left;
            bottom = top.bottom;
            right = top.right;
        }
        if (left === undefined) left = top;
        if (bottom === undefined) bottom =  top;
        if (right === undefined) right = left;
        return new JSInsets(this.top + top, this.left + left, this.bottom + bottom, this.right + right);
    },

    negative: function(){
        return new JSInsets(-this.top, -this.left, -this.bottom, -this.right);
    },
    
};

Object.defineProperties(JSInsets.prototype, {

    width: {
        get: function JSInsets_getWidth(){
            return this.left + this.right;
        }
    },

    height: {
        get: function JSInsets_getHeight(){
            return this.top + this.bottom;
        }
    }

});

Object.defineProperty(JSInsets, 'Zero', {
    enumerable: false,
    get: function JSInsets_Zero(){
        return new JSInsets(0);
    }
});

JSInsets.initWithSpec = function(spec){
    if (spec.numberValue !== null){
        return JSInsets(spec.numberValue);
    }
    if (spec.stringValue !== null){
        var parts = spec.stringValue.parseNumberArray();

        if (parts.length > 0 && parts.length <= 4){
            return JSInsets.apply(undefined, parts);
        }
        return null;
    }
    var insets = JSInsets.Zero;
    if (spec.containsKey('top')){
        insets.top = spec.valueForKey("top");
    }
    if (spec.containsKey('left')){
        insets.left = spec.valueForKey("left");
    }
    if (spec.containsKey('bottom')){
        insets.bottom = spec.valueForKey("bottom");
    }
    if (spec.containsKey('right')){
        insets.right = spec.valueForKey("right");
    }
    return insets;
};