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

    expandRowAtIndexPath: function(indexPath){
        var cache = this._cacheForIndexPath(indexPath);
        if (!cache){
            return;
        }
        if (cache.expandable && !cache.expanded){
            cache.expanded = true;
            // TODO: figure out how many rows we have, then insert
            // should never scroll
        }
    },

    collapseRowAtIndexPath: function(indexPath){
        var cache = this._cacheForIndexPath(indexPath);
        if (!cache){
            return;
        }
        if (cache.expanded){
            cache.expanded = false;
            // TODO: figure out how many rows we had, then remove
            // should only scroll if content size is now too small for content offset
        }
    },

    _indexPathIteratorForSection: function(section, start){
        return new SectionIndexPathIterator(section, this._cachedData.outline.children[section], start);
    },

    _numberOfSections: function(){
        return this.dataSource.numberOfSectionsInOutlineView(this);
    },

    _resetCachedData: function(){
        this._cachedData.outline = {expandable: true, expanded: true, numberOfRows: 0, children: []};
    },

    _numberOfRowsInSection: function(section){
        var indexPath = JSIndexPath([section]);
        var cache = this._cacheOutlineAtIndexPath(indexPath, this._cachedData.outline);
        this._cachedData.outline.numberOfRows += cache.numberOfRows;
        return cache.numberOfRows;
    },

    _cacheOutlineAtIndexPath: function(indexPath, parentCache){
        var cache = {
            expandable: indexPath.length === 1 || (this.dataSource.outlineViewIsExandableAtIndexPath(this, indexPath) === true),
            expanded: false,
            children: [],
            numberOfRows: indexPath.length > 1 ? 1 : 0
        };
        var i, l;
        var childCache;
        if (cache.expandable){
            cache.expanded = indexPath.length === 1 || (this.dataSource.outlineViewIsExpandedAtIndexPath && this.dataSource.outlineViewIsExpandedAtIndexPath(this, indexPath));
            if (cache.expanded){
                l = this.dataSource.outlineViewNumberOfChildrenAtIndexPath(this, indexPath);
                for (i = 0; i < l; ++i){
                    childCache = this._cacheOutlineAtIndexPath(indexPath.appending(i), cache);
                    cache.numberOfRows += childCache.numberOfRows;
                }
            }
        }
        parentCache.children[indexPath.lastIndex] = cache;
        return cache;
    },

    _cacheForIndexPath: function(indexPath){
        if (this._cachedData === null){
            return null;
        }
        var cache = this._cachedData.outline;
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

    enumerateSelectedIndexPaths: function(callback){
        var range;
        var indexPath;
        var section, row;
        var rowCount;
        var handle;
        if (this.delegate && this.delegate.listViewShouldSelectCellAtIndexPath){
            handle = function(indexPath){
                if (this.delegate.listViewShouldSelectCellAtIndexPath(this, indexPath)){
                    callback.call(this, indexPath);
                }
            };
        }else{
            handle = callback;
        }
        for (var i = 0, l = this.ranges.length; i < l; ++i){
            range = this.ranges[i];
            // TODO: iterate through outline index paths in range
        }
    },

    _updateCellState: function(cell){
        UIOutlineView.$super._updateCellState.call(this, cell);
        var cache = this._cacheForIndexPath(cell.indexPath);
        cell.expandable = cache && cache.expandable;
        cell.expanded = cache && cache.expanded;
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

    _commonStylerInit: function(){
        UIOutlineViewDefaultStyler.$super._commonStylerInit.call(this);
        this.disclosureButtonImage = images.disclosure;
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
        cell.disclosureButton.hidden = !cell.expandable;
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