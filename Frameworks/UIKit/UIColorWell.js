// Copyright 2021 Breakside Inc.
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
//
// #import "UIControl.js"
// #import "UIPasteboard.js"
// #import "UIColorPanel.js"
"use strict";

JSClass("UIColorWell", UIControl, {

    initWithFrame: function(frame){
        UIColorWell.$super.initWithFrame.call(this, frame);
    },

    initWithSpec: function(spec){
        UIColorWell.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("color")){
            this._color = spec.valueForKey("color", JSColor).rgbaColor();
        }
        if (spec.containsKey("allowsAlpha")){
            this.allowsAlpha = spec.valueForKey("allowsAlpha", JSColor);
        }
        this.update();
    },

    commonUIControlInit: function(){
        UIColorWell.$super.commonUIControlInit.call(this);
        this.registerForDraggedTypes([
            UIPasteboard.ContentType.plainText,
            JSColor.contentType
        ]);
        if (this._styler === null){
            this._styler = UIColorWell.Styler.default;
        }
        this._styler.initializeControl(this);
    },

    allowsAlpha: true,

    color: JSDynamicProperty("_color", JSColor.black),

    setColor: function(color){
        this._color = color.rgbaColor();
        this.update();
    },

    _changeColor: function(color){
        this.color = color;
        this.didChangeValueForBinding('color');
        this.sendActionsForEvents(UIControl.Event.valueChanged);
    },

    // ----------------------------------------------------------------------
    // MARK: - Mouse Events

    mouseDown: function(event){
        if (this.enabled){
            this.active = true;
            this._dragged = false;
            return;
        }
        UIColorWell.$super.mouseDown.call(this, event);
    },

    mouseDragged: function(event){
        if (this.active){
            var location = event.locationInView(this);
            var hex = this.color.rgbaHexStringRepresentation();
            var items = [
                {
                    type: UIPasteboard.ContentType.plainText,
                    stringValue: hex
                },
                {
                    type: JSColor.contentType,
                    objectValue: this.color.dictionaryRepresentation()
                }
            ];
            var session = this.beginDraggingSessionWithItems(items, event);
            var path = this.pathForDragImage();
            var image = JSImage.initWithData('<?xml version="1.0" encoding="utf-8"?>\n<svg version="1.1" width="%dpx" height="%dpx" viewBox="0 0 %d %d" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="%s" fill="#%s"/></svg>'.sprintf(
                this.bounds.size.width,
                this.bounds.size.height,
                this.bounds.size.width,
                this.bounds.size.height,
                path.svgPathData(),
                hex
            ).utf8());
            session.setImage(image, location);
            return;
        }
        UIColorWell.$super.mouseDragged.call(this, event);
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.active){
                this._press(event);
            }
            return;
        }
        UIColorWell.$super.mouseUp.call(this, event);
    },

    // ----------------------------------------------------------------------
    // MARK: - Touch Events

    touchesBegan: function(touches, event){
        if (this.enabled){
            this.active = true;
            return;
        }
        UIColorWell.$super.touchesBegan.call(this, touches, event);
    },

    touchesMoved: function(touches, event){
        if (this.enabled){
            var touch = touches[0];
            var location = touch.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UIColorWell.$super.touchesMoved.call(this, touches, event);
    },

    touchesCanceled: function(touches, event){
        if (this.enabled){
            this.active = false;
            return;
        }
        UIColorWell.$super.touchesCanceled.call(this, touches, event);
    },

    touchesEnded: function(touches, event){
        if (this.enabled){
            if (this.active){
                this._press(event);
            }
            return;
        }
        UIColorWell.$super.touchesEnded.call(this, touches, event);
    },

    _press: function(event){
        if (this.hasActionForEvent(UIControl.Event.primaryAction)){
            this.sendActionsForEvents(UIControl.Event.primaryAction, event);
        }else{
            var panel = UIColorPanel.init();
            panel.color = this._color;
            panel.showsAlpha = this.allowsAlpha;
            panel.delegate = this;
            panel.openAdjacentToView(this, UIPopupWindow.Placement.right);
            this.window.modal = panel;
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Drag and Drop

    draggingSessionDidBecomeActive: function(session){
        this.active = false;
    },

    draggingSessionEnded: function(session, operation){
    },

    draggingEntered: function(session){
        if (session.source === this){
            return UIDragOperation.none;
        }
        this.dropTarget = true;
        return UIDragOperation.copy;
    },

    draggingUpdated: function(session){
        if (session.source === this){
            return UIDragOperation.none;
        }
        return UIDragOperation.copy;
    },

    draggingExited: function(session){
        this.dropTarget = false;
    },

    performDragOperation: function(session, operation){
        this.dropTarget = false;
        var color = null;
        if (session.pasteboard.containsType(JSColor.contentType)){
            color = JSColor.initFromDictionary(session.pasteboard.objectForType(JSColor.contentType));
        }else if (session.pasteboard.containsType(UIPasteboard.ContentType.plainText)){
            color = JSColor.initWithRGBAHexString(session.pasteboard.stringForType(UIPasteboard.ContentType.plainText));
        }
        if (color !== null){
            this._changeColor(color);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Color Panel

    colorPanelDidChangeColor: function(panel, color){
        this._changeColor(color);
    },

    colorPanelDidClose: function(panel){
        this.active = false;
    },

    // ----------------------------------------------------------------------
    // MARK: - Shape

    pathForDragImage: function(){
        if (this._styler !== null){
            return this._styler.pathForColorWellDragImage(this);
        }
        return this.layer.backgroundPath();
    }

});

UIColorWell.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function(){
            var styler = UIColorWellDefaultStyler.init();
            Object.defineProperty(this, "default", {configurable: true, writable: true, value: styler});
            return styler;
        },
        set: function(styler){
            Object.defineProperty(this, "default", {configurable: true, writable: true, value: styler});
        }
    }

});

