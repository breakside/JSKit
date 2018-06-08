// #import "UIKit/UITextField.js"
// #import "UIKit/UITextAttachmentView.js"
// #import "UIKit/UICursor.js"
/* global JSClass, UITextField, UITokenField, JSSize, UICursor, JSAttributedString, JSLineBreakMode, UITextAttachmentView, UIView, UITokenFieldTokenView, UILabel, JSRange, JSRect, JSPoint, JSDynamicProperty, JSInsets, JSColor, jslog_create */
'use strict';

(function(){

var logger = jslog_create("uikit.tokenfield");

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
        // attachment.baselineAdjustment = view.labelView.font.displayDescender - view.labelView.textInsets.bottom;
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
    }

});

JSClass("UITokenFieldTokenView", UIView, {

    labelView: null,
    textColor: JSDynamicProperty(),
    font: JSDynamicProperty(),
    tokenInsets: JSDynamicProperty('_tokenInsets', null),
    textField: null,

    initWithString: function(str, textField){
        UITokenFieldTokenView.$super.init.call(this);
        this.labelView = UILabel.initWithFrame(this.bounds);
        this.labelView.textInsets = JSInsets(1, 5);
        this.labelView.maximumNumberOfLines = 1;
        this.labelView.lineBreakMode = JSLineBreakMode.truncateTail;
        this.textField = textField;
        this.labelView.font = this.textField.font;
        this.labelView.text = str;
        this.labelView.backgroundColor = JSColor.initWithRGBA(210/255, 231/255, 251/255, 1.0);
        this.labelView.borderColor = JSColor.initWithRGBA(116/255, 181/255, 243/255, 1.0);
        this.backgroundColor = null;
        this.labelView.borderWidth = 0.5;
        this.labelView.cornerRadius = 3.0;
        this.addSubview(this.labelView);
        this._tokenInsets = JSInsets(0, 1.5, 0, 1.5);
        this.labelView.cursor = UICursor.arrow;
        this.setNeedsLayout();
    },

    getFont: function(){
        return this.labelView.font;
    },

    setFont: function(font){
        this.labelView.font = font;
        this.setNeedsLayout();
    },

    getTextColor: function(){
        return this.labelView.textColor;
    },

    setTextColor: function(textColor){
        this.labelView.textColor = textColor;
    },

    layoutSubviews: function(){
        var availableWidth = this.textField.bounds.size.width - this.textField.textInsets.left - this.textField.textInsets.right - this._tokenInsets.left - this._tokenInsets.right;
        this.labelView.sizeToFit();
        if (this.labelView.frame.size.width > availableWidth){
            this.labelView.frame = JSRect(0, 0, availableWidth, this.labelView.frame.size.height);
        }
        var ourSize = JSSize(this.labelView.frame.size);
        ourSize.width += this._tokenInsets.left + this._tokenInsets.right;
        this.labelView.position = JSPoint(this._tokenInsets.left + this.labelView.frame.size.width / 2.0, ourSize.height / 2.0);
        this.bounds = JSRect(JSPoint.Zero, ourSize);
    },

    containsPoint: function(locationInView){
        return this.labelView.containsPoint(this.layer.convertPointToLayer(locationInView, this.labelView.layer));
    },

    hitTest: function(locationInView){
        return UITokenFieldTokenView.$super.hitTest.call(this, locationInView);
    },

    mouseDown: function(event){
        logger.log("mouseDown on %s".sprintf(this.labelView.text));
    }

});

})();