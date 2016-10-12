// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UIWindowServer.js"
// #feature Element.prototype.addEventListener
/* global JSClass, UIWindowServer, UIWindowServer, UIEvent, JSPoint, UIWindowServerHTML */
'use strict';

JSClass("UIWindowServerHTML", UIWindowServer, {

    rootElement: null,

    initWithRootElement: function(rootElement){
        UIWindowServerHTML.$super.init.call(this);
        this.rootElement = rootElement;
        this.setupEventListeners();
    },

    setupEventListeners: function(){
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('keydown', this, false);
        this.rootElement.addEventListener('keyup', this, false);
        this.rootElement.addEventListener('keypress', this, false);
        this.rootElement.addEventListener('dragstart', this, false);
        this.rootElement.addEventListener('dragend', this, false);
        // TODO: efficient mousemove (look into tracking areas)
        // TODO: mouse enter/exit (look into tracking areas)
        // TODO: dragging
        // TODO: special things like file input change
        // TODO: DOM 3 Key Events (if supported)
        // TODO: touch events?
        // TODO: copy/paste
        // TODO: does stopping key events interfere with browser keyboard shortcuts?
        // TODO: mouse leaving document (e.g., can't track mouseup outside document)
    },

    handleEvent: function(e){
        this[e.type](e);
        // FIXME: I think stopping a mousedown in Firefox prevents dragstart from working
        e.stopPropagation();
        if (e.cancelable){
            e.preventDefault();
        }
    },

    _isMouseDown: false,

    mousedown: function(e){
        if (e.button === 0){
            this._isMouseDown = true;
            this._createMouseEventFromDOMEvent(e, UIEvent.Type.MouseDown);
        }
    },

    mouseup: function(e){
        if (this._isMouseDown && e.button === 0){
            this._isMouseDown = false;
            this._createMouseEventFromDOMEvent(e, UIEvent.Type.MouseUp);
        }
    },

    keydown: function(e){
    },

    keyup: function(e){
    },

    keypress: function(e){
    },

    dragstart: function(e){
    },

    dragend: function(e){
    },

    _createMouseEventFromDOMEvent: function(e, type){
        var location = this._locationOfDOMEventInScreen(e);
        var timestamp = e.timeStamp / 1000.0;
        this.createMouseEvent(type, timestamp, location);
    },

    _locationOfDOMEventInScreen: function(e){
        var screenBoundingRect = this.rootElement.getBoundingClientRect();
        return JSPoint(e.clientX - screenBoundingRect.x, e.clientY - screenBoundingRect.y);
    },

});