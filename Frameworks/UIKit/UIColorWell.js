// #import "UIControl.js"
// #import "UIPasteboard.js"
"use strict";

JSClass("UIColorWell", UIControl, {

    initWithFrame: function(frame){
        UIColorWell.$super.initWithFrame.call(this, frame);
    },

    initWithSpec: function(spec){
        UIColorWell.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("color")){
            this._color = spec.valueForKey("color", JSColor);
        }
    },

    commonUIControlInit: function(){
        UIColorWell.$super.commonUIControlInit.call(this);
        this.registerForDraggedTypes([
            UIPasteboard.ContentType.plainText,
            JSColor.contentType
        ]);
    },

    allowsAlpha: true,

    color: JSDynamicProperty("_color", JSColor.black),

    setColor: function(color){
        this.color = color;
        this.update();
    },

    update: function(){
        if (this._styler !== null){
            this._styler.updateControl(this);
        }
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
            var items = [
                {
                    type: UIPasteboard.ContentType.plainText,
                    stringValue: this.color.rgbaHexStringRepresentation()
                },
                {
                    type: JSColor.contentType,
                    objectValue: this.color.dictionaryRepresentation()
                }
            ];
            var session = this.beginDraggingSessionWithItems(items, event);
            var image = JSImage.initWithData('<?xml version="1.0" charset="utf-8"?>\n<svg version="1.1" width="%dpx" height="%dpx" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1" height="1" fill="#%s"/></svg>'.sprintf(this.bounds.size.width, this.bounds.size.height, items[0].stringValue).utf8());
            session.setImage(image, location);
            return;
        }
        UIColorWell.$super.mouseDragged.call(this, event);
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.active){
                this.window.application.sendAction("pickColor", this.superview, this, event);
                this.active = false;
            }
            return;
        }
        UIColorWell.$super.mouseUp.call(this, event);
    },

    // ----------------------------------------------------------------------
    // MARK: - Touch Events

    touchesBegan: function(touches, event){
    },

    touchesMoved: function(touches, event){
    },

    touchesCanceled: function(touches, event){
    },

    touchesEnded: function(touches, event){
    },

    // ----------------------------------------------------------------------
    // MARK: - Drag and Drop

    draggingSessionDidBecomeActive: function(session){
        this.active = false;
    },

    draggingSessionEnded: function(session, operation){
    },

    draggingEntered: function(session){
        this.dropTarget = true;
        return UIDragOperation.copy;
    },

    draggingUpdated: function(session){
        return UIDragOperation.copy;
    },

    draggingExited: function(session){
        this.dropTarget = false;
    },

    performDragOperation: function(session, operation){
        if (session.pasteboard.containsType(JSColor.contentType)){
            this.color = JSColor.initFromDictionary(session.pasteboard.objectForType(JSColor.contentType));
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Color Picker

});

JSClass("UIColorWellStyler", UIControlStyler, {

});