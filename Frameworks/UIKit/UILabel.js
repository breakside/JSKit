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

// #import "UIView.js"
// #import "UITextLayer.js"
// #import "UIPasteboard.js"
// #import "UICursor.js"
// #import "UITextAttachmentView.js"
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
    selectionColor: JSDynamicProperty("_selectionColor", null),
    _accessibilityHidden: true,

    initWithFrame: function(frame){
        UILabel.$super.initWithFrame.call(this, frame);
        this.maximumNumberOfLines = 1;
        this.textColor = JSColor.text;
        this._selectionColor = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.2), JSColor.white.colorWithAlpha(0.2));
        this.layer.textContainer.framesetter.typesetter.delegate = this;
    },

    initWithSpec: function(spec){
        UILabel.$super.initWithSpec.call(this, spec);
        this.layer.textContainer.framesetter.typesetter.delegate = this;
        if (spec.containsKey("font")){
            this.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey("text")){
            this.text = spec.valueForKey("text");
        }
        if (spec.containsKey("textColor")){
            this.textColor = spec.valueForKey("textColor", JSColor);
        }else{
            this.textColor = JSColor.text;
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
        if (spec.containsKey("allowsSelection")){
            this.allowsSelection = spec.valueForKey("allowsSelection");
        }
        if (spec.containsKey("selectionColor")){
            this._selectionColor = spec.valueForKey("selectionColor", JSColor);
        }else{
            this._selectionColor = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.2), JSColor.white.colorWithAlpha(0.2));
        }
    },

    tooltip: JSDynamicProperty("_tooltip", null),

    setTooltip: function(tooltip){
        this._tooltip = tooltip;
        if (this._tooltip !== null){
            this.userInteractionEnabled = true;
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
            this.userInteractionEnabled = true;
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

    hitTest: function(location, event){
        var hit = UILabel.$super.hitTest.call(this, location, event);
        var index, attachment, attributes, rect, attachmentLocation;
        var attachmentHit = null;
        if (hit === this){
            index = this.layer.textLayoutManager.characterIndexAtPoint(location);
            if (index < this.attributedText.string.length){
                attributes = this.attributedText.attributesAtIndex(index);
                attachment = attributes[JSAttributedString.Attribute.attachment];
                if (attachment && attachment.isKindOfClass(
                    UITextAttachmentView)){
                    rect = this.layer.textLayoutManager.rectForCharacterAtIndex(index);
                    attachmentLocation = location.subtracting(rect.origin);
                    attachmentHit = attachment.view.hitTest(attachmentLocation, event);
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
                attachmentHit = attachment.view.hitTest(attachmentLocation, event);
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
            var range = this.attributedText.longestRangeOfAttributeAtIndex("link", index);
            var layer = UILabelLinkLayer.init();
            layer.pathColor = (attributes.textColor || this.textColor).colorWithAlpha(0.2);
            var rects = this.layer.textLayoutManager.rectsForCharacterRange(range);
            var i, l;
            for (i = 0, l = rects.length; i < l; ++i){
                layer.addRect(rects[i]);
            }
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
            this._clearAction(this._mouseDownAction);
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

    _clearAction: function(action){
        var attr;
        var i, l;
        for (i = 0, l = action.temporaryAttributes.length; i < l; ++i){
            attr = action.temporaryAttributes[i];
            this.layer.textLayoutManager.removeTemporaryAttributeInRange(attr, action.range);
        }
        for (i = 0, l = action.layers.length; i < l; ++i){
            action.layers[i].removeFromSuperlayer();
        }
    },

    _touchAction: null,

    touchesBegan: function(touches, event){
        var location = touches[0].locationInView(this);
        var index = this.layer.textLayoutManager.characterIndexAtPoint(location);
        var attributes = this.attributedText.attributesAtIndex(index);
        if (attributes.link){
            var range = this.attributedText.longestRangeOfAttributeAtIndex("link", index);
            var layer = UILabelLinkLayer.init();
            layer.pathColor = (attributes.textColor || this.textColor).colorWithAlpha(0.2);
            var rects = this.layer.textLayoutManager.rectsForCharacterRange(range);
            var i, l;
            for (i = 0, l = rects.length; i < l; ++i){
                layer.addRect(rects[i]);
            }
            this.layer.addSublayer(layer);
            this._touchAction = {
                link: attributes.link,
                range: range,
                temporaryAttributes: [],
                layers: [layer]
            };
        }else{
            UILabel.$super.touchesBegan.call(this, touches, event);
        }
    },

    touchesMoved: function(touches, event){
        if (this._touchAction !== null){
            var location = touches[0].locationInView(this);
            var index = this.layer.textLayoutManager.characterIndexAtPoint(location);
            if (!this._touchAction.range.contains(index)){
                this._clearAction(this._touchAction);
                this._touchAction = null;
            }
        }else{
            UILabel.$super.touchesMoved.call(this, touches, event);
        }
    },

    touchesEnded: function(touches, event){
        if (this._touchAction !== null){
            this._clearAction(this._touchAction);
            if (this._touchAction.link){
                this.window.application.openURL(this._touchAction.link);
            }
            this._touchAction = null;
        }else{
            UILabel.$super.touchesEnded.call(this, touches, event);
        }
    },

    touchesCanceled: function(touches, event){
        if (this._touchAction !== null){
            this._clearAction(this._touchAction);
            this._touchAction = null;
        }else{
            UILabel.$super.touchesCanceled.call(this, touches, event);
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
        layer.backgroundColor = this._selectionColor;
        this.layer.addSublayer(layer);
        return layer;
    },

    resignFirstResponder: function(){
        this._selectionRange = null;
        this._updateSelectionHighlightLayers();
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    sizeToFitSize: function(maxSize){
        UILabel.$super.sizeToFitSize.call(this, maxSize);
        this.updateMouseTrackingAreas();
    },

    layoutSubviews: function(){
        UILabel.$super.layoutSubviews.call(this);
        this.updateMouseTrackingAreas();
    },

    linkMouseTrackingAreas: null,

    updateMouseTrackingAreas: function(){
        UILabel.$super.updateMouseTrackingAreas.call(this);
        if (this.linkMouseTrackingAreas === null && !this._userInteractionEnabled){
            return;
        }
        if (this.linkMouseTrackingAreas === null){
            this.linkMouseTrackingAreas = [];
        }
        var rects;
        var rectIndex, rectCount;
        var linkIndex = 0;
        var range;
        var attributes;
        var attributedString = this.attributedText;
        var end = attributedString.string.length;
        var rect;
        var area;
        if (this._userInteractionEnabled){
            range = attributedString.longestRangeOfAttributeAtIndex("link", 0);
            attributes = attributedString.attributesAtIndex(range.location);
            while (range.length > 0 && range.location < end){
                if (attributes.link){
                    rects = this.layer.textLayoutManager.rectsForCharacterRange(range);
                    for (rectIndex = 0, rectCount = rects.length; rectIndex < rectCount; ++rectIndex, ++linkIndex){
                        rect = rects[rectIndex];
                        if (linkIndex < this.linkMouseTrackingAreas.length){
                            area = this.linkMouseTrackingAreas[linkIndex];
                            area.rect = rect;
                        }else{
                            area = UIMouseTrackingArea.initWithResponder(this, rect, UIMouseTrackingArea.TrackingType.enterAndExit);
                            area.cursor = UICursor.pointingHand;
                            this.linkMouseTrackingAreas.push(area);
                            this.addMouseTrackingArea(area);
                        }
                    }
                }
                if (range.end == end){
                    range = JSRange(end, 0);
                }else{
                    range = attributedString.longestRangeOfAttributeAtIndex("link", range.end);
                    attributes = attributedString.attributesAtIndex(range.location);
                }
            }
        }
        for (var j = this.linkMouseTrackingAreas.length - 1; j >= linkIndex; --j){
            area = this.linkMouseTrackingAreas.pop();
            this.removeMouseTrackingArea(area);
        }
    },

    userInteractionEnabled: JSDynamicProperty("_userInteractionEnabled", false),

    setUserInteractionEnabled: function(userInteractionEnabled){
        this._userInteractionEnabled = userInteractionEnabled;
        this.updateMouseTrackingAreas();
    },

    // -------------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.text,

    getFocusRingPath: function(){
        return null;
    },

});

JSClass("UILabelLinkLayer", UILayer, {

    pathColor: null,

    init: function(){
        UILabelLinkLayer.$super.init.call(this);
        this.path = JSPath.init();
        this.pathColor = JSColor.black;
        this.setNeedsDisplay();
    },

    addRect: function(rect){
        this.path.addRoundedRect(rect.rectWithInsets(JSInsets(-1, -2)), 2);
        this.frame = this.path.boundingRect;
    },

    drawInContext: function(context){
        context.save();
        context.translateBy(-this.path.boundingRect.origin.x, -this.path.boundingRect.origin.y);
        context.setFillColor(this.pathColor);
        context.addPath(this.path);
        context.fillPath();
        context.restore();
    },

});

UILabel.layerClass = UITextLayer;