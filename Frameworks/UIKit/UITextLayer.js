// #import "UIKit/UILayer.js"
// #import "UIKit/UIWindowServer.js"
/* global JSClass, JSDynamicProperty, JSReadOnlyProperty, JSRect, JSPoint, JSSize, JSInsets, UILayer, UITextLayer, JSAttributedString, JSTextLayoutManager, JSTextContainer, JSTextStorage, UIWindowServer */
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
    textLayoutManager: JSReadOnlyProperty('_textLayoutManager', null),
    textContainer: JSReadOnlyProperty('_textContainer', null),

    // MARK: - Creating a UITextLayer

    init: function(){
        UITextLayer.$super.init.call(this);
        this._commonTextLayerInit();
    },

    _commonTextLayerInit: function(){
        this._textLayoutManager = JSTextLayoutManager.init();
        this._textLayoutManager.delegate = this;
        this._textContainer = JSTextContainer.initWithSize(this._availableTextSize());
        this._textContainer.framesetter = null;
        this._textStorage = JSTextStorage.init();
        this._textStorage.addLayoutManager(this._textLayoutManager);
        this._textLayoutManager.addTextContainer(this._textContainer);
        this.setNeedsLayout();
    },

    didChangeSize: function(){
        UITextLayer.$super.didChangeSize.call(this);
        this._textContainer.size = this._availableTextSize();
    },

    // MARK: - Styling

    getFont: function(){
        return this._textLayoutManager.defaultFont;
    },

    setFont: function(font){
        this._textLayoutManager.defaultFont = font;
    },

    getTextColor: function(){
        return this._textLayoutManager.defaultTextColor;
    },

    setTextColor: function(color){
        this._textLayoutManager.defaultTextColor = color;
        this.setNeedsDisplay();
    },

    getLineBreakMode: function(){
        return this._textContainer.lineBreakMode;
    },

    setLineBreakMode: function(lineBreakMode){
        this._textContainer.lineBreakMode = lineBreakMode;
    },

    getTextAlignment: function(){
        return this._textContainer.textAlignment;
    },

    setTextAlignment: function(textAlignment){
        this._textContainer.textAlignment = textAlignment;
    },

    setTextInsets: function(insets){
        this._textInsets = JSInsets(insets);
        this._textContainer.size = this._availableTextSize();
    },

    getMaximumNumberOfLines: function(){
        return this._textContainer.maximumNumberOfLines;
    },

    setMaximumNumberOfLines: function(maxLines){
        this._textContainer.maximumNumberOfLines = maxLines;
        this._textContainer.size = this._availableTextSize();
    },

    getSizeTracksText: function(){
        return this._textContainer.sizeTracksText;
    },

    setSizeTracksText: function(sizeTracksText){
        this._textContainer.sizeTracksText = sizeTracksText;
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
        this._textLayoutManager.replaceTextStorage(this._textStorage);
        this.setNeedsDisplay();
    },

    // MARK: - Drawing

    _availableTextSize: function(){
        var width = this.bounds.size.width - this._textInsets.left - this._textInsets.right;
        var height = this.bounds.size.height - this._textInsets.top - this._textInsets.bottom;
        return JSSize(width, height);
    },

    drawInContext: function(context){
        var textOrigin = JSPoint(this._textInsets.left, this._textInsets.top);
        this._textLayoutManager.layoutIfNeeded();
        this._textLayoutManager.drawContainerInContextAtPoint(this._textContainer, context, textOrigin);
        // if (this._isDisplayContext(context)){
        // }else{
        //     var layoutManager = JSTextLayoutManager.init();
        //     var textContainer = JSTextContainer.initWithSize(this._textContainer.size);
        //     textContainer.maximumNumberOfLines = this._textContainer.maximumNumberOfLines;
        //     textContainer.lineBreakMode = this._textContainer.lineBreakMode;
        //     textContainer.textAlignment = this._textContainer.textAlignment;
        //     layoutManager.addTextContainer(textContainer);
        //     this._textStorage.addLayoutManager(layoutManager);
        //     textContainer.textFrame.drawInContextAtPoint(context, textOrigin);
        //     this._textStorage.removeLayoutManagerAtIndex(1);
        // }
    },

    layoutSublayers: function(){
        UITextLayer.$super.layoutSublayers.call(this);
        if (this._displayServer !== null){
            if (this._textContainer.framesetter === null){
                this._textContainer.framesetter = this._displayServer.createTextFramesetter();
            }
            this._textContainer.origin = JSPoint(this._textInsets.left, this._textInsets.top);
            this._textLayoutManager.layoutIfNeeded();
        }
        if (this.sizeTracksText && this._textContainer.textFrame !== null){
            this.bounds = JSRect(
                0,
                0,
                this._textContainer.textFrame.size.width + this._textInsets.left + this._textInsets.right,
                this._textContainer.textFrame.size.height + this._textInsets.top + this._textInsets.bottom
            );
        }
    },

    // MARK: - Layout Manager delegate

    layoutManagerDidInvalidateLayout: function(layoutManager){
        this.setNeedsLayout();
        this.setNeedsDisplay();
    },

    layoutManagerTextContainerForLocation: function(layoutManager, location){
        return this._textContainer;
    }

});