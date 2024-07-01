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

// #import "UIWindowServer.js"
// #import "UIEvent.js"
// #import "UIView.js"
// #import "UIScreen.js"
// #import "UIWindowServer.js"
// #import "UIHTMLDisplayServer.js"
// #import "UIHTMLContentEditableTextInputManager.js"
// #import "UIPlatform.js"
// #import "UIOpenPanel.js"
// #import "UIKeyboard.js"
// #feature Element.prototype.addEventListener
// #feature 'key' in KeyboardEvent.prototype
// #feature File
// #feature window.matchMedia
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("uikit", "windowServer");

JSClass("UIHTMLWindowServer", UIWindowServer, {

    // --------------------------------------------------------------------
    // MARK: - Creating an HTML Window Server

    initWithRootElement: function(rootElement){
        UIHTMLWindowServer.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.setupRenderingEnvironment();
        this.setupEventListeners();
        this.startObservingAccessibilityNotifications();
        this.displayServer = UIHTMLDisplayServer.initWithRootElement(rootElement);
        this.displayServer._windowServer = this;
        this.textInputManager = UIHTMLContentEditableTextInputManager.initWithRootElement(rootElement);
        this.textInputManager.windowServer = this;
        this.screen = UIScreen.initWithFrame(JSRect(JSPoint.Zero, this.rootElementSize()), this.domDocument.defaultView.devicePixelRatio || 1);
        this.displayServer.setScreenSize(this.screen.frame.size);
        this._updateScreenClientOrigin();
        this.setCursor(UICursor.currentCursor);
        UIPasteboard.general = UIHTMLDataTransferPasteboard.init();
        this.setupMediaListeners();
    },

    // --------------------------------------------------------------------
    // MARK: - HMTL Rendering Environment

    rootElement: null,
    domDocument: null,
    domWindow: null,
    themeColorElement: null,
    _screenClientOrigin: null,

    setupRenderingEnvironment: function(){
        if (this.rootElement === this.domDocument.body){
            var body = this.rootElement;
            var html = this.domDocument.documentElement;
            html.style.padding = '0';
            html.style.margin = '0';
            html.style.height = '100%';
            html.style.overflow = 'hidden';
            body.style.padding = '0';
            body.style.margin = '0';
            body.style.position = 'absolute';
            body.style.left = '0';
            body.style.top = '0';
            body.style.right = '0';
            body.style.bottom = '0';
            body.style.overflow = 'hidden';
            body.style.setProperty("--jskit-safe-area-inset-left", "env(safe-area-inset-left)");
            body.style.setProperty("--jskit-safe-area-inset-right", "env(safe-area-inset-right)");
            body.style.setProperty("--jskit-safe-area-inset-top", "env(safe-area-inset-top)");
            body.style.setProperty("--jskit-safe-area-inset-bottom", "env(safe-area-inset-bottom)");
            var head = this.domDocument.head;
            var child;
            for (var i = head.childNodes.length - 1; i >= 0; --i){
                child = head.childNodes[i];
                if (child.nodeType == Node.ELEMENT_NODE){
                    if (child.tagName.toLowerCase() === "meta" && child.getAttribute("name") == "theme-color"){
                        head.removeChild(child);
                    }
                }
            }
            this.themeColorElement = head.appendChild(this.domDocument.createElement("meta"));
            this.themeColorElement.setAttribute("name", "theme-color");
        }else{
            var style = this.domWindow.getComputedStyle(this.rootElement);
            if (style.position != 'absolute' && style.position != 'relative' && style.position != 'fixed'){
                this.rootElement.style.position = 'relative';
            }
            this.themeColorElement = null;
        }
        this.rootElement.style.userSelect = 'none';
        this.rootElement.style.mozUserSelect = 'none';
        this.rootElement.style.webkitUserSelect = 'none';
        this.rootElement.style.forcedColorAdjust = 'none';
    },

    // --------------------------------------------------------------------
    // MARK: - Cursor Management

    hideCursor: function(){
        this._setCursor(UICursor.none);
    },

    unhideCursor: function(){
        this.setCursor(UICursor.currentCursor);
    },

    setCursor: function(cursor){
        this._setCursor(cursor);
    },

    _setCursor: function(cursor){
        this.displayServer.screenContext.setCursor(cursor);
    },

    // --------------------------------------------------------------------
    // MARK: - HMTL Events

    setupEventListeners: function(){
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('mousemove', this, false);
        this.rootElement.addEventListener('wheel', this, {passive: false, capture: false});
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
        this.domWindow.addEventListener('orientationchange', this);
        this.domWindow.addEventListener('scroll', this);
        this.rootElement.addEventListener('touchstart', this, {passive: false, capture: false});
        this.rootElement.addEventListener('touchend', this, {passive: false, capture: false});
        this.rootElement.addEventListener('touchcancel', this, {passive: false, capture: false});
        this.rootElement.addEventListener('touchmove', this, {passive: false, capture: false});
        if (this.domWindow.visualViewport !== null){
            this.domWindow.visualViewport.addEventListener('resize', this, false);
        }
    },

    removeEventListeners: function(){
        this.rootElement.removeEventListener('mousedown', this, false);
        this.rootElement.removeEventListener('mouseup', this, false);
        this.rootElement.removeEventListener('mousemove', this, false);
        this.rootElement.removeEventListener('wheel', this, false);
        this.rootElement.removeEventListener('gesturestart', this, false);
        this.rootElement.removeEventListener('gesturechange', this, false);
        this.rootElement.removeEventListener('gestureend', this, false);
        this.rootElement.removeEventListener('keydown', this, false);
        this.rootElement.removeEventListener('keyup', this, false);
        this.rootElement.removeEventListener('dragstart', this, false);
        this.rootElement.removeEventListener('dragend', this, false);
        this.rootElement.removeEventListener('dragover', this, false);
        this.rootElement.removeEventListener('dragenter', this, false);
        this.rootElement.removeEventListener('drop', this, false);
        this.rootElement.removeEventListener('mouseleave', this, false);
        this.rootElement.removeEventListener('contextmenu', this, false);
        this.rootElement.removeEventListener('cut', this, false);
        this.rootElement.removeEventListener('copy', this, false);
        this.rootElement.removeEventListener('paste', this, false);
        this.rootElement.removeEventListener('beforecut', this, false);
        this.rootElement.removeEventListener('beforecopy', this, false);
        this.rootElement.removeEventListener('beforepaste', this, false);
        this.domWindow.removeEventListener('focus', this, false);
        this.domWindow.removeEventListener('blur', this, false);
        this.domWindow.removeEventListener('resize', this, false);
        this.domWindow.removeEventListener('languagechange', this, false);
        this.domWindow.removeEventListener('orientationchange', this);
        this.rootElement.removeEventListener('touchstart', this, {passive: false, capture: false});
        this.rootElement.removeEventListener('touchend', this, {passive: false, capture: false});
        this.rootElement.removeEventListener('touchcancel', this, {passive: false, capture: false});
        this.rootElement.removeEventListener('touchmove', this, {passive: false, capture: false});
        if (this.domWindow.visualViewport !== null){
            this.domWindow.visualViewport.removeEventListener('resize', this, false);
        }
    },

    handleEvent: function(e){
        e.stopPropagation();
        this[e.type](e);
    },

    stop: function(graceful){
        if (this.stopped){
            return;
        }
        this.removeEventListeners();
        this.removeMediaListeners();
        this.stopObservingAccessibilityNotifications();
        UIHTMLWindowServer.$super.stop.call(this, graceful);
    },

    // --------------------------------------------------------------------
    // MARK: - Media Queries

    darkColorSchemeListener: null,
    highContrastListener: null,
    reducedMotionListener: null,

    setupMediaListeners: function(){
        this.darkColorSchemeListener = this.handleDarkColorSchemeChanged.bind(this);
        this.darkColorSchemeQuery = this.domWindow.matchMedia("(prefers-color-scheme: dark)");
        this.darkColorSchemeQuery.addListener(this.darkColorSchemeListener);
        this.highContrastListener = this.handleHighContrastChanged.bind(this);
        this.highContrastQuery = this.domWindow.matchMedia("(prefers-contrast: more)");
        this.highContrastQuery.addListener(this.highContrastListener);
        this.reducedMotionListener = this.handleReducedMotionChanged.bind(this);
        this.reducedMotionQuery = this.domWindow.matchMedia("(prefers-reduced-motion)");
        this.reducedMotionQuery.addListener(this.reducedMotionListener);
        this.handleDarkColorSchemeChanged(this.darkColorSchemeQuery);
        this.handleHighContrastChanged(this.highContrastQuery);
        this.handleReducedMotionChanged(this.reducedMotionQuery);
    },

    removeMediaListeners: function(){
        this.highContrastQuery.removeListener(this.highContrastListener);
        this.reducedMotionQuery.removeListener(this.reducedMotionListener);
    },

    handleDarkColorSchemeChanged: function(query){
        var style = query.matches ? UIUserInterface.Style.dark : UIUserInterface.Style.light;
        this.traitCollection = this._traitCollection.traitsWithUserInterfaceStyle(style);
        this.updateThemeColorElement();
    },

    handleHighContrastChanged: function(query){
        var contrast = query.matches ? UIUserInterface.Contrast.high : UIUserInterface.Contrast.normal;
        this.traitCollection = this._traitCollection.traitsWithContrast(contrast);
        this.updateThemeColorElement();
    },

    handleReducedMotionChanged: function(query){
        this.displayServer.reducedMotionEnabled = query.matches;
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
            default:
                logger.debug("dom mousedown unrecogized button: %d", e.button);
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
            default:
                logger.debug("dom mouseup unrecogized button: %d", e.button);
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
        var modifiers = this._modifiersFromDOMEvent(e);
        this.mouseDidMove(e.timeStamp / 1000.0, modifiers);
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
        var modifiers = this._modifiersFromDOMEvent(e);
        this.mouseDidMove(e.timeStamp / 1000.0, modifiers);
    },

    wheel: function(e){
        // prevent the default wheel behavior so we can do our own
        e.preventDefault();
        this._createScrollEventFromDOMEvent(e, UIEvent.Type.scrollWheel);
        var modifiers = this._modifiersFromDOMEvent(e);
        this.mouseDidMove(e.timeStamp / 1000.0, modifiers);
    },

    _createMouseEventFromDOMEvent: function(e, type){
        var timestamp = e.timeStamp / 1000.0;
        var modifiers = this._modifiersFromDOMEvent(e);
        this.createMouseEvent(type, timestamp, this.mouseLocation, modifiers);
    },

    _createScrollEventFromDOMEvent: function(e, type){
        var timestamp = e.timeStamp / 1000.0;
        var modifiers = this._modifiersFromDOMEvent(e);
        var deltaX = e.deltaX;
        var deltaY = e.deltaY;
        if (UIPlatform.shared.identifier !== UIPlatform.Identifier.mac){
            var scale = e.view.devicePixelRatio;
            deltaX = Math.round(deltaX / scale);
            deltaY = Math.round(deltaY / scale);
        }
        this.createScrollEvent(type, timestamp, this.mouseLocation, deltaX, deltaY, modifiers);
    },

    // --------------------------------------------------------------------
    // MARK: - Key Events

    keydown: function(e){
        // prevent the default key behavior so we can do our own key processing without
        // invoking default browser behaviors like tabbing or keyboard shortcuts.
        // FIXME: However, we want to keep browser shortcuts for cut/copy/paste
        if (this.keyWindow){
            this._createKeyEventFromDOMEvent(e, UIEvent.Type.keyDown, true);
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
                case 81: // q
                    if (modifiers === UIPlatform.shared.commandModifier){
                        // We want to let the quit shortcut go through, so it can be
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
                case 66: // b
                case 73: // i
                case 85: // u
                    // For common formatting commands, we should prevent
                    // the browser's default behavior even if the text input
                    // system hinted that there was input.
                    preventDefault = true;
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

    shouldCancelDragOnEscape: function(){
        return !this._dragingSessionStartedOutsideBrowser;
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
        if (!this._draggingSession){
            logger.warn("dom dragstart called without an active dragging session");
            return;
        }
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
            if (this._dragImageElement.parentNode !== null && this._createdDragImageElement){
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
            session.isActive = true;
            session.allowedOperations = EffectAllowedToDragOperation[e.dataTransfer.effectAllowed] || UIDragOperation.none;
            this.startDraggingSession(session);
        }
    },

    dragover: function(e){
        // prevent the default dragover behavior so our custom drag and drop can work
        e.preventDefault();
        if (this._draggingSession !== null){
            if (this._dragingSessionStartedOutsideBrowser){
                this._draggingSession.pasteboard.dataTransfer = e.dataTransfer;
            }
        }
        this._updateMouseLocation(e);
        this.mouseDidMove(e.timeStamp / 1000.0, 0);
        if (this._draggingSession !== null){
            e.dataTransfer.dropEffect = DragOperationToDropEffect[this._draggingSession.operation] || 'none';
        }
    },

    drop: function(e){
        // prevent the default drop behavior so our custom drag and drop can work
        e.preventDefault();
        this._updateMouseLocation(e);
        if (this._draggingSession !== null){
            if (this._dragingSessionStartedOutsideBrowser){
                // The original dataTransfer object from dragenter doesn't have readable files for security reasons
                // so we need to update the pasteboard with the new dataTransfer object, which has readable files
                // NOTE: It's safe to overwrite the entire pasteboard if we started with an HTMLDataTransferPasteboard,
                // which must have originated from outside the browser, because it cannot contain custom data.
                this._draggingSession.pasteboard.dataTransfer = e.dataTransfer;
            }
            this.draggingSessionDidPerformOperation();
        }
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
        this.textInputManager._ensureCorrectFocus();
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
        var touchIdentifiers = new Set();
        var changedTouchDescriptors = [];
        var touchDescriptor = null;
        var domTouch;
        var i, l;
        for (i = 0, l = e.touches.length; i < l; ++i){
            domTouch = e.touches[i];
            touchIdentifiers.add(domTouch.identifier);
        }
        for (i = 0, l = e.changedTouches.length; i < l; ++i){
            domTouch = e.changedTouches[i];
            touchDescriptor = {
                identifier: domTouch.identifier,
                location: this._locationOfDOMTouchInScreen(domTouch)
            };
            changedTouchDescriptors.push(touchDescriptor);
            touchIdentifiers.add(domTouch.identifier);
        }
        this.createTouchEvent(type, timestamp, changedTouchDescriptors, touchIdentifiers);
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
        UIPasteboard.general.withDataTransfer(e.clipboardData, function(){
            this.keyWindow.application.sendAction('cut');
        }, this);
    },

    copy: function(e){
        // prevent the default copy behavior so our custom data is added to the pasteboard
        e.preventDefault();
        this._wasKeyEventHandledBySystemEvent = true;
        if (this.keyWindow === null){
            return;
        }
        UIPasteboard.general.withDataTransfer(e.clipboardData, function(){
            this.keyWindow.application.sendAction('copy');
        }, this);
    },

    paste: function(e){
        // prevent the default paste behavior so our custom data is read from the pasteboard
        e.preventDefault();
        this._wasKeyEventHandledBySystemEvent = true;
        if (this.keyWindow === null){
            return;
        }
        UIPasteboard.general.withDataTransfer(e.clipboardData, function(){
            this.keyWindow.application.sendAction('paste');
        }, this);
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

    virtualKeyboard: JSLazyInitProperty(function(){
        return UIKeyboard.init();
    }),

    resize: function(e){
        // resize event is not cancelable, so no need for preventDefault
        if (e.currentTarget === this.domWindow){
            var oldFrame = JSRect(this.screen.frame);
            this.screen.frame = JSRect(JSPoint.Zero, this.rootElementSize());
            this.screenDidChangeFrame(oldFrame);
            this.displayServer.setScreenSize(this.screen.frame.size);
        }else if (e.currentTarget === this.domWindow.visualViewport){
            // using touch screen as proxy for "has virtual keyboard"
            // not a perfect match, but good enough for now
            if (UIDevice.shared.primaryPointerType === UIUserInterface.PointerType.touch){
                var viewportFrame = JSRect(
                    Math.floor(this.domWindow.visualViewport.offsetLeft),
                    Math.floor(this.domWindow.visualViewport.offsetTop),
                    Math.floor(this.domWindow.visualViewport.width),
                    Math.floor(this.domWindow.visualViewport.height)
                );
                if (viewportFrame.origin.x === this.screen.frame.origin.x && viewportFrame.origin.y === this.screen.frame.origin.y && viewportFrame.size.width === this.screen.frame.size.width){
                    // A keyboard may not be the only thing that obstructs the bottom of the screen, but
                    // we'll assume that a large-ish obstruction is a keyboard
                    var obstructedHeight = this.screen.frame.size.height - viewportFrame.size.height;
                    var obstructedFrame = JSRect(0, this.screen.frame.origin.x + this.screen.frame.size.height - obstructedHeight, this.screen.frame.size.width, obstructedHeight);
                    if (!this.virtualKeyboard.frame.isEqual(obstructedFrame)){
                        var wasVisible = this.virtualKeyboard.visible;
                        this.virtualKeyboard.frame = obstructedFrame;
                        this.virtualKeyboard.visible = this.virtualKeyboard.frame.size.height > 50;
                        if (wasVisible){
                            if (this.virtualKeyboard.visible){
                                JSNotificationCenter.shared.post("UIKeyboardDidShow", this, {frame: this.virtualKeyboard.frame});
                            }else{
                                JSNotificationCenter.shared.post("UIKeyboardDidHide", this);
                                // This should only come into play on Android, where hiding the keyboard
                                // does NOT cause a blur event.  We want to go ahead and remove first responder
                                // status when the keyboard is hidden.
                                if (this.textInputManager.textInputClient instanceof UIView){
                                    if (this.textInputManager.textInputClient.window.firstResponder === this.textInputManager.textInputClient){
                                        this.textInputManager.textInputClient.window.firstResponder = null;
                                    }
                                }
                            }
                        }else{
                            if (this.virtualKeyboard.visible){
                                JSNotificationCenter.shared.post("UIKeyboardDidShow", this, {frame: this.virtualKeyboard.frame});
                            }
                        }
                    }
                }
            }
        }
    },

    scroll: function(e){
        if (e.currentTarget === this.domWindow){
            this._updateScreenClientOrigin();
        }
    },

    rootElementSize: function(){
        return JSSize(this.rootElement.clientWidth, this.rootElement.clientHeight);
    },

    safeAreaInsets: function(){
        var style = this.domWindow.getComputedStyle(this.rootElement);
        var parseValue = function(value){
            if (value.endsWith("px")){
                return parseInt(value.substr(0, value.length - 2));
            }
            return 0;
        };
        return JSInsets(
            parseValue(style.getPropertyValue("--jskit-safe-area-inset-top")),
            parseValue(style.getPropertyValue("--jskit-safe-area-inset-left")),
            parseValue(style.getPropertyValue("--jskit-safe-area-inset-bottom")),
            parseValue(style.getPropertyValue("--jskit-safe-area-inset-right"))
        );
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

    orientationchange: function(e){
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
    _createdDragImageElement: false,

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
        this._createdDragImageElement = true;
    },

    createDraggingSessionWithItems: function(items, event, view){
        var session = UIHTMLWindowServer.$super.createDraggingSessionWithItems.call(this, items, event, view);
        var context = this.displayServer.contextForLayer(view.layer);
        session.isActive = !context.hasDragEvents;

        if (context.hasDragEvents){
            context.element.draggable = true;
            // Could use a subclass here, but this seems to work too
            var originalSetImage = session.setImage;
            var originalSetImageFromView = session.setImageFromView;
            var windowServer = this;
            Object.defineProperties(session, {
                setImage: {
                    configurable: true,
                    value: function UIHTMLWindowServer_UIDragSession_setImage(image, imageOffset){
                        originalSetImage.call(this, image, imageOffset);
                        windowServer.prerenderDragImage(image);
                    }
                },
                setImageFromView: {
                    configurable: true,
                    value: function UIHTMLWindowServer_UIDragSession_setImageFromView(view, imageOffset){
                        originalSetImageFromView.call(this, view, imageOffset);
                        var context = windowServer.displayServer.contextForLayer(view.layer);
                        windowServer._dragImageElement = context.element;
                        windowServer._createdDragImageElement = false;
                    }
                }
            });
        }
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

    windowDidReaffirmFirstResponder: function(window){
        // Mobile safari doesn't accept first responder changes if they
        // aren't traceable to a user interaction
        if (UIDevice.shared !== null && UIDevice.shared.primaryPointerType === UIUserInterface.PointerType.touch){
            this.textInputManager.windowDidChangeResponder(window);
        }
    },

    orderWindowFront: function(window){
        UIHTMLWindowServer.$super.orderWindowFront.call(this, window);
        if (window.subviewIndex === 0){
            this.updateThemeColorElement();
            this.updateDocumentTitle();
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Menu Bar

    setMenuBar: function(menuBar){
        UIHTMLWindowServer.$super.setMenuBar.call(this, menuBar);
        this.updateThemeColorElement();
    },

    // --------------------------------------------------------------------
    // MARK: - HTML Document/Window

    updateThemeColorElement: function(){
        if (this.themeColorElement === null){
            return;
        }
        var window = this._menuBar;
        var color = null;
        if (window === null && this.windowStack.length > 0){
            window = this.windowStack[0];
        }
        if (window !== null){
            var vc = window.contentViewController;
            if ((vc instanceof UISplitViewController) && vc.view.mainHidden){
                vc = vc.leadingViewController;
            }
            if (vc instanceof UINavigationController){
                color = vc.navigationBar.backgroundColor;
            }else if (window.backgroundGradient !== null){
                color = window.backgroundGradient.stops[0].color;
            }else if (window.backgroundColor !== null){
                color = window.backgroundColor;
            }
        }
        if (color === null){
            color = JSColor.background;
        }
        this.themeColorElement.setAttribute("content", color.cssString());
    },

    updateDocumentTitle: function(){
        var window = this.windowStack[0];
        if (window instanceof UIRootWindow){
            if (this.rootElement === this.domDocument.body){
                this.domDocument.title = window.title;
            }
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
    },

    layoutWindow: function(window){
        UIHTMLWindowServer.$super.layoutWindow.call(this, window);
        if (window instanceof UIRootWindow){
            window.contentInsets = window.contentInsets.insetsWithInsets(this.safeAreaInsets());
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Accessibility

    accessibilityObservers: null,

    startObservingAccessibilityNotifications: function(){
        if (this.accessibilityObservers !== null){
            return;
        }
        this.accessibilityObservers = {};
        this.accessibilityObservers.elementCreated = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.elementCreated, null, this.handleAccessibilityElementCreated, this);
        this.accessibilityObservers.elementChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.elementChanged, null, this.handleAccessibilityElementChanged, this);
        this.accessibilityObservers.identifierChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.identifierChanged, null, this.handleAccessibilityIdentifierChanged, this);
        this.accessibilityObservers.labelChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.labelChanged, null, this.handleAccessibilityLabelChanged, this);
        this.accessibilityObservers.valueChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.valueChanged, null, this.handleAccessibilityValueChanged, this);
        this.accessibilityObservers.visibilityChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.visibilityChanged, null, this.handleAccessibilityVisibilityChanged, this);
        this.accessibilityObservers.enabledChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.enabledChanged, null, this.handleAccessibilityEnabledChanged, this);
        this.accessibilityObservers.selectedChildrenChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.selectedChildrenChanged, null, this.handleAccessibilitySelectedChildrenChanged, this);
        this.accessibilityObservers.firstResponderChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.firstResponderChanged, null, this.handleAccessibilityFirstResponderChanged, this);
        this.accessibilityObservers.rowCountChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.rowCountChanged, null, this.handleAccessibilityRowCountChanged, this);
        this.accessibilityObservers.columnCountChanged = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.columnCountChanged, null, this.handleAccessibilityColumnCountChanged, this);
        this.accessibilityObservers.rowExpanded = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.rowExpanded, null, this.handleAccessibilityRowExpanded, this);
        this.accessibilityObservers.rowCollapsed = this.accessibilityNotificationCenter.addObserver(UIAccessibility.Notification.rowCollapsed, null, this.handleAccessibilityRowCollapsed, this);
    },

    stopObservingAccessibilityNotifications: function(){
        if (this.accessibilityObservers === null){
            return;
        }
        var listeners = JSCopy(this.accessibilityObservers);
        this.accessibilityObservers = null;
        for (var name in listeners){
            this.accessibilityNotificationCenter.removeObserver(name, listeners[name]);
        }
    },

    contextForAccessibilityElement: function(element){
        if (element.isKindOfClass(UIApplication)){
            return this.displayServer.screenContext;
        }
        var layer = element.accessibilityLayer;
        if (layer !== null){
            return this.displayServer.contextForLayer(layer);
        }
        return null;
    },

    handleAccessibilityElementCreated: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.setAccessibility(element);
            if (element.accessibilityRole === UIAccessibility.Role.scrollBar){
                var parent = element.accessibilityParent;
                if (parent !== null && parent.accessibilityRole === UIAccessibility.Role.scrollArea){
                    context.element.setAttribute("aria-controls", this.displayServer.elementIDForAccessibility(parent));
                }
            }
        }
    },

    handleAccessibilityElementChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.setAccessibility(element);
        }
    },

    handleAccessibilityIdentifierChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityIdentifier(element);
        }
    },

    handleAccessibilityLabelChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityLabel(element);
        }
        if (element instanceof UIRootWindow){
            this.updateDocumentTitle();
        }
    },

    handleAccessibilityValueChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityValue(element);
        }
    },

    handleAccessibilityVisibilityChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityHidden(element);
        }
    },

    handleAccessibilityEnabledChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityEnabled(element);
        }
    },

    handleAccessibilitySelectedChildrenChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            var children = element.accessibilityElements;
            if (children !== null && children !== undefined){
                for (var i = 0, l = children.length; i < l; ++i){
                    context.updateAccessibilitySelected(children[i]);   
                }
            }
        }
    },

    handleAccessibilityRowExpanded: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityExpanded(element);
        }
    },

    handleAccessibilityRowCollapsed: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityExpanded(element);
        }
    },

    handleAccessibilityRowCountChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityRowCount(element);
        }
    },

    handleAccessibilityColumnCountChanged: function(notification){
        var element = notification.sender;
        var context = this.contextForAccessibilityElement(element);
        if (context !== null){
            context.updateAccessibilityColumnCount(element);
        }
    },

    handleAccessibilityFirstResponderChanged: function(notification){
        var window = notification.sender;
        var responder = window.firstResponder || window;
        if (responder.isAccessibilityElement){
            var context = this.contextForAccessibilityElement(responder);
            if (context !== null){
                context.updateAccessibilityFocus(responder);
            }
        }
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
    _locallySetTypes: null,

    initWithDataTransfer: function(dataTransfer){
        UIHTMLDataTransferPasteboard.$super.init.call(this);
        this._dataTransfer = dataTransfer;
        this._extraFiles = [];
        this._locallySetTypes = {};
    },

    init: function(){
        UIHTMLDataTransferPasteboard.$super.init.call(this);
        this._extraFiles = [];
        this._locallySetTypes = {};
    },

    withDataTransfer: function(dataTransfer, action, target){
        var locallySetTypes = JSCopy(this._locallySetTypes);
        try{
            this.dataTransfer = dataTransfer;
            this._updateDataTransferTypeSet();
            for (var type in this._dataTransferTypeSet){
                if (type in this._locallySetTypes){
                    delete this._locallySetTypes[type];
                }
            }
            action.call(target);
        }finally{
            this._locallySetTypes = locallySetTypes;
            this.dataTransfer = null;
        }
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
        this._locallySetTypes[type] = true;
        this._updateDataTransferStringForType(type);
    },

    addStringForType: function(str, type){
        UIHTMLDataTransferPasteboard.$super.addStringForType.call(this, str, type);
        this._locallySetTypes[type] = true;
        this._updateDataTransferStringForType(type);
    },

    _updateDataTransferStringForType: function(type){
        var combinedString = this.stringsForType(type).join('\n');
        if (this._dataTransfer !== null){
            try{
                this._dataTransfer.setData(type, combinedString);
            }catch (e){
                if (type == 'text/plain'){
                    this._dataTransfer.setData('Text', combinedString);
                }else if (type == 'text/uri-list'){
                    this._dataTransfer.setData('Url', combinedString);
                }else{
                    throw e;
                }
            }
        }else if (navigator.clipboard){
            navigator.clipboard.writeText(combinedString).catch(function(e){
                logger.warn("Failed to write to clipboard: %{error}", e);
            });
        }
    },

    stringsForType: function(type){
        if (type in this._locallySetTypes){
            return UIHTMLDataTransferPasteboard.$super.stringsForType.call(this, type);
        }
        if (this._dataTransfer !== null){
            this._updateDataTransferTypeSet();
            if (type in this._dataTransferTypeSet){
                var combinedString = null;
                try {
                    combinedString = this._dataTransfer.getData(type);
                }catch (e){
                    if (type == 'text/plain'){
                        combinedString = this._dataTransfer.getData('Text');
                    }else if (type == 'uri-list'){
                        combinedString = this._dataTransfer.getData('Url');
                    }else{
                        throw e;
                    }
                }
                if (combinedString !== null){
                    return [combinedString];
                }
            }
        }
        return [];
    },

    setDataForType: function(data, type){
        UIHTMLDataTransferPasteboard.$super.setDataForType.call(this, data, type);
        this._locallySetTypes[type] = true;
        this._updateDataTransferDataForType(type);
    },

    addDataForType: function(data, type){
        UIHTMLDataTransferPasteboard.$super.addDataForType.call(this, data, type);
        this._locallySetTypes[type] = true;
        this._updateDataTransferDataForType(type);
    },

    _updateDataTransferDataForType: function(type){
        if (this._dataTransfer !== null){
            var dataList = this.dataListForType(type);
            var base64List = [];
            for (var i = 0, l = dataList.length; i < l; ++i){
                base64List.push(dataList[i].base64StringRepresentation());
            }
            this._dataTransfer.setData(type, base64List);
        }
    },

    dataListForType: function(type){
        if (type in this._locallySetTypes){
            return UIHTMLDataTransferPasteboard.$super.dataListForType.call(this, type);
        }
        if (this._dataTransfer !== null){
            this._updateDataTransferTypeSet();
            if (type in this._dataTransferTypeSet){
                var base64List = this._dataTransfer.getData(type);
                var dataList = [];
                for (var i = 0, l = base64List.length; i < l; ++i){
                    dataList.push(base64List[i].dataByDecodingBase64());
                }
                return dataList;
            }
        }
        return [];
    },

    setObjectForType: function(obj, type){
        UIHTMLDataTransferPasteboard.$super.setObjectForType.call(this, obj, type);
        this._locallySetTypes[type] = true;
        this._updateDataTranserObjectForType(type);
    },

    addObjectForType: function(obj, type){
        UIHTMLDataTransferPasteboard.$super.addObjectForType.call(this, obj, type);
        this._locallySetTypes[type] = true;
        this._updateDataTranserObjectForType(type);
    },

    _updateDataTranserObjectForType: function(type){
        if (this._dataTransfer !== null){
            var objects = this.objectsForType(type);
            var json = JSON.stringify(objects);
            this._dataTransfer.setData(type, json);
        }
    },

    objectsForType: function(type){
        if (type in this._locallySetTypes){
            return UIHTMLDataTransferPasteboard.$super.objectsForType.call(this, type);
        }
        if (this._dataTransfer !== null){
            this._updateDataTransferTypeSet();
            if (type in this._dataTransferTypeSet){
                var json = this._dataTransfer.getData(type);
                if (json){
                    return JSON.parse(json);
                }
            }
        }
        return [];
    },

    addFile: function(file){
        var htmlFile = null;
        if (this._dataTransfer !== null && this._dataTransfer.items){
            if (file.isKindOfClass(JSHTMLFile)){
                htmlFile = file._blob;
            }else if (file.isKindOfClass(JSDataFile)){
                var args = {};
                if (file.contentType !== null){
                    args.type = file.contentType.mime;
                }
                htmlFile = new File(file._data, file.name, args);
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

    getFileEnumerator: function(){
        return UIHTMLDataTransferFileEnumerator.initWithDataTransfer(this.dataTransfer, this._extraFiles);
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
    },
});


JSClass("UIHTMLDataTransferFileEnumerator", JSFileEnumerator, {

    dataTransfer: null,
    extraFiles: null,
    itemIndex: null,
    fileIndex: null,
    extraIndex: null,
    _childEnumerator: null,

    initWithDataTransfer: function(dataTransfer, extraFiles){
        this.dataTransfer = dataTransfer;
        this.extraFiles = extraFiles;
        if (this.dataTransfer.items && (this.dataTransfer.items.length === 0 || this.dataTransfer.items[0].getAsFile)){
            Object.defineProperty(this, 'next', {configurable: true, value: this.nextItem});
            this.itemIndex = 0;
        }else{
            Object.defineProperty(this, 'next', {configurable: true, value: this.nextFile});
            this.fileIndex = 0;
        }
        this.extraIndex = 0;
    },

    nextFile: function(callback, target){
        var file;
        if (this.fileIndex < this.dataTransfer.files.length){
            var htmlFile = this.dataTransfer.files[this.fileIndex];
            ++this.fileIndex;
            file = JSHTMLFile.initWithFile(htmlFile);
            callback.call(target, '', file);
        }else if (this.extraIndex < this.extraFiles.length){
            file = this.extraFiles[this.extraIndex];
            ++this.extraIndex;
            callback.call(target, '', file);
        }else{
            callback.call(target, null, null);
        }
    },

    nextItem: function(callback, target){
        var file;
        if (this._childEnumerator !== null){
            this._childEnumerator.next(function(directory, file){
                if (file === null){
                    this._childEnumerator = null;
                    this.next(callback, target);
                }else{
                    callback.call(target, directory, file);
                }
            }, this);
        }else if (this.itemIndex < this.dataTransfer.items.length){
            var item = this.dataTransfer.items[this.itemIndex];
            ++this.itemIndex;
            var htmlEntry = null;
            var htmlFile = null;
            var self = this;
            if (item.getAsEntry){
                htmlEntry = item.getAsEntry();
            }else if (item.webkitGetAsEntry){
                htmlEntry = item.webkitGetAsEntry();
            }
            if (item.getAsFile){
                htmlFile = item.getAsFile();
            }
            if (htmlEntry && htmlEntry.isDirectory){
                var reader = htmlEntry.createReader();
                reader.readEntries(function UIHTMLDataTransferFileEnumerater_nextItem_readEntries_success(htmlEntries){
                    self._childEnumerator = JSHTMLFileSystemEntryFileEnumerator.initWithHTMLEntries(htmlEntries, htmlEntry.fullPath.substr(1) + '/');
                    self.next(callback, target);
                }, function UIHTMLDataTransferFileEnumerater_nextItem_readEntries_error(error){
                    self.next(callback, target);
                });
            }else if (htmlEntry && htmlEntry.isFile && !htmlFile){
                htmlEntry.file(function UIHTMLDataTransferFileEnumerater_nextItem_file_success(htmlFile){
                    var file = JSHTMLFile.initWithFile(htmlFile);
                    callback.call(target, '', file);
                }, function UIHTMLDataTransferFileEnumerater_nextItem_file_error(error){
                    self.next(callback, target);
                });
            }else if (htmlFile){
                file = JSHTMLFile.initWithFile(htmlFile);
                callback.call(target, '', file);
            }else{
                this.next(callback, target);
            }
        }else if (this.extraIndex < this.extraFiles.length){
            file = this.extraFiles[this.extraIndex];
            ++this.extraIndex;
            callback.call(target, '', file);
        }else{
            callback.call(target, null, null);
        }
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