// Copyright © 2020 Breakside Inc.  MIT License.
// #import UIKit
/* global window, document, JSClass, UIDualPaneViewController, MainViewController, JSBundle, JSURL, JSUserDefaults */
'use strict';

JSClass("MainViewController", UIDualPaneViewController, {

    baseURL: null,
    sidebarViewController: null,
    contentViewController: null,
    components: null,

    // --------------------------------------------------------------------
    // MARK: - View Lifecycle

    viewDidLoad: function(){
        MainViewController.$super.viewDidLoad.call(this);
    },

    setup: function(componentPath){
        this.components = JSBundle.mainBundle.metadataForResourceName('components').value.components;
        this.sidebarViewController.setComponents(this.components);
        this.contentViewController.baseURL = this.baseURL;
        this.contentViewController.setComponents(this.components);

        var path = componentPath || JSUserDefaults.shared.lastComponentPath || this.components[0].url;
        if (path.startsWith('/')){
            path = path.substr(1);
        }
        this._initialComponent = this.componentForPath(this.components, path) || this.components[0];
    },

    _initialComponent: null,

    componentForPath: function(components, path){
        var candidate;
        for (var i = 0, l = components.length; i < l; ++i){
            candidate = components[i];
            if (candidate.url == path){
                return candidate;
            }
            if (candidate.children){
                candidate = this.componentForPath(candidate.children, path);
                if (candidate !== null){
                    return candidate;
                }
            }
        }
        return null;
    },

    viewDidAppear: function(){
        MainViewController.$super.viewDidAppear.call(this);
        if (this._initialComponent){
            this.sidebarViewController.selectComponent(this._initialComponent);
            this._initialComponent = null;
        }
    },

    contentViewDidShowComponent: function(contentViewController, component){
        var url = JSURL.initWithString(component.url, this.baseURL);
        var title;
        JSUserDefaults.shared.lastComponentPath = component.url;
        title = JSBundle.mainBundle.localizedStringForInfoKey("UIApplicationTitle");
        if (component === this.components[0]){
            window.history.replaceState(null, title, this.baseURL.path);
            document.title = title;
        }else{
            title = "%s | %s".sprintf(component.title, title);
            window.history.replaceState(null, title, url.path);
            document.title = title;
        }
    },

    sidebarViewDidSelectComponent: function(sidebarViewController, component){
        this.contentViewController.showComponent(component);
    },

    indicateUpdateAvailable: function(){
        this.sidebarViewController.indicateUpdateAvailable();
    }

});