// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UIScreen.js"
// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIHTMLDisplayServer.js"
// #import "UIKit/UIHTMLTextInputManager.js"
// #import "UIKit/UIPlatform.js"
// #import "UIKit/UIOpenPanel.js"
// #feature Element.prototype.addEventListener
// #feature 'key' in KeyboardEvent.prototype
// #feature File
/* global File, JSClass, UIWindowServer, JSDynamicProperty, UIWindowServer, UIPlatform, UIEvent, JSPoint, UIHTMLWindowServer, UIHTMLDisplayServer, UIHTMLTextInputManager, UIPasteboard, UICursor, UIView, JSRect, UIScreen, UIDraggingSession, UIHTMLDataTransferPasteboard, UIDragOperation, JSHTMLFile, JSDataFile */
'use strict';

(function(){

JSClass("UIHTMLWindowServer", UIWindowServer, {

    // --------------------------------------------------------------------
    // MARK: - Creating an HTML Window Server

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
        UIPasteboard.general = UIHTMLDataTransferPasteboard.init();
    },

    // --------------------------------------------------------------------
    // MARK: - HMTL Rendering Environment

    rootElement: null,
    domDocument: null,
    domWindow: null,
    _screenClientOrigin: null,

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

    // --------------------------------------------------------------------
    // MARK: - Cursor Management
    
    _cursorViewsById: null,
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
                    this._setElementCursor(context.element, ['']);
                }
            }
        }else{
            if (this._isOverridingCursor){
                this._isOverridingCursor = false;
                for (id in this._cursorViewsById){
                    view = this._cursorViewsById[id];
                    context = this.displayServer.contextForLayer(view.layer);
                    this._setElementCursor(context.element, view.cursor.cssStrings());
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
                    windowServer._createMouseTrackingEventFromDOMEvent(e, UIEvent.Type.mouseEntered, view);
                },

                mouseleave: function(e){
                    windowServer._createMouseTrackingEventFromDOMEvent(e, UIEvent.Type.mouseExited, view);
                },

                mousemove: function(e){
                    windowServer._createMouseTrackingEventFromDOMEvent(e, UIEvent.Type.mouseMoved, view);
                }
            };
            context.startMouseTracking(trackingType, listener);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - HMTL Events

    setupEventListeners: function(){
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('mousemove', this, false);
        this.rootElement.addEventListener('wheel', this, false);
        this.rootElement.addEventListener('gesturestart', this, false);
        this.rootElement.addEventListener('gesturechange', this, false);
        this.rootElement.addEventListener('gestureend', this, false);
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
        this.domWindow.addEventListener('focus', this, false);
        this.domWindow.addEventListener('blur', this, false);
        this.domWindow.addEventListener('resize', this, false);
        this.domWindow.addEventListener('languagechange', this, false);

        // mobile
        this.rootElement.addEventListener('touchstart', this, {passive: false, capture: false});
        this.rootElement.addEventListener('touchend', this, {passive: false, capture: false});
        this.rootElement.addEventListener('touchcancel', this, {passive: false, capture: false});
        this.rootElement.addEventListener('touchmove', this, {passive: false, capture: false});
    },

    handleEvent: function(e){
        e.stopPropagation();
        this[e.type](e);
    },

    // --------------------------------------------------------------------
    // MARK: - Mouse Events

    mousedown: function(e){
        // Don't preventDefault of mousedown, because doing so prevents drag events from firing.
        // Earlier code did prevent default of mousedown as a method
        // of preventing text selection on the page for things that should not be selectable
        // (e.g., most labels in a typical app are not selectable).  However, it's possible to
        // use CSS user-select: none to prevent text selection, and all modern browsers support that,
        // so there's no side-effect of keeping the default down behavior.
        // UPDATE: there actually is a side-effect: the text input textarea is blurred on mousedown,
        // see mouseup for details.
        this._updateMouseLocation(e);
        switch (e.button){
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.leftMouseDown);
                break;
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.rightMouseDown);
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
        e.preventDefault();
        this.textInputManager._ensureCorrectFocus();
        this._updateMouseLocation(e);
        switch (e.button){
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_LEFT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.leftMouseUp);
                break;
            case UIHTMLWindowServer.DOM_MOUSE_EVENT_BUTTON_RIGHT:
                this._createMouseEventFromDOMEvent(e, UIEvent.Type.rightMouseUp);
                break;
        }
    },

    mousemove: function(e){
        // Don't preventDefault of mousemove, because doing so prevents drag events from firing.
        // Earlier code did prevent default of mousemove as a method
        // of preventing text selection on the page for things that should not be selectable
        // (e.g., most labels in a typical app are not selectable).  However, it's possible to
        // use CSS user-select: none to prevent text selection, and all modern browsers support that,
        // so there's no side-effect of keeping the default move behavior.
        this._updateMouseLocation(e);
        this.mouseDidMove(e.timeStamp / 1000.0);
    },

    mouseleave: function(e){
        // mouseleave is not cancelable, so no need for preventDefault
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

    wheel: function(e){
        // prevent the default wheel behavior so we can do our own
        e.preventDefault();
        this._createScrollEventFromDOMEvent(e, UIEvent.Type.scrollWheel);
    },

    _createMouseEventFromDOMEvent: function(e, type){
        var timestamp = e.timeStamp / 1000.0;
        var modifiers = this._modifiersFromDOMEvent(e);
        this.createMouseEvent(type, timestamp, this.mouseLocation, modifiers);
    },

    _createMouseTrackingEventFromDOMEvent: function(e, type, view){
        this._updateMouseLocation(e);
        var timestamp = e.timeStamp / 1000.0;
        if (type === UIEvent.Type.mouseMoved){
            this.mouseDidMove(timestamp);
        }
        var modifiers = this._modifiersFromDOMEvent(e);
        this.createMouseTrackingEvent(type, timestamp, this.mouseLocation, modifiers, view);
    },

    _createScrollEventFromDOMEvent: function(e, type){
        var timestamp = e.timeStamp / 1000.0;
        var modifiers = this._modifiersFromDOMEvent(e);
        this.createScrollEvent(type, timestamp, this.mouseLocation, e.deltaX, e.deltaY, modifiers);
    },

    // --------------------------------------------------------------------
    // MARK: - Key Events

    keydown: function(e, preventDefault){
        // prevent the default key behavior so we can do our own key processing without
        // invoking default browser behaviors like tabbing or keyboard shortcuts.
        // FIXME: However, we want to keep browser shortcuts for cut/copy/paste
        if (this.keyWindow){
            this._createKeyEventFromDOMEvent(e, UIEvent.Type.keyDown, preventDefault);
        }
    },

    keyup: function(e){
        // prevent the default key behavior so we can use our own shortcuts without
        // invoking default browser behaviors.
        e.preventDefault();
        if (this.keyWindow){
            this._createKeyEventFromDOMEvent(e, UIEvent.Type.keyUp);
        }
    },

    _createKeyEventFromDOMEvent: function(e, type, preventDefault){
        var timestamp = e.timeStamp / 1000.0;
        var modifiers = this._modifiersFromDOMEvent(e);
        var key = this._correctedEventKey(e.key);
        if (preventDefault === undefined){
            preventDefault = true;
        }
        var isCommand = type == UIEvent.Type.keyDown && (modifiers & UIPlatform.shared.commandModifier);
        if (isCommand){
            switch (e.keyCode){
                case 67: // c
                    if (modifiers === UIPlatform.shared.commandModifier){
                        // We want to let the copy keyboard shortcut go through, so it can be
                        // handled by the system.
                        preventDefault = false;
                    }
                    break;
                case 88: // x
                    if (modifiers === UIPlatform.shared.commandModifier){
                        // We want to let the cut keyboard shortcut go through, so it can be
                        // handled by the system.
                        preventDefault = false;
                    }
                    break;
                case 86: // v
                    if (modifiers === UIPlatform.shared.commandModifier){
                        // We want to let the paste keyboard shortcut go through, so it can be
                        // handled by the system.
                        preventDefault = false;
                    }
                    break;
                case 90: // z
                    if (modifiers === UIPlatform.shared.commandModifier){
                        // We want to prevent the default undo shortcut, so we can do our own
                        // undo operation instead of the browser default, which would likely
                        // mess up our text input manager.
                        preventDefault = true;
                    }else if (UIPlatform.shared.identifier === UIPlatform.Identifier.mac && modifiers === (UIPlatform.shared.commandModifier | UIEvent.Modifier.shift)){
                        // We want to prevent the default redo shortcut, so we can do our own
                        // undo operation instead of the browser default, which would likely
                        // mess up our text input manager.
                        preventDefault = true;
                    }
                    break;
                case 89: // y
                    if (modifiers === UIPlatform.shared.commandModifier && UIPlatform.shared.identifier === UIPlatform.Identifier.win){
                        // We want to prevent the default redo shortcut, so we can do our own
                        // undo operation instead of the browser default, which would likely
                        // mess up our text input manager.
                        preventDefault = true;
                    }
                    break;
            }
        }
        if (preventDefault){
            e.preventDefault();
        }
        if (isCommand && !preventDefault){
            var server = this;
            this._wasKeyEventHandledBySystemEvent = false;
            this.domWindow.requestAnimationFrame(function(){
                if (!server.keyWindow){
                    return;
                }
                if (server._wasKeyEventHandledBySystemEvent){
                    return;
                }
                server.createKeyEvent(type, timestamp, key, e.keyCode, modifiers);
            });
        }else{
            this.createKeyEvent(type, timestamp, key, e.keyCode, modifiers);
        }
    },

    _correctedEventKey: function(key){
        if (key === 'Left'){
            return 'ArrowLeft';
        }
        if (key === 'Right'){
            return 'ArrowDown';
        }
        if (key === 'Down'){
            return 'ArrowDown';
        }
        if (key === 'Up'){
            return 'ArrowUp';
        }
        return key;
    },

    _wasKeyEventHandledBySystemEvent: false,
    _dragingSessionStartedOutsideBrowser: false,

    // --------------------------------------------------------------------
    // MARK: - Drag Events

    dragstart: function(e){
        // Do not preventDefault of dragstart, or else the drag won't start
        this._draggingSession.isActive = true;
        this._dragingSessionStartedOutsideBrowser = false;
        // create dummy html pasteboard and re-write our items there so they're availble outside the browser
        var htmlPasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.dataTransfer);
        this._draggingSession.writeItemsToPasteboard(htmlPasteboard);
        e.dataTransfer.effectAllowed = DragOperationToEffectAllowed[this._draggingSession.allowedOperations] || 'none';
        if (this._dragImageElement !== null){
            e.dataTransfer.setDragImage(this._dragImageElement, this._draggingSession.imageOffset.x, this._draggingSession.imageOffset.y);
        }
    },

    dragend: function(e){
        // dragend is not cancelable, so no need for preventDefault()
        if (this._dragImageElement !== null){
            if (this._dragImageElement.parentNode !== null){
                this._dragImageElement.parentNode.removeChild(this._dragImageElement);
            }
            this._dragImageElement = null;
        }
        var element = e.target;
        while (element.parentNode !== null && !e.target.draggable){
            element = element.parentNode;
        }
        element.draggable = false;
        this.resetMouseState(e.timeStamp / 1000.0);
    },

    dragenter: function(e){
        // prevent the default dragenter behavior so our custom drag and drop can work
        e.preventDefault();
        if (!this._draggingSession){
            // If we haven't yet started a dragging session, then the drag must
            // have originated outside the browser, and this is the first update
            // we've heard.  Make a new session from the dataTransfer.
            this._dragingSessionStartedOutsideBrowser = true;
            this._updateMouseLocation(e);
            var pasteboard = UIHTMLDataTransferPasteboard.initWithDataTransfer(e.dataTransfer);
            var session = UIDraggingSession.initWithPasteboard(pasteboard, this.mouseLocation);
            session.allowedOperations = EffectAllowedToDragOperation[e.dataTransfer.effectAllowed] || UIDragOperation.none;
            this.startDraggingSession(session);
        }
    },

    dragover: function(e){
        // prevent the default dragover behavior so our custom drag and drop can work
        e.preventDefault();
        if (this._dragingSessionStartedOutsideBrowser){
            this._draggingSession.pasteboard.dataTransfer = e.dataTransfer;
        }
        this._updateMouseLocation(e);
        this.mouseDidMove(e.timeStamp / 1000.0);
        e.dataTransfer.dropEffect = DragOperationToDropEffect[this._draggingSession.operation] || 'none';
    },

    drop: function(e){
        // prevent the default drop behavior so our custom drag and drop can work
        e.preventDefault();
        this._updateMouseLocation(e);
        if (this._dragingSessionStartedOutsideBrowser){
            // The original dataTransfer object from dragenter doesn't have readable files for security reasons
            // so we need to update the pasteboard with the new dataTransfer object, which has readable files
            // NOTE: It's safe to overwrite the entire pasteboard if we started with an HTMLDataTransferPasteboard,
            // which must have originated from outside the browser, because it cannot contain custom data.
            this._draggingSession.pasteboard.dataTransfer = e.dataTransfer;
        }
        this.draggingSessionDidPerformOperation();
    },

    // --------------------------------------------------------------------
    // MARK: - Gesture Events

    gesturestart: function(e){
        // prevent the default gesture behavior so we can do our own
        e.preventDefault();
        this._createGestureEventFromDOMEvent(e, UIEvent.Type.magnify, UIEvent.Phase.began, e.scale);
        this._createGestureEventFromDOMEvent(e, UIEvent.Type.rotate, UIEvent.Phase.began, e.rotation);
    },

    gesturechange: function(e){
        // prevent the default gesture behavior so we can do our own
        e.preventDefault();
        this._createGestureEventFromDOMEvent(e, UIEvent.Type.magnify, UIEvent.Phase.changed, e.scale);
        this._createGestureEventFromDOMEvent(e, UIEvent.Type.rotate, UIEvent.Phase.changed, e.rotation);
    },

    gestureend: function(e){
        // prevent the default gesture behavior so we can do our own
        e.preventDefault();
        this._createGestureEventFromDOMEvent(e, UIEvent.Type.magnify, UIEvent.Phase.ended, e.scale);
        this._createGestureEventFromDOMEvent(e, UIEvent.Type.rotate, UIEvent.Phase.ended, e.rotation);
    },

    _createGestureEventFromDOMEvent: function(e, type, phase, value){
        var timestamp = e.timeStamp / 1000.0;
        var modifiers = this._modifiersFromDOMEvent(e);
        this.createGestureEvent(type, timestamp, this.mouseLocation, phase, value, modifiers);
    },

    // --------------------------------------------------------------------
    // MARK: - Touch Events

    touchstart: function(e){
        e.preventDefault();
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.touchesBegan);
    },

    touchend: function(e){
        e.preventDefault();
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.touchesEnded);
    },

    touchcancel: function(e){
        e.preventDefault();
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.touchesCanceled);
    },

    touchmove: function(e){
        e.preventDefault();
        this._createTouchEventFromDOMEvent(e, UIEvent.Type.touchesMoved);
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

    // --------------------------------------------------------------------
    // MARK: - Clipboard Events

    cut: function(e){
        // prevent the default cut behavior so our custom data is added to the pasteboard
        e.preventDefault();
        this._wasKeyEventHandledBySystemEvent = true;
        if (this.keyWindow === null){
            return;
        }
        UIPasteboard.general.dataTransfer = e.clipboardData;
        this.keyWindow.application.sendAction('cut');
        UIPasteboard.general.dataTransfer = null;
    },

    copy: function(e){
        // prevent the default copy behavior so our custom data is added to the pasteboard
        e.preventDefault();
        this._wasKeyEventHandledBySystemEvent = true;
        if (this.keyWindow === null){
            return;
        }
        UIPasteboard.general.dataTransfer = e.clipboardData;
        this.keyWindow.application.sendAction('copy');
        UIPasteboard.general.dataTransfer = null;
    },

    paste: function(e){
        // prevent the default paste behavior so our custom data is read from the pasteboard
        e.preventDefault();
        this._wasKeyEventHandledBySystemEvent = true;
        if (this.keyWindow === null){
            return;
        }
        UIPasteboard.general.dataTransfer = e.clipboardData;
        this.keyWindow.application.sendAction('paste');
        UIPasteboard.general.dataTransfer = null;
    },

    beforecut: function(e){
        // Just having a listener seems to always keep Edit > Cut enabled in Safari
        e.preventDefault();
    },

    beforecopy: function(e){
        // Just having a listener seems to always keep Edit > Copy enabled in Safari
        e.preventDefault();
    },

    beforepaste: function(e){
        // Not sure if this is really needed like beforecopy seems to be
        // Safari is only enabling paste when focused in a textarea
        e.preventDefault();
    },

    _dispatchCopy: function(){
        this.domDocument.execCommand('copy');
    },

    _dispatchCut: function(){
        this.domDocument.execCommand('cut');
    },

    _dispatchPaste: function(){
        this.domDocument.execCommand('paste');
    },

    // --------------------------------------------------------------------
    // MARK: - Window Events

    resize: function(e){
        // resize event is not cancelable, so no need for preventDefault
        if (e.currentTarget === this.domWindow){
            var oldFrame = JSRect(this.screen.frame);
            this.screen.frame = JSRect(0, 0, this.rootElement.offsetWidth, this.rootElement.offsetHeight);
            this.screenDidChangeFrame(oldFrame);
        }
    },

    contextmenu: function(e){
        // prevent the default context menu
        e.preventDefault();
    },

    focus: function(e){
        // focus is not cancelable, so no need for preventDefault
        this._hasFocus = true;
        if (this._queuedKeyWindow !== null){
            this.makeWindowKey(this._queuedKeyWindow);
            this._queuedKeyWindow = null;
        }
    },

    blur: function(e){
        // blur is not cancelable, so no need for preventDefault
        this._queuedKeyWindow = this.keyWindow;
        this.makeWindowKey(null);
        this._hasFocus = false;
    },

    languagechange: function(e){
        // blur is not cancelable, so no need for preventDefault
        // TODO: could reload the page, but what about unsaved work?
        // Notify JSLocale and have it handle things?
    },

    // --------------------------------------------------------------------
    // MARK: - Common Event Helpers

    _locationOfDOMTouchInScreen: function(touch){
        return JSPoint(touch.clientX - this._screenClientOrigin.x, touch.clientY - this._screenClientOrigin.y);
    },

    _modifiersFromDOMEvent: function(e){
        var modifiers = UIEvent.Modifier.none;
        if (e.altKey){
            modifiers |= UIEvent.Modifier.option;
        }
        if (e.ctrlKey){
            modifiers |= UIEvent.Modifier.control;
        }
        if (e.metaKey){
            modifiers |= UIEvent.Modifier.command;
        }
        if (e.shiftKey){
            modifiers |= UIEvent.Modifier.shift;
        }
        return modifiers;
    },

    _updateMouseLocation: function(e){
        this.mouseLocation.x = e.clientX - this._screenClientOrigin.x;
        this.mouseLocation.y = e.clientY - this._screenClientOrigin.y;
    },

    // --------------------------------------------------------------------
    // MARK: - Drag & Drop Support

    _dragImageElement: null,

    prerenderDragImage: function(image){
        // Safari is picky here and requires that the image element be in the document and
        // rendered before 'dragstart' references the element.
        // Firefox and Chrome are perfectly fine showing the image element without it being added,
        // But Safari ends the drag immedately after start if the image isn't ready.
        var imageElement = this.domDocument.createElement('img');
        imageElement.setAttribute("decoding", "sync");
        imageElement.style.position = 'absolute';
        imageElement.style.zIndex = -1;
        imageElement.src = image.htmlURLString();
        this.rootElement.appendChild(imageElement);
        this._dragImageElement = imageElement;
    },

    createDraggingSessionWithItems: function(items, event, view){
        var session = UIHTMLWindowServer.$super.createDraggingSessionWithItems.call(this, items, event, view);
        session.isActive = false;
        var context = this.displayServer.contextForLayer(view.layer);
        context.element.draggable = true;

        // Could use a subclass here, but this seems to work too
        var originalSetImage = session.setImage;
        var windowServer = this;
        Object.defineProperties(session, {
            setImage: {
                configurable: true,
                value: function UIHTMLWindowServer_UIDragSession_setImage(image, imageOffset){
                    originalSetImage.call(this, image, imageOffset);
                    windowServer.prerenderDragImage(image);
                }
            }
        });

        return session;
    },

    // --------------------------------------------------------------------
    // MARK: - Key Window Management

    _queuedKeyWindow: null,
    _hasFocus: true,

    makeWindowKey: function(window){
        if (this._hasFocus){
            UIHTMLWindowServer.$super.makeWindowKey.call(this, window);
        }else{
            this._queuedKeyWindow = window;
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Screen Updates

    screenDidChangeFrame: function(oldFrame){
        UIHTMLWindowServer.$super.screenDidChangeFrame.call(this, oldFrame);
        this._updateScreenClientOrigin();
    },

    _updateScreenClientOrigin: function(){
        var clientRect = this.rootElement.getBoundingClientRect();
        this._screenClientOrigin = JSPoint(clientRect.left, clientRect.top);
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

    dataTransfer: JSDynamicProperty('_dataTransfer', null),
    _dataTransferTypeSet: null,
    _extraFiles: null,

    initWithDataTransfer: function(dataTransfer){
        UIHTMLDataTransferPasteboard.$super.init.call(this);
        this._dataTransfer = dataTransfer;
        this._extraFiles = [];
    },

    init: function(){
        UIHTMLDataTransferPasteboard.$super.init.call(this);
        this._extraFiles = [];
    },

    setDataTransfer: function(dataTransfer){
        this._dataTransfer = dataTransfer;
        this._dataTransferTypeSet = null;
    },

    _updateDataTransferTypeSet: function(){
        if (this._dataTransferTypeSet === null){
            this._dataTransferTypeSet = {};
            var type;
            for (var i = 0, l = this._dataTransfer.types.length; i < l; ++i){
                type = this._dataTransfer.types[i];
                if (type == 'text' || type == 'Text'){
                    type = 'text/plain';
                }else if (type == 'url' || type == 'Url'){
                    type = 'text/uri-list';
                }
                this._dataTransferTypeSet[type] = true;
            }
        }
    },

    setStringForType: function(str, type){
        UIHTMLDataTransferPasteboard.$super.setStringForType.call(this, str, type);
        if (this._dataTransfer !== null){
            try{
                this._dataTransfer.setData(type, str);
            }catch (e){
                if (type == 'text/plain'){
                    this._dataTransfer.setData('Text', str);
                }else if (type == 'text/uri-list'){
                    this._dataTransfer.setData('Url', str);
                }else{
                    throw e;
                }
            }
        }
    },

    stringForType: function(type){
        if (this._dataTransfer !== null){
            this._updateDataTransferTypeSet();
            if (type in this._dataTransferTypeSet){
                try {
                    return this._dataTransfer.getData(type);
                }catch (e){
                    if (type == 'text/plain'){
                        return this._dataTransfer.getData('Text');
                    }
                    if (type == 'uri-list'){
                        return this._dataTransfer.getData('Url');
                    }
                    throw e;
                }
            }
        }
        return UIHTMLDataTransferPasteboard.$super.stringForType.call(this, type);
    },

    setDataForType: function(data, type){
        UIHTMLDataTransferPasteboard.$super.setDataForType.call(this, data, type);
        if (this._dataTransfer !== null){
            var base64 = data.bytes.base64StringRepresentation();
            this._dataTransfer.setData(type, base64);
        }
    },

    dataForType: function(type){
        if (this._dataTransfer !== null){
            this._updateDataTransferTypeSet();
            if (type in this._dataTransferTypeSet){
                var base64 = this._dataTransfer.getData(type);
                return base64.dataByDecodingBase64();
            }
        }
        return UIHTMLDataTransferPasteboard.$super.dataForType.call(this, type);
    },

    setObjectForType: function(obj, type){
        UIHTMLDataTransferPasteboard.$super.setObjectForType.call(this, obj, type);
        if (this._dataTransfer !== null){
            var json = JSON.stringify(obj);
            this._dataTransfer.setData(type, json);
        }
    },

    objectForType: function(type){
        if (this._dataTransfer !== null){
            this._updateDataTransferTypeSet();
            if (type in this._dataTransferTypeSet){
                var json = this._dataTransfer.getData(type);
                if (json){
                    return JSON.parse(json);
                }
                return null;
            }
        }
        return UIHTMLDataTransferPasteboard.$super.objectForType.call(this, type);
    },

    addFile: function(file){
        var htmlFile = null;
        if (this._dataTransfer !== null && this._dataTransfer.items){
            if (file.isKindOfClass(JSHTMLFile)){
                htmlFile = file._blob;
            }else if (file.isKindOfClass(JSDataFile)){
                htmlFile = new File(file._data.bytes, file.name, {type: file.contentType});
            }
            // This allows files to be dragged out of Chrome to the Desktop.
            // Disabling for now because there's not a good hook for revoking the file url when the pasteboard is done with it
            // this._dataTransfer.setData("DownloadUrl", "%s:%s:%s".sprintf(file.contentType, file.name, file.url));
        }
        if (htmlFile !== null){
            this._dataTransfer.items.add(htmlFile);
        }else{
            this._extraFiles.push(file);
        }
    },

    numberOfFiles: function(){
        var n = 0;
        if (this._dataTransfer !== null){
            n = this._dataTransfer.files.length;
        }
        return n + this._extraFiles.length;
    },

    fileAtIndex: function(index){
        if (this._dataTransfer !== null){
            if (index < this._dataTransfer.files.length){
                return JSHTMLFile.initWithFile(this._dataTransfer.files[index]);
            }
            index -= this._dataTransfer.files.length;
        }
        if (index < this._extraFiles.length){
            return this._extraFiles[index];
        }
        return null;
    },

    getTypes: function(){
        var superTypes = UIHTMLDataTransferPasteboard.$super.getTypes.call(this);
        if (this._dataTransferTypeSet !== null){
            this._updateDataTransferTypeSet();
            var types = Object.keys(this._dataTransferTypeSet);
            for (var i = 0, l = superTypes.length; i < l; ++i){
                if (!(superTypes[i] in this._dataTransferTypeSet)){
                    types.push(superTypes[i]);
                }
            }
            return types;
        }
        return superTypes;
    },

    containsType: function(type){
        if (this._dataTransfer !== null){
            this._updateDataTransferTypeSet();
            if (type in this._dataTransferTypeSet){
                return true;
            }
        }
        return UIHTMLDataTransferPasteboard.$super.containsType.call(this, type);
    }

});

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