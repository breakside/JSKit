// #import "UIView.js"
// #import "UITextLayer.js"
// #import "UIPasteboard.js"
/* global JSClass, UIView, UILayer, JSColor, JSTextAlignment, JSLineBreakMode, JSRect, JSSize, JSDynamicProperty, UIViewLayerProperty, JSInsets, JSRange, UITextLayer, UILabel, JSFont, UIPasteboard, UICursor */
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

    initWithSpec: function(spec){
        UILabel.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("font")){
            this.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey("text")){
            this.text = spec.valueForKey("text");
        }
        if (spec.containsKey("textColor")){
            this.textColor = spec.valueForKey("textColor", JSColor);
        }
        if (spec.containsKey("textAlignment")){
            this.textAlignment = spec.valueForKey("textAlignment", JSTextAlignment);
        }
        if (spec.containsKey("lines")){
            this.maximumNumberOfLines = spec.valueForKey("lines");
        }else{
            this.maximumNumberOfLines = 1;
        }
        if (spec.containsKey("lineBreakMode")){
            this.lineBreakMode = spec.valueForKey("lineBreakMode", JSLineBreakMode);
        }
        if (spec.containsKey("textInsets")){
            this.textInsets = spec.valueForKey("textInsets", JSInsets);
        }
    },

    getIntrinsicSize: function(){
        // FIXME: can we do this without sizing first?
        // (probably not a real big issue since the intrinsic size will be used to size the view)
        var bounds = JSRect(this.bounds);
        this.sizeToFit();
        var size = JSSize(this.bounds.size);
        this.bounds = bounds;
        return size;
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
                    attachmentLocation = location.subtracting(rect.origin);
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
                attachmentLocation = location.subtracting(rect.origin);
                attachmentHit = attachment.view.hitTest(attachmentLocation);
                if (attachmentHit !== null){
                    return attachmentHit;
                }
            }
        }
        return hit;
    },

    _mouseDownAction: null,

    mouseDown: function(event){
        var location = event.locationInView(this);
        var index = this.layer.textLayoutManager.characterIndexAtPoint(location);
        var attributes = this.attributedText.attributesAtIndex(index);
        this._didDrag = false;
        if (attributes.link){
            var range = this.attributedText.rangeOfRunAtIndex(index);
            var layer = UILayer.init();
            layer.frame = this.layer.textLayoutManager.rectsForCharacterRange(range)[0].rectWithInsets(JSInsets(-1, -2));
            layer.cornerRadius = 2;
            layer.backgroundColor = JSColor.black.colorWithAlpha(0.2);
            this.layer.addSublayer(layer);
            this._mouseDownAction = {
                link: attributes.link,
                range: range,
                temporaryAttributes: [],
                layers: [layer]
            };
        }else{
            if (!this._allowsSelection){
                UILabel.$super.mouseDown.call(this, event);
                return;
            }
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
        }
    },

    mouseDragged: function(event){
        if (this._mouseDownAction !== null){
            if (this._mouseDownAction.link){
                this.beginDraggingSessionWithItems([
                    {stringValue: this._mouseDownAction.link.encodedString, type: UIPasteboard.ContentType.plainText}
                ], event);
            }
        }else{
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
        }
    },

    _didDrag: false,

    draggingSessionDidBecomeActive: function(session){
        this._didDrag = true;
    },

    mouseUp: function(event){
        if (this._mouseDownAction !== null){
            var attr;
            var i, l;
            for (i = 0, l = this._mouseDownAction.temporaryAttributes.length; i < l; ++i){
                attr = this._mouseDownAction.temporaryAttributes[i];
                this.layer.textLayoutManager.removeTemporaryAttributeInRange(attr, this._mouseDownAction.range);
            }
            for (i = 0, l = this._mouseDownAction.layers.length; i < l; ++i){
                this._mouseDownAction.layers[i].removeFromSuperlayer();
            }
            if (!this._didDrag){
                if (this._mouseDownAction.link){
                    this.window.application.openURL(this._mouseDownAction.link);
                }
            }
            this._mouseDownAction = null;
        }else{
            if (!this._allowsSelection){
                UILabel.$super.mouseUp.call(this, event);
                return;
            }
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
        layer.backgroundColor = JSColor.white.colorWithAlpha(0.2);
        this.layer.addSublayer(layer);
        return layer;
    },

    resignFirstResponder: function(){
        this._selectionRange = null;
        this._updateSelectionHighlightLayers();
    }

});

UILabel.layerClass = UITextLayer;