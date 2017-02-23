// #include "Foundation/JSObject.js"
// #include "Foundation/CoreTypes.js"
// #include "Foundation/JSTextStorage.js"
/* global JSClass, JSObject, JSDynamicProperty, JSTextStorage, JSAttributedString, JSCopy, JSColor */
'use strict';

JSClass("JSTextLayoutManager", JSObject, {

    textStorage: JSDynamicProperty('_textStorage', null),
    defaultFont: JSDynamicProperty('_defaultFont', null),
    defaultTextColor: JSDynamicProperty('_defaultTextColor', null),

    _textContainers: null,
    _typesetter: null,
    _needsLayout: false,

    init: function(){
        this._textContainers = [];
        this._defaultTextColor = JSColor.blackColor();
    },

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

    setNeedsLayout: function(){
        this._needsLayout = true;
    },

    layoutIfNeeded: function(){
        if (this._needsLayout){
            this.layout();
        }
    },

    layout: function(){
        var index = 0;
        var str = this._textStorage.string.nativeString;
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
                containerIndex += 1;
                container = containerIndex < this._textContainers.length ? this._textContainers[containerIndex] : null;
                if (container){
                    container.beginLayout();
                }
            }
        }
        if (container){
            container.finishLayout();
        }
        this._needsLayout = false;
    }

    // TODO: notifications from text storage

    // TODO: temporary attributes

});