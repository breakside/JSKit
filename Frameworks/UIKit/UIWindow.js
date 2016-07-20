// #import "UIKit/UIView.js"
// #import "UIKit/UIRenderer.js"
/* global JSClass, UIView, UIRenderer, JSConstraintBox, JSDynamicProperty, UIWindow */
'use strict';

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    rootViewController: null,
    contentView: null,
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

    makeKeyAndVisible: function(){
        UIRenderer.defaultRenderer.layerInserted(this.layer);
        UIRenderer.defaultRenderer.viewInserted(this);
        UIRenderer.defaultRenderer.makeKeyWindow(this);
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

    // -------------------------------------------------------------------------
    // MARK: - Private methods

    _commonWindowInit: function(){
        this.window = this;
        if (this.contentView === null){
            this.contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        }
        this.addSubview(this.contentView);
    }

});