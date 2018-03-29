// #import "UIKit/UITextField.js"
// #import "UIKit/UITextAttachmentView.js"
/* global JSClass, UITextField, UITokenField, JSAttributedString, UITextAttachmentView, UIView, UITokenFieldTokenView, UILabel, JSRange, JSRect, JSPoint, JSDynamicProperty, JSInsets, JSColor, jslog_create */
'use strict';

(function(){

var logger = jslog_create("uikit.tokenfield");

JSClass("UITokenField", UITextField, {

    tokenDelegate: null,
    _representedObjects: null,

    _commonViewInit: function(){
        UITokenField.$super._commonViewInit.call(this);
        this._representedObjects = [];
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
        var objectIndex = 0;
        var attachmentString;
        var indexAdjustment = 0;
        while (iterator.character !== null){
            if (iterator.character.code === JSAttributedString.SpecialCharacter.Attachment){
                if (range.length > 0){
                    if (this._convertStringToToken(originalString, range, objectIndex)){
                        attachmentString = this._createAttachmentStringForRepresentedObject(this._representedObjects[objectIndex]);
                        this.attributedText.replaceCharactersInRangeWithAttributedString(JSRange(range.location + indexAdjustment, range.length), attachmentString);
                        indexAdjustment += attachmentString.string.length - range.length;
                        ++objectIndex;
                    }
                }
                range = JSRange(iterator.nextIndex, 0);
                ++objectIndex;
            }else{
                range.length += iterator.nextIndex - iterator.index;
            }
            iterator.increment();
        }
        if (range.length > 0){
            if (this._convertStringToToken(originalString, range, objectIndex)){
                attachmentString = this._createAttachmentStringForRepresentedObject(this._representedObjects[objectIndex]);
                this.attributedText.replaceCharactersInRangeWithAttributedString(JSRange(range.location + indexAdjustment, range.length), attachmentString);
            }
        }
    },

    _convertStringToToken: function(string, range, objectIndex){
        var representedObject;
        var objectString;
        objectString = string.substringInRange(range);
        representedObject = this._representedObjectForString(objectString);
        if (representedObject !== null){
            this._representedObjects.splice(objectIndex, 0, representedObject);
            return true;
        }
        return false;
    },

    _representedObjectForString: function(string){
        if (this.tokenDelegate && this.tokenDelegate.tokenFieldRepresentedObjectForString){
            return this.tokenDelegate.tokenFieldRepresentedObjectForString(this, string);
        }
        return string;
    },

    _createAttachmentStringForRepresentedObject: function(representedObject){
        var view = this._createViewForRepresentedObject(representedObject);
        var attachment = UITextAttachmentView.initWithView(view);
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
    textInsets: JSDynamicProperty(),
    textField: null,

    initWithString: function(str, textField){
        UITokenFieldTokenView.$super.init.call(this);
        this._textInsets = JSInsets(2, 4);
        this.labelView = UILabel.initWithFrame(JSRect(0, 0, 100, textField.font.lineHeight));
        this.textField = textField;
        this.labelView.font = this.textField.font;
        this.labelView.text = str;
        this.labelView.borderWidth = 1.0;
        this.labelView.borderColor = JSColor.initWithRGBA(0.72, 0.72, 0.8, 1.0);
        this.labelView.backgroundColor = JSColor.initWithRGBA(0.9, 0.9, 1.0, 1.0);
        this.labelView.cornerRadius = textField.font.lineHeight;
        this.addSubview(this.labelView);
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
        this.labelView.sizeToFit();
        var ourSize = this.labelView.frame.size;
        this.labelView.position = JSPoint(ourSize.width / 2.0, ourSize.height.height / 2.0);
        this.bounds = JSRect(JSPoint.Zero, ourSize);
    },

    mouseDown: function(event){
        logger.log("mouseDown on %s".sprintf(this.labelView.text));
    }

});

})();