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

    layoutAttributesForElement: function(element){
        if (element.attributes.elementCategory === UICollectionView.ElementCategory.cell){
            return this.layoutAttributesForCellAtIndexPath(element.attributes.indexPath);
        }
        if (element.attributes.elementCategory === UICollectionView.ElementCategory.supplimentary){
            return this.layoutAttributesForSupplimentaryViewAtIndexPath(element.attributes.indexPath, element.attributes.kind);
        }
        return element.attributes;
    },

    layoutAttributesForCellAtIndexPath: function(indexPath){
    },

    layoutAttributesForSupplimentaryViewAtIndexPath: function(indexPath, kind){
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
        this.transform = JSAffineTransform.Identity;
    },

    initSupplimentaryAtIndexPath: function(indexPath, kind, frame){
        this.elementCategory = UICollectionView.ElementCategory.supplimentary;
        this.kind = kind;
        this.indexPath = JSIndexPath(indexPath);
        this.frame = JSRect(frame);
        this.transform = JSAffineTransform.Identity;
    },

    copy: function(){
        var copy = this.$class.init();
        copy.elementCategory = this.elementCategory;
        copy.kind = this.kind;
        copy.indexPath = JSIndexPath(this.indexPath);
        copy.frame = JSRect(this.frame);
        copy.rowIndex = this.rowIndex;
        copy.columnIndex = this.columnIndex;
        copy.transform  = JSAffineTransform(this.transform);
        return copy;
    },

    elementCategory: 0,
    kind: null,
    indexPath: null,
    frame: null,
    rowIndex: 0,
    columnIndex: 0,
    transform: null,
    zIndex: 0,

    elementIdentifier: JSReadOnlyProperty(),

    getElementIdentifier: function(){
        if (this.elementCategory === UICollectionView.ElementCategory.cell){
            return this.indexPath.toString();
        }
        if (this.elementCategory === UICollectionView.ElementCategory.supplimentary){
            return "%s/%s".sprintf(this.kind, this.indexPath.toString());
        }
        return "%s/%s/%s".sprintf(this.elementCategory, this.kind, this.indexPath.toString());
    },

});