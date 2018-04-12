// #import "UIKit/UITextField.js"
// #import "UIKit/UITextAttachmentView.js"
/* global JSClass, UITextField, UITokenField, JSSize, JSAttributedString, JSLineBreakMode, UITextAttachmentView, UIView, UITokenFieldTokenView, UILabel, JSRange, JSRect, JSPoint, JSDynamicProperty, JSInsets, JSColor, jslog_create */
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
        attachment.baselineAdjustment = view.labelView.font.htmlDescender - view.labelView.textInsets.bottom;
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

    hitTest: function(point){
        var attributedText = this.attributedText;
        if (attributedText.length > 0){
            var layoutManager = this._textLayer.textLayoutManager;
            var index = layoutManager.characterIndexAtPoint(point);
            var iterator = attributedText.string.unicodeIterator(index);
            var rect;
            var attachment;
            var stopNext = iterator.index === 0;
            var stop = false;
            while (!stop){
                if (iterator.character.code === JSAttributedString.SpecialCharacter.Attachment){
                    attachment = attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, iterator.index);
                    if (attachment && attachment.isKindOfClass(UITextAttachmentView)){
                        rect = layoutManager.rectForCharacterAtIndex(iterator.index);
                        if (rect.containsPoint(point)){
                            return attachment.view;
                        }
                    }
                }
                stop = stopNext;
                if (!stop){
                    iterator.decrement();
                    stopNext = true;
                }
            }
        }
        return UITokenField.$super.hitTest.call(this, point);
    },

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
        this.labelView.textInsets = JSInsets(1, 7);
        this.labelView.maximumNumberOfLines = 1;
        this.labelView.lineBreakMode = JSLineBreakMode.truncateTail;
        this.textField = textField;
        this.labelView.font = this.textField.font;
        this.labelView.text = str;
        this.labelView.backgroundColor = JSColor.initWithRGBA(210/255, 231/255, 251/255, 1.0);
        this.labelView.borderColor = JSColor.initWithRGBA(116/255, 181/255, 243/255, 1.0);
        this.labelView.borderWidth = 0.5;
        this.labelView.cornerRadius = 3.0;
        this.addSubview(this.labelView);
        this._tokenInsets = JSInsets(0, 1.5, 0, 1.5);
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
        var availableWidth = this.textField.bounds.width - this.textField.textInsets.left - this.textField.textInsets.right - this._tokenInsets.left - this._tokenInsets.right;
        this.labelView.sizeToFit();
        if (this.labelView.frame.size.width > availableWidth){
            this.labelView.frame = JSRect(0, 0, availableWidth, this.labelView.size.height);
        }
        var ourSize = JSSize(this.labelView.frame.size);
        ourSize.width += this._tokenInsets.left + this._tokenInsets.right;
        this.labelView.position = JSPoint(this._tokenInsets.left + this.labelView.frame.size.width / 2.0, ourSize.height.height / 2.0);
        this.bounds = JSRect(JSPoint.Zero, ourSize);
    },

    mouseDown: function(event){
        logger.log("mouseDown on %s".sprintf(this.labelView.text));
    }

});

})();