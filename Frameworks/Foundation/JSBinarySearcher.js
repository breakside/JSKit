/* global JSGlobalObject, JSBinarySearcher */
'use strict';

JSGlobalObject.JSBinarySearcher = function(sortedItems, comparator){
    if (this === undefined){
        if (sortedItems === null){
            return null;
        }
        return new JSBinarySearcher(sortedItems, comparator);
    }
    if (sortedItems instanceof JSBinarySearcher){
        this.sortedItems = sortedItems.sortedItems;
        this.comparator = sortedItems.comparator;
    }else{
        this.sortedItems = sortedItems;
        this.comparator = comparator;
    }
};

JSBinarySearcher.prototype = {

    sortedItems: null,
    comparator: null,

    _search: function(value){
        var min = 0;
        var max = this.sortedItems.length;
        var mid;
        var item;
        var result;
        var exact = false;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            item = this.sortedItems[mid];
            result = this.comparator(value, item);
            if (result < 0){
                max = mid;
            }else if (result > 0){
                min = mid + 1;
            }else{
                min = max = mid;
                exact = true;
            }
        }
        return {index: min, exact: exact};
    },

    insertionIndexForValue: function(value){
        var result = this._search(value);
        return result.index;
    },

    itemMatchingValue: function(value){
        var result = this._search(value);
        if (result.exact){
            return this.sortedItems[result.index];
        }
        return null;
    },

    indexMatchingValue: function(value){
        var result = this._search(value);
        if (result.exact){
            return result.index;
        }
        return null;
    }

};