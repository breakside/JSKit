// #import "Foundation/JSBinarySearcher.js"
/* global JSGlobalObject, JSIndexPath, JSIndexPathRange, JSIndexPathSet, JSBinarySearcher */
'use strict';

(function(){

JSGlobalObject.JSIndexPath = function(section, row){
    if (this === undefined){
        return new JSIndexPath(section, row);
    }
    if (section instanceof JSIndexPath){
        this.section = section.section;
        this.row = section.row;
    }else{
        if (section === undefined || row === undefined){
            throw new Error("JSIndexPath constructor requires a JSIndexPath to copy, or both section and row values");
        }
        this.section = section;
        this.row = row;
    }
};

JSIndexPath.prototype = {

    isEqual: function(other){
        return this.section === other.section && this.row === other.row;
    },

    isLessThan: function(other){
        return this.section < other.section || (this.section === other.section && this.row < other.row);
    },

    isLessThanOrEqual: function(other){
        return this.section < other.section || (this.section === other.section && this.row <= other.row);
    },

    isGreaterThan: function(other){
        return !this.isLessThanOrEqual(other);
    },

    isGreaterThanOrEqual: function(other){
        return !this.isLessThan(other);
    },

    compare: function(other){
        if (this.isLessThan(other)){
            return -1;
        }
        if (this.isEqual(other)){
            return 0;
        }
        return 1;
    },

    incremented: function(numberOfRowsBySection){
        var next = new JSIndexPath(this);
        next.row += 1;
        while (next !== null && next.row >= numberOfRowsBySection[next.section]){
            next.section += 1;
            next.row = 0;
            if (next.section >= numberOfRowsBySection.length){
                next = null;
            }
        }
        return next;
    },

    decremented: function(numberOfRowsBySection){
        var prev = new JSIndexPath(this);
        prev.row -= 1;
        while (prev !== null && prev.row < 0){
            prev.section -= 1;
            if (prev.section < 0){
                prev = null;
            }else{
                prev.row = numberOfRowsBySection[prev.section] - 1;
            }
        }
        return prev;
    }

};

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
    }
};

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

    addIndexPath: function(indexPath){
        this.addRange(JSIndexPathRange(indexPath, indexPath));
    },

    removeIndexPath: function(indexPath, numberOfRowsBySection){
        this.removeRange(JSIndexPathRange(indexPath, indexPath), numberOfRowsBySection);
    },

    addRange: function(range){
        range = JSIndexPathRange(range);
        var searcher = JSBinarySearcher(this.ranges, function(indexPath, b){
            return indexPath.compare(b.end);
        });
        var startIndex = searcher.insertionIndexForValue(range.start);
        var endIndex = range.start.isEqual(range.end) ? startIndex : searcher.insertionIndexForValue(range.end);
        var other;
        if (endIndex < this.ranges.length){
            other = this.ranges[endIndex];
            if (range.end.isGreaterThanOrEqual(other.start) || (range.end.section == other.start.section && range.end.row == other.start.row - 1)){
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
            if (range.start.isLessThanOrEqual(other.end) || (range.start.section == other.end.section && range.start.row == other.end.row + 1)){
                range.start = other.start;
                startIndex -= 1;
            }
        }
        this.ranges.splice(startIndex, endIndex - startIndex, range);
    },

    removeRange: function(range, numberOfRowsBySection){
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
                newRange.end = range.start.decremented(numberOfRowsBySection);
                this.ranges[startIndex].start = range.end.incremented(numberOfRowsBySection);
                spliceArgs.push(newRange);
            }else if (splitsStart){
                this.ranges[startIndex].end = range.start.decremented(numberOfRowsBySection);
            }else if (splitsEnd){
                this.ranges[endIndex].start = range.end.incremented(numberOfRowsBySection);
            }else if (this.ranges[startIndex].start.isEqual(range.start) && this.ranges[startIndex].end.isEqual(range.end)){
                endIndex += 1;
            }
        }else{
            if (splitsStart){
                this.ranges[startIndex].end = range.start.decremented(numberOfRowsBySection);
                startIndex += 1;
            }
            if (splitsEnd){
                this.ranges[endIndex].start = range.end.incremented(numberOfRowsBySection);
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
    }

});

})();