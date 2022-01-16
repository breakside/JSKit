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
/* global UICollectionView */
"use strict";

JSClass("UICollectionViewLayout", JSObject, {

    collectionView: null,
    collectionViewContentSize: JSReadOnlyProperty(),

    prepare: function(){
    },

    getCollectionViewContentSize: function(){
        return JSSize.Zero;
    },

    layoutAttributesForElementsInRect: function(rect){
    },

    layoutAttributesForCellAtIndexPath: function(indexPath){
    },

    layoutAttributesForSupplimentaryViewAtIndexPath: function(indexPath){
    },

    shouldInvalidateLayoutForBounds: function(bounds){
        return true;
    },

    invalidateLayout: function(){
        if (this.collectionView === null){
            return;
        }
        this.collectionView.setNeedsLayout();
    },

});

JSClass("UICollectionViewLayoutAttributes", JSObject, {

    initCellAtIndexPath: function(indexPath, frame){
        this.elementCategory = UICollectionView.ElementCategory.cell;
        this.indexPath = JSIndexPath(indexPath);
        this.frame = JSRect(frame);
        this.elementIdentifier = indexPath.toString();
        this.transform = JSAffineTransform.Identity;
    },

    initSupplimentaryAtIndexPath: function(indexPath, kind, frame){
        this.elementCategory = UICollectionView.ElementCategory.supplimentary;
        this.kind = kind;
        this.indexPath = JSIndexPath(indexPath);
        this.frame = JSRect(frame);
        this.elementIdentifier = "%s/%s".sprintf(indexPath.toString(), kind);
        this.transform = JSAffineTransform.Identity;
    },

    elementCategory: 0,
    kind: null,
    indexPath: null,
    frame: null,
    rowIndex: 0,
    columnIndex: 0,
    elementIdentifier: null,
    transform: null,

});