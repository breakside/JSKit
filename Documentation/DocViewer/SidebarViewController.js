// #import UIKit
/* global JSClass, UIViewController, SidebarViewController, JSImage, JSInsets, JSRect */
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
        var searchInsets = JSInsets(6, 7, 7, 7);
        this.headerView.frame = JSRect(0, 0, this.view.bounds.size.width, searchSize.height + searchInsets.top + searchInsets.bottom);
        this.searchField.frame = this.headerView.bounds.rectWithInsets(searchInsets);
        this.listView.frame = this.view.bounds;
        this.listView.contentInsets = JSInsets(this.headerView.frame.size.height, 0, 0, 0);
    },

    setComponents: function(components){
        this.items = [];
        this.addItems(components, 0);
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
        return this.items.length;
    },

    cellForListViewAtIndexPath: function(listView, indexPath){
        var item = this.items[indexPath.row];
        var component = item.component;
        var cell;
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
        var component = this.items[indexPath.row].component;
        return component.kind !== 'topic';
    },

    listViewDidSelectCellAtIndexPath: function(listView, indexPath){
        var component = this.items[indexPath.row].component;
        if (this.delegate && this.delegate.sidebarViewDidSelectComponent){
            this.delegate.sidebarViewDidSelectComponent(this, component);
        }
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