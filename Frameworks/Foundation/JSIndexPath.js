// #import "JSBinarySearcher.js"
/* global JSGlobalObject, JSCopy, JSIndexPath, JSIndexPathRange, JSIndexPathSet, JSBinarySearcher */
'use strict';

(function(){

JSGlobalObject.JSIndexPath = function(section, row){
    if (this === undefined){
        return new JSIndexPath(section, row);
    }
    if ((section instanceof JSIndexPath) || (section instanceof Array)){
        for (var i = 0, l = section.length; i < l; ++i){
            this[i] = section[i];
        }
        this.length = section.length;
    }else{
        if (section === undefined || row === undefined){
            throw new Error("JSIndexPath constructor requires a JSIndexPath to copy, an array of components, or both section and row values");
        }
        this[0] = section;
        this[1] = row;
        this.length = 2;
    }
};

Object.defineProperties(JSIndexPath.prototype, {

    length: {
        writable: true,
        value: 0
    },

    section: {
        get: function(){
            return this[0];
        },
        set: function(section){
            this[0] = section;
        }
    },

    row: {
        get: function(){
            return this[1];
        },
        set: function(row){
            this[1] = row;
        }
    },  

    isEqual: {
        value: function JSIndexPath_isEqual(other){
            if (this.length != other.length){
                return false;
            }
            var equal = true;
            for (var i = 0, l = this.length; i < l && equal; ++i){
                equal = this[i] == other[i];
            }
            return equal;
        }
    },

    compare: {
        value: function JSIndexPath_compare(other){
            if (this.isLessThan(other)){
                return -1;
            }
            if (this.isEqual(other)){
                return 0;
            }
            return 1;
        }
    },

    isGreaterThan: {
        value: function JSIndexPath_isGreaterThan(other){
            return !this.isLessThanOrEqual(other);
        }
    },

    isGreaterThanOrEqual: {
        value: function JSIndexPath_isGreaterThanOrEqual(other){
            return !this.isLessThan(other);
        }
    },

    isLessThan: {
        value: function JSIndexPath_isLessThan(other){
            var i = 0;
            var l = this.length;
            var ol = other.length;
            while (i < l && i < ol){
                if (this[i] < other[i]){
                    return true;
                }
                if (this[i] > other[i]){
                    return false;
                }
                ++i;
            }
            if (ol > l){
                return true;
            }
            return false;
        }
    },

    isLessThanOrEqual: {

        value: function JSIndexPath_isLessThanOrEqual(other){
            var i = 0;
            var l = this.length;
            var ol = other.length;
            while (i < l && i < ol){
                if (this[i] < other[i]){
                    return true;
                }
                if (this[i] > other[i]){
                    return false;
                }
                ++i;
            }
            if (ol >= l){
                return true;
            }
            return false;
        }
    },

    incremented: {
        value: function JSIndexPath_incremented(numberOfRowsBySection){
            var next = new JSIndexPath(this);
            next[next.length - 1] += 1;
            return next;
        }
    },

    decremented: {
        value: function JSIndexPath_decremented(numberOfRowsBySection){
            var prev = new JSIndexPath(this);
            prev[prev.length - 1] -= 1;
            return prev;
        }
    },

    appendingIndex: {
        value: function JSIndexPath_appending(index){
            var copy = JSIndexPath(this);
            copy.appendIndex(index);
            return copy;
        }
    },

    appendIndex: {
        value: function JSIndexPath_append(index){
            this[this.length++] = index;
        }
    },

    removeLastIndex: {
        value: function JSIndexPath_removeLastIndex(){
            if (this.length > 1){
                --this.length;
                delete this[this.length];
            }
        }
    },

    removingLastIndex: {
        value: function JSIndexPath_removingLastIndex(){
            var copy = JSIndexPath(this);
            copy.removeLastIndex();
            return copy;
        }
    }

});

JSGlobalObject.JSIndexPathRange = function(start, end){
    if (this === undefined){
        return new JSIndexPathRange(start, end);
    }
    if (start instanceof JSIndexPathRange){
        this.start = JSIndexPath(start.start);
        this.end = JSIndexPath(start.end);
    }else{
        if (start === undefined || end === undefined){
            throw new Error("JSIndexPathRange constructor requires a JSIndexPathRange to copy, or both start and end values");
        }
        this.start = JSIndexPath(start);
        this.end = JSIndexPath(end);
        if (this.end.isLessThan(this.start)){
            throw new Error("JSIndexPathRange requires start to be less than or equal to end");
        }
    }
};

JSIndexPathRange.prototype = {
    contains: function(indexPath){
        return this.start.isLessThanOrEqual(indexPath) && this.end.isGreaterThanOrEqual(indexPath);
    },

    isEqual: function(other){
        return this.start.isEqual(other.start) && this.end.isEqual(other.end);
    },
};

Object.defineProperties(JSIndexPathRange.prototype, {

    isSingle: {
        get: function JSIndexPathRange_isSingle(){
            return this.start.isEqual(this.end);
        }
    }

});

JSGlobalObject.JSIndexPathSet = function(obj){
    if (this === undefined){
        return new JSIndexPathSet(obj);
    }
    this.ranges = [];
    if (obj instanceof JSIndexPathSet){
        for (var i = 0, l = obj.ranges.length; i < l; ++i){
            this.ranges.push(JSIndexPathRange(obj.ranges[i]));
        }
    }else if (obj instanceof JSIndexPathRange){
        this.ranges.push(JSIndexPathRange(obj));
    }else if (obj instanceof JSIndexPath){
        this.ranges.push(JSIndexPathRange(obj, obj));
    }
};

JSIndexPathSet.prototype = {

    delegate: null,

    addIndexPath: function(indexPath){
        this.addRange(JSIndexPathRange(indexPath, indexPath));
    },

    removeIndexPath: function(indexPath){
        this.removeRange(JSIndexPathRange(indexPath, indexPath));
    },

    addRange: function(range){
        range = JSIndexPathRange(range);
        var searcher = JSBinarySearcher(this.ranges, function(indexPath, b){
            return indexPath.compare(b.end);
        });
        var startIndex = searcher.insertionIndexForValue(range.start);
        var endIndex = range.start.isEqual(range.end) ? startIndex : searcher.insertionIndexForValue(range.end);
        var other;
        var comparison;
        if (endIndex < this.ranges.length){
            other = this.ranges[endIndex];
            if (this.delegate && this.delegate.indexPathBefore){
                comparison = this.delegate.indexPathBefore(other.start);
            }else{
                comparison = other.start.decremented();
            }
            if (comparison && range.end.isGreaterThanOrEqual(comparison)){
                range.end = other.end;
                endIndex += 1;
            }
        }
        if (startIndex < this.ranges.length){
            other = this.ranges[startIndex];
            if (range.start.isGreaterThan(other.start)){
                range.start = other.start;
            }
        }
        if (startIndex > 0){
            other = this.ranges[startIndex - 1];
            if (this.delegate && this.delegate.indexPathAfter){
                comparison = this.delegate.indexPathAfter(other.end);
            }else{
                comparison = other.end.incremented();
            }
            if (comparison && range.start.isLessThanOrEqual(comparison)){
                range.start = other.start;
                startIndex -= 1;
            }
        }
        this.ranges.splice(startIndex, endIndex - startIndex, range);
    },

    removeRange: function(range){
        var searcher = JSBinarySearcher(this.ranges, function(indexPath, b){
            return indexPath.compare(b.end);
        });
        var startIndex = searcher.insertionIndexForValue(range.start);
        if (startIndex >= this.ranges.length){
            // If our start index is after the end of our ranges, we have nothing to remove
            return;
        }
        var endIndex = range.start.isEqual(range.end) ? startIndex : searcher.insertionIndexForValue(range.end);
        if (endIndex === 0 && !this.ranges[0].contains(range.end)){
            // If the end index path is less that our first selection, we have nothing to remove
            return;
        }
        var splitsStart = this.ranges[startIndex].contains(range.start) && this.ranges[startIndex].start.isLessThan(range.start);
        var splitsEnd = endIndex < this.ranges.length && this.ranges[endIndex].contains(range.end) && this.ranges[endIndex].end.isGreaterThan(range.end);
        var spliceArgs = [0, 0];
        if (startIndex === endIndex){
            if (splitsStart && splitsEnd){
                var newRange = JSIndexPathRange(this.ranges[startIndex]);
                if (this.delegate && this.delegate.indexPathBefore){
                    newRange.end = this.delegate.indexPathBefore(range.start);
                }else{
                    newRange.end = range.start.decremented();
                }
                if (this.delegate && this.delegate.indexPathAfter){
                    this.ranges[startIndex].start = this.delegate.indexPathAfter(range.end);
                }else{
                    this.ranges[startIndex].start = range.end.incremented();
                }
                spliceArgs.push(newRange);
            }else if (splitsStart){
                if (this.delegate && this.delegate.indexPathBefore){
                    this.ranges[startIndex].end = this.delegate.indexPathBefore(range.start);
                }else{
                    this.ranges[startIndex].end = range.start.decremented();
                }
            }else if (splitsEnd){
                if (this.delegate && this.delegate.indexPathAfter){
                    this.ranges[endIndex].start = this.delegate.indexPathAfter(range.end);
                }else{
                    this.ranges[endIndex].start = range.end.incremented();
                }
            }else if (this.ranges[startIndex].start.isEqual(range.start) && this.ranges[startIndex].end.isEqual(range.end)){
                endIndex += 1;
            }
        }else{
            if (splitsStart){
                if (this.delegate && this.delegate.indexPathBefore){
                    this.ranges[startIndex].end = this.delegate.indexPathBefore(range.start);
                }else{
                    this.ranges[startIndex].end = range.start.decremented();
                }
                startIndex += 1;
            }
            if (splitsEnd){
                if (this.delegate && this.delegate.indexPathAfter){
                    this.ranges[endIndex].start = this.delegate.indexPathAfter(range.end);
                }else{
                    this.ranges[endIndex].start = range.end.incremented();
                }
            }else if (endIndex < this.ranges.length && this.ranges[endIndex].end.isEqual(range.end)){
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

    toggleIndexPath: function(indexPath){
        if (this.contains(indexPath)){
            this.removeIndexPath(indexPath);
        }else{
            this.addIndexPath(indexPath);
        }
    },

    adjustAnchoredRange: function(anchorIndexPath, toIndexPath){
        var searcher = JSBinarySearcher(this.ranges, function(x, range){
            if (x.isLessThan(range.start)){
                return -1;
            }
            if (x.isGreaterThan(range.end)){
                return 1;
            }
            return 0;
        });
        var index = searcher.indexMatchingValue(anchorIndexPath);
        if (index !== null){
            this.ranges.splice(index, 1);
            if (toIndexPath.isLessThan(anchorIndexPath)){
                this.addRange(JSIndexPathRange(toIndexPath, anchorIndexPath));
            }else{
                this.addRange(JSIndexPathRange(anchorIndexPath, toIndexPath));
            }
        }
    },

    adjustRangesAfterInsertion: function(insertedIndexPathSet){
        // TODO: loop through our ranges and increment based on offsets created by inserted paths
    },

    adjustRangesAfterRemoval: function(removedIndexPathSet){
        // TODO: loop through our ranges and decrement based on offsets created by deleted paths
        // remove any paths that match the deleted paths
    },

    replace: function(indexPath){
        this.ranges = [JSIndexPathRange(indexPath, indexPath)];
    },

    contains: function(indexPath){
        var range = this._rangeForIndexPath(indexPath);
        return range !== null;
    },

    _rangeForIndexPath: function(indexPath){
        var searcher = JSBinarySearcher(this.ranges, function(x, range){
            if (x.isLessThan(range.start)){
                return -1;
            }
            if (x.isGreaterThan(range.end)){
                return 1;
            }
            return 0;
        });
        return searcher.itemMatchingValue(indexPath);
    }
};

Object.defineProperties(JSIndexPathSet.prototype, {

    start: {
        get: function JSIndexPathSet_getStart(){
            if (this.ranges.length === 0){
                return null;
            }
            return this.ranges[0].start;
        }
    },

    end: {
        get: function JSIndexPathSet_getEnd(){
            if (this.ranges.length === 0){
                return null;
            }
            return this.ranges[this.ranges.length - 1].end;
        }
    },

    singleIndexPath: {
        get: function JSIndexPathSet_getSingleIndexPath(){
            if (this.ranges.length === 1 && this.ranges[0].isSingle){
                return this.ranges[0].start;
            }
            return null;
        }
    }

});

})();