// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSAttributedString.js"
// #import "Foundation/JSColor.js"
/* global JSClass, JSObject, JSDynamicProperty, JSAttributedString, JSCopy, JSColor, JSRange */
'use strict';

JSClass("JSTextLayoutManager", JSObject, {

    textStorage: JSDynamicProperty('_textStorage', null),
    defaultFont: JSDynamicProperty('_defaultFont', null),
    defaultTextColor: JSDynamicProperty('_defaultTextColor', null),

    delegate: null,

    _textContainers: null,
    _needsLayout: false,
    _temporaryAttributes: null,

    init: function(){
        this._textContainers = [];
        this._defaultTextColor = JSColor.blackColor();
    },

    // MARK: - Managing Containers

    addTextContainer: function(container){
        this.insertTextContainerAtIndex(container, this._textContainers.length);
    },

    insertTextContainerAtIndex: function(container, index){
        this._textContainers.splice(index, 0, container);
        container.textLayoutManager = this;
    },

    removeTextContainerAtIndex: function(index){
        var container = this._textContainers[index];
        container.textLayoutManager = null;
        this._textContainers.splice(index, 1);
    },

    // MARK: - Managing Storage

    replaceTextStorage: function(storage){
        var originalStorage = this._textStorage;
        if (originalStorage !== null){
            var managers = originalStorage.layoutManagers;
            originalStorage.removeAllLayoutManagers();
            var manager;
            for (var i = 0, l = managers.length; i < l; ++i){
                manager = managers[i];
                storage.addLayoutManager(manager);
            }
        }else{
            storage.addLayoutManager(this);
        }
        this.setNeedsLayout();
    },

    // MARK: - Styling

    setDefaultFont: function(font){
        this._defaultFont = font;
        this.setNeedsLayout();
    },

    setDefaultTextColor: function(color){
        this._defaultTextColor = color;
        this.setNeedsLayout();
    },

    // MARK: - Private Helpers for finalizing runs

    effectiveAttributedString: function(){
        var defaultAttributes = {};
        defaultAttributes[JSAttributedString.Attribute.Font] = this._defaultFont;
        defaultAttributes[JSAttributedString.Attribute.TextColor] = this._defaultTextColor;
        var str = JSAttributedString.initWithAttributedString(this._textStorage, defaultAttributes);
        // TODO: add temporary attributes
        return str;
    },

    // MARK: - Layout

    setNeedsLayout: function(){
        this._needsLayout = true;
        if (this.delegate && this.delegate.layoutManagerDidInvalidateLayout){
            this.delegate.layoutManagerDidInvalidateLayout(this);
        }
    },

    layoutIfNeeded: function(){
        if (this._needsLayout){
            this.layout();
        }
    },

    layout: function(){
        var attributedString = this.effectiveAttributedString();
        var str = attributedString.string;
        var range = JSRange(0, str.length);
        var containerIndex = 0;
        while (containerIndex < this._textContainers.length){
            var container = this._textContainers[containerIndex++];
            container.createTextFrame(attributedString, range);
            range.advance(container.textFrame.range.length);
            if (this.delegate && this.delegate.layoutManagerDidCompleteLayoutForContainer){
                this.delegate.layoutManagerDidCompleteLayoutForContainer(this, container, range.length > 0);
            }
        }
        this._needsLayout = false;
    },

    textStorageDidReplaceCharactersInRange: function(range, insertedLength){
        // TODO: is there a way to be smarter here and only adjust the pieces that have changed?
        this.setNeedsLayout();
    },

    textStorageDidChangeAttributesInRange: function(range){
        // TODO: is there a way to be smarter here and only adjust the pieces that have changed?
        this.setNeedsLayout();
    }

    // TODO: temporary attributes

});