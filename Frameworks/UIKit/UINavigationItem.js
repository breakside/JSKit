// #import "UIView.js"
// #import "UINavigationBarItem.js"
'use strict';

JSClass("UINavigationItem", JSObject, {

    title: JSDynamicProperty('_title', null),
    view: JSDynamicProperty('_view', null),
    backBarButtonItem: JSDynamicProperty('_backBarButtonItem', null),
    rightBarItems: JSDynamicProperty('_rightBarItems', null),
    leftBarItems: JSDynamicProperty('_leftBarItems', null),

    init: function(args){
        this._rightBarItems = [];
        this._leftBarItems = [];
    },

    initWithSpec: function(spec){
        UINavigationItem.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("title")){
            this._title = spec.valueForKey("title");
        }
        if (spec.containsKey("view")){
            this._view = spec.valueForKey("view", UIView);
        }
        if (spec.containsKey("backBarButtonItem")){
            this._backBarButtonItem = spec.valueForKey("backBarButtonItem", UINavigationItem);
        }
        this._rightBarItems = [];
        this._leftBarItems = [];
        var i, l;
        var rightItems = spec.arrayForKey("rightBarItems");
        if (rightItems !== null){
            for (i = 0, l = rightItems.length; i < l; ++i){
                this._rightBarItems.push(rightItems.valueForKey(i, UINavigationBarItem));
            }
        }
        var leftItems = spec.arrayForKey("rightBarItems");
        if (leftItems !== null){
            for (i = 0, l = leftItems.length; i < l; ++i){
                this._leftBarItems.push(leftItems.valueForKey(i, UINavigationBarItem));
            }
        }
    },

    _navigationBar: null,

    setTitle: function(title){
        this._title = title;
        this._notifyNavigationBar();
    },

    setView: function(view){
        this._view = view;
        this._notifyNavigationBar();
    },

    setBackBarButtonItem: function(backBarButtonItem){
        this._backBarButtonItem = backBarButtonItem;
        this._notifyNavigationBar();
    },

    setRightBarItems: function(items){
        this._rightBarItems = JSCopy(items);
        this._notifyNavigationBar();
    },

    setLeftBarItems: function(items){
        this._leftBarItems = JSCopy(items);
        this._notifyNavigationBar();
    },

    _notifyNavigationBar: function(){
        if (this._navigationBar){
            this._navigationBar.update();
        }
    }

});