// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UIScrollView.js"
// #import "UIEvent.js"
// #import "UIPlatform.js"
// #import "UIImageView.js"
// #import "UIViewPropertyAnimator.js"
// #import "JSColor+UIKit.js"
// #import "UIPressGestureRecognizer.js"
/* global UIListViewCell, UIListViewHeaderFooterView */
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

    initWithSpec: function(spec){
        UIListView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('styler')){
            this._styler = spec.valueForKey("styler", UIListView.Styler);
        }
        this._commonListInit();
        if (spec.containsKey('rowHeight')){
            this._rowHeight = spec.valueForKey("rowHeight", Number);
        }
        if (spec.containsKey('headerHeight')){
            this._headerHeight = spec.valueForKey("headerHeight", Number);
        }
        if (spec.containsKey('footerHeight')){
            this._footerHeight = spec.valueForKey("footerHeight", Number);
        }
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey("delegate");
        }
        if (spec.containsKey('dataSource')){
            this.dataSource = spec.valueForKey("dataSource");
        }
        var reusable;
        var reuse;
        var styler;
        var identifiers;
        var identifier;
        var i, l;
        if (spec.containsKey('reusableCellClasses')){
            reusable = spec.valueForKey('reusableCellClasses');
            identifiers = reusable.keys();
            for (i = 0, l = identifiers.length; i < l; ++i){
                identifier = identifiers[i];
                reuse = reusable.valueForKey(identifier);
                if (typeof(reuse) === 'string'){
                    this.registerCellClassForReuseIdentifier(JSClass.FromName(reuse), identifier);
                }else{
                    this.registerCellClassForReuseIdentifier(JSClass.FromName(reuse.valueForKey('className')), identifier, reuse.valueForKey('styler'));
                }
                
            }
        }
        if (spec.containsKey('reusableHeaderFooterClasses')){
            reusable = spec.valueForKey('reusableHeaderFooterClasses');
            identifiers = reusable.keys();
            for (i = 0, l = identifiers.length; i < l; ++i){
                identifier = identifiers[i];
                reuse = reusable.valueForKey(identifier);
                if (typeof(reuse) === 'string'){
                    this.registerHeaderFooterClassForReuseIdentifier(JSClass.FromName(reuse), identifier);
                }else{
                    this.registerHeaderFooterClassForReuseIdentifier(JSClass.FromName(reuse.valueForKey('className')), identifier);
                }
            }
        }
        if (spec.containsKey('allowsMultipleSelection')){
            this.allowsMultipleSelection = spec.valueForKey("allowsMultipleSelection");
        }
        if (spec.containsKey('allowsEmptySelection')){
            this.allowsEmptySelection = spec.valueForKey("allowsEmptySelection");
        }
        if (spec.containsKey('headersStickToTop')){
            this._headersStickToTop = spec.valueForKey("headersStickToTop");
        }
        if (spec.containsKey("showsFocusRing")){
            this.showsFocusRing = spec.valueForKey("showsFocusRing");
        }
        if (spec.containsKey("listHeaderView")){
            this.listHeaderView = spec.valueForKey("listHeaderView", UIView);
        }
        if (spec.containsKey("listFooterView")){
            this.listFooterView = spec.valueForKey("listFooterView", UIView);
        }
    },

    _commonListInit: function(){
        this.stylerProperties = {};
        this._visibleItems = [];
        this._exactHeightRange = JSRange.Zero;
        this._reusableCellsByIdentifier = {};
        this._cellClassesByIdentifier = {};
        this._reusableHeaderFootersByIdentifier = {};
        this._headerFooterClassesByIdentifier = {};
        this._cellsContainerView = UIView.init();
        this._selectedIndexPaths = [];
        this._contextSelectedIndexPaths = [];
        this.contentView.addSubview(this._cellsContainerView);
        this.accessibilityColumnCount = 1;
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

    _enqueueVisibleItem: function(item){
        if (item.kind === VisibleItem.Kind.cell){
            this._enqueueReusableCell(item.view);
        }else{
            this._enqueueReusableHeaderFooter(item.view);
        }
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
        headerFooter.transform = JSAffineTransform.Identity;
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
    _exactHeightRange: null,

    reloadData: function(){
        if (!this.dataSource){
            return;
        }
        this._needsReload = true;
        this.setNeedsLayout();
    },

    reloadRowAtIndexPath: function(indexPath, animator){
        this.reloadRowsAtIndexPaths([indexPath], animator);
    },

    reloadRowsAtIndexPaths: function(indexPaths, animator){
        if (this._visibleItems.length === 0){
            return;
        }
        if (this._edit !== null){
            return;
        }
        var firstVisibleItem = this._visibleItems[0];
        var lastVisibleItem = this._visibleItems[this._visibleItems.length - 1];
        var searcher = JSBinarySearcher(this._visibleItems, VisibleItem.cellIndexPathCompare);
        var visibleSizeChanged = false;
        var contentSize = JSSize(this.contentSize);
        var contentOffset = JSPoint(this.contentOffset);

        indexPaths = JSCopy(indexPaths);
        indexPaths.sort(function(a, b){
            return a.compare(b);
        });

        var i, l;
        var indexPath;
        var comparison;
        var itemIndex;
        var cell;
        var y;
        var diff;
        var height;
        var newHeight;
        var item;
        var y0 = firstVisibleItem.view.position.y - firstVisibleItem.view.anchorPoint.y * firstVisibleItem.view.bounds.size.height;

        for (i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            comparison = VisibleItem.cellIndexPathCompare(indexPath, lastVisibleItem);
            if (comparison <= 0){
                comparison = VisibleItem.cellIndexPathCompare(indexPath, firstVisibleItem);
                if (comparison < 0){
                    // TODO: change contentSize, contentOffset, and y0 if estimating heights
                }else{
                    itemIndex = searcher.indexMatchingValue(indexPath);
                    if (itemIndex !== null){
                        item = this._visibleItems[itemIndex];
                        cell = item.view;
                        height = cell.bounds.size.height;
                        y = cell.position.y - cell.anchorPoint.y * height;
                        newHeight = this._heightForCellAtIndexPath(indexPath);
                        this._enqueueReusableCell(cell);
                        cell = this._createCellAtIndexPath(indexPath, JSRect(0, y, cell.bounds.size.width, newHeight));
                        diff = newHeight - height;
                        if (cell !== item.view){
                            this._cellsContainerView.insertSubviewBelowSibling(cell, item.view);
                            item.view.removeFromSuperview();
                            item.view = cell;
                        }
                        if (diff !== 0){
                            visibleSizeChanged = true;
                            contentSize.height += diff;
                        }
                    }
                }
            }
        }

        if (animator && visibleSizeChanged){
            animator.addAnimations(function(){
                this.contentSize = contentSize;
                this.contentOffset = contentOffset;
                this._layoutVisibleItems(this._visibleItems, y0);
            }, this);
        }else{
            this.contentSize = contentSize;
            this.contentOffset = contentOffset;
            this._layoutVisibleItems(this._visibleItems, y0);
        }

    },

    _hasLoadedOnce: false,
    _needsReload: false,

    _reloadDuringLayout: function(){
        // First, remove all visible views so _updateVisibleItems will be forced to load all new cells
        var i, l;
        for (i = this._visibleItems.length - 1; i >= 0; --i){
            this._enqueueVisibleItem(this._visibleItems[i]);
        }
        this._visibleItems = [];

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
        this._exactHeightRange = JSRange.Zero;

        // Finally, update the visible cells
        // NOTE: setting this.contentSize *may* trigger _didScroll and/or layerDidChangeSize,
        // each of which would ordinarily call _updateVisibleItems themselves.  Since we don't know
        // if either will be called, and since we only want to update once, those functions are configured
        // to NOT call _updateVisibleItems while reloading.  Therefore, we need to make the call ourself.
        this._updateVisibleItems();

        this._hasLoadedOnce = true;
        this._updateRowCount();
    },

    _updateRowCount: function(){
        var numberOfRows = 0;
        for (var i = 0; i < this.__numberOfSections; ++i){
            numberOfRows += this._numberOfRowsInSection(i);
        }
        this.accessibilityRowCount = numberOfRows;
        this.postAccessibilityNotification(UIAccessibility.Notification.rowCountChanged);
    },

    _setContentSize: function(contentSize){
        var cellsSize = JSSize(contentSize);
        if (this._listHeaderView !== null){
            cellsSize.height -= this._listHeaderView.bounds.size.height;
        }
        if (this._listFooterView !== null){
            cellsSize.height -= this._listFooterView.bounds.size.height;
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
            height += this.delegate.heightForListViewFooterInSection(this, section);
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

    _approximateYForVisibleItem: function(item){
        if (item.kind === VisibleItem.Kind.cell){
            var row = this._sectionRowForIndexPath(item.indexPath);
            var y = this._approximateYForSection(item.indexPath.section);
            y += this._approximateYForSectionRow(item.indexPath.section, row);
            return y;
        }
        if (item.kind === VisibleItem.Kind.header){
            return this._approximateYForSection(item.indexPath.section);
        }
        if (item.kind === VisibleItem.Kind.footer){
            return this._approximateYForSectionFooter(item.indexPath.section);
        }
        return 0;
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
                deletedSections: [],
                deletedIndexPaths: [],
                insertedSections: [],
                insertedIndexPaths: [],
                didDeleteSelectedItem: false,
                selectionChanged: false,
            };
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
            animation = UIListView.RowAnimation.cover;
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
        var indexPath;
        for (var i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            this._edit.deletedIndexPaths.push({indexPath: JSIndexPath(indexPath), animation: animation});
            this._edit.didDeleteSelectedItem = this._edit.didDeleteSelectedItem || this._selectionContainsIndexPath(indexPath);
        }
    },

    insertSection: function(section, animation){
        this.insertSections([section], animation);
    },

    insertSections: function(sections, animation){
        if (animation === undefined || animation == UIListView.RowAnimation.default){
            animation = UIListView.RowAnimation.push;
        }
        this._beginEditIfNeeded(animation);
        for (var i = 0, l = sections.length; i < l; ++i){
            this._edit.insertedSections.push({section: sections[i], animation: animation});
        }
    },

    deleteSection: function(section, animation){
        this.deleteSections([section], animation);
    },

    deleteSections: function(sections, animation){
        if (animation === undefined || animation == UIListView.RowAnimation.default){
            animation = UIListView.RowAnimation.left;
        }
        this._beginEditIfNeeded(animation);
        var i, l;
        for (i = 0, l = sections.length; i < l; ++i){
            this._edit.deletedSections.push({section: sections[i], animation: animation});
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    _visibleItems: null,
    headersStickToTop: JSDynamicProperty('_headersStickToTop', false),
    _stickyHeader: null,

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
        for (i = 0, l = this._visibleItems.length; i < l; ++i){
            this._visibleItems[i].view.bounds = JSRect(0, 0, this.bounds.size.width, this._visibleItems[i].view.bounds.size.height);
        }
        if (this._needsReload){
            this._reloadDuringLayout();
            this._needsReload = false;
        }else if (this._needsUpdate){
            this.contentSize = JSSize(this.bounds.size.width, this._contentSize.height);
            this._updateVisibleItems();
        }else{
            this.contentSize = JSSize(this.bounds.size.width, this._contentSize.height);
        }

        // Only add the height offset from cellsContainerView after a possible reload, because
        // the reload adjusts this height
        origin.y += this._cellsContainerView.bounds.size.height;

        // Finally, we can place the footer
        if (this._listFooterView !== null){
            this._listFooterView.bounds = JSRect(0, 0, fitSize.width, this._listFooterView.bounds.size.height);
            this._listFooterView.position = JSPoint(this._listFooterView.bounds.size.width * this._listFooterView.anchorPoint.x, origin.y + this._listFooterView.bounds.size.height * this._listFooterView.anchorPoint.y);
        }
    },

    _didScroll: function(){
        if (!this._needsReload && this._cellsContainerView !== null){
            this._updateVisibleItems();
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

    _layoutVisibleItems: function(items, y){
        var height;
        var item;
        var i, l;
        var j;
        var size;
        var translation = JSPoint.Zero;
        var normalPosition = JSPoint(this._cellsContainerView.bounds.size.width / 2.0, 0);
        for (i = 0, l = items.length; i < l; ++i){
            item = items[i];

            size = item.view.bounds.size;
            normalPosition.y = y + item.view.bounds.size.height * item.view.anchorPoint.y;
            translation.x = 0;
            translation.y = 0;

            if (item.state === VisibleItem.State.deleted || item.state === VisibleItem.State.inserting){
                if (item.animation == UIListView.RowAnimation.push){
                    // When an item is deleted with the push animation,
                    // it animates as if it is pushed up by the row below it
                    translation.y -= size.height;
                    // Consecutive deleted items are pushed as a block,
                    // so go back and adjust previous consecutive items up
                    for (j = i - 1; j >= 0 && items[j].state === item.state && items[j].animation == item.animation; --j){
                        items[j].view.position = items[j].view.position.adding(translation);
                    }
                    // inserting items need to move up more so they don't cover deleting items above
                    if (item.state == VisibleItem.State.inserting){
                        for (; j >= 0 && items[j].state === VisibleItem.State.deleting; --j){
                            translation.y -= items[j].view.bounds.size.height;
                        }
                    }
                }else if (item.animation == UIListView.RowAnimation.fold){
                    translation.y -= size.height;
                    item.view.alpha = 0;
                }else{
                    for (j = i - 1; j >= 0 && items[j].state === item.state && items[j].animation == item.animation; --j){
                        translation.y += items[j].view.bounds.size.height;
                    }

                    if (item.animation == UIListView.RowAnimation.left){
                        translation.x -= size.width;
                        item.view.alpha = 0;
                    }else if (item.animation == UIListView.RowAnimation.right){
                        translation.x += size.width;
                        item.view.alpha = 0;
                    }else{
                        // UIListView.RowAnimation.none, UIListView.RowAnimation.cover 
                        // nothing more to do
                    }
                }
            }else{
                if (item.view.alpha !== 1){
                    item.view.alpha = 1;
                }
                // any other state is normal position (normal, deleting)
                y += size.height;
            }

            item.view.position = normalPosition.adding(translation);
        }
    },

    _updateStickyHeader: function(){
        if (!this._headersStickToTop){
            if (this._stickyHeader !== null){
                this._enqueueReusableHeaderFooter(this._stickyHeader);
                this._stickyHeader = null;
            }
            return;
        }
        if (this._visibleItems.length === 0){
            return;
        }
        var i = 0;
        var l = this._visibleItems.length;
        var firstVisibleItem = this._visibleItems[0];
        var item;
        var y = this._contentOffset.y - this._cellsContainerView.frame.origin.y + this._contentInsets.top;
        if (firstVisibleItem.kind !== VisibleItem.Kind.header){
            // Create a detached header that will stick to the top.
            // Not adding to this._visibleItems because it is not necessarily
            // consecutive with the firstVisibleItem
            var section = firstVisibleItem.indexPath.section;
            if (this._stickyHeader !== null && this._stickyHeader.section !== section){
                this._enqueueReusableHeaderFooter(this._stickyHeader);
            }
            var height = this._heightForHeaderInSection(section);
            if (height > 0){
                this._stickyHeader = this._createHeaderAtSection(section, JSRect(0, 0, this.bounds.size.width, height));
                this._cellsContainerView.addSubview(this._stickyHeader);

                // position to line up no lower than the bottom of final item in section
                for (i = 1; i < l && this._visibleItems[i].indexPath.section === section; ++i){
                }
                item = this._visibleItems[i - 1];
                this._stickyHeader.position = JSPoint(this._stickyHeader.position.x, Math.min(y + this._stickyHeader.anchorPoint.y * this._stickyHeader.bounds.size.height, item.view.position.y + (1 - item.view.anchorPoint.y) * item.view.bounds.size.height - (1 - this._stickyHeader.anchorPoint.y) * this._stickyHeader.bounds.size.height));
            }else{
                this._stickyHeader = null;
            }
        }

        for (; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind === VisibleItem.Kind.header){            
                item.view.transform = JSAffineTransform.Translated(0, Math.max(0, y - (item.view.position.y - item.view.anchorPoint.y * item.view.bounds.size.height)));
            }
        }
    },

    _reorderVisibleItemViewsInContainer: function(){
        var deleting = [];
        var inserting = [];
        var normal = [];
        var sticky = [];

        var items = this._visibleItems;
        var item;
        var i, l;
        for (i = 0, l = items.length; i < l; ++i){
            item = items[i];
            if (this._headersStickToTop && item.kind === VisibleItem.Kind.header){
                sticky.push(item.view);
            }else if (item.state === VisibleItem.State.deleting){
                deleting.push(item.view);
            }else if (item.state === VisibleItem.State.inserting){
                inserting.push(item.view);
            }else{
                normal.push(item.view);
            }
        }

        var viewIndex = 0;
        for (i = 0, l = deleting.length; i < l; ++i){
            this._cellsContainerView.insertSubviewAtIndex(deleting[i], viewIndex++);
        }
        for (i = 0, l = inserting.length; i < l; ++i){
            this._cellsContainerView.insertSubviewAtIndex(inserting[i], viewIndex++);
        }
        for (i = 0, l = normal.length; i < l; ++i){
            this._cellsContainerView.insertSubviewAtIndex(normal[i], viewIndex++);
        }
        for (i = 0, l = sticky.length; i < l; ++i){
            this._cellsContainerView.insertSubviewAtIndex(sticky[i], viewIndex++);
        }
    },

    _unshiftVisibleItemInContainer: function(item){
        var viewIndex = 0;
        if (this._headersStickToTop && item.kind === VisibleItem.Kind.header){
            viewIndex = this._cellsContainerView.subviews.length;
            while (viewIndex > 0 && this._cellsContainerView.subviews[viewIndex - 1].isKindOfClass(UIListViewHeaderFooterView) && this._cellsContainerView.subviews[viewIndex - 1].kind === UIListViewHeaderFooterView.Kind.header){
                --viewIndex;
            }
        }
        this._cellsContainerView.insertSubviewAtIndex(item.view, viewIndex);
    },

    _pushVisibleItemInContainer: function(item){
        var viewIndex = this._cellsContainerView.subviews.length;
        if (this._headersStickToTop && item.kind !== VisibleItem.Kind.header){
            while (viewIndex > 0 && this._cellsContainerView.subviews[viewIndex - 1].isKindOfClass(UIListViewHeaderFooterView) && this._cellsContainerView.subviews[viewIndex - 1].kind === UIListViewHeaderFooterView.Kind.header){
                --viewIndex;
            }
        }
        this._cellsContainerView.insertSubviewAtIndex(item.view, viewIndex);
    },

    sizeToFitSize: function(maxSize){
        var bounds = JSRect(this.bounds.origin, this.contentSize);
        if (maxSize.width < Number.MAX_VALUE){
            bounds.size.width = maxSize.width;
        }
        if (bounds.size.height > maxSize.height){
            bounds.size.height = maxSize.height;
        }
        this.bounds = bounds;
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
    _animatingEdit: null,

    _updateVisibleItems: function(){
        if (this._isUpdating){
            return;
        }
        this._needsUpdate = false;
        this._isUpdating = true;

        if (this._edit !== null){
            if (this._animatingEdit !== null){
                this._stopAnimationsForEdit(this._animatingEdit, this._edit);
            }
            this._updateVisibleItemsForEdit(this._edit);
            this._edit = null;
        }else{
            this._updateVisibleItemsNormal();
        }

        this._isUpdating = false;
    },

    _updateVisibleItemsNormal: function(){
        var visibleRect = this.contentView.convertRectToView(this.contentView.bounds, this._cellsContainerView);

        if (this._headersStickToTop){
            var item;
            for (var i = 0, l = this._visibleItems.length; i < l; ++i){
                item = this._visibleItems[i];
                if (item.kind === VisibleItem.Kind.header){
                    item.view.transform = JSAffineTransform.Identity;
                }
            }
        }
        
        // 1. Enqueue reusable views before creating new views, so the enqueued views can be dequeued during the create step
        this._enqueueReusableViewsOutsideOfRect(visibleRect);

        // 2. Create views that have just become visible
        var diff = this._createVisibleItemsInRect(visibleRect);

        // 3. Make adjustments if creating views changed the content offset and/or size
        var offset = JSPoint(this._contentOffset);
        var size = JSSize(this._contentSize);
        offset.y += diff.offset;
        size.height += diff.height;
        this._setContentSize(size);
        this.contentOffset = offset;
        if (diff.offset !== 0 && this._visibleItems.length > 0){
            this._layoutVisibleItems(this._visibleItems, this._visibleItems[0].view.position.y - this._visibleItems.view.position[0].anchorPoint.y * this._visibleItems[0].view.bounds.size.height + diff.offset);
            this._exactHeightRange.location += diff.offset;
        }

        // 3. Layout sticky headers again to include any that were just added
        this._updateStickyHeader();

        // 4. Remove any unused enqueued views from their superviews
        this._removeQueuedCells();
        this._removeQueuedHeaderFooters();
    },

    _createVisibleItemsInRect: function(rect){
        var diff = {offset: 0, height: 0};
        var adjustment;
        if (this._visibleItems.length > 0){
            adjustment = this._createVisibleItemsInRectBeforeItem(rect, this._visibleItems[0]);
            diff.height += adjustment;
            diff.offset += adjustment;
            diff.height += this._createVisibleItemsInRectAfterItem(rect, this._visibleItems[this._visibleItems.length - 1]);
        }else{
            diff.height += this._createVisibleItemsInRectStartingAtTop(rect);
        }
        return diff;
    },

    _createVisibleItemsInRectBeforeItem: function(rect, item){
        var adjustment = 0;
        var iterator = VisibleItemIterator(this, item);
        iterator.decrement();
        for (; iterator.item !== null && iterator.item.rect.intersectsRect(rect); iterator.decrement()){
            this._createViewForVisibleItem(iterator.item);
            this._visibleItems.unshift(iterator.item);
            this._unshiftVisibleItemInContainer(iterator.item);
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
        }
        return adjustment;
    },

    _createVisibleItemsInRectAfterItem: function(rect, item){
        var adjustment = 0;
        var iterator = VisibleItemIterator(this, item);
        iterator.increment();
        for (; iterator.item !== null && iterator.item.rect.intersectsRect(rect); iterator.increment()){
            this._createViewForVisibleItem(iterator.item);
            this._visibleItems.push(iterator.item);
            this._pushVisibleItemInContainer(iterator.item);
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
        }
        return adjustment;
    },

    _createVisibleItemsInRectStartingAtTop: function(rect){
        var adjustment = 0;
        var iterator = VisibleItemIterator(this);
        for (; iterator.item !== null && !iterator.item.rect.intersectsRect(rect); iterator.increment()){
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
        }
        for (; iterator.item !== null && iterator.item.rect.intersectsRect(rect); iterator.increment()){
            this._createViewForVisibleItem(iterator.item);
            this._visibleItems.push(iterator.item);
            this._pushVisibleItemInContainer(iterator.item);
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
        }
        return adjustment;
    },

    _heightAdjustmentFromApproximationForItem: function(item, exactRange){
        if (!this.delegate){
            return 0;
        }
        var approximateHeight = this._approximateRowHeight;
        if (item.kind === VisibleItem.Kind.header){
            if (!this.delegate.estimatedHeightForListViewHeaders){
                return 0;
            }
            approximateHeight = this._approximateHeaderHeight;
        }
        if (item.kind === VisibleItem.Kind.footer){
            if (!this.delegate.estimatedHeightForListViewFooters){
                return 0;
            }
            approximateHeight = this._approximateFooterHeight;
        }
        if (item.kind === VisibleItem.Kind.cell && !this.delegate.estimatedHeightForListViewRows){
            return 0;
        }
        if (item.rect.origin.y < exactRange.location){
            exactRange = item.rect.origin.y;
            return item.rect.size.height - approximateHeight;
        }
        if (item.rect.origin.y + item.rect.size.height > exactRange.end){
            exactRange.length = item.rect.origin.y + item.rect.size.height - exactRange.location;
            return item.rect.size.height - approximateHeight;
        }
        return 0;
    },

    _createViewForVisibleItem: function(item){
        if (item.kind === VisibleItem.Kind.cell){
            item.view = this._createCellAtIndexPath(item.indexPath, item.rect);
        }else if (item.kind === VisibleItem.Kind.header){
            item.view = this._createHeaderAtSection(item.indexPath.section, item.rect);
        }else if (item.kind === VisibleItem.Kind.footer){
            item.view = this._createFooterAtSection(item.indexPath.section, item.rect);
        }
    },

    _stopAnimationsForEdit: function(animatingEdit, newEdit){
        animatingEdit.animator.stopAndCallCompletions();
    },

    _updateVisibleItemsForEdit: function(edit){
        var items = this._visibleItems;
        var item;
        var i, l;

        // Prepare the edit
        edit.deletedSections.sort(function(a, b){
            return a.section - b.section;
        });
        edit.deletedIndexPaths.sort(function(a, b){
            return a.indexPath.compare(b.indexPath);
        });
        edit.insertedSections.sort(function(a, b){
            return a.section - b.section;
        });
        edit.insertedIndexPaths.sort(function(a, b){
            return a.indexPath.compare(b.indexPath);
        });

        this.__numberOfSections = this.__numberOfSections + edit.insertedSections.length - edit.deletedSections.length;
        this._updateVisibleIndexPathsForEdit(edit);
        this._updateSelectedIndexPathsForEdit(edit);
        if (edit.didDeleteSelectedItem){
            this._updateSelectedIndexPaths({notifyDelegate: true});
        }

        // Figure out how our scrolling size and offset will change
        var contentSize = this._approximateContentSize();
        var contentOffset;
        var minOffsetY = -this._contentInsets.top;
        var maxOffsetY = Math.max(minOffsetY, contentSize.height + this._contentInsets.bottom - this.bounds.size.height);

        var anchorIndex = -1;
        for (i = 0, l = items.length; i < l && anchorIndex < 0; ++i){
            item = items[i];
            if (item.state === VisibleItem.State.normal){
                anchorIndex = i;
            }
        }

        var anchorY = 0;
        var anchorItem = null;
        if (anchorIndex >= 0){
            // If we have an anchor view (one that will remain after the edit),
            // keep it positioned in the view without moving
            anchorItem = items[anchorIndex];
            anchorY = this._approximateYForVisibleItem(anchorItem);
            if (this.contentOffset.y === -this._contentInsets.top){
                // stay at top
                contentOffset = JSPoint(this.contentOffset);
            }else{
                var anchorOffset = (anchorItem.view.position.y - anchorItem.view.anchorPoint.y * anchorItem.view.bounds.size.height) - this._contentOffset.y;
                contentOffset = JSPoint(this.contentOffset.x, anchorY - anchorOffset);
            }
        }else{
            // If we don't have an anchor view, just stay as close to the same
            // content offset as possible
            contentOffset = JSPoint(this.contentOffset);
        }

        // But make sure the offset is within the allowed range
        if (contentOffset.y < minOffsetY){
            contentOffset.y = minOffsetY;
        }else if (contentOffset.y > maxOffsetY){
            contentOffset.y = maxOffsetY;
        }

        var visibleRect = JSRect(0, contentOffset.y, contentSize.width, this.contentView.bounds.size.height);
        var diff = this._createViewsForEdit(edit, anchorIndex, anchorY, visibleRect);
        this._updateVisibleItemStatesForEdit(edit);
        contentOffset.y += diff.offset;
        contentSize.height += diff.height;
        anchorY += diff.offset;

        // Layout starting point pre-animation
        // - have the first non-inserted item stay in exactly the same place
        var y0 = 0;
        for (i = 0, l = items.length; i < l; ++i){
            item = items[i];
            if (item.state !== VisibleItem.State.inserting){
                y0 = item.rect.origin.y;
                break;
            }
        }

        // Layout starting point post-animation
        // - Use anchor as a shortcut
        // - Or, get the approximate position for the first remaining item
        var y1 = 0;
        if (anchorItem !== null){
            y1 = anchorY;
            for (i = 0, l = items.length; i < l && items[i] !== anchorItem; ++i){
                item = items[i];
                if (item.state !== VisibleItem.State.deleting){
                    y1 -= item.rect.size.height;
                }
            }
        }else{
            for (i = 0, l = items.length; i < l; ++i){
                item = items[i];
                if (item.state !== VisibleItem.State.deleting){
                    y1 = this._approximateYForVisibleItem(item);
                    break;
                }
            }
        }

        // Layout items in their pre-animation positions
        this._layoutVisibleItems(items, y0);
        this._reorderVisibleItemViewsInContainer();

        // update item states
        for (i = items.length - 1; i >= 0; --i){
            item = items[i];
            if (item.state === VisibleItem.State.deleting){
                item.state = VisibleItem.State.deleted;
            }else if (item.state === VisibleItem.State.inserting){
                item.state = VisibleItem.State.normal;
            }
        }

        this._updateVisibleCellStates();
        this._updateRowCount();

        // remove deleted items from this._visibleItems
        this._visibleItems = JSCopy(items);
        for (i = this._visibleItems.length - 1; i >= 0; --i){
            item = this._visibleItems[i];
            if (item.state === VisibleItem.State.deleted){
                this._visibleItems.splice(i, 1);
            }
        }

        // Animate changes
        var listView = this;
        var animations = function(){
            var i, l;
            var item;
            listView._setContentSize(contentSize);
            listView.contentOffset = contentOffset;
            listView._layoutVisibleItems(items, y1);
        };

        var completion = function(){
            var i, l;
            var item;
            // enqueue deleted views
            for (i = items.length - 1; i >= 0; --i){
                item = items[i];
                if (item.state === VisibleItem.State.deleted){
                    item.view.alpha = 1;
                    listView._enqueueVisibleItem(item);
                }
            }

            // enqueue invisible views
            var visibleRect = listView.contentView.convertRectToView(listView.contentView.bounds, listView._cellsContainerView);
            listView._enqueueReusableViewsOutsideOfRect(visibleRect);

            // remove all queued views from superview
            listView._removeQueuedCells();
            listView._removeQueuedHeaderFooters();

            listView._reorderVisibleItemViewsInContainer();
        };

        var animator = edit.animator;
        if (animator){
            this._animatingEdit = edit;
            animator.addAnimations(animations);
            animator.addCompletion(completion);
            animator.addCompletion(function(){
                listView._animatingEdit = null;
            });
            animator.start();
            if (edit.animationStartPercentage){
                animator.percentComplete = edit.animationStartPercentage;
            }
        }else{
            animations();
            completion();
        }
    },

    _updateVisibleIndexPathsForEdit: function(edit){
        var items = this._visibleItems;
        var itemCount = items.length;
        var itemIndex = 0;
        var i, l;
        var j;
        var indexPath;
        var parent;
        var info;
        var item;

        // account for deleted index paths
        itemIndex = items.length - 1;
        for (i = edit.deletedIndexPaths.length - 1; i >= 0; --i){
            info = edit.deletedIndexPaths[i];
            parent = info.indexPath.removingLastIndex();
            while (itemIndex >= 0 && (items[itemIndex].kind !== VisibleItem.Kind.cell || (items[itemIndex].indexPath.isGreaterThan(info.indexPath) && !items[itemIndex].indexPath.startsWith(info.indexPath)))){
                --itemIndex;
            }
            while (itemIndex >= 0 && items[itemIndex].indexPath.startsWith(info.indexPath)){
                items[itemIndex].state = VisibleItem.State.deleting;
                items[itemIndex].animation = info.animation;
                items[itemIndex].indexPath = null;
                --itemIndex;
            }
            for (j = itemIndex + 1; j < itemCount && (items[j].indexPath === null || (items[j].indexPath.length > parent.length && items[j].indexPath.startsWith(parent))); ++j){
                if (items[j].kind === VisibleItem.Kind.cell && items[j].indexPath !== null){
                    items[j].indexPath[parent.length] -= 1;
                }
            }
        }

        // account for deleted sections
        itemIndex = items.length - 1;
        for (i = edit.deletedSections.length - 1; i >= 0; --i){
            info = edit.deletedSections[i];
            while (itemIndex >= 0 && (items[itemIndex].indexPath === null || items[itemIndex].indexPath.section > info.section)){
                --itemIndex;
            }
            while (itemIndex >= 0 && (items[itemIndex].indexPath === null || items[itemIndex].indexPath.section === info.section)){
                items[itemIndex].state = VisibleItem.State.deleting;
                items[itemIndex].animation = info.animation;
                items[itemIndex].indexPath = null;
                --itemIndex;
            }
            for (j = itemIndex + 1; j < itemCount; ++j){
                if (items[j].indexPath !== null){
                    items[j].indexPath.section -= 1;
                }
            }
        }

        // account for inserted sections
        itemIndex = 0;
        for (i = 0, l = edit.insertedSections.length; i < l; ++i){
            info = edit.insertedSections[i];
            while (itemIndex < itemCount && (items[itemIndex].indexPath === null || items[itemIndex].indexPath.section < info.section)){
                ++itemIndex;
            }
            for (j = itemIndex; j < itemCount; ++j){
                if (items[j].indexPath !== null){
                    items[j].indexPath.section += 1;
                }
            }
        }

        // account for inserted index paths
        itemIndex = 0;
        for (i = 0, l = edit.insertedIndexPaths.length; i < l; ++i){
            info = edit.insertedIndexPaths[i];
            parent = info.indexPath.removingLastIndex();
            while (itemIndex < itemCount && (items[itemIndex].indexPath === null || items[itemIndex].indexPath.isLessThan(info.indexPath))){
                ++itemIndex;
            }
            for (j = itemIndex; j < itemCount && (items[j].indexPath === null || (items[j].indexPath.length > parent.length && items[j].indexPath.startsWith(parent))); ++j){
                if (items[j].kind === VisibleItem.Kind.cell && items[j].indexPath !== null){
                    items[j].indexPath[parent.length] += 1;
                }
            }
        }

        // Update cells, headers, and footers
        for (i = 0, l = this._visibleItems.length; i < l; ++i){
            this._visibleItems[i].updateViewIdentity();
        }
    },

    _updateVisibleItemStatesForEdit: function(edit){
        var items = this._visibleItems;
        var item;
        var i, l;
        var insertedSectionIndex = 0;
        var insertedSectionCount = edit.insertedSections.length;
        var insertedCellIndex = 0;
        var insertedCellCount = edit.insertedIndexPaths.length;

        for (i = 0, l = items.length; i < l; ++i){
            item = items[i];
            if (item.state !== VisibleItem.State.deleting){
                while (insertedSectionIndex < insertedSectionCount && edit.insertedSections[insertedSectionIndex].section < item.indexPath.section){
                    ++insertedSectionIndex;
                }
                if (insertedSectionIndex < insertedSectionCount && edit.insertedSections[insertedSectionIndex].section == item.indexPath.section){
                    item.state = VisibleItem.State.inserting;
                    item.animation = edit.insertedSections[insertedSectionIndex].animation;
                }
                if (item.kind === VisibleItem.Kind.cell){
                    while (insertedCellIndex < insertedCellCount && edit.insertedIndexPaths[insertedCellIndex].indexPath.isLessThan(item.indexPath)){
                        ++insertedCellIndex;
                    }
                    if (insertedCellIndex < insertedCellCount && edit.insertedIndexPaths[insertedCellIndex].indexPath.isEqual(item.indexPath)){
                        item.state = VisibleItem.State.inserting;
                        item.animation = edit.insertedIndexPaths[insertedCellIndex].animation;
                    }
                }
            }
        }

        // Make sure inserted items always show up after deleted items
        var j;
        for (i = items.length - 2; i >= 0; --i){
            item = items[i];
            if (item.state === VisibleItem.State.inserting && items[i + 1].state === VisibleItem.State.deleting){
                j = i + 1;
                while (j < l && items[j].state === VisibleItem.State.deleting){
                    ++j;
                }
                items.splice(j, 0, item);
                items.splice(i, 1);
            }
        }
    },

    _updateSelectedIndexPathsForEdit: function(edit){
        if (edit.selectionChanged){
            this._updateVisibleCellStates();
            return;
        }
        var i, l;
        var section, indexPath;
        var index;
        var searcher = JSBinarySearcher(this._selectedIndexPaths, JSIndexPath.compare);
        var parent;
        var selectedLength = this._selectedIndexPaths.length;
        for (i = edit.deletedIndexPaths.length - 1; i >= 0; --i){
            indexPath = edit.deletedIndexPaths[i].indexPath;
            parent = indexPath.removingLastIndex();
            index = searcher.insertionIndexForValue(indexPath);
            if (index < selectedLength && this._selectedIndexPaths[index].isEqual(indexPath)){
                this._selectedIndexPaths.splice(index, 1);
                --selectedLength;
            }
            for (; index < selectedLength && this._selectedIndexPaths[index].startsWith(parent); ++index){
                this._selectedIndexPaths[index][parent.length]--;
            }
        }
        for (i = edit.deletedSections.length - 1; i >= 0; --i){
            section = edit.deletedSections[i].section;
            index = searcher.insertionIndexForValue(JSIndexPath(section, 0));
            for (; index < selectedLength && this._selectedIndexPaths[index].section == section; --selectedLength){
                this._selectedIndexPaths.splice(index, 1);
            }
            for (; index < selectedLength; ++index){
                this._selectedIndexPaths[index].section--;
            }
        }
        for (i = 0, l = edit.insertedSections.length; i < l; ++i){
            section = edit.insertedSections[i].section;
            index = searcher.insertionIndexForValue(JSIndexPath(section, 0));
            for (; index < selectedLength && this._selectedIndexPaths[index].section >= section; ++index){
                this._selectedIndexPaths[index].section++;
            }
        }
        for (i = 0, l = edit.insertedIndexPaths.length; i < l; ++i){
            indexPath = edit.insertedIndexPaths[i].indexPath;
            parent = indexPath.removingLastIndex();
            index = searcher.insertionIndexForValue(indexPath);
            for (; index < selectedLength && this._selectedIndexPaths[index].startsWith(parent); ++index){
                this._selectedIndexPaths[index][parent.length]++;
            }
        }
    },

    _createViewsForEdit: function(edit, anchorIndex, anchorY, rect){
        var diff = {offset: 0, height: 0};
        var items = this._visibleItems;
        var item;
        var i, l;
        var iterator;
        var exactRange = JSRange.Zero;
        var adjustment;
        if (anchorIndex >= 0){
            // Working from an anchor item...
            var anchorItem = items[anchorIndex];
            iterator = VisibleItemIterator(this, anchorItem);
            exactRange.location = anchorItem.rect.origin.y;
            adjustment = this._heightAdjustmentFromApproximationForItem(iterator.item, exactRange);
            diff.height += adjustment;

            // move the visible rect to the pre-animation coordinates that
            // correspond to the given post-animation coordinates
            rect.origin.y += (iterator.item.rect.origin.y - anchorY);

            // Adjust for rows at the top that have been deleted
            var heightDeletedAtTop = 0;
            for (i = 0; i < anchorIndex; ++i){
                heightDeletedAtTop += items[i].rect.size.height;
            }
            rect.origin.y -= heightDeletedAtTop;
            rect.size.height += heightDeletedAtTop;

            // Work backwards until we've filled the visible rectangle
            // When going backwards, we know that any item needs to be created
            iterator.decrement();
            if (iterator.item !== null){
                iterator.item.rect.origin.y -= heightDeletedAtTop;
            }
            var itemIndex = 0;
            for (; iterator.item !== null && iterator.item.rect.intersectsRect(rect); iterator.decrement()){
                this._createViewForVisibleItem(iterator.item);
                items.splice(itemIndex, 0, iterator.item);
                this._pushVisibleItemInContainer(iterator.item);
                adjustment = this._heightAdjustmentFromApproximationForItem(iterator.item, exactRange);
                diff.offset += adjustment;
                diff.height += adjustment;
                ++anchorIndex;
            }

            if (items[itemIndex].rect.origin.y > rect.origin.y){
                rect.size.height += (items[itemIndex].rect.origin.y - rect.origin.y);
            }

            // Work forwards until we've filled the visible rectangle
            // When going forwards, we might iterate over existing views, so
            // we need to watch out for them
            iterator = VisibleItemIterator(this, anchorItem);
            iterator.increment();
            itemIndex = anchorIndex + 1;
            for (; iterator.item !== null && iterator.item.rect.intersectsRect(rect); iterator.increment(), ++itemIndex){
                // skip any deleted views
                while (itemIndex < items.length && items[itemIndex].state === VisibleItem.State.deleting){
                    ++itemIndex;
                }
                // only create if we don't already have the view.
                // headers and footers in a section have the same indexPath, so make sure to compare kind as well
                if (itemIndex >= items.length || !(items[itemIndex].kind === iterator.item.kind && items[itemIndex].indexPath.isEqual(iterator.item.indexPath))){
                    this._createViewForVisibleItem(iterator.item);
                    items.splice(itemIndex, 0, iterator.item);
                    this._pushVisibleItemInContainer(iterator.item);
                }
                adjustment = this._heightAdjustmentFromApproximationForItem(iterator.item, exactRange);
                diff.offset += adjustment;
                diff.height += adjustment;
            }
        }else{
            // FIXME: need to adjust the rect
            iterator = VisibleItemIterator(this);
            for (; iterator.item !== null && iterator.item.rect.intersectsRect(rect); iterator.increment()){
                this._createViewForVisibleItem(iterator.item);
                items.push(iterator.item);
                this._pushVisibleItemInContainer(iterator.item);
                adjustment = this._heightAdjustmentFromApproximationForItem(iterator.item, exactRange);
                diff.offset += adjustment;
                diff.height += adjustment;
            }
        }
        return diff;
    },

    _enqueueReusableViewsOutsideOfRect: function(rect){
        var bottom = rect.origin.y + rect.size.height;
        var i, l;
        var items = this._visibleItems;
        var item;

        // Anything that has scrolled off the bottom
        for (i = items.length - 1; i >= 0; --i){
            item = items[i];
            if (item.view.position.y - item.view.anchorPoint.y * item.view.bounds.size.height >= bottom){
                this._enqueueVisibleItem(item);
                items.pop();
            }else{
                break;
            }
        }

        // Anything that has scrolled off the top
        for (i = 0, l = items.length; i < l; ++i){
            item = items[i];
            if (item.view.position.y + (1 - item.view.anchorPoint.y) * item.view.bounds.size.height <= rect.origin.y){
                this._enqueueVisibleItem(item);
            }else{
                break;
            }
        }
        if (i > 0){
            items.splice(0, i);
        }
    },

    _createCellAtIndexPath: function(indexPath, rect){
        indexPath = JSIndexPath(indexPath);
        if (!this.delegate.cellForListViewAtIndexPath){
            throw new Error("%s must implement cellForListViewAtIndexPath()".sprintf(this.delegate.$class.className));
        }
        var cell = this.delegate.cellForListViewAtIndexPath(this, indexPath);
        if (cell === null || cell === undefined){
            throw new Error("%s.cellForListViewAtIndexPath() returned null/undefined cell for indexPath: %s".sprintf(this.delegate.$class.className, indexPath));
        }
        this._adoptCell(cell, indexPath);
        cell.bounds = JSRect(JSPoint.Zero, rect.size);
        cell.position = JSPoint(rect.origin.x + cell.bounds.size.width * cell.anchorPoint.x, rect.origin.y + cell.bounds.size.height * cell.anchorPoint.y);
        cell.active = false;
        cell.over = false;
        this._updateCellState(cell);
        cell.update();
        cell.setNeedsLayout();
        return cell;
    },

    _adoptCell: function(cell, indexPath){
        cell.listView = this;
        cell.indexPath = JSIndexPath(indexPath);
        cell.accessibilityRowIndex = this._rowForIndexPath(indexPath);
        cell.postAccessibilityElementChangedNotification();
    },

    _createHeaderAtSection: function(section, rect){
        var header;
        if (this._stickyHeader !== null && section === this._stickyHeader.section){
            header = this._stickyHeader;
            this._stickyHeader = null;
        }else{
            if (!this.delegate.headerViewForListViewSection){
                throw new Error("%s must implement headerViewForListViewSection() when headerHeight is non-zero".sprintf(this.delegate.$class.className));
            }
            header = this.delegate.headerViewForListViewSection(this, section);
            if (header === null || header === undefined){
                throw new Error("%s.headerViewForListViewSection() returned null/undefined header for section: %d".sprintf(this.delegate.$class.className, section));
            }
        }
        header.kind = UIListViewHeaderFooterView.Kind.header;
        header.section = section;
        header.bounds = JSRect(JSPoint.Zero, rect.size);
        header.position = JSPoint(rect.origin.x + header.bounds.size.width * header.anchorPoint.x, rect.origin.y + header.bounds.size.height * header.anchorPoint.y);
        this._styler.updateHeader(header, section);
        header.setNeedsLayout();
        return header;
    },

    _createFooterAtSection: function(section, rect){
        if (!this.delegate.footerViewForListViewSection){
            throw new Error("%s must implement footerViewForListViewSection() when footerHeight is non-zero".sprintf(this.delegate.$class.className));
        }
        var footer = this.delegate.footerViewForListViewSection(this, section);
        if (footer === null || footer === undefined){
            throw new Error("%s.headerViewForListViewSection() returned null/undefined header for section: %d".sprintf(this.delegate.$class.className, section));
        }
        footer.kind = UIListViewHeaderFooterView.Kind.footer;
        footer.section = section;
        footer.bounds = JSRect(JSPoint.Zero, rect.size);
        footer.position = JSPoint(rect.origin.x + footer.bounds.size.width * footer.anchorPoint.x, rect.origin.y + footer.bounds.size.height * footer.anchorPoint.y);
        this._styler.updateFooter(footer, section);
        footer.setNeedsLayout();
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
            height = this.delegate.heightForListViewFooterInSection(this, section);
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
        var hasSelection = this._selectedIndexPaths.length > 0;
        var extend;
        if (hasSelection){
            if (event.key == UIEvent.Key.up){
                extend = (this.allowsMultipleSelection && this._selectionAnchorIndexPath && event.hasModifier(UIEvent.Modifier.shift));
                this._selectPreviousRow(extend, {notifyDelegate: true});
            }else if (event.key == UIEvent.Key.down){
                extend = (this.allowsMultipleSelection && this._selectionAnchorIndexPath && event.hasModifier(UIEvent.Modifier.shift));
                this._selectNextRow(extend, {notifyDelegate: true});
            }else if (event.key == UIEvent.Key.enter){
                if (this.delegate && this.delegate.listViewDidOpenCellAtIndexPath){
                    var indexPath = this.selectedIndexPath;
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
    allowsEmptySelection: true,
    selectedIndexPaths: JSDynamicProperty('_selectedIndexPaths', null),
    selectedIndexPath: JSDynamicProperty(),
    contextSelectedIndexPaths: JSReadOnlyProperty('_contextSelectedIndexPaths', null),
    _handledSelectionOnDown: false,

    setSelectedIndexPaths: function(selectedIndexPaths){
        this._setSelectedIndexPaths(selectedIndexPaths, {notifyDelegate: false});
    },

    _setSelectedIndexPaths: function(selectedIndexPaths, options){
        var indexPaths = JSCopy(selectedIndexPaths);
        indexPaths.sort(JSIndexPath.compare);
        if (this._edit !== null){
            this._edit.selectionChanged = true;
        }
        if (indexPaths.length === this._selectedIndexPaths.length){
            for (var i = 0, l = this._selectedIndexPaths.length; i < l; ++i){
                if (!indexPaths[i].isEqual(this._selectedIndexPaths[i])){
                    break;
                }
            }
            if (i === l){
                return;
            }
        }
        if (!this.allowsEmptySelection && indexPaths.length === 0){
            return;
        }
        this._selectedIndexPaths = indexPaths;
        this._updateSelectedIndexPaths(options);
    },

    _updateSelectedIndexPaths: function(options){
        var singleIndexPath = this.selectedIndexPath;
        if (singleIndexPath !== null){
            this._selectionAnchorIndexPath = singleIndexPath;
        }
        if (options.animated){
            var animator = UIViewPropertyAnimator.initWithDuration(0.3);
            var listView = this;
            animator.addAnimations(function(){
                listView._updateVisibleCellStates();
            });
            animator.start();
        }else{
            this._updateVisibleCellStates();
        }
        if (options.notifyDelegate){
            if (singleIndexPath !== null){
                if (singleIndexPath !== null && this.delegate && this.delegate.listViewDidSelectCellAtIndexPath){
                    this.delegate.listViewDidSelectCellAtIndexPath(this, singleIndexPath);
                }
            }
            if (this.delegate && this.delegate.listViewSelectionDidChange){
                this.delegate.listViewSelectionDidChange(this, this._selectedIndexPaths);
            }
        }
        this.postAccessibilityNotification(UIAccessibility.Notification.selectedChildrenChanged);
    },

    getSelectedIndexPath: function(){
        if (this._selectedIndexPaths.length === 1){
            return this._selectedIndexPaths[0];
        }
        return null;
    },

    setSelectedIndexPath: function(indexPath){
        var indexPaths;
        if (indexPath === null){
            indexPaths = [];
        }else{
            indexPaths = [indexPath];
        }
        this._setSelectedIndexPaths(indexPaths, {notifyDelegate: false});
    },

    setSelectedIndexPathAnimated: function(indexPath){
        var indexPaths;
        if (indexPath === null){
            indexPaths = [];
        }else{
            indexPaths = [indexPath];
        }
        this._setSelectedIndexPaths(indexPaths, {notifyDelegate: false, animated: true});
    },

    addIndexPathToSelection: function(indexPath){
        this._addIndexPathToSelection(indexPath, {notifyDelegate: false});
    },

    _addIndexPathToSelection: function(indexPath, options){
        var searcher = JSBinarySearcher(this._selectedIndexPaths, JSIndexPath.compare);
        var index = searcher.insertionIndexForValue(indexPath);
        if (index < this._selectedIndexPaths.length && this._selectedIndexPaths[index].isEqual(indexPath)){
            return;
        }
        this._selectedIndexPaths.splice(index, 0, JSIndexPath(indexPath));
        this._updateSelectedIndexPaths(options);
    },

    removeIndexPathFromSelection: function(indexPath){
        this._removeIndexPathFromSelection(indexPath, {notifyDelegate: false});
    },

    _removeIndexPathFromSelection: function(indexPath, options){
        var searcher = JSBinarySearcher(this._selectedIndexPaths, JSIndexPath.compare);
        var index = searcher.indexMatchingValue(indexPath);
        if (index === null){
            return;
        }
        if (!this.allowsEmptySelection && this._selectedIndexPaths.length === 1){
            return;
        }
        this._selectedIndexPaths.splice(index, 1);
        this._updateSelectedIndexPaths(options);
    },

    indexPathBefore: function(indexPath){
        var section = indexPath.section;
        if (section >= this.__numberOfSections){
            return this._lastIndexPath();
        }
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

    _firstSelectableIndexPath: function(){
        var indexPath = this._firstIndexPath();
        if (this.delegate && this.delegate.listViewShouldSelectCellAtIndexPath){
            while (indexPath !== null && !this.delegate.listViewShouldSelectCellAtIndexPath(this, indexPath)){
                indexPath = this.indexPathAfter(indexPath);
            }
        }
        return indexPath;
    },

    _lastSelectableIndexPath: function(){
        var indexPath = this._lastIndexPath();
        if (this.delegate && this.delegate.listViewShouldSelectCellAtIndexPath){
            while (indexPath !== null && !this.delegate.listViewShouldSelectCellAtIndexPath(this, indexPath)){
                indexPath = this.indexPathBefore(indexPath);
            }
        }
        return indexPath;
    },

    _rowForIndexPath: function(indexPath){
        var row = 0;
        for (var section = 0; section < indexPath.section; ++section){
            row += this._numberOfRowsInSection(section);
        }
        row += this._sectionRowForIndexPath(indexPath);
        return row;
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
        if (indexPath.section >= this._numberOfSections){
            return this._lastSelectableIndexPath();
        }
        var prev = this.indexPathBefore(indexPath);
        if (this.delegate && this.delegate.listViewShouldSelectCellAtIndexPath){
            while (prev !== null && !this.delegate.listViewShouldSelectCellAtIndexPath(this, prev)){
                prev = this.indexPathBefore(prev);
            }
        }
        return prev;
    },

    _updateVisibleCellStates: function(){
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind === VisibleItem.Kind.cell){
                this._updateCellState(item.view);
            }
        }
    },

    _updateCellState: function(cell){
        cell.selected = this._selectionContainsIndexPath(cell.indexPath);
        cell.contextSelected = this._contextSelectionContainsIndexPath(cell.indexPath);
    },

    _updateVisibleCellStyles: function(){
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind === VisibleItem.Kind.cell){
                item.view.update();
            }
        }
    },

    selectNextRow: function(extendSelection){
        this._selectNextRow(extendSelection, {notifyDelegate: false});
    },

    _selectNextRow: function(extendSelection, options){
        var next;
        var selectionEnd;
        if (this._selectedIndexPaths.length === 0){
            return;
        }
        var start = this._selectedIndexPaths[0];
        var end = this._selectedIndexPaths[this._selectedIndexPaths.length - 1];
        if (extendSelection){
            if (start.isEqual(this._selectionAnchorIndexPath)){
                selectionEnd = end;
            }else{
                selectionEnd = start;
            }
            if (selectionEnd !== null){
                next = this.selectableIndexPathAfter(selectionEnd);
            }
            if (next !== null){
                this._adjustSelectionAnchorRange(this._selectionAnchorIndexPath, next, options);
                this.scrollToRowAtIndexPath(next);
            }
        }else{
            if (end !== null){
                next = this.selectableIndexPathAfter(end);
            }
            if (next !== null){
                this._setSelectedIndexPaths([next], options);
                this.scrollToRowAtIndexPath(next);
            }
        }
    },

    selectPreviousRow: function(extendSelection){
        this._selectPreviousRow(extendSelection, {notifyDelegate: false});
    },

    _selectPreviousRow: function(extendSelection, options){
        var prev;
        var selectionStart;
        if (this._selectedIndexPaths.length === 0){
            return;
        }
        var start = this._selectedIndexPaths[0];
        var end = this._selectedIndexPaths[this._selectedIndexPaths.length - 1];
        if (extendSelection){
            if (start.isEqual(this._selectionAnchorIndexPath)){
                selectionStart = end;
            }else{
                selectionStart = start;
            }
            if (selectionStart !== null){
                prev = this.selectableIndexPathBefore(selectionStart);
            }
            if (prev !== null){
                this._adjustSelectionAnchorRange(this._selectionAnchorIndexPath, prev, options);
                this.scrollToRowAtIndexPath(prev);
            }
        }else{
            if (start !== null){
                prev = this.selectableIndexPathBefore(start);
            }
            if (prev !== null){
                this._setSelectedIndexPaths([prev], options);
                this.scrollToRowAtIndexPath(prev);
            }
        }
    },

    selectAll: function(sender){
        if (!this.allowsMultipleSelection){
            return;
        }
        var indexPaths = [];
        var indexPath = this._firstSelectableIndexPath();
        for (; indexPath !== null; indexPath = this.selectableIndexPathAfter(indexPath)){
            indexPaths.push(indexPath);
        }
        this._setSelectedIndexPaths(indexPaths, {notifyDelegate: sender !== undefined});
    },

    selectNone: function(){
        this._setSelectedIndexPaths([], {notifyDelegate: false});
    },

    _selectionContainsIndexPath: function(indexPath){
        var searcher = JSBinarySearcher(this._selectedIndexPaths, JSIndexPath.compare);
        return searcher.indexMatchingValue(indexPath) !== null;
    },

    _contextSelectionContainsIndexPath: function(indexPath){
        var searcher = JSBinarySearcher(this._contextSelectedIndexPaths, JSIndexPath.compare);
        return searcher.indexMatchingValue(indexPath) !== null;
    },

    _adjustSelectionAnchorRange: function(anchorIndexPath, toIndexPath, options){
        var searcher = JSBinarySearcher(this._selectedIndexPaths, JSIndexPath.compare);
        var index = searcher.indexMatchingValue(anchorIndexPath);
        var i;
        var l = this._selectedIndexPaths.length;
        var consecutiveIndexPath;
        if (index !== null){
            // clear any consecutive selection below the anchor
            consecutiveIndexPath = this.selectableIndexPathAfter(anchorIndexPath);
            for (i = index + 1; i < l && consecutiveIndexPath !== null && this._selectedIndexPaths[i].isEqual(consecutiveIndexPath); --l){
                this._selectedIndexPaths.splice(i, 1);
                consecutiveIndexPath = this.selectableIndexPathAfter(consecutiveIndexPath);
            }
            // clear any consecutive selection above the anchor
            consecutiveIndexPath = this.selectableIndexPathBefore(anchorIndexPath);
            for (i = index - 1; i >= 0 && consecutiveIndexPath !== null && this._selectedIndexPaths[i].isEqual(consecutiveIndexPath); --i, --index){
                this._selectedIndexPaths.splice(i, 1);
                consecutiveIndexPath = this.selectableIndexPathBefore(consecutiveIndexPath);
            }
            if (toIndexPath.isLessThan(anchorIndexPath)){
                // add up to toIndexPath
                consecutiveIndexPath = this.selectableIndexPathBefore(anchorIndexPath);
                for (i = index; consecutiveIndexPath !== null && consecutiveIndexPath.isGreaterThanOrEqual(toIndexPath);){
                    this._selectedIndexPaths.splice(i, 0, JSIndexPath(consecutiveIndexPath));
                    consecutiveIndexPath = this.selectableIndexPathBefore(consecutiveIndexPath);
                }
            }
            if (toIndexPath.isGreaterThan(anchorIndexPath)){
                // add down to toIndexPath
                consecutiveIndexPath = this.selectableIndexPathAfter(anchorIndexPath);
                for (i = index + 1; consecutiveIndexPath !== null && consecutiveIndexPath.isLessThanOrEqual(toIndexPath); ++i){
                    this._selectedIndexPaths.splice(i, 0, JSIndexPath(consecutiveIndexPath));
                    consecutiveIndexPath = this.selectableIndexPathAfter(consecutiveIndexPath);
                }
            }
        }
        this._updateSelectedIndexPaths(options);
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
            this._setSelectedIndexPaths([], {notifyDelegate: true});
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
            if (this._selectionContainsIndexPath(cell.indexPath)){
                this._removeIndexPathFromSelection(cell.indexPath, {notifyDelegate: true});
                // TODO: set anchor to "nearest" selected cell (could be biased in one direction, even if next selected cell is far)
                this._selectionAnchorIndexPath = null;
            }else if (this.allowsMultipleSelection){
                this._addIndexPathToSelection(cell.indexPath, {notifyDelegate: true});
                this._selectionAnchorIndexPath = cell.indexPath;
            }else{
                this._setSelectedIndexPaths([cell.indexPath], {notifyDelegate: true});
            }
        }else if (this._selectionAnchorIndexPath !== null && this.allowsMultipleSelection && event.hasModifier(UIEvent.Modifier.shift)){
            this._handledSelectionOnDown = true;
            this._adjustSelectionAnchorRange(this._selectionAnchorIndexPath, cell.indexPath, {notifyDelegate: true});
        }else{
            this._shouldDrag = this.delegate && this.delegate.listViewShouldDragCellAtIndexPath && this.delegate.listViewShouldDragCellAtIndexPath(this, cell.indexPath);
            if (this._shouldDrag){
                this._handledSelectionOnDown = false;
            }else{
                this._handledSelectionOnDown = true;
                this._setSelectedIndexPaths([cell.indexPath], {notifyDelegate: true});
            }
        }
    },

    rightMouseDown: function(event){
        var location = event.locationInView(this);
        var cell = this._cellHitTest(location);
        if (cell === null){
            return;
        }
        this._contextSelectCell(cell, location);
    },

    _contextSelectCell: function(cell, location){
        if (this.delegate && this.delegate.menuForListViewCellAtIndexPath){
            var menu = this.delegate.menuForListViewCellAtIndexPath(this, cell.indexPath);
            if (menu !== null){
                if (this._selectionContainsIndexPath(cell.indexPath)){
                    this._contextSelectedIndexPaths = JSCopy(this._selectedIndexPaths);
                }else{
                    this._contextSelectedIndexPaths = [cell.indexPath];
                }
                this._updateVisibleCellStates();
                var locationInCell = this.convertPointToView(location, cell);
                menu.delegate = this;
                menu.openAtLocationInContextView(locationInCell, cell);
            }
        }
    },

    menuDidClose: function(menu){
        this._contextSelectedIndexPaths = [];
        this._updateVisibleCellStates();
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        var cell = this._cellHitTest(location);
        if (this._shouldDrag){
            var dragItems = [];
            if (cell !== null){
                var cellItems = [];
                if (this.allowsMultipleSelection && this._selectionContainsIndexPath(cell.indexPath)){
                    if (this.delegate && this.delegate.pasteboardItemsForListViewAtIndexPath){
                        var indexPath;
                        for (var i = 0, l = this._selectedIndexPaths.length; i < l; ++i){
                            indexPath = this._selectedIndexPaths[i];
                            cellItems = this.delegate.pasteboardItemsForListViewAtIndexPath(this, indexPath);
                            if (cellItems !== null){
                                dragItems = dragItems.concat(cellItems);
                            }
                        }
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
                            this._adjustSelectionAnchorRange(this._selectionAnchorIndexPath, cell.indexPath, {notifyDelegate: true});
                        }else{
                            if (!cell.selected){
                                this._setSelectedIndexPaths([cell.indexPath], {notifyDelegate: true});
                            }
                        }
                    }
                }
            }
        }
    },

    draggingSessionDidBecomeActive: function(session){
        this._didDrag = true;
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
                this._setSelectedIndexPaths([cell.indexPath], {notifyDelegate: true});
                if (this.delegate && this.delegate.listViewDidFinishSelectingCellAtIndexPath){
                    this.delegate.listViewDidFinishSelectingCellAtIndexPath(this, cell.indexPath);
                }
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Touch Events

    _touch: null,

    _cancelTouchSelection: function(){
        if (this._touch.cell){
            this._touch.cell.active = false;
        }
        if (this._touch.timer !== null){
            this._touch.timer.invalidate();
        }
        this._touch = null;
    },

    _makeTouchActiveCell: function(touch, waitForLongPress){
        var location = touch.locationInView(this);
        var cell = this._cellHitTest(location);
        if (cell === null){
            return;
        }
        var shouldSelect = !this.delegate || !this.delegate.listViewShouldSelectCellAtIndexPath || this.delegate.listViewShouldSelectCellAtIndexPath(this, cell.indexPath);
        if (!shouldSelect){
            return;
        }
        cell.active = true;
        this._touch.cell = cell;
        if (waitForLongPress){
            this._touch.timer = JSTimer.scheduledTimerWithInterval(UIPressGestureRecognizer.PressInterval.long, function(){
                this._touch.timer = null;
                this._longPressCell(location);
            }, this);
        }
    },

    _longPressCell: function(location){
        var cell = this._touch.cell;
        var indexPath = cell.indexPath;
        this._cancelTouchSelection();
        this._contextSelectCell(cell, location);
    },

    touchesBegan: function(touches, event){
        UIListView.$super.touchesBegan.call(this, touches, event);
        if (touches.length > 1){
            return;
        }
        this._touch = {
            location0: touches[0].locationInWindow,
            cell: null,
            timer: JSTimer.scheduledTimerWithInterval(0.05, function(){
                this._touch.timer = null;
                this._makeTouchActiveCell(touches[0], true);
            }, this)
        };
    },

    touchesMoved: function(touches, event){
        UIListView.$super.touchesMoved.call(this, touches, event);
        if (this._touch !== null){
            var location = touches[0].locationInWindow;
            var diff = location.subtracting(this._touch.location0);
            if ((diff.x * diff.x + diff.y * diff.y) > 2){
                this._cancelTouchSelection();
            }
        }
    },

    touchesEnded: function(touches, event){
        UIListView.$super.touchesEnded.call(this, touches, event);
        if (touches.length > 1){
            return;
        }
        if (this._touch !== null){
            if (this._touch.timer !== null){
                this._touch.timer.invalidate();
                this._makeTouchActiveCell(touches[0]);
            }
            if (this._touch.cell){
                this._touch.cell.active = false;
                this._setSelectedIndexPaths([this._touch.cell.indexPath], {notifyDelegate: true});
            }
            this._touch = null;
        }
    },

    touchesCanceled: function(touches, event){
        UIListView.$super.touchesCanceled.call(this, touches, event);
        this._cancelTouchSelection();
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

    indexPathOfCell: function(cell){
        return cell.indexPath;
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
        // While a binary search over the visible items would be a bit faster,
        // the list may contain deleted items that should not be considered
        var locationInContainer = this.convertPointToView(location, this._cellsContainerView);
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind === VisibleItem.Kind.cell && item.state !== VisibleItem.State.deleted && item.view.frame.containsPoint(locationInContainer)){
                return item.view;
            }
        }
        return null;
    },

    cellAtIndexPath: function(indexPath){
        // While a binary search over the visible items would be a bit faster,
        // the list may contain deleted items that should not be considered
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind === VisibleItem.Kind.cell && item.state !== VisibleItem.State.deleted && item.view.indexPath.isEqual(indexPath)){
                return item.view;
            }
        }
        return null;
    },

    _cellHitTest: function(location){
        // If we don't have sticky headers, then the cell hit test is identical
        // to the cellAtLocation function because there are no overlaping views.
        // However, if we do have sticky headers, a header may be covering a cell,
        // in which case we don't want to indicate that a cell was hit if the user
        // really clicked on the covering header.
        if (this._headersStickToTop){
            var subviewLocation;
            var item;
            if (this._stickyHeader !== null){
                subviewLocation = this.convertPointToView(location, this._stickyHeader);
                if (this._stickyHeader.containsPoint(subviewLocation)){
                    return null;
                }
            }
            for (var i = 0, l = this._visibleItems.length; i < l; ++i){
                item = this._visibleItems[i];
                if (item.kind === VisibleItem.Kind.header){
                    subviewLocation = this.convertPointToView(location, item.view);
                    if (item.view.containsPoint(subviewLocation)){
                        return null;
                    }
                }
            }
        }
        return this.cellAtLocation(location);
    },

    rectForCellAtIndexPath: function(indexPath){
        if (this._visibleItems.length === 0){
            return null;
        }
        var firstItem = this._visibleItems[0];
        var lastItem = this._visibleItems[this._visibleItems.length - 1];

        if (VisibleItem.cellIndexPathCompare(indexPath, firstItem) < 0){
            return this._rectForCellAtIndexPathBeforeVisibleItem(indexPath, firstItem);
        }

        if (VisibleItem.cellIndexPathCompare(indexPath, lastItem) > 0){
            return this._rectForCellAtIndexPathAfterVisibleItem(indexPath, lastItem);
        }

        return this._rectForVisibleCellAtIndexPath(indexPath);
    },

    _rectForCellAtIndexPathBeforeVisibleItem: function(targetIndexPath, item){
        var iterator = VisibleItemIterator(this, item);
        var adjustment = 0;
        var rect = null;
        iterator.decrement();
        for (; iterator.item !== null && iterator.item.indexPath.isGreaterThan(targetIndexPath); iterator.decrement()){
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
        }

        if (iterator.item !== null && iterator.item.indexPath.isEqual(targetIndexPath)){
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
            rect = this.contentView.convertRectFromView(iterator.item.rect, this._cellsContainerView);
        }

        if (adjustment !== 0){
            var size = JSSize(this._contentSize);
            var offset = JSPoint(this._contentOffset);
            offset.y += adjustment;
            size.height += adjustment;
            this._setContentSize(size);
            this.contentOffset = offset;
            if (rect !== null){
                rect.origin.y += adjustment;
            }
        }

        return rect;
    },

    _rectForCellAtIndexPathAfterVisibleItem: function(targetIndexPath, item){
        var iterator = VisibleItemIterator(this, item);
        var adjustment = 0;
        var rect = null;
        iterator.increment();
        for (; iterator.item !== null && iterator.item.indexPath.isLessThan(targetIndexPath); iterator.increment()){
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
        }

        if (iterator.item !== null && iterator.item.indexPath.isEqual(targetIndexPath)){
            adjustment += this._heightAdjustmentFromApproximationForItem(iterator.item, this._exactHeightRange);
            rect = this.contentView.convertRectFromView(iterator.item.rect, this._cellsContainerView);
        }

        if (adjustment !== 0){
            var size = JSSize(this._contentSize);
            size.height += adjustment;
            this._setContentSize(size);
        }

        return rect;
    },

    _rectForVisibleCellAtIndexPath: function(indexPath){
        var cell = this.cellAtIndexPath(indexPath);
        if (cell !== null){
            return this.contentView.convertRectFromView(cell.bounds, cell);
        }
        return null;
    },

    headerAtSection: function(section){
        if (this._stickyHeader && this._stickyHeader.section === section){
            return this._stickyHeader;
        }
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind == VisibleItem.Kind.header && item.state !== VisibleItem.State.deleted && item.indexPath.section === section){
                return item.view;
            }
        }
        return null;
    },

    footerAtSection: function(section){
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind == VisibleItem.Kind.footer && item.state !== VisibleItem.State.deleted && item.indexPath.section === section){
                return item.view;
            }
        }
        return null;
    },

    visibleIndexPaths: JSReadOnlyProperty(),

    getVisibleIndexPaths: function(){
        var indexPaths = [];
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind === VisibleItem.Kind.cell){
                indexPaths.push(item.indexPath);
            }
        }
        return indexPaths;
    },

    visibleCells: JSReadOnlyProperty(),

    getVisibleCells: function(){
        var cells = [];
        var item;
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            item = this._visibleItems[i];
            if (item.kind === VisibleItem.Kind.cell){
                cells.push(item.view);
            }
        }
        return cells;
    },

    // --------------------------------------------------------------------
    // MARK: - Scrolling

    scrollToRowAtIndexPath: function(indexPath, position){
        if (position === undefined){
            position = UIListView.ScrollPosition.auto;
        }
        var rect = this.rectForCellAtIndexPath(indexPath);
        if (rect !== null){
            this.scrollToRect(rect, position);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Acessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.grid,

    getAccessibilityElements: function(){
        var views = [];
        for (var i = 0, l = this._visibleItems.length; i < l; ++i){
            views.push(this._visibleItems[i].view);
        }
        return views;
    },

    showsFocusRing: false,

    getFocusRingPath: function(){
        if (this.showsFocusRing){
            return UIListView.$super.getFocusRingPath.call(this);
        }
        return null;
    }

});

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

