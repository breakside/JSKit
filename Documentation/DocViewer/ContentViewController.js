// Copyright © 2020 Breakside Inc.  MIT License.
// #import UIKit
/* global JSClass, UIViewController, ContentViewController, JSURL, JSRect */
'use strict';

JSClass("ContentViewController", UIViewController, {

    headerView: null,
    breadcrumbView: null,
    menuButton: null,
    webView: null,
    delegate: null,
    baseURL: null,
    componentsByURLPath: null,

    initWithSpec: function(spec){
        ContentViewController.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("delegate")){
            this.delegate = spec.valueForKey("delegate");
        }
        this.menuButtonInsets = JSInsets(3, 7);
    },

    setComponents: function(components){
        this.componentsByURLPath = {};
        this.addComponentsByURLPath(components, []);
    },

    addComponentsByURLPath: function(components, ancestors){
        var prefix = this.baseURL.path + 'docs/';
        for (var i = 0, l = components.length; i < l; ++i){
            var component = components[i];
            var path = prefix + component.url;
            this.componentsByURLPath[path] = {
                ancestors: ancestors,
                component: component
            };
            if (component.children){
                this.addComponentsByURLPath(component.children, ancestors.concat(component));
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - View Lifecycle

    viewDidLoad: function(){
        ContentViewController.$super.viewDidLoad.call(this);
    },

    viewDidAppear: function(){
        ContentViewController.$super.viewDidAppear.call(this);
    },

    webViewDidLoadURL: function(webView, url){
        var components = this.componentsForURL(url);
        this.breadcrumbView.setComponents(components);
        if (this.delegate && this.delegate.contentViewDidShowComponent && components.length > 0){
            this.delegate.contentViewDidShowComponent(this, components[components.length - 1]);
        }
    },

    showComponent: function(component){
        var url = JSURL.initWithString('docs/' + component.url);
        this.webView.loadURL(url);
    },

    componentsForURL: function(url){
        var info = this.componentsByURLPath[url.path];
        if (!info){
            return [];
        }
        return info.ancestors.concat(info.component);
    },

    viewDidLayoutSubviews: function(){
        var headerHeight = 31;
        var buttonSize = headerHeight - 1 - this.menuButtonInsets.height;
        this.headerView.frame = JSRect(0, 0, this.view.bounds.size.width, headerHeight);
        this.menuButton.frame = JSRect(this.view.bounds.size.width - buttonSize - this.menuButtonInsets.right, this.menuButtonInsets.top, buttonSize, buttonSize);
        this.breadcrumbView.frame = JSRect(0, 0, this.menuButton.frame.origin.x - this.menuButtonInsets.left, headerHeight - 1);
        this.webView.frame = JSRect(0, headerHeight, this.view.bounds.size.width, this.view.bounds.size.height - headerHeight);
    }

});