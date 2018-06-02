// #import "UIKit/UIScrollView.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, UIView, UIScrollView, JSProtocol, JSDynamicProperty, UIListView, JSSize, JSIndexPath, JSRect, UIEvent */
'use strict';

JSProtocol("UIListViewDelegate", JSProtocol, {

    heightForListViewRowAtIndexPath: ['listView', 'indexPath'],
    estimatedHeightForListViewRows: ['listView'],
    cellForListViewAtIndexPath: ['listView', 'indexPath']

});

JSProtocol("UIListViewDataSource", JSProtocol, {

    numberOfSectionsInListView: ['listView'],
    numberOfRowsInListViewSection: ['listView', 'sectionIndex'],

});

JSClass("UIListView", UIScrollView, {

    // --------------------------------------------------------------------
    // MARK: - Creating a List View

    initWithFrame: function(frame){
        UIListView.$super.initWithFrame.call(this, frame);
        this._commonListInit();
    },

    initWithSpec: function(spec, values){
        UIListView.$super.initWithSpec.call(this, spec, values);
        this._commonListInit();
        if ('rowHeight' in values){
            this._rowHeight = spec.resolvedValue(values.rowHeight);
        }
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
        if ('dataSource' in values){
            this.dataSource = spec.resolvedValue(values.dataSource);
        }
        if ('reusableCellClasses' in values){
            for (var i = 0, l = values.reusableCellClasses.length; i < l; ++i){
                this.registerCellClassForReuseIdentifier(JSClass.FromName(values.reusableCellClasses[i].className), spec.resolvedValue(values.reusableCellClasses[i].identifier));
            }
        }
    },

    _commonListInit: function(){
        this._visibleCellViews = [];
        this._reusableCellsByIdentifier = {};
        this._cellClassesByIdentifier = {};
        this._cellsContainerView = UIView.init();
        this.addSubview(this._cellsContainerView);
    },

    // --------------------------------------------------------------------
    // MARK: - Delegate and Data Source
    
    delegate: null,
    dataSource: null,

    // --------------------------------------------------------------------
    // MARK: - Cell Sizing

    rowHeight: JSDynamicProperty('_rowHeight', 44),

    setRowHeight: function(rowHeight){
        this._rowHeight = rowHeight;
        if (this._hasLoadedOnce){
            this.reloadData();
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Cell Reuse

    registerCellClassForReuseIdentifier: function(cellClass, identifier){
        this._cellClassesByIdentifier[identifier] = cellClass;
    },

    dequeueReusableCellWithIdentifier: function(identifier, indexPath){
        var cell = null;
        var queue = this._reusableCellsByIdentifier[identifier];
        if (queue && queue.length > 0){
            cell = queue.pop();
        }else{
            var cellClass = this._cellClassesByIdentifier[identifier];
            if (cellClass){
                cell = cellClass.initWithReuseIdentifier(identifier);
            }
        }
        if (cell !== null){
            cell.listView = this;
            cell.indexPath = JSIndexPath(indexPath);
        }
        return cell;
    },
    
    _reusableCellsByIdentifier: null,
    _cellClassesByIdentifier: null,
    _visibleCellViews: null,
    _cellsContainerView: null,

    _enqueueReusableCell: function(cell){
        cell.indexPath = null;
        cell.listView = null;
        var identifier = cell.resueIdentifier;
        if (!(identifier in this._reusableCellsByIdentifier)){
            this._reusableCellsByIdentifier[identifier] = [];
        }
        this._reusableCellsByIdentifier[identifier].push(cell);
    },

    // --------------------------------------------------------------------
    // MARK: - Reloading List Data

    reloadData: function(){
        if (!this.dataSource){
            return;
        }
        this._needsReload = true;
        this.setNeedsLayout();
    },

    _hasLoadedOnce: false,
    _cachedData: null,
    _needsReload: false,

    _reloadDuringLayout: function(){
        // First, remove all visible views so _updateVisibleCells will be forced to load all new cells
        var cell;
        for (var i = 0, l = this._visibleCellViews.length; i < l; ++i){
            cell = this._visibleCellViews[i];
            this._removeVisibleCell(cell);
        }
        this._visibleCellViews = [];

        // Cache some of the count and layout data so it only has to be queried once
        this._cachedData = {
            numberOfSections: this.dataSource.numberOfSectionsInListView(this),
            numberOfRowsBySection: []
        };

        // Figure out the content size based on row heights
        // NOTE: For large tables this is much faster if the delegate does NOT use heightForListViewRowAtIndexPath
        var numberOfSections = this._cachedData.numberOfSections;
        var numberOfRows = 0;
        var indexPath = JSIndexPath(0, 0);
        var y = 0;
        if (this.delegate && this.delegate.heightForListViewRowAtIndexPath){
            for (indexPath.section = 0; indexPath.section < numberOfSections; ++indexPath.section){
                numberOfRows = this.dataSource.numberOfRowsInListViewSection(this, indexPath.section);
                this._cachedData.numberOfRowsBySection.push(numberOfRows);
                for (indexPath.row = 0; indexPath.row < numberOfRows; ++indexPath.row){
                    y += this.delegate.heightForListViewRowAtIndexPath(this, indexPath);
                }
            }
        }else{
            var rowHeight = this._rowHeight;
            if (this.delegate && this.delegate.estimatedHeightForListViewRows){
                rowHeight = this.delegate.estimatedHeightForListViewRows(this);
            }
            for (indexPath.section = 0; indexPath.section < numberOfSections; ++indexPath.section){
                numberOfRows = this.dataSource.numberOfRowsInListViewSection(this, indexPath.section);
                this._cachedData.numberOfRowsBySection.push(numberOfRows);
                y += numberOfRows * rowHeight;
            }
        }
        // TODO: section headers and footers
        // TODO: table header and footer
        this.contentSize = JSSize(this.bounds.width, y);

        // Finally, update the visible cells
        // NOTE: setting this.contentSize *may* trigger _didScroll and/or layerDidChangeSize,
        // each of which would ordinarily call _updateVisibleCells themselves.  Since we don't know
        // if either will be called, and since we only want to update once, those functions are configured
        // to NOT call _updateVisibleCells while reloading.  Therefore, we need to make the call ourself.
        this._updateVisibleCells();

        this._hasLoadedOnce = true;
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        if (this._needsReload){
            this._reloadDuringLayout();
            this._needsReload = false;
        }
        UIListView.$super.layoutSubviews.call(this);
    },

    _didScroll: function(){
        if (!this._needsReload){
            this._updateVisibleCells();
        }
        UIListView.$super._didScroll.call(this);
    },

    layerDidChangeSize: function(layer){
        if (!this._needsReload){
            this._updateVisibleCells();
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Updating Visible Cells

    _updateVisibleCells: function(){
        if (!this._cachedData){
            return;
        }

        if (this._cachedData.numberOfSections === 0){
            return;
        }

        // TODO: adjust for table header and footer
        this._cellsContainerView.frame = JSRect(0, 0, this.bounds.size.width, this.contentSize.height);

        // 1. enqueue any visible cells that have gone offscreen
        // enqueue first so the cells can be dequeued and reused for newly visible rows
        var i, l;
        var y;
        var cell;
        var indexPath;
        var visibleCellsContainerRect = this.convertRectToView(this.bounds, this._cellsContainerView);
        var bottom = visibleCellsContainerRect.origin.y + visibleCellsContainerRect.size.height;
        for (i = this._visibleCellViews.length - 1; i >= 0; --i){
            cell = this._visibleCellViews[i];
            if (cell.frame.origin.y > bottom){
                this._removeVisibleCell(cell);
                this._visibleCellViews.pop();
            }else{
                break;
            }
        }
        for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
            cell = this._visibleCellViews[i];
            if (cell.frame.origin.y + cell.frame.size.height < visibleCellsContainerRect.origin.y){
                this._removeVisibleCell(cell);
            }else{
                break;
            }
        }
        if (i > 0){
            this._visibleCellViews.splice(0, i);
        }

        // 2. add new rows that have come on screen
        if (this._visibleCellViews.length > 0){
            // New rows above the first visible cell
            cell = this._visibleCellViews[0];
            indexPath = JSIndexPath(cell.indexPath);
            y = cell.frame.origin.y;
            while (y > visibleCellsContainerRect.origin.y && (indexPath.section > 0 || indexPath.row > 0)){
                if (indexPath.row > 0){
                    indexPath.row -= 1;
                }else{
                    indexPath.section -= 1;
                    indexPath.row = this._cachedData.numberOfRowsBySection[indexPath.section] - 1;
                    // TODO: section header & footer
                }
                cell = this._createCellAtIndexPath(indexPath, y, true);
                y = cell.frame.origin.y;
                this._cellsContainerView.insertSubviewBeforeSibling(cell, this._visibleCellViews[0]);
                this._visibleCellViews.unshift(cell);
            }

            // New rows below the last visible cell
            cell = this._visibleCellViews[this._visibleCellViews.length - 1];
            y = cell.frame.origin.y + cell.frame.size.height;
            var finalSectionIndex = this._cachedData.numberOfSections - 1;
            var finalRowIndex = this._cachedData.numberOfRowsBySection[finalSectionIndex] - 1;
            indexPath = JSIndexPath(cell.indexPath);
            if (y < bottom && (indexPath.section < finalSectionIndex || indexPath.row < finalRowIndex)){
                if (indexPath.row < this._cachedData.numberOfRowsBySection[indexPath.section] - 1){
                    indexPath.row += 1;
                }else{
                    indexPath.row = 0;
                    indexPath.section += 1;
                    // TODO: section footer & header
                }
                cell = this._createCellAtIndexPath(indexPath, y);
                y += cell.frame.size.height;
                this._cellsContainerView.addSubview(cell);
                this._visibleCellViews.push(cell);
            }
        }else{
            // No visible rows to key off of, so loop through all rows until we get the first visible one
            // NOTE: optimizations are possible here if we have a constant row height, but generally this loop
            // will only be called when the table first loads and is scrolled to the top, in which case no
            // optimizations are necessary.
            indexPath = JSIndexPath(0, 0);
            var height;
            y = 0;
            for (indexPath.section = 0; y < bottom && indexPath.section < this._cachedData.numberOfSections; ++indexPath.section){
                // TODO: section header
                for (indexPath.row = 0, l = this._cachedData.numberOfRowsBySection[indexPath.section]; y < bottom && indexPath.row < l; ++indexPath.row){
                    height = this._heightForCellAtIndexPath(indexPath);
                    if (y + height > visibleCellsContainerRect.origin.y){
                        cell = this._createCellAtIndexPath(indexPath, y);
                        this._cellsContainerView.addSubview(cell);
                        this._visibleCellViews.push(cell);
                    }
                    y += height;
                }
                if (y < bottom){
                    // TODO: section footer
                }
            }
        }
    },

    _createCellAtIndexPath: function(indexPath, y, yOffsetByHeight){
        var cell = this.delegate.cellForListViewAtIndexPath(this, indexPath);
        if (cell === null || cell === undefined){
            throw new Error("Got null/undefined cell for indexPath: %d.%d".sprintf(indexPath.section, indexPath.row));
        }
        var height = this._heightForCellAtIndexPath(indexPath);
        if (yOffsetByHeight){
            y -= height;
        }
        cell.frame = JSRect(0, y, this.bounds.size.width, height);
        return cell;
    },

    _heightForCellAtIndexPath: function(indexPath){
        var height = this._rowHeight;
        if (this.delegate.heightForListViewRowAtIndexPath){
            height = this.delegate.heightForListViewRowAtIndexPath(this, indexPath);
        }
        return height;
    },

    _removeVisibleCell: function(cell){
        if (cell.resueIdentifier){
            this._enqueueReusableCell(cell);
        }
        cell.removeFromSuperview();
        cell.listView = null;
        cell.indexPath = null;
    },

    _handledSelectionOnDown: false,

    mouseDown: function(event){
        if (event.hasModifier(UIEvent.Modifiers.shift)){
            this._handledSelectionOnDown = true;
        }else if (event.hasModifier(UIEvent.Modifiers.command)){
            this._handledSelectionOnDown = true;
        }else{
            this._handledSelectionOnDown = false;
        }
    },

    mouseUp: function(event){
        if (this._handledSelectionOnDown){
            this._handledSelectionOnDown = false;
            return;
        }
    }

});