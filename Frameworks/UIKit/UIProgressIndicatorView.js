// #import "UIView.js"
'use strict';

JSClass("UIProgressIndicatorView", UIView, {

    // --------------------------------------------------------------------
    // MARK: - Creating a progress indicator

    initWithSpec: function(spec){
        UIProgressIndicatorView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('progressBorderColor')){
            this._progressBorderColor = spec.valueForKey("progressBorderColor", JSColor);
        }
        if (spec.containsKey('progressBarColor')){
            this._progressBarColor = spec.valueForKey("progressBarColor", JSColor);
        }
        if (spec.containsKey('progressBorderWidth')){
            this._progressBorderWidth = spec.valueForKey("progressBorderWidth");
        }
        if (spec.containsKey('style')){
            this._style = spec.valueForKey("style", UIProgressIndicatorView.Style);
        }
        if (spec.containsKey('percentComplete')){
            this._percentComplete = spec.valueForKey("percentComplete");
        }
        if (spec.containsKey('barInsets')){
            this._barInsets = spec.valueForKey("barInsets", JSInsets);
        }
        this._commonProgressInit();
    },

    initWithFrame: function(frame){
        UIProgressIndicatorView.$super.initWithFrame.call(this, frame);
        this._commonProgressInit();
    },

    _commonProgressInit: function(){
        if (this._progressBarColor === null){
            this._progressBarColor = JSColor.initWithRGBA(0, 0, 0, 0.4);
        }
        if (this._progressBorderColor === null){
            this._progressBorderColor = this._progressBarColor;
        }
        this.setNeedsUpdate();
    },

    // --------------------------------------------------------------------
    // MARK: - Style

    style: JSDynamicProperty('_style', 0),
    progressBorderWidth: JSDynamicProperty('_progressBorderWidth', 1),
    barInsets: JSDynamicProperty('_barInsets', null),

    setStyle: function(style){
        this._style = style;
        this.setNeedsUpdate();
    },

    setProgressBorderWidth: function(width){
        this._progressBorderWidth = width;
        this.setNeedsUpdate();
    },

    setBarInsets: function(barInsets){
        this._barInsets = JSInsets(barInsets);
        this.setNeedsUpdate();
    },

    // --------------------------------------------------------------------
    // MARK: - Colors

    progressBorderColor: JSDynamicProperty('_progressBorderColor', null),
    progressBarColor: JSDynamicProperty('_progressBarColor', null),

    setProgressBorderColor: function(color){
        this._progressBorderColor = color;
        this.setNeedsUpdate();
    },

    setProgressBarColor: function(color){
        if (this._progressBarColor === this._progressBorderColor){
            this._progressBorderColor = color;
        }
        this._progressBarColor = color;
        this.setNeedsUpdate();
    },

    // --------------------------------------------------------------------
    // MARK: - Value

    percentComplete: JSDynamicProperty('_percentComplete', 0),

    setPercentComplete: function(percentComplete){
        this._percentComplete = percentComplete;
        this.setNeedsUpdate();
    },

    // --------------------------------------------------------------------
    // MARK: - Updating

    _clipView: null,
    _barView: null,

    setNeedsUpdate: function(){
        if (this._style == UIProgressIndicatorView.Style.linear){
            if (!this._clipView){
                this.setNeedsDisplay();
                this._clipView = UIView.init();
                this._clipView.clipsToBounds = true;
                this._barView = UIView.init();
                this._clipView.addSubview(this._barView);
                this.addSubview(this._clipView);
            }
            this._clipView.borderWidth = this._progressBorderWidth;
            this._clipView.borderColor = this._progressBorderColor;
            this._barView.backgroundColor = this._progressBarColor;
            this.setNeedsLayout();
        }else if (this._style == UIProgressIndicatorView.Style.circular){
            if (this._clipView){
                this._clipView.removeFromSuperview();
                this._clipView = null;
                this._barView = null;
            }
            this.setNeedsDisplay();
        }
    },

    layoutSubviews: function(){
        if (this._clipView){
            this._clipView.frame = this.bounds.rectWithInsets(this._barInsets);
            this._barView.frame = JSRect(0, 0, this._clipView.bounds.size.width * this._percentComplete, this._clipView.bounds.size.height);
            this._clipView.cornerRadius = this._clipView.bounds.size.height / 2;
        }
    },

    drawLayerInContext: function(layer, context){
        if (this._style == UIProgressIndicatorView.Style.circular){
            var bounds = layer.bounds.rectWithInsets(this._barInsets);
            var center = bounds.center;
            var halfWidth = this._progressBorderWidth / 2;
            var r = Math.min(center.x - bounds.origin.x, center.y - bounds.origin.y) - halfWidth;
            var a0 = -Math.PI / 2;
            var a1 = a0 + Math.PI * 2 * this._percentComplete;
            context.beginPath();
            context.moveToPoint(center.x, center.y);
            context.addArc(center, r, a0, a1, true);
            context.closePath();
            context.setFillColor(this._progressBarColor);
            context.fillPath();
            if (this._progressBorderWidth > 0){
                context.setLineWidth(this._progressBorderWidth);
                context.setStrokeColor(this._progressBorderColor);
                context.strokeEllipseInRect(JSRect(center.x - r, center.y - r, r + r, r + r));
            }
        }
    },

    getIntrinsicSize: function(){
        return JSSize(this.bounds.size);
    }

});

UIProgressIndicatorView.Style = {
    linear: 0,
    circular: 1
};