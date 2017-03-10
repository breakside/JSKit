// #import "UIKit/UIView.js"
// #import "UIKit/UIDisplayServer.js"
// #import "UIKit/UIApplication.js"
/* global JSClass, UIView, UIDisplayServer, JSConstraintBox, JSDynamicProperty, JSReadOnlyProperty, UIWindow, JSPoint, UIApplication, UIEvent */
'use strict';

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    contentViewController: JSDynamicProperty('_contentViewController', null),
    contentView: JSDynamicProperty('_contentView', null),
    application: JSReadOnlyProperty('_application', null),
    firstResponder: JSDynamicProperty('_firstResponder', null),
    headKeyView: JSDynamicProperty('_firstKeyResponder', null),

    // -------------------------------------------------------------------------
    // MARK: - Creating a Window

    init: function(){
        UIWindow.$super.initWithConstraintBox.call(this, JSConstraintBox.Margin(0));
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
        this._commonWindowInit();
    },

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
    // MARK: - Key Window

    canBecomeKeyWindow: function(){
        return true;
    },

    makeKeyAndVisible: function(){
        this._application.windowInserted(this);
        if (this.canBecomeKeyWindow()){
            this._application.keyWindow = this;
        }
        if (this._contentViewController){
            this._contentViewController.viewWillAppear();
            this._contentViewController.viewDidAppear();
        }
    },

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
                this._application.windowServer.windowDidChangeResponder(this);
            }
        }
    },

    setFirstReponderToKeyViewAfterView: function(view){
        if (view === null){
            return;
        }
        var haveLooped = false;
        var next;
        do {
            next = view.nextKeyView;
            if (next === null && !haveLooped){
                next = this.headKeyView;
                haveLooped = true;
            }
        } while (next !== null && !next.hidden && !next.canBecomeFirstResponder());
        if (next !== null){
            this.firstResponder = next;
        }
    },

    setFirstResponderToKeyViewBeforeView: function(view){
    },

    getNextResponder: function(){
        return this._application;
    },

    convertPointFromScreen: function(point){
        return this.layer._convertPointFromSuperlayer(point);
    },

    convertPointToScreen: function(point){
        return this.layer._convertPointToSuperlayer(point);
    },

    sendEvent: function(event){
        switch (event.category){
            case UIEvent.Category.Mouse:
                this._sendMouseEvent(event);
                break;
            case UIEvent.Category.Key:
                this._sendKeyEvent(event);
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
                if (this.canBecomeKeyWindow() && this._application.keyWindow !== this){
                    this._application.keyWindow = this;
                }
                this.mouseDownHitView.mouseDown(event);
                break;
            case UIEvent.Type.LeftMouseUp:
                this.mouseDownHitView.mouseUp(event);
                if (this.mouseDownType == UIEvent.Type.LeftMouseDown){
                    this.mouseDownHitView = null;
                }
                break;
            case UIEvent.Type.LeftMouseDragged:
                this.mouseDownHitView.mouseDragged(event);
                break;
            case UIEvent.Type.RightMouseDown:
                this.mouseDownHitView.rightMouseDown(event);
                break;
            case UIEvent.Type.RightMouseUp:
                this.mouseDownHitView.rightMouseUp(event);
                if (this.mouseDownType == UIEvent.Type.RightMouseDown){
                    this.mouseDownHitView = null;
                }
                break;
            case UIEvent.Type.RightMouseDragged:
                this.mouseDownHitView.rightMouseDragged(event);
                break;
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
        this._application = UIApplication.sharedApplication;
        this.window = this;
        if (this._contentView === null){
            this.contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        }
    }

});