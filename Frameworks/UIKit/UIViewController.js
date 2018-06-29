// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
/* global JSClass, JSObject, UIResponder, UIView, JSDynamicProperty, UIViewController, JSReadOnlyProperty */
'use strict';

JSClass("UIViewController", UIResponder, {
    parentViewController: null,
    view: JSDynamicProperty('_view', null),
    window: JSReadOnlyProperty(),
    scene: JSReadOnlyProperty(),
    isViewLoaded: false,
    _spec: null,
    _viewKeyInSpec: null,
    _defaultViewClass: "UIView",

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
        this._view = JSClass.FromName(this._defaultViewClass).init();
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

    viewDidLayoutSubviews: function(){
    },

    // -------------------------------------------------------------------------
    // MARK: - Child View Controllers

    addChildViewController: function(viewController){
        viewController.willMoveToParentViewController(this);
        viewController.parentViewController = this;
        viewController.didMoveToParentViewController(this);
    },

    removeFromParentViewController: function(){
        this.willMoveToParentViewController(null);
        this.parentViewController = null;
        this.didMoveToParentViewController(null);
    },

    willMoveToParentViewController: function(parentViewController){
    },

    didMoveToParentViewController: function(parentViewController){
    },

    // -------------------------------------------------------------------------
    // MARK: - Responder

    getNextResponder: function(){
        return this._view.superview;
    },

    // -------------------------------------------------------------------------
    // MARK: - Tab Bar

    tabViewItem: null,

    // -------------------------------------------------------------------------
    // MARK: - Scene

    getWindow: function(){
        if (this._view !== null){
            return this._view.window;
        }
        return null;
    },

    getScene: function(){
        var window = this.window;
        if (window !== null){
            return window.scene;
        }
        return null;
    },

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
                this._view = this._spec.resolvedValue(this._viewKeyInSpec, this._defaultViewClass);
            }else{
                this.loadView();
            }
            this._view.viewController = this;
            this.isViewLoaded = true;
            this.viewDidLoad();
        }
    }



});