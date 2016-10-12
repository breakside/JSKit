// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
/* global JSClass, JSObject, UIResponder, UIView, JSDynamicProperty, UIViewController, JSReadOnlyProperty */
'use strict';

JSClass("UIViewController", UIResponder, {
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
        // subclasses can implement this for custom view loading
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
    // MARK: - Responder

    getNextResponder: function(){
        return this.view.superview;
    },

    // -------------------------------------------------------------------------
    // MARK: - Private Helpers

    // MARK: View Loading

    _loadViewIfNeeded: function(){
        if (!this.isViewLoaded){
            this.loadView();
            if (this._view === null){
                this._loadViewDefault();
            }
            this._view.viewController = this;
            this.isViewLoaded = true;
            this.viewDidLoad();
        }
    }, 

    _loadViewDefault: function(){
        if (this._spec !== null){
            this._view = this._spec.resolvedValue(this._viewKeyInSpec);
        }else{
            this._view = UIView.initWithFrame();
        }
    },

});