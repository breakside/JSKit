// #import "JSBinarySearcher.js"
// #import "Javascript.js"
'use strict';

JSGlobalObject.JSIndexRange = function(start, end){
    if (this === undefined){
        return new JSIndexRange(start, end);
    }
    if (start instanceof JSIndexRange){
        this.start = start.start;
        this.end = start.end;
    }else{
        if (start === undefined || end === undefined){
            throw new Error("JSIndexRange must have a start and end");
        }
        if (end < start){
            throw new Error("JSIndexRange start must be <= end ");
        }
        this.start = start;
        this.end = end;
    }
};

JSIndexRange.prototype = {
    start: 0,
    end: 0,

    contains: function(index){
        return index >= this.start && index <= this.end;
    },

    containsRange: function(other){
        return this.contains(other.start) && this.contains(other.end);
    },

    isEqual: function(other){
        return this.start === other.start && this.end === other.end;
    },

    compare: function(other){
        var result = this.start - other.start;
        if (result === 0){
            result = this.end - other.end;
        }
        return result;
    }
};

JSGlobalObject.JSIndexSet = function(obj){
    if (this === undefined){
        return new JSIndexSet(obj);
    }
    if (obj instanceof JSIndexSet){
        this.ranges = JSDeepCopy(obj.ranges);
    }else if (obj instanceof JSIndexRange){
        this.ranges = [JSCopy(obj)];
    }else if (obj !== undefined && obj !== null){
        this.ranges = [JSIndexRange(obj, obj)];
    }else{
        this.ranges = [];
    }
};

JSIndexSet.prototype = {
    ranges: null,

    addIndex: function(index){
        this.addRange(JSIndexRange(index, index));
    },

    removeIndex: function(index){
        this.removeRange(JSIndexRange(index, index));
    },

    addRange: function(range){
        range = JSIndexRange(range);
        var searcher = JSBinarySearcher(this.ranges, function(i, range){
            return i - range.end;
        });
        var startIndex = searcher.insertionIndexForValue(range.start);
        var endIndex = range.start == range.end ? startIndex : searcher.insertionIndexForValue(range.end);
        var other;
        if (endIndex < this.ranges.length){
            other = this.ranges[endIndex];
            if (range.end >= other.start - 1){
                range.end = other.end;
                endIndex += 1;
            }
        }
        if (startIndex < this.ranges.length){
            other = this.ranges[startIndex];
            if (range.start > other.start){
                range.start = other.start;
            }
        }
        if (startIndex > 0){
            other = this.ranges[startIndex - 1];
            if (range.start <= other.end + 1){
                range.start = other.start;
                startIndex -= 1;
            }
        }
        this.ranges.splice(startIndex, endIndex - startIndex, range);
    },

    removeRange: function(range){
        var searcher = JSBinarySearcher(this.ranges, function(i, range){
            return i - range.end;
        });
        var startIndex = searcher.insertionIndexForValue(range.start);
        if (startIndex >= this.ranges.length){
            return;
        }
        var endIndex = range.start == range.end ? startIndex : searcher.insertionIndexForValue(range.end);
        if (endIndex === 0 && !this.ranges[0].contains(range.end)){
            return;
        }
        var splitsStart = this.ranges[startIndex].contains(range.start) && this.ranges[startIndex].start < range.start;
        var splitsEnd = endIndex < this.ranges.length && this.ranges[endIndex].contains(range.end) && this.ranges[endIndex].end > range.end;
        var spliceArgs = [0, 0];
        if (startIndex == endIndex){
            if (splitsStart && splitsEnd){
                var newRange = JSIndexRange(this.ranges[startIndex]);
                newRange.end = range.start - 1;
                this.ranges[startIndex].start = range.end + 1;
                spliceArgs.push(newRange);
            }else if (splitsStart){
                this.ranges[startIndex].end = range.start - 1;
            }else if (splitsEnd){
                this.ranges[endIndex].start = range.end + 1;
            }else if (this.ranges[startIndex].start == range.start && this.ranges[startIndex].end == range.end){
                endIndex += 1;
            }
        }else{
            if (splitsStart){
                this.ranges[startIndex].end = range.start - 1;
                startIndex += 1;
            }
            if (splitsEnd){
                this.ranges[endIndex].start = range.end + 1;
            }else if (endIndex < this.ranges.length && this.ranges[endIndex].end == range.end){
                endIndex += 1;
            }
        }
        spliceArgs[0] = startIndex;
        if (endIndex > startIndex){
            spliceArgs[1] = endIndex - startIndex;
        }
        if (spliceArgs[1] > 0 || spliceArgs.length > 2){
            this.ranges.splice.apply(this.ranges, spliceArgs);
        }
    },

    adjustAnchoredRange: function(anchorIndex, toIndex){
        var searcher = JSBinarySearcher(this.ranges, function(i, range){
            if (i < range.start){
                return -1;
            }
            if (1 > range.end){
                return 1;
            }
            return 0;
        });
        var index = searcher.indexMatchingValue(anchorIndex);
        if (index !== null){
            this.ranges.splice(index, 1);
            if (toIndex < anchorIndex){
                this.addRange(JSIndexRange(toIndex, anchorIndex));
            }else{
                this.addRange(JSIndexRange(anchorIndex, toIndex));
            }
        }
    },

    replace: function(index){
        this.ranges = [JSIndexRange(index, index)];
    },

    clear: function(){
        this.ranges = [];
    },

    contains: function(index){
        var range = this._rangeForIndex(index);
        return range !== null;
    },

    containsRange: function(range){
        var foundRange = this._rangeForIndex(range.start);
        return foundRange !== null && foundRange.contains(range.end);
    },

    enumerate: function(callback, target){
        var range;
        for (var i = 0, l = this.ranges.length; i < l; ++i){
            range = this.ranges[i];
            for (var index = range.start; index <= range.end; ++index){
                callback.call(target, index);
            }
        }
    },

    reverseEnumerate: function(callback, target){
        var range;
        for (var i = this.ranges.length - 1; i >= 0; --i){
            range = this.ranges[i];
            for (var index = range.end; index >= range.start; --index){
                callback.call(target, index);
            }
        }
    },

    _rangeForIndex: function(index){
        var searcher = JSBinarySearcher(this.ranges, function(index_, range){
            if (index_ < range.start){
                return -1;
            }
            if (index > range.end){
                return 1;
            }
        });
        var range = searcher.itemMatchingValue(index);
        return range;
    },

    isEqual: function(other){
        if (this.ranges.length !== other.ranges.length){
            return false;
        }
        for (var i = 0, l = this.ranges.length; i < l; ++i){
            if (!this.ranges[i].isEqual(other.ranges[i])){
                return false;
            }
        }
        return true;
    }
};

Object.defineProperties(JSIndexSet.prototype, {
    isEmpty: {
        get: function JSIndexSet_getIsEmpty(){
            return this.ranges.length === 0;
        }
    },

    isMultiple: {
        get: function JSIndexSet_getIsMultiple(){
            if (this.ranges.length === 1){
                return this.ranges[0].start < this.ranges[0].end;
            }
            return this.range.length > 0;
        }
    },

    isSingle: {
        get: function JSIndexSet_getIsSingle(){
            return this.ranges.length == 1 && this.ranges[0].start == this.ranges[0].end;
        }

    },

    singleIndex: {
        get: function JSIndexSet_getSingleIndex(){
            if (this.isSingle){
                return this.ranges[0].start;
            }
        }
    }
});