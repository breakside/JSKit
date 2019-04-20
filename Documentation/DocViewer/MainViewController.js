// #import UIKit
/* global JSClass, UIDualPaneViewController, MainViewController, JSBundle, JSURL */
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

    setup: function(){
        this.components = JSBundle.mainBundle.metadataForResourceName('components').value.components;
        this.sidebarViewController.setComponents(this.components);
        this.contentViewController.baseURL = this.baseURL;
        this.contentViewController.setComponents(this.components);
        // TODO: show last viewed component
        this.contentViewController.showComponent(this.components[0]);
    },

    viewDidAppear: function(){
        MainViewController.$super.viewDidAppear.call(this);
    },

    contentViewDidShowComponent: function(contentViewController, component){
        var url = JSURL.initWithString(component.url, this.baseURL);
        // window.history.replaceState(null, null, url.path);
    },

    sidebarViewDidSelectComponent: function(sidebarViewController, component){
        this.contentViewController.showComponent(component);
    }

});