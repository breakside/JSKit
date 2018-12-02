// #import "UIKit/UIView.js"
// #import "UIKit/UIApplication.js"
// #import "UIKit/UITouch.js"
// #import "UIKit/UIButton.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
// #import "UIKit/UIToolbar.js"
// #import "UIKit/UIToolbarItem.js"
// #import "UIKit/UIViewPropertyAnimator.js"
/* global JSClass, JSObject, JSGradient, JSTimer, UIView, JSColor, JSBundle, JSImage, JSUserDefaults, JSFont, UIImageView, UILabel, JSSize, JSRect, JSInsets, JSDynamicProperty, JSReadOnlyProperty, UIWindow, UIWindowStyler, UIWindowDefaultStyler, UIWindowCustomStyler, UIControl, UIButton, UIButtonCustomStyler, JSPoint, UIApplication, UIEvent, UITouch, UIToolbar, UIToolbarView, UIToolbarItem, UIViewPropertyAnimator */
'use strict';

(function(){

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a Window

    init: function(){
        UIWindow.$super.init.call(this);
        this._application = UIApplication.shared;
        this._commonWindowInit();
    },

    initWithApplication: function(application){
        UIWindow.$super.init.call(this);
        this._application = application;
        this._commonWindowInit();
    },

    initWithStyler: function(styler){
        this._styler = styler;
        this.init();
    },

    initWithSpec: function(spec, values){
        UIWindow.$super.initWithSpec.call(this, spec, values);
        if ('contentViewController' in values){
            this.contentViewController = spec.resolvedValue(values.contentViewController, "UIViewController");
        }else if ('contentView' in values){
            this.contentView = spec.resolvedValue(values.contentView, "UIView");
        }
        if ('styler' in values){
            this._styler = spec.resolvedValue(values.styler);
        }
        this._application = UIApplication.shared;
        this._commonWindowInit();
        if ('contentInsets' in values){
            this._contentInsets = JSInsets.apply(undefined, values.contentInsets.parseNumberArray());
        }
        if ('showsContentSeparator' in values){
            this.showsContentSeparator = values.showsContentSeparator;
        }
        if ('isUserMovable' in values){
            this.isUserMovable = values.isUserMovable;
        }
        if ('isMovableByContent' in values){
            this.isMovableByContent = values.isMovableByContent;
        }
        if ('escapeClosesWindow' in values){
            this.escapeClosesWindow = values.escapeClosesWindow;
        }
        if ('firstResponder' in values){
            this._initialFirstResponder = spec.resolvedValue(values.firstResponder);
        }
        if ('heightTracksContent' in values){
            this._heightTracksContent = values.heightTracksContent;
        }
        if ('widthTracksContent' in values){
            this._widthTracksContent = values.widthTracksContent;
        }
        if ('title' in values){
            this.title = spec.resolvedValue(values.title);
        }
        if ('icon' in values){
            this.icon = JSImage.initWithResourceName(spec.resolvedValue(values.icon));
        }
        if ('autosaveName' in values){
            this.autosaveName = spec.resolvedValue(values.autosaveName);
        }
        if ('toolbar' in values){
            this._toolbar = spec.resolvedValue(values.toolbar, "UIToolbar");
            this._toolbar.window = this;
        }
    },

    _commonWindowInit: function(){
        this.window = this;
        if (this.backgroundColor === null){
            this.backgroundColor = JSColor.whiteColor;
        }
        this.clipsToBounds = true;
        if (this._contentView === null){
            this.contentView = UIView.init();
        }
        if (this._contentInsets === null){
            this._contentInsets = JSInsets.Zero;
        }
        if (this._styler === null){
            if (this.level == UIWindow.Level.back){
                this._styler = UIWindow.Styler.custom;
            }else{
                this._styler = UIWindow.Styler.default;
            }
        }
        this.stylerProperties = {};
        this._styler.initializeWindow(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Styler

    _styler: null,
    stylerProperties: null,

    // -------------------------------------------------------------------------
    // MARK: - Controls

    title: JSDynamicProperty('_title', null),
    icon: JSDynamicProperty('_icon', null),
    allowsClose: JSDynamicProperty('_allowsClose', true),

    setTitle: function(title){
        this._title = title;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    setIcon: function(icon){
        this._icon = icon;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    setAllowsClose: function(allowsClose){
        this._allowsClose = allowsClose;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Toolbar

    toolbar: JSDynamicProperty('_toolbar', null),

    setToolbar: function(toolbar){
        if (this._toolbar !== null){
            this._toolbar.window = null;
        }
        this._toolbar = toolbar;
        if (this._toolbar !== null){
            this._toolbar.window = this;
        }
        this._styler.updateWindow();
        this.seetNeedsLayout();
    },

    _validateToolbar: function(){
        if (this._toolbar === null){
            return;
        }
        this._toolbar.validateItems();
        // TODO: update items, if needed
    },

    // -------------------------------------------------------------------------
    // MARK: - Content View

    showsContentSeparator: JSDynamicProperty('_showsContentSeparator', false),
    contentViewController: JSDynamicProperty('_contentViewController', null),
    contentView: JSDynamicProperty('_contentView', null),
    contentInsets: JSDynamicProperty('_contentInsets', null),

    setContentView: function(contentView){
        if (contentView === null){
            contentView = UIView.init();
        }
        if (this._contentView !== null){
            this._contentView.removeFromSuperview();
        }
        this._contentView = contentView;
        this._contentViewController = null;
        if (this._contentView !== null){
            this.addSubview(this._contentView);
        }
        this.setNeedsLayout();
    },

    setContentViewController: function(contentViewController){
        if (this._contentViewController !== null && this._contentViewControllerHasAppeared){
            this._contentViewController.viewWillDisappear();
        }
        this.contentView = contentViewController.view;
        if (this._contentViewController !== null && this._contentViewControllerHasAppeared){
            this._contentViewController.viewDidDisappear();
        }
        this._contentViewController = contentViewController;
    },

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this.setNeedsLayout();
    },

    setShowsContentSeparator: function(showsContentSeparator){
        this._showsContentSeparator = showsContentSeparator;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    heightTracksContent: JSDynamicProperty('_heightTracksContent', false),
    widthTracksContent: JSDynamicProperty('_widthTracksContent', false),

    setHeightTracksContent: function(heightTracksContent){
        this._heightTracksContent = heightTracksContent;
        this.setNeedsLayout();
    },

    setWidthTracksContent: function(widthTracksContent){
        this._widthTracksContent = widthTracksContent;
        this.setNeedsLayout();
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    sizeToFit: function(){
        if (this._widthTracksContent || this._heightTracksContent){
            var size = JSSize(Number.MAX_VALUE, Number.MAX_VALUE);
            if (!this._widthTracksContent){
                size.width = this.bounds.size.width - this._contentInsets.left - this._contentInsets.right;
            }
            if (!this._heightTracksContent){
                size.height = this.bounds.size.height - this._contentInsets.top - this._contentInsets.bottom;
            }
            var fitSize;
            if (this.viewController){
                fitSize = this.viewController.contentSizeThatFitsSize(size);
            }else if (this._contentViewController){
                fitSize = this._contentViewController.contentSizeThatFitsSize(size);
            }else{
                this._contentView.sizeToFitSize(size);
                fitSize = this._contentView.frame.size;
            }

            this.bounds = JSRect(
                0,
                0,
                fitSize.width + this._contentInsets.left + this._contentInsets.right,
                fitSize.height + this._contentInsets.top + this._contentInsets.bottom
            );
        }
    },

    layoutSubviews: function(){
        UIWindow.$super.layoutSubviews.call(this);
        this._styler.layoutWindow(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Main Window

    canBecomeMainWindow: function(){
        return true;
    },

    makeMain: function(){
        this.windowServer.makeWindowMain(this);
    },

    becomeMain: function(){
        this._styler.updateWindow(this);
        this._validateToolbar();
    },

    resignMain: function(){
        this._styler.updateWindow(this);
    },

    isMainWindow: JSReadOnlyProperty(),

    getIsMainWindow: function(){
        return this.windowServer.mainWindow === this;
    },

    // -------------------------------------------------------------------------
    // MARK: - Key Window

    canBecomeKeyWindow: function(){
        return true;
    },

    makeKey: function(){
        this.windowServer.makeWindowKey(this);
    },

    becomeKey: function(){
        this._styler.updateWindow(this);
        this.contentView.windowDidChangeKeyStatus();
        this._validateToolbar();
    },

    resignKey: function(){
        this._styler.updateWindow(this);
        this.contentView.windowDidChangeKeyStatus();
    },

    isKeyWindow: JSReadOnlyProperty(),

    getIsKeyWindow: function(){
        return this.windowServer.keyWindow === this;
    },

    makeKeyAndOrderFront: function(){
        this.orderFront();
        this.windowServer.makeWindowKey(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Opening & Closing

    escapeClosesWindow: false,
    openAnimator: null,
    closeAnimator: null,
    _isOpen: false,

    open: function(){
        this.orderFront();
    },

    close: function(){
        if (this.viewController){
            this.viewController.viewWillDisappear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewWillDisappear(false);
        }
        if (this.closeAnimator !== null){
            var self = this;
            this.closeAnimator.addCompletion(function(){
                self.windowServer.windowRemoved(self);
            });
            this.closeAnimator.start();
        }else{
            this.windowServer.windowRemoved(this);
        }
    },

    orderFront: function(){
        if (this._parent && this._parent.modal === this){
            this._parent.orderFront();
        }
        if (!this._isOpen){
            if (this.viewController){
                this.viewController.viewWillAppear(false);
            }else if (this._contentViewController){
                this._contentViewController.viewWillAppear(false);
            }
        }
        this.windowServer.orderWindowFront(this);
        if (!this._isOpen){
            this._isOpen = true;
            if (this.openAnimator !== null){
                this.openAnimator.start();
            }
        }
    },

    didBecomeVisible: function(){
        if (this.viewController){
            this.viewController.viewDidAppear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewDidAppear(false);
        }
        if (this._initialFirstResponder !== null){
            var responder = this._initialFirstResponder;
            this._initialFirstResponder = null;
            this.setFirstResponder(responder);
        }
    },

    didClose: function(){
        if (this.viewController){
            this.viewController.viewDidDisappear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewDidDisappear(false);
        }
        if (this._parent){
            this._parent._modal = null;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Window Server

    windowServer: JSReadOnlyProperty(),
    application: JSReadOnlyProperty('_application', null),
    scene: JSReadOnlyProperty('_scene', null),
    screen: JSReadOnlyProperty('_screen', null),
    level: 0,

    getWindowServer: function(){
        if (this._application !== null){
            return this._application.windowServer;
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Modal

    modal: JSDynamicProperty('_modal', null),
    parent: JSReadOnlyProperty('_parent'),

    setModal: function(modal){
        if (this._modal !== null){
            this._modal.modal = modal;
        }else{
            this._modal = modal;
            this._modal._parent = this;
        }
    },

    _modalAnimator: null,

    indicateModalStatus: function(){
        if (this._modalAnimator !== null){
            return;
        }
        var window = this;
        var alpha = this.alpha;
        window._modalAnimator = UIViewPropertyAnimator.initWithDuration(0.05);
        window._modalAnimator.addAnimations(function(){
            window.alpha = alpha * 0.8;
        });
        window._modalAnimator.addCompletion(function(){
            window._modalAnimator = UIViewPropertyAnimator.initWithDuration(0.05);
            window._modalAnimator.addAnimations(function(){
                window.alpha = alpha;
            });
            window._modalAnimator.addCompletion(function(){
                window._modalAnimator = UIViewPropertyAnimator.initWithDuration(0.05);
                window._modalAnimator.addAnimations(function(){
                    window.alpha = alpha * 0.8;
                });
                window._modalAnimator.addCompletion(function(){
                    window._modalAnimator = UIViewPropertyAnimator.initWithDuration(0.05);
                    window._modalAnimator.addAnimations(function(){
                        window.alpha = alpha;
                    });
                    window._modalAnimator.addCompletion(function(){
                        window._modalAnimator = null;
                    });
                    window._modalAnimator.start();
                });
                window._modalAnimator.start();
            });
            window._modalAnimator.start();
        });
        window._modalAnimator.start();
    },

    // -------------------------------------------------------------------------
    // MARK: - Events

    isUserMovable: true,
    isMovableByContent: true,
    _downLocation: null,
    _downOrigin: null,
    _isMoving: false,
    _didMove: false,

    mouseDown: function(event){
        // this.setFirstResponder(null);
        if (this.level == UIWindow.Level.normal && this.isUserMovable){
            var contentLocation = event.locationInView(this.contentView);
            if (this.containsPoint(event.locationInWindow) && (this.isMovableByContent || !this.contentView.containsPoint(contentLocation))){
                this._downLocation = this.convertPointToScreen(event.locationInWindow);
                this._downOrigin = JSPoint(this.frame.origin);
                this._isMoving = true;
            }else{
                UIWindow.$super.mouseDown.call(this, event);
            }
        }else{
            UIWindow.$super.mouseDown.call(this, event);
        }
    },

    mouseDragged: function(event){
        if (!this._isMoving){
            UIWindow.$super.mouseDragged.call(this, event);
            return;
        }
        this._didMove = true;
        var location = this.convertPointToScreen(event.locationInWindow);
        var d = JSPoint(location.x - this._downLocation.x, location.y - this._downLocation.y);
        var origin = JSPoint(this._downOrigin.x + d.x, this._downOrigin.y + d.y);
        var safeArea = this.screen.availableFrame;
        var over = JSPoint(origin.x - safeArea.origin.x - safeArea.size.width, origin.y - safeArea.origin.y - safeArea.size.height);
        if (over.x > 0){
            origin.x -= over.x;
        }
        if (over.y > 0){
            origin.y -= over.y;
        }
        if (origin.y < safeArea.origin.y){
            origin.y = safeArea.origin.y;
        }
        this.frame = JSRect(origin, this.frame.size);
    },

    mouseUp: function(){
        if (this._isMoving){
            this._isMoving = false;
            if (this._didMove){
                this._didMove = false;
                this._autosaveToUserDefaults();
            }
        }
        this._downLocation = null;
        this._downOrigin = null;
    },

    keyDown: function(event){
        if (this.escapeClosesWindow && event.key == UIEvent.Key.escape){
            this.close();
        }else{
            UIWindow.$super.keyDown.call(this, event);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - First Responder

    firstResponder: JSDynamicProperty('_firstResponder', null),
    _initialFirstResponder: null,

    canBecomeFirstResponder: function(){
        return true;
    },

    getFirstResponder: function(){
        return this._firstResponder;
    },

    setFirstResponder: function(responder){
        if (responder !== this._firstResponder){
            var previousResponder = this._firstResponder;
            var didResignResponder = true;
            if (previousResponder !== null){
                if (previousResponder.canResignFirstResponder()){
                    this._firstResponder = null;
                    previousResponder.resignFirstResponder();
                    didResignResponder = true;
                }else{
                    didResignResponder = false;
                }
            }
            if (didResignResponder && responder !== null){
                if (responder.canBecomeFirstResponder()){
                    this._firstResponder = responder;
                    responder.becomeFirstResponder();
                }
            }
            if (this._firstResponder !== previousResponder){
                this._validateToolbar();
                this.windowServer.windowDidChangeResponder(this);
            }
        }
    },

    getNextResponder: function(){
        if (this.viewController !== null){
            return this.viewController;
        }
        return this._application;
    },

    // -------------------------------------------------------------------------
    // MARK: - Key View Loop

    setFirstResponderToKeyViewAfterView: function(view){
        var nextKeyView = view.nextValidKeyView;
        if (nextKeyView !== null){
            this.firstResponder = nextKeyView;
        }
    },

    setFirstResponderToKeyViewBeforeView: function(view){
        var prevousKeyView = view.previousValidKeyView;
        if (prevousKeyView !== null){
            this.firstResponder = prevousKeyView;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate Space Conversions

    convertPointFromScreen: function(point){
        if (this._screen === null){
            return null;
        }
        return this.layer._convertPointFromSuperlayer(JSPoint(point.x - this._screen.frame.origin.x, point.y - this.screen.frame.origin.y));
    },

    convertPointToScreen: function(point){
        if (this._screen === null){
            return null;
        }
        point = this.layer._convertPointToSuperlayer(point);
        return JSPoint(point.x + this._screen.frame.origin.x, point.y + this._screen.frame.origin.y);
    },

    convertRectFromScreen: function(rect){
        if (this._screen === null){
            return null;
        }
        return JSRect(this.convertPointFromScreen(rect.origin), rect.size);
    },

    convertRectToScreen: function(rect){
        if (this._screen === null){
            return null;
        }
        return JSRect(this.convertPointToScreen(rect.origin), rect.size);
    },

    // -------------------------------------------------------------------------
    // MARK: - Event Dispatch

    receivesAllEvents: false,

    sendEvent: function(event){
        switch (event.category){
            case UIEvent.Category.mouse:
                this._sendMouseEvent(event);
                break;
            case UIEvent.Category.key:
                this._sendKeyEvent(event);
                break;
            case UIEvent.Category.touches:
                this._sendTouchEvent(event);
                break;
            case UIEvent.Category.scroll:
                this._sendScrollEvent(event);
                break;
            case UIEvent.Category.gesture:
                this._sendGestureEvent(event);
                break;
        }
    },

    adoptMouseEvents: function(fromWindow){
        this.mouseEventView = this;
        this.mouseDownType = fromWindow.mouseDownType;
    },

    cancelMouseEvents: function(){
        this.mouseEventView = null;
        this.mouseDownType = null;
    },

    shouldReceiveTrackingInBack: false,

    mouseEventView: null,
    mouseDownType: null,

    _sendMouseEvent: function(event){
        var modal = this._modal;
        while (modal !== null && modal._modal !== null){
            modal = modal._modal;
        }
        if (modal !== null){
            modal.makeKeyAndOrderFront();
            modal.indicateModalStatus();
            return;
        }
        if (this.mouseEventView === null && event.type == UIEvent.Type.leftMouseDown || event.type == UIEvent.Type.rightMouseDown){
            this.mouseEventView = this.hitTest(event.locationInWindow);
            if (this.receivesAllEvents && this.mouseEventView === null){
                this.mouseEventView = this;
            }
            this.mouseDownType = event.type;
        }
        var eventTarget = event.trackingView || this.mouseEventView;
        if (eventTarget === null){
            return;
        }
        switch (event.type){
            case UIEvent.Type.leftMouseDown:
                this.makeKeyAndOrderFront();
                eventTarget.mouseDown(event);
                this._validateToolbar();
                break;
            case UIEvent.Type.leftMouseUp:
                eventTarget.mouseUp(event);
                if (this.mouseDownType == UIEvent.Type.leftMouseDown){
                    this.mouseEventView = null;
                }
                this._validateToolbar();
                break;
            case UIEvent.Type.leftMouseDragged:
                eventTarget.mouseDragged(event);
                break;
            case UIEvent.Type.rightMouseDown:
                eventTarget.rightMouseDown(event);
                this._validateToolbar();
                break;
            case UIEvent.Type.rightMouseUp:
                eventTarget.rightMouseUp(event);
                if (this.mouseDownType == UIEvent.Type.rightMouseDown){
                    this.mouseEventView = null;
                }
                this._validateToolbar();
                break;
            case UIEvent.Type.rightMouseDragged:
                eventTarget.rightMouseDragged(event);
                break;
            case UIEvent.Type.mouseEntered:
                eventTarget.mouseEntered(event);
                break;
            case UIEvent.Type.mouseExited:
                eventTarget.mouseExited(event);
                break;
            case UIEvent.Type.mouseMoved:
                eventTarget.mouseMoved(event);
                break;
        }

    },

    _sendScrollEvent: function(event){
        var view = this.hitTest(event.locationInWindow);
        if (view){
            switch (event.type){
                case UIEvent.Type.scrollWheel:
                    view.scrollWheel(event);
                    break;
            }
        }
    },

    _sendGestureEvent: function(event){
        if (this._modal !== null){
            return;
        }
        var view = this.hitTest(event.locationInWindow);
        if (view){
            switch (event.type){
                case UIEvent.Type.magnify:
                    view.magnify(event);
                    break;
                case UIEvent.Type.rotate:
                    view.rotate(event);
                    break;
            }
        }
    },

    _sendTouchEvent: function(event){
        if (this._modal !== null){
            return;
        }
        var touches = event.touchesInWindow(this);
        var touchesByView = {};
        var view;
        for (var i = 0, l = touches.length; i < l; ++i){
            // We only dispatch the touches that changed in this version of the event.
            // A view can get all the touches it wants from the event.
            if (touches[i].timestamp == event.timestamp){
                view = this.hitTest(touches[i].locationInWindow) || this;
                if (!touchesByView[view.objectID]){
                    touchesByView[view.objectID] = {view: view, touches: []};
                }
                touchesByView[view.objectID].touches.push(touches[i]);
            }
        }
        for (var id in touchesByView){
            view = touchesByView[id].view;
            touches = touchesByView[id].touches;
            if (!view.isMultipleTouchEnabled){
                touches = [touches[0]];
            }
            this._sendEventTouchesToView(event, touches, touchesByView[id].view);
        }
    },

    _sendEventTouchesToView: function(event, touches, view){
        var touchesByPhase = {};
        touchesByPhase[UITouch.Phase.began] = {method: 'touchesBegan', touches: []};
        touchesByPhase[UITouch.Phase.moved] = {method: 'touchesMoved', touches: []};
        touchesByPhase[UITouch.Phase.ended] = {method: 'touchesEnded', touches: []};
        touchesByPhase[UITouch.Phase.canceled] = {method: 'touchesCanceled', touches: []};
        for (var i = 0, l = touches.length; i < l; ++i){
            touchesByPhase[touches[i].phase].touches.push(touches[i]);
        }
        for (var phase in touchesByPhase){
            if (touchesByPhase[phase].touches.length > 0){
                view[touchesByPhase[phase].method](touchesByPhase[phase].touches, event);
            }
        }
    },

    _sendKeyEvent: function(event){
        var view = this._firstResponder || this;
        if (view){
            switch (event.type){
                case UIEvent.Type.keyDown:
                    view.keyDown(event);
                    break;
                case UIEvent.Type.keyUp:
                    view.keyUp(event);
                    if (this._toolbar !== null){
                        this._queueKeyEventToolbarUpdate();
                    }
                    break;
            }
        }
    },

    _keyEventToolbarValidationTimer: null,

    _queueKeyEventToolbarUpdate: function(){
        if (this._keyEventToolbarValidationTimer !== null){
            this._keyEventToolbarValidationTimer.invalidate();
        }
        this._keyEventToolbarValidationTimer = JSTimer.scheduledTimerWithInterval(0.5, function(){
            this._keyEventToolbarValidationTimer = null;
            this._validateToolbar();
        }, this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Autosaving

    isUsingAutosavedFrame: false,
    autosaveName: JSDynamicProperty('_autosaveName', null),

    setAutosaveName: function(autosaveName){
        this._autosaveName = autosaveName;
        this._loadAutosavedFromUserDefaults();
    },

    _autosaveToUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        JSUserDefaults.shared.setValueForKey({
            frame: [this.position.x - this.bounds.size.width * this.anchorPoint.x, this.position.y - this.bounds.size.height * this.anchorPoint.y, this.bounds.size.width, this.bounds.size.height]
        }, this._autosaveName);
    },

    _loadAutosavedFromUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        var values = JSUserDefaults.shared.valueForKey(this.autosaveName);
        if (values !== null){
            if ('frame' in values){
                this.frame = JSRect.apply(undefined, values.frame);
                this.isUsingAutosavedFrame = true;
            }
        }
    }

});

UIWindow.Level = {
    back: -1,
    normal: 0,
    front: 1,
};

UIWindow.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function UIWindow_getDefaultStyler(){
            var styler = UIWindowDefaultStyler.init();
            Object.defineProperty(this, 'default', {configurable: true, value: styler});
            return styler;
        },
        set: function UIWindow_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {configurable: true, value: styler});
        }
    },

    custom: {
        configurable: true,
        get: function UIWindow_getDefaultStyler(){
            var styler = UIWindowCustomStyler.init();
            Object.defineProperty(this, 'custom', {configurable: true, value: styler});
            return styler;
        },
    }

});

JSClass("UIRootWindow", UIWindow, {

    level: UIWindow.Level.back

});

JSClass("UIWindowStyler", JSObject, {

    toolbarTitleFont: null,
    toolbarTitleColor: null,
    toolbarDisabledTitleColor: null,
    toolbarInsets: null,
    toolbarItemSpacing: 7,

    init: function(){
        // Tests that use UIWindow, but don't set a system font, will have null for 
        // this.toolbarTitleFont.  We should probably fix this by always having
        // some kind of system font for test applications
        this.toolbarTitleFont = JSFont.systemFontOfSize(JSFont.Size.detail);
        if (this.toolbarTitleFont){
            this.toolbarTitleFont = this.toolbarTitleFont.fontWithWeight(JSFont.Weight.normal);
        }
        this.toolbarInsets = JSInsets(5);
        this.toolbarTitleColor = JSColor.blackColor;
        this.toolbarDisabledTitleColor = JSColor.initWithWhite(0.5);
    },

    initializeWindow: function(window){
    },

    updateWindow: function(window){
    },

    layoutWindow: function(window){
        window._contentView.frame = window.bounds.rectWithInsets(window._contentInsets);
    },

    layoutToolbarView: function(toolbarView){
        var toolbar = toolbarView.toolbar;
        var availableWidth = toolbarView.bounds.width - this.toolbarInsets.left - this.toolbarInsets.right;
        var x = this.toolbarInsets.left;
        var y = this.toolbarInsets.top;
        var maxHeight = toolbarView.bounds.size.height - this.toolbarInsets.top - this.toolbarInsets.bottom;

        // Get the minimum sizes of all items
        var itemSizes = [];
        var itemsWidth = 0;
        var itemViews = toolbarView.itemViews;
        var itemView;
        var size;
        var i, l;
        var item;
        for (i = 0, l = itemViews.length; i < l; ++i){
            itemView = itemViews[i];
            size = itemView.intrinsicSize;
            itemSizes.push(size);
            itemsWidth += size.width;
        }
        itemsWidth += (itemViews.length - 1) * this.toolbarItemSpacing;

        // Back up if we've overflowed the available width
        var lastVisibleIndex = itemViews.length - 1;
        if (itemsWidth > availableWidth){
            // position the overflow button
            toolbarView.overflowButton.hidden = false;
            size = toolbarView.overflowButton.intrinsicSize;
            toolbarView.overflowButton.frame = JSRect(toolbarView.bounds.width - this.toolbarInsets.right - size.width, y + (maxHeight - size.height) / 2.0, size.width, size.height);
            // reduce available width by overflow button width
            availableWidth -= toolbarView.overflowButton.frame.width;
            // Back up over any overflowing items
            for (; lastVisibleIndex >= 0 && itemsWidth > availableWidth; --lastVisibleIndex){
                size = itemSizes[lastVisibleIndex];
                itemsWidth -= size.width;
                if (lastVisibleIndex > 0){
                    itemsWidth -= this.toolbarItemSpacing;
                }
            }
        }else{
            if (toolbarView._overflowButton !== null){
                toolbarView._overflowButton.hidden = true;
            }
        }

        toolbarView.createOverflowMenuAtItemIndex(lastVisibleIndex + 1);

        // TODO: distribute extra space across flexible items
        var extraSpace = availableWidth - itemsWidth;

        // Position each item, centered vertically in the middle
        for (i = 0, l = itemViews.length; i <= lastVisibleIndex; ++i){
            itemView = itemViews[i];
            itemView.hidden = false;
            item = itemView.item;
            size = itemSizes[i];
            if (item.view !== null){
                size.height = item.minimumSize.height;
            }else{
                size.height = toolbar.imageSize;
            }
            itemView.frame = JSRect(x, y + (maxHeight - size.height) / 2.0, size.width, size.height);
            x += size.width + this.toolbarItemSpacing;
        }
        for (i = lastVisibleIndex + 1; i < itemView.length; ++i){
            itemView = itemViews[i];
            itemView.hidden = true;
        }
    },

    layoutToolbarItemView: function(itemView){
        var item = itemView.item;
        var toolbar = item.toolbar;
        var toolbarView = itemView.superview;
        if (item.identifier == UIToolbarItem.Identifier.custom && toolbar.showsTitles){
            var titleHeight = this.toolbarTitleFont.displayLineHeight;
            var width;
            if (item.view !== null){
                width = item.minimumSize.width;
            }else{
                width = item.image.size.width * toolbar.imageSize / item.image.size.height;
            }
            itemView.contentView.frame = JSRect((itemView.bounds.size.width - width) / 2.0, 0, width, itemView.bounds.size.height - titleHeight);
            itemView.titleLabel.frame = JSRect(0, itemView.bounds.size.height - titleHeight, itemView.bounds.size.width, titleHeight);
        }else{
            itemView.contentView.frame = itemView.bounds;
        }
    },

    updateToolbarItemView: function(itemView){
        var item = itemView.item;
        var toolbar = item.toolbar;
        if (item.view === null){
            if (item.enabled){
                itemView.contentView.alpha = 1.0;
            }else{
                itemView.contentView.alpha = 0.4;
            }
        }
        if (toolbar.showsTitles){
            item.titleLabel.text = item.title;
        }
    },

    heightOfToolbarView: function(toolbarView){
        var h = toolbarView._minimumItemsSize.height; 
        h += this.toolbarInsets.top + this.toolbarInsets.bottom;
        if (toolbarView.toolbar.showsTitles){
            h += this.toolbarTitleFont.displayLineHeight;
        }
        return h;
    }

});

JSClass("UIWindowDefaultStyler", UIWindowStyler, {

    _titlebarSize: 22,
    _controlButtonSize: 12,
    _iconSize: 16,
    _iconTitleSpacing: 5,
    activeTitleColor: null,
    inactiveTitleColor: null,
    shadowRadius: 40,
    cornerRadius: 6,
    backgroundColor: null,
    shadowColor: null,
    titleBackgroundColor: null,
    titleBackgroundGradient: null,
    contentSeparatorColor: null,
    contentSeparatorSize: 1,
    closeButtonImages: null,

    init: function(){
        UIWindowDefaultStyler.$super.init.call(this);
        this.activeTitleColor = JSColor.initWithWhite(51/255);
        this.inactiveTitleColor = JSColor.initWithWhite(192/255);
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.4);
        this.backgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255,1);
        this.titleBackgroundColor = null;
        this.titleBackgroundGradient = JSGradient.initWithStops(
            0, JSColor.initWithRGBA(230/255,230/255,230/255,1),
            1, JSColor.initWithRGBA(204/255,204/255,204/255,1)
        );
        this.contentSeparatorColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        this.closeButtonImages = {
            inactive: images.closeInactive,
            normal: images.closeNormal,
            over: images.closeOver,
            active: images.closeActive
        };
        this.toolbarTitleColor = JSColor.initWithWhite(102/255);
        this.toolbarDisabledTitleColor = JSColor.initWithWhite(204/255);
    },

    initializeWindow: function(window){
        var closeButton = UIButton.initWithStyler(UIButton.Styler.custom);
        closeButton.imageRenderMode = UIImageView.RenderMode.original;
        closeButton.setImageForState(this.closeButtonImages.normal, UIControl.State.normal);
        closeButton.setImageForState(this.closeButtonImages.over, UIControl.State.over);
        closeButton.setImageForState(this.closeButtonImages.active, UIControl.State.active);
        closeButton.addTargetedAction(window, window.close);

        var titleBacking = UIView.init();
        titleBacking.borderWidth = 1;
        titleBacking.maskedBorders = UIView.Sides.minY;
        titleBacking.borderColor = JSColor.initWithWhite(1, 0.05);

        var titleLabel = UILabel.init();
        titleLabel.font = titleLabel.font.fontWithWeight(JSFont.Weight.regular);

        var titleBar = UIView.init();

        titleBar.addSubview(closeButton);
        titleBar.addSubview(titleLabel);
        window.addSubview(titleBacking);
        titleBacking.addSubview(titleBar);

        window.stylerProperties.titleBacking = titleBacking;
        window.stylerProperties.closeButton = closeButton;
        window.stylerProperties.titleBar = titleBar;
        window.stylerProperties.titleLabel = titleLabel;
        window.stylerProperties.iconView = null;
        window.stylerProperties.toolbarView = null;
        window.stylerProperties.contentSeparatorView = null;

        window.shadowColor = this.shadowColor;
        window.shadowRadius = this.shadowRadius;
        window.cornerRadius = this.cornerRadius;
        window.backgroundColor = this.backgroundColor;

        this.updateWindow(window);
    },

    layoutWindow: function(window){
        UIWindowDefaultStyler.$super.layoutWindow.call(this, window);
        var controlPadding = (this._titlebarSize - this._controlButtonSize) / 2;
        var iconPadding = (this._titlebarSize - this._iconSize) / 2;
        var titleBacking = window.stylerProperties.titleBacking;
        var titleBar = window.stylerProperties.titleBar;
        var closeButton = window.stylerProperties.closeButton;
        var titleLabel = window.stylerProperties.titleLabel;
        var iconView = window.stylerProperties.iconView;
        var toolbarView = window.stylerProperties.toolbarView;
        var contentSeparatorView = window.stylerProperties.contentSeparatorView;
        var bounds = window.bounds;

        // Title bar
        var y = 0;
        titleBar.frame = JSRect(0, y, bounds.size.width, this._titlebarSize);
        y += this._titlebarSize;
        closeButton.frame = JSRect(controlPadding, controlPadding, this._controlButtonSize, this._controlButtonSize);
        titleLabel.sizeToFit();
        var minX = closeButton.frame.origin.x + closeButton.frame.size.width + controlPadding;
        var maxX = titleBar.bounds.size.width - controlPadding;
        var available = maxX - minX;
        var titleWidth = titleLabel.frame.size.width;
        var iconWidth = 0;
        if (iconView && !iconView.hidden){
            iconWidth = this._iconSize + this._iconTitleSpacing;
        }
        if (titleWidth + iconWidth > available){
            titleLabel.bounds.size = JSSize(Math.max(0, available - iconWidth), titleLabel.bounds.size.height);
        }
        var centerX = titleBar.bounds.size.width / 2;
        var shiftX = minX - (centerX - (titleWidth + iconWidth) / 2);
        if (shiftX > 0){
            centerX += shiftX;
        }
        if (iconView){
            iconView.frame = JSRect(centerX - (titleWidth + iconWidth) / 2, iconPadding, this._iconSize, this._iconSize);
        }
        titleLabel.position = JSPoint(centerX + iconWidth / 2, titleBar.bounds.size.height / 2);

        // Toolbar
        if (toolbarView){
            toolbarView.frame = JSRect(0, y, bounds.size.width, this.heightOfToolbarView(toolbarView));
            y += toolbarView.frame.size.height;
        }

        if (contentSeparatorView){
            contentSeparatorView.frame = JSRect(0, y - this.contentSeparatorSize, bounds.size.width, this.contentSeparatorSize);
        }

        titleBacking.frame = JSRect(0, 0, bounds.size.width, y);
    },

    updateWindow: function(window){
        var titleBacking = window.stylerProperties.titleBacking;
        var closeButton = window.stylerProperties.closeButton;
        var iconView = window.stylerProperties.iconView;
        var titleLabel = window.stylerProperties.titleLabel;
        var titleBar = window.stylerProperties.titleBar;
        closeButton.hidden = !window.allowsClose;
        
        titleLabel.text = window.title || '';

        if (window.icon){
            if (!iconView){
                iconView = UIImageView.initWithRenderMode(UIImageView.RenderMode.template);
                titleBar.insertSubviewBelowSibling(iconView, titleLabel);
                window.stylerProperties.iconView = iconView;
            }
            iconView.image = window.icon;
            iconView.hidden = false;
        }else if (iconView){
            iconView.icon = null;
            iconView.hidden = true;
        }

        if (window.isMainWindow || window.isKeyWindow){
            if (iconView){
                iconView.templateColor = this.activeTitleColor;
            }
            titleLabel.textColor = this.activeTitleColor;
        }else{
            if (iconView){
                iconView.templateColor = this.inactiveTitleColor;
            }
            titleLabel.textColor = this.inactiveTitleColor;
        }
        if (window.isMainWindow){
            closeButton.setImageForState(this.closeButtonImages.normal, UIControl.State.normal);
        }else{
            closeButton.setImageForState(this.closeButtonImages.inactive, UIControl.State.normal);
        }

        if (window.toolbar){
            if (!window.stylerProperties.toolbarView){
                window.stylerProperties.toolbarView = UIToolbarView.initWithToolbar(window.toolbar);
                titleBacking.insertSubviewAboveSibling(window.stylerProperties.toolbarView, titleBar);
            }
        }else{
            if (window.stylerProperties.toolbarView){
                window.stylerProperties.toolbarView.removeFromSuperview();
                window.stylerProperties.toolbarView = null;
            }
        }

        if (window.showsContentSeparator){
            if (!window.stylerProperties.contentSeparatorView){
                window.stylerProperties.contentSeparatorView = UIView.init();
                window.stylerProperties.contentSeparatorView.backgroundColor = this.contentSeparatorColor;
                titleBacking.addSubview(window.stylerProperties.contentSeparatorView);
            }
            titleBacking.backgroundColor = this.titleBackgroundColor;
            titleBacking.backgroundGradient = this.titleBackgroundGradient;
        }else{
            if (window.stylerProperties.contentSeparatorView){
                window.stylerProperties.contentSeparatorView.removeFromSuperview();
                window.stylerProperties.contentSeparatorView = null;
            }
            titleBacking.backgroundColor = null;
            titleBacking.backgroundGradient = null;
        }

        var topSize = this._titlebarSize;
        if (window.toolbar){
            topSize += this.heightOfToolbarView(window.stylerProperties.toolbarView);
        }
        window.contentInsets = JSInsets(topSize, 0, 0, 0);
    }

});

JSClass("UIWindowCustomStyler", UIWindowStyler, {

});

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    closeInactive: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeInactive', {value: JSImage.initWithResourceName("UIWindowButtonCloseInactive", this.bundle) });
            return this.closeInactive;
        }
    },

    closeNormal: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeNormal', {value: JSImage.initWithResourceName("UIWindowButtonCloseNormal", this.bundle) });
            return this.closeNormal;
        }
    },

    closeOver: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeOver', {value: JSImage.initWithResourceName("UIWindowButtonCloseOver", this.bundle) });
            return this.closeOver;
        }
    },

    closeActive: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeActive', {value: JSImage.initWithResourceName("UIWindowButtonCloseActive", this.bundle) });
            return this.closeActive;
        }
    }

});

})();