JSClass("UIColorWellStyler", UIControlStyler, {

});

JSClass("UIColorWellDefaultStyler", UIColorWellStyler, {

    normalBackgroundColor: null,
    activeBackgroundColor: null,
    dropTargetBackgroundColor: null,
    disabledBackgroundColor: null,
    normalBorderWidth: 0,
    activeBorderWidth: 2,
    dropTargetBorderWidth: 4,
    disabledBorderWidth: 0,
    normalBorderColor: null,
    activeBorderColor: null,
    dropTargetBorderColor: null,
    disabledBorderColor: null,
    wellInsets: null,
    cornerRadius: 2,
    size: null,
    wellInnerShadowColor: null,
    wellInnerShadowOffset: null,
    wellInnerShadowRadius: 3,

    init: function(){
        UIColorWellDefaultStyler.$super.init.call(this);
        this.wellInsets = JSInsets.Zero;
        this.normalBackgroundColor = JSColor.white;
        this.activeBackgroundColor = JSColor.white;
        this.dropTargetBackgroundColor = JSColor.white;
        this.disabledBackgroundColor = JSColor.white;
        this.normalBorderColor = JSColor.black.colorWithAlpha(0.2);
        this.activeBorderColor = JSColor.black.colorWithAlpha(0.4);
        this.dropTargetBorderColor = JSColor.black.colorWithAlpha(0.2);
        this.disabledBorderColor = JSColor.clear;
        this.size = JSSize(44, 22);
        this.wellInnerShadowOffset = JSPoint(0, 1);
        this.wellInnerShadowColor = JSColor.black.colorWithAlpha(0.4);
    },

    initWithSpec: function(spec){
        UIColorWellDefaultStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("normalBackgroundColor")){
            this.normalBackgroundColor = spec.valueForKey("normalBackgroundColor", JSColor);
        }
        if (spec.containsKey("activeBackgroundColor")){
            this.activeBackgroundColor = spec.valueForKey("activeBackgroundColor", JSColor);
        }
        if (spec.containsKey("dropTargetBackgroundColor")){
            this.dropTargetBackgroundColor = spec.valueForKey("dropTargetBackgroundColor", JSColor);
        }
        if (spec.containsKey("disabledBackgroundColor")){
            this.disabledBackgroundColor = spec.valueForKey("disabledBackgroundColor", JSColor);
        }
        if (spec.containsKey("normalBorderColor")){
            this.normalBorderColor = spec.valueForKey("normalBorderColor", JSColor);
        }else{
            this.normalBorderColor = JSColor.black.colorWithAlpha(0.2);
        }
        if (spec.containsKey("activeBorderColor")){
            this.activeBorderColor = spec.valueForKey("activeBorderColor", JSColor);
        }else{
            this.activeBorderColor = JSColor.black.colorWithAlpha(0.4);
        }
        if (spec.containsKey("dropTargetBorderColor")){
            this.dropTargetBorderColor = spec.valueForKey("dropTargetBorderColor", JSColor);
        }else{
            this.dropTargetBorderColor = JSColor.black.colorWithAlpha(0.2);
        }
        if (spec.containsKey("disabledBorderColor")){
            this.disabledBorderColor = spec.valueForKey("disabledBorderColor", JSColor);
        }else{
            this.disabledBorderColor = JSColor.clear;
        }
        if (spec.containsKey("normalBorderWidth")){
            this.normalBorderWidth = spec.valueForKey("normalBorderWidth");
        }
        if (spec.containsKey("activeBorderWidth")){
            this.activeBorderWidth = spec.valueForKey("activeBorderWidth");
        }
        if (spec.containsKey("dropTargetBorderWidth")){
            this.dropTargetBorderWidth = spec.valueForKey("dropTargetBorderWidth");
        }
        if (spec.containsKey("disabledBorderWidth")){
            this.disabledBorderWidth = spec.valueForKey("disabledBorderWidth");
        }
        if (spec.containsKey("wellInsets")){
            this.wellInsets = spec.valueForKey("wellInsets", JSInsets);
        }else{
            this.wellInsets = JSInsets.Zero;
        }
        if (spec.containsKey("cornerRadius")){
            this.cornerRadius = spec.valueForKey("cornerRadius");
        }
        if (spec.containsKey("size")){
            this.size = spec.valueForKey("size", JSSize);
        }else{
            this.size = JSSize(44, 22);
        }
        if (spec.containsKey("wellInnerShadowColor")){
            this.wellInnerShadowColor = spec.valueForKey("wellInnerShadowColor", JSColor);
        }else{
            this.wellInnerShadowColor = JSColor.black.colorWithAlpha(0.4);
        }
        if (spec.containsKey("wellInnerShadowOffset")){
            this.wellInnerShadowOffset = spec.valueForKey("wellInnerShadowOffset", JSPoint);
        }else{
            this.wellInnerShadowOffset = JSPoint(0, 1);
        }
        if (spec.containsKey("wellInnerShadowRadius")){
            this.wellInnerShadowRadius = spec.valueForKey("wellInnerShadowRadius");
        }
    },

    initializeControl: function(colorWell){
        var wellLayer = UILayer.init();
        wellLayer.delegate = this;
        colorWell.layer.addSublayer(wellLayer);
        colorWell.stylerProperties.wellLayer = wellLayer;
        colorWell.cornerRadius = this.cornerRadius;
        wellLayer.cornerRadius = Math.max(0, this.cornerRadius - this.wellInsets.left / 2);
        this.updateControl(colorWell);
    },

    updateControl: function(colorWell){
        var wellLayer = colorWell.stylerProperties.wellLayer;
        wellLayer.backgroundColor = colorWell._color;
        wellLayer.setNeedsDisplay();
        if (colorWell.enabled){
            if (colorWell.dropTarget){
                colorWell.borderWidth = this.dropTargetBorderWidth;
                colorWell.borderColor = this.dropTargetBorderColor;
                colorWell.backgroundColor = this.dropTargetBackgroundColor;
            }else if (colorWell.active){
                colorWell.borderWidth = this.activeBorderWidth;
                colorWell.borderColor = this.activeBorderColor;
                colorWell.backgroundColor = this.activeBackgroundColor;
            }else{
                colorWell.borderWidth = this.normalBorderWidth;
                colorWell.borderColor = this.normalBorderColor;
                colorWell.backgroundColor = this.normalBackgroundColor;
            }
        }else{
            colorWell.borderWidth = this.disabledBorderWidth;
            colorWell.borderColor = this.disabledBorderColor;
            colorWell.backgroundColor = this.disabledBackgroundColor;
        }
    },

    intrinsicSizeOfControl: function(colorWell){
        return JSSize(this.size);
    },

    layoutControl: function(colorWell){
        var wellLayer = colorWell.stylerProperties.wellLayer;
        wellLayer.frame = colorWell.bounds.rectWithInsets(this.wellInsets);
    },

    drawLayerInContext: function(layer, context){
        var colorWell = layer.superlayer.delegate;
        if (layer === colorWell.stylerProperties.wellLayer){
            context.save();
            context.addPath(layer.backgroundPath());
            context.clip();
            if (colorWell.allowsAlpha){
                context.save();
                context.beginPath();
                context.moveToPoint(0, 0);
                context.addLineToPoint(layer.bounds.size.width, 0);
                context.addLineToPoint(0, layer.bounds.size.height);
                context.closePath();
                context.setFillColor(colorWell._color.colorWithAlpha(1));
                context.fillPath();
                context.restore();
            }
            if (this.wellInnerShadowOffset){
                context.save();
                context.addRect(layer.bounds.rectWithInsets(-100));
                context.addPath(layer.backgroundPath());
                context.setFillColor(this.wellInnerShadowColor);
                context.setShadow(this.wellInnerShadowOffset, this.wellInnerShadowRadius, this.wellInnerShadowColor.colorWithAlpha(1));
                context.fillPath(JSContext.FillRule.evenOdd);
                context.restore();
            }
            context.restore();
        }
    },

    pathForColorWellDragImage: function(colorWell){
        return colorWell.stylerProperties.wellLayer.backgroundPath();
    },

});