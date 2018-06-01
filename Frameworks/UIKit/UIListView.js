// #import "UIKit/UIScrollView.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, UIView, UIScrollView, JSProtocol, JSDynamicProperty, UIListView, JSSize, JSIndexPath, JSRect, UIEvent */
'use strict';

JSProtocol("UIListViewDelegate", JSProtocol, {

    heightForListViewRowAtIndexPath: ['listView', 'indexPath']

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
    },

    _commonListInit: function(){
        this._visibleCellViews = [];
        this._reusableCellsByIdentifier = {};
        this._cellClassesByIdentifier = {};
        this._cellsContainerView = UIView.initWithFrame(JSRect(0, 0, this.bounds.size.width, 0));
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

    dequeueReusableCellForIdentifierAtIndexPath: function(identifier, indexPath){
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
    _cellsContainerView: null,
    _visibleCellViews: null,

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
            if (cell.resueIdentifier){
                this._enqueueReusableCell(cell);
            }
            cell.removeFromSuperview();
            cell.listView = null;
            cell.indexPath = null;
        }
        this._visibleCellViews = [];

        // Cache some of the count and layout data so it only has to be queried once
        this._cachedData = {
            numberOfSections: this.dataSource.numberOfSectionsInListView(this),
            numberOfRowsBySection: [],
            rowHeights: []
        };

        // Figure out the content size based on row heights
        // NOTE: For large tables this is much faster if the delegate does NOT use heightForListViewRowAtIndexPath
        // TODO: support delegate.estimatedHeightForListViewRows, allowing fast processing here, but fine-tuning of heights while scrolling
        var numberOfSections = this._cachedData.numberOfSections;
        var numberOfRows = 0;
        var contentSize = JSSize(this.bounds.width, 0);
        var indexPath = JSIndexPath(0, 0);
        var rowHeight;
        if (this.delegate && this.delegate.heightForListViewRowAtIndexPath){
            for (indexPath.section = 0; indexPath.section < numberOfSections; ++indexPath.section){
                numberOfRows = this.dataSource.numberOfRowsInListViewSection(this, indexPath.section);
                this._cachedData.numberOfRowsBySection.push(numberOfRows);
                for (indexPath.row = 0; indexPath.row < numberOfRows; ++indexPath.row){
                    rowHeight = this.delegate.heightForListViewRowAtIndexPath(this, indexPath);
                    this._cachedData.rowHeights.push(rowHeight);
                    contentSize.height += rowHeight;
                }
            }
        }else{
            for (indexPath.section = 0; indexPath.section < numberOfSections; ++indexPath.section){
                numberOfRows = this.dataSource.numberOfRowsInListViewSection(this, indexPath.section);
                this._cachedData.numberOfRowsBySection.push(numberOfRows);
                contentSize.height += numberOfRows * this._rowHeight;
            }
        }
        this.contentSize = contentSize;

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
        // 1. enqueue any visible cells that have gone offscreen
        // 2. add new cells that have come on screen
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