// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIView, JSDynamicProperty, UIViewController */
'use strict';

JSClass("UIViewController", JSObject, {
    view:           JSDynamicProperty('_view', null),
    isViewLoaded:   false,
    _spec:          null,
    _viewKeyInSpec: null,

    // -------------------------------------------------------------------------
    // MARK: - Creating a View Controller

    init: function(){
    },

    initWithSpec: function(spec, values){
        UIViewController.$super.initWithSpec.call(this, spec, values);
        this._spec = spec;
        this._viewKeyInSpec = values.view;
    },

    // -------------------------------------------------------------------------
    // MARK: - Creating the View

    loadView: function(){
        if (this._spec !== null){
            this._view = this._spec.resolvedValue(this._viewKeyInSpec);
        }else{
            this._view = UIView.initWithFrame();
        }
        this.isViewLoaded = true;
        this.viewDidLoad();
    },

    getView: function(){
        this._loadViewIfNeeded();
        return this._view;
    },

    setView: function(view){
        this._view = view;
    },

    // -------------------------------------------------------------------------
    // MARK: - View Lifecycle

    viewDidLoad: function(){
    },

    viewWillAppear: function(){
    },

    viewDidAppear: function(){
    },

    viewWillDisappear: function(){
    },

    viewDidDisappear: function(){
    },

    // -------------------------------------------------------------------------
    // MARK: - Private Helpers

    // MARK: View Loading

    _loadViewIfNeeded: function(){
        if (!this.isViewLoaded){
            this.loadView();
        }
    }

});