var VisibleItem = function(kind, rect, indexPath){
    if (this === undefined){
        return new VisibleItem(kind, rect);
    }
    this.kind = kind;
    this.rect = rect;
    this.indexPath = JSIndexPath(indexPath);
    this.state = VisibleItem.State.normal;
};

VisibleItem.prototype = Object.create(Function.prototype, {

    indexPath: { value: null, writable: true },
    rect: { value: null, writable: true, configurable: true },
    kind: { value: null, writable: true },
    view: {
        configurable: true,
        set: function(view){
            Object.defineProperty(this, 'view', {value: view});
            Object.defineProperty(this, 'rect', {
                get: function(){
                    return JSRect(
                        this.view.position.x - this.view.anchorPoint.x * this.view.bounds.size.width,
                        this.view.position.y - this.view.anchorPoint.y * this.view.bounds.size.height,
                        this.view.bounds.size.width,
                        this.view.bounds.size.height
                    );
                }
            });
        },
        get: function(){
            return null;
        }
    },
    state: { value: null, writable: true },
    animation: { value: null, writable: true },

    updateViewIdentity: {
        value: function(){
            if (this.state === VisibleItem.State.deleting){
                return;
            }
            if (this.kind === VisibleItem.Kind.cell){
                this.view.indexPath = JSIndexPath(this.indexPath);
            }else{
                this.view.section = this.indexPath.section;
            }
        }
    }

});

