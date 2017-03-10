// #import "UIKit/UILayer.js"
// #import "UIKit/UIWindowServer.js"
/* global JSClass, JSDynamicProperty, JSPoint, UILayer, UITextLayer, JSAttributedString, JSTextLayoutManager, JSTextContainer, JSTextStorage, UIWindowServer */
'use strict';

JSClass("UITextLayer", UILayer, {

    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),
    font: JSDynamicProperty(),
    textColor: JSDynamicProperty(),
    lineBreakMode: JSDynamicProperty(),
    textAlignment: JSDynamicProperty(),

    _textStorage: null,
    _displayTextLayoutManager: null,
    _displayTextContainer: null,
    _textContainer: null,
    _textLayoutManager: null,

    // MARK: - Creating a UITextLayer

    init: function(){
        UITextLayer.$super.init.call(this);
        this._commonTextLayerInit();
    },

    _commonTextLayerInit: function(){
        this._displayTextLayoutManager = JSTextLayoutManager.init();
        this._displayTextContainer = UIWindowServer.defaultServer.displayServer.createTextContainerWithSize(this.bounds.size);
        this._textStorage = JSTextStorage.init();
        this._textStorage.addLayoutManager(this._displayTextLayoutManager);
        this._displayTextLayoutManager.addTextContainer(this._displayTextContainer);
    },

    didChangeSize: function(){
        UITextLayer.$super.didChangeSize.call(this);
        this._displayTextContainer.size = this.bounds.size;
        this.setNeedsDisplay();
    },

    // MARK: - Styling

    getFont: function(){
        return this._displayTextLayoutManager.defaultFont;
    },

    setFont: function(font){
        this._displayTextLayoutManager.defaultFont = font;
        this.setNeedsDisplay();
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
        this.setNeedsDisplay();
    },

    getTextAlignment: function(){
        return this._displayTextContainer.textAlignment;
    },

    setTextAlignment: function(textAlignment){
        this._displayTextContainer.textAlignment = textAlignment;
        this.setNeedsDisplay();
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

    characterIndexAtPoint: function(point){
        // TODO: convert point as needed if the text container is not positioned at 0,0
        var index = this._displayTextContainer.characterIndexAtPoint(point);
        return index;
    },

    rectForCharacterAtIndex: function(index){
        var rect = this._displayTextContainer.rectForCharacterAtIndex(index);
        // TODO: convert rect as needed if the text container is not positioned at 0,0
        return rect;
    },

    drawInContext: function(context){
        // TODO: coordinate this origin point with other methods like
        // characterAtIndexPoint and rectForCharacterAtIndex
        var textOrigin = JSPoint(0, 0);
        if (this._isDisplayContext(context)){
            this._displayTextContainer.drawInContextAtPoint(context, textOrigin);
        }else{
            var layoutMangaer = JSTextLayoutManager.init();
            var textContainer = JSTextContainer.initWithSize(this.bounds.size);
            layoutMangaer.addTextContainer(textContainer);
            this._textStorage.addLayoutManager(layoutMangaer);
            textContainer.drawInContextAtPoint(context, textOrigin);
            this._textStorage.removeLayoutManagerAtIndex(1);
        }
    }

});