// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UIScreen.js"
// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIHTMLDisplayServer.js"
// #import "UIKit/UIHTMLTextInputManager.js"
// #feature Element.prototype.addEventListener
/* global JSClass, UIWindowServer, UIWindowServer, UIEvent, JSPoint, UIHTMLWindowServer, UIHTMLDisplayServer, UIHTMLTextInputManager, UIPasteboard, UICursor, UIView, JSRect, UIScreen, UIDraggingSession, UIHTMLDataTransferPasteboard, UIDragOperation */
'use strict';

(function(){

JSClass("UIHTMLWindowServer", UIWindowServer, {

    rootElement: null,
    domDocument: null,
    domWindow: null,
    _cursorViewsById: null,
    _screenClientOrigin: null,

    initWithRootElement: function(rootElement){
        UIHTMLWindowServer.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this._cursorViewsById = {};
        this.setupRenderingEnvironment();
        this.setupEventListeners();
        this.displayServer = UIHTMLDisplayServer.initWithRootElement(rootElement);
        this.textInputManager = UIHTMLTextInputManager.initWithRootElement(rootElement);
        this.textInputManager.windowServer = this;
        this.screen = UIScreen.initWithFrame(JSRect(0, 0, this.rootElement.offsetWidth, this.rootElement.offsetHeight), this.domDocument.defaultView.devicePixelRatio || 1);
        this._updateScreenClientOrigin();
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
        this.rootElement.style.userSelect = 'none';
        this.rootElement.style.mozUserSelect = 'none';
        this.rootElement.style.webkitUserSelect = 'none';
        this.setCursor(UICursor.currentCursor);
    },

    setupEventListeners: function(){
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('mousemove', this, false);
        this.rootElement.addEventListener('keydown', this, false);
        this.rootElement.addEventListener('keyup', this, false);
        this.rootElement.addEventListener('dragstart', this, false);
        this.rootElement.addEventListener('dragend', this, false);
        this.rootElement.addEventListener('dragover', this, false);
        this.rootElement.addEventListener('dragenter', this, false);
        this.rootElement.addEventListener('drop', this, false);
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

        // TODO: special things like file input change
        // TODO: does stopping key events interfere with browser keyboard shortcuts? (some, yes)
    },

    handleEvent: function(e){
        this[e.type](e);
        e.stopPropagation();
        // TODO: Don't prevent default of mousedown or mousemove, because doing so prevents drag events from firing.
        // Earlier code did prevent default of mousedown and mousemove, as a method
        // of preventing text selection on the page for things that should not be selectable
        // (most labels, in a typical app are not selectable).  However, it's possible to
        // use CSS user-select: none to prevent text selection, and all modern browsers support that,
        // so there's no side-effect of keeping the default down and move behaviors.
        // FIXME: there actually is a side-effect: the text input textarea is blurred on mousedown
        if (e.cancelable && e.type != 'mousedown' && e.type != 'mousemove' && e.type != 'dragstart'){
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
            var context = this.displayServer.contextForLayer(view.layer);
            this._setElementCursor(context.element, cursor !== null ? cursor.cssStrings() : ['']);
        }
    },

    _setElementCursor: function(element, cssCursorStrings){
        // UICursor.cssStrings() returns a set of css strings, one of which
        // should work in our browser, but some of which may fail because they
        // use commands specific to other browsers.  The failure looks like
        // style.cursor is an empty string, so we'll keep going until it's
        // not an empty string, or we're out of options
        for (var i = 0, l = cssCursorStrings.length; i < l; ++i){
            element.style.cursor = cssCursorStrings[i];
            if (element.style.cursor !== ''){
                break;
            }
        }
    },

    hideCursor: function(){
        this._setCursor("none", true);
    },

    unhideCursor: function(){
        this.setCursor(UICursor.currentCursor);
    },

    setCursor: function(cursor){
        this._setCursor(cursor.cssStrings(), UICursor._stack.length > 1);
    },

    _setCursor: function(cssCursorStrings, isOverride){
        this._setElementCursor(this.rootElement, cssCursorStrings);
        var id;
        var view;
        var context;
        if (isOverride){
            if (!this._isOverridingCursor){
                this._isOverridingCursor = true;
                for (id in this._cursorViewsById){
                    context = this.displayServer.contextForLayer(this._cursorViewsById[id].layer);
                    this._setViewCursor(context.element, ['']);
                }
            }
        }else{
            if (this._isOverridingCursor){
                this._isOverridingCursor = false;
                for (id in this._cursorViewsById){
                    view = this._cursorViewsById[id];
                    context = this.displayServer.contextForLayer(view.layer);
                    this._setViewCursor(context.element, view.cursor.cssStrings());
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
        this._updateMouseLocation(e);
        switch (e.button){
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.LeftMouseDown);
                break;
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.RightMouseDown);
                break;
        }
    },

    mouseup: function(e){
        // The original mousedown handler called preventDefault, which ensured that
        // we wouldn't lose focus from our hidden text intput field (the browser
        // default on mouse down is to blur a focused text field).  However, to
        // accomodate drag and drop, we can't prevent default on mousedown.  Now,
        // each mousedown causes a blur on the text input.  So, we need to restore
        // the focus on mouse up
        this.textInputManager._ensureCorrectFocus();
        this._updateMouseLocation(e);
        switch (e.button){
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.LeftMouseUp);
                break;
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.RightMouseUp);
                break;
        }
    },

    mousemove: function(e){
        this._updateMouseLocation(e);
        this.mouseDidMove(e.timeStamp / 1000.0);
    },

    mouseleave: function(e){
        this._updateMouseLocation(e);
        // When the mouse leaves the root element, we won't get further events.
        // For example, if a mouse button is down, we won't hear about an up outside
        // the root element.  Therefore, the best option is to reset our mouse state, 
        // which effectively works like a mouse up for any button that is down.
        // An exception, however, is a dragging session that was initiated here in html
        // (i.e., a session with source); we will continue to get the drag events for it,
        // and want to keep the drag going.
        if (this._draggingSession === null || this._draggingSession.source === null){
            this.resetMouseState(e.timeStamp / 1000.0);
        }
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

    contextmenu: function(e){
        // do nothing (all dom events are prevented by default), we have our our context menus
    },

    dragstart: function(e){
        this._draggingSession.isActive = true;
        var temporaryPasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.dataTransfer);
        temporaryPasteboard.copy(this._draggingSession.pasteboard);
        e.dataTransfer.effectAllowed = DragOperationToEffectAllowed[this._draggingSession.allowedOperations] || 'none';
        // TODO: set dragImage
    },

    dragend: function(e){
        e.target.draggable = false;
        this.resetMouseState(e.timeStamp / 1000.0);
    },

    dragenter: function(e){
        // If we haven't yet started a dragging session, then the drag must
        // have originated outside the browser, and this is the first update
        // we've heard.  Make a new session from the dataTransfer.
        if (!this._draggingSession){
            this._updateMouseLocation(e);
            var pasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.dataTransfer);
            var session = UIDraggingSession.initWithPasteboard(pasteboard);
            session.allowedOperations = EffectAllowedToDragOperation[e.dataTransfer.effectAllowed] || UIDragOperation.none;
            this.startDraggingSession(session);
        }
    },

    dragover: function(e){
        this._updateMouseLocation(e);
        this.mouseDidMove(e.timeStamp / 1000.0);
        e.dataTransfer.dropEffect = DragOperationToDropEffect[this._draggingSession.operation] || 'none';
    },

    drop: function(e){
        this._updateMouseLocation(e);
        // The original dataTransfer object from dragenter doesn't have readable files for security reasons
        // so we need to update the pasteboard with the new dataTransfer object, which has readable files
        this._draggingSession._pasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.dataTransfer);
        this.draggingSessionDidPerformOperation();
    },

    cut: function(e){
        if (this.keyWindow === null){
            return;
        }
        this.keyWindow.application.sendAction('cut');
        var temporaryPasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.clipboardData);
        temporaryPasteboard.copy(UIPasteboard.general);
    },

    copy: function(e){
        if (this.keyWindow === null){
            return;
        }
        this.keyWindow.application.sendAction('copy');
        var temporaryPasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.clipboardData);
        temporaryPasteboard.copy(UIPasteboard.general);
    },

    paste: function(e){
        if (this.keyWindow === null){
            return;
        }
        var temporaryPasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.clipboardData);
        UIPasteboard.general.copy(temporaryPasteboard);
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
            this.screen.frame = JSRect(0, 0, this.rootElement.offsetWidth, this.rootElement.offsetHeight);
            this.screenDidChangeFrame();
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
        var timestamp = e.timeStamp / 1000.0;
        this.createMouseEvent(type, timestamp, this.mouseLocation);
    },

    _createMouseTrackingEventFromDOMEvent: function(e, type, view){
        this._updateMouseLocation(e);
        var timestamp = e.timeStamp / 1000.0;
        if (type === UIEvent.Type.MouseMoved){
            this.mouseDidMove(timestamp);
        }
        this.createMouseTrackingEvent(type, timestamp, this.mouseLocation, view);
    },

    _locationOfDOMTouchInScreen: function(touch){
        return JSPoint(touch.clientX - this._screenClientOrigin.x, touch.clientY - this._screenClientOrigin.y);
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

    screenDidChangeFrame: function(){
        UIHTMLWindowServer.$super.screenDidChangeFrame.call(this);
        this._updateScreenClientOrigin();
    },

    _updateScreenClientOrigin: function(){
        var clientRect = this.rootElement.getBoundingClientRect();
        this._screenClientOrigin = JSPoint(clientRect.left, clientRect.top);
    },

    _updateMouseLocation: function(e){
        this.mouseLocation.x = e.clientX - this._screenClientOrigin.x;
        this.mouseLocation.y = e.clientY - this._screenClientOrigin.y;
    },

    createDraggingSessionWithItems: function(items, event, view){
        var session = UIHTMLWindowServer.$super.createDraggingSessionWithItems.call(this, items, event, view);
        session.isActive = false;
        var context = this.displayServer.contextForLayer(view.layer);
        context.element.draggable = true;
        return session;
    }

});

