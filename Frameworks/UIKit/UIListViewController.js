// #import "UIViewController.js"
// #import "UIListView.js"
// #import "UIListViewCell.js"
/* global JSClass, UIViewController, UIListViewController, JSDeepCopy, UIListView, UIListViewCell, JSReadOnlyProperty */
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