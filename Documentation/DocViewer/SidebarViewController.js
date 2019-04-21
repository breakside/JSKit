// #import UIKit
/* global JSClass, UIViewController, SidebarViewController, JSImage, JSInsets, JSRect, UIListView, UIListViewCell */
'use strict';

(function(){

JSClass("SidebarViewController", UIViewController, {

    headerView: null,
    searchField: null,
    listView: null,
    delegate: null,
    items: null,

    initWithSpec: function(spec, values){
        SidebarViewController.$super.initWithSpec.call(this, spec, values);
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
        this.items = [];
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
        this.listView.frame = this.view.bounds;
        this.listView.contentInsets = JSInsets(this.headerView.frame.size.height, 0, 0, 0);
        if (this.searchListView){
            this.searchListView.frame = this.listView.frame;
            this.searchListView.contentInsets = this.listView.contentInsets;
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Managing Compnents


    setComponents: function(components){
        this.items = [];
        if (components.length == 1){
            this.items.push({
                level: 0,
                component: components[0]
            });
            this.addItems(components[0].children, 0);
        }else{
            this.addItems(components, 0);
        }
        this.listView.reloadData();
    },

    addItems: function(components, level){
        for (var i = 0, l = components.length; i < l; ++i){
            var component = components[i];
            this.items.push({
                level: level,
                component: component
            });
            if (component.children){
                this.addItems(component.children, level + 1);
            }
        }
    },

    numberOfSectionsInListView: function(listView){
        return 1;
    },

    numberOfRowsInListViewSection: function(listView, sectionIndex){
        if (listView === this.searchListView){
            return this.searchResults.length;
        }
        return this.items.length;
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

        var item = this.items[indexPath.row];
        component = item.component;
        if (component.kind == 'topic'){
            cell = listView.dequeueReusableCellWithIdentifier('topic', indexPath);
        }else{
            cell = listView.dequeueReusableCellWithIdentifier('item', indexPath);
            cell.imageView.image = imageByKind[component.kind](component);
        }
        cell.titleLabel.text = component.name;
        cell.titleInsets = JSInsets(0, 4 + 20 * item.level, 0, 4);
        return cell;
    },

    listViewShouldSelectCellAtIndexPath: function(listView, indexPath){
        if (listView === this.searchListView){
            return true;
        }
        var component = this.items[indexPath.row].component;
        return component.kind !== 'topic';
    },

    listViewDidSelectCellAtIndexPath: function(listView, indexPath){
        var component;
        if (listView === this.searchListView){
            component = this.searchResults[indexPath.row];
        }else{
            component = this.items[indexPath.row].component;
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
        this.listView.hidden = false;
    },

    showSearchResults: function(){
        this.view.setNeedsLayout();
        this.listView.hidden = true;
        if (!this.searchListView){
            this.searchListView = UIListView.initWithStyler(this.listView.styler);
            this.searchListView.delegate = this;
            this.searchListView.dataSource = this;
            this.searchListView.rowHeight = 24;
            this.searchListView.registerCellClassForReuseIdentifier(UIListViewCell, "result");
            this.listView.superview.insertSubviewAboveSibling(this.searchListView, this.listView);
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
    'protocol': function(){ return images.protocolIcon; }

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
    'staticpropertyIcon'
]);

})();