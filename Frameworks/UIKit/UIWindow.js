// #import "UIKit/UIView.js"
// #import "UIKit/UIRenderer.js"
/* global JSClass, UIView, UIRenderer, JSConstraintBox, UIWindow */
'use strict';

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    contentView: null,
    firstResponder: null,

    // -------------------------------------------------------------------------
    // MARK: - Creating a Window

    init: function(){
        UIWindow.$super.initWithConstraintBox.call(this, JSConstraintBox.Margin(0));
        this._commonWindowInit();
    },

    initWithSpec: function(spec){
        UIWindow.$super.initWithSpec.call(this, spec);
        if (!('constraintBox' in spec) && !('constraintBox.margin' in spec) && !('frame' in spec)){
            this.constraintBox = JSConstraintBox.Margin(0);
        }
        this.contentView = spec.contentView;
        this._commonWindowInit();
    },

    // -------------------------------------------------------------------------
    // MARK: - Key Window

    makeKeyAndVisible: function(){
        UIRenderer.defaultRenderer.layerInserted(this.layer);
        UIRenderer.defaultRenderer.viewInserted(this);
        UIRenderer.defaultRenderer.makeKeyWindow(this);
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