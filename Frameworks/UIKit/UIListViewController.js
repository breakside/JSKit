// #import "UIKit/UIViewController.js"
// #import "UIKit/UIListView.js"
// #import "UIKit/UIListViewCell.js"
/* global JSClass, UIViewController, UIListView, UIListViewCell, JSReadOnlyProperty */
'use strict';

JSClass("UIListViewController", UIViewController, {

    listView: JSReadOnlyProperty('_listView', null),

    init: function(){
    },

    initWithSpec: function(){
    },

    loadView: function(){
        this._listView = UIListView.init();
        this._listView.delegate = this;
        this._listView.dataSource = this;
        this._view = this._listView;
    },

    numberOfSectionsInListView: function(listView){
        return 0;
    },

    numberOfRowsInListViewSection: function(listView, sectionIndex){
        return 0;
    }

});