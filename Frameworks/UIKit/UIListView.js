// #import "UIKit/UIScrollView.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, UIView, UIScrollView, JSProtocol, JSReadOnlyProperty, JSDynamicProperty, UIListView, JSSize, JSIndexPath, JSRect, UIEvent, JSIndexPathSet, JSIndexPathRange, JSBinarySearcher, JSPoint */
'use strict';

JSProtocol("UIListViewDelegate", JSProtocol, {

    // Cells
    cellForListViewAtIndexPath: ['listView', 'indexPath'],
    heightForListViewRowAtIndexPath: ['listView', 'indexPath'],
    estimatedHeightForListViewRows: ['listView'],

    // Headers & Footers

    // Selection
    listViewShouldSelectCellAtIndexPath: ['listView', 'indexPath'],
    listViewDidSelectCellAtIndexPath: ['listView', 'indexPath'],
    listViewDidOpenCellAtIndexPath: ['listView', 'indexPath'],
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
        // this.scrollsHorizontally = false;
        this._visibleCellViews = [];
        this._reusableCellsByIdentifier = {};
        this._cellClassesByIdentifier = {};
        this._cellsContainerView = UIView.init();
        this._selectedIndexPaths = JSIndexPathSet();
        this._contextSelectedIndexPaths = JSIndexPathSet();
        this.contentView.addSubview(this._cellsContainerView);
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

        this._cellsContainerView.frame = JSRect(0, 0, this.contentView.bounds.size.width, y);

        if (this._headerView !== null){
            y += this._headerView.frame.size.height;
        }
        if (this._footerView !== null){
            y += this._footerView.frame.size.height;
        }
        
        this.contentSize = JSSize(this.contentView.bounds.size.width, y);

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
        UIListView.$super.layoutSubviews.call(this);
        var origin = JSPoint.Zero;
        var fitSize = JSSize(this.bounds.size.width, Number.MAX_VALUE);
        if (this._headerView !== null){
            this._headerView.sizeToFitConstraints(fitSize);
        }
        if (this._footerView !== null){
            this._footerView.sizeToFitConstraints(fitSize);
        }
        if (this._headerView !== null){
            this._headerView.frame = JSRect(origin, this._headerView.frame.size);
            origin.y += this._headerView.frame.size.height;
        }
        if (this._needsReload){
            this._reloadDuringLayout();
            this._needsReload = false;
        }
        this._cellsContainerView.frame = JSRect(origin, this._cellsContainerView.frame.size);
        origin.y += this._cellsContainerView.frame.size.height;
        if (this._footerView !== null){
            this._footerView.frame = JSRect(origin, this._footerView.frame.size);
        }
    },

    _didScroll: function(){
        if (!this._needsReload){
            this._updateVisibleCells();
        }
        UIListView.$super._didScroll.call(this);
    },

    layerDidChangeSize: function(layer){
        UIListView.$super.layerDidChangeSize.call(this, layer);
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
    // MARK: - List Header and Footer

    headerView: JSDynamicProperty('_headerView', null),
    footerView: JSDynamicProperty('_footerView', null),

    setHeaderView: function(headerView){
        if (this._headerView){
            this._headerView.removeFromSuperview();
        }
        this._headerView = headerView;
        if (this._headerView){
            this.contentView.addSubview(this._headerView);
        }
        this.setNeedsLayout();
    },

    setFooterView: function(footerView){
        if (this._footerView){
            this._footerView.removeFromSuperview();
        }
        this._footerView = footerView;
        if (this._footerView){
            this.contentView.addSubview(this._footerView);
        }
        this.setNeedsLayout();
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

        // 1. enqueue any visible cells that have gone offscreen
        // enqueue first so the cells can be dequeued and reused for newly visible rows
        var i, l;
        var y;
        var cell;
        var indexPath;
        var visibleCellsContainerRect = this.contentView.convertRectToView(this.contentView.bounds, this._cellsContainerView);
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
            while (y > visibleCellsContainerRect.origin.y - extraHeight && indexPath.section >= 0){
                while (y > visibleCellsContainerRect.origin.y - extraHeight && indexPath.row > 0){
                    indexPath.row -= 1;
                    cell = this._createCellAtIndexPath(indexPath, y, true);
                    y = cell.frame.origin.y;
                    this._cellsContainerView.insertSubviewBeforeSibling(cell, this._visibleCellViews[0]);
                    this._visibleCellViews.unshift(cell);
                }
                // TODO: section header
                indexPath.section -= 1;
                if (indexPath.section >= 0){
                    // TODO: section footer
                    indexPath.row = this._cachedData.numberOfRowsBySection[indexPath.section] - 1;
                }
            }

            // New rows below the last visible cell
            cell = this._visibleCellViews[this._visibleCellViews.length - 1];
            y = cell.frame.origin.y + cell.frame.size.height;
            indexPath = JSIndexPath(cell.indexPath);
            while (y < bottom + extraHeight && indexPath.section < this._cachedData.numberOfSections){
                while (y < bottom + extraHeight && indexPath.row < this._cachedData.numberOfRowsBySection[indexPath.section] - 1){
                    indexPath.row += 1;
                    cell = this._createCellAtIndexPath(indexPath, y);
                    y += cell.frame.size.height;
                    this._cellsContainerView.addSubview(cell);
                    this._visibleCellViews.push(cell);
                }
                // TODO: section footer
                indexPath.section += 1;
                if (indexPath.section < this._cachedData.numberOfSections){
                    // TODO: section header
                }
                indexPath.row = 0;
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
        cell.frame = JSRect(0, y, this._cellsContainerView.bounds.size.width, height);
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

    keyDown: function(event){
        // FIXME: find a better way of checking than using code magic numbers
        if (event.keyCode == 38){
            this.selectPreviousRow();
        }else if (event.keyCode == 40){
            this.selectNextRow();
        }
    },

    keyUp: function(event){
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

    // --------------------------------------------------------------------
    // MARK: - Selecting cells

    allowsMultipleSelection: false,
    selectedIndexPaths: JSDynamicProperty('_selectedIndexPaths', null),
    contextSelectedIndexPaths: JSReadOnlyProperty('_contextSelectedIndexPaths', null),
    _handledSelectionOnDown: false,

    setSelectedIndexPaths: function(selectedIndexPaths){
        this._selectedIndexPaths = JSIndexPathSet(selectedIndexPaths);
        this._updateVisibleCellStates();
    },

    _selectSingleIndexPath: function(indexPath){
        this._selectedIndexPaths.replace(indexPath);
        this._updateVisibleCellStates();
        this._selectionAnchorIndexPath = indexPath;
        if (this.delegate && this.delegate.listViewDidSelectCellAtIndexPath){
            this.delegate.listViewDidSelectCellAtIndexPath(this, indexPath);
        }
    },

    addIndexPathToSelection: function(indexPath){
        this._selectedIndexPaths.addIndexPath(indexPath);
        this._updateVisibleCellStates();
    },

    removeIndexPathFromSelection: function(indexPath){
        this._selectedIndexPaths.removeIndexPath(indexPath);
        this._updateVisibleCellStates();
    },

    indexPathBefore: function(indexPath){
        if (indexPath === null){
            return null;
        }
        var prev = JSIndexPath(indexPath);
        prev.row -= 1;
        while (prev !== null && prev.row < 0){
            prev.section -= 1;
            if (prev.section < 0){
                prev = null;
            }else{
                prev.row = this._cachedData.numberOfRowsBySection[prev.section] - 1;
            }
        }
        return prev;
    },

    indexPathAfter: function(indexPath){
        if (indexPath === null){
            return null;
        }
        var next = JSIndexPath(indexPath);
        next.row += 1;
        while (next !== null && next.row >= this._cachedData.numberOfSections[next.section]){
            next.section += 1;
            next.row = 0;
            if (next.section >= this._cachedData.numberOfSections){
                next = null;
            }
        }
        return next;
    },

    selectableIndexPathAfter: function(indexPath){
        var next = this.indexPathAfter(indexPath);
        if (this.delegate && this.delegate.listViewShouldSelectCellAtIndexPath){
            while (next !== null && !this.delegate.listViewShouldSelectCellAtIndexPath(this, next)){
                next = this.indexPathAfter(next);
            }
        }
        return next;
    },

    selectableIndexPathBefore: function(indexPath){
        var prev = this.indexPathBefore(indexPath);
        if (this.delegate && this.delegate.listViewShouldSelectCellAtIndexPath){
            while (prev !== null && !this.delegate.listViewShouldSelectCellAtIndexPath(this, prev)){
                prev = this.indexPathBefore(prev);
            }
        }
        return prev;
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

    selectNextRow: function(extendSelection){
        var next;
        var selectionEnd = this._selectedIndexPaths.end;
        if (selectionEnd !== null){
            next = this.selectableIndexPathAfter(selectionEnd);
        }
        if (next !== null){
            if (extendSelection){
                // TODO:
            }else{
                this._selectSingleIndexPath(next);
                this.scrollToRowAtIndexPath(next);
            }
        }
    },

    selectPreviousRow: function(extendSelection){
        var prev;
        var selectionStart = this._selectedIndexPaths.start;
        if (selectionStart !== null){
            prev = this.selectableIndexPathBefore(selectionStart);
        }
        if (prev !== null){
            if (extendSelection){
                // TODO:
            }else{
                this._selectSingleIndexPath(prev);
                this.scrollToRowAtIndexPath(prev);
            }
        }
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
    // MARK: - Mouse Events

    _activeCell: null,
    _shouldDrag: false,
    _selectionAnchorIndexPath: null,

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
        this.window.firstResponder = this;
        cell.active = true;
        this._activeCell = cell;
        // command key takes precedence over other modifies, like shift (observed behavior)
        if (this.allowsMultipleSelection && event.hasModifier(UIEvent.Modifiers.command)){
            this._handledSelectionOnDown = true;
            if (this._selectedIndexPaths.contains(cell.indexPath)){
                this.removeIndexPathFromSelection(cell.indexPath);
                // TODO: set anchor to "nearest" selected cell (could be biased in one direction, even if next selected cell is far)
                this._selectionAnchorIndexPath = null;
            }else{
                this.addIndexPathToSelection(cell.indexPath);
                this._selectionAnchorIndexPath = cell.indexPath;
            }
        }else if (this._selectionAnchorIndexPath !== null && this.allowsMultipleSelection && event.hasModifier(UIEvent.Modifiers.shift)){
            this._handledSelectionOnDown = true;
            this._selectedIndexPaths.adjustAnchoredRange(this._selectionAnchorIndexPath, cell.indexPath);
            this._updateVisibleCellStates();
        }else{
            this._shouldDrag = this.delegate && this.delegate.listViewWillBeginDraggingCellAtIndexPath && this.delegate.listViewWillBeginDraggingCellAtIndexPath(this, cell.indexPath);
            if (this._shouldDrag){
                this._handledSelectionOnDown = false;
            }else{
                this._handledSelectionOnDown = true;
                this._selectSingleIndexPath(cell.indexPath);
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
                var shouldSelect = !cell || !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
                if (shouldSelect){
                    if (this._activeCell !== null){
                        this._activeCell.active = false;
                    }
                    this._activeCell = cell;
                    if (this._activeCell !== null){
                        this._activeCell.active = true;
                    }
                    if (cell){
                        if (this.allowsMultipleSelection){
                            this._selectedIndexPaths.adjustAnchoredRange(this._selectionAnchorIndexPath, cell.indexPath);
                            this._updateVisibleCellStates();
                        }else{
                            if (!cell.selected){
                                this._selectSingleIndexPath(cell.indexPath);
                            }
                        }
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
        if (event.clickCount == 2){
        }else{
            var cellFrame = this.contentView.convertRectFromView(cell.bounds, cell);
            if (cellFrame.origin.y < this.contentView.bounds.origin.y){
                this.scrollToRowAtIndexPath(cell.indexPath, UIListView.ScrollPosition.top);
            }else if (cellFrame.origin.y + cellFrame.size.height > this.contentView.bounds.origin.y + this.contentView.bounds.size.height){
                this.scrollToRowAtIndexPath(cell.indexPath, UIListView.ScrollPosition.bottom);
            }
            if (this._handledSelectionOnDown){
                this._handledSelectionOnDown = false;
                return;
            }
            var shouldSelect = !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
            if (shouldSelect){
                this._selectedIndexPaths.replace(cell.indexPath);
                this._updateVisibleCellStates();
                if (this.delegate && this.delegate.listViewDidSelectCellAtIndexPath){
                    this.delegate.listViewDidSelectCellAtIndexPath(this, cell.indexPath);
                }
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Finding Cells by Location

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
    },

    rectForCellAtIndexPath: function(indexPath){
        var cell = this._visibleCellViews[0];
        if (indexPath.isLessThan(cell.indexPath)){
            return this._rectForCellAtIndexPathBeforeVisibleCell(indexPath, cell);
        }
        cell = this._visibleCellViews[this._visibleCellViews.length - 1];
        if (indexPath.isGreaterThan(cell.indexPath)){
            return this._rectForCellAtIndexPathAfterVisibleCell(indexPath, cell);
        }
        return this._rectForVisibleCellAtIndexPath(indexPath);
    },

    _rectForCellAtIndexPathBeforeVisibleCell: function(targetIndexPath, cell){
        // Start at first visible cell and iterate up to target indexPath to get new rect
        // - Fastest when scrolling one row, like when using the up arrow key
        var indexPath = this.indexPathBefore(cell.indexPath);
        var rect = JSRect(cell.frame);
        var minRow;
        while (indexPath.section >= targetIndexPath.section){
            minRow = indexPath.section > targetIndexPath.section ? 0 : targetIndexPath.row;
            while (indexPath.row >= minRow){
                rect.size.height = this._heightForCellAtIndexPath(indexPath);
                rect.origin.y -= rect.size.height;
                indexPath.row -= 1;
            }
            if (indexPath.isGreaterThan(targetIndexPath)){
                // TODO: section header
                indexPath.section -= 1;
                indexPath.row = this._cachedData.numberOfRowsBySection[indexPath.section] - 1;
                // TODO: section footer
            }else{
                indexPath.section -= 1;
            }
        }
        return this.convertRectFromView(rect, this._cellsContainerView);
    },

    _rectForCellAtIndexPathAfterVisibleCell: function(targetIndexPath, cell){
        // Start at last visible cell and iterate down to target indexPath to get new rect
        // - Faster than starting all the way at the top
        // - Fastest when scrolling one row, like when using the down arrow key
        var indexPath = this.indexPathAfter(cell.indexPath);
        var rect = JSRect(cell.frame);
        var maxRow;
        while (indexPath.section <= targetIndexPath.section){
            maxRow = indexPath.section < targetIndexPath.section ? this._cachedData.numberOfRowsBySection[indexPath.section] - 1 : targetIndexPath.row;
            while (indexPath.row <= maxRow){
                rect.origin.y += rect.size.height;
                rect.size.height = this._heightForCellAtIndexPath(indexPath);
                indexPath.row += 1;
            }
            if (indexPath.isLessThan(targetIndexPath)){
                // TODO: section footer
                indexPath.section += 1;
                indexPath.row = 0;
                // TODO: section header
            }else{
                indexPath.section += 1;
            }
        }
        return this.convertRectFromView(rect, this._cellsContainerView);
    },

    _rectForVisibleCellAtIndexPath: function(indexPath){
        var searcher = JSBinarySearcher(this._visibleCellViews, function(_indexPath, cell){
            return _indexPath.compare(cell.indexPath);
        });
        var cell = searcher.itemMatchingValue(indexPath);
        return this.convertRectFromView(cell.bounds, cell);
    },

    // --------------------------------------------------------------------
    // MARK: - Scrolling

    scrollToRowAtIndexPath: function(indexPath, position){
        if (position === undefined){
            position = UIListView.ScrollPosition.auto;
        }
        var rect = this.rectForCellAtIndexPath(indexPath);
        this._scrollToRect(rect, position);
    },

    _scrollToRect: function(rect, position){
        rect = this.convertRectToView(rect, this.contentView);
        if (position === UIListView.ScrollPosition.auto){
            if (rect.origin.y < this.contentView.bounds.origin.y){
                position = UIListView.ScrollPosition.top;
            }else if (rect.origin.y + rect.size.height > this.contentView.bounds.origin.y + this.contentView.bounds.size.height){
                position = UIListView.ScrollPosition.bottom;
            }
        }
        var scrollPoint = this.contentOffset;
        switch (position){
            case UIListView.ScrollPosition.auto:
                break;
            case UIListView.ScrollPosition.top:
                scrollPoint = JSPoint(0, rect.origin.y);
                break;
            case UIListView.ScrollPosition.bottom:
                scrollPoint = JSPoint(0, rect.origin.y + rect.size.height - this.contentView.bounds.size.height);
                break;
            case UIListView.ScrollPosition.middle:
                scrollPoint = JSPoint(0, rect.origin.y + rect.size.height / 2.0 - this.contentView.bounds.size.height / 2.0);
                break;
        }
        this.contentOffset = scrollPoint;
    }

    // TODO: key navigation, select all, etc.

});

UIListView.ScrollPosition = {
    auto: 0,
    top: 1,
    bottom: 2,
    middle: 3

};