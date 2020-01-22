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