VisibleItem.Kind = {
    header: 0,
    footer: 1,
    cell: 2
};

VisibleItem.State = UIListView.VisibleItemState = {
    normal: 0,
    inserting: 1,
    deleting: 2,
    deleted: 3
};

VisibleItem.cellIndexPathCompare = function VisibleItem_cellIndexPathCompare(indexPath, item){
    if (item.kind === VisibleItem.Kind.header){
        if (indexPath.section < item.view.section){
            return -1;
        }
        return 1;
    }
    if (item.kind === VisibleItem.Kind.footer){
        if (indexPath.section <= item.view.section){
            return -1;
        }
        return 1;
    }
    return indexPath.compare(item.view.indexPath);
};

VisibleItem.sectionCompare = function VisibleItem_sectionCompare(section, item){
    if (item.kind === VisibleItem.Kind.header || item.kind === VisibleItem.Kind.footer){
        return section - item.view.section;
    }
    return section - item.view.indexPath.section;
};

var VisibleItemIterator = function(listView, start){
    if (this === undefined){
        return new VisibleItemIterator(listView, start);
    }
    this.listView = listView;
    this.width = listView.bounds.size.width;
    this.cellIterator = null;
    if (start){
        this.item = start;
        this.section = start.indexPath.section;
        this.y = start.view.position.y + (1 - start.view.anchorPoint.y) * start.view.bounds.size.height;
        if (start.kind === VisibleItem.Kind.cell){
            this.cellIterator = listView._indexPathIteratorForSection(this.section, start.indexPath);
        }
    }else{
        this.section = 0;
        this.item = null;
        this.y = 0;
        this.item = this._nextItem();
        if (this.item !== null){
            this.y += this.item.rect.size.height;
        }
    }
};

