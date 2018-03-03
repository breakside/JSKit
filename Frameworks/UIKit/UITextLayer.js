// #import "UIKit/UILayer.js"
// #import "UIKit/UIWindowServer.js"
/* global JSClass, JSDynamicProperty, JSRect, JSPoint, JSSize, JSInsets, UILayer, UITextLayer, JSAttributedString, JSTextLayoutManager, JSTextContainer, JSTextStorage, UIWindowServer */
'use strict';

JSClass("UITextLayer", UILayer, {

    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),
    font: JSDynamicProperty(),
    textColor: JSDynamicProperty(),
    lineBreakMode: JSDynamicProperty(),
    textAlignment: JSDynamicProperty(),
    textInsets: JSDynamicProperty('_textInsets', JSInsets.Zero),
    maximumNumberOfLines: JSDynamicProperty(),
    sizeTracksText: JSDynamicProperty(),

    _textStorage: null,
    _displayTextLayoutManager: null,
    _displayTextContainer: null,

    // MARK: - Creating a UITextLayer

    init: function(){
        UITextLayer.$super.init.call(this);
        this._commonTextLayerInit();
    },

    _commonTextLayerInit: function(){
        this._displayTextLayoutManager = JSTextLayoutManager.init();
        this._displayTextLayoutManager.delegate = this;
        this._displayTextContainer = JSTextContainer.initWithSize(this._availableTextSize());
        this._displayTextContainer.framesetter = null;
        this._textStorage = JSTextStorage.init();
        this._textStorage.addLayoutManager(this._displayTextLayoutManager);
        this._displayTextLayoutManager.addTextContainer(this._displayTextContainer);
        this.setNeedsLayout();
    },

    didChangeSize: function(){
        UITextLayer.$super.didChangeSize.call(this);
        this._displayTextContainer.size = this._availableTextSize();
    },

    // MARK: - Styling

    getFont: function(){
        return this._displayTextLayoutManager.defaultFont;
    },

    setFont: function(font){
        this._displayTextLayoutManager.defaultFont = font;
    },

    getTextColor: function(){
        return this._displayTextLayoutManager.defaultTextColor;
    },

    setTextColor: function(color){
        this._displayTextLayoutManager.defaultTextColor = color;
        this.setNeedsDisplay();
    },

    getLineBreakMode: function(){
        return this._displayTextContainer.lineBreakMode;
    },

    setLineBreakMode: function(lineBreakMode){
        this._displayTextContainer.lineBreakMode = lineBreakMode;
    },

    getTextAlignment: function(){
        return this._displayTextContainer.textAlignment;
    },

    setTextAlignment: function(textAlignment){
        this._displayTextContainer.textAlignment = textAlignment;
    },

    setTextInsets: function(insets){
        this._textInsets = JSInsets(insets);
        this._displayTextContainer.size = this._availableTextSize();
    },

    getMaximumNumberOfLines: function(){
        return this._displayTextContainer.maximumNumberOfLines;
    },

    setMaximumNumberOfLines: function(maxLines){
        this._displayTextContainer.maximumNumberOfLines = maxLines;
        this._displayTextContainer.size = this._availableTextSize();
    },

    getSizeTracksText: function(){
        return this._displayTextContainer.sizeTracksText;
    },

    setSizeTracksText: function(sizeTracksText){
        this._displayTextContainer.sizeTracksText = sizeTracksText;
    },

    // MARK: - Fetching & Updating Text

    getText: function(){
        return this._textStorage.string;
    },

    setText: function(text){
        this.setAttributedText(JSAttributedString.initWithString(text));
    },

    getAttributedText: function(){
        return this._textStorage;
    },

    setAttributedText: function(text){
        if (!text.isKindOfClass(JSTextStorage)){
            text = JSTextStorage.initWithAttributedString(text);
        }
        this._textStorage = text;
        this._displayTextLayoutManager.replaceTextStorage(this._textStorage);
        this.setNeedsDisplay();
    },

    // MARK: - Point location to character index conversion

    characterIndexAtPoint: function(point){
        point = JSPoint(point.x - this._textInsets.left, point.y - this._textInsets.top);
        var index = this._displayTextContainer.characterIndexAtPoint(point);
        return index;
    },

    rectForCharacterAtIndex: function(index){
        var rect = this._displayTextContainer.rectForCharacterAtIndex(index);
        rect.origin = JSPoint(rect.origin.x + this._textInsets.left, rect.origin.y + this._textInsets.top);
        return rect;
    },

    lineContainingCharacterAtIndex: function(index){
        return this._displayTextContainer.lineContainingCharacterAtIndex(index);
    },

    // MARK: - Drawing

    _availableTextSize: function(){
        var width = this.bounds.size.width - this._textInsets.left - this._textInsets.right;
        var height = this.bounds.size.height - this._textInsets.top - this._textInsets.bottom;
        return JSSize(width, height);
    },

    drawInContext: function(context){
        var textOrigin = JSPoint(this._textInsets.left, this._textInsets.top);
        if (this._isDisplayContext(context)){
            this._displayTextLayoutManager.layoutIfNeeded();
            if (this._displayTextContainer.textFrame !== null){
                this._displayTextContainer.textFrame.drawInContextAtPoint(context, textOrigin);
            }
        }else{
            var layoutManager = JSTextLayoutManager.init();
            var textContainer = JSTextContainer.initWithSize(this._displayTextContainer.size);
            textContainer.maximumNumberOfLines = this._displayTextContainer.maximumNumberOfLines;
            textContainer.lineBreakMode = this._displayTextContainer.lineBreakMode;
            textContainer.textAlignment = this._displayTextContainer.textAlignment;
            layoutManager.addTextContainer(textContainer);
            this._textStorage.addLayoutManager(layoutManager);
            textContainer.textFrame.drawInContextAtPoint(context, textOrigin);
            this._textStorage.removeLayoutManagerAtIndex(1);
        }
    },

    layoutSublayers: function(){
        UITextLayer.$super.layoutSublayers.call(this);
        if (this._displayServer !== null){
            if (this._displayTextContainer.framesetter === null){
                this._displayTextContainer.framesetter = this._displayServer.createTextFramesetter();
            }
            this._displayTextLayoutManager.layoutIfNeeded();
        }
        if (this.sizeTracksText && this._displayTextContainer.textFrame !== null){
            this.bounds = JSRect(
                0,
                0,
                this._displayTextContainer.textFrame.size.width + this._textInsets.left + this._textInsets.right,
                this._displayTextContainer.textFrame.size.height + this._textInsets.top + this._textInsets.bottom
            );
        }
    },

    // MARK: - Layout Manager delegate

    layoutManagerDidInvalidateLayout: function(){
        this.setNeedsLayout();
        this.setNeedsDisplay();
    }

});