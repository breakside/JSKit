// #import "UIListView.js"
/* global JSClass, UIListView, UIListViewDefaultStyler, UIListViewDelegate, UIOutlineView, JSProtocol, JSIndexPath, UIEvent, UIOutlineViewDefaultStyler, UIControl, JSBundle, JSImage, JSAffineTransform, JSRect, JSPoint, JSSize */
'use strict';

(function(){

JSProtocol("UIOutlineViewDelegate", UIListViewDelegate, {

    outlineViewDidExpandIndexPath: function(outlineView, indexPath){},
    outlineViewDidCollapseIndexPath: function(outlineView, indexPath){},

});

JSProtocol("UIOutlineViewDataSource", JSProtocol, {

    numberOfSectionsInOutlineView: function(outlineView){},
    outlineViewExpandedIndexPaths: function(outlineView){},
    outlineViewIsExandableAtIndexPath: function(outlineView, indexPath){},
    outlineViewNumberOfChildrenAtIndexPath: function(outlineView, indexPath){},

});

JSClass("UIOutlineView", UIListView, {

    // FIXME: needs to be a tree structure that
    // 1. indicates if a path in expanded
    // 2. indicates if any of a path's children are expanded
    // Make row count calculations efficient by only needing to sum the
    // child counts of expanded items (rather than iterating over every item)
    _expandedIndexPaths: null,

    _isIndexPathExpanded: function(indexPath){
        return indexPath.length == 1 || this._expandedIndexPaths.has(indexPath.toString());
    },

    _commonListInit: function(){
        UIOutlineView.$super._commonListInit.call(this);
        this._expandedIndexPaths = new Set();
    },

    _reloadDuringLayout: function(){
        this._expandedIndexPaths = new Set();
        if (this.dataSource && this.dataSource.outlineViewExpandedIndexPaths){
            var indexPaths = this.dataSource.outlineViewExpandedIndexPaths(this);
            for (var i = 0, l = indexPaths.length; i < l; ++i){
                this._expandedIndexPaths.add(indexPaths[i].toString());
            }
        }
        UIOutlineView.$super._reloadDuringLayout.call(this);
    },

    expandRowAnimation: UIListView.RowAnimation.fold,
    collapseRowAnimation: UIListView.RowAnimation.fold,

    expandRowAtIndexPath: function(indexPath, recursive){
        var cell = this.cellAtIndexPath(indexPath);
        this._expandRowAtIndexPath(indexPath, cell, recursive);
    },

    collapseRowAtIndexPath: function(indexPath, recursive){
        var cell = this.cellAtIndexPath(indexPath);
        this._collapseRowAtIndexPath(indexPath, cell, recursive);
    },

    _expandRowAtIndexPath: function(indexPath, visibleCell, recursive){
        var expandable = this.dataSource.outlineViewIsExandableAtIndexPath(this, indexPath);
        if (!expandable){
            return;
        }
        var expanded = this._isIndexPathExpanded(indexPath);
        if (expanded){
            return;
        }
        var iterator;
        this._expandedIndexPaths.add(indexPath.toString());
        this._beginEditIfNeeded(this.expandRowAnimation);
        iterator = this._indexPathIteratorForSection(indexPath.section, indexPath);
        iterator.increment();
        for (; iterator.indexPath !== null && iterator.indexPath.length > indexPath.length; iterator.increment()){
            if (recursive){
                expandable = this.dataSource.outlineViewIsExandableAtIndexPath(this, iterator.indexPath);
                if (expandable){
                    this._expandedIndexPaths.add(indexPath.toString());
                }
            }
            this._edit.insertedIndexPaths.push({indexPath: JSIndexPath(iterator.indexPath), animation:this.expandRowAnimation});
        }
        if (visibleCell){
            this._updateCellState(visibleCell);
        }
    },

    _collapseRowAtIndexPath: function(indexPath, visibleCell, recursive){
        var expanded = this._isIndexPathExpanded(indexPath);
        if (!expanded){
            return;
        }
        var i, l;
        if (recursive){
            var iterator = this._indexPathIteratorForSection(indexPath.section, indexPath);
            iterator.increment();
            var indexPaths = [];
            var expandable;
            for (; iterator.indexPath !== null && iterator.indexPath.length > indexPath.length; iterator.increment()){
                expandable = this.dataSource.outlineViewIsExandableAtIndexPath(this, iterator.indexPath);
                if (expandable && this._isIndexPathExpanded(iterator.indexPath)){
                    indexPaths.push(JSIndexPath(iterator.indexPath));
                }
            }
            for (i = 0, l = indexPaths.length; i < l; ++i){
                this._expandedIndexPaths.delete(indexPaths[i].toString());
            }
        }
        this._expandedIndexPaths.delete(indexPath.toString());
        this._beginEditIfNeeded(this.collapseRowAnimation);
        for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
            if (this._visibleCellViews[i].indexPath.length > indexPath.length && this._visibleCellViews[i].indexPath.startsWith(indexPath)){
                this._edit.cells[i].deleted = true;
                this._edit.cells[i].animation = this.collapseRowAnimation;
            }
        }
        if (visibleCell){
            this._updateCellState(visibleCell);
        }
    },

    _expandCell: function(cell, recursive){
        var indexPath = cell.indexPath;
        this._expandRowAtIndexPath(indexPath, cell, recursive);
        if (this.delegate && this.delegate.outlineViewDidExpandIndexPath){
            this.delegate.outlineViewDidExpandIndexPath(this, indexPath);
        }
    },

    _collapseCell: function(cell, recursive){
        var indexPath = cell.indexPath;
        this._collapseRowAtIndexPath(indexPath, cell, recursive);
        if (this.delegate && this.delegate.outlineViewDidCollapseIndexPath){
            this.delegate.outlineViewDidCollapseIndexPath(this, indexPath);
        }
    },

    // _indexPathIteratorForSection: function(section, start){
    //     return new SectionIndexPathIterator(section, this._cache.outline.children[section], start);
    // },

    _indexPathIteratorForSection: function(section, start){
        return new SectionIndexPathIterator(section, this, start);
    },

    _numberOfSections: function(){
        return this.dataSource.numberOfSectionsInOutlineView(this);
    },

    _numberOfRowsInSection: function(section){
        return this._numberOfDescendantRowsAtIndexPath(JSIndexPath([section]));
    },

    _numberOfDescendantRowsAtIndexPath: function(indexPath){
        var rows = 0;
        var expanded = this._isIndexPathExpanded(indexPath);
        if (expanded){
            var childCount = this.dataSource.outlineViewNumberOfChildrenAtIndexPath(this, indexPath);
            rows += childCount;
            for (var i = 0; i < childCount; ++i){
                rows += this._numberOfDescendantRowsAtIndexPath(indexPath.appending(i));
            }
        }
        return rows;
    },

    keyDown: function(event){
        var singleIndexPath = this._selectedIndexPaths.singleIndexPath;
        var extend;
        if (singleIndexPath){
            if (event.key == UIEvent.Key.right){
                this.expandRowAtIndexPath(singleIndexPath);
            }else if (event.key == UIEvent.Key.left){
                this.collapseRowAtIndexPath(singleIndexPath);
            }else{
                UIOutlineView.$super.keyDown.call(this, event);
            }
        }else{
            UIOutlineView.$super.keyDown.call(this, event);
        }
    },

    keyUp: function(event){
        UIOutlineView.$super.keyUp.call(this, event);
    },

    _updateCellState: function(cell){
        UIOutlineView.$super._updateCellState.call(this, cell);
        cell.expandable = this.dataSource.outlineViewIsExandableAtIndexPath(this, cell.indexPath);
        cell.expanded = cell.expandable && this._isIndexPathExpanded(cell.indexPath);
    },

    _enqueueReusableCell: function(cell){
        cell.outlineView = null;
        UIOutlineView.$super._enqueueReusableCell.call(this, cell);
    },

    _adoptCell: function(cell, indexPath){
        UIOutlineView.$super._adoptCell.call(this, cell, indexPath);
        cell.outlineView = this;
    },

    _sectionRowForIndexPath: function(indexPath){
        indexPath = JSIndexPath(indexPath);
        var row = 0;
        while (indexPath.length > 1){
            row += indexPath.lastIndex;
            while (indexPath.lastIndex > 0){
                indexPath.lastIndex -= 1;
                row += this._numberOfDescendantRowsAtIndexPath(indexPath);
            }
            indexPath.removeLastIndex();
            ++row;
        }
        --row;
        return row;
    },

    // _collapseRowAtIndexPath: function(indexPath, visibleCell, recursive){
    //     var caches = this._cachesForIndexPath(indexPath);
    //     if (!caches){
    //         return;
    //     }
    //     var cache = caches[caches.length - 1];
    //     if (cache.expanded){
    //         var indexPaths = [];
    //         var iterator = this._indexPathIteratorForSection(indexPath.section, indexPath);
    //         iterator.increment();
    //         for (; iterator.indexPath !== null && iterator.indexPath.length > indexPath.length; iterator.increment()){
    //             indexPaths.push(JSIndexPath(iterator.indexPath));
    //         }
    //         if (recursive){
    //             var stack = [cache];
    //             while (stack.length > 0){
    //                 cache = stack.shift();
    //                 cache.expanded = false;
    //                 for (var i = 0, l = cache.children.length; i < l; ++i){
    //                     stack.push(cache.children[i]);
    //                 }
    //             }
    //         }else{
    //             cache.expanded = false;
    //         }
    //         this._enqueueEdit('deleteIndexPaths', indexPaths, this.collapseRowAnimation, {collapse: true});
    //     }
    //     if (visibleCell){
    //         this._updateCellState(visibleCell);
    //     }
    // },

    // _expandRowAtIndexPath: function(indexPath, visibleCell, recursive){
    //     var caches = this._cachesForIndexPath(indexPath);
    //     if (!caches){
    //         return;
    //     }
    //     var cache = caches[caches.length - 1];
    //     if (cache.expandable && !cache.expanded){
    //         if (cache.children.length === 0 || recursive){
    //             cache = this._cacheOutlineAtIndexPath(indexPath, caches.splice(0, caches.length - 1), true, recursive);
    //         }else{
    //             cache.expanded = true;
    //         }
    //         var indexPaths = [];
    //         var iterator = this._indexPathIteratorForSection(indexPath.section, indexPath);
    //         iterator.increment();
    //         for (; iterator.indexPath !== null && iterator.indexPath.length > indexPath.length; iterator.increment()){
    //             indexPaths.push(JSIndexPath(iterator.indexPath));
    //         }
    //         this._enqueueEdit('insertIndexPaths', indexPaths, this.expandRowAnimation, {expand: true});
    //     }
    //     if (visibleCell){
    //         this._updateCellState(visibleCell);
    //     }
    // },

    // _numberOfRowsInCache: function(cache){
    //     if (!cache.expanded){
    //         return cache.numberOfRows;
    //     }
    //     var rows = cache.numberOfRows;
    //     for (var i = 0, l = cache.children.length; i < l; ++i){
    //         rows += this._numberOfRowsInCache(cache.children[i]);
    //     }
    //     return rows;
    // },

    // _sectionRowForIndexPath: function(indexPath){
    //     var row = 0;
    //     var cache = this._cache.outline.children[indexPath.section];
    //     var child;
    //     var n;
    //     for (var i = 1, l = indexPath.length; i < l; ++i){
    //         n = indexPath[i];
    //         row += cache.numberOfRows;
    //         for (var j = 0; j < n; ++j){
    //             child = cache.children[j];
    //             row += this._numberOfRowsInCache(child);
    //         }
    //         cache = cache.children[n];
    //     }
    //     return row;
    // },

    // _resetCachedData: function(){
    //     this._cache.outline = {expandable: true, expanded: true, numberOfRows: 0, children: []};
    // },

    // _deleteCacheForIndexPath: function(indexPath, context){
    //     UIOutlineView.$super._deleteCacheForIndexPath.call(this, indexPath, context);
    //     if (context && context.collapse){
    //         return;
    //     }
    //     var caches = this._cachesForIndexPath(indexPath);
    //     var parentCache = caches[caches.length - 2];
    //     parentCache.children.splice(indexPath.lastIndex, 1);
    // },

    // _deleteCacheForSection: function(section){
    //     UIOutlineView.$super._deleteCacheForSection.call(this, section);
    //     this._cache.outline.children.splice(section, 1);
    // },

    // _insertCacheForSection: function(section){
    //     this._cache.outline.children.splice(section, 0, undefined);
    //     // super will call _numberOfRowsInSection, which will populate the cache
    //     UIOutlineView.$super._insertCacheForSection(this, section);
    // },

    // _insertCacheForIndexPath: function(indexPath, context){
    //     if (!context || !context.expand){
    //         var parent = indexPath.removingLastIndex();
    //         var caches = this._cachesForIndexPath(parent);
    //         var parentCache = caches[caches.length - 1];
    //         parentCache.children.splice(indexPath.lastIndex, 0, undefined);
    //         this._cacheOutlineAtIndexPath(indexPath, caches);
    //     }
    //     UIOutlineView.$super._insertCacheForIndexPath.call(this, indexPath, context);
    // },
    // _numberOfRowsInSection: function(section){
    //     var indexPath = JSIndexPath([section]);
    //     var cache = this._cacheOutlineAtIndexPath(indexPath, [this._cache.outline]);
    //     var rows = this._numberOfRowsInCache(cache);
    //     return rows;
    // },

    // _cacheOutlineAtIndexPath: function(indexPath, ancestors, forceExpanded, recursive){
    //     forceExpanded = forceExpanded === true;
    //     var parentCache = ancestors[ancestors.length - 1];
    //     var existingCache = parentCache.children[indexPath.lastIndex];
    //     var cache = {
    //         expandable: indexPath.length === 1 || (existingCache && existingCache.expandable) || (this.dataSource.outlineViewIsExandableAtIndexPath(this, indexPath) === true),
    //         expanded: false,
    //         children: existingCache ? existingCache.children : [],
    //         numberOfRows: indexPath.length > 1 ? 1 : 0
    //     };
    //     var i, l;
    //     var childCache;
    //     var childAncestors = ancestors.concat([cache]);
    //     var previousNumberOfDescendants;
    //     if (cache.expandable){
    //         cache.expanded = forceExpanded || indexPath.length === 1 || (this.dataSource.outlineViewIsExpandedAtIndexPath && this.dataSource.outlineViewIsExpandedAtIndexPath(this, indexPath));
    //         if (cache.expanded){
    //             l = this.dataSource.outlineViewNumberOfChildrenAtIndexPath(this, indexPath);
    //             for (i = 0; i < l; ++i){
    //                 childCache = this._cacheOutlineAtIndexPath(indexPath.appending(i), childAncestors, forceExpanded && recursive, recursive);
    //             }
    //         }
    //     }
    //     parentCache.children[indexPath.lastIndex] = cache;
    //     return cache;
    // },

    // _cachesForIndexPath: function(indexPath){
    //     if (this._cache === null){
    //         return null;
    //     }
    //     var cache = this._cache.outline;
    //     var caches = [cache];
    //     for (var i = 0, l = indexPath.length; i < l && cache !== undefined; ++i){
    //         cache = cache.children[indexPath[i]];
    //         caches.push(cache);
    //     }
    //     if (cache === undefined){
    //         return null;
    //     }
    //     return caches;
    // },

    // _updateCellState: function(cell){
    //     UIOutlineView.$super._updateCellState.call(this, cell);
    //     var caches = this._cachesForIndexPath(cell.indexPath);
    //     var cache = caches[caches.length - 1];
    //     cell.expandable = cache && cache.expandable;
    //     cell.expanded = cache && cache.expanded;
    // },

});

var SectionIndexPathIterator = function(section, outlineView, start){
    if (this === undefined){
        return new SectionIndexPathIterator(section, outlineView, start);
    }
    this.section = section;
    this.outlineView = outlineView;
    this.childCounts = [outlineView.dataSource.outlineViewNumberOfChildrenAtIndexPath(outlineView, JSIndexPath([section]))];
    if (this.childCounts[0] === 0){
        this.indexPath = null;
    }else{
        if (start === -1){
            this.indexPath = JSIndexPath(section, this.childCounts[0] - 1);
            while (outlineView._isIndexPathExpanded(this.indexPath)){
                var childCount = outlineView.dataSource.outlineViewNumberOfChildrenAtIndexPath(outlineView, this.indexPath);
                if (childCount > 0){
                    this.indexPath.append(childCount - 1);
                    this.childCounts.push(childCount);
                }else{
                    break;
                }
            }
        }else if (start instanceof JSIndexPath){
            if (start.row < this.childCounts[0]){
                this.indexPath = JSIndexPath(start.section, start.row);
                for (var i = 2, l = start.length; i < l; ++i){
                    this.childCounts.push(outlineView.dataSource.outlineViewNumberOfChildrenAtIndexPath(outlineView, this.indexPath));
                    this.indexPath.append(start[i]);
                }
            }else{
                this.indexPath = null;
            }
        }else{
            this.indexPath = JSIndexPath(section, 0);
        }
    }
};

SectionIndexPathIterator.prototype = {

    increment: function(){
        if (this.indexPath === null){
            return;
        }
        var expanded = this.outlineView._isIndexPathExpanded(this.indexPath);
        if (expanded){
            var childCount = this.outlineView.dataSource.outlineViewNumberOfChildrenAtIndexPath(this.outlineView, this.indexPath);
            if (childCount > 0){
                this.childCounts.push(childCount);
                this.indexPath = this.indexPath.appending(0);
                return;
            }
        }
        while (this.indexPath.length > 1 && this.indexPath.lastIndex == this.childCounts[this.childCounts.length - 1] - 1){
            this.indexPath.removeLastIndex();
            this.childCounts.pop();
        }
        if (this.indexPath.length > 1){
            this.indexPath.lastIndex += 1;
        }else{
            this.indexPath = null;
        }
    },

    decrement: function(){
        if (this.indexPath === null){
            return;
        }
        if (this.indexPath.lastIndex > 0){
            this.indexPath.lastIndex -= 1;
            while (this.outlineView._isIndexPathExpanded(this.indexPath)){
                var childCount = this.outlineView.dataSource.outlineViewNumberOfChildrenAtIndexPath(this.outlineView, this.indexPath);
                if (childCount > 0){
                    this.childCounts.push(childCount);
                    this.indexPath.append(childCount - 1);
                }else{
                    break;
                }
            }
        }else{
            this.indexPath.removeLastIndex();
            this.childCounts.pop();
            if (this.indexPath.length == 1){
                this.indexPath = null;
            }
        }
    }
};

// var SectionIndexPathIterator = function(section, cache, start){
//     if (this === undefined){
//         return new SectionIndexPathIterator(section, cache, start);
//     }
//     this.section = section;
//     this.cache = cache;
//     if (cache.children.length === 0){
//         this.indexPath = null;
//     }else{
//         this.lastIndexPath = JSIndexPath([section]);
//         do{
//             this.lastIndexPath.append(cache.children.length - 1);
//             cache = cache.children[this.lastIndexPath.lastIndex];
//         } while (cache.expanded && cache.children.length > 0);
//         if (start === -1){
//             this.indexPath = JSIndexPath(this.lastIndexPath);
//         }else if (start instanceof JSIndexPath){
//             if (start.isLessThanOrEqual(this.lastIndexPath)){
//                 this.indexPath = JSIndexPath(start);
//             }else{
//                 this.indexPath = null;
//             }
//         }else{
//             this.indexPath = JSIndexPath(section, 0);
//         }
//     }
// };

// SectionIndexPathIterator.prototype = {

//     lastIndexPath: null,

//     increment: function(){
//         if (this.indexPath !== null){
//             if (this.indexPath.isEqual(this.lastIndexPath)){
//                 this.indexPath = null;
//             }else{
//                 var cacheStack = [];
//                 var cache = this.cache;
//                 for (var i = 1, l = this.indexPath.length; i < l; ++i){
//                     cacheStack.push(cache);
//                     cache = cache.children[this.indexPath[i]];
//                 }
//                 if (cache.expanded && cache.children.length > 0){
//                     this.indexPath.append(0);
//                 }else{
//                     cache = cacheStack.pop();
//                     this.indexPath.lastIndex += 1;
//                     while (this.indexPath.lastIndex == cache.children.length){
//                         this.indexPath.removeLastIndex();
//                         this.indexPath.lastIndex += 1;
//                         cache = cacheStack.pop();
//                     }
//                 }
//             }
//         }
//     },

//     decrement: function(){
//         if (this.indexPath !== null){
//             if (this.indexPath.length == 2 && this.indexPath.row === 0){
//                 this.indexPath = null;
//             }else{
//                 if (this.indexPath.lastIndex > 0){
//                     this.indexPath.lastIndex -= 1;
//                     var cache = this.cache;
//                     for (var i = 1, l = this.indexPath.length; i < l; ++i){
//                         cache = cache.children[this.indexPath[i]];
//                     }
//                     while (cache.expanded && cache.children.length > 0){
//                         this.indexPath.append(cache.children.length - 1);
//                         cache = cache.children[this.indexPath.lastIndex];
//                     }
//                 }else{
//                     this.indexPath.removeLastIndex();
//                 }
//             }
//         }
//     }
// };

UIOutlineView.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIListView_getDefaultStyler(){
            var styler = UIOutlineViewDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIListView_setDefaultStyler(defaultStyler){
            Object.defineProperty(this, 'default', {writable: true, value: defaultStyler});
        }
    }
});

