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

JSGlobalObject.JSRange = function JSRange(location, length){
    if (this === undefined){
        if (location === null){
            return null;
        }
        return new JSRange(location, length);
    }else{
        if (location instanceof JSRange){
            this.location = location.location;
            this.length = location.length;
        }else{
            this.location = location;
            this.length = length;
        }
    }
};

JSRange.prototype = {
    location: 0,
    length: 0,

    contains: function(i){
        return i >= this.location && i < this.end;
    },

    containsRange: function(range){
        return this.contains(range.location) && range.end <= this.end;
    },

    isEqual: function(other){
        return this.location === other.location && this.length === other.length;
    },

    advance: function(x){
        if (x > this.length){
            x = this.length;
        }
        this.location += x;
        this.length -= x;
    },

    intersection: function(other){
        if (other.end <= this.location){
            return JSRange(this.location, 0);
        }
        if (other.location >= this.end){
            return JSRange(this.end, 0);
        }
        var location = this.location;
        if (other.location > location){
            location = other.location;
        }
        var end = this.end;
        if (other.end < end){
            end = other.end;
        }
        return new JSRange(location, end - location);
    },

    toString: function(){
        return "%s,%s".sprintf(this.location, this.length);
    }
};

Object.defineProperty(JSRange.prototype, 'end', {
    configurable: false,
    get: function(){
        return this.location + this.length;
    }
});

Object.defineProperty(JSRange, 'Zero', {
    get: function(){
        return new JSRange(0, 0);
    }
});