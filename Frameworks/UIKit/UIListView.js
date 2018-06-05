// #import "UIKit/UIScrollView.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, UIView, UIScrollView, JSProtocol, JSReadOnlyProperty, JSDynamicProperty, UIListView, JSSize, JSIndexPath, JSRect, UIEvent, JSIndexPathSet, JSIndexPathRange */
'use strict';

JSProtocol("UIListViewDelegate", JSProtocol, {

    heightForListViewRowAtIndexPath: ['listView', 'indexPath'],
    estimatedHeightForListViewRows: ['listView'],
    cellForListViewAtIndexPath: ['listView', 'indexPath'],
    listViewShouldSelectCellAtIndexPath: ['listView', 'indexPath'],
    listViewDidSelectCellAtIndexPath: ['listView', 'indexPath'],
    listViewWillBeginDraggingCellAtIndexPath: ['listView', 'indexPath'],
    menuForListViewCellAtIndexPath: ['listView', 'indexPath']

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
        this._selectedIndexPaths = JSIndexPathSet();
        this._contextSelectedIndexPaths = JSIndexPathSet();
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
        return cell;
    },
    
    _reusableCellsByIdentifier: null,
    _cellClassesByIdentifier: null,
    _visibleCellViews: null,
    _cellsContainerView: null,

    _enqueueReusableCell: function(cell){
        cell.indexPath = null;
        cell.listView = null;
        var identifier = cell.reuseIdentifier;
        if (!(identifier in this._reusableCellsByIdentifier)){
            this._reusableCellsByIdentifier[identifier] = [];
        }
        var queue = this._reusableCellsByIdentifier[identifier];
        queue.push(cell);
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
            this._enqueueReusableCell(cell);
        }
        this._visibleCellViews = [];

        // Cache some of the count and layout data so it only has to be queried once
        this._cachedData = {
            numberOfSections: this.dataSource.numberOfSectionsInListView(this),
            numberOfRowsBySection: []
        };

        // Figure out the content size based on row heights
        // NOTE: For large tables this is much faster if the delegate does NOT use heightForListViewRowAtIndexPath,
        // or if the delegate uses estimatedHeightForListViewRows
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
        this.contentSize = JSSize(this.bounds.size.width, y);

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
        // FIXME: if our width changed, and the delegate uses heightForListViewRowAtIndexPath,
        // then we need to handle the possiblity that the dynamic row height depends on the width.
        // Unclear what the "correct" behavior is in this situation, but it likely requires fixing the
        // scroll position to a relative y-offset of the top-most visible cell.  Problem is we don't
        // know what the correct new offset is until doing a new layout.
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
        var extraHeight = 0;
        var bottom = visibleCellsContainerRect.origin.y + visibleCellsContainerRect.size.height;
        for (i = this._visibleCellViews.length - 1; i >= 0; --i){
            cell = this._visibleCellViews[i];
            if (cell.frame.origin.y > bottom + extraHeight){
                this._enqueueReusableCell(cell);
                this._visibleCellViews.pop();
            }else{
                break;
            }
        }
        for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
            cell = this._visibleCellViews[i];
            if (cell.frame.origin.y + cell.frame.size.height < visibleCellsContainerRect.origin.y - extraHeight){
                this._enqueueReusableCell(cell);
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
            while (y > visibleCellsContainerRect.origin.y - extraHeight && (indexPath.section > 0 || indexPath.row > 0)){
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
            while (y < bottom + extraHeight && (indexPath.section < finalSectionIndex || indexPath.row < finalRowIndex)){
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
            for (indexPath.section = 0; y < bottom + extraHeight && indexPath.section < this._cachedData.numberOfSections; ++indexPath.section){
                // TODO: section header
                for (indexPath.row = 0, l = this._cachedData.numberOfRowsBySection[indexPath.section]; y < bottom + extraHeight && indexPath.row < l; ++indexPath.row){
                    height = this._heightForCellAtIndexPath(indexPath);
                    if (y + height > visibleCellsContainerRect.origin.y - extraHeight){
                        cell = this._createCellAtIndexPath(indexPath, y);
                        this._cellsContainerView.addSubview(cell);
                        this._visibleCellViews.push(cell);
                    }
                    y += height;
                }
                if (y < bottom + extraHeight){
                    // TODO: section footer
                }
            }
        }
        this._removeQueuedCells();
    },

    _createCellAtIndexPath: function(indexPath, y, yOffsetByHeight){
        var cell = this.delegate.cellForListViewAtIndexPath(this, indexPath);
        if (cell === null || cell === undefined){
            throw new Error("Got null/undefined cell for indexPath: %d.%d".sprintf(indexPath.section, indexPath.row));
        }
        cell.listView = this;
        cell.indexPath = JSIndexPath(indexPath);
        var height = this._heightForCellAtIndexPath(indexPath);
        if (yOffsetByHeight){
            y -= height;
        }
        cell.frame = JSRect(0, y, this.bounds.size.width, height);
        cell.active = false;
        cell.selected = this._selectedIndexPaths.contains(indexPath);
        cell.contextSelected = this._contextSelectedIndexPaths.contains(indexPath);
        return cell;
    },

    _heightForCellAtIndexPath: function(indexPath){
        var height = this._rowHeight;
        if (this.delegate.heightForListViewRowAtIndexPath){
            height = this.delegate.heightForListViewRowAtIndexPath(this, indexPath);
        }
        return height;
    },

    _removeQueuedCells: function(){
        var queue;
        var cell;
        for (var id in this._reusableCellsByIdentifier){
            queue = this._reusableCellsByIdentifier[id];
            for (var i = 0, l = queue.length; i < l; ++i){
                cell = queue[i];
                if (cell.superview !== null){
                    cell.removeFromSuperview();
                    cell.listView = null;
                    cell.indexPath = null;
                }
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Responder

    canBecomeFirstResponder: function(){
        return true;
    },

    keyDown: function(e){
    },

    keyUp: function(e){
    },

    canPerformAction: function(action, sender){
        if (action == 'selectAll'){
            if (!this._cachedData){
                return false;
            }
            return this.allowsMultipleSelection;
        }
        return UIListView.$super.canPerformAction.call(this, action, sender);
    },

    selectAll: function(e){
        if (this._cachedData === null){
            return;
        }
        if (!this.allowsMultipleSelection){
            return;
        }
        // TODO: what about unselectable rows?  Is it up to the delegate to ingnore them?
        // Hard to go any other way without requiring an interation though the entire list, which
        // could be very expensive
        var start = JSIndexPath(0, 0);
        var end = JSIndexPath(this._cachedData.numberOfSections - 1, this._cachedData.numberOfRowsBySection[this._cachedData.numberOfSections - 1] - 1);
        var allRange = JSIndexPathRange(start, end);
        var allIndexes = JSIndexPathSet(allRange);
        this._selectedIndexPaths = allIndexes;
        this._updateVisibleCellStates();
    },

    // --------------------------------------------------------------------
    // MARK: - Selecting cells

    allowsMultipleSelection: true,
    selectedIndexPaths: JSDynamicProperty('_selectedIndexPaths', null),
    contextSelectedIndexPaths: JSReadOnlyProperty('_contextSelectedIndexPaths', null),
    _handledSelectionOnDown: false,

    setSelectedIndexPaths: function(selectedIndexPaths){
        this._selectedIndexPaths = JSIndexPathSet(selectedIndexPaths);
        this._updateVisibleCellStates();
    },

    addIndexPathToSelection: function(indexPath){
    },

    removeIndexPathFromSelection: function(indexPath){
    },

    indexPathBefore: function(indexPath){
    },

    indexPathAfter: function(indexPath){
    },

    _updateVisibleCellStates: function(){
        var cell;
        for (var i = 0, l = this._visibleCellViews.length; i < l; ++i){
            cell = this._visibleCellViews[i];
            // FIXME: don't select unless the cell is allowed to be selected
            // If the selected range(s) cover both selectable and unselectable rows,
            // as might be the case with a cheap select-all, just because an index path
            // is contained in the range(s) doesn't mean it can be selected
            cell.selected = this._selectedIndexPaths.contains(cell.indexPath);
            cell.contextSelected = this._contextSelectedIndexPaths.contains(cell.indexPath);
        }
    },

    _activeCell: null,
    _shouldDrag: false,

    mouseDown: function(event){
        var location = event.locationInView(this);
        var cell = this.cellAtLocation(location);
        if (cell === null){
            return;
        }
        var shouldSelect = !this.delegate || !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
        if (!shouldSelect){
            return;
        }
        cell.active = true;
        this._activeCell = cell;
        if (this.allowsMultipleSelection && event.hasModifier(UIEvent.Modifiers.shift)){
            this._handledSelectionOnDown = true;
            if (!this._selectedIndexPaths.contains(cell.indexPath)){
                // TODO: extend selection
            }else{
                // TODO: contract selection
            }
            this._updateVisibleCells();
        }else if (this.allowsMultipleSelection && event.hasModifier(UIEvent.Modifiers.command)){
            this._handledSelectionOnDown = true;
            if (this._selectedIndexPaths.contains(cell.indexPath)){
                this.removeIndexPathFromSelection(cell.indexPath);
            }else{
                if (shouldSelect){
                    this.addIndexPathToSelection(cell.indexPath);
                }
            }
        }else{
            this._shouldDrag = this.delegate && this.delegate.listViewWillBeginDraggingCellAtIndexPath && this.delegate.listViewWillBeginDraggingCellAtIndexPath(this, cell.indexPath);
            if (this._shouldDrag){
                this._handledSelectionOnDown = false;
            }else{
                this._handledSelectionOnDown = true;
                if (shouldSelect){
                    this._selectedIndexPaths.replace(cell.indexPath);
                    this._updateVisibleCellStates();
                }
            }
        }
    },

    rightMouseDown: function(event){
        var location = event.locationInView(this);
        var cell = this.cellAtLocation(location);
        if (cell === null){
            return;
        }
        if (this.delegate && this.delegate.menuForListViewCellAtIndexPath){
            var menu = this.delegate.menuForListViewCellAtIndexPath(this, cell.indexPath);
            if (menu !== null){
                if (this._selectedIndexPaths.contains(cell.indexPath)){
                    this._contextSelectedIndexPaths = JSIndexPathSet(this._selectedIndexPaths);
                }else{
                    this._contextSelectedIndexPaths.replace(cell.indexPath);
                }
                this._updateVisibleCellStates();
                var locationInCell = this.convertPointToView(location, cell);
                menu.delegate = this;
                menu.openAtLocationInContextView(locationInCell, cell);
            }
        }
    },

    menuDidClose: function(menu){
        this._contextSelectedIndexPaths = JSIndexPathSet();
        this._updateVisibleCellStates();
    },

    mouseDragged: function(event){
        if (this._shouldDrag){

        }else{
            // TODO: scrolling
            var location = event.locationInView(this);
            var cell = this.cellAtLocation(location);
            if (cell !== this._activeCell){
                var shouldSelect = !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
                if (shouldSelect){
                    if (this._activeCell !== null){
                        this._activeCell.active = false;
                    }
                    this._activeCell = cell;
                    if (this._activeCell !== null){
                        this._activeCell.active = true;
                    }
                    if (!cell.selected){
                        if (this.allowsMultipleSelection){
                            // TODO: add to selection
                        }else{
                            this._selectedIndexPaths.replace(cell.indexPath);
                        }
                        this._updateVisibleCellStates();
                    }
                }
            }
        }
    },

    mouseUp: function(event){
        if (this._activeCell === null){
            return;
        }
        var cell = this._activeCell;
        this._activeCell.active = false;
        this._activeCell = null;
        if (this._handledSelectionOnDown){
            this._handledSelectionOnDown = false;
            return;
        }
        var shouldSelect = !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
        if (shouldSelect){
            this._selectedIndexPaths.replace(cell.indexPath);
            this._updateVisibleCellStates();
        }
    },

    indexPathAtLocation: function(location){
        var cell = this.cellAtLocation(location);
        if (cell !== null){
            return cell.indexPath;
        }
        return null;
    },

    cellAtLocation: function(location){
        if (!this.containsPoint(location)){
            return null;
        }
        var locationInContainer = this.convertPointToView(location, this._cellsContainerView);
        var searcher = JSBinarySearcher(this._visibleCellViews, function(y, cell){
            if (y < cell.frame.origin.y){
                return -1;
            }
            if (y >= cell.frame.origin.y + cell.frame.size.height){
                return 1;
            }
            return 0;
        });
        return searcher.itemMatchingValue(locationInContainer.y);
    }

    // TODO: key navigation, select all, etc.

});