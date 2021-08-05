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
    },

    isEqual: {
        value: function JSInsets_isEqual(other){
            if (other === null || other === undefined){
                return false;
            }
            return this.top === other.top && this.left === other.left && this.bottom === other.bottom && this.right === other.right; 
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