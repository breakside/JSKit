// Copyright 2022 Breakside Inc.
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

// #import Foundation
// #import "UIScrollView.js"
// #import "UIPlatform.js"
// #import "UICollectionViewLayout.js"
"use strict";

JSProtocol("UICollectionViewDelegate", JSProtocol, {

    // Selection
    collectionViewShouldSelectCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewDidSelectCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewDidFinishSelectingCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewDidOpenCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewSelectionDidChange: function(collectionView, selectedIndexPaths){},

    // Context menu
    menuForCollectionViewCellAtIndexPath: function(collectionView, indexPath, selectedIndexPaths){},

    // Dragging cells
    collectionViewShouldDragCellAtIndexPath: function(collectionView, indexPath){},
    pasteboardItemsForCollectionViewAtIndexPath: function(collectionView, indexPath){},
    collectionViewWillBeginDraggingSession: function(collectionView, session){}

});

JSProtocol("UICollectionViewDataSource", JSProtocol, {

    numberOfSectionsInCollectionView: function(collectionView){},
    numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){},
    cellForCollectionViewAtIndexPath: function(collectionView, indexPath){},
    supplimentaryViewForCollectionViewAtIndexPath: function(collectionView, indexPath, kind){}

});

JSClass("UICollectionView", UIScrollView, {
    
    // --------------------------------------------------------------------
    // MARK: - Creating a Collection View

    initWithLayout: function(layout, styler){
        this.collectionViewLayout = layout;
        if (styler !== undefined){
            this._styler = styler;
        }
        this.init();
    },

    initWithFrame: function(frame){
        UICollectionView.$super.initWithFrame.call(this, frame);
        if (this._collectionViewLayout === null){
            throw new Error("Use initWithLayout() to create a UICollectionView");
        }
        this._commonListInit();
    },

    initWithSpec: function(spec){
        UICollectionView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('styler')){
            this._styler = spec.valueForKey("styler", UICollectionView.Styler);
        }
        if (spec.containsKey('layout')){
            this.collectionViewLayout = spec.valueForKey("layout", UICollectionView.Styler);
        }else{
            throw new Error("layout is a required property in a UICollectionView spec file");
        }
        this._commonListInit();
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
        if (spec.containsKey('reusableViewClasses')){
            reusable = spec.valueForKey('reusableViewClasses');
            identifiers = reusable.keys();
            for (i = 0, l = identifiers.length; i < l; ++i){
                identifier = identifiers[i];
                reuse = reusable.valueForKey(identifier);
                if (typeof(reuse) === 'string'){
                    this.registerViewClassForReuseIdentifier(JSClass.FromName(reuse), identifier);
                }else{
                    this.registerViewClassForReuseIdentifier(JSClass.FromName(reuse.valueForKey('className')), identifier, reuse.valueForKey('styler'));
                }
            }
        }
        if (spec.containsKey('allowsMultipleSelection')){
            this.allowsMultipleSelection = spec.valueForKey("allowsMultipleSelection");
        }
        if (spec.containsKey('allowsEmptySelection')){
            this.allowsEmptySelection = spec.valueForKey("allowsEmptySelection");
        }
        if (spec.containsKey("showsFocusRing")){
            this.showsFocusRing = spec.valueForKey("showsFocusRing");
        }
    },

    _commonListInit: function(){
        this.stylerProperties = {};
        this._visibleElements = [];
        this._reusableCellsByIdentifier = {};
        this._cellClassesByIdentifier = {};
        this._reusableViewsByIdentifier = {};
        this._viewClassesByIdentifier = {};
        this._elementsContainerView = UIView.init();
        this._selectedIndexPaths = [];
        this._contextSelectedIndexPaths = [];
        this.contentView.addSubview(this._elementsContainerView);
        if (this._styler === null){
            this._styler = this.$class.Styler.default;
        }
        this._styler.initializeCollectionView(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Data Source & Delegate

    dataSource: null,
    delegate: null,

    // -------------------------------------------------------------------------
    // MARK: - Styling

    sylerProperties: null,
    styler: JSReadOnlyProperty("_styler", null),

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

    _enqueueReusableCell: function(cell){
        cell.indexPath = null;
        cell.collectionView = null;
        var identifier = cell.reuseIdentifier;
        if (!(identifier in this._reusableCellsByIdentifier)){
            this._reusableCellsByIdentifier[identifier] = [];
        }
        var queue = this._reusableCellsByIdentifier[identifier];
        queue.push(cell);
    },

    _enqueueVisibleElement: function(element){
        if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell){
            this._enqueueReusableCell(element.view);
        }else{
            this._enqueueReusableView(element.view);
        }
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

    // --------------------------------------------------------------------
    // MARK: - Supplimentary View Reuse

    registerViewClassForReuseIdentifier: function(viewClass, identifier, styler){
        this._viewClassesByIdentifier[identifier] = {viewClass: viewClass, styler: styler || null};
    },

    dequeueReusableViewWithIdentifier: function(identifier, indexPath){
        var view = null;
        var queue = this._reusableViewsByIdentifier[identifier];
        if (queue && queue.length > 0){
            view = queue.pop();
        }else{
            var info = this._viewClassesByIdentifier[identifier];
            if (info){
                view = info.viewClass.initWithReuseIdentifier(identifier, info.styler);
                var styler = info.styler || this._styler;
                styler.initializeReusableView(view, indexPath);
            }
        }
        return view;
    },
    
    _reusableViewsByIdentifier: null,
    _viewClassesByIdentifier: null,

    _enqueueReusableView: function(view){
        view.indexPath = null;
        view.collectionView = null;
        var identifier = view.reuseIdentifier;
        if (!(identifier in this._reusableViewsByIdentifier)){
            this._reusableViewsByIdentifier[identifier] = [];
        }
        var queue = this._reusableViewsByIdentifier[identifier];
        queue.push(view);
    },

    _removeQueuedViews: function(){
        var queue;
        var view;
        for (var id in this._reusableViewsByIdentifier){
            queue = this._reusableViewsByIdentifier[id];
            for (var i = 0, l = queue.length; i < l; ++i){
                view = queue[i];
                if (view.superview !== null){
                    view.removeFromSuperview();
                }
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Reloading Collection Data

    _needsReload: false,

    reloadData: function(){
        if (!this.dataSource){
            return;
        }
        this._needsReload = true;
        this.setNeedsLayout();
    },

    reloadCellAtIndexPath: function(indexPath, animator){
        this.reloadCellsAtIndexPaths([indexPath], animator);
    },

    reloadCellsAtIndexPaths: function(indexPaths, animator){
        if (this._visibleElements.length === 0){
            return;
        }
        var firstVisibleElement = this._visibleElements[0];
        var lastVisibleElement = this._visibleElements[this._visibleElements.length - 1];
        var searcher = JSBinarySearcher(this._visibleElements, VisibleElement.indexPathCompare);

        indexPaths = JSCopy(indexPaths);
        indexPaths.sort(function(a, b){
            return a.compare(b);
        });

        var i, l;
        var indexPath;
        var comparison;
        var elementIndex;
        var cell;
        var element;

        for (i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            comparison = VisibleElement.indexPathCompare(indexPath, lastVisibleElement);
            if (comparison <= 0){
                comparison = VisibleElement.indexPathCompare(indexPath, firstVisibleElement);
                if (comparison >= 0){
                    elementIndex = searcher.indexMatchingValue(indexPath);
                    if (elementIndex !== null){
                        element = this._visibleElements[elementIndex];
                        cell = element.view;
                        this._enqueueReusableCell(cell);
                        cell = this._createCellWithAttributes(element.attributes);
                        if (cell !== element.view){
                            this._elementsContainerView.insertSubviewBelowSibling(cell, element.view);
                            element.view.removeFromSuperview();
                            element.view = cell;
                        }
                    }
                }
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Inserting and Deleting Rows

    insertCellAtIndexPath: function(indexPath, animation){
        this.insertCellsAtIndexPaths([indexPath], animation);
    },

    insertCellsAtIndexPaths: function(indexPaths, animation){
        // TODO:
        this.reloadData();
    },

    deleteCellAtIndexPath: function(indexPath, animation){
        this.deleteCellsAtIndexPaths([indexPath], animation);
    },

    deleteCellsAtIndexPaths: function(indexPaths, animation){
        // TODO:
        this.reloadData();
    },

    insertSection: function(section, animation){
        this.insertSections([section], animation);
    },

    insertSections: function(sections, animation){
        // TODO:
        this.reloadData();
    },

    deleteSection: function(section, animation){
        this.deleteSections([section], animation);
    },

    deleteSections: function(sections, animation){
        // TODO:
        this.reloadData();
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    _visibleElements: null,
    _elementsContainerView: null,
    _hasPreparedLayout: false,
    collectionViewLayout: JSDynamicProperty("_collectionViewLayout", null),

    setCollectionViewLayout: function(collectionViewLayout){
        if (this._collectionViewLayout !== null){
            this._collectionViewLayout.collectionView = null;
        }
        this._collectionViewLayout = collectionViewLayout;
        if (this._collectionViewLayout !== null){
            this._collectionViewLayout.collectionView = this;
        }
    },

    layoutSubviews: function(){
        UICollectionView.$super.layoutSubviews.call(this);
        var needsPrepare = this._needsReload || this._hasPreparedLayout;
        var i, l;
        if (this._needsReload){
            for (i = 0, l = this._visibleElements.length; i < l; ++i){
                this._enqueueVisibleElement(this._visibleElements[i]);
            }
            this._visibleElements = [];
            this._needsReload = false;
        }
        if (needsPrepare){
            this.collectionViewLayout.prepare();
            this.contentSize = this.collectionViewLayout.collectionViewContentSize;
            this._hasPreparedLayout = true;
        }
        this._elementsContainerView.untransformedFrame = JSRect(JSPoint.Zero, this.contentSize);
        this._updateVisibleElements();
    },

    _didScroll: function(){
        if (!this._needsReload && this._elementsContainerView !== null){
            this._updateVisibleElements();
        }
        UICollectionView.$super._didScroll.call(this);
    },

    _updateVisibleElements: function(){
        if (!this._hasPreparedLayout){
            return;
        }
        var i, l;
        var visibleRect = JSRect(this.contentView.bounds);
        var visibleElementMap = {};

        // Get the attributes for the elements that should be visible
        var attributes = this.collectionViewLayout.layoutAttributesForElementsInRect(visibleRect);
        var attrs;
        for (i = 0, l = attributes.length; i < l; ++i){
            attrs = attributes[i];
            visibleElementMap[attrs.elementIdentifier] = null;
        }

        // Enqueue any elements that are no longer visible
        var element;
        for (i = this._visibleElements.length - 1; i >= 0; --i){
            element = this._visibleElements[i];
            if (element.attributes.elementIdentifier in visibleElementMap){
                visibleElementMap[element.attributes.elementIdentifier] = element;
            }else{
                this._enqueueVisibleElement(element);
                this._visibleElements.splice(i, 1);
            }
        }

        // 2. Add any elements that are newly visible
        var elementIndex = 0;
        for (i = 0, l = attributes.length; i < l; ++i){
            attrs = attributes[i];
            element = visibleElementMap[attrs.elementIdentifier];
            if (element === null){
                element = VisibleElement(attrs);
                this._createViewForVisibleElement(element);
                this._visibleElements.splice(elementIndex, 0, element);
                if (elementIndex < this._visibleElements.length - 1){
                    this._elementsContainerView.insertSubviewBelowSibling(element.view, this._visibleElements[elementIndex + 1].view);
                }else{
                    this._elementsContainerView.addSubview(element.view);
                }
            }else{
                element.attributes = attrs;
                element.view.applyAttributes(attrs);
            }
            ++elementIndex;
        }

        // 4. Remove views that were not reused
        this._removeQueuedCells();
        this._removeQueuedViews();
    },

    _createViewForVisibleElement: function(element){
        if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell){
            element.view = this._createCellWithAttributes(element.attributes);
        }else if (element.attributes.elementCategory === UICollectionView.ElementCategory.supplimentary){
            element.view = this._createSupplimentaryViewWithAttributes(element.attributes);
        }
    },

    _createCellWithAttributes: function(attributes){
        if (!this.dataSource.cellForCollectionViewAtIndexPath){
            throw new Error("%s must implement cellForCollectionViewAtIndexPath()".sprintf(this.dataSource.$class.className));
        }
        var cell = this.dataSource.cellForCollectionViewAtIndexPath(this, JSIndexPath(attributes.indexPath));
        if (cell === null || cell === undefined){
            throw new Error("%s.cellForCollectionViewAtIndexPath() returned null/undefined cell for indexPath: %s".sprintf(this.dataSource.$class.className, attributes.indexPath));
        }
        this._adoptCell(cell, attributes);
        cell.applyAttributes(attributes);
        cell.active = false;
        this._updateCellState(cell);
        cell.update();
        cell.setNeedsLayout();
        return cell;
    },

    _adoptCell: function(cell, attributes){
        cell.collectionView = this;
        cell.indexPath = JSIndexPath(attributes.indexPath);
        cell.accessibilityRowIndex = attributes.rowIndex;
        cell.accessibilityColumnIndex = attributes.columnIndex;
        cell.postAccessibilityElementChangedNotification();
    },

    _createSupplimentaryViewWithAttributes: function(attributes){
        if (!this.dataSource.supplimentaryViewForCollectionViewAtIndexPath){
            throw new Error("%s must implement supplimentaryViewForCollectionViewAtIndexPath()".sprintf(this.dataSource.$class.className));
        }
        var view = this.dataSource.supplimentaryViewForCollectionViewAtIndexPath(this, JSIndexPath(attributes.indexPath), attributes.kind);
        if (view === null || view === undefined){
            throw new Error("%s.supplimentaryViewForCollectionViewAtIndexPath() returned null/undefined cell for indexPath: %s".sprintf(this.dataSource.$class.className, attributes.indexPath));
        }
        view.collectionView = this;
        view.applyAttributes(attributes);
        view.setNeedsLayout();
        return view;
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
        // TODO:
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
                if (this.delegate && this.delegate.collectionViewDidOpenCellAtIndexPath){
                    var indexPath = this.selectedIndexPath;
                    if (indexPath !== null){
                        this.delegate.collectionViewDidOpenCellAtIndexPath(this, indexPath);
                    }
                }
            }else{
                UICollectionView.$super.keyDown.call(this, event);
            }
        }else{
            UICollectionView.$super.keyDown.call(this, event);
        }
    },

    keyUp: function(event){
        UICollectionView.$super.keyUp.call(this, event);
    },

    canPerformAction: function(action, sender){
        if (action == 'selectAll'){
            return this.allowsMultipleSelection;
        }
        return UICollectionView.$super.canPerformAction.call(this, action, sender);
    },

    // --------------------------------------------------------------------
    // MARK: - Selecting cells

    allowsMultipleSelection: false,
    allowsEmptySelection: true,
    selectedIndexPaths: JSDynamicProperty('_selectedIndexPaths', null),
    selectedIndexPath: JSDynamicProperty(),
    contextSelectedIndexPaths: JSReadOnlyProperty('_contextSelectedIndexPaths', null),

    setSelectedIndexPaths: function(selectedIndexPaths){
        this._setSelectedIndexPaths(selectedIndexPaths, {notifyDelegate: false});
    },

    _setSelectedIndexPaths: function(selectedIndexPaths, options){
        var indexPaths = JSCopy(selectedIndexPaths);
        indexPaths.sort(JSIndexPath.compare);
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
        // TODO: editing
        // if (this._edit !== null){
        //     this._edit.selectionChanged = true;
        // }
        this._updateSelectedIndexPaths(options);
    },

    _updateSelectedIndexPaths: function(options){
        var singleIndexPath = this.selectedIndexPath;
        if (singleIndexPath !== null){
            this._selectionAnchorIndexPath = singleIndexPath;
        }
        if (options.animated){
            var animator = UIViewPropertyAnimator.initWithDuration(0.3);
            animator.addAnimations(function(){
                this._updateVisibleCellStates();
            }, this);
            animator.start();
        }else{
            this._updateVisibleCellStates();
        }
        if (options.notifyDelegate){
            if (singleIndexPath !== null){
                if (singleIndexPath !== null && this.delegate && this.delegate.collectionViewDidSelectCellAtIndexPath){
                    this.delegate.collectionViewDidSelectCellAtIndexPath(this, singleIndexPath);
                }
            }
            if (this.delegate && this.delegate.collectionViewSelectionDidChange){
                this.delegate.collectionViewSelectionDidChange(this, this._selectedIndexPaths);
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

    selectAll: function(sender){
        // TODO:
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

    // TODO: select next/prev (whatever that means here)

    _updateVisibleCellStyles: function(){
        var element;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            element = this._visibleElements[i];
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell){
                element.view.update();
            }
        }
    },

    _updateVisibleCellStates: function(){
        var item;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            item = this._visibleElements[i];
            if (item.attributes.elementCategory === UICollectionView.ElementCategory.cell){
                this._updateCellState(item.view);
            }
        }
    },

    _updateCellState: function(cell){
        cell.selected = this._selectionContainsIndexPath(cell.indexPath);
        cell.contextSelected = this._contextSelectionContainsIndexPath(cell.indexPath);
    },

    _selectionContainsIndexPath: function(indexPath){
        var searcher = JSBinarySearcher(this._selectedIndexPaths, JSIndexPath.compare);
        return searcher.indexMatchingValue(indexPath) !== null;
    },

    _contextSelectionContainsIndexPath: function(indexPath){
        var searcher = JSBinarySearcher(this._contextSelectedIndexPaths, JSIndexPath.compare);
        return searcher.indexMatchingValue(indexPath) !== null;
    },

    // --------------------------------------------------------------------
    // MARK: - Mouse Events

    _activeCell: null,
    _shouldDrag: false,
    _didDrag: false,
    _selectionAnchorIndexPath: null,
    _handledSelectionOnDown: false,

    mouseDown: function(event){
        var location = event.locationInView(this);
        var cell = this._cellHitTest(location);
        this.window.firstResponder = this;
        this._activeCell = null;
        if (cell === null){
            this._setSelectedIndexPaths([], {notifyDelegate: true});
            return;
        }
        var shouldSelect = !this.delegate || !this.delegate.collectionViewShouldSelectCellAtIndexPath || this.delegate.collectionViewShouldSelectCellAtIndexPath(this, cell.indexPath);
        if (!shouldSelect){
            return;
        }
        cell.active = true;
        this._activeCell = cell;
        this._didDrag = false;
        // command key takes precedence over other modifiers, like shift (observed behavior)
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
            // TODO:
            // this._handledSelectionOnDown = true;
            // this._adjustSelectionAnchorRange(this._selectionAnchorIndexPath, cell.indexPath, {notifyDelegate: true});
        }else{
            this._shouldDrag = this.delegate && this.delegate.collectionViewShouldDragCellAtIndexPath && this.delegate.collectionViewShouldDragCellAtIndexPath(this, cell.indexPath);
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
        if (this.delegate && this.delegate.menuForCollectionViewCellAtIndexPath){
            var contextSelectedIndexPaths;
            if (this._selectionContainsIndexPath(cell.indexPath)){
                contextSelectedIndexPaths = JSCopy(this._selectedIndexPaths);
            }else{
                contextSelectedIndexPaths = [cell.indexPath];
            }
            var menu = this.delegate.menuForCollectionViewCellAtIndexPath(this, cell.indexPath, contextSelectedIndexPaths);
            if (menu !== null){
                this._contextSelectedIndexPaths = contextSelectedIndexPaths;
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
                    if (this.delegate && this.delegate.pasteboardItemsForCollectionViewAtIndexPath){
                        var indexPath;
                        for (var i = 0, l = this._selectedIndexPaths.length; i < l; ++i){
                            indexPath = this._selectedIndexPaths[i];
                            cellItems = this.delegate.pasteboardItemsForCollectionViewAtIndexPath(this, indexPath);
                            if (cellItems !== null){
                                dragItems = dragItems.concat(cellItems);
                            }
                        }
                    }
                }else{
                    if (this.delegate && this.delegate.pasteboardItemsForCollectionViewAtIndexPath){
                        cellItems = this.delegate.pasteboardItemsForCollectionViewAtIndexPath(this, cell.indexPath);
                        if (cellItems !== null){
                            dragItems = cellItems;
                        }
                    }
                }
            }
            if (dragItems.length > 0){
                var session = this.beginDraggingSessionWithItems(dragItems, event);
                if (this.delegate && this.delegate.collectionViewWillBeginDraggingSession){
                    this.delegate.collectionViewWillBeginDraggingSession(this, session);
                }
            }
        }else{
            // TODO: scrolling (see UITextEditor for similar use case)
            if (cell !== this._activeCell){
                var shouldSelect = !cell || !this.delegate.collectionViewShouldSelectCellAtIndexPath || this.delegate.collectionViewShouldSelectCellAtIndexPath(this, cell.indexPath);
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
                            // TODO:
                            // this._adjustSelectionAnchorRange(this._selectionAnchorIndexPath, cell.indexPath, {notifyDelegate: true});
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
            if (this.delegate && this.delegate.collectionViewDidOpenCellAtIndexPath){
                this.delegate.collectionViewDidOpenCellAtIndexPath(this, cell.indexPath);
            }
        }else{
            var cellFrame = this.contentView.convertRectFromView(cell.bounds, cell);
            if (cellFrame.origin.y < this.contentView.bounds.origin.y){
                this.scrollToCellAtIndexPath(cell.indexPath, UICollectionView.ScrollPosition.top);
            }else if (cellFrame.origin.y + cellFrame.size.height > this.contentView.bounds.origin.y + this.contentView.bounds.size.height){
                this.scrollToCellAtIndexPath(cell.indexPath, UICollectionView.ScrollPosition.bottom);
            }
            if (this._handledSelectionOnDown){
                this._handledSelectionOnDown = false;
                if (this.delegate && this.delegate.collectionViewDidFinishSelectingCellAtIndexPath){
                    this.delegate.collectionViewDidFinishSelectingCellAtIndexPath(this, cell.indexPath);
                }
                return;
            }
            var shouldSelect = !this.delegate.collectionViewShouldSelectCellAtIndexPath || this.delegate.collectionViewShouldSelectCellAtIndexPath(this, cell.indexPath);
            if (shouldSelect){
                this._setSelectedIndexPaths([cell.indexPath], {notifyDelegate: true});
                if (this.delegate && this.delegate.collectionViewDidFinishSelectingCellAtIndexPath){
                    this.delegate.collectionViewDidFinishSelectingCellAtIndexPath(this, cell.indexPath);
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

    _makeTouchActiveCell: function(touch){
        var location = touch.locationInView(this);
        var cell = this._cellHitTest(location);
        if (cell === null){
            return;
        }
        var shouldSelect = !this.delegate || !this.delegate.collectionViewShouldSelectCellAtIndexPath || this.delegate.collectionViewShouldSelectCellAtIndexPath(this, cell.indexPath);
        if (!shouldSelect){
            return;
        }
        cell.active = true;
        this._touch.cell = cell;
    },

    touchesBegan: function(touches, event){
        UICollectionView.$super.touchesBegan.call(this, touches, event);
        if (touches.length > 1){
            return;
        }
        this._touch = {
            location0: touches[0].locationInView(this),
            cell: null,
            timer: JSTimer.scheduledTimerWithInterval(0.05, function(){
                this._touch.timer = null;
                this._makeTouchActiveCell(touches[0]);
            }, this)
        };
    },

    touchesMoved: function(touches, event){
        UICollectionView.$super.touchesMoved.call(this, touches, event);
        if (this._touch !== null){
            var location = touches[0].locationInView(this);
            var diff = location.subtracting(this._touch.location0);
            if ((diff.x * diff.x + diff.y * diff.y) > 2){
                this._cancelTouchSelection();
            }
        }
    },

    touchesEnded: function(touches, event){
        UICollectionView.$super.touchesEnded.call(this, touches, event);
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
        UICollectionView.$super.touchesCanceled.call(this, touches, event);
        this._cancelTouchSelection();
    },

    // --------------------------------------------------------------------
    // MARK: - Finding Cells by Location

    _cellHitTest: function(location){
        var i;
        var element;
        var locationInSubview;
        for (i = this._visibleElements.length - 1; i >= 0; --i){
            element = this._visibleElements[i];
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.supplimentary){
                locationInSubview = this.layer.convertPointToLayer(location, element.view.layer);
                if (element.view.containsPoint(locationInSubview)){
                    return null;
                }
            }
        }
        return this.cellAtLocation(location);
    },

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

    cellAtLocation: function(location){
        // For internal cell hit testing, see `_cellHitTest()`, which considers overlaid headers.
        if (!this.containsPoint(location)){
            return null;
        }
        // While a binary search over the visible items would be a bit faster,
        // the list may contain deleted items that should not be considered
        var locationInContainer = this.convertPointToView(location, this._elementsContainerView);
        var element;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            element = this._visibleElements[i];
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell && element.state !== UICollectionView.VisibleElementState.deleted && element.view.frame.containsPoint(locationInContainer)){
                return element.view;
            }
        }
        return null;
    },

    cellAtIndexPath: function(indexPath){
        // While a binary search over the visible items would be a bit faster,
        // the list may contain deleted items that should not be considered
        var element;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            element = this._visibleElements[i];
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell && element.state !== UICollectionView.VisibleElementState.deleted && element.view.indexPath.isEqual(indexPath)){
                return element.view;
            }
        }
        return null;
    },

    rectForCellAtIndexPath: function(indexPath){
        var attributes = this.collectionViewLayout.layoutAttributesForCellAtIndexPath(indexPath);
        return attributes.frame;
    },

    visibleIndexPaths: JSReadOnlyProperty(),

    getVisibleIndexPaths: function(){
        var indexPaths = [];
        var item;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            item = this._visibleElements[i];
            if (item.attributes.elementCategory === UICollectionView.ElementCategory.cell){
                indexPaths.push(item.indexPath);
            }
        }
        return indexPaths;
    },

    visibleCells: JSReadOnlyProperty(),

    getVisibleCells: function(){
        var cells = [];
        var item;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            item = this._visibleElements[i];
            if (item.attributes.elementCategory === UICollectionView.ElementCategory.cell){
                cells.push(item.view);
            }
        }
        return cells;
    },

    // --------------------------------------------------------------------
    // MARK: - Scrolling

    scrollToCellAtIndexPath: function(indexPath, position){
        if (position === undefined){
            position = UICollectionView.ScrollPosition.auto;
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
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            views.push(this._visibleElements[i].view);
        }
        return views;
    },

    showsFocusRing: false,

    getFocusRingPath: function(){
        if (this.showsFocusRing){
            return UICollectionView.$super.getFocusRingPath.call(this);
        }
        return null;
    }

});


UICollectionView.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UICollectionView_getDefaultStyler(){
            var styler = UICollectionViewDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UICollectionView_setDefaultStyler(defaultStyler){
            Object.defineProperty(this, 'default', {writable: true, value: defaultStyler});
        }
    }
});

UICollectionView.ElementCategory = {
    cell: 1,
    supplimentary: 2
};

UICollectionView.VisibleElementState = {
    normal: 0,
    inserting: 1,
    deleting: 2,
    deleted: 3
};

UICollectionView.ScrollPosition = UIScrollView.ScrollPosition;

JSClass("UICollectionViewStyler", JSObject, {

    init: function(){
    },

    initializeCollectionView: function(collectionView){
    },

    initializeCell: function(cell, indexPath){
    },

    initializeReusableView: function(view, indexPath){
    },

    updateCell: function(cell, indexPath){
    },

    layoutCell: function(cell){
    },

});


JSClass("UICollectionViewDefaultStyler", UICollectionViewStyler, {

    layoutCell: function(cell){
        cell.contentView.untransformedFrame = cell.bounds;
    }

});

var VisibleElement = function(attributes){
    if (this === undefined){
        return new VisibleElement(attributes);
    }
    this.attributes = attributes;
    this.indexPath = JSIndexPath(attributes.indexPath);
    this.state = UICollectionView.VisibleElementState.normal;
};

VisibleElement.prototype = Object.create(Function.prototype, {

    indexPath: { value: null, writable: true },
    rect: { value: null, writable: true, configurable: true },
    kind: { value: null, writable: true },
    view: {
        configurable: true,
        set: function(view){
            Object.defineProperty(this, 'view', {value: view});
        },
        get: function(){
            return null;
        }
    },
    state: { value: null, writable: true },
    animation: { value: null, writable: true },

    updateViewIdentity: {
        value: function(){
            if (this.state === UICollectionView.VisibleElementState.deleting){
                return;
            }
            this.view.indexPath = JSIndexPath(this.indexPath);
        }
    }

});

VisibleElement.indexPathCompare = function VisibleElement_indexPathCompare(indexPath, element){
    return indexPath.compare(element.indexPath);
};