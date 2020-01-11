// #import Foundation
// #import "UIResponder.js"
/* global JSClass, JSObject, UIResponder, JSCopy, UIView, JSDynamicProperty, UIViewController, JSReadOnlyProperty, UITabViewItem */
'use strict';

JSClass("UIViewController", UIResponder, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a View Controller

    init: function(){
    },

    initWithSpec: function(spec){
        if (spec.containsKey(this._viewKeyInSpec)){
            // If the spec has a view, always load from the spec
            Object.defineProperty(this, 'loadView', {
                configurable: true,
                value: function UIView_loadViewFromSpec(){
                    // FIXME: using a class default here isn't ideal because what if some other
                    // part of the spec has a reference to the view and resolves it before us
                    // without knowing the correct default class?
                    this._view = spec.valueForKey(this._viewKeyInSpec, this._defaultViewClass);
                }
            });
        }
        UIViewController.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('tabViewItem')){
            this.tabViewItem = spec.valueForKey("tabViewItem", UITabViewItem);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Creating the View

    view: JSDynamicProperty('_view', null),
    window: JSReadOnlyProperty(),
    scene: JSReadOnlyProperty(),
    isViewLoaded: JSReadOnlyProperty('_isViewLoaded'),
    _defaultViewClass: UIView,
    _viewKeyInSpec: "view",

    getView: function(){
        this._loadViewIfNeeded();
        return this._view;
    },

    loadView: function(){
        this._view = this._defaultViewClass.init();
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