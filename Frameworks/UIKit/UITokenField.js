// #import "UIKit/UITextField.js"
// #import "UIKit/UITextAttachmentView.js"
// #import "UIKit/UICursor.js"
/* global JSClass, UITextField, UITokenField, JSSize, UICursor, JSAttributedString, JSLineBreakMode, UITextAttachmentView, UIView, UITokenFieldTokenView, UILabel, JSRange, JSRect, JSPoint, JSDynamicProperty, JSInsets, JSColor, JSLog */
'use strict';

(function(){

var logger = JSLog("ui", "token");

JSClass("UITokenField", UITextField, {

    tokenDelegate: null,
    representedObjects: JSDynamicProperty(),
    tokensView: null,

    initWithSpec: function(spec, values){
        UITokenField.$super.initWithSpec.call(this, spec, values);
        if ('tokenDelegate' in values){
            this.tokenDelegate = spec.resolvedValue(values.tokenDelegate);
        }
    },

    commonUIControlInit: function(){
        UITokenField.$super.commonUIControlInit.call(this);
        this.tokensView = UIView.initWithFrame(JSRect.Zero);
        this._clipView.addSubview(this.tokensView);
        this._updateLineSpacing();
        this.setNeedsLayout();
    },

    setFont: function(font){
        UITokenField.$super.setFont.call(this, font);
        this._updateLineSpacing();
    },

    getFont: function(){
        return this._textLayer.font;
    },

    _updateLineSpacing: function(){
        if (this.font === null){
            return;
        }
        var lineHeight = this.font.displayLineHeight;
        this._textLayer.lineSpacing = (lineHeight + 4) / lineHeight;
        this.setNeedsLayout();
    },

    getRepresentedObjects: function(){
        var iterator = this.attributedText.runIterator();
        var attachment;
        var representedObjects = [];
        while (iterator.range.location < this.attributedText.string.length){
            attachment = iterator.attachment;
            if (attachment !== null && attachment.representedObject !== null){
                representedObjects.push(attachment.representedObject);
            }
            iterator.increment();
        }
        return representedObjects;
    },

    setRepresentedObjects: function(representedObjects){
        var str = JSAttributedString.init();
        var obj;
        for (var i = 0, l = representedObjects.length; i < l; ++i){
            obj = representedObjects[i];
            str.appendAttributedString(this._createAttachmentStringForRepresentedObject(obj));
        }
        this.attributedText = str;
    },

    insertNewline: function(){
        this._tokenize();
    },

    insertText: function(text){
        if (text == "," || text == ";"){
            this._tokenize();
        }else{
            UITokenField.$super.insertText.call(this, text);
            // TODO: autocomplete
        }
    },

    resignFirstResponder: function(){
        UITokenField.$super.resignFirstResponder.call(this);
        this._tokenize();
    },

    copy: function(){
        // TODO: copy text representation and object array
    },

    paste: function(){
        // TODO: paste object representation if availble
        // TODO: parse text if object representation is not available
    },

    _tokenize: function(){
        var originalString = this.text;
        var iterator = originalString.unicodeIterator();
        var range = JSRange(0, 0);
        var attachmentString;
        var indexAdjustment = 0;
        var representedObject;
        while (iterator.character !== null){
            if (iterator.character.code === JSAttributedString.SpecialCharacter.attachment){
                if (range.length > 0){
                    representedObject = this._convertStringToRepresentedObject(originalString, range);
                    if (representedObject !== null){
                        attachmentString = this._createAttachmentStringForRepresentedObject(representedObject);
                        this.attributedText.replaceCharactersInRangeWithAttributedString(JSRange(range.location + indexAdjustment, range.length), attachmentString);
                        indexAdjustment += attachmentString.string.length - range.length;
                    }
                }
                range = JSRange(iterator.nextIndex, 0);
            }else{
                range.length += iterator.nextIndex - iterator.index;
            }
            iterator.increment();
        }
        if (range.length > 0){
            representedObject = this._convertStringToRepresentedObject(originalString, range);
            if (representedObject !== null){
                attachmentString = this._createAttachmentStringForRepresentedObject(representedObject);
                this.attributedText.replaceCharactersInRangeWithAttributedString(JSRange(range.location + indexAdjustment, range.length), attachmentString);
            }
        }
    },

    _convertStringToRepresentedObject: function(string, range){
        var representedObject;
        var objectString;
        objectString = string.substringInRange(range);
        if (this.tokenDelegate && this.tokenDelegate.tokenFieldRepresentedObjectForString){
            return this.tokenDelegate.tokenFieldRepresentedObjectForString(this, objectString);
        }
        return objectString;
    },

    _createAttachmentStringForRepresentedObject: function(representedObject){
        var view = this._createViewForRepresentedObject(representedObject);
        var attachment = UITextAttachmentView.initWithView(view, this.tokensView);
        attachment.representedObject = representedObject;
        // attachment.baselineAdjustment = view.tokenLabel.font.displayDescender - view.tokenLabel.textInsets.bottom;
        return JSAttributedString.initWithAttachment(attachment);
    },

    _createViewForRepresentedObject: function(representedObject){
        if (this.tokenDelegate && this.tokenDelegate.tokenFieldViewForRepresentedObject){
            return this.tokenDelegate.tokenFieldViewForRepresentedObject(this, representedObject);
        }
        var str;
        if (this.tokenDelegate && this.tokenDelegate.tokenFieldStringForRepresentedObject){
            str = this.tokenDelegate.tokenFieldStringForRepresentedObject(this, representedObject);
        }
        str = representedObject.toString();
        return UITokenFieldTokenView.initWithString(str, this);
    },

});

JSClass("UITokenFieldTokenView", UIView, {

    tokenLabel: null,
    textColor: JSDynamicProperty(),
    font: JSDynamicProperty(),
    tokenInsets: JSDynamicProperty('_tokenInsets', null),
    textField: null,

    initWithString: function(str, textField){
        UITokenFieldTokenView.$super.init.call(this);
        this.tokenLabel = UILabel.initWithFrame(this.bounds);
        this.tokenLabel.textInsets = JSInsets(1, 5);
        this.tokenLabel.lineBreakMode = JSLineBreakMode.truncateTail;
        this.tokenLabel.maximumNumberOfLines = 1;
        this.textField = textField;
        this.tokenLabel.font = this.textField.font;
        this.tokenLabel.text = str;
        this.tokenLabel.backgroundColor = JSColor.initWithRGBA(210/255, 231/255, 251/255, 1.0);
        this.tokenLabel.borderColor = JSColor.initWithRGBA(116/255, 181/255, 243/255, 1.0);
        this.backgroundColor = null;
        this.tokenLabel.borderWidth = 0.5;
        this.tokenLabel.cornerRadius = 3.0;
        this.addSubview(this.tokenLabel);
        this._tokenInsets = JSInsets(0, 1.5);
        this.tokenLabel.cursor = UICursor.arrow;
        this.setNeedsLayout();
    },

    getFont: function(){
        return this.tokenLabel.font;
    },

    setFont: function(font){
        this.tokenLabel.font = font;
        this.setNeedsLayout();
    },

    getTextColor: function(){
        return this.tokenLabel.textColor;
    },

    setTextColor: function(textColor){
        this.tokenLabel.textColor = textColor;
    },

    sizeToFitSize: function(maxSize){
        var availableWidth = maxSize.width - this._tokenInsets.left - this.tokenInsets.right;
        this.tokenLabel.sizeToFitSize(JSSize(availableWidth, Number.MAX_VALUE));
        this.bounds = JSRect(JSPoint.Zero, JSSize(this.tokenLabel.frame.size.width + this._tokenInsets.left + this._tokenInsets.right, this.tokenLabel.frame.size.height));
    },

    layoutSubviews: function(){
        this.tokenLabel.frame = this.bounds.rectWithInsets(this._tokenInsets);
    },

    containsPoint: function(locationInView){
        return this.tokenLabel.containsPoint(this.convertPointToView(locationInView, this.tokenLabel));
    },

    hitTest: function(locationInView){
        return this.tokenLabel.hitTest(this.convertPointToView(locationInView, this.tokenLabel));
    },

    mouseDown: function(event){
        logger.info("mouseDown on %{public}", this.tokenLabel.text);
    },

    getFirstBaselineOffsetFromTop: function(){
        return this.tokenLabel.firstBaselineOffsetFromTop;
    },

    getLastBaselineOffsetFromBottom: function(){
        return this.tokenLabel.lastBaselineOffsetFromBottom;
    },


});

})();