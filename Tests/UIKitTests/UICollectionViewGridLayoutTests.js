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

// #import UIKit
// #import TestKit
"use strict";

JSClass("UICollectionViewGridLayoutTests", TKTestSuite, {

    testInit: function(){
        var layout = UICollectionViewGridLayout.init();
        TKAssertExactEquals(layout.collectionInsets.top, 0);
        TKAssertExactEquals(layout.collectionInsets.left, 0);
        TKAssertExactEquals(layout.collectionInsets.bottom, 0);
        TKAssertExactEquals(layout.collectionInsets.right, 0);
        TKAssertExactEquals(layout.collectionHeaderHeight, 0);
        TKAssertExactEquals(layout.collectionFooterHeight, 0);
        TKAssertExactEquals(layout.collectionHeaderSpacing, 0);
        TKAssertExactEquals(layout.collectionFooterSpacing, 0);
        TKAssertExactEquals(layout.showsSectionBackgroundViews, false);
        TKAssertExactEquals(layout.sectionSpacing, 0);
        TKAssertExactEquals(layout.sectionInsets.top, 0);
        TKAssertExactEquals(layout.sectionInsets.left, 0);
        TKAssertExactEquals(layout.sectionInsets.bottom, 0);
        TKAssertExactEquals(layout.sectionInsets.right, 0);
        TKAssertExactEquals(layout.sectionHeaderHeight, 0);
        TKAssertExactEquals(layout.sectionFooterHeight, 0);
        TKAssertExactEquals(layout.sectionHeaderSpacing, 0);
        TKAssertExactEquals(layout.sectionFooterSpacing, 0);
        TKAssertExactEquals(layout.columnSpacing, 1);
        TKAssertExactEquals(layout.rowSpacing, 1);
        TKAssertExactEquals(layout.cellSize.width, 50);
        TKAssertExactEquals(layout.cellSize.height, 50);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({});
        var layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.collectionInsets.top, 0);
        TKAssertExactEquals(layout.collectionInsets.left, 0);
        TKAssertExactEquals(layout.collectionInsets.bottom, 0);
        TKAssertExactEquals(layout.collectionInsets.right, 0);
        TKAssertExactEquals(layout.collectionHeaderHeight, 0);
        TKAssertExactEquals(layout.collectionFooterHeight, 0);
        TKAssertExactEquals(layout.collectionHeaderSpacing, 0);
        TKAssertExactEquals(layout.collectionFooterSpacing, 0);
        TKAssertExactEquals(layout.showsSectionBackgroundViews, false);
        TKAssertExactEquals(layout.sectionSpacing, 0);
        TKAssertExactEquals(layout.sectionInsets.top, 0);
        TKAssertExactEquals(layout.sectionInsets.left, 0);
        TKAssertExactEquals(layout.sectionInsets.bottom, 0);
        TKAssertExactEquals(layout.sectionInsets.right, 0);
        TKAssertExactEquals(layout.sectionHeaderHeight, 0);
        TKAssertExactEquals(layout.sectionFooterHeight, 0);
        TKAssertExactEquals(layout.sectionHeaderSpacing, 0);
        TKAssertExactEquals(layout.sectionFooterSpacing, 0);
        TKAssertExactEquals(layout.columnSpacing, 1);
        TKAssertExactEquals(layout.rowSpacing, 1);
        TKAssertExactEquals(layout.cellSize.width, 50);
        TKAssertExactEquals(layout.cellSize.height, 50);

        spec = JSSpec.initWithDictionary({
            collectionInsets: 10
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.collectionInsets.top, 10);
        TKAssertExactEquals(layout.collectionInsets.left, 10);
        TKAssertExactEquals(layout.collectionInsets.bottom, 10);
        TKAssertExactEquals(layout.collectionInsets.right, 10);

        spec = JSSpec.initWithDictionary({
            collectionInsets: "1,2,3,4"
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.collectionInsets.top, 1);
        TKAssertExactEquals(layout.collectionInsets.left, 2);
        TKAssertExactEquals(layout.collectionInsets.bottom, 3);
        TKAssertExactEquals(layout.collectionInsets.right, 4);

        spec = JSSpec.initWithDictionary({
            collectionHeaderHeight: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.collectionHeaderHeight, 12);

        spec = JSSpec.initWithDictionary({
            collectionFooterHeight: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.collectionFooterHeight, 12);

        spec = JSSpec.initWithDictionary({
            collectionHeaderSpacing: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.collectionHeaderSpacing, 12);

        spec = JSSpec.initWithDictionary({
            collectionFooterSpacing: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.collectionFooterSpacing, 12);

        spec = JSSpec.initWithDictionary({
            showsSectionBackgroundViews: true
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.showsSectionBackgroundViews, true);

        spec = JSSpec.initWithDictionary({
            sectionSpacing: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.sectionSpacing, 12);

        spec = JSSpec.initWithDictionary({
            sectionInsets: 10
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.sectionInsets.top, 10);
        TKAssertExactEquals(layout.sectionInsets.left, 10);
        TKAssertExactEquals(layout.sectionInsets.bottom, 10);
        TKAssertExactEquals(layout.sectionInsets.right, 10);

        spec = JSSpec.initWithDictionary({
            sectionInsets: "1,2,3,4"
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.sectionInsets.top, 1);
        TKAssertExactEquals(layout.sectionInsets.left, 2);
        TKAssertExactEquals(layout.sectionInsets.bottom, 3);
        TKAssertExactEquals(layout.sectionInsets.right, 4);

        spec = JSSpec.initWithDictionary({
            sectionHeaderHeight: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.sectionHeaderHeight, 12);

        spec = JSSpec.initWithDictionary({
            sectionFooterHeight: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.sectionFooterHeight, 12);

        spec = JSSpec.initWithDictionary({
            sectionHeaderSpacing: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.sectionHeaderSpacing, 12);

        spec = JSSpec.initWithDictionary({
            sectionFooterSpacing: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.sectionFooterSpacing, 12);

        spec = JSSpec.initWithDictionary({
            columnSpacing: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.columnSpacing, 12);

        spec = JSSpec.initWithDictionary({
            rowSpacing: 12
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.rowSpacing, 12);

        spec = JSSpec.initWithDictionary({
            cellSize: 123
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.cellSize.width, 123);
        TKAssertExactEquals(layout.cellSize.height, 123);

        spec = JSSpec.initWithDictionary({
            cellSize: "123,456"
        });
        layout = UICollectionViewGridLayout.initWithSpec(spec);
        TKAssertExactEquals(layout.cellSize.width, 123);
        TKAssertExactEquals(layout.cellSize.height, 456);
    },

    testPrepare: function(){
        var layout = UICollectionViewGridLayout.init();
        layout.collectionInsets = JSInsets(1, 2, 3, 4);
        layout.collectionHeaderHeight = 12;
        layout.collectionFooterHeight = 34;
        layout.collectionHeaderSpacing = 2;
        layout.collectionFooterSpacing = 5;
        layout.showsSectionBackgroundViews = true;
        layout.sectionSpacing = 8;
        layout.sectionInsets = JSInsets(5, 6, 7, 8);
        layout.sectionHeaderHeight = 21;
        layout.sectionFooterHeight = 43;
        layout.sectionHeaderSpacing = 4;
        layout.sectionFooterSpacing = 10;
        layout.columnSpacing = 3;
        layout.rowSpacing = 9;
        layout.cellSize = JSSize(45, 67);
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.bounds = JSRect(0, 0, 313, 100);
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                return 2;
            },
            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                return 10 * (sectionIndex + 1);
            }
        };
        layout.prepare();
        TKAssertExactEquals(collectionView.accessibilityRowCount, 6);
        TKAssertExactEquals(collectionView.accessibilityColumnCount, 6);
    },

    testCollectionViewContentSize: function(){
        var layout = UICollectionViewGridLayout.init();
        layout.collectionInsets = JSInsets(1, 2, 3, 4);
        layout.collectionHeaderHeight = 12;
        layout.collectionFooterHeight = 34;
        layout.collectionHeaderSpacing = 2;
        layout.collectionFooterSpacing = 5;
        layout.showsSectionBackgroundViews = true;
        layout.sectionSpacing = 8;
        layout.sectionInsets = JSInsets(5, 6, 7, 8);
        layout.sectionHeaderHeight = 21;
        layout.sectionFooterHeight = 43;
        layout.sectionHeaderSpacing = 4;
        layout.sectionFooterSpacing = 10;
        layout.columnSpacing = 3;
        layout.rowSpacing = 9;
        layout.cellSize = JSSize(45, 67);
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                return 2;
            },
            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                return 10 * (sectionIndex + 1);
            }
        };
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        var size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 313);
        TKAssertFloatEquals(size.height, 683);

        collectionView.bounds = JSRect(0, 0, 313, 1000);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 313);
        TKAssertFloatEquals(size.height, 683);

        collectionView.bounds = JSRect(0, 0, 300, 1000);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 300);
        TKAssertFloatEquals(size.height, 683);

        collectionView.bounds = JSRect(0, 0, 297, 1000);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 297);
        TKAssertFloatEquals(size.height, 683);

        collectionView.bounds = JSRect(0, 0, 296, 1000);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 296);
        TKAssertFloatEquals(size.height, 683);

        collectionView.bounds = JSRect(0, 0, 248, 1000);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 248);
        TKAssertFloatEquals(size.height, 835);

        layout.collectionHeaderHeight = 0;
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 313);
        TKAssertFloatEquals(size.height, 669);

        layout.collectionFooterHeight = 0;
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 313);
        TKAssertFloatEquals(size.height, 630);

        layout.sectionHeaderHeight = 0;
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 313);
        TKAssertFloatEquals(size.height, 580);

        layout.sectionFooterHeight = 0;
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        size = layout.collectionViewContentSize;
        TKAssertFloatEquals(size.width, 313);
        TKAssertFloatEquals(size.height, 474);
    },

    testLayoutAttributesForElementsInRect: function(){
        var layout = UICollectionViewGridLayout.init();
        layout.collectionInsets = JSInsets(1, 2, 3, 4);
        layout.collectionHeaderHeight = 12;
        layout.collectionFooterHeight = 34;
        layout.collectionHeaderSpacing = 2;
        layout.collectionFooterSpacing = 5;
        layout.showsSectionBackgroundViews = true;
        layout.sectionSpacing = 8;
        layout.sectionInsets = JSInsets(5, 6, 7, 8);
        layout.sectionHeaderHeight = 21;
        layout.sectionFooterHeight = 43;
        layout.sectionHeaderSpacing = 4;
        layout.sectionFooterSpacing = 10;
        layout.columnSpacing = 3;
        layout.rowSpacing = 9;
        layout.cellSize = JSSize(45, 67);
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                return 2;
            },
            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                return 10 * (sectionIndex + 1);
            }
        };
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        var attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 9);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 1, 307, 12));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[2].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[2].frame, JSRect(8, 20, 293, 21));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[3].frame, JSRect(8, 45, 45, 67));
        TKAssertExactEquals(attributes[3].rowIndex, 0);
        TKAssertExactEquals(attributes[3].columnIndex, 0);
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[4].frame, JSRect(56, 45, 45, 67));
        TKAssertExactEquals(attributes[4].rowIndex, 0);
        TKAssertExactEquals(attributes[4].columnIndex, 1);
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[5].frame, JSRect(104, 45, 45, 67));
        TKAssertExactEquals(attributes[5].rowIndex, 0);
        TKAssertExactEquals(attributes[5].columnIndex, 2);
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[6].frame, JSRect(152, 45, 45, 67));
        TKAssertExactEquals(attributes[6].rowIndex, 0);
        TKAssertExactEquals(attributes[6].columnIndex, 3);
        TKAssertExactEquals(attributes[7].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[7].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[7].frame, JSRect(200, 45, 45, 67));
        TKAssertExactEquals(attributes[7].rowIndex, 0);
        TKAssertExactEquals(attributes[7].columnIndex, 4);
        TKAssertExactEquals(attributes[8].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[8].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[8].frame, JSRect(248, 45, 45, 67));
        TKAssertExactEquals(attributes[8].rowIndex, 0);
        TKAssertExactEquals(attributes[8].columnIndex, 5);

        collectionView.bounds = JSRect(0, 0, 313, 121);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 9);

        collectionView.bounds = JSRect(0, 0, 313, 122);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 13);
        TKAssertExactEquals(attributes[9].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[9].indexPath, JSIndexPath(0, 6));
        TKAssertObjectEquals(attributes[9].frame, JSRect(8, 121, 45, 67));
        TKAssertExactEquals(attributes[9].rowIndex, 1);
        TKAssertExactEquals(attributes[9].columnIndex, 0);
        TKAssertExactEquals(attributes[10].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[10].indexPath, JSIndexPath(0, 7));
        TKAssertObjectEquals(attributes[10].frame, JSRect(56, 121, 45, 67));
        TKAssertExactEquals(attributes[10].rowIndex, 1);
        TKAssertExactEquals(attributes[10].columnIndex, 1);
        TKAssertExactEquals(attributes[11].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[11].indexPath, JSIndexPath(0, 8));
        TKAssertExactEquals(attributes[11].rowIndex, 1);
        TKAssertExactEquals(attributes[11].columnIndex, 2);
        TKAssertObjectEquals(attributes[11].frame, JSRect(104, 121, 45, 67));
        TKAssertExactEquals(attributes[12].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[12].indexPath, JSIndexPath(0, 9));
        TKAssertObjectEquals(attributes[12].frame, JSRect(152, 121, 45, 67));
        TKAssertExactEquals(attributes[12].rowIndex, 1);
        TKAssertExactEquals(attributes[12].columnIndex, 3);

        collectionView.bounds = JSRect(0, 0, 313, 198);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 13);

        collectionView.bounds = JSRect(0, 0, 313, 199);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 14);
        TKAssertExactEquals(attributes[13].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[13].kind, UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertObjectEquals(attributes[13].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[13].frame, JSRect(8, 198, 293, 43));

        collectionView.bounds = JSRect(0, 0, 313, 256);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 14);

        collectionView.bounds = JSRect(0, 0, 313, 257);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 15);
        TKAssertExactEquals(attributes[14].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[14].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[14].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[14].frame, JSRect(2, 256, 307, 385));

        collectionView.bounds = JSRect(0, 0, 313, 261);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 15);

        collectionView.bounds = JSRect(0, 0, 313, 262);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 16);
        TKAssertExactEquals(attributes[15].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[15].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[15].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[15].frame, JSRect(8, 261, 293, 21));

        collectionView.bounds = JSRect(0, 0, 313, 646);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 37);

        collectionView.bounds = JSRect(0, 0, 313, 647);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 38);
        TKAssertExactEquals(attributes[16].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[16].indexPath, JSIndexPath(1, 0));
        TKAssertObjectEquals(attributes[16].frame, JSRect(8, 286, 45, 67));
        TKAssertExactEquals(attributes[16].rowIndex, 2);
        TKAssertExactEquals(attributes[16].columnIndex, 0);
        TKAssertExactEquals(attributes[37].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[37].kind, UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertObjectEquals(attributes[37].indexPath, JSIndexPath([]));
        TKAssertObjectEquals(attributes[37].frame, JSRect(2, 646, 307, 34));

        collectionView.bounds = JSRect(0, 12, 313, 100);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 9);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 1, 307, 12));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[2].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[2].frame, JSRect(8, 20, 293, 21));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[3].frame, JSRect(8, 45, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[4].frame, JSRect(56, 45, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[5].frame, JSRect(104, 45, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[6].frame, JSRect(152, 45, 45, 67));
        TKAssertExactEquals(attributes[7].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[7].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[7].frame, JSRect(200, 45, 45, 67));
        TKAssertExactEquals(attributes[8].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[8].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[8].frame, JSRect(248, 45, 45, 67));

        collectionView.bounds = JSRect(0, 13, 313, 100);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 8);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(8, 20, 293, 21));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[2].frame, JSRect(8, 45, 45, 67));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[3].frame, JSRect(56, 45, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[4].frame, JSRect(104, 45, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[5].frame, JSRect(152, 45, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[6].frame, JSRect(200, 45, 45, 67));
        TKAssertExactEquals(attributes[7].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[7].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[7].frame, JSRect(248, 45, 45, 67));

        collectionView.bounds = JSRect(0, 40, 313, 50);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 8);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(8, 20, 293, 21));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[2].frame, JSRect(8, 45, 45, 67));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[3].frame, JSRect(56, 45, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[4].frame, JSRect(104, 45, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[5].frame, JSRect(152, 45, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[6].frame, JSRect(200, 45, 45, 67));
        TKAssertExactEquals(attributes[7].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[7].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[7].frame, JSRect(248, 45, 45, 67));

        collectionView.bounds = JSRect(0, 41, 313, 50);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 7);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[1].frame, JSRect(8, 45, 45, 67));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[2].frame, JSRect(56, 45, 45, 67));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[3].frame, JSRect(104, 45, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[4].frame, JSRect(152, 45, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[5].frame, JSRect(200, 45, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[6].frame, JSRect(248, 45, 45, 67));

        collectionView.bounds = JSRect(0, 240, 313, 30);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 4);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(8, 198, 293, 43));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[2].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[2].frame, JSRect(2, 256, 307, 385));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[3].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[3].frame, JSRect(8, 261, 293, 21));

        collectionView.bounds = JSRect(0, 241, 313, 30);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 3);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(2, 256, 307, 385));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[2].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[2].frame, JSRect(8, 261, 293, 21));

        collectionView.bounds = JSRect(0, 247, 313, 30);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 3);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 15, 307, 233));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(2, 256, 307, 385));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[2].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[2].frame, JSRect(8, 261, 293, 21));

        collectionView.bounds = JSRect(0, 248, 313, 30);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 2);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 256, 307, 385));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(8, 261, 293, 21));

        layout.showsSectionBackgroundViews = false;
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 8);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(2, 1, 307, 12));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[1].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[1].frame, JSRect(8, 20, 293, 21));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[2].frame, JSRect(8, 45, 45, 67));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[3].frame, JSRect(56, 45, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[4].frame, JSRect(104, 45, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[5].frame, JSRect(152, 45, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[6].frame, JSRect(200, 45, 45, 67));
        TKAssertExactEquals(attributes[7].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[7].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[7].frame, JSRect(248, 45, 45, 67));

        layout.collectionHeaderHeight = 0;
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 7);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes[0].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes[0].frame, JSRect(8, 6, 293, 21));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[1].frame, JSRect(8, 31, 45, 67));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[2].frame, JSRect(56, 31, 45, 67));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[3].frame, JSRect(104, 31, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[4].frame, JSRect(152, 31, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[5].frame, JSRect(200, 31, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[6].frame, JSRect(248, 31, 45, 67));

        layout.sectionHeaderHeight = 0;
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 10);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes[0].frame, JSRect(8, 6, 45, 67));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes[1].frame, JSRect(56, 6, 45, 67));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes[2].frame, JSRect(104, 6, 45, 67));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes[3].frame, JSRect(152, 6, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes[4].frame, JSRect(200, 6, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes[5].frame, JSRect(248, 6, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(0, 6));
        TKAssertObjectEquals(attributes[6].frame, JSRect(8, 82, 45, 67));
        TKAssertExactEquals(attributes[7].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[7].indexPath, JSIndexPath(0, 7));
        TKAssertObjectEquals(attributes[7].frame, JSRect(56, 82, 45, 67));
        TKAssertExactEquals(attributes[8].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[8].indexPath, JSIndexPath(0, 8));
        TKAssertObjectEquals(attributes[8].frame, JSRect(104, 82, 45, 67));
        TKAssertExactEquals(attributes[9].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[9].indexPath, JSIndexPath(0, 9));
        TKAssertObjectEquals(attributes[9].frame, JSRect(152, 82, 45, 67));

        layout.sectionFooterHeight = 0;
        collectionView.bounds = JSRect(0, 100, 313, 100);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 10);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath(0, 6));
        TKAssertObjectEquals(attributes[0].frame, JSRect(8, 82, 45, 67));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath(0, 7));
        TKAssertObjectEquals(attributes[1].frame, JSRect(56, 82, 45, 67));
        TKAssertExactEquals(attributes[2].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[2].indexPath, JSIndexPath(0, 8));
        TKAssertObjectEquals(attributes[2].frame, JSRect(104, 82, 45, 67));
        TKAssertExactEquals(attributes[3].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[3].indexPath, JSIndexPath(0, 9));
        TKAssertObjectEquals(attributes[3].frame, JSRect(152, 82, 45, 67));
        TKAssertExactEquals(attributes[4].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[4].indexPath, JSIndexPath(1, 0));
        TKAssertObjectEquals(attributes[4].frame, JSRect(8, 169, 45, 67));
        TKAssertExactEquals(attributes[5].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[5].indexPath, JSIndexPath(1, 1));
        TKAssertObjectEquals(attributes[5].frame, JSRect(56, 169, 45, 67));
        TKAssertExactEquals(attributes[6].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[6].indexPath, JSIndexPath(1, 2));
        TKAssertObjectEquals(attributes[6].frame, JSRect(104, 169, 45, 67));
        TKAssertExactEquals(attributes[7].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[7].indexPath, JSIndexPath(1, 3));
        TKAssertObjectEquals(attributes[7].frame, JSRect(152, 169, 45, 67));
        TKAssertExactEquals(attributes[8].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[8].indexPath, JSIndexPath(1, 4));
        TKAssertObjectEquals(attributes[8].frame, JSRect(200, 169, 45, 67));
        TKAssertExactEquals(attributes[9].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[9].indexPath, JSIndexPath(1, 5));
        TKAssertObjectEquals(attributes[9].frame, JSRect(248, 169, 45, 67));

        layout.collectionFooterHeight = 0;
        collectionView.bounds = JSRect(0, 424, 313, 50);
        layout.prepare();
        attributes = layout.layoutAttributesForElementsInRect(collectionView.bounds);
        TKAssertExactEquals(attributes.length, 2);
        TKAssertExactEquals(attributes[0].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[0].indexPath, JSIndexPath(1, 18));
        TKAssertObjectEquals(attributes[0].frame, JSRect(8, 397, 45, 67));
        TKAssertExactEquals(attributes[1].elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes[1].indexPath, JSIndexPath(1, 19));
        TKAssertObjectEquals(attributes[1].frame, JSRect(56, 397, 45, 67));
    },

    testLayoutAttributesForCellAtIndexPath: function(){
        var layout = UICollectionViewGridLayout.init();
        layout.collectionInsets = JSInsets(1, 2, 3, 4);
        layout.collectionHeaderHeight = 12;
        layout.collectionFooterHeight = 34;
        layout.collectionHeaderSpacing = 2;
        layout.collectionFooterSpacing = 5;
        layout.showsSectionBackgroundViews = true;
        layout.sectionSpacing = 8;
        layout.sectionInsets = JSInsets(5, 6, 7, 8);
        layout.sectionHeaderHeight = 21;
        layout.sectionFooterHeight = 43;
        layout.sectionHeaderSpacing = 4;
        layout.sectionFooterSpacing = 10;
        layout.columnSpacing = 3;
        layout.rowSpacing = 9;
        layout.cellSize = JSSize(45, 67);
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                return 2;
            },
            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                return 10 * (sectionIndex + 1);
            }
        };
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        var attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(attributes.frame, JSRect(8, 45, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(attributes.frame, JSRect(56, 45, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(attributes.frame, JSRect(104, 45, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(attributes.frame, JSRect(152, 45, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 4));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(attributes.frame, JSRect(200, 45, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 5));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(attributes.frame, JSRect(248, 45, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 6));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 6));
        TKAssertObjectEquals(attributes.frame, JSRect(8, 121, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 7));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 7));
        TKAssertObjectEquals(attributes.frame, JSRect(56, 121, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 8));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 8));
        TKAssertObjectEquals(attributes.frame, JSRect(104, 121, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(0, 9));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(0, 9));
        TKAssertObjectEquals(attributes.frame, JSRect(152, 121, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(1, 0));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(1, 0));
        TKAssertObjectEquals(attributes.frame, JSRect(8, 286, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(1, 7));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(1, 7));
        TKAssertObjectEquals(attributes.frame, JSRect(56, 362, 45, 67));
        attributes = layout.layoutAttributesForCellAtIndexPath(JSIndexPath(1, 14));
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.cell);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath(1, 14));
        TKAssertObjectEquals(attributes.frame, JSRect(104, 438, 45, 67));
    },

    testLayoutAttributesForSupplimentaryViewAtIndexPath: function(){
        var layout = UICollectionViewGridLayout.init();
        layout.collectionInsets = JSInsets(1, 2, 3, 4);
        layout.collectionHeaderHeight = 12;
        layout.collectionFooterHeight = 34;
        layout.collectionHeaderSpacing = 2;
        layout.collectionFooterSpacing = 5;
        layout.showsSectionBackgroundViews = true;
        layout.sectionSpacing = 8;
        layout.sectionInsets = JSInsets(5, 6, 7, 8);
        layout.sectionHeaderHeight = 21;
        layout.sectionFooterHeight = 43;
        layout.sectionHeaderSpacing = 4;
        layout.sectionFooterSpacing = 10;
        layout.columnSpacing = 3;
        layout.rowSpacing = 9;
        layout.cellSize = JSSize(45, 67);
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                return 2;
            },
            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                return 10 * (sectionIndex + 1);
            }
        };
        collectionView.bounds = JSRect(0, 0, 313, 100);
        layout.prepare();
        var attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([]), UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([]));
        TKAssertObjectEquals(attributes.frame, JSRect(2, 1, 307, 12));
        attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([0]), UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes.frame, JSRect(2, 15, 307, 233));
        attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([0]), UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes.frame, JSRect(8, 20, 293, 21));
        attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([0]), UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([0]));
        TKAssertObjectEquals(attributes.frame, JSRect(8, 198, 293, 43));
        attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([1]), UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes.frame, JSRect(2, 256, 307, 385));
        attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([1]), UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes.frame, JSRect(8, 261, 293, 21));
        attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([1]), UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([1]));
        TKAssertObjectEquals(attributes.frame, JSRect(8, 591, 293, 43));
        attributes = layout.layoutAttributesForSupplimentaryViewAtIndexPath(JSIndexPath([]), UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertExactEquals(attributes.elementCategory, UICollectionView.ElementCategory.supplimentary);
        TKAssertExactEquals(attributes.kind, UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertObjectEquals(attributes.indexPath, JSIndexPath([]));
        TKAssertObjectEquals(attributes.frame, JSRect(2, 646, 307, 34));
    },

    testFillingCellSizeClosestToSize: function(){
        var layout = UICollectionViewGridLayout.init();
        layout.collectionInsets = JSInsets(1, 2, 3, 4);
        layout.collectionHeaderHeight = 12;
        layout.collectionFooterHeight = 34;
        layout.collectionHeaderSpacing = 2;
        layout.collectionFooterSpacing = 5;
        layout.showsSectionBackgroundViews = true;
        layout.sectionSpacing = 8;
        layout.sectionInsets = JSInsets(5, 6, 7, 8);
        layout.sectionHeaderHeight = 21;
        layout.sectionFooterHeight = 43;
        layout.sectionHeaderSpacing = 4;
        layout.sectionFooterSpacing = 10;
        layout.columnSpacing = 3;
        layout.rowSpacing = 9;
        layout.cellSize = JSSize(45, 67);
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                return 2;
            },
            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                return 10 * (sectionIndex + 1);
            }
        };
        collectionView.bounds = JSRect(0, 0, 300, 100);
        var size = layout.fillingCellSizeClosestToSize(JSSize(100, 50));
        TKAssertExactEquals(size.width, 91);
        TKAssertExactEquals(size.height, 45);

        collectionView.bounds = JSRect(0, 0, 275, 100);
        size = layout.fillingCellSizeClosestToSize(JSSize(100, 50));
        TKAssertExactEquals(size.width, 83);
        TKAssertExactEquals(size.height, 41);

        collectionView.bounds = JSRect(0, 0, 274, 100);
        size = layout.fillingCellSizeClosestToSize(JSSize(100, 50));
        TKAssertExactEquals(size.width, 125);
        TKAssertExactEquals(size.height, 62);
    }

});