JSClass("UIOutlineViewDefaultStyler", UIListViewDefaultStyler, {

    disclosureButtonImage: null,
    disclosureColor: null,
    selectedDisclosureColor: null,

    initWithSpec: function(spec, values){
        if ('disclosureButtonImage' in values){
            this.disclosureButtonImage = spec.resolvedValue(values.disclosureButtonImage, "JSImage");
        }
        if ('disclosureColor' in values){
            this.disclosureColor = spec.resolvedValue(values.disclosureColor, "JSColor");
        }
        if ('selectedDisclosureColor' in values){
            this.selectedDisclosureColor = spec.resolvedValue(values.selectedDisclosureColor, "JSColor");
        }
        UIOutlineViewDefaultStyler.$super.initWithSpec.call(this, spec, values);
    },

    _commonStylerInit: function(){
        UIOutlineViewDefaultStyler.$super._commonStylerInit.call(this);
        if (this.disclosureButtonImage === null){
            this.disclosureButtonImage = images.disclosure;
        }
        if (this.disclosureColor === null){
            this.disclosureColor = this.cellDetailTextColor;
        }
        if (this.selectedDisclosureColor === null){
            this.selectedDisclosureColor = this.selectedCellTextColor;
        }
    },

    initializeCell: function(cell, indexPath){
        UIOutlineViewDefaultStyler.$super.initializeCell.call(this, cell, indexPath);
        cell.disclosureButton.setImageForState(this.disclosureButtonImage, UIControl.State.normal);
        cell.stylerProperties.expanded = false;
    },

    updateCell: function(cell, indexPath){
        UIOutlineViewDefaultStyler.$super.updateCell.call(this, cell, indexPath);
        if (cell.expanded){
            if (!cell.stylerProperties.expanded){            
                cell.disclosureButton.transform = expandedTransform;
                cell.stylerProperties.expanded = true;
            }
        }else{
            if (cell.stylerProperties.expanded){
                cell.disclosureButton.transform = identityTransform;
                cell.stylerProperties.expanded = false;
            }
        }
        if (cell.selected){
            cell.disclosureButton.styler.color = this.selectedDisclosureColor;
        }else{
            cell.disclosureButton.styler.color = this.disclosureColor;
        }
        cell.disclosureButton.hidden = !cell.expandable;
        cell.disclosureButton.styler.updateControl(cell.disclosureButton);
    },

    _indentationForCell: function(cell){
        return cell.level * 20 + this.disclosureButtonImage.size.width + cell._titleInsets.left;
    },

    layoutCell: function(cell){
        UIOutlineViewDefaultStyler.$super.layoutCell.call(this, cell);
        cell.disclosureButton.bounds = JSRect(0, 0, this.disclosureButtonImage.size.width, this.disclosureButtonImage.size.height);
        cell.disclosureButton.position = JSPoint(cell._titleInsets.left + cell.level * 20 + cell.disclosureButton.bounds.size.width / 2.0, cell._contentView.bounds.size.height / 2.0);
    }

});

var identityTransform = JSAffineTransform.Identity;
var expandedTransform = JSAffineTransform.RotatedDegrees(90);

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    disclosure: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'disclosure', {value: JSImage.initWithResourceName("UIOutlineViewDisclosure", this.bundle) });
            return this.disclosure;
        }
    }

});

})();