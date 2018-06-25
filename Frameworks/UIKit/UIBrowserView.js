// #import "UIKit/UIView.js"
/* global UIBrowserView */
'use strict';

JSClass("UIBrowserView", UIScrollView, {

    // --------------------------------------------------------------------
    // MARK: - Creating A Browser View

    initWithFrame: function(frame){
        UIBrowserView.$super.initWithFrame.call(this, frame);
        this._commonBrowserInit();
    },

    initWithSpec: function(spec, values){
        UIBrowserView.$super.initWithSpec.call(this, spec, values);
        this._commonBrowserInit();
    },

    _commonBrowserInit: function(){
        this._listViews = [];
        this._dividerViews = [];
    },

    // --------------------------------------------------------------------
    // MARK: - Columns

    _listViews: null,
    _dividerViews: null,

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        UIBrowserView.$super.layoutSubviews.call(this);
    }


});