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
    outlineViewIsExandableAtIndexPath: function(outlineView, indexPath){},
    outlineViewIsExpandedAtIndexPath: function(outlineView, indexPath){},
    outlineViewNumberOfChildrenAtIndexPath: function(outlineView, indexPath){},

});

JSClass("UIOutlineView", UIListView, {

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
        var cache = this._cacheForIndexPath(indexPath);
        if (!cache){
            return;
        }
        if (cache.expandable && !cache.expanded){
            var parent = indexPath.removingLastIndex();
            var parentCache = this._cacheForIndexPath(parent);
            if (cache.children.length === 0 || recursive){
                cache = this._cacheOutlineAtIndexPath(indexPath, parentCache, true, recursive);
            }else{
                cache.expanded = true;
            }
            var indexPaths = [];
            var iterator = this._indexPathIteratorForSection(indexPath.section, indexPath);
            iterator.increment();
            for (; iterator.indexPath !== null && iterator.indexPath.length > indexPath.length; iterator.increment()){
                indexPaths.push(JSIndexPath(iterator.indexPath));
            }
            this._enqueueEdit('insertIndexPaths', indexPaths, this.expandRowAnimation, {expand: true});
        }
        if (visibleCell){
            this._updateCellState(visibleCell);
        }
    },

    _collapseRowAtIndexPath: function(indexPath, visibleCell, recursive){
        var cache = this._cacheForIndexPath(indexPath);
        if (!cache){
            return;
        }
        if (cache.expanded){
            var indexPaths = [];
            var iterator = this._indexPathIteratorForSection(indexPath.section, indexPath);
            iterator.increment();
            for (; iterator.indexPath !== null && iterator.indexPath.length > indexPath.length; iterator.increment()){
                indexPaths.push(JSIndexPath(iterator.indexPath));
            }
            if (recursive){
                var stack = [cache];
                while (stack.length > 0){
                    cache = stack.shift();
                    cache.expanded = false;
                    for (var i = 0, l = cache.children.length; i < l; ++i){
                        stack.push(cache.children[i]);
                    }
                }
            }else{
                cache.expanded = false;   
            }
            this._enqueueEdit('deleteIndexPaths', indexPaths, this.collapseRowAnimation, {collapse: true});
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

    _indexPathIteratorForSection: function(section, start){
        return new SectionIndexPathIterator(section, this._cache.outline.children[section], start);
    },

    _sectionRowForIndexPath: function(indexPath){
        var row = 0;
        var cache = this._cache.outline.children[indexPath.section];
        var n;
        for (var i = 1, l = indexPath.length; i < l; ++i){
            n = indexPath[i];
            for (var j = 0; j < n; ++j){
                row += cache.children[j].numberOfRows;
            }
            cache = cache.children[n];
        }
        return row;
    },

    _numberOfSections: function(){
        return this.dataSource.numberOfSectionsInOutlineView(this);
    },

    _resetCachedData: function(){
        this._cache.outline = {expandable: true, expanded: true, numberOfRows: 0, children: []};
    },

    _deleteCacheForIndexPath: function(indexPath, context){
        UIOutlineView.$super._deleteCacheForIndexPath.call(this, indexPath, context);
        if (context && context.collapse){
            return;
        }
        var parent = indexPath.removingLastIndex();
        var cache = this._cacheForIndexPath(parent);
        parent.children.splice(indexPath.lastIndex, 1);
    },

    _deleteCacheForSection: function(section){
        UIOutlineView.$super._deleteCacheForSection.call(this, section);
        this._cache.outline.children.splice(section, 1);
    },

    _insertCacheForSection: function(section){
        this._cache.outline.children.splice(section, 0, undefined);
        // super will call _numberOfRowsInSection, which will populate the cache
        UIOutlineView.$super._insertCacheForSection(this, section);
    },

    _insertCacheForIndexPath: function(indexPath, context){
        if (!context || !context.expand){
            var parent = indexPath.removingLastIndex();
            var cache = this._cacheForIndexPath(parent);
            cache.children.splice(indexPath.lastIndex, 0, undefined);
            this._cacheOutlineAtIndexPath(indexPath, cache);
        }
        UIOutlineView.$super._insertCacheForIndexPath.call(this, indexPath, context);
    },

    _numberOfRowsInSection: function(section){
        var indexPath = JSIndexPath([section]);
        var cache = this._cacheOutlineAtIndexPath(indexPath, this._cache.outline);
        this._cache.outline.numberOfRows += cache.numberOfRows;
        return cache.numberOfRows;
    },

    _cacheOutlineAtIndexPath: function(indexPath, parentCache, forceExpanded, recursive){
        forceExpanded = forceExpanded === true;
        var existingCache = parentCache.children[indexPath.lastIndex];
        var cache = {
            expandable: indexPath.length === 1 || (existingCache && existingCache.expandable) || (this.dataSource.outlineViewIsExandableAtIndexPath(this, indexPath) === true),
            expanded: false,
            children: existingCache ? existingCache.children : [],
            numberOfRows: indexPath.length > 1 ? 1 : 0
        };
        var i, l;
        var childCache;
        if (cache.expandable){
            cache.expanded = forceExpanded || indexPath.length === 1 || (this.dataSource.outlineViewIsExpandedAtIndexPath && this.dataSource.outlineViewIsExpandedAtIndexPath(this, indexPath));
            if (cache.expanded){
                l = this.dataSource.outlineViewNumberOfChildrenAtIndexPath(this, indexPath);
                for (i = 0; i < l; ++i){
                    childCache = this._cacheOutlineAtIndexPath(indexPath.appending(i), cache, forceExpanded && recursive, recursive);
                    cache.numberOfRows += childCache.numberOfRows;
                }
            }
        }
        parentCache.children[indexPath.lastIndex] = cache;
        return cache;
    },

    _cacheForIndexPath: function(indexPath){
        if (this._cache === null){
            return null;
        }
        var cache = this._cache.outline;
        for (var i = 0, l = indexPath.length; i < l && cache !== undefined; ++i){
            cache = cache.children[indexPath[i]];
        }
        if (cache === undefined){
            return null;
        }
        return cache;
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
        var cache = this._cacheForIndexPath(cell.indexPath);
        cell.expandable = cache && cache.expandable;
        cell.expanded = cache && cache.expanded;
    },

    _enqueueReusableCell: function(cell){
        cell.outlineView = null;
        UIOutlineView.$super._enqueueReusableCell.call(this, cell);
    },

    _adoptCell: function(cell, indexPath){
        UIOutlineView.$super._adoptCell.call(this, cell, indexPath);
        cell.outlineView = this;
    }

});

var SectionIndexPathIterator = function(section, cache, start){
    if (this === undefined){
        return new SectionIndexPathIterator(section, cache, start);
    }
    this.section = section;
    this.cache = cache;
    if (cache.children.length === 0){
        this.indexPath = null;
    }else{
        this.lastIndexPath = JSIndexPath([section]);
        do{
            this.lastIndexPath.append(cache.children.length - 1);
            cache = cache.children[this.lastIndexPath.lastIndex];
        } while (cache.expanded && cache.children.length > 0);
        if (start === -1){
            this.indexPath = JSIndexPath(this.lastIndexPath);
        }else if (start instanceof JSIndexPath){
            this.indexPath = JSIndexPath(start);
        }else{
            this.indexPath = JSIndexPath(section, 0);
        }
    }
};

SectionIndexPathIterator.prototype = {

    lastIndexPath: null,

    increment: function(){
        if (this.indexPath !== null){
            if (this.indexPath.isEqual(this.lastIndexPath)){
                this.indexPath = null;
            }else{
                var cacheStack = [];
                var cache = this.cache;
                for (var i = 1, l = this.indexPath.length; i < l; ++i){
                    cacheStack.push(cache);
                    cache = cache.children[this.indexPath[i]];
                }
                if (cache.expanded && cache.children.length > 0){
                    this.indexPath.append(0);
                }else{
                    cache = cacheStack.pop();
                    this.indexPath.lastIndex += 1;
                    while (this.indexPath.lastIndex == cache.children.length){
                        this.indexPath.removeLastIndex();
                        this.indexPath.lastIndex += 1;
                        cache = cacheStack.pop();
                    }
                }
            }
        }
    },

    decrement: function(){
        if (this.indexPath !== null){
            if (this.indexPath.length == 2 && this.indexPath.row === 0){
                this.indexPath = null;
            }else{
                if (this.indexPath.lastIndex > 0){
                    this.indexPath.lastIndex -= 1;
                    var cache = this.cache;
                    for (var i = 1, l = this.indexPath.length; i < l; ++i){
                        cache = cache.children[this.indexPath[i]];
                    }
                    while (cache.expanded && cache.children.length > 0){
                        this.indexPath.append(cache.children.length - 1);
                        cache = cache.children[this.indexPath.lastIndex];
                    }
                }else{
                    this.indexPath.removeLastIndex();
                }
            }
        }
    }
};

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

    _commonStylerInit: function(){
        UIOutlineViewDefaultStyler.$super._commonStylerInit.call(this);
        this.disclosureButtonImage = images.disclosure;
        this.disclosureColor = this.cellDetailTextColor;
        this.selectedDisclosureColor = this.selectedCellTextColor;
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