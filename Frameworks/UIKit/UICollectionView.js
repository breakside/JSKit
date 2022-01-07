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
"use strict";

JSProtocol("UICollectionViewDelegate", JSProtocol, {

    // Selection
    collectionViewShouldSelectCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewDidSelectCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewDidFinishSelectingCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewDidOpenCellAtIndexPath: function(collectionView, indexPath){},
    collectionViewSelectionDidChange: function(collectionView, selectedIndexPaths){},

    // Context menu
    menuForCollectionViewCellAtIndexPath: function(collectionView, indexPath){},

    // Dragging cells
    collectionViewShouldDragCellAtIndexPath: function(collectionView, indexPath){},
    pasteboardItemsForCollectionViewAtIndexPath: function(collectionView, indexPath){},
    collectionViewWillBeginDraggingSession: function(collectionView, session){}

});

JSProtocol("UICollectionViewDataSource", JSProtocol, {

    numberOfSectionsInCollectionView: function(collectionView){},
    numberOfRowsInCollectionViewSection: function(collectionView, sectionIndex){},

    cellForCollectionViewAtIndexPath: function(collectionView, indexPath){},
    supplimentaryViewForCollectionViewAtIndexPath: function(collectionView, indexPath, identifier){}

});

JSClass("UICollectionView", UIScrollView, {

    initWithLayout: function(layout, styler){
        if (styler !== undefined){
            this._styler = styler;
        }
        UICollectionView.$super.init.call(this);
        this.collectionViewLayout = layout;
        layout.collectionView = this;
    },

    // -------------------------------------------------------------------------
    // MARK: - Data Source & Delegate

    dataSource: null,
    delegate: null,

    // -------------------------------------------------------------------------
    // MARK: - Styling

    styler: JSReadOnlyProperty("_styler", null),

    // -------------------------------------------------------------------------
    // MARK: - Layout

    collectionViewLayout: JSDynamicProperty("collectionViewLayout", null),

});

UICollectionView.ElemementCategory = {
    cell: 1,
    supplimentary: 2
};

JSClass("UICollectionViewStyler", JSObject, {

    init: function(){
    },

    initializeCollectionView: function(collectionView){
    },

    initializeCell: function(cell, indexPath){
    },

    initializeResuableView: function(view, indexPath){
    },

    updateCell: function(cell, indexPath){
    },

    layoutCell: function(cell){
    },

    updateReusableView: function(view, section){
    },

});

