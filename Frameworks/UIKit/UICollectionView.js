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
// #import "UIPressGestureRecognizer.js"
"use strict";

(function(){

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
    collectionViewWillBeginDraggingSession: function(collectionView, session, indexPath, location){},

    // Dragging destination
    collectionViewDraggingSessionDidEnter: function(collectionView, session){},
    collectionViewDraggingSessionDidUpdate: function(collectionView, session, indexPath){},
    collectionViewDraggingSessionDidExit: function(collectionView, session){},
    collectionViewPerformDragOperation: function(collectionView, session, operation, indexPath){}

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
        if (this._needsReload){
            return;
        }
        if (this._visibleElements.length === 0){
            return;
        }
        if (this._edit !== null){
            this._edit.reloadIndexPaths = this._edit.reloadIndexPaths.concat(indexPaths);
            return;
        }

        indexPaths = JSCopy(indexPaths);
        indexPaths.sort(function(a, b){
            return a.compare(b);
        });

        var i, l;
        var indexPath;
        var comparison;
        var elementIndex = 0;
        var elementCount = this._visibleElements.length;
        var cell;
        var element;

        for (i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            while (elementIndex < elementCount && !this._visibleElements[elementIndex].attributes.indexPath.isEqual(indexPath)){
                ++elementIndex;
            }
            if (elementIndex < elementCount){
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
    },

    // --------------------------------------------------------------------
    // MARK: - Inserting and Deleting Rows

    editAnimationDuration: 1.0/6,

    insertCellAtIndexPath: function(indexPath, animation){
        this.insertCellsAtIndexPaths([indexPath], animation);
    },

    insertCellsAtIndexPaths: function(indexPaths, animation){
        if (animation === undefined || animation == UICollectionView.CellAnimation.default){
            animation = UICollectionView.CellAnimation.scale;
        }
        this._beginEditIfNeeded(animation);
        var i, l;
        var indexPath;
        for (i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            this._edit.insertedIndexPaths.push({
                indexPath: indexPath,
                animation: animation
            });
        }
    },

    deleteCellAtIndexPath: function(indexPath, animation){
        this.deleteCellsAtIndexPaths([indexPath], animation);
    },

    deleteCellsAtIndexPaths: function(indexPaths, animation){
        if (animation === undefined || animation == UICollectionView.CellAnimation.default){
            animation = UICollectionView.CellAnimation.scale;
        }
        this._beginEditIfNeeded(animation);
        var i, l;
        var indexPath;
        for (i = 0, l = indexPaths.length; i < l; ++i){
            indexPath = indexPaths[i];
            this._edit.deletedIndexPaths.push({
                indexPath: indexPath,
                animation: animation
            });
            this._edit.didDeleteSelectedItem = this._edit.didDeleteSelectedItem || this._selectionContainsIndexPath(indexPath);
        }
    },

    insertSection: function(section, animation){
        this.insertSections([section], animation);
    },

    insertSections: function(sections, animation){
        if (animation === undefined || animation == UICollectionView.CellAnimation.default){
            animation = UICollectionView.CellAnimation.scale;
        }
        this._beginEditIfNeeded(animation);
        var i, l;
        var section;
        for (i = 0, l = sections.length; i < l; ++i){
            section = sections[i];
            this._edit.insertedSections.push({
                section: section,
                animation: animation
            });
        }
    },

    deleteSection: function(section, animation){
        this.deleteSections([section], animation);
    },

    deleteSections: function(sections, animation){
        if (animation === undefined || animation == UICollectionView.CellAnimation.default){
            animation = UICollectionView.CellAnimation.scale;
        }
        this._beginEditIfNeeded(animation);
        var i, l;
        var j, k;
        var section;
        for (i = 0, l = sections.length; i < l; ++i){
            section = sections[i];
            this._edit.deletedSections.push({
                section: section,
                animation: animation
            });
            for (j = 0, k = this._selectedIndexPaths.length; j < k && !this._edit.didDeleteSelectedItem; ++j){
                if (this._selectedIndexPaths[j].section === section){
                    this._edit.didDeleteSelectedItem = true;
                }
            }
        }
    },

    _edit: null,

    _beginEditIfNeeded: function(animation){
        if (this._edit === null){
            this._edit = {
                insertedSections: [],
                deletedSections: [],
                insertedIndexPaths: [],
                deletedIndexPaths: [],
                animator: null,
                selectionChanged: false,
                didDeleteSelectedItem: false,
                animated: false,
                scroll: null,
                reloadIndexPaths: [],
            };
            this.setNeedsLayout();
        }
        this._edit.animated = this._edit.animated || UICollectionView.CellAnimation.none && this._editAnimator === null;
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
        var i, l;
        if (this._needsReload){
            // A full reload is requested
            // - enqueue all visible elements for reuse
            // - prepare the layout
            // - clear any edit that may have be simultaneously requested
            // - update container size
            // - update visible elements
            for (i = 0, l = this._visibleElements.length; i < l; ++i){
                this._enqueueVisibleElement(this._visibleElements[i]);
            }
            this._visibleElements = [];
            this._needsReload = false;
            this._edit = null;
            this.collectionViewLayout.prepare();
            this._hasPreparedLayout = true;
            this.contentSize = this.collectionViewLayout.collectionViewContentSize;
            this._elementsContainerView.untransformedFrame = JSRect(JSPoint.Zero, this.contentSize);
            this._updateVisibleElements();
        }else if (this._edit !== null){
            // An edit is requested
            this._updateVisibleElementsForEdit(this._edit);
            this._edit = null;
        }else if (this._hasPreparedLayout){
            // If we've already prepared the layout once, we need to re-prepare
            // - prepare the layout
            // - update container size
            // - update visible elements
            this.collectionViewLayout.prepare();
            this._hasPreparedLayout = true;
            this.contentSize = this.collectionViewLayout.collectionViewContentSize;
            this._elementsContainerView.untransformedFrame = JSRect(JSPoint.Zero, this.contentSize);
            this._updateVisibleElements();
        }
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

    _editAnimator: null,

    _updateVisibleElementsForEdit: function(edit){
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

        var deletedElements = [];
        var deletedAnimations = [];
        var invisibleElements = [];

        var i, l;
        var elementIndex;
        var deletedSection;
        var deletedIndexPath;
        var elements = this._visibleElements;
        var element;

        // find deleted elements and remove from this._visibleElements
        elementIndex = elements.length - 1;
        for (i = edit.deletedSections.length - 1; i >= 0; --i){
            deletedSection = edit.deletedSections[i];
            while (elementIndex >= 0 && (elements[elementIndex].attributes.indexPath.length === 0 || elements[elementIndex].attributes.indexPath.section > deletedSection.section)){
                --elementIndex;
            }
            while (elementIndex >= 0 && elements[elementIndex].attributes.indexPath.section === deletedSection.section){
                element = elements[elementIndex];
                deletedElements.push(element);
                deletedAnimations.push(deletedSection.animation);
                elements.splice(elementIndex, 1);
                --elementIndex;
            }
        }
        elementIndex = elements.length - 1;
        for (i = edit.deletedIndexPaths.length - 1; i >= 0; --i){
            deletedIndexPath = edit.deletedIndexPaths[i];
            while (elementIndex >= 0 && (elements[elementIndex].attributes.elementCategory !== UICollectionView.ElementCategory.cell || elements[elementIndex].attributes.indexPath.isGreaterThan(deletedIndexPath.indexPath))){
                --elementIndex;
            }
            if (elementIndex >= 0 && elements[elementIndex].attributes.indexPath.isEqual(deletedIndexPath.indexPath)){
                element = elements[elementIndex];
                deletedElements.push(element);
                deletedAnimations.push(deletedIndexPath.animation);
                elements.splice(elementIndex, 1);
                --elementIndex;
            }
        }

        var visibleRect;
        var dy;
        var attrs;

        var previousElements = [];
        var previoiusElementsMap = {};
        if (deletedElements.length > 0){
            // We're deleting at least one element, which means we may animate
            // into view a previously invisble element.  We'd like it to animate
            // from it's previous position, which is not currently recorded.
            // So, before preparing the new layout, we'll grab attributes for
            // about a page worth of elements before and after the currently
            // visible elements.
            //
            // Note: when deleting a large number of elements, this expanded
            // attribute query won't be enough.  For now, we'll say "oh well".
            //
            // Possible alternate solution: require layout implementations to
            // be copyable so we can make a copy of the previously prepared
            // layout and query individually if needed
            visibleRect = JSRect(this.contentView.bounds);
            dy = Math.min(visibleRect.origin.y, visibleRect.size.height);
            visibleRect.origin.y -= dy;
            visibleRect.size.height += dy + visibleRect.size.height;
            attrs = this.collectionViewLayout.layoutAttributesForElementsInRect(visibleRect);
            for (i = 0, l = attrs.length; i < l; ++i){
                element = VisibleElement(attrs[i].copy());
                previousElements.push(element);
            }
            // remove deleted items from previousElements
            elementIndex = previousElements.length - 1;
            for (i = edit.deletedSections.length - 1; i >= 0; --i){
                deletedSection = edit.deletedSections[i];
                while (elementIndex >= 0 && (previousElements[elementIndex].attributes.indexPath.length === 0 || previousElements[elementIndex].attributes.indexPath.section > deletedSection.section)){
                    --elementIndex;
                }
                while (elementIndex >= 0 && previousElements[elementIndex].attributes.indexPath.section === deletedSection.section){
                    element = previousElements[elementIndex];
                    previousElements.splice(elementIndex, 1);
                    --elementIndex;
                }
            }
            elementIndex = previousElements.length - 1;
            for (i = edit.deletedIndexPaths.length - 1; i >= 0; --i){
                deletedIndexPath = edit.deletedIndexPaths[i];
                while (elementIndex >= 0 && (previousElements[elementIndex].attributes.elementCategory !== UICollectionView.ElementCategory.cell || previousElements[elementIndex].attributes.indexPath.isGreaterThan(deletedIndexPath.indexPath))){
                    --elementIndex;
                }
                if (elementIndex >= 0 && previousElements[elementIndex].attributes.indexPath.isEqual(deletedIndexPath.indexPath)){
                    element = previousElements[elementIndex];
                    previousElements.splice(elementIndex, 1);
                    --elementIndex;
                }
            }
            this._updateVisibleElementIndexPathsForEdit(previousElements, edit);
            for (i = 0, l = previousElements.length; i < l; ++i){
                element = previousElements[i];
                previoiusElementsMap[element.attributes.elementIdentifier] = element;
            }
        }

        this.collectionViewLayout.prepare();
        this._hasPreparedLayout = true;

        // Update index paths of remaining visible elements
        this._updateVisibleElementIndexPathsForEdit(elements, edit);
        this._updateSelectedIndexPathsForEdit(edit);
        if (edit.didDeleteSelectedItem){
            this._updateSelectedIndexPaths({notifyDelegate: true});
        }

        // Try to stay in the same place visually by adjusting the content offset
        var contentOffset = JSPoint(this.contentOffset);
        if (elements.length > 0){
            // If we're at the top, stay there.  Otherwise, keep the fist element in view
            if (contentOffset.y > 0){
                element = elements[0];
                attrs = this.collectionViewLayout.layoutAttributesForElement(element);
                contentOffset.y += attrs.frame.origin.y - element.attributes.frame.origin.y;
            }
        }
        // sanitize the offset as UIScrollView will
        var minContentOffset = JSPoint(-this.contentInsets.left, -this.contentInsets.top);
        var maxContentOffset = JSPoint(
            Math.max(minContentOffset.x, this.collectionViewLayout.collectionViewContentSize.width + this.contentInsets.right - this.contentView.bounds.size.width),
            Math.max(minContentOffset.y, this.collectionViewLayout.collectionViewContentSize.height + this.contentInsets.bottom - this.contentView.bounds.size.height)
        );
        contentOffset.x = Math.round(contentOffset.x);
        contentOffset.y = Math.round(contentOffset.y);
        if (contentOffset.x < minContentOffset.x){
            contentOffset.x = minContentOffset.x;
        }else if (contentOffset.x > maxContentOffset.x){
            contentOffset.x = maxContentOffset.x;
        }
        if (contentOffset.y < minContentOffset.y){
            contentOffset.y = minContentOffset.y;
        }else if (contentOffset.y > maxContentOffset.y){
            contentOffset.y = maxContentOffset.y;
        }

        // Get the attributes for the elements that should be visible in the post-edit view
        visibleRect = JSRect(contentOffset, this.contentView.bounds.size);

        // Check if a scroll is requested
        var rect;
        if (edit.scroll !== null){
            rect = this.rectForCellAtIndexPath(edit.scroll.indexPath);
            // If we can't handle it, just do a full reload
            if (edit.scroll.position !== UIScrollView.ScrollPosition.auto || !visibleRect.intersectsRect(rect)){
                // bail the edit and just do a regular reload
                for (i = 0, l = deletedElements.length; i < l; ++i){
                    this._enqueueVisibleElement(deletedElements[i]);
                }
                for (i = 0, l = elements.length; i < l; ++i){
                    this._enqueueVisibleElement(elements[i]);
                }
                this._visibleElements = [];
                this.contentSize = this.collectionViewLayout.collectionViewContentSize;
                this._elementsContainerView.untransformedFrame = JSRect(JSPoint.Zero, this.contentSize);
                this.scrollToRect(rect, edit.scroll.position);
                this._updateVisibleElements();
                return;
            }
        }


        var visibleElementMap = {};
        var attributes = this.collectionViewLayout.layoutAttributesForElementsInRect(visibleRect);
        for (i = 0, l = attributes.length; i < l; ++i){
            attrs = attributes[i];
            visibleElementMap[attrs.elementIdentifier] = null;
        }

        // find any elements that will become invisible and remove them from this._visibleElements,
        // but don't queue them for reuse yet because they need to animate out of view
        for (elementIndex = elements.length - 1; elementIndex >= 0; --elementIndex){
            element = elements[elementIndex];
            if (element.attributes.elementIdentifier in visibleElementMap){
                visibleElementMap[element.attributes.elementIdentifier] = element;
            }else{
                element.attributes = this.collectionViewLayout.layoutAttributesForElement(element);
                invisibleElements.push(element);
                elements.splice(elementIndex, 1);
            }
        }

        // Create elements that are newly visible
        var insertedSection;
        var insertedIndexPath;
        var insertedSectionSearcher = JSBinarySearcher(edit.insertedSections, function(a, b){
            return a.section - b.section;
        });
        var insertedIndexPathSearcher = JSBinarySearcher(edit.insertedIndexPaths, function(a, b){
            return a.indexPath.compare(b.indexPath);
        });
        var animation;
        elementIndex = 0;
        var insertedElements = [];
        var insertedAnimations = [];
        for (i = 0, l = attributes.length; i < l; ++i){
            attrs = attributes[i];
            element = visibleElementMap[attrs.elementIdentifier];
            if (element === null){
                element = VisibleElement(attrs);
                this._createViewForVisibleElement(element);
                elements.splice(elementIndex, 0, element);
                if (elementIndex < elements.length - 1){
                    this._elementsContainerView.insertSubviewBelowSibling(element.view, elements[elementIndex + 1].view);
                }else{
                    this._elementsContainerView.addSubview(element.view);
                }
                insertedSection = insertedSectionSearcher.itemMatchingValue({section: attrs.indexPath.section});
                insertedIndexPath = insertedIndexPathSearcher.itemMatchingValue({indexPath: attrs.indexPath});
                if (insertedSection !== null || insertedIndexPath !== null){
                    if (insertedSection !== null){
                        animation = insertedSection.animation;
                    }else{
                        animation = insertedIndexPath.animation;
                    }
                    insertedElements.push(element);
                    insertedAnimations.push(animation);
                }else{
                    // This was a previously invisible item.
                    // Ideally we'd animate it from its previous position,
                    // but we if don't have that information, so we'll just fade
                    // it in.
                    if (element.attributes.elementIdentifier in previoiusElementsMap){
                        element.attributes = previoiusElementsMap[element.attributes.elementIdentifier].attributes;
                        element.view.applyAttributes(element.attributes);
                        element.attributes = attrs;
                    }else{
                        element.attributes = attrs;
                        element.view.applyAttributes(attrs);
                        element.view.alpha = 0;
                    }
                }
            }else{
                element.attributes = attrs;
            }
            ++elementIndex;
        }

        // Order deleted views behind all others
        for (i = 0, l = deletedElements.length; i < l; ++i){
            element = deletedElements[i];
            element.view.superview.insertSubviewAtIndex(element.view, i);
        }

        // calculate transforms for deleted elements
        var deletedPath = JSPath.init();
        for (i = 0, l = deletedElements.length; i < l; ++i){
            element = deletedElements[i];
            animation = deletedAnimations[i];
            if (animation === UICollectionView.CellAnimation.left || animation === UICollectionView.CellAnimation.right){
                deletedPath.addRect(element.attributes.frame);
            }
        }

        // calculate & apply transforms to inserted elements
        var insertedPath = JSPath.init();
        for (i = 0, l = insertedElements.length; i < l; ++i){
            element = insertedElements[i];
            animation = insertedAnimations[i];
            if (animation === UICollectionView.CellAnimation.left || animation === UICollectionView.CellAnimation.right){
                insertedPath.addRect(element.attributes.frame);
            }
        }
        for (i = 0, l = insertedElements.length; i < l; ++i){
            element = insertedElements[i];
            animation = insertedAnimations[i];
            element.view.alpha = 0;
            if (animation === UICollectionView.CellAnimation.scale){
                element.view.transform = JSAffineTransform.Scaled(0.1);
            }else if (animation === UICollectionView.CellAnimation.left){
                element.view.transform = JSAffineTransform.Translated(-insertedPath.boundingRect.size.width, 0);
            }else if (animation === UICollectionView.CellAnimation.right){
                element.view.transform = JSAffineTransform.Translated(insertedPath.boundingRect.size.width, 0);
            }
        }

        var animations = function(){
            this.contentSize = this.collectionViewLayout.collectionViewContentSize;
            this.contentOffset = contentOffset;
            this._elementsContainerView.untransformedFrame = JSRect(JSPoint.Zero, this.contentSize);
            var i, l;
            var element;
            var animation;
            // move visible items to new place
            for (i = 0, l = this._visibleElements.length; i < l; ++i){
                element = this._visibleElements[i];
                element.view.alpha = 1;
                element.view.applyAttributes(element.attributes);
            }
            // move invisible elements to new postion (out of view)
            for (i = 0, l = invisibleElements.length; i < l; ++i){
                element = invisibleElements[i];
                element.view.applyAttributes(element.attributes);
            }
            // animate out deleted elements according to requested animation
            for (i = 0, l = deletedElements.length; i < l; ++i){
                element = deletedElements[i];
                animation = deletedAnimations[i];
                element.view.alpha = 0;
                if (animation === UICollectionView.CellAnimation.scale){
                    element.view.transform = JSAffineTransform.Scaled(0.1);
                }else if (animation === UICollectionView.CellAnimation.left){
                    element.view.transform = JSAffineTransform.Translated(-deletedPath.boundingRect.size.width, 0);
                }else if (animation === UICollectionView.CellAnimation.right){
                    element.view.transform = JSAffineTransform.Translated(deletedPath.boundingRect.size.width, 0);
                }
            }
        };
        var completeAnimations = function(){
            var i, l;
            var element;
            for (i = 0, l = invisibleElements.length; i < l; ++i){
                element = invisibleElements[i];
                element.view.alpha = 1;
                this._enqueueVisibleElement(element);
            }
            for (i = 0, l = deletedElements.length; i < l; ++i){
                element = deletedElements[i];
                element.view.alpha = 1;
                this._enqueueVisibleElement(element);
            }
            this._removeQueuedCells();
            this._removeQueuedViews();
            if (edit.reloadIndexPaths.length > 0){
                this.reloadCellsAtIndexPaths(edit.reloadIndexPaths);
            }
        };
        if (edit.animated !== null){
            if (this._editAnimator !== null){
                this._editAnimator.stopAndCallCompletions();
            }
            this._editAnimator = UIViewPropertyAnimator.initWithDuration(this.editAnimationDuration);
            this._editAnimator.addAnimations(animations, this);
            this._editAnimator.addCompletion(completeAnimations, this);
            this._editAnimator.addCompletion(function(){
                this._editAnimator = null;
            }, this);
            this._editAnimator.start();
        }else{
            animations.call(this);
            completeAnimations.call(this);
        }
    },

    _updateVisibleElementIndexPathsForEdit: function(elements, edit){
        var elementCount = elements.length;
        var elementIndex = 0;
        var i, l;
        var j;
        var indexPath;
        var info;
        var element;

        // account for deleted index paths
        elementIndex = elements.length - 1;
        for (i = edit.deletedIndexPaths.length - 1; i >= 0; --i){
            info = edit.deletedIndexPaths[i];
            while (elementIndex >= 0 && (elements[elementIndex].attributes.elementCategory !== UICollectionView.ElementCategory.cell || elements[elementIndex].attributes.indexPath.isGreaterThan(info.indexPath))){
                --elementIndex;
            }
            for (j = elementIndex + 1; j < elementCount && (elements[j].attributes.elementCategory !== UICollectionView.ElementCategory.cell || elements[j].attributes.indexPath.section === info.indexPath.section); ++j){
                if (elements[j].attributes.elementCategory === UICollectionView.ElementCategory.cell){
                    elements[j].attributes.indexPath.row -= 1;
                }
            }
        }

        // account for deleted sections
        elementIndex = elements.length - 1;
        for (i = edit.deletedSections.length - 1; i >= 0; --i){
            info = edit.deletedSections[i];
            while (elementIndex >= 0 && (elements[elementIndex].attributes.indexPath.length === 0 || elements[elementIndex].attributes.indexPath.section > info.section)){
                --elementIndex;
            }
            for (j = elementIndex + 1; j < elementCount; ++j){
                elements[j].attributes.indexPath.section -= 1;
            }
        }

        // account for inserted sections
        elementIndex = 0;
        for (i = 0, l = edit.insertedSections.length; i < l; ++i){
            info = edit.insertedSections[i];
            while (elementIndex < elementCount && (elements[elementIndex].attributes.indexPath.length === 0 || elements[elementIndex].attributes.indexPath.section < info.section)){
                ++elementIndex;
            }
            for (j = elementIndex; j < elementCount; ++j){
                elements[j].attributes.indexPath.section += 1;
            }
        }

        // account for inserted index paths
        elementIndex = 0;
        for (i = 0, l = edit.insertedIndexPaths.length; i < l; ++i){
            info = edit.insertedIndexPaths[i];
            while (elementIndex < elementCount && (elements[elementIndex].attributes.elementCategory !== UICollectionView.ElementCategory.cell || elements[elementIndex].attributes.indexPath.isLessThan(info.indexPath))){
                ++elementIndex;
            }
            for (j = elementIndex; j < elementCount && (elements[j].attributes.elementCategory !== UICollectionView.ElementCategory.cell || elements[j].attributes.indexPath.section === info.indexPath.section); ++j){
                if (elements[j].attributes.elementCategory === UICollectionView.ElementCategory.cell){
                    elements[j].attributes.indexPath.row += 1;
                }
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
        cell.collectionView = this;
        cell.applyAttributes(attributes);
        cell.prepareForReuse();
        this._updateCellState(cell);
        cell.update();
        cell.setNeedsLayout();
        return cell;
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
        view.prepareForReuse();
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
        this._contextSelectCell(cell, location);
    },

    _contextSelectCell: function(cell, location){
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
            var indexPaths = [];
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
                            indexPaths.push(indexPath);
                        }
                    }
                }else{
                    if (this.delegate && this.delegate.pasteboardItemsForCollectionViewAtIndexPath){
                        cellItems = this.delegate.pasteboardItemsForCollectionViewAtIndexPath(this, cell.indexPath);
                        if (cellItems !== null){
                            dragItems = cellItems;
                        }
                        indexPaths.push(cell.indexPath);
                    }
                }
            }
            if (dragItems.length > 0){
                var session = this.beginDraggingSessionWithItems(dragItems, event);
                if (this.delegate && this.delegate.collectionViewWillBeginDraggingSession){
                    this.delegate.collectionViewWillBeginDraggingSession(this, session, indexPaths, location);
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

    _makeTouchActiveCell: function(touch, waitForLongPress){
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
        UICollectionView.$super.touchesBegan.call(this, touches, event);
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
        UICollectionView.$super.touchesMoved.call(this, touches, event);
        if (this._touch !== null){
            var location = touches[0].locationInWindow;
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

    // ----------------------------------------------------------------------
    // MARK: - Drag Destination

    draggingEntered: function(session){
        if (this.delegate && this.delegate.collectionViewDraggingSessionDidEnter){
            this.delegate.collectionViewDraggingSessionDidEnter(this, session);
        }
        return UIDragOperation.none;
    },

    draggingUpdated: function(session){
        var location = this.convertPointFromScreen(session.screenLocation);
        var indexPath = null;
        var cell = this._cellHitTest(location);
        if (cell !== null){
            indexPath = cell.indexPath;
        }
        var operation = UIDragOperation.none;
        if (this.delegate && this.delegate.collectionViewDraggingSessionDidUpdate){
            operation = this.delegate.collectionViewDraggingSessionDidUpdate(this, session, indexPath);
        }
        if (operation === UIDragOperation.none){
            this._updateDropTarget(null);
        }else{
            this._updateDropTarget(cell);
        }
        return operation;
    },

    draggingExited: function(session){
        this._updateDropTarget(null);
        if (this.delegate && this.delegate.collectionViewDraggingSessionDidExit){
            this.delegate.collectionViewDraggingSessionDidExit(this, session);
        }
    },

    performDragOperation: function(session, operation){
        var location = this.convertPointFromScreen(session.screenLocation);
        var cell = this._cellHitTest(location);
        var indexPath = null;
        if (cell !== null){
            indexPath = cell.indexPath;
        }
        this._updateDropTarget(null);
        if (this.delegate && this.delegate.collectionViewPerformDragOperation){
            this.delegate.collectionViewPerformDragOperation(this, session, operation, indexPath);
        }
    },

    _updateDropTarget: function(cell){
        var i, l;
        var item;
        for (i = 0, l = this._visibleElements.length; i < l; ++i){
            item = this._visibleElements[i];
            if (item.attributes.elementCategory === UICollectionView.ElementCategory.cell){
                item.view.dropTarget = item.view === cell;
            }
        }
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
        var element;
        var locationInSubview;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            element = this._visibleElements[i];
            locationInSubview = this.convertPointToView(location, element.view);
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell && element.view.containsPoint(locationInSubview)){
                return element.view;
            }
        }
        return null;
    },

    cellAtIndexPath: function(indexPath){
        var element;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            element = this._visibleElements[i];
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell && element.view.indexPath.isEqual(indexPath)){
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
        var element;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            element = this._visibleElements[i];
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell){
                indexPaths.push(element.attributes.indexPath);
            }
        }
        return indexPaths;
    },

    visibleCells: JSReadOnlyProperty(),

    getVisibleCells: function(){
        var cells = [];
        var element;
        for (var i = 0, l = this._visibleElements.length; i < l; ++i){
            element = this._visibleElements[i];
            if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell){
                cells.push(element.view);
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
        if (this._edit !== null){
            this._edit.scroll = {indexPath: JSIndexPath(indexPath), position: position};
        }else{
            this.layoutIfNeeded();
            var rect = this.rectForCellAtIndexPath(indexPath);
            if (rect !== null){
                this.scrollToRect(rect, position);
            }
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

UICollectionView.CellAnimation = {
    none: 0,
    default: 1,
    scale: 2,
    left: 3,
    right: 4
};

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
};

VisibleElement.prototype = Object.create(Function.prototype, {

    attributes: {value: null, writable: true},
    view: { value: null, writable: true },

});

})();