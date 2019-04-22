// #import "UIViewController.js"
// #import "UIListView.js"
// #import "UIListViewCell.js"
/* global JSClass, UIViewController, UIListViewController, JSDeepCopy, UIListView, UIListViewCell, JSReadOnlyProperty */
'use strict';

JSClass("UIListViewController", UIViewController, {

    listView: JSReadOnlyProperty(),
    _defaultViewClass: "UIListView",

    init: function(){
    },

    initWithSpec: function(spec, values){
        if ('view' in values){
            values = JSDeepCopy(values);
            if (!('delegate' in values)){
                values.view.delegate = this;
            }
            if (!('dataSource' in values)){
                values.view.dataSource = this;
            }
        }
        UIListViewController.$super.initWithSpec.call(this, spec, values);
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