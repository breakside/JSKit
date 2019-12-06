// #import "UIScrollView.js"
// #import "UIEvent.js"
// #import "UIPlatform.js"
// #import "UIImageView.js"
// #import "UIViewPropertyAnimator.js"
/* global JSClass, JSObject, JSCopy, JSInsets, JSFont, JSColor, UILayer, UIView, UIImageView, UIScrollView, UIPlatform, JSProtocol, JSReadOnlyProperty, JSDynamicProperty, UIListView, JSSize, JSIndexPath, JSRect, UIEvent, JSIndexPathSet, JSIndexPathRange, JSBinarySearcher, JSPoint, UIListViewHeaderFooterView, UIListViewStyler, UIListViewDefaultStyler, UIViewPropertyAnimator, UIListViewCell */
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

    __numberOfSections: 0,
    _approximateRowHeight: 0,
    _approximateHeaderHeight: 0,
    _approximateFooterHeight: 0,
    _exactHeightMinY: 0,
    _exactHeightMaxY: 0,

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

    reloadRowsAtIndexPaths: function(indexPaths, animator){
        var visibleCells = this._visibleCellViews;
        var visibleHeaders = this._visibleHeaderViews;
        var visibleFooters = this._visibleFooterViews;
        if (visibleCells.length === 0){
            return;
        }
        indexPaths = JSCopy(indexPaths);
        indexPaths.sort(function(a, b){
            return a.compare(b);
        });
        var firstVisibleCell = visibleCells[0];
        var lastVisibleCell = visibleCells[visibleCells.length - 1];
        var indexPath;
        var cellIndex;
        var cell;
        var y;
        var visibleCellOffsets = [];
        var visibleHeaderOffsets = [];
        var visibleFooterOffsets = [];
        var i, l, j, k;
        var diff;
        var viewsDidMove = false;
        var numberOfSections = this.__numberOfSections;
        for (i = 0, l = visibleCells.length; i < l; ++i){
            visibleCellOffsets[i] = JSPoint(0, 0);
        }
        for (i = 0, l = visibleHeaders.length; i < l; ++i){
            visibleHeaderOffsets[i] = JSPoint(0, 0);
        }
        for (i = 0, l = visibleFooters.length; i < l; ++i){
            visibleFooterOffsets[i] = JSPoint(0, 0);
        }
        var searcher = JSBinarySearcher(visibleCells, function(indexPath_, visibleCell){
            return indexPath_.compare(visibleCell.indexPath);
        });
        for (i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            if (indexPath.isGreaterThanOrEqual(firstVisibleCell.indexPath) && indexPath.isLessThanOrEqual(lastVisibleCell.indexPath)){
                cellIndex = searcher.indexMatchingValue(indexPath);
                if (cellIndex !== null){
                    cell = visibleCells[cellIndex];
                    y = cell.position.y - cell.anchorPoint.y * cell.bounds.size.height;
                    this._enqueueReusableCell(cell);
                    cell = this._createCellAtIndexPath(indexPath, y);
                    diff = cell.bounds.size.height - visibleCells[cellIndex].bounds.size.height;
                    if (cell !== visibleCells[cellIndex]){
                        this._cellsContainerView.insertSubviewBelowSibling(cell, visibleCells[cellIndex]);
                        visibleCells[cellIndex].removeFromSuperview();
                        visibleCells.splice(cellIndex, 1, cell);
                    }
                    if (diff !== 0){
                        for (j = cellIndex + 1, k = visibleCellOffsets.length; j < k; ++j){
                            visibleCellOffsets[j] += diff;
                            viewsDidMove = true;
                        }
                        for (j = 0, k = visibleHeaders.length; j < k; ++j){
                            if (visibleHeaders[j].section > indexPath.section){
                                visibleHeaderOffsets[j] += diff;
                                viewsDidMove = true;
                            }
                        }
                        for (j = 0, k = visibleFooters.length; j < k; ++j){
                            if (visibleFooters[j].section >= indexPath.section){
                                visibleFooterOffsets[j] += diff;
                                viewsDidMove = true;
                            }
                        }
                    }
                }
            }
        }
        if (animator && viewsDidMove){
            var listView = this;
            animator.addAnimations(function(){
                var i, l;
                var view;
                var offset;
                for (i = 0, l = visibleCells.length; i < l; ++i){
                    view = visibleCells[i];
                    offset = visibleCellOffsets[i];
                    view.position = view.position.add(offset);
                }
                for (i = 0, l = visibleHeaders.length; i < l; ++i){
                    view = visibleHeaders[i];
                    offset = visibleHeaderOffsets[i];
                    view.expectedPosition = view.expectedPosition.add(offset);
                    view.position = JSPoint(view.expectedPosition);
                }
                for (i = 0, l = visibleFooters.length; i < l; ++i){
                    view = visibleFooters[i];
                    offset = visibleFooterOffsets[i];
                    view.position = view.position.add(offset);
                }
                if (listView._headersStickToTop){
                    listView._layoutStickyHeaders();
                }
            });
        }
    },

    _hasLoadedOnce: false,
    _needsReload: false,

    _reloadDuringLayout: function(){
        // First, remove all visible views so _layoutVisibleViews will be forced to load all new cells
        var i, l;
        for (i = this._visibleCellViews.length - 1; i >= 0; --i){
            this._enqueueReusableCell(this._visibleCellViews[i]);
        }
        for (i = this._visibleHeaderViews.length - 1; i >= 0; --i){
            this._enqueueReusableHeaderFooter(this._visibleHeaderViews[i]);
        }
        for (i = this._visibleFooterViews.length - 1; i >= 0; --i){
            this._enqueueReusableHeaderFooter(this._visibleFooterViews[i]);
        }
        this._visibleCellViews = [];
        this._visibleHeaderViews = [];
        this._visibleFooterViews = [];

        // Cache some of the count and layout data so it only has to be queried once
        this._approximateRowHeight = this._rowHeight;
        this._approximateHeaderHeight = this._headerHeight;
        this._approximateFooterHeight = this._footerHeight;
        if (this.delegate && this.delegate.estimatedHeightForListViewRows){
            this._approximateRowHeight = this.delegate.estimatedHeightForListViewRows(this);
        }
        if (this.delegate && this.delegate.estimatedHeightForListViewHeaders){
            this._approximateHeaderHeight = this.delegate.estimatedHeightForListViewHeaders(this);
        }
        if (this.delegate && this.delegate.estimatedHeightForListViewFooters){
            this._approximateFooterHeight = this.delegate.estimatedHeightForListViewFooters(this);
        }

        this.__numberOfSections = this._numberOfSections();

        // Caclulate the approximate content size
        var contentSize = this._approximateContentSize();
        this._setContentSize(contentSize);
        this._exactHeightMinY = 0;
        this._exactHeightMaxY = 0;

        // Finally, update the visible cells
        // NOTE: setting this.contentSize *may* trigger _didScroll and/or layerDidChangeSize,
        // each of which would ordinarily call _layoutVisibleViews themselves.  Since we don't know
        // if either will be called, and since we only want to update once, those functions are configured
        // to NOT call _layoutVisibleViews while reloading.  Therefore, we need to make the call ourself.
        this._layoutVisibleViews();

        this._hasLoadedOnce = true;
    },

    _setContentSize: function(contentSize){
        var cellsSize = JSSize(contentSize);
        if (this._listHeaderView !== null){
            cellsSize.height -= this._listHeaderView.bounds.size.height;
        }
        if (this._listFooterView !== null){
            cellsSize.height -= this._listHeaderView.bounds.size.height;
        }
        this._cellsContainerView.bounds = JSRect(JSPoint.Zero, cellsSize);
        var position = JSPoint(cellsSize.width * this._cellsContainerView.anchorPoint.x, cellsSize.height * this._cellsContainerView.anchorPoint.y);
        if (this._listHeaderView !== null){
            position.y += this._listHeaderView.bounds.size.height;
        }
        this._cellsContainerView.position = position;
        this.contentSize = contentSize;
    },

    _approximateContentSize: function(){
        var height = 0;
        for (var section = 0; section < this.__numberOfSections; ++section){
            height += this._approximateHeightForSection(section);
        }
        // If we have a list header and/or footer, those heights go into the overall content size,
        // even though these views are not placed within the cells container view
        if (this._listHeaderView !== null){
            height += this._listHeaderView.bounds.size.height;
        }
        if (this._listFooterView !== null){
            height += this._listFooterView.bounds.size.height;
        }
        return JSSize(this._contentView.bounds.size.width, height);
    },

    _approximateHeightForSection: function(section, stopRow){
        var height = this._approximateYForSectionFooter(section);
        if (this.delegate && this.delegate.heightForListViewFooterInSection && !this.delegate.estimatedHeightForListViewFooters){
            height = this.delegate.heightForListViewFooterInSection(section);
        }else{
            height += this._approximateFooterHeight;
        }
        return height;
    },

    _approximateYForSection: function(section){
        var y = 0;
        for (var i = 0; i < section; ++i){
            y += this._approximateHeightForSection(i);
        }
        return y;
    },

    _approximateYForSectionFooter: function(section){
        var numberOfRows = this._numberOfRowsInSection(section);
        return this._approximateYForSectionRow(section, numberOfRows);
    },

    _approximateYForSectionRow: function(section, row){
        var y = 0;
        if (this.delegate && this.delegate.heightForListViewHeaderInSection && !this.delegate.estimatedHeightForListViewHeaders){
            y += this.delegate.heightForListViewHeaderInSection(this, section);
        }else{
            y += this._approximateHeaderHeight;
        }
        if (this.delegate && this.delegate.heightForListViewRowAtIndexPath && !this.delegate.estimatedHeightForListViewRows){
            for (var iterator = this._indexPathIteratorForSection(section), i = 0; iterator.indexPath !== null && i < row; iterator.increment(), ++row){
                y += this.delegate.heightForListViewRowAtIndexPath(this, iterator.indexPath);
            }
        }else{
            y += row * this._approximateRowHeight;
        }
        return y;
    },

    _numberOfSections: function(){
        return this.dataSource.numberOfSectionsInListView(this);
    },

    _numberOfRowsInSection: function(section){
        return this.dataSource.numberOfRowsInListViewSection(this, section);
    },

    // --------------------------------------------------------------------
    // MARK: - Inserting and Deleting Rows

    _edit: null,

    editAnimationDuration: 1.0/6,

    _beginEditIfNeeded: function(animation){
        if (this._edit === null){
            this._edit = {
                animator: null,
                cells: [],
                headers: [],
                footers: [],
                insertedSections: [],
                insertedIndexPaths: [],
            };
            var i, l;
            for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
                this._edit.cells.push({deleted: false, translate: JSPoint.Zero, animation: UIListView.RowAnimation.none, indexPath: JSIndexPath(this._visibleCellViews[i].indexPath)});
            }
            for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
                this._edit.headers.push({deleted: false, translate: JSPoint.Zero, animation: UIListView.RowAnimation.none, section: this._visibleHeaderViews[i].section});
            }
            for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
                this._edit.footers.push({deleted: false, translate: JSPoint.Zero, animation: UIListView.RowAnimation.none, indexPath: this._visibleFooterViews[i].section});
            }
            this._needsUpdate = true;
            this.setNeedsLayout();
        }
        if (animation != UIListView.RowAnimation.none && this._edit.animator === null){
            this._edit.animator = UIViewPropertyAnimator.initWithDuration(this.editAnimationDuration);
        }
    },

    insertRowAtIndexPath: function(indexPath, animation){
        this.insertRowsAtIndexPaths([indexPath], animation);
    },

    insertRowsAtIndexPaths: function(indexPaths, animation){
        if (animation === undefined || animation == UIListView.RowAnimation.default){
            animation = UIListView.RowAnimation.push;
        }
        this._beginEditIfNeeded(animation);
        for (var i = 0, l = indexPaths.length; i < l; ++i){
            this._edit.insertedIndexPaths.push({indexPath: indexPaths[i], animation: animation});
        }
    },

    deleteRowAtIndexPath: function(indexPath, animation){
        this.deleteRowsAtIndexPaths([indexPath], animation);
    },

    deleteRowsAtIndexPaths: function(indexPaths, animation){
        if (animation === undefined || animation == UIListView.RowAnimation.default){
            animation = UIListView.RowAnimation.left;
        }
        this._beginEditIfNeeded(animation);
        var cellIndex = 0;
        var cellCount = this._visibleCellViews.length;
        indexPaths = JSCopy(indexPaths);
        indexPaths.sort(JSIndexPath.compare);
        var indexPath;
        var parent;
        var i, l;
        var j;
        for (i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            parent = indexPath.removingLastIndex();
            while (cellIndex < cellCount && this._visibleCellViews[cellIndex].indexPath.isLessThan(indexPath)){
                ++cellIndex;
            }
            if (cellIndex < cellCount && indexPath.isEqual(this._visibleCellViews[cellIndex].indexPath)){
                this._edit.cells[cellIndex].deleted = true;
                this._edit.cells[cellIndex].animation = animation;
                ++cellIndex;
            }
            for (j = cellIndex; j < cellCount && this._visibleCellViews[j].indexPath.length > parent.length && this._visibleCellViews[j].indexPath.startsWith(parent); ++j){
                this._edit.cells[j].indexPath[parent.length] -= 1;
            }
        }
    },

    insertSection: function(section, animation){
        this._beginEditIfNeeded(animation);
    },

    insertSections: function(sections, animation){
        if (animation === undefined || animation == UIListView.RowAnimation.default){
            animation = UIListView.RowAnimation.push;
        }
        this._beginEditIfNeeded(animation);
        for (var i = 0, l = sections.length; i < l; ++i){
            this._edit.insertedSections.push({section: sections[i], animation: animation});
        }
        this.__numberOfSections += sections.length;
    },

    deleteSection: function(section, animation){
        this.deleteSections([section], animation);
    },

    deleteSections: function(sections, animation){
        if (animation === undefined || animation == UIListView.RowAnimation.default){
            animation = UIListView.RowAnimation.left;
        }
        this._beginEditIfNeeded(animation);
        sections = JSCopy(sections);
        sections.sort();
        var headerIndexesBySection = {};
        var footerIndexesBySection = {};
        var i, l;
        var j;
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            headerIndexesBySection[this._visibleHeaderViews[i].section] = i;
        }
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            footerIndexesBySection[this._visibleFooterViews[i].section] = i;
        }
        var section;
        var cellIndex;
        var headerIndex;
        var footerIndex;
        var cellCount = this._visibleCellViews.length;
        for (i = 0, l = sections.length; i < l; ++i){
            section = sections[i];
            headerIndex = headerIndexesBySection[section];
            if (headerIndex !== undefined){
                this._edit.headers[headerIndex].deleted = true;
                this._edit.headers[headerIndex].animation = animation;
            }
            footerIndex = footerIndexesBySection[section];
            if (footerIndex !== undefined){
                this._edit.footers[footerIndex].deleted = true;
                this._edit.footers[headerIndex].animation = animation;
            }
            while (cellIndex < cellCount && this._visibleCellViews[cellIndex].indexPath.section < section){
                ++cellIndex;
            }
            while (cellIndex < cellCount && section == this._visibleCellViews[cellIndex].indexPath.section){
                this._edit.cells[cellIndex].deleted = true;
                this._edit.cells[cellIndex].animation = animation;
                ++cellIndex;
            }
            for (j = cellIndex; j < cellCount && this._visibleCellViews[j].indexPath.section > section; ++j){
                this._edit.cells[j].indexPath.section -= 1;
            }
        }
        this.__numberOfSections -= sections.length;
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
            this._listHeaderView.bounds = JSRect(0, 0, fitSize.width, this._listHeaderView.bounds.size.height);
            this._listHeaderView.position = JSPoint(this._listHeaderView.bounds.size.width * this._listHeaderView.anchorPoint.x, origin.y + this._listHeaderView.bounds.size.height * this._listHeaderView.anchorPoint.y);
            origin.y += this._listHeaderView.bounds.size.height;
        }
        if (this._listFooterView !== null){
            this._listFooterView.sizeToFitSize(fitSize);
        }

        // Reloading, if necessary, will set the proper size for this._cellsContainerView,
        // but we need to at least place it in the correct origin before doing a reload,
        // so all of the offset calcuations for showing/hiding cells are correct
        this._cellsContainerView.position = JSPoint(this._cellsContainerView.bounds.size.width * this._cellsContainerView.anchorPoint.x, origin.y + this._cellsContainerView.bounds.size.height * this._cellsContainerView.anchorPoint.y);

        // Resize the width of all visible views
        var i, l;
        for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
            this._visibleCellViews[i].bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, this._visibleCellViews[i].bounds.size.height);
        }
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            this._visibleHeaderViews[i].bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, this._visibleHeaderViews[i].bounds.size.height);
            this._visibleHeaderViews[i].expectedPosition = JSPoint(this._visibleHeaderViews[i].position.x, this._visibleHeaderViews[i].expectedPosition.y);
        }
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            this._visibleFooterViews[i].bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, this._visibleFooterViews[i].bounds.size.height);
        }
        if (this._needsReload){
            this._reloadDuringLayout();
            this._needsReload = false;
        }else if (this._needsUpdate){
            this._layoutVisibleViews();
        }else{
            this.contentSize = JSSize(this.bounds.size.width, this._contentSize.height);
        }

        // Only add the height offset from cellsContainerView after a possible reload, because
        // the reload adjusts this height
        origin.y += this._cellsContainerView.bounds.size.height;

        // Finally, we can place the footer
        if (this._listFooterView !== null){
            this._listFooterView.bounds = JSRect(0, 0, fitSize.width, this._listFooterView.bounds.size.height);
            this._listHeaderView.position = JSPoint(this._listFooterView.bounds.size.width * this._listFooterView.anchorPoint.x, origin.y + this._listHeaderView.bounds.size.height * this._listHeaderView.anchorPoint.y);
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
            y = header.expectedPosition.y - header.anchorPoint.y * header.bounds.size.height;
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
        if (!this._needsReload && this._cellsContainerView !== null){
            this._layoutVisibleViews();
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
    _isUpdating: false,

    _layoutVisibleViews: function(){
        if (this._isUpdating){
            return;
        }
        this._needsUpdate = false;
        this._isUpdating = true;

        if (this._edit !== null){
            this._layoutVisibleViewsForEdit(this._edit);
            this._edit = null;
        }else{
            this._layoutVisibleViewsNormal();
        }

        this._isUpdating = false;
    },

    _layoutVisibleViewsNormal: function(){
        var visibleRect = this.contentView.convertRectToView(this.contentView.bounds, this._cellsContainerView);

        // 1. Layout sticky headers first so the enqueue logic doesn't throw away any header that we still want to show
        if (this._headersStickToTop){
            this._layoutStickyHeaders();
        }
        
        // 2. Enqueue reusable views before creating new views, so the enqueued views can be dequeued during the create step
        this._enqueueReusableViewsOutsideOfRect(visibleRect);

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

    _layoutVisibleViewsForEdit: function(edit){
        // 1. Prepare the edit
        edit.insertedSections.sort(function(a, b){
            return a.section - b.section;
        });
        edit.insertedIndexPaths.sort(function(a, b){
            return a.indexPath.compare(b.indexPath);
        });

        // 2. Update index paths of visible views
        this._updateVisibleIndexPathsForEdit(edit);

        // 3. Order deleted views at bottom of visible views
        var viewIndex = 0;
        var i, l;
        for (i = 0, l = edit.cells.length; i < l; ++i){
            if (edit.cells[i].deleted){
                this._cellsContainerView.insertSubviewAtIndex(this._visibleCellViews[i], viewIndex);
                ++viewIndex;
            }
        }
        for (i = 0, l = edit.footers.length; i < l; ++i){
            if (edit.footers[i].deleted){
                this._cellsContainerView.insertSubviewAtIndex(this._visibleFooterViews[i], viewIndex);
                ++viewIndex;
            }
        }
        for (i = 0, l = edit.headers.length; i < l; ++i){
            if (edit.headers[i].deleted){
                this._cellsContainerView.insertSubviewAtIndex(this._visibleHeaderViews[i], viewIndex);
                ++viewIndex;
            }
        }

        // 4. Fill in inserted views & create newly visible views
        var result = this._createViewsForEdit(edit);
        var editingViews = result.editingViews;
        this._exactHeightMinY = result.exactHeightMinY;
        this._exactHeightMaxY = result.exactHeightMaxY;

        // 5. Animate changes
        var listView = this;
        var animations = function(){
            listView._setContentSize(result.contentSize);
            listView.contentOffset = result.contentOffset;

            var i, l;
            var j;
            var info;
            var y = result.finalY0;
            var deleteY = y;
            for (i = 0, l = editingViews.length; i < l; ++i){
                info = editingViews[i];
                if (!info.deleted){
                    // views stack, starting from the finalY0 point
                    info.view.position = JSPoint(info.view.bounds.size.width / 2.0, y + info.view.anchorPoint.y * info.view.bounds.size.height);
                    y += info.view.bounds.size.height;
                    if (!info.inserted){
                        deleteY = y;
                    }
                }else{
                    // deleted views move differently depending on the requested
                    // animation, but generally are related in some way to the
                    // non-deleted view preceding them
                    if (info.animation == UIListView.RowAnimation.push){
                        info.view.position = JSPoint(info.view.position.x, deleteY - info.view.bounds.size.height * (1 - info.view.anchorPoint.y));
                        for (j = i - 1; j >= 0 && editingViews[j].deleted && editingViews[j].animation == info.animation; --j){
                            editingViews[j].view.position = JSPoint(editingViews[j].view.position.x, editingViews[j].view.position.y - info.view.bounds.size.height);
                        }
                    }else if (info.animation == UIListView.RowAnimation.fold){
                        info.view.position = JSPoint(info.view.position.x, deleteY - info.view.bounds.size.height * (1 - info.view.anchorPoint.y));
                        info.view.alpha = 0;
                    }else if (info.animation == UIListView.RowAnimation.left){
                        info.view.position = JSPoint(info.view.position.x - info.view.bounds.size.width, deleteY + info.view.bounds.size.height * info.view.anchorPoint.y);
                        info.view.alpha = 0;
                        deleteY += info.view.bounds.size.height;
                    }else if (info.animation == UIListView.RowAnimation.right){
                        info.view.position = JSPoint(info.view.position.x + info.view.bounds.size.width, y + info.view.bounds.size.height * info.view.anchorPoint.y);
                        info.view.alpha = 0;
                        deleteY += info.view.bounds.size.height;
                    }else{ // RowAnimation.cover, RowAnimation.none
                        info.view.position = JSPoint(info.view.position.x, deleteY + info.view.bounds.size.height * info.view.anchorPoint.y);
                        deleteY += info.view.bounds.size.height;
                    }
                }
            }
            for (i = 0, l = listView._visibleHeaderViews.length; i < l; ++i){
                listView._visibleHeaderViews[i].expectedPosition = JSPoint(listView._visibleHeaderViews[i].position);
            }
            if (listView._headersStickToTop){
                listView._layoutStickyHeaders();
            }
        };

        // 6. Cleanup after animation completes
        var completion = function(){
            var i, l;
            var info;
            // enqueue deleted views
            for (i = 0, l = editingViews.length; i < l; ++i){
                info = editingViews[i];
                if (info.deleted){
                    if (info.view.isKindOfClass(UIListViewCell)){
                        listView._enqueueReusableCell(info.view);
                    }else{
                        listView._enqueueReusableHeaderFooter(info.view);
                    }
                }
            }

            // enqueue invisible views
            var visibleRect = listView.contentView.convertRectToView(listView.contentView.bounds, listView._cellsContainerView);
            listView._enqueueReusableViewsOutsideOfRect(visibleRect);

            // remove all queued views from superview
            listView._removeQueuedCells();
            listView._removeQueuedHeaderFooters();

            // order visible views in proper positions
            var viewIndex = 0;
            for (i = 0, l = listView._visibleCellViews.length; i < l; ++i, ++viewIndex){
                listView._cellsContainerView.insertSubviewAtIndex(listView._visibleCellViews[i], viewIndex);
            }
            for (i = 0, l = listView._visibleFooterViews.length; i < l; ++i, ++viewIndex){
                listView._cellsContainerView.insertSubviewAtIndex(listView._visibleFooterViews[i], viewIndex);
            }
            for (i = 0, l = listView._visibleHeaderViews.length; i < l; ++i, ++viewIndex){
                listView._cellsContainerView.insertSubviewAtIndex(listView._visibleHeaderViews[i], viewIndex);
            }
        };

        var animator = edit.animator;
        if (animator){
            animator.addAnimations(animations);
            animator.addCompletion(completion);
            animator.start();
        }else{
            animations();
            completion();
        }
    },

    _createViewsForEdit: function(edit){
        // Prepare a private y-sorted list of visible views, including those that are
        // being deleted.
        // Remove any deleted views from this._visible* arrays
        var editingViews = [];
        var i, l;
        var cell, header, footer;
        var info;
        var deletedHeight = 0;
        for (i = edit.cells.length - 1; i >= 0; --i){
            info = edit.cells[i];
            cell = this._visibleCellViews[i];
            editingViews.push({
                view: cell,
                deleted: info.deleted,
                animation: info.animation
            });
            if (info.deleted){
                this._visibleCellViews.splice(i, 1);
                deletedHeight += cell.bounds.size.height;
            }
        }
        for (i = edit.headers.length - 1; i >= 0; --i){
            info = edit.headers[i];
            header = this._visibleHeaderViews[i];
            header.position = JSPoint(header.expectedPosition);
            editingViews.push({
                view: header,
                deleted: info.deleted,
                animation: info.animation
            });
            if (info.deleted){
                this._visibleHeaderViews.splice(i, 1);
                deletedHeight += header.bounds.size.height;
            }
        }
        for (i = edit.footers.length - 1; i >= 0; --i){
            info = edit.footers[i];
            footer = this._visibleFooterViews[i];
            editingViews.push({
                view: footer,
                deleted: info.deleted,
                animation: info.animation
            });
            if (info.deleted){
                this._visibleFooterViews.splice(i, 1);
                deletedHeight += footer.bounds.size.height;
            }
        }
        editingViews.sort(function(a, b){
            return a.view.position.y - b.view.position.y;
        });


        var preEdit = {
            contentSize: JSSize(this.contentSize),
            contentOffset: JSPoint(this.contentOffset),
            y0: 0,
            y: 0,
            exactHeightMinY: this.exactHeightMinY,
            exactHeightMaxY: this.exactHeightMaxY
        };

        var postEdit = {
            contentSize: this._approximateContentSize(),
            contentOffset: JSPoint(this.contentOffset),
            y0: 0,
            y: 0,
            exactHeightMinY: 0,
            exactHeightMaxY: 0
        };
        
        var visibleHeaderIndex = 0;
        var visibleFooterIndex = 0;
        var visibleCellIndex = 0;
        var editingViewIndex = 0;

        var section;
        var start;
        var startIsVisible = false;
        if (editingViews.length > 0){
            // Figure out how much our views will shift during the edit
            // (basically, the amount of height that was removed above)
            cell = this._visibleCellViews.length > 0 ? this._visibleCellViews[0] : null;
            header = this._visibleHeaderViews.length > 0 ? this._visibleHeaderViews[0] : null;
            footer = this._visibleFooterViews.length > 0 ? this._visibleFooterViews[0] : null;
            if (cell){
                var row = this._sectionRowForIndexPath(cell.indexPath);
                section = cell.indexPath.section;
                start = JSIndexPath(cell.indexPath);
                startIsVisible = true;
                preEdit.y = cell.position.y - cell.anchorPoint.y * cell.bounds.size.height;
                postEdit.y = this._approximateYForSection(cell.indexPath.section);
                postEdit.y += this._approximateYForSectionRow(cell.indexPath.section, row);
                for (; visibleHeaderIndex < this._visibleHeaderViews.length && this._visibleHeaderViews[visibleHeaderIndex].section <= cell.indexPath.section; ++visibleHeaderIndex){
                }
                for (; visibleFooterIndex < this._visibleFooterViews.length && this._visibleFooterViews[visibleFooterIndex].section < cell.indexPath.section; ++visibleFooterIndex){
                }
                for (; editingViewIndex < editingViews.length && editingViews[editingViewIndex].view !== cell; ++editingViewIndex){
                }
            }else if (footer){
                preEdit.y = footer.position.y - footer.anchorPoint.y * footer.bounds.size.height;
                postEdit.y = this._approximateYForSection(footer.section);
                postEdit.y += this._approximateYForSectionFooter(footer.section);
                section = footer.section;
                start = -1;
                for (; visibleHeaderIndex < this._visibleHeaderViews.length && this._visibleHeaderViews[visibleHeaderIndex].section <= footer.section; ++visibleHeaderIndex){
                }
                for (; editingViewIndex < editingViews.length && editingViews[editingViewIndex].view !== footer; ++editingViewIndex){
                }
            }else if (header){
                preEdit.y = header.position.y - header.anchorPoint.y * header.bounds.size.height;
                postEdit.y = this._approximateYForSection(header.section);
                section = header.section - 1;
                start = -1;
                for (; editingViewIndex < editingViews.length && editingViews[editingViewIndex].view !== header; ++editingViewIndex){
                }
            }else{
                // All visible views are deleted, so there's nothing to act as an anchor.
                // Use the content offset insetad (see below)
                preEdit.y = 0;
                postEdit.y = 0;
            }

            // Adjust the content size & offset
            // 1. If at the top, stay at the top
            // 2. Otherwise, try to keep the first remaining view in place
            // 3. But keep the scrolling withing limits
            var minOffsetY = -this._contentInsets.top;
            var maxOffsetY = Math.max(minOffsetY, postEdit.contentSize.height + this._contentInsets.bottom - this._contentView.bounds.size.height);
            if (postEdit.contentOffset.y > minOffsetY){
                postEdit.contentOffset.y += (postEdit.y - preEdit.y);
            }
            if (postEdit.contentOffset.y < minOffsetY){
                postEdit.contentOffset.y = minOffsetY;
            }else if (postEdit.contentOffset.y > maxOffsetY){
                postEdit.contentOffset.y = maxOffsetY;
            }
        }else{
            // no existing views
            // - Must be at min scroll position
            // - any new views must be newly inserted
            section = 0;
            start = 0;
        }

        postEdit.exactHeightMinY = postEdit.y;
        postEdit.exactHeightMaxY = postEdit.y;
        var iterator;
        var height;

        // If we don't have an anchor view, use the content offset to figure out
        // where to start
        if (start === undefined){
            section = 0;
            start = null;
            for (; section < this.__numberOfSections; ++section){
                height = this._heightForHeaderInSection(section);
                if (postEdit.y + height > postEdit.contentOffset.y){
                    start = 0;
                    break;
                }
                postEdit.y += height;
                if (postEdit.y > postEdit.exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                    postEdit.exactHeightMaxY = postEdit.y;
                }
                iterator = this._indexPathIteratorForSection(section, 0);
                for (; iterator.indexPath !== null; iterator.increment()){
                    height = this._heightForCellAtIndexPath(iterator.indexPath);
                    if (postEdit.y + height > postEdit.contentOffset.y){
                        start = JSIndexPath(iterator.indexPath);
                        break;
                    }
                    postEdit.y += height;
                    if (postEdit.y > postEdit.exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                        postEdit.exactHeightMaxY = postEdit.y;
                    }
                }
                if (start !== null){
                    break;
                }
                height = this._heightForFooterInSection(section);
                if (postEdit.y + height > postEdit.contentOffset.y){
                    startIsVisible = true;
                    start = -1;
                    break;
                }
                postEdit.y += height;
                if (postEdit.y > postEdit.exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                    postEdit.exactHeightMaxY = postEdit.y;
                }
            }
        }

        preEdit.y0 = preEdit.y;
        postEdit.y0 = postEdit.y;

        var deletedHeightAtTop = 0;
        for (i = 0, l = editingViews.length; i < l && editingViews[i].deleted; ++i){
            deletedHeightAtTop += editingViews[i].view.bounds.size.height;
        }

        var insertedSectionIndex = 0;
        var insertedIndexPathIndex = 0;

        // Create views before the first view
        var result;
        result = this._createViewsBefore(section, start, startIsVisible, preEdit.y, preEdit.y - (postEdit.y - postEdit.contentOffset.y), preEdit.exactHeightMinY, function(view){
            editingViews.unshift({
                view: view,
                added: true
            });
            view.position = JSPoint(view.position.x, view.position.y - deletedHeightAtTop);
            ++editingViewIndex;
            if (view.isKindOfClass(UIListViewCell)){
                ++visibleCellIndex;
            }else if (view.isKindOfClass(UIListViewHeaderFooterView)){
                if (view.kind === UIListViewHeaderFooterView.Kind.header){
                    ++visibleHeaderIndex;
                }else if (view.kind === UIListViewHeaderFooterView.Kind.footer){
                    ++visibleFooterIndex;
                }
            }
        });

        postEdit.contentSize.height += result.yDiff;
        postEdit.contentOffset.y += result.yDiff;
        postEdit.exactHeightMinY += result.yDiff;
        postEdit.exactHeightMaxY += result.yDiff;
        postEdit.y += result.yDiff;
        postEdit.y0 -= (preEdit.y0 - result.y);
        postEdit.y0 += result.yDiff;
        postEdit.exactHeightMinY = postEdit.y0;
        // preEdit.y += result.yDiff;
        preEdit.y0 = result.y;

        var isInsertedSection = false;
        var isInsertedRow = false;

        // TODO: Figure out if any newly created views were inserted as part of the edit,
        // and adjust positions to pre-animation positions
        // for (i = 0; i < editingViewIndex; ++i){
        //     info = editingViews[i];
        //     if (info.view.isKindOfClass(UIListViewCell)){
        //     }else if (info.view.isKindOfClass(UIListViewHeaderFooterView)){
        //         if (info.view.kind === UIListViewHeaderFooterView.Kind.header){
        //             while (insertedSectionIndex < edit.insertedSections.length && edit.insertSections[i].section < info.view.section){
        //                 ++insertedSectionIndex;
        //             }
        //             isInsertedSection = insertedSectionIndex < edit.insertedSections.length && edit.insertSections[i].section === info.view.section;
        //         }else if (info.view.kind === UIListViewHeaderFooterView.Kind.footer){
        //             while (insertedSectionIndex < edit.insertedSections.length && edit.insertSections[i].section < info.view.section){
        //                 ++insertedSectionIndex;
        //             }
        //             isInsertedSection = insertedSectionIndex < edit.insertedSections.length && edit.insertSections[i].section === info.view.section;
        //         }
        //     }
        // }

        // Create views after the first view
        var yMax = postEdit.contentOffset.y + this.contentView.bounds.size.height + deletedHeight;
        var sectionInserted;
        var rowInserted;
        var animation;
        for (; section < this.__numberOfSections && postEdit.y < yMax; ++section){
            iterator = this._indexPathIteratorForSection(section, start);
            start = 0;
            while (insertedSectionIndex < edit.insertedSections.length && edit.insertedSections[insertedSectionIndex].section < info.view.section){
                ++insertedSectionIndex;
            }
            isInsertedSection = insertedSectionIndex < edit.insertedSections.length && edit.insertedSections[insertedSectionIndex].section === info.view.section;
            if (isInsertedSection){
                animation = edit.insertedSections[insertedSectionIndex].animation;
                ++insertedSectionIndex;
            }
            height = this._heightForHeaderInSection(section);
            if (height > 0){
                if (visibleHeaderIndex < this._visibleHeaderViews.length && this._visibleHeaderViews[visibleHeaderIndex].section === section){
                    // header is already showing
                    header = this._visibleHeaderViews[visibleHeaderIndex++];
                    preEdit.y = header.position.y + (1 - header.anchorPoint.y) * header.bounds.size.height;
                    postEdit.y += height;
                    ++editingViewIndex;
                }else{
                    header = this._createHeaderAtSection(section, preEdit.y, height);
                    if (isInsertedSection){
                        yMax -= height;
                        // TODO: position horizontally for insert if needed
                    }else{
                        preEdit.y += height;
                    }
                    postEdit.y += height;
                    if (visibleHeaderIndex < this._visibleHeaderViews.length){
                        this._cellsContainerView.insertSubviewAboveSibling(header, this._visibleHeaderViews[visibleHeaderIndex]);
                        this._visibleHeaderViews.splice(visibleHeaderIndex, 0, header);
                        ++visibleHeaderIndex;
                    }else{
                        this._cellsContainerView.addSubview(header);
                        this._visibleHeaderViews.push(header);
                    }
                    editingViews.splice(editingViewIndex++, 0, {view: header});
                }
                if (postEdit.y > postEdit.exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                    postEdit.exactHeightMaxY = postEdit.y;
                }
            }
            while (editingViewIndex < editingViews.length && editingViews[editingViewIndex].deleted){
                preEdit.y += editingViews[editingViewIndex].view.bounds.size.height;
                ++editingViewIndex;
            }
            for (; iterator.indexPath !== null && postEdit.y < yMax; iterator.increment()){
                if (visibleCellIndex < this._visibleCellViews.length && this._visibleCellViews[visibleCellIndex].indexPath.isEqual(iterator.indexPath)){
                    // cell is already showing
                    cell = this._visibleCellViews[visibleCellIndex++];
                    preEdit.y = cell.position.y + (1 - cell.anchorPoint.y) * cell.bounds.size.height;
                    postEdit.y += cell.bounds.size.height;
                    ++editingViewIndex;
                }else{
                    if (!isInsertedSection){
                        while (insertedIndexPathIndex < edit.insertedIndexPaths.length && edit.insertedIndexPaths[i].indexPath.isLessThan(iterator.indexPath)){
                            ++insertedIndexPathIndex;
                        }
                        isInsertedRow = insertedIndexPathIndex < edit.insertedIndexPaths.length && edit.insertedIndexPaths[insertedIndexPathIndex].indexPath.isEqual(iterator.indexPath);
                        if (isInsertedRow){
                            animation = edit.insertedIndexPaths[insertedIndexPathIndex].animation;
                            ++insertedIndexPathIndex;
                        }
                    }else{
                        isInsertedRow = true;
                    }
                    cell = this._createCellAtIndexPath(iterator.indexPath, preEdit.y);
                    postEdit.y += cell.bounds.size.height;
                    if (isInsertedRow){
                        // TODO: position horizontally for insert
                        yMax -= cell.bounds.size.height;
                    }else{
                        preEdit.y += cell.bounds.size.height;
                    }
                    if (visibleCellIndex < this._visibleCellViews.length){
                        this._cellsContainerView.insertSubviewAboveSibling(cell, this._visibleCellViews[visibleCellIndex]);
                    }else if (this._visibleFooterViews.length > 0){
                        this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleFooterViews[0]);
                    }else if (this._visibleHeaderViews.length > 0){
                        this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleHeaderViews[0]);
                    }else{
                        this._cellsContainerView.addSubview(cell);
                    }
                    this._visibleCellViews.splice(visibleCellIndex++, 0, cell);
                    editingViews.splice(editingViewIndex++, 0, {view: cell});
                }
                if (postEdit.y > postEdit.exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                    postEdit.exactHeightMaxY = postEdit.y;
                }
                while (editingViewIndex < editingViews.length && editingViews[editingViewIndex].deleted){
                    preEdit.y += editingViews[editingViewIndex].view.bounds.size.height;
                    ++editingViewIndex;
                }
            }
            if (postEdit.y < yMax){
                height = this._heightForFooterInSection(section);
                if (height > 0){
                    if (visibleFooterIndex < this._visibleFooterViews.length && this._visibleFooterViews[visibleFooterIndex].section === section){
                        // footer is already showing
                        footer = this._visibleFooterViews[visibleFooterIndex++];
                        preEdit.y = footer.position.y + (1 - footer.anchorPoint.y) * footer.bounds.size.height;
                        postEdit.y += height;
                        ++editingViewIndex;
                    }else{
                        if (isInsertedSection){
                            yMax -= height;
                        }else{
                            preEdit.y += height;
                        }
                        postEdit.y += height;
                        footer = this._createFooterAtSection(section, preEdit.y, height);
                        if (visibleFooterIndex < this._visibleFooterViews.length){
                            this._cellsContainerView.insertSubviewAboveSibling(footer, this._visibleFooterViews[visibleFooterIndex]);
                            this._visibleFooterViews.splice(visibleFooterIndex, 0, footer);
                            ++visibleFooterIndex;
                        }else{
                            this._cellsContainerView.addSubview(footer);
                            this._visibleFooterViews.push(footer);
                        }
                        editingViews.splice(editingViewIndex++, 0, {view: footer});
                    }
                    if (postEdit.y > postEdit.exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                        postEdit.exactHeightMaxY = postEdit.y;
                    }
                    while (editingViewIndex < editingViews.length && editingViews[editingViewIndex].deleted){
                        preEdit.y += editingViews[editingViewIndex].view.bounds.size.height;
                        ++editingViewIndex;
                    }
                }
            }
        }

        return {
            contentSize: postEdit.contentSize,
            contentOffset: postEdit.contentOffset,
            editingViews: editingViews,
            finalY0: postEdit.y0,
            exactHeightMinY: postEdit.exactHeightMinY,
            exactHeightMaxY: postEdit.exactHeightMaxY
        };
    },

    _adjustEditViewPositionsForInserts: function(editingViews){
        if (editingViews.length === 0){
            return;
        }
        var i, l;
        var j;
        var info = editingViews[0];
        var y = info.view.position.y - info.view.anchorPoint.y * info.view.bounds.size.height;
        var insertY = y;
        for (i = 0, l = editingViews.length; i < l; ++i){
            info = editingViews[i];
            if (info.inserted){
                if (info.animation == UIListView.RowAnimation.push){
                    info.view.position = JSPoint(info.view.position.x, insertY - info.view.bounds.size.height * (1 - info.view.anchorPoint.y));
                    for (j = i - 1; j >= 0 && editingViews[j].deleted && editingViews[j].animation == info.animation; --j){
                        editingViews[j].view.position = JSPoint(editingViews[j].view.position.x, editingViews[j].view.position.y - info.view.bounds.size.height);
                    }
                }else if (info.animation == UIListView.RowAnimation.fold){
                    info.view.position = JSPoint(info.view.position.x, insertY - info.view.bounds.size.height * (1 - info.view.anchorPoint.y));
                    info.view.alpha = 0;
                }else if (info.animation == UIListView.RowAnimation.left){
                    info.view.position = JSPoint(info.view.position.x - info.view.bounds.size.width, insertY + info.view.bounds.size.height * info.view.anchorPoint.y);
                    info.view.alpha = 0;
                    insertY += info.view.bounds.size.height;
                }else if (info.animation == UIListView.RowAnimation.right){
                    info.view.position = JSPoint(info.view.position.x + info.view.bounds.size.width, y + info.view.bounds.size.height * info.view.anchorPoint.y);
                    info.view.alpha = 0;
                    insertY += info.view.bounds.size.height;
                }else{ // RowAnimation.cover, RowAnimation.none
                    info.view.position = JSPoint(info.view.position.x, insertY + info.view.bounds.size.height * info.view.anchorPoint.y);
                    insertY += info.view.bounds.size.height;
                }
                for (j = i - 1; j >= 0; --j){
                    if (editingViews[j].added){
                    }
                }
            }
        }
    },

    _updateVisibleIndexPathsForEdit: function(edit){
        // account for inserted sections
        var cellIndex = 0;
        var cellCount = edit.cells.length;
        var headerIndex = 0;
        var headerCount = edit.headers.length;
        var footerIndex = 0;
        var footerCount = edit.footers.length;
        var i, l;
        var j;
        var section;
        for (i = 0, l = edit.insertedSections.length; i < l; ++i){
            section = edit.insertedSections[i];
            while (cellIndex < cellCount && (edit.cells[i].deleted || edit.cells[cellIndex].indexPath.section <= section)){
                ++cellIndex;
            }
            while (headerIndex < headerCount && (edit.headers[i].deleted || edit.headers[headerIndex].section <= section)){
                ++headerIndex;
            }
            while (footerIndex < footerCount && (edit.footers[i].deleted || edit.footers[footerIndex].section <= section)){
                ++footerIndex;
            }
            for (j = cellIndex; j < cellCount; ++j){
                edit.cells[j].indexPath.section += 1;
            }
            for (j = headerIndex; j < headerCount; ++j){
                edit.headers[j].section += 1;
            }
            for (j = footerIndex; j < footerCount; ++j){
                edit.footers[j].section += 1;
            }
        }

        // account for inserted index paths
        cellIndex = 0;
        var indexPath;
        var parent;
        var info;
        for (i = 0, l = edit.insertedIndexPaths.length; i < l; ++i){
            info = edit.insertedIndexPaths[i];
            parent = info.indexPath.removingLastIndex();
            while (cellIndex < cellCount && (edit.cells[cellIndex].deleted || edit.cells[cellIndex].indexPath.isLessThan(info.indexPath))){
                ++cellIndex;
            }
            for (j = cellIndex; j < cellCount && edit.cells[j].indexPath.length > parent.length && edit.cells[j].indexPath.startsWith(parent); ++j){
                edit.cells[j].indexPath[parent.length] += 1;
            }
        }

        // Update cells, headers, and footers
        for (i = 0, l = edit.cells.length; i < l; ++i){
            if (!edit.cells[i].deleted){
                this._visibleCellViews[i].indexPath = JSIndexPath(edit.cells[i].indexPath);
            }
        }
        for (i = 0, l = edit.headers.length; i < l; ++i){
            if (!edit.headers[i].deleted){
                this._visibleHeaderViews[i].section = edit.headers[i].section;
            }
        }
        for (i = 0, l = edit.footers.length; i < l; ++i){
            if (!edit.footers[i].deleted){
                this._visibleFooterViews[i].section = edit.footers[i].section;
            }
        }
    },

    _enqueueReusableViewsOutsideOfRect: function(rect){
        this._enqueueViewsOutsideOfRect(this._visibleCellViews, rect, this._enqueueReusableCell);
        this._enqueueViewsOutsideOfRect(this._visibleHeaderViews, rect, this._enqueueReusableHeaderFooter);
        this._enqueueViewsOutsideOfRect(this._visibleFooterViews, rect, this._enqueueReusableHeaderFooter);
    },

    _enqueueViewsOutsideOfRect: function(views, rect, enqueueMethod){
        var bottom = rect.origin.y + rect.size.height;
        var i, l;
        var view;

        // Anything that has scrolled off the bottom
        for (i = views.length - 1; i >= 0; --i){
            view = views[i];
            if (view.position.y - view.anchorPoint.y * view.bounds.size.height >= bottom){
                enqueueMethod.call(this, view);
                views.pop();
            }else{
                break;
            }
        }

        // Anything that has scrolled off the top
        for (i = 0, l = views.length; i < l; ++i){
            view = views[i];
            if (view.position.y + (1 - view.anchorPoint.y) * view.bounds.size.height <= rect.origin.y){
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
        var y;
        if (cell){
            // If we have visible cells, start just before the first one
            section = cell.indexPath.section;
            start = cell.indexPath;
            decrementOnce = true;
            y = cell.position.y - cell.anchorPoint.y * cell.bounds.size.height;
        }else{
            // If we don't have a visible cell, then it means we only have headers and/or footers.
            // This can happen if a header or footer is taller than our bounds, so it's the only
            // thing showing. Or perhaps if there are sections without cells, we have a few headers
            // and/or footers that run together.
            if ((header && footer && header.section <= footer.section) || (header && !footer)){
                section = header.section - 1;
                start = -1;
                y = header.expectedPosition.y - header.anchorPoint.y * header.bounds.size.height;
            }else if (footer){
                section = footer.section;
                start = -1;
                y = footer.position.y - footer.anchorPoint.y * footer.bounds.size.header;
            }else{
                // No visible cell, header, or footer...we shouldn't be called
                // if this is the state of things, so this block should never
                // run.  If it does run, there's nothing we can do, so just return.
                return;
            }
        }

        var result = this._createViewsBefore(section, start, decrementOnce, y, rect.origin.y, this._exactHeightMinY);
        y = result.y;
        if (y < this._exactHeightMinY){
            this._exactHeightMinY = y;
        }

        var yDiff = result.yDiff;
        var i, l;
        if (yDiff !== 0){
            var contentSize = JSSize(this._contentSize);
            var contentOffset = JSPoint(this._contentOffset);
            contentSize.height += yDiff;
            contentOffset.y += yDiff;
            this._exactHeightMaxY += yDiff;
            for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
                header = this._visibleHeaderViews[i];
                header.expectedPosition = JSPoint(header.expectedPosition.x, header.expectedPosition.y + yDiff);
                header.position = JSPoint(header.expectedPosition);
            }
            for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
                footer = this._visibleFooterViews[i];
                footer.position = JSPoint(footer.position.x, footer.position.y + yDiff);
            }
            for (i = 0, l = this._visibleCellViews.length; i < l; ++i){
                cell = this._visibleCellViews[i];
                cell.position = JSPoint(cell.position.x, cell.position.y + yDiff);
            }
            if (yDiff < 0){
                this.contentOffset = contentOffset;
                this._setContentSize(contentSize);
            }else{
                this._setContentSize(contentSize);
                this.contentOffset = contentOffset;
            }
        }
    },

    _createViewsBefore: function(section, start, decrementOnce, y, yMin, exactHeightMinY, callback){
        var visibleHeadersBySection = {};
        var visibleFootersBySection = {};
        var i, l;
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            visibleHeadersBySection[this._visibleHeaderViews[i].section] = this._visibleHeaderViews[i];
        }
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            visibleFootersBySection[this._visibleFooterViews[i].section] = this._visibleFooterViews[i];
        }

        // Loop backward and fill in any cells, headers, and footers that have
        // come on screen.  Note that since the loop is based off of cell index
        // path iteration, we need to be careful to NOT insert the same header
        // or footer twice, which is why we keep track of which sections have
        // visible headers and footers.
        var cell, header, footer;
        var height;
        var iterator;
        var yDiff = 0;
        var startingSection = section;
        for (; section >= 0 && y > yMin; --section){
            // Footer
            if (section < startingSection){
                height = this._heightForFooterInSection(section);
                y -= height;
                if (height > 0){
                    if (!(section in visibleFootersBySection)){
                        footer = this._createFooterAtSection(section, y, height);
                        if (callback){
                            callback(footer);
                        }
                        if (this._visibleFooterViews.length > 0){
                            this._cellsContainerView.insertSubviewBelowSibling(footer, this._visibleFooterViews[0]);
                        }else if (this._visibleHeaderViews.length > 0){
                            this._cellsContainerView.insertSubviewBelowSibling(footer, this._visibleHeaderViews[0]);
                        }else{
                            this._cellsContainerView.addSubview(footer);
                        }
                        this._visibleFooterViews.unshift(footer);
                    }
                    if (y < exactHeightMinY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                        yDiff += height - this._approximateFooterHeight;
                    }
                }
            }

            // Cells
            iterator = this._indexPathIteratorForSection(section, start);
            if (decrementOnce){
                iterator.decrement();
                decrementOnce = false;
            }
            for (; iterator.indexPath !== null && y > yMin; iterator.decrement()){
                cell = this._createCellAtIndexPath(iterator.indexPath, y, true);
                if (callback){
                    callback(cell);
                }
                y -= cell.bounds.size.height;
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
                if (y < exactHeightMinY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                    yDiff += height - this._approximateRowHeight;
                }
            }

            // Section header
            header = visibleHeadersBySection[section];
            if (y > yMin){
                height = this._heightForHeaderInSection(section);
                y -= height;
                if (height > 0){
                    if (!header){
                        header = this._createHeaderAtSection(section, y, height);
                        if (callback){
                            callback(header);
                        }
                    }else{
                        header.expectedPosition = JSPoint(header.expectedPosition.x, y + header.anchorPoint.y * header.bounds.size.height);
                    }
                    if (y < exactHeightMinY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                        yDiff += height - this._approximateHeaderHeight;
                    }
                }
            }else{
                if (header){
                    header.expectedPosition = JSPoint(header.expectedPosition.x, y - (1 - header.anchorPoint.y) * header.bounds.size.height);
                }else if (this._headersStickToTop){
                    height = this._heightForHeaderInSection(section);
                    if (height > 0){
                        header = this._createHeaderAtSection(section, y, height);
                        if (callback){
                            callback(header);
                        }
                        header.position = JSPoint(header.position.x, header.position.y - height);
                        header.expectedPosition = JSPoint(header.position);
                    }
                }
            }
            if (header && !header.superview){
                if (this._visibleHeaderViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(header, this._visibleHeaderViews[0]);
                }else{
                    this._cellsContainerView.addSubview(header);
                }
                this._visibleHeaderViews.unshift(header);
            }

            start = -1;
        }
        return {y: y, yDiff: yDiff};
    },

    _createViewsForRectAfterLastVisibleView: function(rect){
        var cell = this._visibleCellViews.length > 0 ? this._visibleCellViews[this._visibleCellViews.length - 1] : null;
        var header = this._visibleHeaderViews.length > 0 ? this._visibleHeaderViews[this._visibleHeaderViews.length - 1] : null;
        var footer = this._visibleFooterViews.length > 0 ? this._visibleFooterViews[this._visibleFooterViews.length - 1] : null;

        // Figure out the starting point, based on the visible views
        var section;
        var start;
        var y;
        var incrementOnce = false;
        if (cell){
            // If we have visible cells, we start right after the last one
            section = cell.indexPath.section;
            start = cell.indexPath;
            y = cell.position.y + (1 - cell.anchorPoint.y) * cell.bounds.size.height;
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
                y = header.expectedPosition.y - header.anchorPoint.y * header.bounds.size.height;
                y += header.bounds.size.height;
            }else if (footer){
                // If the last visible item is a footer, start at the beginning
                // of the next section
                section = footer.section + 1;
                start = 0;
                y = footer.position.y + (1 - footer.anchorPoint.y) * footer.bounds.size.height;
            }else{
                // No visible cell, header, or footer...we shouldn't be called
                // if this is the state of things, so this block should never
                // run.  If it does run, there's nothing we can do, so just return.
                return;
            }
        }

        var result = this._createViewsAfter(section, start, incrementOnce, y, rect.origin.y + rect.size.height);
        y = result.y;
        if (y > this._exactHeightMaxY){
            this._exactHeightMaxY = y;
        }

        var yDiff = result.yDiff;
        // Adjust our content size due to any estimated sizes being replaced
        // by actual sizes.  (No need to move anything since any size difference
        // is at the bottom of visible views)
        if (yDiff !== 0){
            this._setContentSize(JSSize(this._contentSize.width, this._contentSize.height + yDiff));
        }
    },

    _createViewsAfter: function(section, start, incrementOnce, y, yMax, callback){
        var visibleHeaderSections = new Set();
        var visibleFooterSections = new Set();
        var i, l;
        for (i = 0, l = this._visibleHeaderViews.length; i < l; ++i){
            visibleHeaderSections.add(this._visibleHeaderViews[i].section);
        }
        for (i = 0, l = this._visibleFooterViews.length; i < l; ++i){
            visibleFooterSections.add(this._visibleFooterViews[i].section);
        }

        // Loop forward and fill in any cells, headers, and footers that have
        // come on screen.  Note that since the loop is based off of cell index
        // path iteration, we need to be careful to NOT insert the same header
        // or twice, which is why we keep track of which sections have
        // visible headers.
        var cell, header, footer;
        var height;
        var iterator;
        var yDiff = 0;
        var numberOfSections = this.__numberOfSections;
        for (;section < numberOfSections && y < yMax; ++section){
            // Section header
            if (!visibleHeaderSections.has(section)){
                height = this._heightForHeaderInSection(section);
                if (height > 0){
                    header = this._createHeaderAtSection(section, y, height);
                    if (callback){
                        callback(header);
                    }
                    this._cellsContainerView.addSubview(header);
                    this._visibleHeaderViews.push(header);
                }
                y += height;
                if (y > this._exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                    yDiff += height - this._approximateHeaderHeight;
                }
            }

            // Section cells
            iterator = this._indexPathIteratorForSection(section, start);
            if (incrementOnce){
                iterator.increment();
                incrementOnce = false;
            }
            for (; iterator.indexPath !== null && y < yMax; iterator.increment()){
                cell = this._createCellAtIndexPath(iterator.indexPath, y);
                if (callback){
                    callback(cell);
                }
                y = cell.position.y + (1 - cell.anchorPoint.y) * cell.bounds.size.height;
                if (this._visibleFooterViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleFooterViews[0]);
                }else if (this._visibleHeaderViews.length > 0){
                    this._cellsContainerView.insertSubviewBelowSibling(cell, this._visibleHeaderViews[0]);
                }else{
                    this._cellsContainerView.addSubview(cell);
                }
                this._visibleCellViews.push(cell);
                if (y > this._exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewRows){
                    yDiff += cell.bounds.size.height - this._approximateRowHeight;
                }
            }

            // Section footer
            if (!visibleFooterSections.has(section) && y < yMax){
                height = this._heightForFooterInSection(section);
                if (height > 0){
                    footer = this._createFooterAtSection(section, y, height);
                    if (callback){
                        callback(footer);
                    }
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
                if (y > this._exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewFooters){
                    yDiff += height - this._approximateFooterHeight;
                }
            }
            start = 0;
        }

        return {y: y, yDiff: yDiff};
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
        var sectionHasVisibleHeader = false;
        var section;
        var iterator;
        var contentSize = JSSize(this._contentSize);
        var numberOfSections = this.__numberOfSections;
        var headerHeight;
        var headerY;
        for (section = 0; section < numberOfSections && y < bottom; ++section){
            // Section header
            headerHeight = this._heightForHeaderInSection(section);
            sectionHasVisibleHeader = false;
            headerY = y;
            if (headerHeight > 0 && y + headerHeight > rect.origin.y){
                sectionHasVisibleHeader = true;
                header = this._createHeaderAtSection(section, y, headerHeight);
                this._visibleHeaderViews.push(header);
            }
            y += headerHeight;
            if (y > this._exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewHeaders){
                contentSize.height += headerHeight - this._approximateHeaderHeight;
            }

            // Section Cells
            for (iterator = this._indexPathIteratorForSection(section, 0); iterator.indexPath !== null && y < bottom; iterator.increment()){
                height = this._heightForCellAtIndexPath(iterator.indexPath);
                if (y + height > rect.origin.y){
                    cell = this._createCellAtIndexPath(iterator.indexPath, y);
                    this._visibleCellViews.push(cell);
                    // If we're using sticky headers, and the section has a header, but it's not
                    // visible because our bounds start in the middle of the section, go ahead
                    // and make the header visible so it can be stuck at the top
                    if (this._headersStickToTop && headerHeight > 0 && !sectionHasVisibleHeader){
                        sectionHasVisibleHeader = true;
                        header = this._createHeaderAtSection(section, headerY, headerHeight);
                        this._visibleHeaderViews.push(header);
                    }
                }
                y += height;
                if (y > this._exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewRows){
                    contentSize.height += height - this._approximateRowHeight;
                }
            }
            // Section footer
            if (y < bottom){
                height = this._heightForFooterInSection(section);
                if (height > 0 && y + height > rect.origin.y){
                    footer = this._createFooterAtSection(section, y, height);
                    this._visibleFooterViews.push(footer);
                    // If we're using sticky headers, and the section has a header, but it's not
                    // visible because our bounds start in the middle of the section, go ahead
                    // and make the header visible so it can be stuck at the top
                    if (this._headersStickToTop && headerHeight > 0 && !sectionHasVisibleHeader){
                        sectionHasVisibleHeader = true;
                        header = this._createHeaderAtSection(section, headerY, headerHeight);
                        this._visibleHeaderViews.push(header);
                    }
                }
                y += height;
                if (y > this._exactHeightMaxY && this.delegate && this.delegate.estimatedHeightForListViewFooters){
                    contentSize.height += height - this._approximateFooterHeight;
                }
            }
        }

        if (y > this._exactHeightMaxY){
            this._exactHeightMaxY = y;
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

        // Adjust our content size due to any estimated sizes being replaced
        // by actual sizes.  (No need to move anything since any size difference
        // is at the bottom of visible views)
        if (!contentSize.isEqual(this.contentSize)){
            this._setContentSize(contentSize);
        }
    },

    _createCellAtIndexPath: function(indexPath, y, yOffsetByHeight){
        indexPath = JSIndexPath(indexPath);
        var cell = this.delegate.cellForListViewAtIndexPath(this, indexPath);
        if (cell === null || cell === undefined){
            throw new Error("Got null/undefined cell for indexPath: %s".sprintf(indexPath));
        }
        this._adoptCell(cell, indexPath);
        var height = this._heightForCellAtIndexPath(indexPath);
        if (yOffsetByHeight){
            y -= height;
        }
        cell.bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, height);
        cell.position = JSPoint(cell.bounds.size.width * cell.anchorPoint.x, y + cell.bounds.size.height * cell.anchorPoint.y);
        cell.active = false;
        this._updateCellState(cell);
        var styler = cell._styler || this._styler;
        styler.updateCell(cell, indexPath);
        cell.setNeedsLayout();
        return cell;
    },

    _adoptCell: function(cell, indexPath){
        cell.listView = this;
        cell.indexPath = indexPath;
    },

    _createHeaderAtSection: function(section, y, height){
        var header = this.delegate.headerViewForListViewSection(this, section);
        if (header === null || header === undefined){
            throw new Error("Got null/undefined header for section: %d".sprintf(section));
        }
        header.kind = UIListViewHeaderFooterView.Kind.header;
        header.section = section;
        header.bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, height);
        header.position = JSPoint(header.bounds.size.width * header.anchorPoint.x, y + header.bounds.size.height * header.anchorPoint.y);
        header.expectedPosition = JSPoint(header.position);
        this._styler.updateHeader(header, section);
        return header;
    },

    _createFooterAtSection: function(section, y, height){
        var footer = this.delegate.footerViewForListViewSection(this, section);
        if (footer === null || footer === undefined){
            throw new Error("Got null/undefined footer for section: %d".sprintf(section));
        }
        footer.kind = UIListViewHeaderFooterView.Kind.footer;
        footer.section = section;
        footer.bounds = JSRect(0, 0, this._cellsContainerView.bounds.size.width, height);
        footer.position = JSPoint(footer.bounds.size.width * footer.anchorPoint.x, y + footer.bounds.size.height * footer.anchorPoint.y);
        this._styler.updateFooter(footer, section);
        return footer;
    },

    _heightForHeaderInSection: function(section){
        var height = this._approximateHeaderHeight;
        if (this.delegate.heightForListViewHeaderInSection){
            height = this.delegate.heightForListViewHeaderInSection(this, section);
        }
        return height;
    },

    _heightForFooterInSection: function(section){
        var height = this._approximateFooterHeight;
        if (this.delegate.heightForListViewFooterInSection){
            height = this.delegate.heightForListViewFooterInSection(section);
        }
        return height;
    },

    _heightForCellAtIndexPath: function(indexPath){
        var height = this._approximateRowHeight;
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
            if (this.__numberOfSections === 0){
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
    selectedIndexPath: JSDynamicProperty(),
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

    getSelectedIndexPath: function(){
        return this._selectedIndexPaths.singleIndexPath;
    },

    setSelectedIndexPath: function(indexPath){
        this._selectSingleIndexPath(indexPath);
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
        var numberOfSections = this.__numberOfSections;
        iterator.increment();
        while ((section < numberOfSections - 1) && iterator.indexPath === null){
            ++section;
            iterator = this._indexPathIteratorForSection(section, 0);
        }
        return iterator.indexPath;
    },

    _indexPathIteratorForSection: function(section, start){
        var numberOfRows = this._numberOfRowsInSection(section);
        return new SectionIndexPathIterator(section, numberOfRows, start);
    },

    _firstIndexPath: function(){
        if (this.__numberOfSections === 0){
            return null;
        }
        var section = 0;
        var iterator = this._indexPathIteratorForSection(section, 0);
        while ((section < this.__numberOfSections - 1) && iterator.indexPath === null){
            ++section;
            iterator = this._indexPathIteratorForSection(section, 0);
        }
        return iterator.indexPath;
    },

    _lastIndexPath: function(){
        if (this.__numberOfSections === 0){
            return null;
        }
        var section = this.__numberOfSections - 1;
        var iterator = this._indexPathIteratorForSection(section, -1);
        while (section > 0 && iterator.indexPath === null){
            --section;
            iterator = this._indexPathIteratorForSection(section, -1);
        }
        return iterator.indexPath;
    },

    _sectionRowForIndexPath: function(indexPath){
        return indexPath.row;
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
        var handle;
        var section;
        var iterator;
        var start;
        var endSection;
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
            start = range.start;
            endSection = range.end.section;
            for (; section <= endSection; ++section){
                for (iterator = this._indexPathIteratorForSection(section, start); iterator.indexPath !== null && (section < endSection || iterator.indexPath.isLessThanOrEqual(range.end)); iterator.increment()){
                    handle.call(this, JSIndexPath(iterator.indexPath));
                }
                start = 0;
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
        
        for (iterator = this._indexPathIteratorForSection(targetIndexPath.section, start); iterator.indexPath != null && iterator.indexPath.isGreaterThanOrEqual(targetIndexPath); iterator.decrement()){
            rect.size.height = this._heightForCellAtIndexPath(iterator.indexPath);
            rect.origin.y -= rect.size.height;
        }
        return this.contentView.convertRectFromView(rect, this._cellsContainerView);
    },

    _rectForCellAtIndexPathAfterVisibleCell: function(targetIndexPath, cell){
        // Start at last visible cell and iterate down to target indexPath to get new rect
        // - Faster than starting all the way at the top
        // - Fastest when scrolling one row, like when using the down arrow key
        var rect = JSRect(cell.frame);
        rect.origin.y -= rect.size.height;
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
        for (iterator = this._indexPathIteratorForSection(targetIndexPath.section, start); iterator.indexPath != null && iterator.indexPath.isLessThanOrEqual(targetIndexPath); iterator.increment()){
            rect.origin.y += rect.size.height;
            rect.size.height = this._heightForCellAtIndexPath(iterator.indexPath);
        }
        return this.contentView.convertRectFromView(rect, this._cellsContainerView);
    },

    _rectForVisibleCellAtIndexPath: function(indexPath){
        var cell = this.cellAtIndexPath(indexPath);
        return this.contentView.convertRectFromView(cell.bounds, cell);
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

UIListView.RowAnimation = {
    none: 0,
    default: 1,
    push: 2,
    cover: 3,
    fold: 4,
    left: 5,
    right: 6
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
    cellContentInsets: null,
    cellContentCornerRadius: 0,

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
        if ('cellBackgroundColor' in values){
            this.cellBackgroundColor = spec.resolvedValue(values.cellBackgroundColor, "JSColor");
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
        if ('cellContentInsets' in values){
            this.cellContentInsets = JSInsets.apply(undefined, values.cellContentInsets.parseNumberArray());
        }
        if ('cellContentCornerRadius' in values){
            this.cellContentCornerRadius = spec.resolvedValue(values.cellContentCornerRadius);
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
        if (this.cellContentInsets === null){
            this.cellContentInsets = JSInsets.Zero;
        }
    },

    initializeCell: function(cell, indexPath){
        if (this.showSeparators){
            cell.stylerProperties.separatorLayer = UILayer.init();
            cell.layer.addSublayer(cell.stylerProperties.separatorLayer);
        }
    },

    updateCell: function(cell, indexPath){
        cell.contentView.cornerRadius = this.cellContentCornerRadius;
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
        cell._contentView.frame = cell.bounds.rectWithInsets(this.cellContentInsets);
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
        if (start.row < numberOfRows){
            this.indexPath = JSIndexPath(start);
        }else{
            this.indexPath = null;
        }
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