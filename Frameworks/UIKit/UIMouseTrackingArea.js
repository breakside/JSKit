// #import "UIResponder.js"
"use strict";

JSClass("UIMouseTrackingArea", UIResponder, {

    responder: null,
    rect: JSDynamicProperty("_rect", null),
    trackingType: 0,
    view: null,
    cursor: null,
    userInfo: null,
    _entered: false,

    initWithResponder: function(responder, rect, trackingType){
        this.responder = responder;
        this.rect = rect;
        this.trackingType = trackingType;
    },

    setRect: function(rect){
        this._rect = JSRect(rect);
    },

    containsPoint: function(location){
        return this._rect.containsPoint(location);
    },

    mouseEntered: function(event){
        if (this.cursor !== null){
            this.cursor.set();
        }else{
            this.responder.mouseEntered(event);
        }
    },

    mouseExited: function(event){
        if (this.cursor !== null){
            this.cursor.unset();
        }else{
            this.responder.mouseExited(event);
        }
    },

    mouseMoved: function(event){
        this.responder.mouseMoved(event);
    },

});

UIMouseTrackingArea.TrackingType = {
    none: 0,
    move: 1,
    enterAndExit: 2,
    all: 3
};