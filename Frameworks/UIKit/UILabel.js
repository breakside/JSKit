// #import "UIView.js"
// #import "UITextLayer.js"
// #import "UIPasteboard.js"
/* global JSClass, UIView, UILayer, JSColor, JSDynamicProperty, UIViewLayerProperty, JSInsets, JSRange, UITextLayer, UILabel, JSFont, UIPasteboard, UICursor */
'use strict';

JSClass('UILabel', UIView, {

    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    lineBreakMode: UIViewLayerProperty(),
    textAlignment: UIViewLayerProperty(),
    maximumNumberOfLines: UIViewLayerProperty(),
    textInsets: UIViewLayerProperty(),
    allowsSelection: JSDynamicProperty('_allowsSelection', false),

    initWithFrame: function(frame){
        UILabel.$super.initWithFrame.call(this, frame);
        this.maximumNumberOfLines = 1;
    },

    initWithSpec: function(spec, values){
        UILabel.$super.initWithSpec.call(this, spec, values);
        if ("font" in values){
            this.font = JSFont.initWithSpec(spec, values.font);
        }
        if ("text" in values){
            this.text = spec.resolvedValue(values.text);
        }
        if ("textColor" in values){
            this.textColor = spec.resolvedValue(values.textColor, "JSColor");
        }
        if ("textAlignment" in values){
            this.textAlignment = spec.resolvedValue(values.textAlignment);
        }
        if ("lines" in values){
            this.maximumNumberOfLines = spec.resolvedValue(values.lines);
        }else{
            this.maximumNumberOfLines = 1;
        }
        if ("lineBreakMode" in values){
            this.lineBreakMode = spec.resolvedValue(values.lineBreakMode);
        }
        if ("textInsets" in values){
            this.textInsets = JSInsets.apply(undefined, values.textInsets.parseNumberArray());
        }
    },

    getIntrinsicSize: function(){
        this.sizeToFit();
        // FIXME: can we do this without sizing first?
        // (probably not a real big issue since the intrinsic size will be used to size the view)
        return this.bounds.size;
    },

    getFirstBaselineOffsetFromTop: function(){
        return this.layer.firstBaselineOffsetFromTop;
    },

    getLastBaselineOffsetFromBottom: function(){
        return this.layer.lastBaselineOffsetFromBottom;
    },

    setAllowsSelection: function(allowsSelection){
        this._allowsSelection = allowsSelection;
        if (this._allowsSelection){
            this.cursor = UICursor.iBeam;
        }else{
            this.cursor = null;
        }
    },

    canBecomeFirstResponder: function(){
        return this._allowsSelection;
    },

    canPerformAction: function(action, sender){
        if (action === 'copy'){
            return this._selectionRange !== null && this._selectionRange.length > 0;
        }
        return UILabel.$super.canPerformAction.call(this, action, sender);
    },

    _selectionAnchorIndex: 0,
    _selectionRange: null,

    hitTest: function(location){
        var hit = UILabel.$super.hitTest.call(this, location);
        var index, attachment, attributes, rect, attachmentLocation;
        var attachmentHit = null;
        if (hit === this){
            index = this.layer.textLayoutManager.characterIndexAtPoint(location);
            if (index < this.attributedText.string.length){
                attributes = this.attributedText.attributesAtIndex(index);
                attachment = attributes[JSAttributedString.Attribute.attachment];
                if (attachment && attachment.isKindOfClass(UITextAttachmentView)){
                    rect = this.layer.textLayoutManager.rectForCharacterAtIndex(index);
                    attachmentLocation = location.subtract(rect.origin);
                    attachmentHit = attachment.view.hitTest(attachmentLocation);
                    if (attachmentHit !== null){
                        return attachmentHit;
                    }
                }
            }
            if (index > 0){
                index -= 1;
            }
            attributes = this.attributedText.attributesAtIndex(index);
            attachment = attributes[JSAttributedString.Attribute.attachment];
            if (attachment && attachment.isKindOfClass(UITextAttachmentView)){
                rect = this.layer.textLayoutManager.rectForCharacterAtIndex(index);
                attachmentLocation = location.subtract(rect.origin);
                attachmentHit = attachment.view.hitTest(attachmentLocation);
                if (attachmentHit !== null){
                    return attachmentHit;
                }
            }
        }
        return hit;
    },

    mouseDown: function(event){
        if (!this._allowsSelection){
            UILabel.$super.mouseDown.call(this, event);
            return;
        }
        var location = event.locationInView(this);
        var index = this.layer.textLayoutManager.characterIndexAtPoint(location);
        if (event.clickCount == 1){
            this.window.firstResponder = this;
            this._selectionRange = null;
            this._selectionAnchorIndex = index;
        }else if (event.clickCount == 2){
            this._selectionRange = this.layer.textLayoutManager.textStorage.string.rangeForWordAtIndex(index);
        }else if (event.clickCount == 3){
            this._selectionRange = JSRange(0, this.text.length);
        }
        this._updateSelectionHighlightLayers();
    },

    mouseDragged: function(event){
        if (!this._allowsSelection){
            UILabel.$super.mouseDragged.call(this, event);
            return;
        }
        var location = event.locationInView(this);
        var index = this.layer.textLayoutManager.characterIndexAtPoint(location);
        if (index < this._selectionAnchorIndex){
            this._selectionRange = JSRange(index, this._selectionAnchorIndex - index);
        }else if (index > this._selectionAnchorIndex){
            this._selectionRange = JSRange(this._selectionAnchorIndex, index - this._selectionAnchorIndex);
        }else{
            this._selectionRange = null;
        }
        this._updateSelectionHighlightLayers();
    },

    mouseUp: function(event){
        if (!this._allowsSelection){
            UILabel.$super.mouseUp.call(this, event);
            return;
        }
    },

    copy: function(){
        var text = this.attributedText.string.substringInRange(this._selectionRange);
        UIPasteboard.general.setStringForType(text, UIPasteboard.ContentType.plainText);
        // TODO: attributed text
    },

    _selectionHighlightLayers: null,

    _updateSelectionHighlightLayers: function(){
        if (this._selectionHighlightLayers === null){
            this._selectionHighlightLayers = [];
        }
        var rects;
        if (this._selectionRange !== null && this._selectionRange.length > 0){
            rects = this.layer.textLayoutManager.rectsForCharacterRange(this._selectionRange);
        }else{
            rects = [];
        }
        var rect;
        var layer;
        for (var i = 0, l = rects.length; i < l; ++i){
            rect = rects[i];
            if (i == this._selectionHighlightLayers.length){
                this._selectionHighlightLayers.push(this._createSelectionHighlightLayer());
            }
            this._selectionHighlightLayers[i].frame = rect;
        }
        for (var j = this._selectionHighlightLayers.length - 1; j >= i; --j){
            this._selectionHighlightLayers[j].removeFromSuperlayer();
            this._selectionHighlightLayers.pop();
        }
    },

    _createSelectionHighlightLayer: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.whiteColor.colorWithAlpha(0.2);
        this.layer.addSublayer(layer);
        return layer;
    },

    resignFirstResponder: function(){
        this._selectionRange = null;
        this._updateSelectionHighlightLayers();
    }

});

UILabel.layerClass = UITextLayer;