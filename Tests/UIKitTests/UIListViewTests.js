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

// #import UIKit
// #import TestKit
// #import UIKitTesting
'use strict';

JSClass("UIListViewTests", TKTestSuite, {

    windowServer: null,
    app: null,
    window: null,

    setup: function(){
        this.app = UIMockApplication.init();
        this.windowServer = this.app.windowServer;
        this.window = UIRootWindow.initWithApplication(this.app);
        this.window.makeKeyAndOrderFront();
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
        this.windowServer = null;
        this.window = null;
    },

    testCellRegistration: function(){
        var CustomCell1 = UIListViewCell.$extend({}, "CustomCell1");
        var CustomCell2 = UIListViewCell.$extend({}, "CustomCell2");
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 300));
        this.window.contentView.addSubview(listView);
        listView.registerCellClassForReuseIdentifier(CustomCell1, "test1");
        listView.registerCellClassForReuseIdentifier(CustomCell2, "test2");

        var cell = listView.dequeueReusableCellWithIdentifier("test1", JSIndexPath(0,0));
        TKAssertNotNull(cell);
        TKAssert(cell instanceof CustomCell1);
        var cell2 = listView.dequeueReusableCellWithIdentifier("test1", JSIndexPath(0,0));
        TKAssertNotNull(cell);
        TKAssert(cell instanceof CustomCell1);
        TKAssertNotExactEquals(cell, cell2);

        cell = listView.dequeueReusableCellWithIdentifier("test2", JSIndexPath(0,0));
        TKAssertNotNull(cell);
        TKAssert(cell instanceof CustomCell2);
    },

    testReloadData: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 300));
        listView.rowHeight = 40;
        var calls = {
            numberOfSectionsInListView: [],
            numberOfRowsInListViewSection: [],
            cellForListViewAtIndexPath: []
        };

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                calls.numberOfSectionsInListView.push({listView: listView});
                return 3;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                calls.numberOfRowsInListViewSection.push({listView: listView, sectionIndex: sectionIndex});
                switch (sectionIndex){
                    case 0:
                        return 3;
                    case 1:
                        return 0;
                    case 2:
                        return 1;
                }
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                calls.cellForListViewAtIndexPath.push({listView: listView, indexPath: indexPath});
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        listView.reloadData();
        TKAssert(listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 0);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfSectionsInListView[0].listView, listView);
        // We don't have an exact requirement on how many times numberOfRows
        // should be called, allowing the implementation some flexibility, but
        // it should still be within a reasonable range.  Currently, that range
        // is about 3-4 times per section.
        TKAssertGreaterThanOrEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertLessThanOrEquals(calls.numberOfRowsInListViewSection.length, 12);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].sectionIndex, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[1].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[1].sectionIndex, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[2].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[2].sectionIndex, 2);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[0].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[0].indexPath, JSIndexPath(0,0));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[1].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[1].indexPath, JSIndexPath(0,1));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[2].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[2].indexPath, JSIndexPath(0,2));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[3].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[3].indexPath, JSIndexPath(2,0));
    },

    testScrolling: function(){
        var CustomCell = UIListViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomCellInit.push({identifier: identifier, styler: styler});
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var calls = {
            CustomCellInit: [],
            numberOfSectionsInListView: [],
            numberOfRowsInListViewSection: [],
            cellForListViewAtIndexPath: []
        };
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 100));
        listView.registerCellClassForReuseIdentifier(CustomCell, "test");
        listView.rowHeight = 40;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                calls.numberOfSectionsInListView.push({listView: listView});
                return 3;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                calls.numberOfRowsInListViewSection.push({listView: listView, sectionIndex: sectionIndex});
                switch (sectionIndex){
                    case 0:
                        return 3;
                    case 1:
                        return 0;
                    case 2:
                        return 1;
                }
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                calls.cellForListViewAtIndexPath.push({listView: listView, indexPath: indexPath});
                var cell = listView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        listView.reloadData();
        TKAssert(listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 0);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfSectionsInListView[0].listView, listView);
        TKAssertGreaterThanOrEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertLessThanOrEquals(calls.numberOfRowsInListViewSection.length, 10);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].sectionIndex, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[1].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[1].sectionIndex, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[2].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[2].sectionIndex, 2);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[0].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[0].indexPath, JSIndexPath(0,0));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[1].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[1].indexPath, JSIndexPath(0,1));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[2].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[2].indexPath, JSIndexPath(0,2));
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        listView.contentOffset = JSPoint(0, 15);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        listView.contentOffset = JSPoint(0, 25);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[3].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[3].indexPath, JSIndexPath(2,0));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 40);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 60);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 10);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[4].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[4].indexPath, JSIndexPath(0,0));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);


        // Single section
        calls = {
            CustomCellInit: [],
            numberOfSectionsInListView: [],
            numberOfRowsInListViewSection: [],
            cellForListViewAtIndexPath: []
        };
        listView = UIListView.initWithFrame(JSRect(0, 0, 300, 100));
        listView.registerCellClassForReuseIdentifier(CustomCell, "test");
        listView.rowHeight = 40;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                calls.numberOfSectionsInListView.push({listView: listView});
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                calls.numberOfRowsInListViewSection.push({listView: listView, sectionIndex: sectionIndex});
                switch (sectionIndex){
                    case 0:
                        return 4;
                }
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                calls.cellForListViewAtIndexPath.push({listView: listView, indexPath: indexPath});
                var cell = listView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        listView.reloadData();
        TKAssert(listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 0);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfSectionsInListView[0].listView, listView);
        TKAssertGreaterThanOrEquals(calls.numberOfRowsInListViewSection.length, 1);
        TKAssertLessThanOrEquals(calls.numberOfRowsInListViewSection.length, 4);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].sectionIndex, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[0].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[0].indexPath, JSIndexPath(0,0));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[1].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[1].indexPath, JSIndexPath(0,1));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[2].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[2].indexPath, JSIndexPath(0,2));
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        listView.contentOffset = JSPoint(0, 15);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        listView.contentOffset = JSPoint(0, 25);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[3].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[3].indexPath, JSIndexPath(0,3));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 40);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 60);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 10);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[4].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[4].indexPath, JSIndexPath(0,0));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
    },

    testVisibleIndexPaths: function(){
        var CustomCell = UIListViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomCellInit.push({identifier: identifier, styler: styler});
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var calls = {
            CustomCellInit: [],
            numberOfSectionsInListView: [],
            numberOfRowsInListViewSection: [],
            cellForListViewAtIndexPath: []
        };
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 100));
        listView.registerCellClassForReuseIdentifier(CustomCell, "test");
        listView.rowHeight = 40;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                calls.numberOfSectionsInListView.push({listView: listView});
                return 3;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                calls.numberOfRowsInListViewSection.push({listView: listView, sectionIndex: sectionIndex});
                switch (sectionIndex){
                    case 0:
                        return 3;
                    case 1:
                        return 0;
                    case 2:
                        return 1;
                }
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                calls.cellForListViewAtIndexPath.push({listView: listView, indexPath: indexPath});
                var cell = listView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        listView.reloadData();
        TKAssert(listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 0);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());

        var indexPaths = listView.visibleIndexPaths;
        TKAssertEquals(indexPaths.length, 3);
        TKAssertObjectEquals(indexPaths[0], JSIndexPath(0, 0));
        TKAssertObjectEquals(indexPaths[1], JSIndexPath(0, 1));
        TKAssertObjectEquals(indexPaths[2], JSIndexPath(0, 2));

        listView.contentOffset = JSPoint(0, 60);
        indexPaths = listView.visibleIndexPaths;
        TKAssertEquals(indexPaths.length, 3);
        TKAssertObjectEquals(indexPaths[0], JSIndexPath(0, 1));
        TKAssertObjectEquals(indexPaths[1], JSIndexPath(0, 2));
        TKAssertObjectEquals(indexPaths[2], JSIndexPath(2, 0));
    },

    testRectForCell: function(){
        var CustomCell = UIListViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 100));
        listView.registerCellClassForReuseIdentifier(CustomCell, "test");
        listView.rowHeight = 40;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 3;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                switch (sectionIndex){
                    case 0:
                        return 3;
                    case 1:
                        return 0;
                    case 2:
                        return 5;
                }
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = listView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay();

        var rect = listView.rectForCellAtIndexPath(JSIndexPath(0, 0));
        TKAssertObjectEquals(rect, JSRect(0, 0, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(0, 1));
        TKAssertObjectEquals(rect, JSRect(0, 40, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(0, 2));
        TKAssertObjectEquals(rect, JSRect(0, 80, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 0));
        TKAssertObjectEquals(rect, JSRect(0, 120, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 1));
        TKAssertObjectEquals(rect, JSRect(0, 160, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 2));
        TKAssertObjectEquals(rect, JSRect(0, 200, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 3));
        TKAssertObjectEquals(rect, JSRect(0, 240, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 4));
        TKAssertObjectEquals(rect, JSRect(0, 280, 300, 40));

        listView.contentOffset = JSPoint(0, 150);
        rect = listView.rectForCellAtIndexPath(JSIndexPath(0, 0));
        TKAssertObjectEquals(rect, JSRect(0, 0, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(0, 1));
        TKAssertObjectEquals(rect, JSRect(0, 40, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(0, 2));
        TKAssertObjectEquals(rect, JSRect(0, 80, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 0));
        TKAssertObjectEquals(rect, JSRect(0, 120, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 1));
        TKAssertObjectEquals(rect, JSRect(0, 160, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 2));
        TKAssertObjectEquals(rect, JSRect(0, 200, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 3));
        TKAssertObjectEquals(rect, JSRect(0, 240, 300, 40));
        rect = listView.rectForCellAtIndexPath(JSIndexPath(2, 4));
        TKAssertObjectEquals(rect, JSRect(0, 280, 300, 40));
    },

    testEstimatedHeights: function(){
        var CustomCell = UIListViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 100));
        listView.registerCellClassForReuseIdentifier(CustomCell, "test");
        listView.rowHeight = 40;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 3;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                switch (sectionIndex){
                    case 0:
                        return 3;
                    case 1:
                        return 0;
                    case 2:
                        return 4;
                }
            }
        };

        listView.delegate = {
            heightForListViewRowAtIndexPath: function(listView, indexPath){
                return 50 + indexPath.row * 10;
            },
            estimatedHeightForListViewRows: function(listView){
                return 50;
            },
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = listView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay();

        // 50
        // 60
        // 70
        // 50
        // 60
        // 70
        // 80
        TKAssertEquals(listView.contentSize.height, 360);
        listView.contentOffset = JSPoint(0, 20);
        TKAssertEquals(listView.contentSize.height, 380);
        listView.contentOffset = JSPoint(0, 150);
        TKAssertEquals(listView.contentSize.height, 390);
        listView.contentOffset = JSPoint(0, 280);
        TKAssertEquals(listView.contentSize.height, 440);
        listView.contentOffset = JSPoint(0, 340);
        TKAssertEquals(listView.contentSize.height, 440);
        listView.contentOffset = JSPoint(0, 150);
        TKAssertEquals(listView.contentSize.height, 440);
        listView.contentOffset = JSPoint(0, 0);
        TKAssertEquals(listView.contentSize.height, 440);

        listView.reloadData();
        this.windowServer.displayServer.updateDisplay();
        TKAssertEquals(listView.contentSize.height, 360);
        listView.contentOffset = JSPoint(0, 340);
        TKAssertEquals(listView.contentOffset.y, 260);
        TKAssertEquals(listView.contentSize.height, 410);
    },

    testDeleteSingleVisibleRow: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 9;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1));

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell3);

        TKAssertNull(cell1.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, -150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 60);
        TKAssertFloatEquals(cell2.position.y, 60);
        TKAssertFloatEquals(cell3.position.y, 100);
        TKAssertFloatEquals(cell4.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteSingleVisibleRowCover: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 9;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.cover);

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1.0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell3);

        TKAssertNull(cell1.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 60);
        TKAssertFloatEquals(cell2.position.y, 60);
        TKAssertFloatEquals(cell3.position.y, 100);
        TKAssertFloatEquals(cell4.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1.0);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteSingleVisibleRowPush: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 9;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.push);

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1.0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell3);

        TKAssertNull(cell1.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 20);
        TKAssertFloatEquals(cell2.position.y, 60);
        TKAssertFloatEquals(cell3.position.y, 100);
        TKAssertFloatEquals(cell4.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1.0);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteSingleVisibleRowFold: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 9;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.fold);

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell3);

        TKAssertNull(cell1.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 20);
        TKAssertFloatEquals(cell2.position.y, 60);
        TKAssertFloatEquals(cell3.position.y, 100);
        TKAssertFloatEquals(cell4.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1.0);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteConsecutiveVisibleRows: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 8;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 2));

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell2);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 320);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertNull(cell2.indexPath);
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell4);

        TKAssertNull(cell1.superview);
        TKAssertNull(cell2.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, -150);
        TKAssertFloatEquals(cell2.position.x, -150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 60);
        TKAssertFloatEquals(cell2.position.y, 100);
        TKAssertFloatEquals(cell3.position.y, 60);
        TKAssertFloatEquals(cell4.position.y, 100);
        TKAssertFloatEquals(cell5.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1.0);
        TKAssertFloatEquals(cell2.alpha, 1.0);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteConsecutiveVisibleRowsCover: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 8;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.cover);
        listView.deleteRowAtIndexPath(JSIndexPath(0, 2), UIListView.RowAnimation.cover);

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell2);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 320);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertNull(cell2.indexPath);
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell4);

        TKAssertNull(cell1.superview);
        TKAssertNull(cell2.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 60);
        TKAssertFloatEquals(cell2.position.y, 100);
        TKAssertFloatEquals(cell3.position.y, 60);
        TKAssertFloatEquals(cell4.position.y, 100);
        TKAssertFloatEquals(cell5.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1);
        TKAssertFloatEquals(cell2.alpha, 1);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteConsecutiveVisibleRowsPush: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 8;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.push);
        listView.deleteRowAtIndexPath(JSIndexPath(0, 2), UIListView.RowAnimation.push);

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell2);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 320);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertNull(cell2.indexPath);
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell4);

        TKAssertNull(cell1.superview);
        TKAssertNull(cell2.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, -20);
        TKAssertFloatEquals(cell2.position.y, 20);
        TKAssertFloatEquals(cell3.position.y, 60);
        TKAssertFloatEquals(cell4.position.y, 100);
        TKAssertFloatEquals(cell5.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1);
        TKAssertFloatEquals(cell2.alpha, 1);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteConsecutiveVisibleRowsFold: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 8;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.fold);
        listView.deleteRowAtIndexPath(JSIndexPath(0, 2), UIListView.RowAnimation.fold);

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell2);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 320);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell1.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell1.indexPath);
        TKAssertNull(cell2.indexPath);
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell4);

        TKAssertNull(cell1.superview);
        TKAssertNull(cell2.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 20);
        TKAssertFloatEquals(cell2.position.y, 20);
        TKAssertFloatEquals(cell3.position.y, 60);
        TKAssertFloatEquals(cell4.position.y, 100);
        TKAssertFloatEquals(cell5.position.y, 140);
        TKAssertFloatEquals(cell1.alpha, 1.0);
        TKAssertFloatEquals(cell2.alpha, 1.0);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteNonConsecutiveVisibleRows: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 8;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 0));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 2));

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell0);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell2);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell0.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 320);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell0.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertNull(cell0.indexPath);
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell2.indexPath);
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell1);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell4);

        TKAssertNull(cell0.superview);
        TKAssertNull(cell2.superview);
        TKAssertFloatEquals(cell0.position.x, -150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, -150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 20);
        TKAssertFloatEquals(cell2.position.y, 60);
        TKAssertFloatEquals(cell3.position.y, 60);
        TKAssertFloatEquals(cell4.position.y, 100);
        TKAssertFloatEquals(cell5.position.y, 140);
        TKAssertFloatEquals(cell0.alpha, 1.0);
        TKAssertFloatEquals(cell2.alpha, 1.0);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteSingleInvisibleRowAfter: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 9;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 4));

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 3));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell1.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell1);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell3);

        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 60);
        TKAssertFloatEquals(cell2.position.y, 100);
        TKAssertFloatEquals(cell3.position.y, 140);
        TKAssertFloatEquals(listView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.bounds.origin.y, 0);
    },

    testDeleteSingleInvisibleRowBefore: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 130));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);
        listView.contentOffset = JSPoint(0, 100);
        this.windowServer.displayServer.updateDisplay(1.1);
        TKAssertFloatEquals(listView.contentView.layer.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.bounds.origin.y, 100);

        // initial cells
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 5));
        var cell6 = listView.cellAtIndexPath(JSIndexPath(0, 6));
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNull(cell6);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 9;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1));

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);

        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 4));
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 100);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 200);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 80);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 4));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertExactEquals(cell, cell5);

        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell2.position.y, 60);
        TKAssertFloatEquals(cell3.position.y, 100);
        TKAssertFloatEquals(cell4.position.y, 140);
        TKAssertFloatEquals(cell5.position.y, 180);
        TKAssertFloatEquals(listView.contentView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.bounds.origin.y, 60);
    },

    testDeleteRowsAboveCausingScroll: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        listView.scrollToRect(JSRect(0, 80, 300, 150));

        // initial cells
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 6;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 1));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 2));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 4));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 5));

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell6 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell7 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell6);
        TKAssertNotNull(cell7);
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(cell6.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell7.indexPath, JSIndexPath(0, 3));

        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell7.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 260);
        TKAssertFloatEquals(cell7.layer.presentation.position.y, 300);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 80);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 240);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell7.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell7.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 40);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertObjectEquals(cell0.indexPath, JSIndexPath(0, 0));
        TKAssertNull(cell2.indexPath);
        TKAssertNull(cell4.indexPath);
        TKAssertNull(cell5.indexPath);
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 1));
        TKAssertObjectEquals(cell6.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell7.indexPath, JSIndexPath(0, 3));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell6);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell7);

        TKAssertNull(cell2.superview);
        TKAssertNull(cell4.superview);
        TKAssertNull(cell5.superview);
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, -150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, -150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, -150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell7.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell7.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell2.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
    },

    testDeleteRowsBelowCausingScroll: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 10;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        listView.scrollToRect(JSRect(0, 160, 300, 150));

        // initial cells
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 5));
        var cell6 = listView.cellAtIndexPath(JSIndexPath(0, 6));
        var cell7 = listView.cellAtIndexPath(JSIndexPath(0, 7));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotNull(cell6);
        TKAssertNotNull(cell7);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        numberOfRows = 6;
        listView.deleteRowAtIndexPath(JSIndexPath(0, 5));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 6));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 7));
        listView.deleteRowAtIndexPath(JSIndexPath(0, 8));

        // first update triggers the list view edit prep
        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at start & end
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell9 = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertNotNull(cell9);
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(cell4.indexPath, JSIndexPath(0, 4));
        TKAssertObjectEquals(cell9.indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(cell5.indexPath, JSIndexPath(0, 5));
        TKAssertObjectEquals(cell6.indexPath, JSIndexPath(0, 6));
        TKAssertObjectEquals(cell7.indexPath, JSIndexPath(0, 7));

        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell9.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell7.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell9.layer.presentation.position.y, 340);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 260);
        TKAssertFloatEquals(cell7.layer.presentation.position.y, 300);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell7.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 160);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 240);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell1 moving to the left, all following cells moving up)
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell9.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell7.layer.presentation.position.x, 0);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell9.layer.presentation.position.y, 280);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 260);
        TKAssertFloatEquals(cell7.layer.presentation.position.y, 300);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell7.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 125);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        TKAssertNull(cell5.indexPath);
        TKAssertNull(cell6.indexPath);
        TKAssertNull(cell7.indexPath);
        TKAssertObjectEquals(cell2.indexPath, JSIndexPath(0, 2));
        TKAssertObjectEquals(cell3.indexPath, JSIndexPath(0, 3));
        TKAssertObjectEquals(cell9.indexPath, JSIndexPath(0, 5));
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertExactEquals(cell, cell9);

        TKAssertNull(cell5.superview);
        TKAssertNull(cell6.superview);
        TKAssertNull(cell7.superview);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell9.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, -150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, -150);
        TKAssertFloatEquals(cell7.layer.presentation.position.x, -150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell9.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 260);
        TKAssertFloatEquals(cell7.layer.presentation.position.y, 300);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell7.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 90);
    },

    testInsertSingleVisibleRow: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 10;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1));

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell1);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell2);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 100);
        TKAssertFloatEquals(cell2.position.y, 140);
        TKAssertFloatEquals(cell3.position.y, 180);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell4.alpha, 1);
    },

    testInsertSingleVisibleRowPush: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 10;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.push);

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell1);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell2);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 100);
        TKAssertFloatEquals(cell2.position.y, 140);
        TKAssertFloatEquals(cell3.position.y, 180);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell4.alpha, 1);
    },

    testInsertSingleVisibleRowFold: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 10;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.fold);

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0.5);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell1);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell2);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 100);
        TKAssertFloatEquals(cell2.position.y, 140);
        TKAssertFloatEquals(cell3.position.y, 180);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell4.alpha, 1);
    },

    testInsertSingleVisibleRowRight: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 10;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.right);

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertNotNull(cell4);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 450);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 300);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0.5);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell1);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell2);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 100);
        TKAssertFloatEquals(cell2.position.y, 140);
        TKAssertFloatEquals(cell3.position.y, 180);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell4.alpha, 1);
    },

    testInsertSingleInvisibleRowBefore: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);
        listView.contentOffset = JSPoint(0, 100);
        this.windowServer.displayServer.updateDisplay(1.1);

        // initial cells
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 10;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1));

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertNull(cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 100);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 200);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 240);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 120);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 6));
        TKAssertExactEquals(cell, cell5);

        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 260);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 140);
    },

    testInsertSingleInvisibleRowAfter: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);
        listView.contentOffset = JSPoint(0, 100);
        this.windowServer.displayServer.updateDisplay(1.1);

        // initial cells
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 10;
        listView.insertRowAtIndexPath(JSIndexPath(0, 8));

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertNull(cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 100);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 400);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 100);
        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell2);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell3);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertExactEquals(cell, cell5);

        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 100);
    },

    testInsertConsecutiveVisibleRows: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 13;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1));
        listView.insertRowAtIndexPath(JSIndexPath(0, 2));
        listView.insertRowAtIndexPath(JSIndexPath(0, 3));
        listView.insertRowAtIndexPath(JSIndexPath(0, 4));

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell6 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell7 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotNull(cell6);
        TKAssertNull(cell7);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell1);
        TKAssertNotExactEquals(cell6, cell3);
        TKAssertNotExactEquals(cell6, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 520);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 200);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 1);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell5);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell6);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 180);
        TKAssertFloatEquals(cell2.position.y, 220);
        TKAssertFloatEquals(cell3.position.y, 260);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell5.position.y, 100);
        TKAssertFloatEquals(cell6.position.y, 140);
        TKAssertFloatEquals(cell4.alpha, 1);
        TKAssertFloatEquals(cell5.alpha, 1);
        TKAssertFloatEquals(cell6.alpha, 1);
    },

    testInsertConsecutiveVisibleRowsPush: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 13;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.push);
        listView.insertRowAtIndexPath(JSIndexPath(0, 2), UIListView.RowAnimation.push);
        listView.insertRowAtIndexPath(JSIndexPath(0, 3), UIListView.RowAnimation.push);
        listView.insertRowAtIndexPath(JSIndexPath(0, 4), UIListView.RowAnimation.push);

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell6 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell7 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotNull(cell6);
        TKAssertNull(cell7);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell1);
        TKAssertNotExactEquals(cell6, cell3);
        TKAssertNotExactEquals(cell6, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, -60);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, -20);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 520);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 200);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 0);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 1);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell5);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell6);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell6.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 180);
        TKAssertFloatEquals(cell2.position.y, 220);
        TKAssertFloatEquals(cell3.position.y, 260);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell5.position.y, 100);
        TKAssertFloatEquals(cell6.position.y, 140);
        TKAssertFloatEquals(cell4.alpha, 1);
        TKAssertFloatEquals(cell5.alpha, 1);
        TKAssertFloatEquals(cell6.alpha, 1);
    },

    testInsertConsecutiveVisibleRowsFold: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 13;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.fold);
        listView.insertRowAtIndexPath(JSIndexPath(0, 2), UIListView.RowAnimation.fold);
        listView.insertRowAtIndexPath(JSIndexPath(0, 3), UIListView.RowAnimation.fold);
        listView.insertRowAtIndexPath(JSIndexPath(0, 4), UIListView.RowAnimation.fold);

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell6 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell7 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotNull(cell6);
        TKAssertNull(cell7);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell1);
        TKAssertNotExactEquals(cell6, cell3);
        TKAssertNotExactEquals(cell6, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 0);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 520);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 200);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 0.5);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell5);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell6);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell6.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 180);
        TKAssertFloatEquals(cell2.position.y, 220);
        TKAssertFloatEquals(cell3.position.y, 260);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell5.position.y, 100);
        TKAssertFloatEquals(cell6.position.y, 140);
        TKAssertFloatEquals(cell4.alpha, 1);
        TKAssertFloatEquals(cell5.alpha, 1);
        TKAssertFloatEquals(cell6.alpha, 1);
    },

    testInsertConsecutiveVisibleRowsRight: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 13;
        listView.insertRowAtIndexPath(JSIndexPath(0, 1), UIListView.RowAnimation.right);
        listView.insertRowAtIndexPath(JSIndexPath(0, 2), UIListView.RowAnimation.right);
        listView.insertRowAtIndexPath(JSIndexPath(0, 3), UIListView.RowAnimation.right);
        listView.insertRowAtIndexPath(JSIndexPath(0, 4), UIListView.RowAnimation.right);

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell6 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        var cell7 = listView.cellAtIndexPath(JSIndexPath(0, 4));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotNull(cell6);
        TKAssertNull(cell7);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell1);
        TKAssertNotExactEquals(cell5, cell3);
        TKAssertNotExactEquals(cell5, cell1);
        TKAssertNotExactEquals(cell6, cell3);
        TKAssertNotExactEquals(cell6, cell1);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 450);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 450);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 450);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 0);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 520);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 300);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 300);
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 300);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 200);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 0.5);
        TKAssertFloatEquals(cell6.layer.presentation.alpha, 0.5);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell5);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell6);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell6.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 20);
        TKAssertFloatEquals(cell1.position.y, 180);
        TKAssertFloatEquals(cell2.position.y, 220);
        TKAssertFloatEquals(cell3.position.y, 260);
        TKAssertFloatEquals(cell4.position.y, 60);
        TKAssertFloatEquals(cell5.position.y, 100);
        TKAssertFloatEquals(cell6.position.y, 140);
        TKAssertFloatEquals(cell4.alpha, 1);
        TKAssertFloatEquals(cell5.alpha, 1);
        TKAssertFloatEquals(cell6.alpha, 1);
    },

    testInsertNonConsecutiveVisibleRows: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 150));
        listView.rowHeight = 40;
        var numberOfRows = 9;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return 1;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return numberOfRows;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        listView.editAnimationDuration = 1.0;

        this.window.contentView.addSubview(listView);
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay(1.0);

        // initial cells
        var cell0 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell1 = listView.cellAtIndexPath(JSIndexPath(0, 1));
        var cell2 = listView.cellAtIndexPath(JSIndexPath(0, 2));
        var cell3 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell0);
        TKAssertNotNull(cell1);
        TKAssertNotNull(cell2);
        TKAssertNotNull(cell3);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 360);

        numberOfRows = 11;
        listView.insertRowAtIndexPath(JSIndexPath(0, 0));
        listView.insertRowAtIndexPath(JSIndexPath(0, 3));

        this.windowServer.displayServer.updateDisplay(2.0);
        // second update kicks off the animations
        this.windowServer.displayServer.updateDisplay(2.0);
        // new visible cell should appear at end
        var cell4 = listView.cellAtIndexPath(JSIndexPath(0, 0));
        var cell5 = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertNotNull(cell4);
        TKAssertNotNull(cell5);
        TKAssertNotExactEquals(cell4, cell3);
        TKAssertNotExactEquals(cell4, cell0);
        TKAssertNotExactEquals(cell5, cell3);
        // cells should be in pre-animation positions
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(listView.contentSize.width, 300);
        TKAssertFloatEquals(listView.contentSize.height, 440);

        this.windowServer.displayServer.updateDisplay(2.5);
        // cells should be mid-animation
        // (cell4 moving and everything following pushing down)
        TKAssertFloatEquals(cell0.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell1.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell3.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell4.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell5.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell0.layer.presentation.position.y, 40);
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(cell5.layer.presentation.alpha, 1);

        this.windowServer.displayServer.updateDisplay(3.0);

        // final positions
        var cell = listView.cellAtIndexPath(JSIndexPath(0, 0));
        TKAssertExactEquals(cell, cell4);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 1));
        TKAssertExactEquals(cell, cell0);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 2));
        TKAssertExactEquals(cell, cell1);
        cell = listView.cellAtIndexPath(JSIndexPath(0, 3));
        TKAssertExactEquals(cell, cell5);

        TKAssertNull(cell3.superview);
        TKAssertFloatEquals(cell0.position.x, 150);
        TKAssertFloatEquals(cell1.position.x, 150);
        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell0.position.y, 60);
        TKAssertFloatEquals(cell1.position.y, 100);
        TKAssertFloatEquals(cell2.position.y, 180);
        TKAssertFloatEquals(cell3.position.y, 220);
        TKAssertFloatEquals(cell4.position.y, 20);
        TKAssertFloatEquals(cell5.position.y, 140);
        TKAssertFloatEquals(cell4.alpha, 1);
        TKAssertFloatEquals(cell5.alpha, 1);
    },

    testStickyHeaders: function(){
        var CustomCell = UIListViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomCellInit.push({identifier: identifier, styler: styler});
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var CustomHeader = UIListViewHeaderFooterView.$extend({
            initWithReuseIdentifier: function(identifier){
                calls.CustomHeaderInit.push({identifier: identifier});
                CustomHeader.$super.initWithReuseIdentifier.call(this, identifier);
            }
        }, "CustomHeader1");
        var calls = {
            CustomCellInit: [],
            CustomHeaderInit: [],
            headerViewForListViewSection: [],
            numberOfSectionsInListView: [],
            numberOfRowsInListViewSection: [],
            cellForListViewAtIndexPath: []
        };
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 120));
        listView.registerCellClassForReuseIdentifier(CustomCell, "test");
        listView.registerHeaderFooterClassForReuseIdentifier(CustomHeader, "header");
        listView.rowHeight = 40;
        listView.headerHeight = 20;
        listView.headersStickToTop = true;

        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                calls.numberOfSectionsInListView.push({listView: listView});
                return 3;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                calls.numberOfRowsInListViewSection.push({listView: listView, sectionIndex: sectionIndex});
                return 3;
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                calls.cellForListViewAtIndexPath.push({listView: listView, indexPath: indexPath});
                var cell = listView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },

            headerViewForListViewSection: function(listView, section){
                calls.headerViewForListViewSection.push({listView: listView, section: section});
                var header = listView.dequeueReusableHeaderWithIdentifier("header", section);
                return header;
            }
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        listView.reloadData();
        TKAssert(listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 0);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 0);
        this.windowServer.displayServer.updateDisplay();
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfSectionsInListView[0].listView, listView);
        TKAssertGreaterThanOrEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertLessThanOrEquals(calls.numberOfRowsInListViewSection.length, 10);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[0].sectionIndex, 0);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[1].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[1].sectionIndex, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[2].listView, listView);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection[2].sectionIndex, 2);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[0].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[0].indexPath, JSIndexPath(0,0));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[1].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[1].indexPath, JSIndexPath(0,1));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[2].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[2].indexPath, JSIndexPath(0,2));
        TKAssertExactEquals(calls.CustomCellInit.length, 3);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 1);
        TKAssertExactEquals(calls.headerViewForListViewSection[0].listView, listView);
        TKAssertExactEquals(calls.headerViewForListViewSection[0].section, 0);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 1);

        var header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        var header1 = listView.headerAtSection(1);
        TKAssertNull(header1);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 0);

        listView.contentOffset = JSPoint(0, 10);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 1);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 1);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 10);

        listView.contentOffset = JSPoint(0, 30);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 3);
        TKAssertExactEquals(calls.headerViewForListViewSection[1].listView, listView);
        TKAssertExactEquals(calls.headerViewForListViewSection[1].section, 1);
        TKAssertExactEquals(calls.headerViewForListViewSection[2].listView, listView);
        TKAssertExactEquals(calls.headerViewForListViewSection[2].section, 0);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 30);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 140);

        listView.contentOffset = JSPoint(0, 110);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 3);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 110);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 140);

        listView.contentOffset = JSPoint(0, 130);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 3);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 120);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 140);

        listView.contentOffset = JSPoint(0, 200);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 7);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 5);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNull(header0);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        var header2 = listView.headerAtSection(2);
        TKAssertNotNull(header2);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 200);
        TKAssertFloatEquals(header2.frame.origin.x, 0);
        TKAssertFloatEquals(header2.frame.origin.y, 280);

        listView.contentOffset = JSPoint(0, 190);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 8);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 5);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNull(header0);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        header2 = listView.headerAtSection(2);
        TKAssertNotNull(header2);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 190);
        TKAssertFloatEquals(header2.frame.origin.x, 0);
        TKAssertFloatEquals(header2.frame.origin.y, 280);

        listView.contentOffset = JSPoint(0, 150);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 8);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 5);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNull(header0);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        header2 = listView.headerAtSection(2);
        TKAssertNull(header2);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 150);

        listView.contentOffset = JSPoint(0, 130);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 9);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 6);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        header2 = listView.headerAtSection(2);
        TKAssertNull(header2);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 120);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 140);

        listView.contentOffset = JSPoint(0, 70);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 10);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 6);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        header1 = listView.headerAtSection(1);
        TKAssertNotNull(header1);
        header2 = listView.headerAtSection(2);
        TKAssertNull(header2);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 70);
        TKAssertFloatEquals(header1.frame.origin.x, 0);
        TKAssertFloatEquals(header1.frame.origin.y, 140);

        listView.contentOffset = JSPoint(0, 20);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 11);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 6);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        header1 = listView.headerAtSection(1);
        TKAssertNull(header1);
        header2 = listView.headerAtSection(2);
        TKAssertNull(header2);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 20);

        listView.contentOffset = JSPoint(0, 0);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 11);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
        TKAssertExactEquals(calls.headerViewForListViewSection.length, 6);
        TKAssertExactEquals(calls.CustomHeaderInit.length, 2);
        header0 = listView.headerAtSection(0);
        TKAssertNotNull(header0);
        header1 = listView.headerAtSection(1);
        TKAssertNull(header1);
        header2 = listView.headerAtSection(2);
        TKAssertNull(header2);
        TKAssertFloatEquals(header0.frame.origin.x, 0);
        TKAssertFloatEquals(header0.frame.origin.y, 0);
    },

    testSelectionAfterEdit: function(){
        var listView = UIListView.initWithFrame(JSRect(0, 0, 300, 300));
        var sections = [5,6,7,8,9,10];
        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return sections.length;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return sections[sectionIndex];
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay();

        listView.selectedIndexPaths = [
            JSIndexPath(0, 0),
            JSIndexPath(0, 1),
            JSIndexPath(0, 2),
            JSIndexPath(0, 3),// x
            JSIndexPath(0, 4),
            JSIndexPath(1, 3),
            JSIndexPath(3, 1),// x
            JSIndexPath(5, 7),
        ];

        sections.splice(2,2);
        listView.deleteSection(3, UIListView.RowAnimation.none);
        listView.deleteSection(2, UIListView.RowAnimation.none);
        listView.deleteRowsAtIndexPaths([
            JSIndexPath(0,3),
            JSIndexPath(4,2),
            JSIndexPath(4,3),
            JSIndexPath(5,6),
            JSIndexPath(5,8),
            JSIndexPath(1,1)
        ], UIListView.RowAnimation.none);
        sections[0] -= 1;
        sections[1] -= 1;
        sections[4] -= 2;
        sections[5] -= 2;
        listView.insertSection(1, UIListView.RowAnimation.none);
        sections.splice(1,0,5);
        listView.insertRowsAtIndexPaths([
            JSIndexPath(0,2),
            JSIndexPath(0,4),
            JSIndexPath(0,5),
            JSIndexPath(2,4)
        ], UIListView.RowAnimation.none);
        sections[0] += 3;
        sections[2] += 1;
        this.windowServer.displayServer.updateDisplay();
        var selected = listView.selectedIndexPaths;
        TKAssertEquals(selected.length, 6);
        TKAssertObjectEquals(selected[0], JSIndexPath(0, 0));
        TKAssertObjectEquals(selected[1], JSIndexPath(0, 1));
        TKAssertObjectEquals(selected[2], JSIndexPath(0, 3));
        TKAssertObjectEquals(selected[3], JSIndexPath(0, 6));
        TKAssertObjectEquals(selected[4], JSIndexPath(2, 2));
        TKAssertObjectEquals(selected[5], JSIndexPath(4, 6));



        listView = UIListView.initWithFrame(JSRect(0, 0, 300, 300));
        sections = [6];
        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return sections.length;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return sections[sectionIndex];
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay();

        listView.selectedIndexPaths = [
            JSIndexPath(0, 3),
        ];

        listView.insertRowsAtIndexPaths([
            JSIndexPath(0,3)
        ], UIListView.RowAnimation.none);
        sections[0] += 1;
        this.windowServer.displayServer.updateDisplay();
        selected = listView.selectedIndexPaths;
        TKAssertEquals(selected.length, 1);
        TKAssertObjectEquals(selected[0], JSIndexPath(0, 4));


        listView = UIListView.initWithFrame(JSRect(0, 0, 300, 300));
        sections = [6];
        listView.dataSource = {
            numberOfSectionsInListView: function(listView){
                return sections.length;
            },

            numberOfRowsInListViewSection: function(listView, sectionIndex){
                return sections[sectionIndex];
            }
        };

        listView.delegate = {
            cellForListViewAtIndexPath: function(listView, indexPath){
                var cell = UIListViewCell.init();
                return cell;
            },
        };

        this.window.contentView.addSubview(listView);
        this.windowServer.displayServer.updateDisplay();
        listView.reloadData();
        this.windowServer.displayServer.updateDisplay();

        listView.selectedIndexPaths = [
            JSIndexPath(0, 3),
        ];

        listView.deleteRowsAtIndexPaths([
            JSIndexPath(0,2)
        ], UIListView.RowAnimation.none);
        sections[0] += 1;
        this.windowServer.displayServer.updateDisplay();
        selected = listView.selectedIndexPaths;
        TKAssertEquals(selected.length, 1);
        TKAssertObjectEquals(selected[0], JSIndexPath(0, 2));
    }

});