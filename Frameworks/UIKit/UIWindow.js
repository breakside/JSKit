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
        UIDisplayServer.defaultServer.layerInserted(this.layer);
        this.application.windowInserted(this);
        if (this.canBecomeKeyWindow()){
            this.application.keyWindow = this;
        }
        if (this.rootViewController){
            this.rootViewController.viewWillAppear();
            this.rootViewController.viewDidAppear();
        }
    },

    getFirstResponder: function(){
        return this._firstResponder;
    },

    setFirstResponder: function(responder){
        if (responder !== this._firstResponder){
            if (this._firstResponder !== null){
                if (!this._firstResponder.resignFirstResponder || this._firstResponder.resignFirstResponder()){
                    this._firstResponder = responder;
                }
            }else{
                this._firstResponder = responder;
            }
            if (this._firstResponder === responder){
                this._firstResponder.becomeFirstResponder();
            }
        }
    },

    nextResponder: function(){
        return this.application;
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate conversions    

    convertPointFromView: function(point, view){
        if (view.window === this){
            var windowPoint = JSPoint(point);
            while (view !== this){
                // FIXME: what about bounds/scrolling?
                // FIXME; what about transform?
                windowPoint.x += view.frame.origin.x;
                windowPoint.y += view.frame.origin.y;
                view = view.superview;
            }
            return windowPoint;
        }
        return JSPoint.Zero;
    },

    convertPointToView: function(point, view){
        if (view.window === this){
            var viewPoint = JSPoint(point);
            while (view !== this){
                // FIXME: what about bounds/scrolling?
                // FIXME; what about transform?
                viewPoint.x -= view.frame.origin.x;
                viewPoint.y -= view.frame.origin.y;
                view = view.superview;
            }
            return viewPoint;
        }
        return JSPoint.Zero;
    },

    convertPointFromScreen: function(point){
        return JSPoint(point.x - this.frame.origin.x, point.y - this.frame.origin.y);
    },

    convertPointToScreen: function(point){
        return JSPoint(point.x + this.frame.origin.x, point.y + this.frame.origin.y);
    },

    sendEvent: function(event){
        if (event.majorType === UIEvent.MajorType.Mouse){
            var hitView = this.hitTest(event.locationInWindow);
            switch (event.type){
                case UIEvent.Type.MouseDown:
                    if (this.canBecomeKeyWindow() && this.application.keyWindow !== this){
                        this.application.keyWindow = this;
                    }
                    hitView.mouseDown(event);
                    break;
                case UIEvent.Type.MouseUp:
                    hitView.mouseUp(event);
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