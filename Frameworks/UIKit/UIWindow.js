// #import "UIKit/UIView.js"
// #import "UIKit/UIApplication.js"
// #import "UIKit/UITouch.js"
// #import "UIKit/UIButton.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, JSObject, UIView, JSColor, JSBundle, JSImage, JSUserDefaults, JSFont, UIImageView, UILabel, JSSize, JSRect, JSInsets, JSDynamicProperty, JSReadOnlyProperty, UIWindow, UIWindowStyler, UIWindowDefaultStyler, UIWindowCustomStyler, UIControl, UIButton, UIButtonCustomStyler, JSPoint, UIApplication, UIEvent, UITouch */
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
        if ('isUserMovable' in values){
            this.isUserMovable = values.isUserMovable;
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
        if ('autosaveName' in values){
            this.autosaveName = spec.resolvedValue(values.autosaveName);
        }
    },

    _commonWindowInit: function(){
        this.window = this;
        if (this.backgroundColor === null){
            this.backgroundColor = JSColor.whiteColor;
        }
        this.clipsToBounds = true;
        if (this._contentView === null){
            this._contentView = UIView.init();
        }
        this._contentInsets = JSInsets.Zero;
        if (this._styler === null){
            if (this.level == UIWindow.Level.back){
                this._styler = UIWindowCustomStyler.shared;
            }else{
                this._styler = UIWindow.defaultStyler;
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
    allowsClose: JSDynamicProperty('_allowsClose', true),

    setTitle: function(title){
        this._title = title;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    setAllowsClose: function(allowsClose){
        this._allowsClose = allowsClose;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Content View

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
        this._contentView.frame = this.bounds.rectWithInsets(this._contentInsets);
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

    open: function(){
        this.orderFront();
    },

    close: function(){
        if (this.viewController){
            this.viewController.viewWillDisappear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewWillDisappear(false);
        }
        this.windowServer.windowRemoved(this);
    },

    orderFront: function(){
        if (this.viewController){
            this.viewController.viewWillAppear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewWillAppear(false);
        }
        this.windowServer.orderWindowFront(this);
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
    // MARK: - Events

    isUserMovable: true,
    _downLocation: null,
    _downOrigin: null,
    _isMoving: false,

    mouseDown: function(event){
        // this.setFirstResponder(null);
        if (this.level == UIWindow.Level.normal && this.isUserMovable){
            this._downLocation = this.convertPointToScreen(event.locationInWindow);
            this._downOrigin = JSPoint(this.frame.origin);
            this._isMoving = true;
        }
    },

    mouseDragged: function(event){
        if (!this._isMoving){
            return;
        }
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
            this._autosaveToUserDefaults();
        }
        this._downLocation = null;
        this._downOrigin = null;
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
            if (this._firstResponder !== null){
                if (this._firstResponder.canResignFirstResponder()){
                    this._firstResponder.resignFirstResponder();
                    this._firstResponder = null;
                    didResignResponder = true;
                }else{
                    didResignResponder = false;
                }
            }
            if (didResignResponder && responder !== null){
                if (responder.canBecomeFirstResponder()){
                    responder.becomeFirstResponder();
                    this._firstResponder = responder;
                }
            }
            if (this._firstResponder !== previousResponder){
                this.windowServer.windowDidChangeResponder(this);
            }
        }
    },

    getNextResponder: function(){
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
                break;
            case UIEvent.Type.leftMouseUp:
                eventTarget.mouseUp(event);
                if (this.mouseDownType == UIEvent.Type.leftMouseDown){
                    this.mouseEventView = null;
                }
                break;
            case UIEvent.Type.leftMouseDragged:
                eventTarget.mouseDragged(event);
                break;
            case UIEvent.Type.rightMouseDown:
                eventTarget.rightMouseDown(event);
                break;
            case UIEvent.Type.rightMouseUp:
                eventTarget.rightMouseUp(event);
                if (this.mouseDownType == UIEvent.Type.rightMouseDown){
                    this.mouseEventView = null;
                }
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

    _sendTouchEvent: function(event){
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
                    break;
            }
        }
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
            frame: [this.frame.origin.x, this.frame.origin.y, this.frame.size.width, this.frame.size.height]
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

JSClass("UIRootWindow", UIWindow, {

    level: UIWindow.Level.back

});

JSClass("UIWindowStyler", JSObject, {

    initializeWindow: function(window){
    },

    updateWindow: function(window){
    },

    layoutWindow: function(window){
    }

});

JSClass("UIWindowDefaultStyler", UIWindowStyler, {

    _titlebarSize: 22,
    _controlButtonSize: 12,
    activeTitleColor: null,
    inactiveTitleColor: null,
    shadowRadius: 40,
    cornerRadius: 6,
    backgroundColor: null,
    shadowColor: null,

    init: function(){
        this.titleColor = JSColor.initWithWhite(51/255);
        this.inactiveTitleColor = JSColor.initWithWhite(192/255);
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.4);
        this.backgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255,1);
    },

    initializeWindow: function(window){
        var closeButton = UIButton.initWithStyler(UIButtonCustomStyler.shared);
        closeButton.imageRenderMode = UIImageView.RenderMode.original;
        closeButton.setImageForState(images.closeNormal, UIControl.State.normal);
        closeButton.setImageForState(images.closeOver, UIControl.State.over);
        closeButton.setImageForState(images.closeActive, UIControl.State.active);
        closeButton.addTargetedAction(window, window.close);

        var titleLabel = UILabel.init();
        titleLabel.font = titleLabel.font.fontWithWeight(JSFont.Weight.regular);
        titleLabel.maximumNumberOfLines = 1;

        var titleBar = UIView.init();

        titleBar.addSubview(closeButton);
        titleBar.addSubview(titleLabel);
        window.addSubview(titleBar);

        window.stylerProperties.closeButton = closeButton;
        window.stylerProperties.titleBar = titleBar;
        window.stylerProperties.titleLabel = titleLabel;

        window.contentInsets = JSInsets(this._titlebarSize, 0, 0, 0);

        window.shadowColor = this.shadowColor;
        window.shadowRadius = this.shadowRadius;
        window.cornerRadius = this.cornerRadius;
        window.backgroundColor = this.backgroundColor;

        this.updateWindow(window);
    },

    layoutWindow: function(window){
        var controlPadding = (this._titlebarSize - this._controlButtonSize) / 2;
        var titleBar = window.stylerProperties.titleBar;
        var closeButton = window.stylerProperties.closeButton;
        var titleLabel = window.stylerProperties.titleLabel;
        titleBar.frame = JSRect(0, 0, window.bounds.size.width, this._titlebarSize);
        closeButton.frame = JSRect(controlPadding, controlPadding, this._controlButtonSize, this._controlButtonSize);
        titleLabel.sizeToFit();
        var minX = closeButton.frame.origin.x + closeButton.frame.size.width + controlPadding;
        var maxX = titleBar.bounds.size.width - controlPadding;
        var available = maxX - minX;
        if (titleLabel.frame.size.width > available){
            titleLabel.bounds.size = JSSize(available, titleLabel.bounds.size.height);
        }
        var centerX = titleBar.bounds.size.width / 2;
        var shiftX = minX - (centerX - titleLabel.frame.size.width / 2);
        if (shiftX > 0){
            centerX += shiftX;
        }
        titleLabel.position = JSPoint(centerX, titleBar.bounds.size.height / 2);
    },

    updateWindow: function(window){
        var closeButton = window.stylerProperties.closeButton;
        var titleLabel = window.stylerProperties.titleLabel;
        closeButton.hidden = !window.allowsClose;
        titleLabel.text = window.title || '';
        if (window.isMainWindow || window.isKeyWindow){
            titleLabel.textColor = this.activeTitleColor;
        }else{
            titleLabel.textColor = this.inactiveTitleColor;
        }
        if (window.isMainWindow){
            closeButton.setImageForState(images.closeNormal, UIControl.State.normal);
        }else{
            closeButton.setImageForState(images.closeInactive, UIControl.State.normal);
        }
    }

});

Object.defineProperty(UIWindowDefaultStyler, "shared", {
    configurable: true,
    get: function UIWindowDefaultStyler_getShared(){
        var shared = UIWindowDefaultStyler.init();
        Object.defineProperty(UIWindowDefaultStyler, "shared", {value: shared});
        return shared;
    }
});

JSClass("UIWindowCustomStyler", UIWindowStyler, {

});

Object.defineProperty(UIWindowCustomStyler, "shared", {
    configurable: true,
    get: function UIWindowCustomStyler_getShared(){
        var shared = UIWindowCustomStyler.init();
        Object.defineProperty(UIWindowCustomStyler, "shared", {value: shared});
        return shared;
    }
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

Object.defineProperties(UIWindow, {

    defaultStyler: {
        configurable: true,
        get: function UIWindow_getDefaultStyler(){
            var styler = UIWindowDefaultStyler.shared;
            Object.defineProperty(UIWindow, 'defaultStyler', {configurable: true, value: styler});
            return styler;
        },
        set: function UIWindow_setDefaultStyler(styler){
            Object.defineProperty(UIWindow, 'defaultStyler', {configurable: true, value: styler});
        }
    },

    customStyler: {
        configurable: true,
        get: function UIWindow_getDefaultStyler(){
            var styler = UIWindowDefaultStyler.shared;
            Object.defineProperty(UIWindow, 'customStyler', {configurable: true, value: styler});
            return styler;
        },
    }

});

})();