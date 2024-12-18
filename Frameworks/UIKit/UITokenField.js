// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UITextField.js"
// #import "UITextAttachmentView.js"
// #import "UICursor.js"
// #import "UILabel.js"
'use strict';

(function(){

var logger = JSLog("uikit", "token");

JSClass("UITokenField", UITextField, {

    tokenDelegate: null,
    representedObjects: JSDynamicProperty(),
    tokensView: null,

    initWithSpec: function(spec){
        UITokenField.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('tokenDelegate')){
            this.tokenDelegate = spec.valueForKey("tokenDelegate");
        }
    },

    commonUIControlInit: function(){
        UITokenField.$super.commonUIControlInit.call(this);
        this.tokensView = UIView.initWithFrame(JSRect.Zero);
        this._clipView.addSubview(this.tokensView);
        this._updateLineHeightMultiple();
        this.setNeedsLayout();
    },

    setFont: function(font){
        UITokenField.$super.setFont.call(this, font);
        this._updateLineHeightMultiple();
    },

    getFont: function(){
        return this._textLayer.font;
    },

    _updateLineHeightMultiple: function(){
        if (this.font === null){
            return;
        }
        var lineHeight = this.font.displayLineHeight;
        this._textLayer.lineHeightMultiple = (lineHeight + 4) / lineHeight;
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
        if (this._localEditor.selections.length === 0){
            return;
        }
        var selection = this._localEditor.selections[0];
        if (selection.length === 0){
            return;
        }

        var attributedText = this.attributedText;
        var strings = [];
        var content = [];
        var iterator = this.text.unicodeIterator(selection.range.location);
        var l = selection.range.end;
        var fragment = "";
        var representedObject;
        var attachment;
        while (iterator.index < l){
            if (iterator.character.code === JSAttributedString.SpecialCharacter.attachment){
                if (fragment.length > 0){
                    strings.push(fragment);
                    content.push({text: fragment});
                    fragment = "";
                }
                attachment = attributedText.attributeAtIndex(JSAttributedString.Attribute.attachment, iterator.index);
                representedObject = attachment.representedObject;
                strings.push(this._stringForRepresentedObject(representedObject));
                content.push({representedObject: representedObject});
            }else{
                fragment += iterator.character.utf16;
            }
            iterator.increment();
        }
        if (fragment.length > 0){
            strings.push(fragment);
            content.push({text: fragment});
            fragment = "";
        }

        if (strings.length > 0){
            var text = strings.join(',');
            UIPasteboard.general.setStringForType(text, UIPasteboard.ContentType.plainText);
        }
        // FIXME: needs debugging
        // if (content.length > 0){
        //     UIPasteboard.general.setObjectForType(content, UITokenField.contentType);
        // }
    },

    paste: function(){
        var i, l;
        if (UIPasteboard.general.containsType(UITokenField.contentType)){
            var objects = UIPasteboard.general.objectForType(UITokenField.contentType);
            if (this._localEditor.selections.length > 0){
                var selection = this._localEditor.selections[0];
                if (selection.length > 0){
                    this.deleteBackward();
                    selection = this._localEditor.selections[0];
                }
                var obj;
                var attachmentString;
                for (i = 0, l = objects.length; i < l; ++i){
                    obj = objects[i];
                    if (obj.text !== undefined){
                        this.insertText(obj.text);
                    }else if (obj.representedObject !== undefined){
                        attachmentString = this._createAttachmentStringForRepresentedObject(obj.representedObject);
                        selection.attributes = attachmentString.attributesAtIndex(0);
                        this.insertText(attachmentString.string);
                        selection.attributes = null;
                    }
                }
            }
        }else if (UIPasteboard.general.containsType(UIPasteboard.ContentType.plainText)){
            var text = UIPasteboard.general.stringForType(UIPasteboard.ContentType.plainText);
            text = text.replace(/[,;]\s+/g, ",");
            l = text.length;
            var iterator = text.unicodeIterator();
            while (iterator.index < l){
                if (iterator.character.isLineBreak){
                    this._tokenize();
                }else{
                    this.insertText(iterator.character.utf16);
                }
                iterator.increment();
            }
            this._tokenize();
        }
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
        this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
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
        var str = this._stringForRepresentedObject(representedObject);
        return UITokenFieldTokenView.initWithString(str, this);
    },

    _stringForRepresentedObject: function(representedObject){
        if (this.tokenDelegate && this.tokenDelegate.tokenFieldStringForRepresentedObject){
            return this.tokenDelegate.tokenFieldStringForRepresentedObject(this, representedObject);
        }
        return representedObject.toString();
    }

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
        this.tokenLabel.textInsets = JSInsets(0, 4);
        this.tokenLabel.lineBreakMode = JSLineBreakMode.truncateTail;
        this.tokenLabel.maximumNumberOfLines = 1;
        this.textField = textField;
        this.tokenLabel.font = this.textField.font;
        this.tokenLabel.text = str;
        this.tokenLabel.backgroundColor = JSColor.initWithUIStyles(JSColor.highlight.colorLightenedByPercentage(0.8), JSColor.highlight.colorDarkenedByPercentage(0.6));
        this.tokenLabel.borderColor = JSColor.initWithUIStyles(JSColor.highlight, JSColor.black);
        this.backgroundColor = null;
        this.tokenLabel.borderWidth = 0.5;
        this.tokenLabel.cornerRadius = 3.0;
        this.addSubview(this.tokenLabel);
        this._tokenInsets = JSInsets(0, 1.5);
        this.tokenLabel.cursor = UICursor.systemDefault;
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

    hitTest: function(locationInView, event){
        return this.tokenLabel.hitTest(this.convertPointToView(locationInView, this.tokenLabel), event);
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

UITokenField.contentType = "x-jskit/tokenfield-content";

})();