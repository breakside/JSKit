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
        this._edit.expandingIndexPath = indexPath;
        iterator = this._indexPathIteratorForSection(indexPath.section, indexPath);
        iterator.increment();
        for (; iterator.indexPath !== null && iterator.indexPath.length > indexPath.length; iterator.increment()){
            if (recursive){
                expandable = this.dataSource.outlineViewIsExandableAtIndexPath(this, iterator.indexPath);
                if (expandable){
                    this._expandedIndexPaths.add(iterator.indexPath.toString());
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
        this._edit.collapsingIndexPath = indexPath;
        for (i = 0, l = this._visibleItems.length; i < l; ++i){
            if (this._visibleItems[i].indexPath.length > indexPath.length && this._visibleItems[i].indexPath.startsWith(indexPath)){
                this._visibleItems[i].state = UIListView.VisibleItemState.deleting;
                this._visibleItems[i].animation = this.collapseRowAnimation;
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

    _stopAnimationsForEdit: function(animatingEdit, newEdit){
        var isReversingCollapse = animatingEdit.collapsingIndexPath && newEdit.expandingIndexPath && animatingEdit.collapsingIndexPath.isEqual(newEdit.expandingIndexPath);
        var isReversingExpand = animatingEdit.expandingIndexPath && newEdit.collapsingIndexPath && animatingEdit.expandingIndexPath.isEqual(newEdit.collapsingIndexPath);
        if (isReversingCollapse || isReversingExpand){
            newEdit.animationStartPercentage = 1 - animatingEdit.animator.percentComplete;
        }
        UIOutlineView.$super._stopAnimationsForEdit.call(this, animatingEdit, newEdit);
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
            var recursive = event.hasModifier(UIEvent.Modifier.option);
            if (event.key == UIEvent.Key.right){
                this.expandRowAtIndexPath(singleIndexPath, recursive);
            }else if (event.key == UIEvent.Key.left){
                this.collapseRowAtIndexPath(singleIndexPath, recursive);
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
    }

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