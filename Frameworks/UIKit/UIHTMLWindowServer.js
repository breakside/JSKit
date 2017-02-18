// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIHTMLDisplayServer.js"
// #feature Element.prototype.addEventListener
/* global JSClass, UIWindowServer, UIWindowServer, UIEvent, JSPoint, UIHTMLWindowServer, UIHTMLDisplayServer */
'use strict';

JSClass("UIHTMLWindowServer", UIWindowServer, {

    rootElement: null,
    domDocument: null,
    domWindow: null,
    mouseDownButton: -1,

    initWithRootElement: function(rootElement){
        UIHTMLWindowServer.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.setupRenderingEnvironment();
        this.setupEventListeners();
        this.mouseDownButton = UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE;
        this.displayServer = UIHTMLDisplayServer.initWithRootElement(rootElement);
    },

    setupRenderingEnvironment: function(){
        if (this.rootElement === this.domDocument.body){
            var body = this.rootElement;
            var html = this.domDocument.documentElement;
            body.style.padding = '0';
            html.style.padding = '0';
            body.style.margin = '0';
            html.style.margin = '0';
            body.style.height = '100%';
            html.style.height = '100%';
            html.style.overflow = 'hidden';
            body.style.overflow = 'hidden';
        }else{
            var style = this.domWindow.getComputedStyle(this.rootElement);
            if (style.position != 'absolute' && style.position != 'relative' && style.position != 'fixed'){
                this.rootElement.style.position = 'relative';
            }
        }
        this.rootElement.style.cursor = 'default';
    },

    setupEventListeners: function(){
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('keydown', this, false);
        this.rootElement.addEventListener('keyup', this, false);
        this.rootElement.addEventListener('keypress', this, false);
        this.rootElement.addEventListener('dragstart', this, false);
        this.rootElement.addEventListener('dragend', this, false);
        this.rootElement.addEventListener('mouseleave', this, false);
        this.domWindow.addEventListener('resize', this, false);
        // TODO: efficient mousemove (look into tracking areas)
        // TODO: mouse enter/exit (look into tracking areas)
        // TODO: dragging
        // TODO: special things like file input change
        // TODO: DOM 3 Key Events (if supported)
        // TODO: touch events?
        // TODO: copy/paste
        // TODO: does stopping key events interfere with browser keyboard shortcuts? (some, yes)
    },

    startListeningForMouseDrag: function(){
        this.rootElement.ownerDocument.addEventListener('mousemove', this, false);
    },

    stopListeningForMouseDrag: function(){
        this.rootElement.ownerDocument.removeEventListener('mousemove', this, false);
    },

    handleEvent: function(e){
        this[e.type](e);
        // FIXME: I think stopping a mousedown in Firefox prevents dragstart from working
        e.stopPropagation();
        if (e.cancelable){
            e.preventDefault();
        }
    },

    mousedown: function(e){
        switch (e.button){
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.LeftMouseDown);
                break;
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.RightMouseDown);
                break;
        }
        if (this.mouseDownButton == UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE){
            this.mouseDownButton = e.button;
            this.startListeningForMouseDrag();
        }
    },

    mouseup: function(e){
        if (this.mouseDownButton != UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE){
            switch (e.button){
                case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                    this._createMouseEventFromDOMEvent(e, UIEvent.Type.LeftMouseUp);
                    break;
                case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                    this._createMouseEventFromDOMEvent(e, UIEvent.Type.RightMouseUp);
                    break;
            }
            if (e.button == this.mouseDownButton){
                this.mouseDownButton = UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE;
                this.stopListeningForMouseDrag();
            }
        }
    },

    mousemove: function(e){
        switch (this.mouseDownButton){
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.LeftMouseDragged);
                break;
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.RightMouseDragged);
                break;
        }
    },

    mouseleave: function(e){
        switch (this.mouseDownButton){
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.LeftMouseUp);
                this.mouseDownButton = UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE;
                this.stopListeningForMouseDrag();
                break;
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.RightMouseUp);
                this.mouseDownButton = UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE;
                this.stopListeningForMouseDrag();
                break;
        }
    },

    dragstart: function(e){
    },

    dragend: function(e){
    },

    keydown: function(e){
    },

    keyup: function(e){
    },

    keypress: function(e){
    },

    resize: function(e){
        if (e.currentTarget === this.domWindow){
            this.displayServer.updateRootBounds();
        }
    },

    _createMouseEventFromDOMEvent: function(e, type){
        var location = this._locationOfDOMEventInScreen(e);
        var timestamp = e.timeStamp / 1000.0;
        this.createMouseEvent(type, timestamp, location);
    },

    _locationOfDOMEventInScreen: function(e){
        var screenBoundingRect = this.rootElement.getBoundingClientRect();
        return JSPoint(e.clientX - screenBoundingRect.left, e.clientY - screenBoundingRect.top);
    },

});

// From https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
// 0: Main button pressed, usually the left button or the un-initialized state
// 1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
// 2: Secondary button pressed, usually the right button
// 3: Fourth button, typically the Browser Back button
// 4: Fifth button, typically the Browser Forward button
UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE = -1;
UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT = 0;
UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT = 2;