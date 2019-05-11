// #import "UIScrollView.js"
// #import "UIEvent.js"
// #import "UIPlatform.js"
// #import "UIImageView.js"
/* global JSClass, JSObject, JSCopy, JSInsets, JSFont, JSColor, UILayer, UIView, UIImageView, UIScrollView, UIPlatform, JSProtocol, JSReadOnlyProperty, JSDynamicProperty, UIListView, JSSize, JSIndexPath, JSRect, UIEvent, JSIndexPathSet, JSIndexPathRange, JSBinarySearcher, JSPoint, UIListViewHeaderFooterView, UIListViewStyler, UIListViewDefaultStyler */
'use strict';

(function(){

JSProtocol("UIListViewDelegate", JSProtocol, {

    // Cells
    cellForListViewAtIndexPath: function(listView, indexPath){},
    heightForListViewRowAtIndexPath: function(listView, indexPath){},
    estimatedHeightForListViewRows: function(listView){},

    // Headers & Footers
    headerViewForListViewSection: function(listView, section){},
    footerViewForListViewSection: function(listView, section){},
    heightForListViewHeaderInSection: function(listView, section){},
    heightForListViewFooterInSection: function(listView, section){},

    // Selection
    listViewShouldSelectCellAtIndexPath: function(listView, indexPath){},
    listViewDidSelectCellAtIndexPath: function(listView, indexPath){},
    listViewDidFinishSelectingCellAtIndexPath: function(listView, indexPath){},
    listViewDidOpenCellAtIndexPath: function(listView, indexPath){},
    listViewSelectionDidChange: function(listView, selectedIndexPaths){},

    // Context menu
    menuForListViewCellAtIndexPath: function(listView, indexPath){},

    // Dragging cells
    listViewShouldDragCellAtIndexPath: function(listView, indexPath){},
    pasteboardItemsForListViewAtIndexPath: function(listView, indexPath){},
    listViewWillBeginDraggingSession: function(listView, session){}

});

JSProtocol("UIListViewDataSource", JSProtocol, {

    numberOfSectionsInListView: function(listView){},
    numberOfRowsInListViewSection: function(listView, sectionIndex){}

});

JSClass("UIListView", UIScrollView, {

    // --------------------------------------------------------------------
    // MARK: - Creating a List View

    initWithStyler: function(styler){
        this._styler = styler;
        this.init();
    },

    initWithFrame: function(frame){
        UIListView.$super.initWithFrame.call(this, frame);
        this._commonListInit();
    },

    initWithSpec: function(spec, values){
        UIListView.$super.initWithSpec.call(this, spec, values);
        if ('styler' in values){
            this._styler = spec.resolvedEnum(values.styler, UIListView.Styler);
        }
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
        var reuse;
        var styler;
        if ('reusableCellClasses' in values){
            for (i = 0, l = values.reusableCellClasses.length; i < l; ++i){
                reuse = values.reusableCellClasses[i];
                if (reuse.styler){
                    styler = spec.resolvedValue(reuse.styler);
                }else{
                    styler = null;
                }
                this.registerCellClassForReuseIdentifier(JSClass.FromName(reuse.className), spec.resolvedValue(reuse.identifier), styler);
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
        if ('headersStickToTop' in values){
            this._headersStickToTop = spec.resolvedValue(values.headersStickToTop);
        }
    },

    _commonListInit: function(){
        this.stylerProperties = {};
        this._visibleCellViews = [];
        this._visibleHeaderViews = [];
        this._visibleFooterViews = [];
        this._reusableCellsByIdentifier = {};
        this._cellClassesByIdentifier = {};
        this._reusableHeaderFootersByIdentifier = {};
        this._headerFooterClassesByIdentifier = {};
        this._cellsContainerView = UIView.init();
        this._selectedIndexPaths = JSIndexPathSet();
        this._selectedIndexPaths.delegate = this;
        this._contextSelectedIndexPaths = JSIndexPathSet();
        this.contentView.addSubview(this._cellsContainerView);
        if (this._styler === null){
            this._styler = this.$class.Styler.default;
        }
        this._styler.initializeListView(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Delegate and Data Source
    
    delegate: null,
    dataSource: null,

    // --------------------------------------------------------------------
    // MARK: - Styling
    
    sylerProperties: null,
    styler: JSDynamicProperty('_styler', null),

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

    registerCellClassForReuseIdentifier: function(cellClass, identifier, styler){
        this._cellClassesByIdentifier[identifier] = {cellClass: cellClass, styler: styler || null};
    },

    dequeueReusableCellWithIdentifier: function(identifier, indexPath){
        var cell = null;
        var queue = this._reusableCellsByIdentifier[identifier];
        if (queue && queue.length > 0){
            cell = queue.pop();
        }else{
            var info = this._cellClassesByIdentifier[identifier];
            if (info){
                cell = info.cellClass.initWithReuseIdentifier(identifier, info.styler);
                var styler = info.styler || this._styler;
                styler.initializeCell(cell, indexPath);
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

    dequeueReusableHeaderWithIdentifier: function(identifier, section){
        return this._dequeueReusableHeaderFooterWithIdentifier(identifier, UIListViewHeaderFooterView.Kind.header, section);
    },

    dequeueReusableFooterWithIdentifier: function(identifier, section){
        return this._dequeueReusableHeaderFooterWithIdentifier(identifier, UIListViewHeaderFooterView.Kind.footer, section);
    },

    _dequeueReusableHeaderFooterWithIdentifier: function(identifier, kind, section){
        var headerFooter = null;
        var queue = this._reusableHeaderFootersByIdentifier[identifier];
        if (queue && queue.length > 0){
            headerFooter = queue.pop();
        }else{
            var headerFooterClass = this._headerFooterClassesByIdentifier[identifier];
            if (headerFooterClass){
                headerFooter = headerFooterClass.initWithReuseIdentifier(identifier);
                switch (kind){
                    case UIListViewHeaderFooterView.Kind.header:
                        this._styler.initializeHeader(headerFooter, section);
                        break;
                    case UIListViewHeaderFooterView.Kind.footer:
                        this._styler.initializeFooter(headerFooter, section);
                        break;
                }
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

    reloadRowAtIndexPath: function(indexPath){
        this.reloadRowsAtIndexPaths([indexPath]);
    },

    reloadRowsAtIndexPaths: function(indexPaths){
        var visibleCells = this._visibleCellViews;
        if (visibleCells.length === 0){
            return;
        }
        var firstVisibleCell = visibleCells[0];
        var lastVisibleCell = visibleCells[visibleCells.length - 1];
        var indexPath;
        var cell;
        var y;
        var searcher = JSBinarySearcher(visibleCells, function(indexPath_, visibleCell){
            return indexPath_.compare(visibleCell.indexPath);
        });
        for (var i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            if (indexPath.isGreaterThanOrEqual(firstVisibleCell.indexPath) && indexPath.isLessThanOrEqual(lastVisibleCell.indexPath)){
                cell = searcher.itemMatchingValue(indexPath);
                if (cell !== null){
                    y = cell.frame.origin.y;
                    this._enqueueReusableCell(cell);
                    this._createCellAtIndexPath(indexPath, y);
                }
            }
        }
    },

    _hasLoadedOnce: false,
    _cachedData: null,
    _needsReload: false,

    _resetCachedData: function(){
    },

    _reloadDuringLayout: function(){
        // First, remove all visible views so _updateVisibleCells will be forced to load all new cells
        var cell, view;
        var i, l;
        for (i = this._visibleCellViews.length - 1; i >= 0; --i){
            cell = this._visibleCellViews[i];
            this._enqueueReusableCell(cell);
        }
        for (i = this._visibleHeaderViews.length - 1; i >= 0; --i){
            view = this._visibleHeaderViews[i];
            this._enqueueReusableHeaderFooter(view);
        }
        for (i = this._visibleFooterViews.length - 1; i >= 0; --i){
            view = this._visibleFooterViews[i];
            this._enqueueReusableHeaderFooter(view);
        }
        this._visibleCellViews = [];
        this._visibleHeaderViews = [];
        this._visibleFooterViews = [];

        // Cache some of the count and layout data so it only has to be queried once
        this._cachedData = {
            numberOfSections: this._numberOfSections(),
            numberOfRowsBySection: [],
            expectedHeaderYOrigins: [],
        };
        this._resetCachedData();

        // Figure out the content size based on row heights
        // NOTE: For large tables this is much faster if the delegate does NOT use heightForListViewRowAtIndexPath,
        // unless the delegate also uses estimatedHeightForListViewRows
        var numberOfSections = this._cachedData.numberOfSections;
        var numberOfRows = 0;
        var section = 0;
        var y = 0;
        var iterator;
        if (this.delegate && this.delegate.heightForListViewRowAtIndexPath && !this.delegate.estimatedHeightForListViewRows){
            for (section = 0; section < numberOfSections; ++section){
                numberOfRows = this._numberOfRowsInSection(section);
                this._cachedData.numberOfRowsBySection.push(numberOfRows);
                if (numberOfRows > 0){
                    for (iterator = this._indexPathIteratorForSection(section); iterator.indexPath !== null; iterator.increment()){
                        y += this.delegate.heightForListViewRowAtIndexPath(this, iterator.indexPath);
                    }
                }
            }
        }else{
            var rowHeight = this._rowHeight;
            if (this.delegate && this.delegate.estimatedHeightForListViewRows){
                rowHeight = this.delegate.estimatedHeightForListViewRows(this);
            }
            for (section = 0; section < numberOfSections; ++section){
                numberOfRows = this._numberOfRowsInSection(section);
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
        if (this.delegate && (this.delegate.heightForListViewHeaderInSection && !this.delegate.estimatedHeightForListViewHeaders)){
            for (section = 0; section < numberOfSections; ++section){
                y += this.delegate.heightForListViewHeaderInSection(this, section);
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

    _numberOfSections: function(){
        return this.dataSource.numberOfSectionsInListView(this);
    },

    _numberOfRowsInSection: function(section){
        return this.dataSource.numberOfRowsInListViewSection(this, section);
    },

    // --------------------------------------------------------------------
    // MARK: - Inserting and Deleting Rows

    deleteRowAtIndexPath: function(indexPath){
        this.deleteRowsAtIndexPaths([indexPath]);
    },

    deleteRowsAtIndexPaths: function(indexPaths){
        var firstVisibleIndexPath = JSIndexPath(0, 0);
        var lastVisibleIndexPath = JSIndexPath(0, 0);
        if (this._visibleCellViews.length > 0){
            firstVisibleIndexPath = this._visibleCellViews[0].indexPath;
            lastVisibleIndexPath = this._visibleCellViews[this._visibleCellViews.length - 1].indexPath;
        }
        var indexPath;
        var needsUpdate = false;
        var contentOffset = JSPoint(this._contentOffset);
        var contentSize = JSSize(this._contentSize);
        var height;
        var accumulatedHeight = 0;
        var cell;
        var changedSelection = false;
        // Sort the index paths in reverse order so we don't have to adjust
        // for deletions as we go
        indexPaths = JSCopy(indexPaths);
        indexPaths.sort(function(a, b){
            return b.compare(a);
        });
        for (var i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            height = this._heightForCellAtIndexPath(indexPath);
            accumulatedHeight += height;
            contentSize.height -= height;
            this._cachedData.numberOfRowsBySection[indexPath.section] -= 1;
            // TODO: adjust expectedHeaderYOrigins
            if (indexPath.isLessThan(firstVisibleIndexPath)){
                contentOffset.y -= height;
            }else if (indexPath.isLessThanOrEqual(lastVisibleIndexPath)){
                needsUpdate = true;
                this._deleteVisibleCellAtIndexPath(indexPath, height);
            }
            if (this._selectedIndexPaths.contains(indexPath)){
                this._selectedIndexPaths.removeIndexPath(indexPath);
                changedSelection = true;
            }
        }
        var frame = JSRect(this._cellsContainerView.frame);
        frame.size.height -= accumulatedHeight;
        this._cellsContainerView.frame = frame;
        this.contentOffset = contentOffset;
        this.contentSize = contentSize;
        if (needsUpdate){
            this._needsUpdate = true;
            this.setNeedsLayout();
        }
        if (changedSelection){
            if (this.delegate && this.delegate.listViewSelectionDidChange){
                this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
            }
        }
    },

    _deleteVisibleCellAtIndexPath: function(indexPath, height){
        var searcher = JSBinarySearcher(this._visibleCellViews, function(_indexPath, cell){
            return _indexPath.compare(cell.indexPath);
        });
        var i = searcher.indexMatchingValue(indexPath);
        var cell = this._visibleCellViews[i];
        this._visibleCellViews.splice(i, 1);
        this._enqueueReusableCell(cell);
        var other;
        for (var l = this._visibleCellViews.length; i < l; ++i){
            other = this._visibleCellViews[i];
            if (other.indexPath.section == indexPath.section){
                other.indexPath.row -= 1;
            }
            other.position = JSPoint(other.position.x, other.position.y - height);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    headersStickToTop: JSDynamicProperty('_headersStickToTop', false),

    layoutSubviews: function(){
        UIListView.$super.layoutSubviews.call(this);
        var origin = JSPoint.Zero;
        var fitSize = JSSize(this.bounds.size.width, Number.MAX_VALUE);
        // We have to size the header and footer first, so a reloadDuringLayout
        // call, if necessary, will have the proper heights for each for calculating
        // the total content size
        if (this._listHeaderView !== null){
            this._listHeaderView.sizeToFitSize(fitSize);
            // The header can be placed right away since it doesn't depend on the
            // height of anything else
            this._listHeaderView.frame = JSRect(origin, JSSize(fitSize.width, this._listHeaderView.frame.size.height));
            origin.y += this._listHeaderView.frame.size.height;
        }
        if (this._listFooterView !== null){
            this._listFooterView.sizeToFitSize(fitSize);
        }

        // Reloading, if necessary, will set the proper size for this._cellsContainerView,
        // but we need to at least place it in the correct origin before doing a reload,
        // so all of the offset calcuations for showing/hiding cells are correct
        this._cellsContainerView.frame = JSRect(origin.x, origin.y, this.bounds.size.width, this._contentSize.height);

        // Resize the width of all visible views
        var i, l;
        for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
            this._visibleCellViews[i].bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, this._visibleCellViews[i].bounds.size.height);
        }
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            this._visibleHeaderViews[i].bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, this._visibleHeaderViews[i].bounds.size.height);
        }
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            this._visibleFooterViews[i].bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, this._visibleFooterViews[i].bounds.size.height);
        }
        if (this._needsReload){
            this._reloadDuringLayout();
            this._needsReload = false;
        }else if (this._needsUpdate){
            this._updateVisibleCells();
        }else{
            this.contentSize = JSSize(this.bounds.size.width, this._contentSize.height);
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
            this._needsUpdate = true;
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

    _needsUpdate: false,

    _updateVisibleCells: function(){
        this._needsUpdate = false;

        if (!this._cachedData){
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
        var cell = this._visibleCellViews.length > 0 ? this._visibleCellViews[0] : null;
        var header = this._visibleHeaderViews.length > 0 ? this._visibleHeaderViews[0] : null;
        var footer = this._visibleFooterViews.length > 0 ? this._visibleFooterViews[0] : null;

        // Figure out the starting point based on visible views
        var section;
        var start;
        var decrementOnce = false;
        var skipFooter = true;
        var y;
        if (cell){
            // If we have visible cells, start just before the first one
            section = cell.indexPath.section;
            start = cell.indexPath;
            decrementOnce = true;
            y = cell.frame.origin.y;
        }else{
            // If we don't have a visible cell, then it means we only have headers and/or footers.
            // This can happen if a header or footer is taller than our bounds, so it's the only
            // thing showing. Or perhaps if there are sections without cells, we have a few headers
            // and/or footers that run together.
            if ((header && footer && header.section <= footer.section) || (header && !footer)){
                section = header.section - 1;
                start = -1;
                skipFooter = false;
                if (this._headersStickToTop){
                    // Note: in sticky mode we want to still use non-stuck y origin of the header,
                    // but it might be UNKNOWN_Y_ORIGIN, which means we aren't scrolled enough
                    // for anything new anyway, and the loop below will complete without changing anything
                    y = this._cachedData.expectedHeaderYOrigins[header.section];
                }else{
                    y = header.frame.origin.y;
                }
            }else if (footer){
                section = footer.section;
                start = -1;
                y = footer.frame.origin.y;
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
        var iterator;
        for (; section >= 0 && y > rect.origin.y; --section){
            // Footer
            if (!skipFooter){
                height = this._heightForFooterInSection(section);
                if (height > 0){
                    footer = this._createFooterAtSection(section, y, true);
                    if (this._visibleFooterViews.length > 0){
                        this._cellsContainerView.insertSubviewBelowSibling(footer, this._visibleFooterViews[0]);
                    }else if (this._visibleHeaderViews.length > 0){
                        this._cellsContainerView.insertSubviewBelowSibling(footer, this._visibleHeaderViews[0]);
                    }else{
                        this._cellsContainerView.addSubview(footer);
                    }
                    this._visibleFooterViews.unshift(footer);
                }
                y -= height;
            }
            skipFooter = false;

            // Cells
            iterator = this._indexPathIteratorForSection(section, start);
            if (decrementOnce){
                iterator.decrement();
                decrementOnce = false;
            }
            for (; iterator.indexPath !== null && y > rect.origin.y; iterator.decrement()){
                cell = this._createCellAtIndexPath(iterator.indexPath, y, true);
                y = cell.frame.origin.y;
                if (this._visibleCellViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleCellViews[0]);
                }else if (this._visibleFooterViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleFooterViews[0]);
                }else if (this._visibleHeaderViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleHeaderViews[0]);
                }else{
                    this._cellsContainerView.addSubview(cell);
                }
                this._visibleCellViews.unshift(cell);
            }

            // Section header
            if (y > rect.origin.y || this._headersStickToTop){
                height = this._heightForHeaderInSection(section);
                if (height > 0){
                    header = this._createHeaderAtSection(section, iterator.indexPath === null ? y : UNKNOWN_Y_ORIGIN, true);
                    if (this._visibleHeaderViews.length > 0){
                        this._cellsContainerView.insertSubviewBelowSibling(header, this._visibleHeaderViews[0]);
                    }else{
                        this._cellsContainerView.addSubview(header);
                    }
                    this._visibleHeaderViews.unshift(header);
                }
                y -= height;
            }

            start = -1;
        }
    },

    _createViewsForRectAfterLastVisibleView: function(rect){
        var cell = this._visibleCellViews.length > 0 ? this._visibleCellViews[this._visibleCellViews.length - 1] : null;
        var header = this._visibleHeaderViews.length > 0 ? this._visibleHeaderViews[this._visibleHeaderViews.length - 1] : null;
        var footer = this._visibleFooterViews.length > 0 ? this._visibleFooterViews[this._visibleFooterViews.length - 1] : null;

        // Figure out the starting point, based on the visible views
        var section;
        var start;
        var y;
        var iterator;
        var incrementOnce = false;
        var skipHeader = true;
        if (cell){
            // If we have visible cells, we start right after the last one
            section = cell.indexPath.section;
            start = cell.indexPath;
            y = cell.frame.origin.y + cell.frame.size.height;
            incrementOnce = true;
        }else{
            // If we don't have a visible cell, then it means we only have headers and/or footers.
            // This can happen if a header or footer is taller than our bounds, so it's the only
            // thing showing. Or perhaps if there are sections without cells, we have a few headers
            // and/or footers that run together.
            if ((header && footer && header.section > footer.section) || (header && !footer)){
                // If the last visible header is for a later section than the last visible footer,
                // start at the first row of that section
                section = header.section;
                start = 0;
                if (this._headersStickToTop){
                    y = this._cachedData.expectedHeaderYOrigins[header.section];
                }else{
                    y = header.frame.origin.y;
                }
                y += header.frame.size.height;
            }else if (footer){
                // If the last visible item is a footer, start at the beginning
                // of the next section
                section = footer.section + 1;
                start = 0;
                y = footer.frame.origin.y + footer.frame.size.height;
                skipHeader = false;
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
        // or twice, which is why we keep track of which sections have
        // visible headers.
        var height;
        var bottom = rect.origin.y + rect.size.height;
        for (;section < this._cachedData.numberOfSections && y < bottom; ++section){
            // Section header
            if (!skipHeader){
                height = this._heightForHeaderInSection(section);
                if (height > 0){
                    header = this._createHeaderAtSection(section, y);
                    this._cellsContainerView.addSubview(header);
                    this._visibleHeaderViews.push(header);
                }
                y += height;
            }
            skipHeader = false;

            // Section cells
            iterator = this._indexPathIteratorForSection(section, start);
            if (incrementOnce){
                iterator.increment();
                incrementOnce = false;
            }
            for (; iterator.indexPath !== null && y < bottom; iterator.increment()){
                cell = this._createCellAtIndexPath(iterator.indexPath, y);
                y = cell.frame.origin.y + cell.frame.size.height;
                if (this._visibleFooterViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleFooterViews[0]);
                }else if (this._visibleHeaderViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleHeaderViews[0]);
                }else{
                    this._cellsContainerView.addSubview(cell);
                }
                this._visibleCellViews.push(cell);
            }

            // Section footer
            if (y < bottom){
                height = this._heightForFooterInSection(section);
                if (height > 0){
                    footer = this._createFooterAtSection(section, y);
                    if (this._visibleFooterViews.length > 0){
                        this._cellsContainerView.insertSubviewAboveSibling(footer, this._visibleFooterViews[this._visibleFooterViews.length - 1]);
                    }else if (this._visibleHeaderViews.length > 0){
                        this._cellsContainerView.insertSubviewBelowSibling(footer, this._visibleHeaderViews[0]);
                    }else{
                        this._cellsContainerView.addSubview(footer);
                    }
                    this._visibleFooterViews.push(footer);
                }
                y += height;
            }

            start = 0;
        }
    },

    _createViewsForRectUsingTopAsReference: function(rect){
        // No visible rows to key off of, so loop through all rows until we get the first visible one
        // NOTE: optimizations are possible here if we have a constant row height, but generally this loop
        // will only be called when the table first loads and is scrolled to the top, in which case no
        // optimizations are necessary.
        var height;
        var i, l;
        var y = 0;
        var bottom = rect.origin.y + rect.size.height;
        var cell, header, footer;
        var sectionHasHeader = false;
        var sectionHasVisibleHeader = false;
        var section;
        var iterator;
        for (section = 0; section < this._cachedData.numberOfSections && y < bottom; ++section){
            // Section header
            height = this._heightForHeaderInSection(section);
            sectionHasHeader = height > 0;
            sectionHasVisibleHeader = false;
            if (sectionHasHeader && y + height > rect.origin.y){
                sectionHasVisibleHeader = true;
                header = this._createHeaderAtSection(section, y);
                this._visibleHeaderViews.push(header);
            }
            y += height;

            // Section Cells
            for (iterator = this._indexPathIteratorForSection(section, 0); iterator.indexPath !== null && y < bottom; iterator.increment()){
                height = this._heightForCellAtIndexPath(iterator.indexPath);
                if (y + height > rect.origin.y){
                    cell = this._createCellAtIndexPath(iterator.indexPath, y);
                    this._visibleCellViews.push(cell);
                    // If we're using sticky headers, and the section has a header, but it's not
                    // visible because our bounds start in the middle of the section, go ahead
                    // and make the header visible so it can be stuck at the top
                    if (this._headersStickToTop && sectionHasHeader && !sectionHasVisibleHeader){
                        sectionHasVisibleHeader = true;
                        header = this._createHeaderAtSection(section, UNKNOWN_Y_ORIGIN);
                        this._visibleHeaderViews.push(header);
                    }
                }
                y += height;
            }
            // Section footer
            if (y < bottom){
                height = this._heightForFooterInSection(section);
                if (height > 0 && y + height > rect.origin.y){
                    footer = this._createFooterAtSection(section, y);
                    this._visibleFooterViews.push(footer);
                    // If we're using sticky headers, and the section has a header, but it's not
                    // visible because our bounds start in the middle of the section, go ahead
                    // and make the header visible so it can be stuck at the top
                    if (this._headersStickToTop && sectionHasHeader && !sectionHasVisibleHeader){
                        sectionHasVisibleHeader = true;
                        header = this._createHeaderAtSection(section, UNKNOWN_Y_ORIGIN);
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
        indexPath = JSIndexPath(indexPath);
        var cell = this.delegate.cellForListViewAtIndexPath(this, indexPath);
        if (cell === null || cell === undefined){
            throw new Error("Got null/undefined cell for indexPath: %s".sprintf(indexPath));
        }
        cell.listView = this;
        cell.indexPath = indexPath;
        var height = this._heightForCellAtIndexPath(indexPath);
        if (yOffsetByHeight){
            y -= height;
        }
        cell.frame = JSRect(0, y, this._cellsContainerView.bounds.size.width, height);
        cell.active = false;
        this._updateCellState(cell);
        var styler = cell._styler || this._styler;
        styler.updateCell(cell, indexPath);
        cell.setNeedsLayout();
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
        if (yOffsetByHeight && y !== UNKNOWN_Y_ORIGIN){
            y -= height;
        }
        this._cachedData.expectedHeaderYOrigins[section] = y;
        header.frame = JSRect(0, y, this._cellsContainerView.bounds.size.width, height);
        this._styler.updateHeader(header, section);
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
        this._styler.updateFooter(footer, section);
        return footer;
    },

    _heightForHeaderInSection: function(section){
        var height = this._headerHeight;
        if (this.delegate.heightForListViewHeaderInSection){
            height = this.delegate.heightForListViewHeaderInSection(this, section);
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

    becomeFirstResponder: function(){
        this._updateVisibleCellStyles();
    },

    resignFirstResponder: function(){
        this._updateVisibleCellStyles();
    },

    windowDidChangeKeyStatus: function(){
        this._updateVisibleCellStyles();
    },

    keyDown: function(event){
        var hasSelection = this._selectedIndexPaths.start !== null;
        var extend;
        if (hasSelection){
            if (event.key == UIEvent.Key.up){
                extend = (this.allowsMultipleSelection && this._selectionAnchorIndexPath && event.hasModifier(UIEvent.Modifier.shift));
                this.selectPreviousRow(extend);
            }else if (event.key == UIEvent.Key.down){
                extend = (this.allowsMultipleSelection && this._selectionAnchorIndexPath && event.hasModifier(UIEvent.Modifier.shift));
                this.selectNextRow(extend);
            }else if (event.key == UIEvent.Key.enter){
                if (this.delegate && this.delegate.listViewDidOpenCellAtIndexPath){
                    var indexPath = this._selectedIndexPaths.singleIndexPath;
                    if (indexPath !== null){
                        this.delegate.listViewDidOpenCellAtIndexPath(this, indexPath);
                    }
                }
            }else{
                UIListView.$super.keyDown.call(this, event);
            }
        }else{
            UIListView.$super.keyDown.call(this, event);
        }
    },

    keyUp: function(event){
        UIListView.$super.keyUp.call(this, event);
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
        this._selectedIndexPaths.delegate = this;
        this._updateVisibleCellStates();
        if (this.delegate && this.delegate.listViewSelectionDidChange){
            this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
        }
    },

    _selectSingleIndexPath: function(indexPath){
        var existing = this._selectedIndexPaths.singleIndexPath;
        if (existing && indexPath && existing.isEqual(indexPath)){
            return;
        }
        this._selectedIndexPaths.replace(indexPath);
        this._updateVisibleCellStates();
        this._selectionAnchorIndexPath = indexPath;
        if (this.delegate && this.delegate.listViewDidSelectCellAtIndexPath){
            this.delegate.listViewDidSelectCellAtIndexPath(this, indexPath);
        }
        if (this.delegate && this.delegate.listViewSelectionDidChange){
            this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
        }
    },

    addIndexPathToSelection: function(indexPath){
        this._selectedIndexPaths.addIndexPath(indexPath);
        this._updateVisibleCellStates();
        if (this.delegate && this.delegate.listViewSelectionDidChange){
            this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
        }
    },

    removeIndexPathFromSelection: function(indexPath){
        this._selectedIndexPaths.removeIndexPath(indexPath);
        this._updateVisibleCellStates();
        if (this.delegate && this.delegate.listViewSelectionDidChange){
            this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
        }
    },

    indexPathBefore: function(indexPath){
        var section = indexPath.section;
        var iterator = this._indexPathIteratorForSection(section, indexPath);
        iterator.decrement();
        while (section > 0 && iterator.indexPath === null){
            --section;
            iterator = this._indexPathIteratorForSection(section, -1);
        }
        return iterator.indexPath;
    },

    indexPathAfter: function(indexPath){
        var section = indexPath.section;
        var iterator = this._indexPathIteratorForSection(section, indexPath);
        iterator.increment();
        while ((section < this._cachedData.numberOfSections - 1) && iterator.indexPath === null){
            ++section;
            iterator = this._indexPathIteratorForSection(section, 0);
        }
        return iterator.indexPath;
    },

    _indexPathIteratorForSection: function(section, start){
        return new SectionIndexPathIterator(section, this._cachedData.numberOfRowsBySection[section], start);
    },

    _firstIndexPath: function(){
        if (this._cachedData.numberOfSections === 0){
            return null;
        }
        var section = 0;
        var iterator = this._indexPathIteratorForSection(section, 0);
        while ((section < this._cachedData.numberOfSections - 1) && iterator.indexPath === null){
            ++section;
            iterator = this._indexPathIteratorForSection(section, 0);
        }
        return iterator.indexPath;
    },

    _lastIndexPath: function(){
        if (this._cachedData.numberOfSections === 0){
            return null;
        }
        var section = this._cachedData.numberOfSections - 1;
        var iterator = this._indexPathIteratorForSection(section, -1);
        while (section > 0 && iterator.indexPath === null){
            --section;
            iterator = this._indexPathIteratorForSection(section, -1);
        }
        return iterator.indexPath;
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
            this._updateCellState(cell);
        }
    },

    _updateCellState: function(cell){
        // FIXME: don't select unless the cell is allowed to be selected
        // If the selected range(s) cover both selectable and unselectable rows,
        // as might be the case with a cheap select-all, just because an index path
        // is contained in the range(s) doesn't mean it can be selected
        cell.selected = this._selectedIndexPaths.contains(cell.indexPath);
        cell.contextSelected = this._contextSelectedIndexPaths.contains(cell.indexPath);
    },

    _updateVisibleCellStyles: function(){
        var cell;
        var styler;
        for (var i = 0, l = this._visibleCellViews.length; i < l; ++i){
            cell = this._visibleCellViews[i];
            styler = cell._styler || this._styler;
            styler.updateCell(cell, cell.indexPath);
        }
    },

    selectNextRow: function(extendSelection){
        var next;
        var selectionEnd;
        if (extendSelection){
            if (this._selectedIndexPaths.start.isEqual(this._selectionAnchorIndexPath)){
                selectionEnd = this._selectedIndexPaths.end;
            }else{
                selectionEnd = this._selectedIndexPaths.start;
            }
            if (selectionEnd !== null){
                next = this.selectableIndexPathAfter(selectionEnd);
            }
            if (next !== null){
                this._selectedIndexPaths.adjustAnchoredRange(this._selectionAnchorIndexPath, next);
                this._updateVisibleCellStates();
                if (this.delegate && this.delegate.listViewSelectionDidChange){
                    this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
                }
                this.scrollToRowAtIndexPath(next);
            }
        }else{
            selectionEnd = this._selectedIndexPaths.end;
            if (selectionEnd !== null){
                next = this.selectableIndexPathAfter(selectionEnd);
            }
            if (next !== null){
                this._selectSingleIndexPath(next);
                this.scrollToRowAtIndexPath(next);
            }
        }
    },

    selectPreviousRow: function(extendSelection){
        var prev;
        var selectionStart;
        if (extendSelection){
            if (this._selectedIndexPaths.start.isEqual(this._selectionAnchorIndexPath)){
                selectionStart = this._selectedIndexPaths.end;
            }else{
                selectionStart = this._selectedIndexPaths.start;
            }
            if (selectionStart !== null){
                prev = this.selectableIndexPathBefore(selectionStart);
            }
            if (prev !== null){
                this._selectedIndexPaths.adjustAnchoredRange(this._selectionAnchorIndexPath, prev);
                this._updateVisibleCellStates();
                if (this.delegate && this.delegate.listViewSelectionDidChange){
                    this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
                }
                this.scrollToRowAtIndexPath(prev);
            }
        }else{
            selectionStart = this._selectedIndexPaths.start;
            if (selectionStart !== null){
                prev = this.selectableIndexPathBefore(selectionStart);
            }
            if (prev !== null){
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
        var start = this._firstIndexPath();
        var end = this._lastIndexPath();
        if (start !== null && end !== null){
            var allRange = JSIndexPathRange(start, end);
            var allIndexes = JSIndexPathSet(allRange);
            this._selectedIndexPaths = allIndexes;
        }else{
            this._selectedIndexPaths = JSIndexPathSet();
        }
        this._selectedIndexPaths.delegate = this;
        this._updateVisibleCellStates();
        if (this.delegate && this.delegate.listViewSelectionDidChange){
            this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
        }
    },

    selectNone: function(){
        this.setSelectedIndexPaths(JSIndexPathSet());
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
            section = range.start.section;
            if (range.start.section == range.end.section){
                for (row = range.start.row; row <= range.end.row; ++row){
                    handle.call(this, JSIndexPath(section, row));
                }
            }else{
                rowCount = this._cachedData.numberOfRowsBySection[section];
                for (row = range.start.row; row < rowCount; ++row){
                    handle.call(this, JSIndexPath(section, row));
                }
                for (section = section + 1; section < range.end.section; ++section){
                    rowCount = this._cachedData.numberOfRowsBySection[section];
                    for (row = 0; row < rowCount; ++row){
                        handle.call(this, JSIndexPath(section, row));
                    }
                }
                rowCount = this._cachedData.numberOfRowsBySection[section];
                for (row = 0; row <= range.end.row; ++row){
                    handle.call(this, JSIndexPath(section, row));
                }
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Mouse Events

    _activeCell: null,
    _shouldDrag: false,
    _didDrag: false,
    _selectionAnchorIndexPath: null,

    mouseDown: function(event){
        var location = event.locationInView(this);
        var cell = this._cellHitTest(location);
        this.window.firstResponder = this;
        this._activeCell = null;
        if (cell === null){
            this.selectNone();
            return;
        }
        var shouldSelect = !this.delegate || !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
        if (!shouldSelect){
            return;
        }
        cell.active = true;
        this._activeCell = cell;
        this._didDrag = false;
        // command key takes precedence over other modifies, like shift (observed behavior)
        if (event.hasModifier(UIPlatform.shared.commandModifier)){
            this._handledSelectionOnDown = true;
            if (this._selectedIndexPaths.contains(cell.indexPath)){
                this.removeIndexPathFromSelection(cell.indexPath);
                // TODO: set anchor to "nearest" selected cell (could be biased in one direction, even if next selected cell is far)
                this._selectionAnchorIndexPath = null;
            }else if (this.allowsMultipleSelection){
                this.addIndexPathToSelection(cell.indexPath);
                this._selectionAnchorIndexPath = cell.indexPath;
            }else{
                this._selectSingleIndexPath(cell.indexPath);
            }
        }else if (this._selectionAnchorIndexPath !== null && this.allowsMultipleSelection && event.hasModifier(UIEvent.Modifier.shift)){
            this._handledSelectionOnDown = true;
            this._selectedIndexPaths.adjustAnchoredRange(this._selectionAnchorIndexPath, cell.indexPath);
            this._updateVisibleCellStates();
            if (this.delegate && this.delegate.listViewSelectionDidChange){
                this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
            }
        }else{
            this._shouldDrag = this.delegate && this.delegate.listViewShouldDragCellAtIndexPath && this.delegate.listViewShouldDragCellAtIndexPath(this, cell.indexPath);
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
        var location = event.locationInView(this);
        var cell = this._cellHitTest(location);
        if (this._shouldDrag){
            var dragItems = [];
            if (cell !== null){
                var cellItems = [];
                if (this.allowsMultipleSelection && this._selectedIndexPaths.contains(cell.indexPath)){
                    if (this.delegate && this.delegate.pasteboardItemsForListViewAtIndexPath){
                        this.enumerateSelectedIndexPaths(function(indexPath){
                            cellItems = this.delegate.pasteboardItemsForListViewAtIndexPath(this, indexPath);
                            if (cellItems !== null){
                                dragItems = dragItems.concat(cellItems);
                            }
                        });
                    }
                }else{
                    if (this.delegate && this.delegate.pasteboardItemsForListViewAtIndexPath){
                        cellItems = this.delegate.pasteboardItemsForListViewAtIndexPath(this, cell.indexPath);
                        if (cellItems !== null){
                            dragItems = cellItems;
                        }
                    }
                }
            }
            if (dragItems.length > 0){
                this._didDrag = true;
                var session = this.beginDraggingSessionWithItems(dragItems, event);
                if (this.delegate && this.delegate.listViewWillBeginDraggingSession){
                    this.delegate.listViewWillBeginDraggingSession(this, session);
                }
            }
        }else{
            // TODO: scrolling (see UITextEditor for similar use case)
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
                            if (this.delegate && this.delegate.listViewSelectionDidChange){
                                this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
                            }
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
        if (this._didDrag){
            this._didDrag = false;
            return;
        }
        if (this._activeCell === null){
            return;
        }
        var cell = this._activeCell;
        this._activeCell.active = false;
        this._activeCell = null;
        if (event.clickCount == 2){
            if (this.delegate && this.delegate.listViewDidOpenCellAtIndexPath){
                this.delegate.listViewDidOpenCellAtIndexPath(this, cell.indexPath);
            }
        }else{
            var cellFrame = this.contentView.convertRectFromView(cell.bounds, cell);
            if (cellFrame.origin.y < this.contentView.bounds.origin.y){
                this.scrollToRowAtIndexPath(cell.indexPath, UIListView.ScrollPosition.top);
            }else if (cellFrame.origin.y + cellFrame.size.height > this.contentView.bounds.origin.y + this.contentView.bounds.size.height){
                this.scrollToRowAtIndexPath(cell.indexPath, UIListView.ScrollPosition.bottom);
            }
            if (this._handledSelectionOnDown){
                this._handledSelectionOnDown = false;
                if (this.delegate && this.delegate.listViewDidFinishSelectingCellAtIndexPath){
                    this.delegate.listViewDidFinishSelectingCellAtIndexPath(this, cell.indexPath);
                }
                return;
            }
            var shouldSelect = !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
            if (shouldSelect){
                this._selectSingleIndexPath(cell.indexPath);
                if (this.delegate && this.delegate.listViewDidFinishSelectingCellAtIndexPath){
                    this.delegate.listViewDidFinishSelectingCellAtIndexPath(this, cell.indexPath);
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

    cellAtIndexPath: function(indexPath){
        var searcher = JSBinarySearcher(this._visibleCellViews, function(_indexPath, cell){
            return _indexPath.compare(cell.indexPath);
        });
        return searcher.itemMatchingValue(indexPath);
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
        var rect = JSRect(cell.frame);
        rect.origin.y += rect.size.height;
        var section = cell.indexPath.section;
        var iterator;
        var start = cell.indexPath;
        while (section > targetIndexPath.section){
            for (iterator = this._indexPathIteratorForSection(section, start); iterator.indexPath !== null; iterator.decrement()){
                rect.size.height = this._heightForCellAtIndexPath(iterator.indexPath);
                rect.origin.y -= rect.size.height;
            }
            rect.size.height = this._heightForHeaderInSection(section);
            rect.origin.y -= rect.size.height;
            section -= 1;
            rect.size.height = this._heightForFooterInSection(section);
            rect.origin.y -= rect.size.height;
            start = -1;
        }
        
        for (iterator = this._indexPathIteratorForSection(targetIndexPath.section, -1); iterator.indexPath != null && iterator.indexPath.isGreaterThanOrEqual(targetIndexPath); iterator.decrement()){
            rect.size.height = this._heightForCellAtIndexPath(iterator.indexPath);
            rect.origin.y -= rect.size.height;
        }
        return this.convertRectFromView(rect, this._cellsContainerView);
    },

    _rectForCellAtIndexPathAfterVisibleCell: function(targetIndexPath, cell){
        // Start at last visible cell and iterate down to target indexPath to get new rect
        // - Faster than starting all the way at the top
        // - Fastest when scrolling one row, like when using the down arrow key
        var rect = JSRect(cell.frame);
        var iterator;
        var start = cell.indexPath;
        var section = cell.indexPath.section;
        while (section < targetIndexPath.section){
            for (iterator = this._indexPathIteratorForSection(section, start); iterator.indexPath != null; iterator.increment()){
                rect.origin.y += rect.size.height;
                rect.size.height = this._heightForCellAtIndexPath(iterator.indexPath);
            }
            rect.origin.y += rect.size.height;
            rect.size.height = this._heightForFooterInSection(section);
            section += 1;
            rect.origin.y += rect.size.height;
            rect.size.height = this._heightForHeaderInSection(section);
            start = 0;
        }
        for (iterator = this._indexPathIteratorForSection(targetIndexPath.section, 0); iterator.indexPath != null && iterator.indexPath.isLessThanOrEqual(targetIndexPath); iterator.increment()){
            rect.origin.y += rect.size.height;
            rect.size.height = this._heightForCellAtIndexPath(iterator.indexPath);
        }
        return this.convertRectFromView(rect, this._cellsContainerView);
    },

    _rectForVisibleCellAtIndexPath: function(indexPath){
        var cell = this.cellAtIndexPath(indexPath);
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

var UNKNOWN_Y_ORIGIN = -1;

UIListView.ViewType = {
    none: 0,
    cell: 1,
    header: 2,
    footer: 3
};

UIListView.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIListView_getDefaultStyler(){
            var styler = UIListViewDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIListView_setDefaultStyler(defaultStyler){
            Object.defineProperty(this, 'default', {writable: true, value: defaultStyler});
        }
    }
});

UIListView.ScrollPosition = UIScrollView.ScrollPosition;

JSClass("UIListViewStyler", JSObject, {

    init: function(){
    },

    initializeListView: function(listView){
    },

    initializeCell: function(cell, indexPath){
    },

    initializeHeader: function(header, section){
    },

    initializeFooter: function(footer, section){
    },

    updateCell: function(cell, indexPath){
    },

    layoutCell: function(cell){
    },

    updateHeader: function(header, section){
    },

    updateFooter: function(footer, section){
    }

});

JSClass("UIListViewDefaultStyler", UIListViewStyler, {

    cellFont: null,
    cellDetailFont: null,
    cellTextColor: null,
    cellDetailTextColor: null,
    cellSeparatorColor: null,
    selectedCellTextColor: null,
    selectedCellDetailTextColor: null,
    selectedCellBackgroundColor: null,
    selectedCellSeparatorColor: null,
    mutedSelectedCellTextColor: null,
    mutedSelectedCellDetailTextColor: null,
    mutedSelectedCellBackgroundColor: null,
    mutedSelectedCellSeparatorColor: null,
    contextSelectedCellBorderColor: null,
    cellBackgroundColor: null,
    separatorInsets: null,
    imageSize: null,
    accessorySize: null,
    accessoryColor: null,
    showSeparators: true,

    headerTextColor: null,
    headerBackgroundColor: null,
    headerBorderColor: null,

    indentSize: 20,

    init: function(){
        this._commonStylerInit();
    },

    initWithSpec: function(spec, values){
        UIListViewDefaultStyler.$super.initWithSpec.call(this, spec, values);
        if ('cellTextColor' in values){
            this.cellTextColor = spec.resolvedValue(values.cellTextColor, "JSColor");
        }
        if ('cellDetailTextColor' in values){
            this.cellDetailTextColor = spec.resolvedValue(values.cellDetailTextColor, "JSColor");
        }
        if ('cellSeparatorColor' in values){
            this.cellSeparatorColor = spec.resolvedValue(values.cellSeparatorColor, "JSColor");
        }
        if ('selectedCellTextColor' in values){
            this.selectedCellTextColor = spec.resolvedValue(values.selectedCellTextColor, "JSColor");
        }
        if ('selectedCellDetailTextColor' in values){
            this.selectedCellDetailTextColor = spec.resolvedValue(values.selectedCellDetailTextColor, "JSColor");
        }
        if ('selectedCellBackgroundColor' in values){
            this.selectedCellBackgroundColor = spec.resolvedValue(values.selectedCellBackgroundColor, "JSColor");
        }
        if ('mutedSelectedCellTextColor' in values){
            this.mutedSelectedCellTextColor = spec.resolvedValue(values.mutedSelectedCellTextColor, "JSColor");
        }
        if ('mutedSelectedCellDetailTextColor' in values){
            this.mutedSelectedCellDetailTextColor = spec.resolvedValue(values.mutedSelectedCellDetailTextColor, "JSColor");
        }
        if ('mutedSelectedCellBackgroundColor' in values){
            this.mutedSelectedCellBackgroundColor = spec.resolvedValue(values.mutedSelectedCellBackgroundColor, "JSColor");
        }
        if ('mutedSelectedCellSeparatorColor' in values){
            this.mutedSelectedCellSeparatorColor = spec.resolvedValue(values.mutedSelectedCellSeparatorColor, "JSColor");
        }
        if ('headerTextColor' in values){
            this.headerTextColor = spec.resolvedValue(values.headerTextColor, "JSColor");
        }
        if ('headerBackgroundColor' in values){
            this.headerBackgroundColor = spec.resolvedValue(values.headerBackgroundColor, "JSColor");
        }
        if ('headerBorderColor' in values){
            this.headerBorderColor = spec.resolvedValue(values.headerBorderColor, "JSColor");
        }
        if ('cellFont' in values){
            this.cellFont = spec.resolvedValue(values.cellFont, "JSFont");
        }
        if ('cellDetailFont' in values){
            this.cellDetailFont = spec.resolvedValue(values.cellDetailFont, "JSFont");
        }
        if ('separatorInsets' in values){
            this.separatorInsets = JSInsets.apply(undefined, values.separatorInsets.parseNumberArray());
        }
        if ('imageSize' in values){
            this.imageSize = JSSize.apply(undefined, values.imageSize.parseNumberArray());
        }
        if ('accessorySize' in values){
            this.accessorySize = JSSize.apply(undefined, values.accessorySize.parseNumberArray());
        }
        if ('accessoryColor' in values){
            this.accessoryColor = spec.resolvedValue(values.accessoryColor, "JSColor");
        }
        if ('showSeparators' in values){
            this.showSeparators = spec.resolvedValue(values.showSeparators);
        }
        this._commonStylerInit();
    },

    _commonStylerInit: function(){
        if (this.cellFont === null){
            this.cellFont = JSFont.systemFontOfSize(JSFont.Size.normal);
        }
        if (this.cellTextColor === null){
            this.cellTextColor = JSColor.blackColor;
        }
        if (this.cellDetailTextColor === null){
            this.cellDetailTextColor = this.cellTextColor.colorLightenedByPercentage(0.6);
        }
        if (this.cellDetailFont === null && this.cellFont !== null){
            this.cellDetailFont = this.cellFont.fontWithPointSize(Math.round(this.cellFont.pointSize * 12.0 / 14.0));
        }
        if (this.selectedCellBackgroundColor === null){
            this.selectedCellBackgroundColor = JSColor.initWithRGBA(70/255, 153/255, 254/255, 1);
        }
        if (this.contextSelectedCellBorderColor === null){
            this.contextSelectedCellBorderColor = this.selectedCellBackgroundColor.colorDarkenedByPercentage(0.5);
        }
        if (this.headerTextColor === null){
            this.headerTextColor = JSColor.blackColor;
        }
        if (this.cellSeparatorColor === null){
            this.cellSeparatorColor = this.cellTextColor.colorWithAlpha(0.2);
        }
        if (this.accessoryColor === null){
            this.accessoryColor = this.cellTextColor;
        }
        if (this.selectedCellTextColor === null){
            this.selectedCellTextColor = JSColor.whiteColor;
        }
        if (this.selectedCellDetailTextColor === null){
            this.selectedCellDetailTextColor = this.selectedCellTextColor;
        }
        if (this.selectedCellSeparatorColor === null){
            this.selectedCellSeparatorColor = this.selectedCellBackgroundColor.colorLightenedByPercentage(0.2);
        }
        if (this.mutedSelectedCellTextColor === null){
            this.mutedSelectedCellTextColor = this.cellTextColor;
        }
        if (this.mutedSelectedCellDetailTextColor === null){
            this.mutedSelectedCellDetailTextColor = this.cellDetailTextColor;
        }
        if (this.mutedSelectedCellBackgroundColor === null){
            this.mutedSelectedCellBackgroundColor = this.cellSeparatorColor;
        }
        if (this.mutedSelectedCellSeparatorColor === null){
            this.mutedSelectedCellSeparatorColor = this.mutedSelectedCellBackgroundColor.colorLightenedByPercentage(0.2);
        }
    },

    initializeCell: function(cell, indexPath){
        if (this.showSeparators){
            cell.stylerProperties.separatorLayer = UILayer.init();
            cell.layer.addSublayer(cell.stylerProperties.separatorLayer);
        }
    },

    updateCell: function(cell, indexPath){
        if (cell.contextSelected){
            cell.contentView.borderWidth = 2.0;
            cell.contentView.borderColor = this.selectedCellBackgroundColor;
        }else{
            cell.contentView.borderWidth = 0;
        }
        if (cell._titleLabel !== null){
            cell._titleLabel.font = this.cellFont;
        }
        if (cell._detailLabel !== null){
            cell._detailLabel.font = this.cellDetailFont;
        }
        if (cell.selected){
            var muted = !cell.listView.window.isKeyWindow || cell.listView.window.firstResponder !== cell.listView;
            cell.contentView.borderColor = this.contextSelectedCellBorderColor;
            if (muted){
                cell.contentView.backgroundColor = this.mutedSelectedCellBackgroundColor;
                if (cell._titleLabel !== null){
                    cell._titleLabel.textColor = this.mutedSelectedCellTextColor;
                }
                if (cell._detailLabel !== null){
                    cell._detailLabel.textColor = this.mutedSelectedCellDetailTextColor;
                }
                if (cell._imageView !== null){
                    cell._imageView.templateColor = this.mutedSelectedCellTextColor;
                }
                if (cell._accessoryView !== null && cell._accessoryView.isKindOfClass(UIImageView)){
                    cell._accessoryView.templateColor = this.accessoryColor;
                }
                if (cell.stylerProperties.separatorLayer){
                    cell.stylerProperties.separatorLayer.backgroundColor = this.mutedSelectedCellSeparatorColor;
                }
            }else{
                cell.contentView.backgroundColor = this.selectedCellBackgroundColor;
                if (cell._titleLabel !== null){
                    cell._titleLabel.textColor = this.selectedCellTextColor;
                }
                if (cell._detailLabel !== null){
                    cell._detailLabel.textColor = this.selectedCellDetailTextColor;
                }
                if (cell._imageView !== null){
                    cell._imageView.templateColor = this.selectedCellTextColor;
                }
                if (cell._accessoryView !== null && cell._accessoryView.isKindOfClass(UIImageView)){
                    cell._accessoryView.templateColor = this.selectedCellTextColor;
                }
                if (cell.stylerProperties.separatorLayer){
                    cell.stylerProperties.separatorLayer.backgroundColor = this.selectedCellSeparatorColor;
                }
            }
        }else{
            cell.contentView.backgroundColor = this.cellBackgroundColor;
            if (cell._titleLabel !== null){
                cell._titleLabel.textColor = this.cellTextColor;
            }
            if (cell._detailLabel !== null){
                cell._detailLabel.textColor = this.cellDetailTextColor;
            }
            if (cell._imageView !== null){
                cell._imageView.templateColor = this.cellTextColor;
            }
            if (cell._accessoryView !== null && cell._accessoryView.isKindOfClass(UIImageView)){
                cell._accessoryView.templateColor = this.accessoryColor;
            }
            if (cell.stylerProperties.separatorLayer){
                cell.stylerProperties.separatorLayer.backgroundColor = this.cellSeparatorColor;
            }
        }
        if (cell.stylerProperties.separatorLayer){
            cell.stylerProperties.separatorLayer.hidden = indexPath.length == 2 && indexPath.row === 0;
        }
    },

    _indentationForCell: function(cell){
        return 0;
    },

    layoutCell: function(cell){
        cell._contentView.frame = cell.bounds;
        var size = JSSize(cell.bounds.size.width - cell._titleInsets.left - cell._titleInsets.right, 0);
        var origin = JSPoint(cell._titleInsets.left, 0);
        var indent = this._indentationForCell(cell);
        origin.x += indent;
        size.width -= indent;
        if (cell._imageView !== null && cell._imageView.image !== null){
            var imageSize = this.imageSize;
            if (imageSize === null){
                var imageHeight = cell._contentView.bounds.size.height - cell._titleInsets.left * 2;
                imageSize = JSSize(imageHeight, imageHeight);
            }
            cell._imageView.frame = JSRect(origin.x, (cell._contentView.bounds.size.height - imageSize.height) / 2, imageSize.width, imageSize.height);
            origin.x += cell._titleSpacing + imageSize.width;
            size.width -= imageSize.width + cell._titleSpacing;
        }
        if (cell._accessoryView !== null){
            var accessorySize = this.accessorySize;
            if (accessorySize === null){
                accessorySize = cell._accessoryView.intrinsicSize;
            }
            cell._accessoryView.frame = JSRect(cell.bounds.size.width - accessorySize.width, (cell._contentView.bounds.size.height - accessorySize.height) / 2, accessorySize.width, accessorySize.height);
            size.width -= accessorySize.width;
        }
        if (cell._titleLabel !== null){
            if (cell._detailLabel !== null){
                size.height = cell._titleLabel.font.displayLineHeight * (cell._titleLabel.maximumNumberOfLines || 1) + cell._detailLabel.font.displayLineHeight * (cell._detailLabel.maximumNumberOfLines || 1);
                origin.y =  Math.floor((cell.bounds.size.height - size.height) / 2.0);
                size.height = cell._titleLabel.font.displayLineHeight * (cell._titleLabel.maximumNumberOfLines || 1);
                cell._titleLabel.frame = JSRect(origin, size);
                origin.y += size.height;
                size.height = cell._detailLabel.font.displayLineHeight * (cell._detailLabel.maximumNumberOfLines || 1);
                cell._detailLabel.frame = JSRect(origin, size);
            }else{
                size.height = cell._titleLabel.font.displayLineHeight * (cell._titleLabel.maximumNumberOfLines || 1);
                origin.y =  Math.floor((cell.bounds.size.height - size.height) / 2.0);
                cell._titleLabel.frame = JSRect(origin, size);
            }
        }else if (cell._detailLabel !== null){
            size.height = cell._detailLabel.font.displayLineHeight * (cell._detailLabel.maximumNumberOfLines || 1);
            cell._detailLabel.frame = JSRect(JSPoint(cell._titleInsets.left, Math.floor((cell.bounds.size.height - size.height) / 2.0)), size);
        }

        var separatorInsets = cell._separatorInsets;
        if (separatorInsets === null){
            separatorInsets = this.separatorInsets;
        }
        if (separatorInsets === null){
            separatorInsets = cell._titleInsets;
        }
        var separatorSize = 1;
        if (cell.stylerProperties.separatorLayer){
            cell.stylerProperties.separatorLayer.frame = JSRect(separatorInsets.left, 0, cell.bounds.size.width - separatorInsets.left, separatorSize);
        }
    },

    updateHeader: function(header, section){
        if (header._titleLabel !== null){
            header._titleLabel.textColor = this.headerTextColor;
        }
        header.backgroundColor = this.headerBackgroundColor;
        if (this.headerBorderColor){
            header.borderWidth = 1;
            header.borderColor = this.headerBorderColor;
            header.maskedBorders = UILayer.Sides.maxY;
        }
    },

    updateFooter: function(footer, section){
        if (footer._titleLabel !== null){
            footer._titleLabel.textColor = this.headerTextColor;
        }
    }

});

var SectionIndexPathIterator = function(section, numberOfRows, start){
    if (this === undefined){
        return new SectionIndexPathIterator(section, numberOfRows, start);
    }
    this.section = section;
    this.numberOfRows = numberOfRows;
    if (this.numberOfRows === 0){
        this.indexPath = null;
    }else if (typeof(start) === "number"){
        this.indexPath = JSIndexPath(section, (numberOfRows + start) % numberOfRows);
    }else if (start instanceof JSIndexPath){
        this.indexPath = JSIndexPath(start);
    }else{
        this.indexPath = JSIndexPath(section, 0);
    }
};

SectionIndexPathIterator.prototype = {

    increment: function(){
        if (this.indexPath !== null){
            if (this.indexPath.row < this.numberOfRows - 1){
                this.indexPath.row += 1;
            }else{
                this.indexPath = null;
            }
        }
    },

    decrement: function(){
        if (this.indexPath !== null){
            if (this.indexPath.row > 0){
                this.indexPath.row -= 1;
            }else{
                this.indexPath = null;
            }
        }
    }
};

})();