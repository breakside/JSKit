// #import "UIKit/UIScrollView.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, UIView, UIScrollView, JSProtocol, JSReadOnlyProperty, JSDynamicProperty, UIListView, JSSize, JSIndexPath, JSRect, UIEvent, JSIndexPathSet, JSIndexPathRange, JSBinarySearcher, JSPoint, UIListViewHeaderFooterView */
'use strict';

(function(){

JSProtocol("UIListViewDelegate", JSProtocol, {

    // Cells
    cellForListViewAtIndexPath: ['listView', 'indexPath'],
    heightForListViewRowAtIndexPath: ['listView', 'indexPath'],
    estimatedHeightForListViewRows: ['listView'],

    // Headers & Footers
    headerViewForListViewSection: ['listView', 'section'],
    footerViewForListViewSection: ['listView', 'section'],
    heightForListViewHeaderInSection: ['listView', 'section'],
    heightForListViewFooterInSection: ['listView', 'section'],

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
        if ('headerHeight' in values){
            this._headerHeight = spec.resolvedValue(values.headerHeight);
        }
        if ('footerHeight' in values){
            this._footerHeight = spec.resolvedValue(values.footerHeight);
        }
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
        if ('dataSource' in values){
            this.dataSource = spec.resolvedValue(values.dataSource);
        }
        var i, l;
        if ('reusableCellClasses' in values){
            for (i = 0, l = values.reusableCellClasses.length; i < l; ++i){
                this.registerCellClassForReuseIdentifier(JSClass.FromName(values.reusableCellClasses[i].className), spec.resolvedValue(values.reusableCellClasses[i].identifier));
            }
        }
        if ('reusableHeaderFooterClasses' in values){
            for (i = 0, l = values.reusableHeaderFooterClasses.length; i < l; ++i){
                this.registerHeaderFooterClassForReuseIdentifier(JSClass.FromName(values.reusableHeaderFooterClasses[i].className), spec.resolvedValue(values.reusableHeaderFooterClasses[i].identifier));
            }
        }
        if ('allowsMultipleSelection' in values){
            this.allowsMultipleSelection = spec.resolvedValue(values.allowsMultipleSelection);
        }
    },

    _commonListInit: function(){
        this._visibleCellViews = [];
        this._visibleHeaderViews = [];
        this._visibleFooterViews = [];
        this._reusableCellsByIdentifier = {};
        this._cellClassesByIdentifier = {};
        this._reusableHeaderFootersByIdentifier = {};
        this._headerFooterClassesByIdentifier = {};
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
    _visibleHeaderViews: null,
    _visibleFooterViews: null,
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
    // MARK: - Header & Footer Sizing

    headerHeight: JSDynamicProperty('_headerHeight', 0),

    setHeaderHeight: function(headerHeight){
        this._headerHeight = headerHeight;
        if (this._hasLoadedOnce){
            this.reloadData();
        }
    },

    footerHeight: JSDynamicProperty('_footerHeight', 0),

    setFooterHeight: function(footerHeight){
        this._footerHeight = footerHeight;
        if (this._hasLoadedOnce){
            this.reloadData();
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Header & Footer Reuse

    registerHeaderFooterClassForReuseIdentifier: function(headerFooterClass, identifier){
        this._headerFooterClassesByIdentifier[identifier] = headerFooterClass;
    },

    dequeueReusableHeaderFooterWithIdentifier: function(identifier, indexPath){
        var headerFooter = null;
        var queue = this._reusableHeaderFootersByIdentifier[identifier];
        if (queue && queue.length > 0){
            headerFooter = queue.pop();
        }else{
            var headerFooterClass = this._headerFooterClassesByIdentifier[identifier];
            if (headerFooterClass){
                headerFooter = headerFooterClass.initWithReuseIdentifier(identifier);
            }
        }
        return headerFooter;
    },
    
    _reusableHeaderFootersByIdentifier: null,
    _headerFooterClassesByIdentifier: null,

    _enqueueReusableHeaderFooter: function(headerFooter){
        var identifier = headerFooter.reuseIdentifier;
        if (!(identifier in this._reusableHeaderFootersByIdentifier)){
            this._reusableHeaderFootersByIdentifier[identifier] = [];
        }
        var queue = this._reusableHeaderFootersByIdentifier[identifier];
        queue.push(headerFooter);
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
        var cell, view;
        var i, l;
        for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
            cell = this._visibleCellViews[i];
            this._enqueueReusableCell(cell);
        }
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            view = this._visibleHeaderViews[i];
            this._enqueueReusableHeaderFooter(view);
        }
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            view = this._visibleFooterViews[i];
            this._enqueueReusableHeaderFooter(view);
        }
        this._visibleCellViews = [];
        this._visibleHeaderViews = [];
        this._visibleFooterViews = [];

        // Cache some of the count and layout data so it only has to be queried once
        this._cachedData = {
            numberOfSections: this.dataSource.numberOfSectionsInListView(this),
            numberOfRowsBySection: [],
            expectedHeaderYOrigins: [],
        };

        // Figure out the content size based on row heights
        // NOTE: For large tables this is much faster if the delegate does NOT use heightForListViewRowAtIndexPath,
        // unless the delegate also uses estimatedHeightForListViewRows
        var numberOfSections = this._cachedData.numberOfSections;
        var numberOfRows = 0;
        var indexPath = JSIndexPath(0, 0);
        var y = 0;
        if (this.delegate && this.delegate.heightForListViewRowAtIndexPath && !this.delegate.estimatedHeightForListViewRows){
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

        for (i = 0; i < numberOfSections; ++i){
            this._cachedData.expectedHeaderYOrigins.push(UNKNOWN_Y_ORIGIN);
        }

        // Increase the content size based on header/footer heights
        // NOTE: For large number of sections this is much faster if the delegate does NOT use heightForListView(Header|Footer)InSection
        // unless the delegate also uses estimatedHeightForListView(Headers|Footers)
        var section;
        if (this.delegate && (this.delegate.heightForListViewHeaderInSection && !this.delegate.estimatedHeightForListViewHeaders)){
            for (section = 0; section < numberOfSections; ++section){
                y += this.delegate.heightForListViewHeaderInSection(section);
            }
        }else{
            var headerHeight = this._headerHeight;
            if (this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                headerHeight = this.delegate.estimatedHeightForListViewHeaders(this);
            }
            y += numberOfSections * headerHeight;
        }

        if (this.delegate && (this.delegate.heightForListViewFooterInSection && !this.delegate.estimatedHeightForListViewFooters)){
            for (section = 0; section < numberOfSections; ++section){
                y += this.delegate.heightForListViewFooterInSection(section);
            }
        }else{
            var footerHeight = this._footerHeight;
            if (this.delegate && this.delegate.estimatedHeightForListViewFooters){
                footerHeight = this.delegate.estimatedHeightForListViewFooters(this);
            }
            y += numberOfSections * footerHeight;
        }

        // Now we have the size of everything that goes in the cells container view
        this._cellsContainerView.frame = JSRect(JSPoint(this._cellsContainerView.frame.origin), JSSize(this.contentView.bounds.size.width, y));

        // If we have a list header and/or footer, those heights go into the overall content size,
        // even though these views are not placed within the cells container view
        if (this._listHeaderView !== null){
            y += this._listHeaderView.frame.size.height;
        }
        if (this._listFooterView !== null){
            y += this._listFooterView.frame.size.height;
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

    _headersStickToTop: false,

    layoutSubviews: function(){
        UIListView.$super.layoutSubviews.call(this);
        var origin = JSPoint.Zero;
        var fitSize = JSSize(this.bounds.size.width, Number.MAX_VALUE);
        // We have to size the header and footer first, so a reloadDuringLayout
        // call, if necessary, will have the proper heights for each for calculating
        // the total content size
        if (this._listHeaderView !== null){
            this._listHeaderView.sizeToFitConstraints(fitSize);
            // The header can be placed right away since it doesn't depend on the
            // height of anything else
            this._listHeaderView.frame = JSRect(origin, JSSize(fitSize.width, this._listHeaderView.frame.size.height));
            origin.y += this._listHeaderView.frame.size.height;
        }
        if (this._listFooterView !== null){
            this._listFooterView.sizeToFitConstraints(fitSize);
        }

        // Reloading, if necessary, will set the proper size for this._cellsContainerView,
        // but we need to at least place it in the correct origin before doing a reload,
        // so all of the offset calcuations for showing/hiding cells are correct
        this._cellsContainerView.frame = JSRect(origin, this._cellsContainerView.frame.size);
        if (this._needsReload){
            this._reloadDuringLayout();
            this._needsReload = false;
        }

        // Only add the height offset from cellsContainerView after a possible reload, because
        // the reload adjusts this height
        origin.y += this._cellsContainerView.frame.size.height;

        // Finally, we can place the footer
        if (this._listFooterView !== null){
            this._listFooterView.frame = JSRect(origin, JSSize(fitSize.width, this._listFooterView.frame.size.height));
        }
    },

    _layoutStickyHeaders: function(){
        var header;
        var yOriginForSticking = this._contentOffset.y - this._cellsContainerView.frame.origin.y + this._contentInsets.top;
        var yOriginOfFollowingHeader = Number.MAX_VALUE;
        var y;
        for (var i = this._visibleHeaderViews.length - 1; i >= 0; --i){
            header = this._visibleHeaderViews[i];
            // Try to place the current header at its expected origin
            y = this._cachedData.expectedHeaderYOrigins[header.section];
            // If the expected origin is less than the sticking origin, then
            // place the header at the sticking origin...
            if (y < yOriginForSticking){
                // ...unless placing the current header at the sticky origin would cause
                // it to overlap with the following header, then the current
                // header gets "pushed up" by the following header
                y = Math.min(yOriginForSticking, yOriginOfFollowingHeader - header.frame.size.height);
            }
            if (y != header.frame.origin.y){
                header.frame = JSRect(JSPoint(header.frame.origin.x, y), header.frame.size);
            }
            yOriginOfFollowingHeader = y;
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

    sizeToFit: function(){
        this.bounds = JSRect(JSPoint.Zero, this._contentSize);
    },

    // --------------------------------------------------------------------
    // MARK: - List Header and Footer

    listHeaderView: JSDynamicProperty('_listHeaderView', null),
    listFooterView: JSDynamicProperty('_listFooterView', null),

    setListHeaderView: function(listHeaderView){
        if (this._listHeaderView){
            this._listHeaderView.removeFromSuperview();
        }
        this._listHeaderView = listHeaderView;
        if (this._listHeaderView){
            this.contentView.addSubview(this._listHeaderView);
        }
        this.setNeedsLayout();
    },

    setListFooterView: function(listFooterView){
        if (this._listFooterView){
            this._listFooterView.removeFromSuperview();
        }
        this._listFooterView = listFooterView;
        if (this._listFooterView){
            this.contentView.addSubview(this._listFooterView);
        }
        this.setNeedsLayout();
    },

    // --------------------------------------------------------------------
    // MARK: - Updating Visible Cells

    _firstVisibleViewType: null,
    _firstVisibleIndexPath: null,
    _lastVisibleViewType: null,
    _lastVisibleIndexPath: null,

    _updateVisibleCells: function(){
        if (!this._cachedData){
            return;
        }

        if (this._cachedData.numberOfSections === 0){
            return;
        }

        var visibleRect = this.contentView.convertRectToView(this.contentView.bounds, this._cellsContainerView);

        // 1. Layout sticky headers first so the enqueue logic doesn't throw away any header that we still want to show
        if (this._headersStickToTop){
            this._layoutStickyHeaders();
        }
        
        // 2. Enqueue reusable views before creating new views, so the enqueued views can be dequeued during the create step
        this._enqueueViewsOutsideOfRect(this._visibleCellViews, visibleRect, this._enqueueReusableCell);
        this._enqueueViewsOutsideOfRect(this._visibleHeaderViews, visibleRect, this._enqueueReusableHeaderFooter);
        this._enqueueViewsOutsideOfRect(this._visibleFooterViews, visibleRect, this._enqueueReusableHeaderFooter);
        
        // 3. Create views that have just become visible
        this._createViewsForRect(visibleRect);

        // 4. Layout sticky headers again to include any that were just added
        if (this._headersStickToTop){
            this._layoutStickyHeaders();
        }

        // 5. Remove any unused enqueued views from their superviews
        this._removeQueuedCells();
        this._removeQueuedHeaderFooters();
    },

    _enqueueViewsOutsideOfRect: function(views, rect, enqueueMethod){
        var bottom = rect.origin.y + rect.size.height;
        var i, l;
        var view;

        // Anything that has scrolled off the bottom
        for (i = views.length - 1; i >= 0; --i){
            view = views[i];
            if (view.frame.origin.y >= bottom){
                enqueueMethod.call(this, view);
                views.pop();
            }else{
                break;
            }
        }

        // Anything that has scrolled off the top
        for (i = 0, l = views.length; i < l; ++i){
            view = views[i];
            if (view.frame.origin.y + view.frame.size.height <= rect.origin.y){
                enqueueMethod.call(this, view);
            }else{
                break;
            }
        }
        if (i > 0){
            views.splice(0, i);
        }

    },

    _createViewsForRect: function(rect){
        if (this._visibleCellViews.length > 0 || this._visibleHeaderViews.length > 0 || this._visibleFooterViews.length > 0){
            this._createViewsForRectBeforeFirstVisibleView(rect);
            this._createViewsForRectAfterLastVisibleView(rect);
        }else{
            this._createViewsForRectUsingTopAsReference(rect);
        }
    },

    _createViewsForRectBeforeFirstVisibleView: function(rect){
        var visibleHeadersBySection = {};
        var visibleFootersBySection = {};
        var cell = null;
        var header = null;
        var footer = null;
        var i, l;
        // Looping backwards so the header var will hold the first header, if any
        for (i = this._visibleHeaderViews.length - 1; i >= 0; --i){
            header = this._visibleHeaderViews[i];
            visibleHeadersBySection[header.section] = header;
        }
        // Looping backwards so the footer var will hold the first footer, if any
        for (i = this._visibleFooterViews.length - 1; i >= 0; --i){
            footer = this._visibleFooterViews[i];
            visibleFootersBySection[footer.section] = footer;
        }

        if (this._visibleCellViews.length){
            cell = this._visibleCellViews[0];
        }

        // Figure out the index path and y origin of the first visible cell.
        // If there is no visible cell, but there is a header or a footer,
        // fake the index path of the would-be first visual cell by guessing an index
        // path that comes immediately after the header or footer.  Note that the
        // guess may not represent an actual index path if the guessed section
        // is empty, but that doesn't matter since the first operation on the
        // index path will be to decrement it.
        var indexPath = null;
        var y;
        if (cell){
            indexPath = JSIndexPath(cell.indexPath);
            y = cell.frame.origin.y;
        }else{
            // If we don't have a visible cell, then it means we only have headers and/or footers.
            // This can happen if a header or footer is taller than our bounds, so it's the only
            // thing showing. Or perhaps if there are sections without cells, we have a few headers
            // and/or footers that run together.
            if ((header && footer && header.section <= footer.section) || (header && !footer)){
                indexPath = JSIndexPath(header.section, 0);
                if (this._headersStickToTop){
                    // Note: in sticky mode we want to still use non-stuck y origin of the header,
                    // but it might be UNKNOWN_Y_ORIGIN, which means we aren't scrolled enough
                    // for anything new anyway, and the loop below will complete without changing anything
                    y = this._cachedData.expectedHeaderYOrigins[header.section];
                }else{
                    y = header.frame.origin.y;
                }
                // The y origin we want is actually the origin of the cell after the header, so
                // add in the header height
                y += header.frame.size.height;
            }else if (footer){
                indexPath = JSIndexPath(footer.section + 1, 0);
                y = footer.frame.origin.y + footer.frame.size.height;
                // The y origin we want is actually the origin of the next cell, which may be offset
                // by a header in the next section, so add that in if availble.
                if (indexPath.section < this._cachedData.numberOfSections - 1){
                    y += this._heightForHeaderInSection(indexPath.section + 1);
                }
            }else{
                // No visible cell, header, or footer...we shouldn't be called
                // if this is the state of things, so this block should never
                // run.  If it does run, there's nothing we can do, so just return.
                return;
            }
        }

        // Loop backward and fill in any cells, headers, and footers that have
        // come on screen.  Note that since the loop is based off of cell index
        // path iteration, we need to be careful to NOT insert the same header
        // or footer twice, which is why we keep track of which sections have
        // visible headers and footers.
        var height;
        while (y > rect.origin.y && indexPath.section >= 0){

            // Remaining section cells.  Note how the first step is to increment
            // because we start with an index path that is already visible.
            while (y > rect.origin.y && indexPath.row > 0){
                indexPath.row -= 1;
                cell = this._createCellAtIndexPath(indexPath, y, true);
                y = cell.frame.origin.y;
                if (this._visibleCellViews.length > 0){
                    this._cellsContainerView.insertSubviewBeforeSibling(cell, this._visibleCellViews[0]);
                }else if (this._visibleFooterViews.length > 0){
                    this._cellsContainerView.insertSubviewBeforeSibling(cell, this._visibleFooterViews[0]);
                }else if (this._visibleHeaderViews.length > 0){
                    this._cellsContainerView.insertSubviewBeforeSibling(cell, this._visibleHeaderViews[0]);
                }else{
                    this._cellsContainerView.addSubview(cell);
                }
                this._visibleCellViews.unshift(cell);
            }

            // Section header
            // NOTE: if we're only showing the footer for the very last section,
            // our index path will be for an invalid section
            if (y > rect.origin.y && indexPath.section < this._cachedData.numberOfSections){
                height = this._heightForHeaderInSection(indexPath.section);
                this._cachedData.expectedHeaderYOrigins[indexPath.section] = y - height;
                if (height > 0 && !(indexPath.section in visibleHeadersBySection)){
                    header = this._createHeaderAtSection(indexPath.section, y, true);
                    visibleHeadersBySection[indexPath.section] = header;
                    if (this._visibleHeaderViews.length > 0){
                        this._cellsContainerView.insertSubviewBeforeSibling(header, this._visibleHeaderViews[0]);
                    }else{
                        this._cellsContainerView.addSubview(header);
                    }
                    this._visibleHeaderViews.unshift(header);
                }
                y -= height;
            }

            // Previous section footer
            indexPath.section -= 1;
            if (y > rect.origin.y && indexPath.section >= 0){
                height = this._heightForFooterInSection(indexPath.section);
                if (height > 0 && !(indexPath.section in visibleFootersBySection)){
                    footer = this._createFooterAtSection(indexPath.section, y, true);
                    visibleFootersBySection[indexPath.section] = footer;
                    if (this._visibleFooterViews.length > 0){
                        this._cellsContainerView.insertSubviewBeforeSibling(footer, this._visibleFooterViews[0]);
                    }else if (this._visibleHeaderViews.length > 0){
                        this._cellsContainerView.insertSubviewBeforeSibling(footer, this._visibleHeaderViews[0]);
                    }else{
                        this._cellsContainerView.addSubview(footer);
                    }
                    this._visibleFooterViews.unshift(footer);
                }
                y-= height;
                indexPath.row = this._cachedData.numberOfRowsBySection[indexPath.section];

                // Sicky previous section header
                if (this._headersStickToTop && !(indexPath.section in visibleHeadersBySection)){
                    height = this._heightForHeaderInSection(indexPath.section);
                    if (height > 0){
                        header = this._createHeaderAtSection(indexPath.section, UNKNOWN_Y_ORIGIN);
                        visibleHeadersBySection[indexPath.section] = header;
                        if (this._visibleHeaderViews.length > 0){
                            this._cellsContainerView.insertSubviewBeforeSibling(header, this._visibleHeaderViews[0]);
                        }else{
                            this._cellsContainerView.addSubview(header);
                        }
                        this._visibleHeaderViews.unshift(header);
                    }
                }
            }
        }
    },

    _createViewsForRectAfterLastVisibleView: function(rect){
        var visibleHeadersBySection = {};
        var visibleFootersBySection = {};
        var cell = null;
        var header = null;
        var footer = null;
        var i, l;
        // Looping forwards so the header var will hold the first header, if any
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            header = this._visibleHeaderViews[i];
            visibleHeadersBySection[header.section] = header;
        }
        // Looping forwards so the footer var will hold the first footer, if any
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            footer = this._visibleFooterViews[i];
            visibleFootersBySection[footer.section] = footer;
        }

        if (this._visibleCellViews.length){
            cell = this._visibleCellViews[this._visibleCellViews.length - 1];
        }

        // Figure out the index path and bottom of the last visible cell.
        // If there is no visible cell, but there is a header or a footer,
        // fake the index path of the would-be last visual cell by guessing an index
        // path that comes immediately before the header or footer.  Note that the
        // guess may not represent an actual index path if the guessed section
        // is empty, but that doesn't matter since the first operation on the
        // index path will be to increment it.
        var indexPath = null;
        var y;
        if (cell){
            indexPath = JSIndexPath(cell.indexPath);
            y = cell.frame.origin.y + cell.frame.size.height;
        }else{
            // If we don't have a visible cell, then it means we only have headers and/or footers.
            // This can happen if a header or footer is taller than our bounds, so it's the only
            // thing showing. Or perhaps if there are sections without cells, we have a few headers
            // and/or footers that run together.
            if ((header && footer && header.section <= footer.section) || (header && !footer)){
                if (header.section > 0){
                    indexPath = JSIndexPath(header.section - 1, this._cachedData.numberOfRowsBySection[header.section - 1] - 1);
                }else{
                    indexPath = JSIndexPath(header.section - 1, 0);
                }
                if (this._headersStickToTop){
                    y = this._cachedData.expectedHeaderYOrigins[header.section];
                }else{
                    y = header.frame.origin.y;
                }
                // We really want the bottom of the cell before this header, which means we need
                // to subtract out any preceding footer height.
                if (indexPath.section >= 0){
                    y -= this._heightForFooterInSection(indexPath.section);
                }
            }else if (footer){
                indexPath = JSIndexPath(footer.section, this._cachedData.numberOfRowsBySection[footer.section] - 1);
                y = footer.frame.origin.y;
            }else{
                // No visible cell, header, or footer...we shouldn't be called
                // if this is the state of things, so this block should never
                // run.  If it does run, there's nothing we can do, so just return.
                return;
            }
        }

        // Loop forward and fill in any cells, headers, and footers that have
        // come on screen.  Note that since the loop is based off of cell index
        // path iteration, we need to be careful to NOT insert the same header
        // or footer twice, which is why we keep track of which sections have
        // visible headers and footers.
        var height;
        var bottom = rect.origin.y + rect.size.height;
        while (y < bottom && indexPath.section < this._cachedData.numberOfSections){

            // Remaining section cells.  Note how the first step is to increment
            // because we start with an index path that is already visible.
            // Note that if all we currently have is the first section header, our indexPath
            // will have an invalid section of -1, so we need to watch out and skip if necessary
            while (indexPath.section >= 0 && y < bottom && indexPath.row < this._cachedData.numberOfRowsBySection[indexPath.section] - 1){
                indexPath.row += 1;
                cell = this._createCellAtIndexPath(indexPath, y);
                y = cell.frame.origin.y + cell.frame.size.height;
                if (this._visibleCellViews.length > 0){
                    this._cellsContainerView.insertSubviewAfterSibling(cell, this._visibleCellViews[this._visibleCellViews.length - 1]);
                }else if (this._visibleFooterViews.length > 0){
                    this._cellsContainerView.insertSubviewBeforeSibling(cell, this._visibleFooterViews[0]);
                }else if (this._visibleHeaderViews.length > 0){
                    this._cellsContainerView.insertSubviewBeforeSibling(cell, this._visibleHeaderViews[0]);
                }else{
                    this._cellsContainerView.addSubview(cell);
                }
                this._visibleCellViews.push(cell);
            }

            // Section footer
            // NOTE: if we're only showing the header for the very first section,
            // our index path will be for an invalid section
            if (indexPath.section >= 0 && y < bottom){
                height = this._heightForFooterInSection(indexPath.section);
                if (height > 0 && !(indexPath.section in visibleFootersBySection)){
                    footer = this._createFooterAtSection(indexPath.section, y);
                    visibleFootersBySection[indexPath.section] = footer;
                    if (this._visibleFooterViews.length > 0){
                        this._cellsContainerView.insertSubviewAfterSibling(footer, this._visibleFooterViews[this._visibleFooterViews.length - 1]);
                    }else if (this._visibleHeaderViews.length > 0){
                        this._cellsContainerView.insertSubviewBeforeSibling(footer, this._visibleHeaderViews[0]);
                    }else{
                        this._cellsContainerView.addSubview(footer);
                    }
                    this._visibleFooterViews.push(footer);
                }
                y += height;
            }

            // Next section header
            indexPath.section += 1;
            if (y < bottom && indexPath.section < this._cachedData.numberOfSections){
                height = this._heightForHeaderInSection(indexPath.section);
                if (height > 0 && !(indexPath.section in visibleHeadersBySection)){
                    header = this._createHeaderAtSection(indexPath.section, y);
                    visibleHeadersBySection[indexPath.section] = header;
                    this._cellsContainerView.addSubview(header);
                    this._visibleHeaderViews.push(header);
                }
                y += height;
                indexPath.row = -1;
            }
        }
    },

    _createViewsForRectUsingTopAsReference: function(rect){
        // No visible rows to key off of, so loop through all rows until we get the first visible one
        // NOTE: optimizations are possible here if we have a constant row height, but generally this loop
        // will only be called when the table first loads and is scrolled to the top, in which case no
        // optimizations are necessary.
        var indexPath = JSIndexPath(0, 0);
        var height;
        var i, l;
        var y = 0;
        var bottom = rect.origin.y + rect.size.height;
        var cell, header, footer;
        var sectionHasHeader = false;
        var sectionHasVisibleHeader = false;
        for (indexPath.section = 0; y < bottom && indexPath.section < this._cachedData.numberOfSections; ++indexPath.section){
            // Section header
            height = this._heightForHeaderInSection(indexPath.section);
            sectionHasHeader = height > 0;
            sectionHasVisibleHeader = false;
            if (sectionHasHeader && y + height > rect.origin.y){
                sectionHasVisibleHeader = true;
                header = this._createHeaderAtSection(indexPath.section, y);
                this._visibleHeaderViews.push(header);
            }
            y += height;
            // Section Cells
            for (indexPath.row = 0, l = this._cachedData.numberOfRowsBySection[indexPath.section]; y < bottom && indexPath.row < l; ++indexPath.row){
                height = this._heightForCellAtIndexPath(indexPath);
                if (y + height > rect.origin.y){
                    cell = this._createCellAtIndexPath(indexPath, y);
                    this._visibleCellViews.push(cell);
                    // If we're using sticky headers, and the section has a header, but it's not
                    // visible because our bounds start in the middle of the section, go ahead
                    // and make the header visible so it can be stuck at the top
                    if (this._headersStickToTop && sectionHasHeader && !sectionHasVisibleHeader){
                        sectionHasVisibleHeader = true;
                        header = this._createHeaderAtSection(indexPath.section, UNKNOWN_Y_ORIGIN);
                        this._visibleHeaderViews.push(header);
                    }
                }
                y += height;
            }
            // Section footer
            if (y < bottom){
                height = this._heightForFooterInSection(indexPath.section);
                if (height > 0 && y + height > rect.origin.y){
                    footer = this._createFooterAtSection(indexPath.section, y);
                    this._visibleFooterViews.push(footer);
                    // If we're using sticky headers, and the section has a header, but it's not
                    // visible because our bounds start in the middle of the section, go ahead
                    // and make the header visible so it can be stuck at the top
                    if (this._headersStickToTop && sectionHasHeader && !sectionHasVisibleHeader){
                        sectionHasVisibleHeader = true;
                        header = this._createHeaderAtSection(indexPath.section, UNKNOWN_Y_ORIGIN);
                        this._visibleHeaderViews.push(header);
                    }
                }
                y += height;
            }
        }

        // Insert views with headers always on top, so they can be sticky at the
        // top of the scroll bounds and still be drawn over the cells and footers
        for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
            this._cellsContainerView.addSubview(this._visibleCellViews[i]);
        }
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            this._cellsContainerView.addSubview(this._visibleFooterViews[i]);
        }
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            this._cellsContainerView.addSubview(this._visibleHeaderViews[i]);
        }
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

    _createHeaderAtSection: function(section, y, yOffsetByHeight){
        var header = this.delegate.headerViewForListViewSection(this, section);
        if (header === null || header === undefined){
            throw new Error("Got null/undefined header for section: %d".sprintf(section));
        }
        header.kind = UIListViewHeaderFooterView.Kind.header;
        header.section = section;
        var height = this._heightForHeaderInSection(section);
        if (yOffsetByHeight){
            y -= height;
        }
        this._cachedData.expectedHeaderYOrigins[section] = y;
        header.frame = JSRect(0, y, this._cellsContainerView.bounds.size.width, height);
        return header;
    },

    _createFooterAtSection: function(section, y, yOffsetByHeight){
        var footer = this.delegate.footerViewForListViewSection(this, section);
        if (footer === null || footer === undefined){
            throw new Error("Got null/undefined footer for section: %d".sprintf(section));
        }
        footer.kind = UIListViewHeaderFooterView.Kind.footer;
        footer.section = section;
        var height = this._heightForFooterInSection(section);
        if (yOffsetByHeight){
            y -= height;
        }
        footer.frame = JSRect(0, y, this._cellsContainerView.bounds.size.width, height);
        return footer;
    },

    _heightForHeaderInSection: function(section){
        var height = this._headerHeight;
        if (this.delegate.heightForListViewHeaderInSection){
            height = this.delegate.heightForListViewHeaderInSection(section);
        }
        return height;
    },

    _heightForFooterInSection: function(section){
        var height = this._footerHeight;
        if (this.delegate.heightForListViewFooterInSection){
            height = this.delegate.heightForListViewFooterInSection(section);
        }
        return height;
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

    _removeQueuedHeaderFooters: function(){
        var queue;
        var headerFooter;
        for (var id in this._reusableHeaderFootersByIdentifier){
            queue = this._reusableHeaderFootersByIdentifier[id];
            for (var i = 0, l = queue.length; i < l; ++i){
                headerFooter = queue[i];
                if (headerFooter.superview !== null){
                    headerFooter.removeFromSuperview();
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
        while (next !== null && next.row >= this._cachedData.numberOfRowsBySection[next.section]){
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
        // Maybe allow an unselectableIndexPathSet to be set or queried from the delegate, and
        // do the subtraction automatically 
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
        var cell = this._cellHitTest(location);
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
        if (this.allowsMultipleSelection && event.hasModifier(UIEvent.Modifiers.platformCommand)){
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
        var cell = this._cellHitTest(location);
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
            // TODO: scrolling (see UITextEditor for similar use case)
            var location = event.locationInView(this);
            var cell = this._cellHitTest(location);
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
            // TODO: double click
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

    /// Get the index path of the visible cell that contains the given location, if any
    ///
    /// Only visible cells are checked in the search. Anything outside of the
    /// visible range will result in a `null` response. 
    ///
    /// Return: The index path of the visible cell that contains the given point, or `null` if no cell matches
    ///
    /// Note: If a sticky header is covering a cell, and the location is over
    /// the sticky header, this function will still return the index path of the 
    /// cell that is under the header.
    indexPathAtLocation: function(location){
        var cell = this.cellAtLocation(location);
        if (cell !== null){
            return cell.indexPath;
        }
        return null;
    },

    /// Get the visible cell that contains the given location, if any
    ///
    /// Only visible cells are checked in the search, because those are the only
    /// cells that are constructed an availble to return.  Anything outside of the
    /// visible range will result in a `null` response. 
    ///
    /// Return: The visible cell that contains the given point, or `null` if no cell matches
    ///
    /// Note: If a sticky header is covering a cell, and the location is over
    /// the sticky header, this function will still return the cell that is
    /// under the header.
    cellAtLocation: function(location){
        // For internal cell hit testing, see `_cellHitTest()`, which considers overlaid headers.
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

    _cellHitTest: function(location){
        // If we don't have sticky headers, then the cell hit test is identical
        // to the cellAtLocation function because there are no overlaping views.
        // However, if we do have sticky headers, a header may be covering a cell,
        // in which case we don't want to indicate that a cell was hit if the user
        // really clicked on the covering header.
        if (this._headersStickToTop){
            var subviewLocation;
            var subview;
            for (var i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
                subview = this._visibleHeaderViews[i];
                subviewLocation = this.convertPointToView(location, subview);
                if (subview.containsPoint(subviewLocation)){
                    return null;
                }
            }
        }
        return this.cellAtLocation(location);
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
                rect.size.height = this._heightForHeaderInSection(indexPath.section);
                rect.origin.y -= rect.size.height;
                indexPath.section -= 1;
                indexPath.row = this._cachedData.numberOfRowsBySection[indexPath.section] - 1;
                rect.size.height = this._heightForFooterInSection(indexPath.section);
                rect.origin.y -= rect.size.height;
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
                rect.size.height = this._heightForFooterInSection(indexPath.section);
                rect.origin.y -= rect.size.height;
                indexPath.section += 1;
                indexPath.row = 0;
                rect.size.height = this._heightForHeaderInSection(indexPath.section);
                rect.origin.y -= rect.size.height;
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
        this.scrollToRect(rect, position);
    }

});

var UIListViewChildIterator = function(indexPath, numberOfRowsBySection){
    if (this === undefined){
        return new UIListViewChildIterator(indexPath);
    }
    this.indexPath = JSIndexPath(indexPath);
    this.numberOfRowsBySection = numberOfRowsBySection;
    this.viewType = UIListView.ViewType.cell;
};

UIListViewChildIterator.prototype = {

    increment: function(){
    },

    decrement: function(){
    }

};

var UNKNOWN_Y_ORIGIN = -1;

UIListView.ViewType = {
    none: 0,
    cell: 1,
    header: 2,
    footer: 3
};

UIListView.ScrollPosition = UIScrollView.ScrollPosition;

})();