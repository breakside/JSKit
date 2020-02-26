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

// #import "UIViewController.js"
// #import "UIListView.js"
// #import "UIListViewCell.js"
'use strict';

JSClass("UIListViewController", UIViewController, {

    listView: JSReadOnlyProperty(),
    _defaultViewClass: UIListView,

    viewDidLoad: function(){
        UIListViewController.$super.viewDidLoad.call(this);
        if (this.view.delegate === null){
            this.view.delegate = this;
        }
        if (this.view.dataSource === null){
            this.view.dataSource = this;
        }
    },

    getListView: function(){
        return this._view;
    },

    numberOfSectionsInListView: function(listView){
        return 0;
    },

    numberOfRowsInListViewSection: function(listView, sectionIndex){
        return 0;
    },

    cellForListViewAtIndexPath: function(listView, indexPath){
        throw new Error("%s must implement cellForListViewAtIndexPath()".sprintf(this.$class.className));
    },

    listViewShouldSelectCellAtIndexPath: function(listView, indexPath){
        return true;
    },

    listViewDidSelectCellAtIndexPath: function(listView, indexPath){
    },

    listViewDidFinishSelectingCellAtIndexPath: function(listView, indexPath){
    },

    listViewDidOpenCellAtIndexPath: function(listView, indexPath){
    },

    listViewSelectionDidChange: function(listView, selectedIndexPaths){
    },

    menuForListViewCellAtIndexPath: function(listView, indexPath){
        return null;
    },

    listViewShouldDragCellAtIndexPath: function(listView, indexPath){
        return false;
    }

});