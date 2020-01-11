// #import "UIViewController.js"
// #import "UIListView.js"
// #import "UIListViewCell.js"
/* global JSClass, UIViewController, UIListViewController, JSDeepCopy, UIListView, UIListViewCell, JSReadOnlyProperty */
'use strict';

JSClass("UIListViewController", UIViewController, {

    listView: JSReadOnlyProperty(),
    _defaultViewClass: UIListView,

    init: function(){
    },

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

    loadView: function(){
        this._view = UIListView.init();
        this._view.delegate = this;
        this._view.dataSource = this;
    },

    numberOfSectionsInListView: function(listView){
        return 0;
    },

    numberOfRowsInListViewSection: function(listView, sectionIndex){
        return 0;
    }

});