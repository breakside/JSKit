// #import "UIKit/UIViewController.js"
// #import "UIKit/UIListView.js"
// #import "UIKit/UIListViewCell.js"
/* global JSClass, UIViewController, UIListViewController, UIListView, UIListViewCell, JSReadOnlyProperty */
'use strict';

JSClass("UIListViewController", UIViewController, {

    listView: JSReadOnlyProperty(),
    _defaultViewClass: "UIListView",

    init: function(){
    },

    initWithSpec: function(spec, values){
        UIListViewController.$super.initWithSpec.call(this, spec, values);
        if ('view' in values){
            if (!('delegate' in values)){
                values.view.delegate = this;
            }
            if (!('dataSource' in values)){
                values.view.dataSource = this;
            }
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