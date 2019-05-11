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
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 3);
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
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 3);
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
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        listView.contentOffset = JSPoint(0, 25);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[3].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[3].indexPath, JSIndexPath(2,0));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 40);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 60);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 10);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 3);
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
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 1);
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
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        listView.contentOffset = JSPoint(0, 25);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[3].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[3].indexPath, JSIndexPath(0,3));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 40);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 60);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        listView.contentOffset = JSPoint(0, 10);
        TKAssert(!listView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInListView.length, 1);
        TKAssertExactEquals(calls.numberOfRowsInListViewSection.length, 1);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[4].listView, listView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[4].indexPath, JSIndexPath(0,0));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
    }

});