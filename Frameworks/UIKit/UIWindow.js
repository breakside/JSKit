// #import "UIKit/UIView.js"
// #import "UIKit/UIDisplayServer.js"
// #import "UIKit/UIApplication.js"
// #import "UIKit/UITouch.js"
/* global JSClass, UIView, UIDisplayServer, JSColor, JSRect, JSConstraintBox, JSDynamicProperty, JSReadOnlyProperty, UIWindow, JSPoint, UIApplication, UIEvent, UITouch */
'use strict';

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    contentViewController: JSDynamicProperty('_contentViewController', null),
    contentView: JSDynamicProperty('_contentView', null),
    application: JSReadOnlyProperty('_application', null),
    firstResponder: JSDynamicProperty('_firstResponder', null),
    windowServer: JSReadOnlyProperty(),
    screen: JSReadOnlyProperty('_screen', null),

    // -------------------------------------------------------------------------
    // MARK: - Creating a Window

    init: function(){
        UIWindow.$super.init.call(this);
        this._application = UIApplication.sharedApplication;
        this._commonWindowInit();
    },

    initWithApplication: function(application){
        UIWindow.$super.initWithConstraintBox.call(this, JSConstraintBox.Margin(0));
        this._application = application;
        this._commonWindowInit();
    },

    initWithSpec: function(spec, values){
        UIWindow.$super.initWithSpec.call(this, spec, values);
        if (!('constraintBox' in values) && !('constraintBox.margin' in values) && !('frame' in values)){
            this.constraintBox = JSConstraintBox.Margin(0);
        }
        if ('contentViewController' in values){
            this.contentViewController = spec.resolvedValue(values.contentViewController);
        }else if ('contentView' in values){
            this.contentView = spec.resolvedValue(values.contentView);
        }
        this._application = UIApplication.sharedApplication;
        this._commonWindowInit();
    },

    // -------------------------------------------------------------------------
    // MARK: - Content View

    setContentView: function(contentView){
        if (this._contentView !== null){
            this._contentView.removeFromSuperview();
        }
        this._contentView = contentView;
        this._contentViewController = null;
        if (this._contentView !== null){
            this.addSubview(this._contentView);
        }
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

    // -------------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        this.contentView.frame = this.bounds;
    },

    // -------------------------------------------------------------------------
    // MARK: - Key Window

    canBecomeMainWindow: function(){
        return true;
    },

    canBecomeKeyWindow: function(){
        return true;
    },

    canBecomeFirstResponder: function(){
        return true;
    },

    makeVisible: function(){
        this.windowServer.makeWindowVisible(this);
    },

    makeKey: function(){
        this.windowServer.makeWindowKey(this);
    },

    makeKeyAndVisible: function(){
        this.windowServer.makeWindowKeyAndVisible(this);
        if (this._contentViewController){
            this._contentViewController.viewWillAppear();
            this._contentViewController.viewDidAppear();
        }
    },

    orderFront: function(){
        this.windowServer.orderWindowFront(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Closing

    close: function(){
        this.windowServer.windowRemoved(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Window Server

    getWindowServer: function(){
        if (this._application !== null){
            return this._application.windowServer;
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Events

    mouseDown: function(){
        this.setFirstResponder(null);
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

    setFirstResponderToKeyViewAfterView: function(view){
        if (view === null){
            return;
        }
        var haveLooped = false;
        var next;
        do {
            next = view.nextKeyView;
            if (next === null && !haveLooped){
                next = this.nextKeyView;
                haveLooped = true;
            }
        } while (next !== null && (next.hidden || !next.canBecomeFirstResponder()));
        if (next !== null){
            this.firstResponder = next;
        }
    },

    setFirstResponderToKeyViewBeforeView: function(view){
        if (view === null){
            return;
        }
        var keyView = this.nextKeyView;
        // TODO:
    },

    getNextResponder: function(){
        return this._application;
    },

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

    sendEvent: function(event){
        switch (event.category){
            case UIEvent.Category.Mouse:
                this._sendMouseEvent(event);
                break;
            case UIEvent.Category.Key:
                this._sendKeyEvent(event);
                break;
            case UIEvent.Category.Touches:
                this._sendTouchEvent(event);
                break;
        }
    },

    mouseDownHitView: null,
    mouseDownType: null,

    _sendMouseEvent: function(event){
        if (event.type == UIEvent.Type.LeftMouseDown || event.type == UIEvent.Type.RightMouseDown){
            this.mouseDownHitView = this.hitTest(event.locationInWindow);
            this.mouseDownType = event.type;
        }
        switch (event.type){
            case UIEvent.Type.LeftMouseDown:
                if (this.canBecomeMainWindow() && this.windowServer.mainWindow !== this){
                    this.windowServer.mainWindow = this;
                }
                if (this.canBecomeKeyWindow() && this.windowServer.keyWindow !== this){
                    this.windowServer.keyWindow = this;
                }
                this.mouseDownHitView.mouseDown(event);
                break;
            case UIEvent.Type.LeftMouseUp:
                if (this.mouseDownHitView === null){
                    this.mouseUp(event);
                }else{
                    this.mouseDownHitView.mouseUp(event);
                    if (this.mouseDownType == UIEvent.Type.LeftMouseDown){
                        this.mouseDownHitView = null;
                    }
                }
                break;
            case UIEvent.Type.LeftMouseDragged:
                if (this.mouseDownHitView !== null){
                    this.mouseDownHitView.mouseDragged(event);
                }
                break;
            case UIEvent.Type.RightMouseDown:
                if (this.mouseDownHitView !== null){
                    this.mouseDownHitView.rightMouseDown(event);
                }
                break;
            case UIEvent.Type.RightMouseUp:
                if (this.mouseDownHitView === null){
                    this.rightMouseUp(event);
                }else{
                    this.mouseDownHitView.rightMouseUp(event);
                    if (this.mouseDownType == UIEvent.Type.RightMouseDown){
                        this.mouseDownHitView = null;
                    }
                }
                break;
            case UIEvent.Type.RightMouseDragged:
                if (this.mouseDownHitView !== null){
                    this.mouseDownHitView.rightMouseDragged(event);
                }
                break;
            case UIEvent.Type.MouseEntered:
                event.trackingView.mouseEntered(event);
                break;
            case UIEvent.Type.MouseExited:
                event.trackingView.mouseExited(event);
                break;
            case UIEvent.Type.MouseMoved:
                event.trackingView.mouseMoved(event);
                break;
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
                view = this.hitTest(touches[i].locationInWindow);
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
                case UIEvent.Type.KeyDown:
                    view.keyDown(event);
                    break;
                case UIEvent.Type.KeyUp:
                    view.keyUp(event);
                    break;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Private methods

    _commonWindowInit: function(){
        this.window = this;
        this.backgroundColor = JSColor.whiteColor();
        this.clipsToBounds = true;
        if (this._contentView === null){
            this.contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        }
    }

});