// #import UIKit
/* global JSClass, UIViewController, ContentViewController, JSURL, JSRect */
'use strict';

JSClass("ContentViewController", UIViewController, {

    breadcrumbView: null,
    webView: null,
    delegate: null,
    baseURL: null,
    componentsByURLPath: null,

    initWithSpec: function(spec, values){
        ContentViewController.$super.initWithSpec.call(this, spec, values);
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
    },

    setComponents: function(components){
        this.componentsByURLPath = {};
        this.addComponentsByURLPath(components, []);
    },

    addComponentsByURLPath: function(components, ancestors){
        var prefix = this.baseURL.path;
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
        var url = JSURL.initWithString(component.url, this.baseURL);
        this.webView.loadURL(url);
        var components = this.componentsForURL(url);
        this.breadcrumbView.setComponents(components);
    },

    componentsForURL: function(url){
        var info = this.componentsByURLPath[url.path];
        if (!info){
            return [];
        }
        return info.ancestors.concat(info.component);
    },

    viewDidLayoutSubviews: function(){
        var breadcrumbHeight = 32;
        this.breadcrumbView.frame = JSRect(0, 0, this.view.bounds.size.width, breadcrumbHeight);
        this.webView.frame = JSRect(0, breadcrumbHeight, this.view.bounds.size.width, this.view.bounds.size.height - breadcrumbHeight);
    }

});