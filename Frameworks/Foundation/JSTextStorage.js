// #include "Foundation/JSAttributedString.js"
// #include "Foundation/JSTextLayoutManager.js"
/* global JSClass, JSAttributedString, JSTextStorage, JSReadOnlyProperty */
'use strict';

JSClass("JSTextStorage", JSAttributedString, {

    layoutManagers: JSReadOnlyProperty('_layoutManagers', null),

    initWithString: function(string, attributes){
        JSTextStorage.$super.initWithString.call(this, string, attributes);
        this._commonTextStorageInit();
    },

    initWithAttributedString: function(string){
        JSTextStorage.$super.initWithAttributedString.call(this, string);
        this._commonTextStorageInit();
    },

    _commonTextStorageInit: function(){
        this._layoutManagers = [];
    },

    addLayoutManager: function(manager){
        this._layoutManagers.push(manager);
        manager.textStorage = this;
    },

    removeLayoutManagerAtIndex: function(index){
        this._layoutManagers[index].textStorage = null;
        this._layoutManagers.splice(index, 1);
    },

    removeAllLayoutManagers: function(){
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorage = null;
        }
        this._layoutManagers = [];
    },

    replaceCharactersInRangeWithString: function(range, string){
        JSTextStorage.$super.replaceCharactersInRangeWithString.call(this, range, string);
        // TODO: notify layout managers
    },

    // TODO: attribute modification overrides to notify layout managers

});