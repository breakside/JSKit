// #import "Foundation/JSAttributedString.js"
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
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidReplaceCharactersInRange(range, string.length);
        }
    },

    replaceCharactersInRangeWithAttributedString: function(range, attributedString){
        JSTextStorage.$super.replaceCharactersInRangeWithAttributedString.call(this, range, attributedString);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidReplaceCharactersInRange(range, attributedString.string.length);
        }
    },

    setAttributesInRange: function(attributes, range){
        JSTextStorage.$super.setAttributesInRange.call(this, attributes, range);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidChangeAttributesInRange(range);
        }
    },

    addAttributesInRange: function(attributes, range){
        JSTextStorage.$super.addAttributesInRange.call(this, attributes, range);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidChangeAttributesInRange(range);
        }
    },

    removeAttributesInRange: function(attributeNames, range){
        JSTextStorage.$super.removeAttributesInRange.call(this, attributeNames, range);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidChangeAttributesInRange(range);
        }
    }

});