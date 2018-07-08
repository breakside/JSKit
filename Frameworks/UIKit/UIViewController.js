// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
/* global JSClass, JSObject, UIResponder, UIView, JSDynamicProperty, UIViewController, JSReadOnlyProperty */
'use strict';

JSClass("UIViewController", UIResponder, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a View Controller

    init: function(){
    },

    initWithSpec: function(spec, values){
        this._spec = spec;
        this._outletsInSpec = values.outlets || null;
        this._bindingsInSpec = values.bindings || null;
        this._viewInSpec = values.view || null;
        // Delaying the typical outlet and binding instantiation until we load the
        // view because most outlets will likely be subviews, and we don't want
        // to do any work instantiating them until a view load is requested.
        if ('outlets' in values){
            delete values.outlets;
        }
        if ('bindings' in values){
            delete values.bindings;
        }
        UIViewController.$super.initWithSpec.call(this, spec, values);
        if ('tabViewItem' in values){
            this.tabViewItem = spec.resolvedValue(values.tabViewItem, "UITabViewItem");
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Creating the View

    view: JSReadOnlyProperty('_view', null),
    window: JSReadOnlyProperty(),
    scene: JSReadOnlyProperty(),
    isViewLoaded: false,
    _defaultViewClass: "UIView",
    _viewInSpec: null,
    _outletsInSpec: null,
    _bindingsInSpec: null,
    _spec: null,

    getView: function(){
        this._loadViewIfNeeded();
        return this._view;
    },

    loadView: function(){
        this._view = JSClass.FromName(this._defaultViewClass).init();
    },

    _loadViewIfNeeded: function(){
        if (!this.isViewLoaded){
            // If we were created via initWithSpec, and the spec contained a
            // view property for us, always load that view because it may have
            // properties from the spec that the developer expects to be honored.
            // Otherwise, just call loadView
            if (this._spec !== null){
                if (this._outletsInSpec !== null){
                    this._initSpecOutlets(this._spec, this._outletsInSpec);
                }
                if (this._bindingsInSpec !== null){
                    this._initSpecBindings(this._spec, this._bindingsInSpec);
                }
                if (this._viewInSpec !== null){
                    this._view = this._spec.resolvedValue(this._viewInSpec, this._defaultViewClass);
                }else{
                    this._view = JSClass.FromName(this._defaultViewClass).init();
                }
                this._viewInSpec = null;
                this._outletsInSpec = null;
                this._bindingsInSpec = null;
                this._spec = null;
            }else{
                this.loadView();
            }
            this._view.viewController = this;
            this.isViewLoaded = true;
            this.viewDidLoad();
        }
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

    sizeViewToFitSize: function(size){
        this.view.sizeToFitSize(size);
    },

    // -------------------------------------------------------------------------
    // MARK: - Child View Controllers

    parentViewController: null,

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
    // MARK: - State Restoration

    restorationIdentifier: null


});