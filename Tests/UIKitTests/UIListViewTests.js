// #import UIKit
// #import TestKit
// #import "MockWindowServer.js"
/* global JSClass, TKTestSuite, UIListView, UIListViewCell, MockWindowServer, UIApplication, UIRootWindow, JSFont, JSRect, JSIndexPath, JSPoint */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals, TKAssertArrayEquals */
'use strict';

JSClass("UIListViewTests", TKTestSuite, {

    windowServer: null,
    app: null,
    window: null,

    setup: function(){
        this.windowServer = MockWindowServer.init();
        this.app = UIApplication.initWithWindowServer(this.windowServer);
        this.window = UIRootWindow.initWithApplication(this.app);
        this.window.makeKeyAndOrderFront();
        JSFont.registerDummySystemFont();
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
        this.windowServer = null;
        this.window = null;
        JSFont.unregisterDummySystemFont();
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
        // is 1-2 times per section.
        TKAssertGreaterThanOrEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertLessThanOrEquals(calls.numberOfRowsInListViewSection.length, 6);
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
        TKAssertLessThanOrEquals(calls.numberOfRowsInListViewSection.length, 6);
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
        TKAssertLessThanOrEquals(calls.numberOfRowsInListViewSection.length, 2);
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
        TKAssertFloatEquals(cell1.alpha, 0.0);
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
        TKAssertFloatEquals(cell1.alpha, 0.0);
        TKAssertFloatEquals(cell2.alpha, 0.0);
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
        TKAssertFloatEquals(cell0.alpha, 0.0);
        TKAssertFloatEquals(cell2.alpha, 0.0);
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

        cell6 = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertNotNull(cell6);
        TKAssertNotExactEquals(cell5, cell6);

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
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 100);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 140);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 180);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 220);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 260);
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
        TKAssertFloatEquals(cell6.layer.presentation.position.x, 150);
        TKAssertFloatEquals(cell2.layer.presentation.position.y, 80);
        TKAssertFloatEquals(cell3.layer.presentation.position.y, 120);
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 160);
        TKAssertFloatEquals(cell5.layer.presentation.position.y, 200);
        TKAssertFloatEquals(cell6.layer.presentation.position.y, 240);
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
        cell = listView.cellAtIndexPath(JSIndexPath(0, 5));
        TKAssertExactEquals(cell, cell6);

        TKAssertFloatEquals(cell2.position.x, 150);
        TKAssertFloatEquals(cell3.position.x, 150);
        TKAssertFloatEquals(cell4.position.x, 150);
        TKAssertFloatEquals(cell5.position.x, 150);
        TKAssertFloatEquals(cell6.position.x, 150);
        TKAssertFloatEquals(cell2.position.y, 60);
        TKAssertFloatEquals(cell3.position.y, 100);
        TKAssertFloatEquals(cell4.position.y, 140);
        TKAssertFloatEquals(cell5.position.y, 180);
        TKAssertFloatEquals(cell6.position.y, 220);
        TKAssertFloatEquals(listView.contentView.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.contentView.bounds.origin.y, 60);
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

        numberOfRows = 9;
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
        TKAssertFloatEquals(cell4.layer.presentation.position.y, 20);
        TKAssertFloatEquals(cell4.layer.presentation.alpha, 1);
        TKAssertFloatEquals(listView.layer.bounds.origin.x, 0);
        TKAssertFloatEquals(listView.layer.bounds.origin.y, 0);
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
        TKAssertFloatEquals(cell1.layer.presentation.position.y, 60);
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
        TKAssertNotExactEquals(cell, cell2);

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
    }

});