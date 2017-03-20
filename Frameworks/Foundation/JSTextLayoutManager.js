// #include "Foundation/JSObject.js"
// #include "Foundation/CoreTypes.js"
// #include "Foundation/JSTextStorage.js"
/* global JSClass, JSObject, JSDynamicProperty, JSTextStorage, JSAttributedString, JSCopy, JSColor */
'use strict';

JSClass("JSTextLayoutManager", JSObject, {

    textStorage: JSDynamicProperty('_textStorage', null),
    defaultFont: JSDynamicProperty('_defaultFont', null),
    defaultTextColor: JSDynamicProperty('_defaultTextColor', null),

    delegate: null,

    _textContainers: null,
    _typesetter: null,
    _needsLayout: false,

    init: function(){
        this._textContainers = [];
        this._defaultTextColor = JSColor.blackColor();
    },

    // MARK: - Managing Containers

    addTextContainer: function(container){
        this.insertTextConatinerAtIndex(container, this._textContainers.length);
    },

    insertTextConatinerAtIndex: function(container, index){
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

    rangeOfRunAtIndex: function(index){
        return this._textStorage.rangeOfRunAtIndex(index);
    },

    attributesAtIndex: function(index){
        var attributes = this._textStorage.attributesAtIndex(index);
        if (!(JSAttributedString.Attribute.Font in attributes) || !(JSAttributedString.Attribute.TextColor in attributes)){
            attributes = JSCopy(attributes);
            if (!(JSAttributedString.Attribute.Font in attributes)){
                attributes[JSAttributedString.Attribute.Font] = this._defaultFont;
            }
            if (!(JSAttributedString.Attribute.TextColor in attributes)){
                attributes[JSAttributedString.Attribute.TextColor] = this._defaultTextColor;
            }
        }
        return attributes;
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
        var index = 0;
        var str = this._textStorage.string;
        var strLength = str.length;
        var range;
        var attributes;
        var containerIndex = 0;
        var container = this._textContainers.length > 0 ? this._textContainers[containerIndex] : null;
        if (container){
            container.beginLayout();
        }
        var consumed;
        var fragmentLength = 0;
        while (container && index < strLength){
            range = this.rangeOfRunAtIndex(index);
            fragmentLength = range.length - (index - range.location);
            attributes = this.attributesAtIndex(index);
            consumed = container.layout(str.substr(index, fragmentLength), index, attributes);
            index += consumed;
            if (consumed < fragmentLength){
                container.finishLayout();
                if (this.delegate && this.delegate.layoutManagerDidCompleteLayoutForContainer){
                    this.delegate.layoutManagerDidCompleteLayoutForContainer(this, container, false);
                }
                containerIndex += 1;
                container = containerIndex < this._textContainers.length ? this._textContainers[containerIndex] : null;
                if (container){
                    container.beginLayout();
                }
            }
        }
        if (container){
            container.finishLayout();
            if (this.delegate && this.delegate.layoutManagerDidCompleteLayoutForContainer){
                this.delegate.layoutManagerDidCompleteLayoutForContainer(this, container, true);
            }
        }
        this._needsLayout = false;
    },

    textStorageDidReplaceCharactersInRange: function(range, insertedLength){
        // TODO: is there a way to be smarter here and only adjust the pieces that have changed?
        this.setNeedsLayout();
    }

    // TODO: temporary attributes

});