// From https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
// 0: Main button pressed, usually the left button or the un-initialized state
// 1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
// 2: Secondary button pressed, usually the right button
// 3: Fourth button, typically the Browser Back button
// 4: Fifth button, typically the Browser Forward button
UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT = 0;
UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT = 2;

JSClass("UIHTMLDataTransferPasteboard", UIPasteboard, {

    _dataTransfer: null,
    _typeMap: null,

    initWithDataTransfer: function(dataTransfer){
        this._dataTransfer = dataTransfer;
        this._typeMap = {};
        var i, l;
        var type;
        var alias;
        for (i = 0, l = dataTransfer.types.length; i < l; ++i){
            type = dataTransfer.types[i];
            alias = DataTransferTypeAliases[type.toLowerCase()] || type;
            this._typeMap[alias] = type;
        }
    },

    getTypes: function(){
        return Object.keys(this._typeMap);
    },

    setValueForType: function(value, type){
        var alias = DataTransferTypeAliases[type.toLowerCase()] || type;
        try{
            this._dataTransfer.setData(type, value);
            this._typeMap[alias] = type;
        }catch(e){
        }
    },

    valueForType: function(type){
        if (type === UIPasteboard.ContentType.files){
            return this._dataTransfer.files;
        }
        var dataTransferType = this._typeMap[type];
        if (dataTransferType === undefined){
            return null;
        }
        return this._dataTransfer.getData(dataTransferType);
    },

    containsType: function(type){
        return type in this._typeMap;
    },

});

var DataTransferTypeAliases = {
    'text': 'text/plain',
    'url':  'text/uri-list'
};

var DragOperationToDropEffect = [
    'none',
    'copy',
    'link',
    'copy',
    'move',
    'copy',
    'link',
    'copy',
];

var DragOperationToEffectAllowed = [
    'none',
    'copy',
    'link',
    'copyLink',
    'move',
    'copyMove',
    'linkMove',
    'all'
];

var EffectAllowedToDragOperation = {
    'none':     UIDragOperation.none,
    'copy':     UIDragOperation.copy,
    'link':     UIDragOperation.link,
    'copyLink': UIDragOperation.copy | UIDragOperation.link,
    'move':     UIDragOperation.move,
    'copyMove': UIDragOperation.copy | UIDragOperation.move,
    'linkMove': UIDragOperation.link | UIDragOperation.move,
    'all':      UIDragOperation.all
};

})();