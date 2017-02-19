// #import "UIKit/UIView.js"
// #import "UIKit/UIDisplayServer.js"
// #import "UIKit/UIApplication.js"
/* global JSClass, UIView, UIDisplayServer, JSConstraintBox, JSDynamicProperty, UIWindow, JSPoint, UIApplication, UIEvent */
'use strict';

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    rootViewController: null,
    contentView: null,
    application: null,
    firstResponder: JSDynamicProperty('_firstResponder', null),

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
        if ('rootViewController' in values){
            this.rootViewController = spec.resolvedValue(values.rootViewController);
            this.contentView = this.rootViewController.view;
        }else if ('contentView' in values){
            this.contentView = spec.resolvedValue(values.contentView);
        }
        this._commonWindowInit();
    },

    // -------------------------------------------------------------------------
    // MARK: - Key Window

    canBecomeKeyWindow: function(){
        return true;
    },

    makeKeyAndVisible: function(){
        this.application.windowInserted(this);
        if (this.canBecomeKeyWindow()){
            this.application.keyWindow = this;
        }
        if (this.rootViewController){
            this.rootViewController.viewWillAppear();
            this.rootViewController.viewDidAppear();
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
            var didBecomeResponder = false;
            if (this._firstResponder !== null){
                didResignResponder = this._firstResponder.resignFirstResponder();
                if (didResignResponder){
                    this._firstResponder = null;
                }
            }
            if (didResignResponder && responder !== null){
                didBecomeResponder = responder.becomeFirstResponder();
                if (didBecomeResponder){
                    this._firstResponder = responder;
                }
            }
            if (this._firstResponder !== previousResponder){
                this.application.windowServer.windowDidChangeResponder(this);
            }
        }
    },

    nextResponder: function(){
        return this.application;
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
                if (this.canBecomeKeyWindow() && this.application.keyWindow !== this){
                    this.application.keyWindow = this;
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
        this.application = UIApplication.sharedApplication;
        this.window = this;
        if (this.contentView === null){
            this.contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        }
        this.addSubview(this.contentView);
    }

});