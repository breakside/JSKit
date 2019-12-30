// #import Foundation
// #import "UIResponder.js"
/* global JSClass, JSObject, UIResponder, JSCopy, UIView, JSDynamicProperty, UIViewController, JSReadOnlyProperty */
'use strict';

JSClass("UIViewController", UIResponder, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a View Controller

    init: function(){
    },

    initWithSpec: function(spec, values){
        this._spec = spec;
        this._viewInSpec = values.view || null;
        if (this._viewInSpec !== null){
            Object.defineProperty(this, 'loadView', {
                configurable: true,
                value: UIViewController.prototype.loadView
            });
        }
        UIViewController.$super.initWithSpec.call(this, spec, values);
        if ('tabViewItem' in values){
            this.tabViewItem = spec.resolvedValue(values.tabViewItem, "UITabViewItem");
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Creating the View

    view: JSDynamicProperty('_view', null),
    window: JSReadOnlyProperty(),
    scene: JSReadOnlyProperty(),
    isViewLoaded: JSReadOnlyProperty('_isViewLoaded'),
    _defaultViewClass: "UIView",
    _viewInSpec: null,
    _spec: null,

    getView: function(){
        this._loadViewIfNeeded();
        return this._view;
    },

    loadView: function(){
        // If we were created via initWithSpec, and the spec contained a
        // view property for us, always load that view because it may have
        // properties from the spec that the developer expects to be honored.
        // Otherwise, just call loadView
        if (this._spec !== null && this._viewInSpec !== null){
            // FIXME: using a class default here isn't ideal because what if some other
            // part of the spec has a reference to the view and resolves it before us
            // without knowing the correct default class?
            this._view = this._spec.resolvedValue(this._viewInSpec, this._defaultViewClass);
        }
        if (this._view === null){
            this._view = JSClass.FromName(this._defaultViewClass).init();
        }
    },

    unloadView: function(){
        if (this._view !== null){
            this._view.viewController = null;
            this._view = null;
            this._isViewLoaded = false;
            this.viewDidUnload();
        }
    },

    _loadViewIfNeeded: function(){
        if (!this._isViewLoaded){
            this.loadView();
            this._view.viewController = this;
            this._isViewLoaded = true;
            this.viewDidLoad();
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - View Lifecycle

    viewDidLoad: function(){
    },

    viewDidUnload: function(){
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