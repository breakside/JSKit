// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIHTMLDisplayServer.js"
// #import "UIKit/UIHTMLTextInputManager.js"
// #feature Element.prototype.addEventListener
/* global JSClass, UIWindowServer, UIWindowServer, UIEvent, JSPoint, UIHTMLWindowServer, UIHTMLDisplayServer, UIHTMLTextInputManager, UIPasteboard, UICursor, UIView */
'use strict';

JSClass("UIHTMLWindowServer", UIWindowServer, {

    rootElement: null,
    domDocument: null,
    domWindow: null,
    mouseDownButton: -1,
    _cursorViewsById: null,

    initWithRootElement: function(rootElement){
        UIHTMLWindowServer.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this._cursorViewsById = {};
        this.setupRenderingEnvironment();
        this.setupEventListeners();
        this.mouseDownButton = UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_NONE;
        this.displayServer = UIHTMLDisplayServer.initWithRootElement(rootElement);
        this.textInputManager = UIHTMLTextInputManager.initWithRootElement(rootElement);
        this.textInputManager.windowServer = this;
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
        this.setCursor(UICursor.currentCursor);
    },

    setupEventListeners: function(){
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('keydown', this, false);
        this.rootElement.addEventListener('keyup', this, false);
        this.rootElement.addEventListener('dragstart', this, false);
        this.rootElement.addEventListener('dragend', this, false);
        this.rootElement.addEventListener('mouseleave', this, false);
        this.rootElement.addEventListener('contextmenu', this, false);
        this.rootElement.addEventListener('cut', this, false);
        this.rootElement.addEventListener('copy', this, false);
        this.rootElement.addEventListener('paste', this, false);
        this.rootElement.addEventListener('beforecut', this, false);
        this.rootElement.addEventListener('beforecopy', this, false);
        this.rootElement.addEventListener('beforepaste', this, false);
        this.domWindow.addEventListener('resize', this, false);

        // mobile
        this.rootElement.addEventListener('touchstart', this, false);
        this.rootElement.addEventListener('touchend', this, false);
        this.rootElement.addEventListener('touchcancel', this, false);
        this.rootElement.addEventListener('touchmove', this, false);

        // TODO: efficient mousemove (look into tracking areas)
        // TODO: mouse enter/exit (look into tracking areas)
        // TODO: dragging
        // TODO: special things like file input change
        // TODO: touch events?
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

    _isOverridingCursor: false,

    viewDidChangeCursor: function(view, cursor){
        if (cursor === null){
            delete this._cursorViewsById[view.objecID];
        }else{
            this._cursorViewsById[view.objectID] = view;
        }
        if (!this._isOverridingCursor){
            this._setViewCursor(view, cursor !== null ? cursor.cssString() : '');
        }
    },

    _setViewCursor: function(view, cssCursor){
        var context = this.displayServer.contextForLayer(view.layer);
        context.style.cursor = cssCursor;
    },

    hideCursor: function(){
        this._setCursor("none", true);
    },

    unhideCursor: function(){
        this.setCursor(UICursor.currentCursor);
    },

    setCursor: function(cursor){
        this._setCursor(cursor.cssString(), UICursor._stack.length > 1);
    },

    _setCursor: function(cssCursor, isOverride){
        this.rootElement.style.cursor = cssCursor;
        var id;
        var view;
        if (isOverride){
            if (!this._isOverridingCursor){
                this._isOverridingCursor = true;
                for (id in this._cursorViewsById){
                    this._setViewCursor(this._cursorViewsById[id], '');
                }
            }
        }else{
            if (this._isOverridingCursor){
                this._isOverridingCursor = false;
                for (id in this._cursorViewsById){
                    view = this._cursorViewsById[id];
                    this._setViewCursor(view, view.cursor.cssString());
                }
            }
        }
    },

    viewDidChangeMouseTracking: function(view, trackingType){
        var context = this.displayServer.contextForLayer(view.layer);
        var windowServer = this;
        if (trackingType === UIView.MouseTracking.none){
            context.stopMouseTracking();
        }else{
            var listener = {
                handleEvent: function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    this[e.type](e);
                },

                mouseenter: function(e){
                    windowServer._createMouseTrackingEventFromDOMEvent(e, UIEvent.Type.MouseEntered, view);
                },

                mouseleave: function(e){
                    windowServer._createMouseTrackingEventFromDOMEvent(e, UIEvent.Type.MouseExited, view);
                },

                mousemove: function(e){
                    windowServer._createMouseTrackingEventFromDOMEvent(e, UIEvent.Type.MouseMoved, view);
                }
            };
            context.startMouseTracking(trackingType, listener);
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

    contextmenu: function(e){
    },

    dragstart: function(e){
    },

    dragend: function(e){
    },

    keydown: function(e){
        if (this.keyWindow){
            this._createKeyEventFromDOMEvent(e, UIEvent.Type.KeyDown);
        }
    },

    keyup: function(e){
        if (this.keyWindow){
            this._createKeyEventFromDOMEvent(e, UIEvent.Type.KeyUp);
        }
    },

    cut: function(e){
        if (this.keyWindow === null){
            return;
        }
        this.keyWindow.application.sendAction('cut');
        this._populateDomClipboard(e.clipboardData);
    },

    copy: function(e){
        if (this.keyWindow === null){
            return;
        }
        this.keyWindow.application.sendAction('copy');
        this._populateDomClipboard(e.clipboardData);
    },

    _populateDomClipboard: function(dataTransfer){
        var pasteboard = UIPasteboard.general;
        if (pasteboard.containsType(UIPasteboard.ContentType.plainText)){
            dataTransfer.setData('text/plain', pasteboard.valueForType(UIPasteboard.ContentType.plainText));
        }
        // TODO: other types
    },

    paste: function(e){
        if (this.keyWindow === null){
            return;
        }
        var domType;
        var domValue;
        for (var i = 0, l = e.clipboardData.types.length; i < l; ++i){
            domType = e.clipboardData.types[i];
            domValue = e.clipboardData.getData(domType);
            switch (domType){
                case 'text':
                case 'text/plain':
                    UIPasteboard.general.setValueForType(domValue, UIPasteboard.ContentType.plainText);
                    break;
            }
        }
        this.keyWindow.application.sendAction('paste');
    },

    beforecut: function(e){
        // Just having a listener seems to always keep Edit > Cut enabled in Safari
    },

    beforecopy: function(e){
        // Just having a listener seems to always keep Edit > Copy enabled in Safari
    },

    beforepaste: function(e){
        // Not sure if this is really needed like beforecopy seems to be
        // Safari is only enabling paste when focused in a textarea
    },

    resize: function(e){
        if (e.currentTarget === this.domWindow){
            this.displayServer.updateRootBounds();
        }
    },

    // mobile

    touchstart: function(e){
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.TouchesBegan);
    },

    touchend: function(e){
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.TouchesEnded);
    },

    touchcancel: function(e){
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.TouchesCanceled);
    },

    touchmove: function(e){
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.TouchesMoved);
    },

    _createMouseEventFromDOMEvent: function(e, type){
        var location = this._locationOfDOMEventInScreen(e);
        var timestamp = e.timeStamp / 1000.0;
        this.createMouseEvent(type, timestamp, location);
    },

    _createMouseTrackingEventFromDOMEvent: function(e, type, view){
        var location = this._locationOfDOMEventInScreen(e);
        var timestamp = e.timeStamp / 1000.0;
        this.createMouseTrackingEvent(type, timestamp, location, view);
    },

    _locationOfDOMEventInScreen: function(e){
        var screenBoundingRect = this.rootElement.getBoundingClientRect();
        return JSPoint(e.clientX - screenBoundingRect.left, e.clientY - screenBoundingRect.top);
    },

    _locationOfDOMTouchInScreen: function(touch){
        var screenBoundingRect = this.rootElement.getBoundingClientRect();
        return JSPoint(touch.clientX - screenBoundingRect.left, touch.clientY - screenBoundingRect.top);
    },

    _createKeyEventFromDOMEvent: function(e, type){
        var timestamp = e.timeStamp / 1000.0;
        // TODO: maybe use e.key if available
        // see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names_and_Char_values
        var keyCode = e.keyCode;
        this.createKeyEvent(type, timestamp, keyCode);
    },

    _createTouchEventFromDOMEvent: function(e, type){
        var timestamp = e.timeStamp / 1000.0;
        var touchDescriptors = [];
        var touchDescriptor = null;
        var domTouch;
        for (var i = 0, l = e.changedTouches.length; i < l; ++i){
            domTouch = e.changedTouches[i];
            touchDescriptor = {
                identifier: domTouch.identifier,
                location: this._locationOfDOMTouchInScreen(domTouch)
            };
            touchDescriptors.push(touchDescriptor);
        }
        this.createTouchEvent(type, timestamp, touchDescriptors);
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