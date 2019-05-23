// #import UIKit
/* global JSClass, UIViewController, SidebarViewController, JSImage, JSInsets, JSRect, UIListView, UIListViewCell */
'use strict';

(function(){

JSClass("SidebarViewController", UIViewController, {

    headerView: null,
    searchField: null,
    outlineView: null,
    delegate: null,
    root: null,
    components: null,

    initWithSpec: function(spec, values){
        SidebarViewController.$super.initWithSpec.call(this, spec, values);
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
        this.components = [];
    },

    // --------------------------------------------------------------------
    // MARK: - View Lifecycle

    viewDidLoad: function(){
        SidebarViewController.$super.viewDidLoad.call(this);
    },

    viewDidAppear: function(){
        SidebarViewController.$super.viewDidAppear.call(this);
    },

    viewDidLayoutSubviews: function(){
        var searchSize = this.searchField.intrinsicSize;
        var searchInsets = JSInsets(5, 6, 6, 6);
        this.headerView.frame = JSRect(0, 0, this.view.bounds.size.width, searchSize.height + searchInsets.top + searchInsets.bottom);
        this.searchField.frame = this.headerView.bounds.rectWithInsets(searchInsets);
        this.outlineView.frame = this.view.bounds;
        this.outlineView.contentInsets = JSInsets(this.headerView.frame.size.height, 0, 0, 0);
        if (this.searchListView){
            this.searchListView.frame = this.outlineView.frame;
            this.searchListView.contentInsets = this.outlineView.contentInsets;
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Managing Compnents


    setComponents: function(components){
        this.root = components[0];
        this.components = this.root.children;
        this.outlineView.reloadData();
    },

    componentAtIndexPath: function(indexPath){
        if (indexPath.section === 0){
            return this.root;
        }
        var component = this.components[indexPath.row];
        for (var i = 2, l = indexPath.length; i < l; ++i){
            component = component.children[indexPath[i]];
        }
        return component;
    },

    numberOfSectionsInOutlineView: function(outlineView){
        return 2;
    },

    outlineViewNumberOfChildrenAtIndexPath: function(outlineView, indexPath){
        if (indexPath.section === 0){
            return 1;
        }
        if (indexPath.length === 1){
            return this.components.length;
        }
        var component = this.componentAtIndexPath(indexPath);
        return component.children.length;
    },

    outlineViewIsExandableAtIndexPath: function(outlineView, indexPath){
        if (indexPath.section === 0){
            return false;
        }
        var component = this.componentAtIndexPath(indexPath);
        return component.children && component.children.length > 0;
    },

    outlineViewIsExpandedAtIndexPath: function(outlineView, indexPath){
        return false;
    },

    cellForListViewAtIndexPath: function(listView, indexPath){
        var cell;
        var component;
        if (listView === this.searchListView){
            component = this.searchResults[indexPath.row];
            cell = listView.dequeueReusableCellWithIdentifier('result', indexPath);
            // TODO: highlight text where it matches search
            cell.titleLabel.text = component.name;
            cell.imageView.image = imageByKind[component.kind](component);
            return cell;
        }
        component = this.componentAtIndexPath(indexPath);
        if (component.kind == 'topic'){
            cell = listView.dequeueReusableCellWithIdentifier('topic', indexPath);
        }else{
            cell = listView.dequeueReusableCellWithIdentifier('item', indexPath);
            cell.imageView.image = imageByKind[component.kind](component);
        }
        cell.titleLabel.text = component.name;
        return cell;
    },

    listViewShouldSelectCellAtIndexPath: function(listView, indexPath){
        if (listView === this.searchListView){
            return true;
        }
        var component = this.componentAtIndexPath(indexPath);
        return component.kind !== 'topic';
    },

    listViewDidSelectCellAtIndexPath: function(listView, indexPath){
        var component;
        if (listView === this.searchListView){
            component = this.searchResults[indexPath.row];
        }else{
            component = this.componentAtIndexPath(indexPath);
        }
        if (this.delegate && this.delegate.sidebarViewDidSelectComponent){
            this.delegate.sidebarViewDidSelectComponent(this, component);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Searching

    searchListView: null,
    searchResults: null,

    searchChanged: function(searchField){
        if (searchField.text === null || searchField.text === ''){
            this.hideSearchResults();
            return;
        }
        if (!this.searchListView){
            this.showSearchResults();
        }
        this.updateSearchResultsForText(searchField.text);
    },

    hideSearchResults: function(){
        if (this.searchListView){
            this.searchListView.delegate = null;
            this.searchListView.dataSource = null;
            this.searchListView.removeFromSuperview();
            this.searchListView = null;
            this.searchResults = null;
        }
        this.outlineView.hidden = false;
    },

    showSearchResults: function(){
        this.view.setNeedsLayout();
        this.outlineView.hidden = true;
        if (!this.searchListView){
            this.searchListView = UIListView.initWithStyler(this.outlineView.styler);
            this.searchListView.delegate = this;
            this.searchListView.dataSource = this;
            this.searchListView.rowHeight = 24;
            this.searchListView.registerCellClassForReuseIdentifier(UIListViewCell, "result");
            this.outlineView.superview.insertSubviewAboveSibling(this.searchListView, this.outlineView);
            this.searchResults = [];
        }
    },

    updateSearchResultsForText: function(search){
        this.searchResults = [];
        var component;
        search = search.toLowerCase();
        for (var i = 0, l = this.items.length; i < l; ++i){
            component = this.items[i].component;
            if (component.kind !== 'topic'){
                if (component.name.toLowerCase().indexOf(search) >= 0){
                    this.searchResults.push(component);
                }
            }
        }
        this.searchListView.reloadData();
    },

    clearSearch: function(){
        this.searchField.text = "";
        this.searchChanged(this.searchField);
    }

});

var imageByKind = {
    'index': function(){ return images.frameworkIcon; },
    'class': function(){ return images.classIcon; },
    'constructor': function(){ return images.constructorIcon; },
    'document': function(){ return images.docIcon; },
    'enum': function(){ return images.enumIcon; },
    'framework': function(){ return images.frameworkIcon; },
    'function': function(){ return images.functionIcon; },
    'init': function(){ return images.initIcon; },
    'method': function(component){ return component.static ? images.staticmethodIcon : images.methodIcon; },
    'property': function(component){ return component.static ? images.staticpropertyIcon : images.propertyIcon; },
    'protocol': function(){ return images.protocolIcon; },
    'spec': function(){ return images.specIcon; },
    'specproperty': function(){ return images.specpropertyIcon; }
};

var images = JSImage.resourceCache([
    'classIcon',
    'constructorIcon',
    'docIcon',
    'enumIcon',
    'frameworkIcon',
    'functionIcon',
    'initIcon',
    'methodIcon',
    'propertyIcon',
    'protocolIcon',
    'staticmethodIcon',
    'staticpropertyIcon',
    'specIcon',
    'specpropertyIcon'
]);

})();