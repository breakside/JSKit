// #import "Foundation/JSBinarySearcher.js"
/* global JSGlobalObject, JSIndexPath, JSIndexPathRange, JSIndexPathSet */
'use strict';

JSGlobalObject.JSIndexPath = function(section, row){
    if (this === undefined){
        return new JSIndexPath(section, row);
    }
    if (section instanceof JSIndexPath){
        this.section = section.section;
        this.row = section.row;
    }else{
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
        this.start = JSIndexPath(start);
        this.end = JSIndexPath(end);
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
    },

    removeIndexPath: function(indexPath){
        var range = this._rangeForIndexPath(indexPath);
        if (range !== null){
        }
    },

    addRange: function(range){
        // TODO: merge and sort
        this.ranges.push(range);
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