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

JSClass("UIOutlineViewTests", TKTestSuite, {

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

    testIndexPathIterator: function(){
        // 0 ---
        //   0               0.0
        //     0             0.0.0
        //     1             0.0.1
        //   1               0.1
        //   2 (collapsed)   0.2
        //     0
        // 1 ---
        // 2 ---
        //   0               2.0
        var CustomCell = UIOutlineViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var outlineView = UIOutlineView.initWithFrame(JSRect(0, 0, 300, 100));
        outlineView.registerCellClassForReuseIdentifier(CustomCell, "test");
        outlineView.rowHeight = 40;

        outlineView.dataSource = {
            numberOfSectionsInOutlineView: function(outlineView){
                return 3;
            },

            outlineViewExpandedIndexPaths: function(){
                return [
                    JSIndexPath(0, 0),
                ];
            },

            outlineViewIsExandableAtIndexPath: function(outlineView, indexPath){
                switch (indexPath.length){
                    case 2:
                        switch (indexPath.section){
                            case 0:
                                switch (indexPath.row){
                                    case 0:
                                        return true;
                                    case 2:
                                        return true;
                                }
                                return false;
                        }
                        return false;
                }
                return false;
            },

            outlineViewNumberOfChildrenAtIndexPath: function(outlineView, indexPath){
                switch (indexPath.length){
                    case 1:
                        switch (indexPath.section){
                            case 0:
                                return 3;
                            case 2:
                                return 1;
                        }
                        return 0;
                    case 2:
                        switch (indexPath.section){
                            case 0:
                                switch (indexPath.row){
                                    case 0:
                                        return 2;
                                    case 2:
                                        return 1;
                                }
                                return 0;
                            case 2:
                                return 1;
                        }
                        return 0;
                }
                return 0;
            },
        };

        outlineView.delegate = {
            cellForListViewAtIndexPath: function(outlineView, indexPath){
                var cell = outlineView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },
        };

        this.window.contentView.addSubview(outlineView);
        this.app.updatedDisplay();
        outlineView.reloadData();
        this.app.updatedDisplay();

        var iterator = outlineView._indexPathIteratorForSection(0);
        TKAssertNotNull(iterator.indexPath);
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,0]));
        iterator.increment();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,0,0]));
        iterator.increment();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,0,1]));
        iterator.increment();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,1]));
        iterator.increment();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,2]));
        iterator.increment();
        TKAssertNull(iterator.indexPath);

        iterator = outlineView._indexPathIteratorForSection(0, -1);
        TKAssertNotNull(iterator.indexPath);
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,2]));
        iterator.decrement();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,1]));
        iterator.decrement();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,0,1]));
        iterator.decrement();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,0,0]));
        iterator.decrement();
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([0,0]));
        iterator.decrement();
        TKAssertNull(iterator.indexPath);

        iterator = outlineView._indexPathIteratorForSection(1);
        TKAssertNull(iterator.indexPath);
        iterator.increment();
        TKAssertNull(iterator.indexPath);

        iterator = outlineView._indexPathIteratorForSection(1, -1);
        TKAssertNull(iterator.indexPath);
        iterator.decrement();
        TKAssertNull(iterator.indexPath);

        iterator = outlineView._indexPathIteratorForSection(2);
        TKAssertNotNull(iterator.indexPath);
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([2, 0]));
        iterator.increment();
        TKAssertNull(iterator.indexPath);

        iterator = outlineView._indexPathIteratorForSection(2,-1);
        TKAssertNotNull(iterator.indexPath);
        TKAssertObjectEquals(iterator.indexPath, JSIndexPath([2,0]));
        iterator.decrement();
        TKAssertNull(iterator.indexPath);
    },

    testReloadData: function(){
        // 0 ---
        //   0               0.0
        //     0             0.0.0
        //     1             0.0.1
        //   1               0.1
        //   2 (collapsed)   0.2
        //     0
        // 1 ---
        // 2 ---
        //   0               2.0
        var outlineView = UIOutlineView.initWithFrame(JSRect(0, 0, 300, 300));
        outlineView.rowHeight = 40;
        var calls = {
            numberOfSectionsInOutlineView: [],
            outlineViewIsExandableAtIndexPath: [],
            outlineViewNumberOfChildrenAtIndexPath: [],
            cellForListViewAtIndexPath: []
        };

        outlineView.dataSource = {
            numberOfSectionsInOutlineView: function(outlineView){
                calls.numberOfSectionsInOutlineView.push({outlineView: outlineView});
                return 3;
            },

            outlineViewExpandedIndexPaths: function(){
                return [
                    JSIndexPath(0, 0),
                ];
            },

            outlineViewIsExandableAtIndexPath: function(outlineView, indexPath){
                calls.outlineViewIsExandableAtIndexPath.push({outlineView: outlineView, indexPath: indexPath});
                switch (indexPath.length){
                    case 2:
                        switch (indexPath.section){
                            case 0:
                                switch (indexPath.row){
                                    case 0:
                                        return true;
                                    case 2:
                                        return true;
                                }
                                return false;
                        }
                        return false;
                }
                return false;
            },

            outlineViewNumberOfChildrenAtIndexPath: function(outlineView, indexPath){
                calls.outlineViewNumberOfChildrenAtIndexPath.push({outlineView: outlineView, indexPath: indexPath});
                switch (indexPath.length){
                    case 1:
                        switch (indexPath.section){
                            case 0:
                                return 3;
                            case 2:
                                return 1;
                        }
                        return 0;
                    case 2:
                        switch (indexPath.section){
                            case 0:
                                switch (indexPath.row){
                                    case 0:
                                        return 2;
                                    case 2:
                                        return 1;
                                }
                                return 0;
                            case 2:
                                return 1;
                        }
                        return 0;
                }
                return 0;
            },
        };

        outlineView.delegate = {
            cellForListViewAtIndexPath: function(outlineView, indexPath){
                calls.cellForListViewAtIndexPath.push({outlineView: outlineView, indexPath: indexPath});
                var cell = UIOutlineViewCell.init();
                return cell;
            },
        };

        this.window.contentView.addSubview(outlineView);
        this.app.updatedDisplay();
        TKAssert(!outlineView.layer.needsLayout());
        outlineView.reloadData();
        TKAssert(outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 0);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 0);
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 0);
        this.app.updatedDisplay();
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView[0].outlineView, outlineView);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 6);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[0].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[0].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[1].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[1].indexPath, JSIndexPath([0,0,0]));
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[2].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[2].indexPath, JSIndexPath([0,0,1]));
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[3].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[3].indexPath, JSIndexPath([0,1]));
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[4].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[4].indexPath, JSIndexPath([0,2]));
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[5].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[5].indexPath, JSIndexPath([2,0]));
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 20);
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[0].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[0].indexPath, JSIndexPath([0]));
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[1].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[1].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[2].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[2].indexPath, JSIndexPath([1]));
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[3].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[3].indexPath, JSIndexPath([2]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 6);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[0].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[0].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[1].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[1].indexPath, JSIndexPath([0,0,0]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[2].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[2].indexPath, JSIndexPath([0,0,1]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[3].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[3].indexPath, JSIndexPath([0,1]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[4].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[4].indexPath, JSIndexPath([0,2]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[5].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[5].indexPath, JSIndexPath([2,0]));
    },

    testScrolling: function(){
        // 0 ---
        //   0               0.0
        //     0             0.0.0
        //     1             0.0.1
        //   1               0.1
        //   2 (collapsed)   0.2
        //     0
        // 1 ---
        // 2 ---
        //   0               2.0
        var CustomCell = UIOutlineViewCell.$extend({
            initWithReuseIdentifier: function(identifier, styler){
                calls.CustomCellInit.push({identifier: identifier, styler: styler});
                CustomCell.$super.initWithReuseIdentifier.call(this, identifier, styler);
            }
        }, "CustomCell1");
        var outlineView = UIOutlineView.initWithFrame(JSRect(0, 0, 300, 100));
        outlineView.registerCellClassForReuseIdentifier(CustomCell, "test");
        outlineView.rowHeight = 40;
        var calls = {
            CustomCellInit: [],
            numberOfSectionsInOutlineView: [],
            outlineViewIsExandableAtIndexPath: [],
            outlineViewNumberOfChildrenAtIndexPath: [],
            cellForListViewAtIndexPath: []
        };

        outlineView.dataSource = {
            numberOfSectionsInOutlineView: function(outlineView){
                calls.numberOfSectionsInOutlineView.push({outlineView: outlineView});
                return 3;
            },

            outlineViewExpandedIndexPaths: function(){
                return [
                    JSIndexPath(0, 0),
                ];
            },

            outlineViewIsExandableAtIndexPath: function(outlineView, indexPath){
                calls.outlineViewIsExandableAtIndexPath.push({outlineView: outlineView, indexPath: indexPath});
                switch (indexPath.length){
                    case 2:
                        switch (indexPath.section){
                            case 0:
                                switch (indexPath.row){
                                    case 0:
                                        return true;
                                    case 2:
                                        return true;
                                }
                                return false;
                        }
                        return false;
                }
                return false;
            },

            outlineViewNumberOfChildrenAtIndexPath: function(outlineView, indexPath){
                calls.outlineViewNumberOfChildrenAtIndexPath.push({outlineView: outlineView, indexPath: indexPath});
                switch (indexPath.length){
                    case 1:
                        switch (indexPath.section){
                            case 0:
                                return 3;
                            case 2:
                                return 1;
                        }
                        return 0;
                    case 2:
                        switch (indexPath.section){
                            case 0:
                                switch (indexPath.row){
                                    case 0:
                                        return 2;
                                    case 2:
                                        return 1;
                                }
                                return 0;
                            case 2:
                                return 1;
                        }
                        return 0;
                }
                return 0;
            },
        };

        outlineView.delegate = {
            cellForListViewAtIndexPath: function(outlineView, indexPath){
                calls.cellForListViewAtIndexPath.push({outlineView: outlineView, indexPath: indexPath});
                var cell = outlineView.dequeueReusableCellWithIdentifier("test", indexPath);
                return cell;
            },
        };

        this.window.contentView.addSubview(outlineView);
        this.app.updatedDisplay();
        TKAssert(!outlineView.layer.needsLayout());
        outlineView.reloadData();
        TKAssert(outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 0);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 0);
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 0);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 0);
        this.app.updatedDisplay();
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView[0].outlineView, outlineView);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 3);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[0].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[0].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[1].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[1].indexPath, JSIndexPath([0,0,0]));
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath[2].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewIsExandableAtIndexPath[2].indexPath, JSIndexPath([0,0,1]));
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 10);
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[0].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[0].indexPath, JSIndexPath([0]));
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[1].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[1].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[2].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[2].indexPath, JSIndexPath([1]));
        TKAssertExactEquals(calls.outlineViewNumberOfChildrenAtIndexPath[3].outlineView, outlineView);
        TKAssertObjectEquals(calls.outlineViewNumberOfChildrenAtIndexPath[3].indexPath, JSIndexPath([2]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[0].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[0].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[1].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[1].indexPath, JSIndexPath([0,0,0]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[2].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[2].indexPath, JSIndexPath([0,0,1]));
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        outlineView.contentOffset = JSPoint(0, 15);
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 3);
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 15);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 3);
        TKAssertExactEquals(calls.CustomCellInit.length, 3);

        outlineView.contentOffset = JSPoint(0, 25);
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 4);
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 20);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[3].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[3].indexPath, JSIndexPath([0,1]));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        outlineView.contentOffset = JSPoint(0, 40);
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 4);
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 25);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        outlineView.contentOffset = JSPoint(0, 60);
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 4);
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 30);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 4);
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        outlineView.contentOffset = JSPoint(0, 10);
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 5);
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 35);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 5);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[4].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[4].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        outlineView.contentOffset = JSPoint(0, 120);
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 8);
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 40);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 8);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[5].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[5].indexPath, JSIndexPath([0,1]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[6].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[6].indexPath, JSIndexPath([0,2]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[7].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[7].indexPath, JSIndexPath([2,0]));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);

        outlineView.contentOffset = JSPoint(0, 0);
        TKAssert(!outlineView.layer.needsLayout());
        TKAssertExactEquals(calls.numberOfSectionsInOutlineView.length, 1);
        TKAssertExactEquals(calls.outlineViewIsExandableAtIndexPath.length, 11);
        TKAssertLessThanOrEquals(calls.outlineViewNumberOfChildrenAtIndexPath.length, 45);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath.length, 11);
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[8].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[8].indexPath, JSIndexPath([0,0]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[9].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[9].indexPath, JSIndexPath([0,0,0]));
        TKAssertExactEquals(calls.cellForListViewAtIndexPath[10].outlineView, outlineView);
        TKAssertObjectEquals(calls.cellForListViewAtIndexPath[10].indexPath, JSIndexPath([0,0,1]));
        TKAssertExactEquals(calls.CustomCellInit.length, 4);
    }

});