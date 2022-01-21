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
// #import UIKitTesting
"use strict";

JSClass("UICollectionViewTests", TKTestSuite, {

    app: null,
    window: null,

    setup: function(){
        this.app = UIMockApplication.initEmpty();
        this.window = UIRootWindow.initWithApplication(this.app);
        this.window.makeKeyAndOrderFront();
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
        this.window = null;
    },

    testInit: function(){
        TKAssertThrows(function(){
            var collectionView = UICollectionView.init();
        });
    },

    testInitWithLayout: function(){
        var layout = UICollectionViewGridLayout.init();
        var collectionView = UICollectionView.initWithLayout(layout);
        TKAssertExactEquals(collectionView.collectionViewLayout, layout);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({});
        TKAssertThrows(function(){
            var collectionView = UICollectionView.initWithSpec(spec);
        });

        spec = JSSpec.initWithDictionary({
            layout: {
                class: "UICollectionViewGridLayout"
            }
        });
        var collectionView = UICollectionView.initWithSpec(spec);
        TKAssertInstance(collectionView.collectionViewLayout, UICollectionViewGridLayout);
        TKAssertExactEquals(collectionView.allowsMultipleSelection, false);
        TKAssertExactEquals(collectionView.allowsEmptySelection, true);
        TKAssertExactEquals(collectionView.showsFocusRing, false);

        spec = JSSpec.initWithDictionary({
            Controller: {
                class: "UIViewController"
            },
            CollectionView: {
                class: "UICollectionView",
                layout: {
                    class: "UICollectionViewGridLayout"
                },
                delegate: "/Controller",
                dataSource: "/Controller"
            },
        });
        collectionView = spec.valueForKey("CollectionView");
        TKAssertInstance(collectionView.collectionViewLayout, UICollectionViewGridLayout);
        TKAssertInstance(collectionView.delegate, UIViewController);
        TKAssertInstance(collectionView.dataSource, UIViewController);

        spec = JSSpec.initWithDictionary({
            layout: {
                class: "UICollectionViewGridLayout"
            },
            allowsEmptySelection: false,
            allowsMultipleSelection: true,
            showsFocusRing: true
        });
        collectionView = UICollectionView.initWithSpec(spec);
        TKAssertInstance(collectionView.collectionViewLayout, UICollectionViewGridLayout);
        TKAssertExactEquals(collectionView.allowsMultipleSelection, true);
        TKAssertExactEquals(collectionView.allowsEmptySelection, false);
        TKAssertExactEquals(collectionView.showsFocusRing, true);

        spec = JSSpec.initWithDictionary({
            layout: {
                class: "UICollectionViewGridLayout"
            },
            reusableCellClasses: {
                test: "UICollectionViewTestsCell"
            },
            reusableViewClasses: {
                testing: "UICollectionViewTestsResuableView"
            }
        });
        collectionView = UICollectionView.initWithSpec(spec);
        var cell = collectionView.dequeueReusableCellWithIdentifier("test", JSIndexPath(0, 0));
        TKAssertInstance(cell, UICollectionViewTestsCell);
        var view = collectionView.dequeueReusableViewWithIdentifier("testing", JSIndexPath([0]));
        TKAssertInstance(view, UICollectionViewTestsResuableView);
    },

    testRegisterCellClassForReuseIdentifier: function(){
        var layout = UICollectionViewGridLayout.init();
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.registerCellClassForReuseIdentifier(UICollectionViewTestsCell, "test");
        var cell = collectionView.dequeueReusableCellWithIdentifier("test", JSIndexPath(0, 0));
        TKAssertInstance(cell, UICollectionViewTestsCell);
        cell = collectionView.dequeueReusableCellWithIdentifier("wrong", JSIndexPath([0]));
        TKAssertNull(cell);
    },

    testRegisterViewClassForReuseIdentifier: function(){
        var layout = UICollectionViewGridLayout.init();
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.registerViewClassForReuseIdentifier(UICollectionViewTestsResuableView, "test");
        var view = collectionView.dequeueReusableViewWithIdentifier("test", JSIndexPath(0, 0));
        TKAssertInstance(view, UICollectionViewTestsResuableView);
        view = collectionView.dequeueReusableViewWithIdentifier("wrong", JSIndexPath([0]));
        TKAssertNull(view);

    },

    testReloadData: function(){
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
        var calls = {
            numberOfSectionsInCollectionView: [],
            numberOfCellsInCollectionViewSection: [],
            cellForCollectionViewAtIndexPath: [],
            supplimentaryViewForCollectionViewAtIndexPath: []
        };
        collectionView.registerCellClassForReuseIdentifier(UICollectionViewTestsCell, "testcell");
        collectionView.registerViewClassForReuseIdentifier(UICollectionViewTestsResuableView, "testview");
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                calls.numberOfSectionsInCollectionView.push({collectionView: collectionView});
                return 2;
            },

            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                calls.numberOfCellsInCollectionViewSection.push({collectionView: collectionView, sectionIndex: sectionIndex});
                return 10 * (sectionIndex + 1);
            },

            cellForCollectionViewAtIndexPath: function(collectionView, indexPath){
                calls.cellForCollectionViewAtIndexPath.push({collectionView: collectionView, indexPath: indexPath});
                var cell = collectionView.dequeueReusableCellWithIdentifier("testcell", indexPath);
                return cell;
            },

            supplimentaryViewForCollectionViewAtIndexPath: function(collectionView, indexPath, kind){
                calls.supplimentaryViewForCollectionViewAtIndexPath.push({collectionView: collectionView, indexPath: indexPath, kind: kind});
                var view = collectionView.dequeueReusableViewWithIdentifier("testview", indexPath);
                return view;
            }
        };
        collectionView.bounds = JSRect(0, 0, 313, 100);
        this.window.contentView.addSubview(collectionView);
        this.app.updateDisplay();
        TKAssert(!collectionView.layer.needsLayout());
        collectionView.reloadData();
        TKAssert(collectionView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 0);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 0);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 0);
        this.app.updateDisplay();
        TKAssert(!collectionView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView[0].collectionView, collectionView);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection[0].collectionView, collectionView);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection[0].sectionIndex, 0);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection[1].collectionView, collectionView);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection[1].sectionIndex, 1);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[0].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[0].indexPath.length, 0);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[0].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[1].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[1].indexPath.section, 0);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[1].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[2].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[2].indexPath.section, 0);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[2].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[0].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[0].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[0].indexPath.row, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[1].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[1].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[1].indexPath.row, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[2].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[2].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[2].indexPath.row, 2);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[3].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[3].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[3].indexPath.row, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[4].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[4].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[4].indexPath.row, 4);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[5].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[5].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[5].indexPath.row, 5);

        var cells = collectionView.visibleCells;
        TKAssertObjectEquals(cells[0].untransformedFrame, JSRect(8, 45, 45, 67));
        TKAssertExactEquals(cells[0].accessibilityRowIndex, 0);
        TKAssertExactEquals(cells[0].accessibilityColumnIndex, 0);
        TKAssertObjectEquals(cells[1].untransformedFrame, JSRect(56, 45, 45, 67));
        TKAssertExactEquals(cells[1].accessibilityRowIndex, 0);
        TKAssertExactEquals(cells[1].accessibilityColumnIndex, 1);
        TKAssertObjectEquals(cells[2].untransformedFrame, JSRect(104, 45, 45, 67));
        TKAssertExactEquals(cells[2].accessibilityRowIndex, 0);
        TKAssertExactEquals(cells[2].accessibilityColumnIndex, 2);
        TKAssertObjectEquals(cells[3].untransformedFrame, JSRect(152, 45, 45, 67));
        TKAssertExactEquals(cells[3].accessibilityRowIndex, 0);
        TKAssertExactEquals(cells[3].accessibilityColumnIndex, 3);
        TKAssertObjectEquals(cells[4].untransformedFrame, JSRect(200, 45, 45, 67));
        TKAssertExactEquals(cells[4].accessibilityRowIndex, 0);
        TKAssertExactEquals(cells[4].accessibilityColumnIndex, 4);
        TKAssertObjectEquals(cells[5].untransformedFrame, JSRect(248, 45, 45, 67));
        TKAssertExactEquals(cells[5].accessibilityRowIndex, 0);
        TKAssertExactEquals(cells[5].accessibilityColumnIndex, 5);
    },

    testScroll: function(){
        var calls = {
            CustomCellInit: [],
            CustomViewInit: [],
            numberOfSectionsInCollectionView: [],
            numberOfCellsInCollectionViewSection: [],
            supplimentaryViewForCollectionViewAtIndexPath: [],
            cellForCollectionViewAtIndexPath: []
        };
        var CustomCell = UICollectionViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomCellInit.push({identifier: identifier, styler: styler});
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var CustomView = UICollectionReusableView.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomViewInit.push({identifier: identifier, styler: styler});
                CustomView.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomView1");

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
        collectionView.registerCellClassForReuseIdentifier(CustomCell, "testcell");
        collectionView.registerViewClassForReuseIdentifier(CustomView, "testview");
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                calls.numberOfSectionsInCollectionView.push({collectionView: collectionView});
                return 2;
            },

            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                calls.numberOfCellsInCollectionViewSection.push({collectionView: collectionView, sectionIndex: sectionIndex});
                return 10 * (sectionIndex + 1);
            },

            cellForCollectionViewAtIndexPath: function(collectionView, indexPath){
                calls.cellForCollectionViewAtIndexPath.push({collectionView: collectionView, indexPath: indexPath});
                var cell = collectionView.dequeueReusableCellWithIdentifier("testcell", indexPath);
                return cell;
            },

            supplimentaryViewForCollectionViewAtIndexPath: function(collectionView, indexPath, kind){
                calls.supplimentaryViewForCollectionViewAtIndexPath.push({collectionView: collectionView, indexPath: indexPath, kind: kind});
                var view = collectionView.dequeueReusableViewWithIdentifier("testview", indexPath);
                return view;
            }
        };
        collectionView.bounds = JSRect(0, 0, 313, 100);
        this.window.contentView.addSubview(collectionView);
        this.app.updateDisplay();
        TKAssert(!collectionView.layer.needsLayout());
        collectionView.reloadData();
        TKAssert(collectionView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 0);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 0);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 0);
        this.app.updateDisplay();
        TKAssert(!collectionView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomViewInit[0].identifier, "testview");
        TKAssertExactEquals(calls.CustomViewInit[1].identifier, "testview");
        TKAssertExactEquals(calls.CustomViewInit[2].identifier, "testview");
        TKAssertExactEquals(calls.CustomCellInit.length, 6);
        TKAssertExactEquals(calls.CustomCellInit[0].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[1].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[2].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[3].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[4].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[5].identifier, "testcell");

        collectionView.contentOffset = JSPoint(0, 21);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 6);

        collectionView.contentOffset = JSPoint(0, 22);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 22);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 22);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 98);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 99);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[3].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[3].indexPath.section, 0);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[3].kind, UICollectionViewGridLayout.SupplimentaryKind.footer);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 156);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 157);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[4].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[4].indexPath.section, 1);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[4].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 157);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[4].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[4].indexPath.section, 1);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[4].kind, UICollectionViewGridLayout.SupplimentaryKind.background);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 161);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 162);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[5].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[5].indexPath.section, 1);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[5].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 162);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[5].collectionView, collectionView);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[5].indexPath.section, 1);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath[5].kind, UICollectionViewGridLayout.SupplimentaryKind.header);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 186);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomViewInit.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        collectionView.contentOffset = JSPoint(0, 187);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 16);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[10].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[10].indexPath.section, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[10].indexPath.row, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[11].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[11].indexPath.section, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[11].indexPath.row, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[12].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[12].indexPath.section, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[12].indexPath.row, 2);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[13].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[13].indexPath.section, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[13].indexPath.row, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[14].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[14].indexPath.section, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[14].indexPath.row, 4);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[15].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[15].indexPath.section, 1);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[15].indexPath.row, 5);
        TKAssertExactEquals(calls.CustomViewInit.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        var cells = collectionView.visibleCells;
        TKAssertExactEquals(cells.length, 10);

        collectionView.contentOffset = JSPoint(0, 189);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 16);
        TKAssertExactEquals(calls.CustomViewInit.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);

        cells = collectionView.visibleCells;
        TKAssertExactEquals(cells.length, 6);

        collectionView.contentOffset = JSPoint(0, 187);
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 20);
        TKAssertExactEquals(calls.CustomViewInit.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 10);
        cells = collectionView.visibleCells;
        TKAssertExactEquals(cells.length, 10);
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[0]), JSIndexPath(0, 6));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[1]), JSIndexPath(0, 7));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[2]), JSIndexPath(0, 8));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[3]), JSIndexPath(0, 9));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[4]), JSIndexPath(1, 0));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[5]), JSIndexPath(1, 1));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[6]), JSIndexPath(1, 2));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[7]), JSIndexPath(1, 3));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[8]), JSIndexPath(1, 4));
        TKAssertObjectEquals(collectionView.indexPathOfCell(cells[9]), JSIndexPath(1, 5));
    },

    testReloadCellsAtIndexPaths: function(){
        var calls = {
            CustomCellInit: [],
            CustomViewInit: [],
            numberOfSectionsInCollectionView: [],
            numberOfCellsInCollectionViewSection: [],
            supplimentaryViewForCollectionViewAtIndexPath: [],
            cellForCollectionViewAtIndexPath: []
        };
        var CustomCell = UICollectionViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomCellInit.push({identifier: identifier, styler: styler});
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var CustomView = UICollectionReusableView.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomViewInit.push({identifier: identifier, styler: styler});
                CustomView.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomView1");

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
        collectionView.registerCellClassForReuseIdentifier(CustomCell, "testcell");
        collectionView.registerViewClassForReuseIdentifier(CustomView, "testview");
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                calls.numberOfSectionsInCollectionView.push({collectionView: collectionView});
                return 2;
            },

            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                calls.numberOfCellsInCollectionViewSection.push({collectionView: collectionView, sectionIndex: sectionIndex});
                return 10 * (sectionIndex + 1);
            },

            cellForCollectionViewAtIndexPath: function(collectionView, indexPath){
                calls.cellForCollectionViewAtIndexPath.push({collectionView: collectionView, indexPath: indexPath});
                var cell = collectionView.dequeueReusableCellWithIdentifier("testcell", indexPath);
                return cell;
            },

            supplimentaryViewForCollectionViewAtIndexPath: function(collectionView, indexPath, kind){
                calls.supplimentaryViewForCollectionViewAtIndexPath.push({collectionView: collectionView, indexPath: indexPath, kind: kind});
                var view = collectionView.dequeueReusableViewWithIdentifier("testview", indexPath);
                return view;
            }
        };
        collectionView.bounds = JSRect(0, 0, 313, 100);
        this.window.contentView.addSubview(collectionView);
        this.app.updateDisplay();
        TKAssert(!collectionView.layer.needsLayout());
        collectionView.reloadData();
        TKAssert(collectionView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 0);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 0);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 0);
        this.app.updateDisplay();
        TKAssert(!collectionView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInCollectionView.length, 1);
        TKAssertExactEquals(calls.numberOfCellsInCollectionViewSection.length, 2);
        TKAssertExactEquals(calls.supplimentaryViewForCollectionViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.CustomViewInit.length, 3);
        TKAssertExactEquals(calls.CustomViewInit[0].identifier, "testview");
        TKAssertExactEquals(calls.CustomViewInit[1].identifier, "testview");
        TKAssertExactEquals(calls.CustomViewInit[2].identifier, "testview");
        TKAssertExactEquals(calls.CustomCellInit.length, 6);
        TKAssertExactEquals(calls.CustomCellInit[0].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[1].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[2].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[3].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[4].identifier, "testcell");
        TKAssertExactEquals(calls.CustomCellInit[5].identifier, "testcell");

        collectionView.reloadCellsAtIndexPaths([JSIndexPath(1, 1), JSIndexPath(0, 2), JSIndexPath(0, 0)]);

        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath.length, 8);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[6].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[6].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[6].indexPath.row, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[7].collectionView, collectionView);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[7].indexPath.section, 0);
        TKAssertExactEquals(calls.cellForCollectionViewAtIndexPath[7].indexPath.row, 2);
        TKAssertExactEquals(calls.CustomCellInit.length, 6);
    },

    testLayoutChanges: function(){

        var layout = UICollectionViewGridLayout.init();
        layout.columnSpacing = 0;
        layout.rowSpacing = 0;
        layout.cellSize = JSSize(50, 50);
        var collectionView = UICollectionView.initWithLayout(layout);
        collectionView.bounds = JSRect(0, 0, 100, 100);
        collectionView.registerCellClassForReuseIdentifier(UICollectionViewTestsCell, "testcell");
        collectionView.dataSource = {
            numberOfSectionsInCollectionView: function(collectionView){
                return 1;
            },

            numberOfCellsInCollectionViewSection: function(collectionView, sectionIndex){
                return 4;
            },

            cellForCollectionViewAtIndexPath: function(collectionView, indexPath){
                var cell = collectionView.dequeueReusableCellWithIdentifier("testcell", indexPath);
                return cell;
            }
        };
        this.window.contentView.addSubview(collectionView);
        collectionView.reloadData();
        this.app.updateDisplay();
        TKAssertExactEquals(collectionView.visibleCells.length, 4);
        layout.cellSize = JSSize(100, 100);
        this.app.updateDisplay();
        TKAssertExactEquals(collectionView.visibleCells.length, 1);
    },

});

JSClass("UICollectionViewTestsCell", UICollectionViewCell, {

});

JSClass("UICollectionViewTestsResuableView", UICollectionReusableView, {

});