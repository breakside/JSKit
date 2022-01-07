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

// #import "UICollectionViewLayout.js"
/* global UICollectionView */
"use strict";

JSClass("UICollectionViewGridLayout", UICollectionViewLayout, {

    init: function(){
        this._collectionInsets = JSInsets.Zero;
        this.sectionInsets = JSInsets.Zero;
        this.cellSize = JSSize(50, 50);
    },

    initWithSpec: function(spec){
        UICollectionViewGridLayout.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("collectionInsets")){
            this._collectionInsets = spec.valueForKey("collectionInsets", JSInsets);
        }else{
            this._collectionInsets = JSInsets.Zero;
        }
        if (spec.containsKey("collectionHeaderHeight")){
            this._collectionHeaderHeight = spec.valueForKey("collectionHeaderHeight", Number);
        }
        if (spec.containsKey("collectionFooterHeight")){
            this._collectionFooterHeight = spec.valueForKey("collectionFooterHeight", Number);
        }
        if (spec.containsKey("sectionInsets")){
            this._sectionInsets = spec.valueForKey("sectionInsets", JSInsets);
        }else{
            this._sectionInsets = JSInsets.Zero;
        }
        if (spec.containsKey("sectionSpacing")){
            this._sectionSpacing = spec.valueForKey("sectionSpacing", Number);
        }
        if (spec.containsKey("sectionHeaderHeight")){
            this._sectionHeaderHeight = spec.valueForKey("sectionHeaderHeight", Number);
        }
        if (spec.containsKey("sectionFooterHeight")){
            this._sectionFooterHeight = spec.valueForKey("sectionFooterHeight", Number);
        }
        if (spec.containsKey("columnSpacing")){
            this._columnSpacing = spec.valueForKey("columnSpacing", Number);
        }
        if (spec.containsKey("rowSpacing")){
            this._rowSpacing = spec.valueForKey("rowSpacing", Number);
        }
        if (spec.containsKey("cellSize")){
            this._cellSize = spec.valueForKey("cellSize", JSSize);
        }else{
            this._cellSize = JSSize.Zero;
        }
    },

    collectionInsets: JSDynamicProperty("_collectionInsets", null),
    collectionHeaderHeight: JSDynamicProperty("_collectionHeaderHeight", 0),
    collectionFooterHeight: JSDynamicProperty("_collectionFooterHeight", 0),
    showsSectionBackgroundViews: JSDynamicProperty("_showsSectionBackgroundViews", false),
    sectionInsets: JSDynamicProperty("_sectionInsets", null),
    sectionSpacing: JSDynamicProperty("_sectionSpacing", 0),
    sectionHeaderHeight: JSDynamicProperty("_sectionHeaderHeight", 0),
    sectionFooterHeight: JSDynamicProperty("_sectionFooterHeight", 0),
    columnSpacing: JSDynamicProperty("_columnSpacing", 1),
    rowSpacing: JSDynamicProperty("_rowSpacing", 1),
    cellSize: JSDynamicProperty("_cellSize", null),

    setCollectionInsets: function(collectionInsets){
        this._collectionInsets = JSInsets(collectionInsets);
        this.invalidateLayout();
    },

    setCollectionHeaderHeight: function(collectionHeaderHeight){
        this._collectionHeaderHeight = collectionHeaderHeight;
        this.invalidateLayout();
    },

    setCollectionFooterHeight: function(collectionFooterHeight){
        this._collectionFooterHeight = collectionFooterHeight;
        this.invalidateLayout();
    },

    setShowsSectionBackgroundViews: function(showsSectionBackgroundViews){
        this._showsSectionBackgroundViews = showsSectionBackgroundViews;
        this.invalidateLayout();
    },

    setSectionInsets: function(sectionInsets){
        this._sectionInsets = JSInsets(sectionInsets);
        this.invalidateLayout();
    },

    setSectionSpacing: function(sectionSpacing){
        this._sectionSpacing = sectionSpacing;
        this.invalidateLayout();
    },

    setSectionHeaderHeight: function(sectionHeaderHeight){
        this._sectionHeaderHeight = sectionHeaderHeight;
        this.invalidateLayout();
    },

    setSectionFooterHeight: function(sectionFooterHeight){
        this._sectionFooterHeight = sectionFooterHeight;
        this.invalidateLayout();
    },

    setColumnSpacing: function(columnSpacing){
        this._columnSpacing = columnSpacing;
        this.invalidateLayout();
    },

    setRowSpacing: function(rowSpacing){
        this._rowSpacing = rowSpacing;
        this.invalidateLayout();
    },

    setItemSize: function(cellSize){
        this._cellSize = JSSize(cellSize);
        this.invalidateLayout();
    },

    invalidateLayout: function(){
        if (this.collectionView === null){
            return;
        }
        this.collectionView.setNeedsLayout();
    },

    _cachedLayout: null,

    prepare: function(){
        this._cachedLayout = {
            sections: [],
            columns: [],
            headerFrame: JSRect.Zero,
            footerFrame: JSRect.Zero,
            contentSize: JSSize.Zero
        };
        if (this.collectionView === null){
            return;
        }
        this._cachedLayout.contentSize.width = this.collectionView.bounds.size.width;
        this._cachedLayout.contentSize.height += this._collectionInsets.height + this._collectionHeaderHeight + this._collectionFooterHeight;
        var availableWidth = this._cachedLayout.contentSize.width - this._collectionInsets.width - this._sectionInsets.width;
        var columnCount = Math.floor(availableWidth / this._cellSize.width);
        var columnIndex;
        var x = this._collectionInsets.left + this._sectionInsets.left;
        for (columnIndex = 0; columnIndex < columnCount; ++columnIndex){
            this._cachedLayout.columns.push({x: x});
            x += this._cellSize.width + this._columnSpacing;
        }
        var sectionCount = this.collectionView.dataSource.numberOfSectionsInCollectionView(this.collectionView);
        var cellCount;
        var sectionIndex;
        var sectionLayout;
        var origin = JSPoint(this._collectionInsets.top, this._collectionInsets.left);
        var size = JSSize(availableWidth, 0);
        var rowCount;
        var rowOffset = 0;
        for (sectionIndex = 0; sectionIndex < sectionCount; ++sectionIndex){
            cellCount = this.collectionView.dataSource.numberOfRowsInCollectionViewSection(this.collectionView, sectionIndex);
            rowCount = Math.ceil(cellCount / columnCount);
            size.height = this._sectionInsets.height + this._sectionHeaderHeight + this._sectionFooterHeight;
            size.height += rowCount * this._cellSize.height + (rowCount - 1) * this._rowSpacing;
            this._cachedLayout.sections.push({
                rowOffset: rowOffset,
                cellCount: cellCount,
                rowCount: rowCount,
                frame: JSRect(origin, size),
                headerFrame: JSRect(
                    origin.x + this._sectionInsets.left,
                    origin.y + this._sectionInsets.top,
                    availableWidth,
                    this._sectionHeaderHeight
                ),
                footerFrame: JSRect(
                    origin.x + this._sectionInsets.left,
                    origin.y + size.height - this._sectionInsets.bottom - this._sectionFooterHeight,
                    availableWidth,
                    this._sectionFooterHeight
                ),
                cellsFrame: JSRect(
                    origin.x + this._sectionInsets.left,
                    origin.y + this._sectionInsets.top + this._sectionHeaderHeight,
                    availableWidth,
                    size.height - this._sectionInsets.height - this._sectionHeaderHeight - this._sectionFooterHeight
                )
            });
            this._cachedLayout.contentSize.height += size.height;
            if (sectionIndex < sectionCount - 1){
                this._cachedLayout.contentSize.height += this._sectionSpacing;
            }
            origin.y += size.height + this._sectionSpacing;
            rowOffset += rowCount;
        }
        this._cachedLayout.headerFrame = JSRect(
            this._collectionInsets.left,
            this._collectionInsets.top,
            this._cachedLayout.contentSize.width - this._collectionInsets.width,
            this._collectionHeaderHeight
        );
        this._cachedLayout.footerFrame = JSRect(
            this._collectionInsets.left,
            this._cachedLayout.contentSize.height - this._collectionInsets.bottom - this._collectionFooterHeight,
            this._cachedLayout.contentSize.width - this._collectionInsets.width,
            this._collectionFooterHeight
        );
    },

    getContentViewCollectionSize: function(){
        return this._cachedLayout.contentSize;
    },

    layoutAttributesForElementsInRect: function(rect){
        var attributes = [];
        if (this._cachedLayout.headerFrame.size.height > 0 && rect.intersectsRect(this._cachedLayout.headerFrame)){
            attributes.push(this.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([]), UICollectionViewGridLayout.SupplimentaryIdentifier.header));
        }
        var columnCount = this._cachedLayout.columns.length;
        var columnIndex;
        var sectionIndex;
        var sectionCount = this._cachedLayout.sections.length;
        var sectionLayout;
        var indexPath;
        var y;
        var y0 = rect.origin.y;
        var y1 = rect.origin.y + rect.size.height;
        var rowHeight = this._cellSize.height + this._rowSpacing;
        var rowIndex;
        // FIXME: can do a more efficient search of sections
        for (sectionIndex = 0; sectionIndex < sectionCount; ++sectionIndex){
            sectionLayout = this._cachedLayout.sections[sectionIndex];
            if (sectionLayout.frame.size.height > 0 && rect.intersectsRect(sectionLayout.frame)){
                if (this._showsSectionBackgroundViews){
                    attributes.push(this.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath(sectionIndex), UICollectionViewGridLayout.SupplimentaryIdentifier.background));
                }
                if (sectionLayout.headerFrame.size.height > 0 && rect.intersectsRect(sectionLayout.headerFrame)){
                    attributes.push(this.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath(sectionIndex), UICollectionViewGridLayout.SupplimentaryIdentifier.header));
                }
                if (sectionLayout.cellsFrame.size.height > 0 && rect.intersectsRect(sectionLayout.cellsFrame)){
                    indexPath = JSIndexPath(sectionIndex, 0);
                    y = sectionLayout.cellsFrame.origin.y;
                    rowIndex = Math.max(0, Math.floor(y0 - y));
                    y += rowIndex * rowHeight;
                    for (; rowIndex < sectionLayout.rowCount && y < y1; ++rowIndex, y += rowHeight){
                        for (columnIndex = 0; columnIndex < columnCount && indexPath.row < sectionLayout.cellCount; ++columnIndex, ++indexPath.row){
                            attributes.push(UICollectionViewLayoutAttributes.initCellAtIndexPath(indexPath, JSRect(
                                this._cachedLayout.columns[columnIndex].x,
                                y,
                                this._cellSize.width,
                                this._cellSize.height
                            )));
                        }
                    }
                }
                if (sectionLayout.footerFrame.size.height > 0 && rect.intersectsRect(sectionLayout.footerFrame)){
                    attributes.push(this.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath(sectionIndex), UICollectionViewGridLayout.SupplimentaryIdentifier.footer));
                }
            }
        }
        if (this._cachedLayout.footerFrame.size.height > 0 && rect.intersectsRect(this._cachedLayout.footerFrame)){
            attributes.push(this.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([]), UICollectionViewGridLayout.SupplimentaryIdentifier.footer));
        }
        return attributes;
    },

    layoutAttributesForCellAtIndexPath: function(indexPath){
        var sectionLayout = this._cachedLayout.sections[indexPath.section];
        var columnCount = this._cachedLayout.columns.length;
        var rowIndex = Math.floor(indexPath.row / columnCount);
        var columnIndex = indexPath.row % columnCount;
        var origin = JSPoint(
            this._cachedLayout.columns[columnIndex].x,
            sectionLayout.cellsFrame.origin.y + rowIndex * (this._cellSize.height + this._rowSpacing)
        );
        var frame = JSRect(
            origin,
            this._cellSize
        );
        return UICollectionViewLayoutAttributes.initCellAtIndexPath(indexPath, frame);
    },

    layoutAttributesForSupplimentaryViewAtIndexPath: function(indexPath, identifier){
        if (indexPath.length === 0){
            if (identifier === UICollectionViewGridLayout.SupplimentaryIdentifier.header){
                return UICollectionViewLayoutAttributes.initSupplimentaryAtIndexPath(indexPath, identifier, this._cachedLayout.headerFrame);
            }
            if (identifier === UICollectionViewGridLayout.SupplimentaryIdentifier.footer){
                return UICollectionViewLayoutAttributes.initSupplimentaryAtIndexPath(indexPath, identifier, this._cachedLayout.footerFrame);
            }
            return null;
        }
        if (indexPath.length === 1){
            var sectionLayout = this._cachedLayout.sections[indexPath.section];
            if (identifier === UICollectionViewGridLayout.SupplimentaryIdentifier.background){
                return UICollectionViewLayoutAttributes.initSupplimentaryAtIndexPath(indexPath, identifier, sectionLayout.frame);
            }
            if (identifier === UICollectionViewGridLayout.SupplimentaryIdentifier.header){
                return UICollectionViewLayoutAttributes.initSupplimentaryAtIndexPath(indexPath, identifier, sectionLayout.headerFrame);
            }
            if (identifier === UICollectionViewGridLayout.SupplimentaryIdentifier.footer){
                return UICollectionViewLayoutAttributes.initSupplimentaryAtIndexPath(indexPath, identifier, sectionLayout.footerFrame);
            }
            return null;
        }
        return null;
    }

});

UICollectionViewGridLayout.SupplimentaryIdentifier = {
    background: "background",
    header: "header",
    footer: "footer"
};