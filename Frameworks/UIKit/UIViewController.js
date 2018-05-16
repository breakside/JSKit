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
        this._viewKeyInSpec = values.view || null;
        if ('tabViewItem' in values){
            this.tabViewItem = spec.resolvedValue(values.tabViewItem, "UITabViewItem");
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Creating the View

    loadView: function(){
        this._view = UIView.initWithFrame();
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
    // MARK: - Tab Bar

    tabViewItem: null,

    // -------------------------------------------------------------------------
    // MARK: - Private Helpers

    // MARK: View Loading

    _loadViewIfNeeded: function(){
        if (!this.isViewLoaded){
            // If we were created via initWithSpec, and the spec contained a
            // view property for us, always load that view because it may have
            // properties from the spec that the developer expects to be honored.
            // Otherwise, just call loadView
            if (this._spec !== null && this._viewKeyInSpec !== null){
                this._view = this._spec.resolvedValue(this._viewKeyInSpec, "UIView");
            }else{
                this.loadView();
            }
            this._view.viewController = this;
            this.isViewLoaded = true;
            this.viewDidLoad();
        }
    }



});