VisibleItemIterator.prototype = Object.create({}, {

    _item: {
        writable: true,
        value: null
    },

    _nextItem: {
        value: function(){
            var height;
            var item;
            if (this.item !== null && this.item.kind === VisibleItem.Kind.footer){
                ++this.section;
            }
            while (this.section < this.listView.__numberOfSections){
                if (this.item === null || this.item.indexPath.section < this.section){
                    height = this.listView._heightForHeaderInSection(this.section);
                    if (height > 0){
                        item = new VisibleItem(VisibleItem.Kind.header, JSRect(0, this.y, this.width, height), JSIndexPath([this.section]));
                        return item;
                    }
                }
                if (this.cellIterator === null || this.cellIterator.section < this.section){
                    this.cellIterator = this.listView._indexPathIteratorForSection(this.section);
                }else{
                    this.cellIterator.increment();
                }
                if (this.cellIterator.indexPath !== null){
                    height = this.listView._heightForCellAtIndexPath(this.cellIterator.indexPath);
                    item = new VisibleItem(VisibleItem.Kind.cell, JSRect(0, this.y, this.width, height), this.cellIterator.indexPath);
                    return item;
                }
                if (this.item === null || this.item.indexPath.section <= this.section){
                    height = this.listView._heightForFooterInSection(this.section);
                    if (height > 0){
                        item = new VisibleItem(VisibleItem.Kind.footer, JSRect(0, this.y, this.width, height), JSIndexPath([this.section]));
                        return item;
                    }
                }
                ++this.section;
            }
            return null;
        }
    },

    _previousItem: {
        value: function(){
            var height;
            var item;
            if (this.item !== null && this.item.kind === VisibleItem.Kind.header){
                --this.section;
            }
            while (this.section >= 0){
                if (this.item === null || this.item.indexPath.section > this.section){
                    height = this.listView._heightForFooterInSection(this.section);
                    if (height > 0){
                        item = new VisibleItem(VisibleItem.Kind.footer, JSRect(0, this.y - height, this.width, height), JSIndexPath([this.section]));
                        return item;
                    }
                }
                if (this.cellIterator === null || this.cellIterator.section > this.section){
                    this.cellIterator = this.listView._indexPathIteratorForSection(this.section, -1);
                }else{
                    this.cellIterator.decrement();
                }
                if (this.cellIterator.indexPath !== null){
                    height = this.listView._heightForCellAtIndexPath(this.cellIterator.indexPath);
                    item = new VisibleItem(VisibleItem.Kind.cell, JSRect(0, this.y - height, this.width, height), this.cellIterator.indexPath);
                    return item;
                }
                height = this.listView._heightForHeaderInSection(this.section);
                if (height > 0){
                    item = new VisibleItem(VisibleItem.Kind.header, JSRect(0, this.y - height, this.width, height), JSIndexPath([this.section]));
                    return item;
                }
                --this.section;
            }
            return null;
        }
    },

    increment: {
        value: function VisibleItemIterator_increment(){
            if (this.item === null){
                return;
            }
            this.item = this._nextItem();
            if (this.item !== null){
                this.y += this.item.rect.size.height;
            }
        }
    },

    decrement: {
        value: function VisibleItemIterator_decrement(){
            if (this.item === null){
                return;
            }
            this.y -= this.item.rect.size.height;
            this.item = this._previousItem();
        }
    },

});

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
    activeCellTextColor: null,
    activeCellDetailTextColor: null,
    activeCellBackgroundColor: null,
    activeCellSeparatorColor: null,
    overCellTextColor: null,
    overCellDetailTextColor: null,
    overCellBackgroundColor: null,
    overCellSeparatorColor: null,
    showsMutedState: true,
    mutedSelectedCellTextColor: null,
    mutedSelectedCellDetailTextColor: null,
    mutedSelectedCellBackgroundColor: null,
    mutedSelectedCellSeparatorColor: null,
    contextSelectedCellBorderColor: null,
    cellBackgroundColor: null,
    separatorInsets: null,
    imageSize: null,
    imageTitleSpacing: null,
    accessorySize: null,
    accessoryInsets: null,
    accessoryColor: null,
    showsSeparators: true,
    cellContentInsets: null,
    cellContentCornerRadius: 0,

    headerFont: null,
    headerTextColor: null,
    headerBackgroundColor: null,
    headerBorderColor: null,

    indentSize: 20,

    init: function(){
        this._commonStylerInit();
    },

    initWithSpec: function(spec){
        UIListViewDefaultStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('cellTextColor')){
            this.cellTextColor = spec.valueForKey("cellTextColor", JSColor);
        }
        if (spec.containsKey('cellDetailTextColor')){
            this.cellDetailTextColor = spec.valueForKey("cellDetailTextColor", JSColor);
        }
        if (spec.containsKey('cellBackgroundColor')){
            this.cellBackgroundColor = spec.valueForKey("cellBackgroundColor", JSColor);
        }
        if (spec.containsKey('cellSeparatorColor')){
            this.cellSeparatorColor = spec.valueForKey("cellSeparatorColor", JSColor);
        }
        if (spec.containsKey('selectedCellTextColor')){
            this.selectedCellTextColor = spec.valueForKey("selectedCellTextColor", JSColor);
        }
        if (spec.containsKey('selectedCellDetailTextColor')){
            this.selectedCellDetailTextColor = spec.valueForKey("selectedCellDetailTextColor", JSColor);
        }
        if (spec.containsKey('selectedCellBackgroundColor')){
            this.selectedCellBackgroundColor = spec.valueForKey("selectedCellBackgroundColor", JSColor);
        }
        if (spec.containsKey('selectedCellSeparatorColor')){
            this.selectedCellSeparatorColor = spec.valueForKey("selectedCellSeparatorColor", JSColor);
        }
        if (spec.containsKey('activeCellTextColor')){
            this.activeCellTextColor = spec.valueForKey("activeCellTextColor", JSColor);
        }
        if (spec.containsKey('activeCellDetailTextColor')){
            this.activeCellDetailTextColor = spec.valueForKey("activeCellDetailTextColor", JSColor);
        }
        if (spec.containsKey('activeCellBackgroundColor')){
            this.activeCellBackgroundColor = spec.valueForKey("activeCellBackgroundColor", JSColor);
        }
        if (spec.containsKey('activeCellSeparatorColor')){
            this.activeCellSeparatorColor = spec.valueForKey("activeCellSeparatorColor", JSColor);
        }
        if (spec.containsKey('overCellTextColor')){
            this.overCellTextColor = spec.valueForKey("overCellTextColor", JSColor);
        }
        if (spec.containsKey('overCellDetailTextColor')){
            this.overCellDetailTextColor = spec.valueForKey("overCellDetailTextColor", JSColor);
        }
        if (spec.containsKey('overCellBackgroundColor')){
            this.overCellBackgroundColor = spec.valueForKey("overCellBackgroundColor", JSColor);
        }
        if (spec.containsKey('overCellSeparatorColor')){
            this.overCellSeparatorColor = spec.valueForKey("overCellSeparatorColor", JSColor);
        }
        if (spec.containsKey('mutedSelectedCellTextColor')){
            this.mutedSelectedCellTextColor = spec.valueForKey("mutedSelectedCellTextColor", JSColor);
        }
        if (spec.containsKey('mutedSelectedCellDetailTextColor')){
            this.mutedSelectedCellDetailTextColor = spec.valueForKey("mutedSelectedCellDetailTextColor", JSColor);
        }
        if (spec.containsKey('mutedSelectedCellBackgroundColor')){
            this.mutedSelectedCellBackgroundColor = spec.valueForKey("mutedSelectedCellBackgroundColor", JSColor);
        }
        if (spec.containsKey('mutedSelectedCellSeparatorColor')){
            this.mutedSelectedCellSeparatorColor = spec.valueForKey("mutedSelectedCellSeparatorColor", JSColor);
        }
        if (spec.containsKey('showsMutedState')){
            this.showsMutedState = spec.valueForKey("showsMutedState");
        }
        if (spec.containsKey('headerTextColor')){
            this.headerTextColor = spec.valueForKey("headerTextColor", JSColor);
        }
        if (spec.containsKey('headerBackgroundColor')){
            this.headerBackgroundColor = spec.valueForKey("headerBackgroundColor", JSColor);
        }
        if (spec.containsKey('headerBorderColor')){
            this.headerBorderColor = spec.valueForKey("headerBorderColor", JSColor);
        }
        if (spec.containsKey('headerFont')){
            this.headerFont = spec.valueForKey("headerFont", JSFont);
        }
        if (spec.containsKey('cellFont')){
            this.cellFont = spec.valueForKey("cellFont", JSFont);
        }
        if (spec.containsKey('cellDetailFont')){
            this.cellDetailFont = spec.valueForKey("cellDetailFont", JSFont);
        }
        if (spec.containsKey('separatorInsets')){
            this.separatorInsets = spec.valueForKey("separatorInsets", JSInsets);
        }
        if (spec.containsKey('imageSize')){
            this.imageSize = spec.valueForKey("imageSize", JSSize);
        }
        if (spec.containsKey('imageTitleSpacing')){
            this.imageTitleSpacing = spec.valueForKey("imageTitleSpacing");
        }
        if (spec.containsKey('accessorySize')){
            this.accessorySize = spec.valueForKey("accessorySize", JSSize);
        }
        if (spec.containsKey('accessoryInsets')){
            this.accessoryInsets = spec.valueForKey("accessoryInsets", JSInsets);
        }
        if (spec.containsKey('accessoryColor')){
            this.accessoryColor = spec.valueForKey("accessoryColor", JSColor);
        }
        if (spec.containsKey('showsSeparators')){
            this.showsSeparators = spec.valueForKey("showsSeparators");
        }
        if (spec.containsKey('cellContentInsets')){
            this.cellContentInsets = spec.valueForKey("cellContentInsets", JSInsets);
        }
        if (spec.containsKey('cellContentCornerRadius')){
            this.cellContentCornerRadius = spec.valueForKey("cellContentCornerRadius", Number);
        }
        this._commonStylerInit();
    },

    _commonStylerInit: function(){
        if (this.cellFont === null){
            this.cellFont = JSFont.systemFontOfSize(JSFont.Size.normal);
        }
        if (this.headerFont === null){
            this.headerFont = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.bold);
        }
        if (this.cellTextColor === null){
            this.cellTextColor = JSColor.text;
        }
        if (this.cellDetailTextColor === null){
            this.cellDetailTextColor = JSColor.secondaryText;
        }
        if (this.cellDetailFont === null && this.cellFont !== null){
            this.cellDetailFont = this.cellFont.fontWithPointSize(JSFont.Size.detail);
        }
        if (this.selectedCellBackgroundColor === null){
            this.selectedCellBackgroundColor = JSColor.highlight;
        }
        if (this.contextSelectedCellBorderColor === null){
            this.contextSelectedCellBorderColor = this.selectedCellBackgroundColor.colorDarkenedByPercentage(0.5);
        }
        if (this.headerTextColor === null){
            this.headerTextColor = JSColor.text;
        }
        if (this.cellSeparatorColor === null){
            this.cellSeparatorColor = this.cellTextColor.colorWithAlpha(0.2);
        }
        if (this.accessoryColor === null){
            this.accessoryColor = this.cellTextColor;
        }
        if (this.selectedCellTextColor === null){
            this.selectedCellTextColor = JSColor.highlightedText;
        }
        if (this.selectedCellDetailTextColor === null){
            this.selectedCellDetailTextColor = this.selectedCellTextColor;
        }
        if (this.selectedCellSeparatorColor === null){
            this.selectedCellSeparatorColor = JSColor.clear;
        }
        if (this.activeCellBackgroundColor === null){
            this.activeCellBackgroundColor = this.cellBackgroundColor;
        }
        if (this.activeCellTextColor === null){
            this.activeCellTextColor = this.cellTextColor;
        }
        if (this.activeCellDetailTextColor === null){
            this.activeCellDetailTextColor = this.cellDetailTextColor;
        }
        if (this.activeCellSeparatorColor === null){
            this.activeCellSeparatorColor = this.cellSeparatorColor;
        }
        if (this.overCellBackgroundColor === null){
            this.overCellBackgroundColor = this.cellBackgroundColor;
        }
        if (this.overCellTextColor === null){
            this.overCellTextColor = this.cellTextColor;
        }
        if (this.overCellDetailTextColor === null){
            this.overCellDetailTextColor = this.cellDetailTextColor;
        }
        if (this.overCellSeparatorColor === null){
            this.overCellSeparatorColor = this.cellSeparatorColor;
        }
        if (this.mutedSelectedCellTextColor === null){
            this.mutedSelectedCellTextColor = this.cellTextColor;
        }
        if (this.mutedSelectedCellDetailTextColor === null){
            this.mutedSelectedCellDetailTextColor = this.cellDetailTextColor;
        }
        if (this.mutedSelectedCellBackgroundColor === null){
            this.mutedSelectedCellBackgroundColor = JSColor.mutedHighlight;
        }
        if (this.mutedSelectedCellSeparatorColor === null){
            this.mutedSelectedCellSeparatorColor = JSColor.clear;
        }
        if (this.cellContentInsets === null){
            this.cellContentInsets = JSInsets.Zero;
        }
    },

    initializeCell: function(cell, indexPath){
        if (this.showsSeparators){
            cell.stylerProperties.separatorLayer = UILayer.init();
            cell.layer.addSublayer(cell.stylerProperties.separatorLayer);
        }
        if (this.accessoryInsets !== null){
            cell.accessoryInsets = this.accessoryInsets;
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
            cell.contentView.borderColor = this.contextSelectedCellBorderColor;
            var showsMutedState = this.showsMutedState && UIDevice.shared && UIDevice.shared.primaryPointerType != UIUserInterface.PointerType.touch;
            if (showsMutedState && !cell.listView.keyActive){
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
        }else if (cell.active){
            cell.contentView.backgroundColor = this.activeCellBackgroundColor;
            if (cell._titleLabel !== null){
                cell._titleLabel.textColor = this.activeCellTextColor;
            }
            if (cell._detailLabel !== null){
                cell._detailLabel.textColor = this.activeCellDetailTextColor;
            }
            if (cell._imageView !== null){
                cell._imageView.templateColor = this.activeCellTextColor;
            }
            if (cell._accessoryView !== null && cell._accessoryView.isKindOfClass(UIImageView)){
                cell._accessoryView.templateColor = this.activeCellTextColor;
            }
            if (cell.stylerProperties.separatorLayer){
                cell.stylerProperties.separatorLayer.backgroundColor = this.activeCellSeparatorColor;
            }
        }else if (cell.over){
            cell.contentView.backgroundColor = this.overCellBackgroundColor;
            if (cell._titleLabel !== null){
                cell._titleLabel.textColor = this.overCellTextColor;
            }
            if (cell._detailLabel !== null){
                cell._detailLabel.textColor = this.overCellDetailTextColor;
            }
            if (cell._imageView !== null){
                cell._imageView.templateColor = this.overCellTextColor;
            }
            if (cell._accessoryView !== null && cell._accessoryView.isKindOfClass(UIImageView)){
                cell._accessoryView.templateColor = this.overCellTextColor;
            }
            if (cell.stylerProperties.separatorLayer){
                cell.stylerProperties.separatorLayer.backgroundColor = this.overCellSeparatorColor;
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
            cell.stylerProperties.separatorLayer.hidden = cell.contextSelected || (indexPath.length == 2 && indexPath.row === 0);
        }
    },

    _indentationForCell: function(cell){
        return 0;
    },

    layoutCell: function(cell){
        cell._contentView.frame = cell.bounds.rectWithInsets(this.cellContentInsets);
        var size = JSSize(cell._contentView.bounds.size.width - cell._titleInsets.width, 0);
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
            var imageTitleSpacing = this.imageTitleSpacing;
            if (imageTitleSpacing === null){
                imageTitleSpacing = cell._titleInsets.left;
            }
            cell._imageView.frame = JSRect(origin.x, (cell._contentView.bounds.size.height - imageSize.height) / 2, imageSize.width, imageSize.height);
            origin.x += imageSize.width + imageTitleSpacing;
            size.width -= imageSize.width + imageTitleSpacing;
        }
        if (cell._accessoryView !== null){
            var accessorySize = this.accessorySize;
            if (accessorySize === null){
                accessorySize = cell._accessoryView.intrinsicSize;
            }
            cell._accessoryView.frame = JSRect(cell._contentView.bounds.size.width - cell._accessoryInsets.right - accessorySize.width, (cell._contentView.bounds.size.height - accessorySize.height) / 2, accessorySize.width, accessorySize.height);
            size.width -= accessorySize.width + cell._accessoryInsets.width;
        }
        if (cell._titleLabel !== null){
            if (cell._detailLabel !== null){
                size.height = cell._titleLabel.font.displayLineHeight * (cell._titleLabel.maximumNumberOfLines || 1) + cell._detailLabel.font.displayLineHeight * (cell._detailLabel.maximumNumberOfLines || 1);
                origin.y =  Math.floor((cell._contentView.bounds.size.height - size.height) / 2.0);
                size.height = cell._titleLabel.font.displayLineHeight * (cell._titleLabel.maximumNumberOfLines || 1);
                cell._titleLabel.frame = JSRect(origin, size);
                origin.y += size.height;
                size.height = cell._detailLabel.font.displayLineHeight * (cell._detailLabel.maximumNumberOfLines || 1);
                cell._detailLabel.frame = JSRect(origin, size);
            }else{
                size.height = cell._titleLabel.font.displayLineHeight * (cell._titleLabel.maximumNumberOfLines || 1);
                origin.y =  Math.floor((cell._contentView.bounds.size.height - size.height) / 2.0);
                cell._titleLabel.frame = JSRect(origin, size);
            }
        }else if (cell._detailLabel !== null){
            size.height = cell._detailLabel.font.displayLineHeight * (cell._detailLabel.maximumNumberOfLines || 1);
            cell._detailLabel.frame = JSRect(JSPoint(cell._titleInsets.left, Math.floor((cell._contentView.bounds.size.height - size.height) / 2.0)), size);
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
            cell.stylerProperties.separatorLayer.frame = JSRect(separatorInsets.left, 0, cell.bounds.size.width - separatorInsets.left - separatorInsets.right, separatorSize);
        }
    },

    updateHeader: function(header, section){
        if (header._titleLabel !== null){
            header._titleLabel.textColor = this.headerTextColor;
            header._titleLabel.font = this.headerFont;
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

// Was 3220 lines