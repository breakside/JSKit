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

// #import "UIView.js"
// #import "UICustomAnimation.js"
// #import "UIImageLayer.js"
'use strict';

(function(){

JSClass("UIActivityIndicatorView", UIView, {

    // --------------------------------------------------------------------
    // MARK: - Creating an Activity View

    init: function(){
        this.initWithStyle(UIActivityIndicatorView.Style.dark);
    },

    initWithStyle: function(style){
        switch (style){
            case UIActivityIndicatorView.Style.dark:
                this.initWithColor(darkColor);
                break;
            case UIActivityIndicatorView.Style.light:
                this.initWithColor(lightColor);
                break;
            default:
                return null;
        }
    },

    initWithColor: function(color){
        this.initWithSpriteImage(images.defaultSprite);
        this._imageLayer.templateColor = color;
    },

    initWithSpec: function(spec){
        UIActivityIndicatorView.$super.initWithSpec.call(this, spec);
        this._skipSuperInit = true;
        if (spec.containsKey('style')){
            var style = spec.valueForKey("style", UIActivityIndicatorView.Style);
            this.initWithStyle(style);
        }else if (spec.containsKey('color')){
            var color = spec.valueForKey("color", JSColor);
            this.initWithColor(color);
        }else if (spec.containsKey('spriteImage')){
            var image = spec.valueForKey("spriteImage", JSImage);
            var singleFrameHeight;
            if (spec.containsKey('singleFrameHeight')){
                singleFrameHeight = spec.valueForKey("singleFrameHeight");
            }
            this.initWithSpriteImage(image, singleFrameHeight);
        }
        if (spec.containsKey('hidesWhenStopped')){
            this.hidesWhenStopped = spec.valueForKey("hidesWhenStopped");
        }
    },

    _skipSuperInit: false,

    initWithSpriteImage: function(image, singleFrameHeight){
        if (singleFrameHeight === undefined){
            singleFrameHeight = image.size.width;
        }
        if (!this._skipSuperInit){
            UIActivityIndicatorView.$super.initWithFrame.call(this, JSRect(0, 0, image.size.width, singleFrameHeight));
        }
        this._spriteImage = image;
        this._imageLayer = UIImageLayer.init();
        this._imageLayer.image = image;
        this._imageLayer.bounds = JSRect(0, 0, image.size.width, singleFrameHeight);
        this._imageLayer.imageFrame = JSRect(0, 0, image.size.width, image.size.height);
        this.layer.addSublayer(this._imageLayer);
        this.clipsToBounds = true;
        this._singleFrameHeight = singleFrameHeight;
        this._spriteFrameCount = Math.floor(image.size.height / this._singleFrameHeight);
    },

    layoutSubviews: function(){
        if (this._spriteImage !== null){
            var scale = this.bounds.size.width / this._spriteImage.size.width;
            this._imageLayer.position = this.bounds.center;
            this._imageLayer.transform = JSAffineTransform.Scaled(scale, scale);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Controlling Animations

    startAnimating: function(){
        if (this._isAnimating){
            return;
        }
        this._isAnimating = true;
        this._f0 = this._currentFrameNumber;
        var animationAction = null;
        if (this._spriteImage !== null){
            animationAction = this._spriteAnimationFrame;
        }
        if (animationAction !== null){
            this._animation = UICustomAnimation.initWithAction(animationAction, this);
            this.layer.addAnimationForKey(this._animation, "sprite");
        }
        if (this.hidesWhenStopped){
            this.hidden = false;
        }
    },

    stopAnimating: function(){
        if (!this._isAnimating){
            return;
        }
        if (this._animation !== null){
            this._animation.isComplete = true;
        }
        this._t0 = null;
        this._isAnimating = false;
        if (this.hidesWhenStopped){
            this.hidden = true;
        }
    },

    _animation: null,
    isAnimating: JSReadOnlyProperty('_isAnimating', false),
    hidesWhenStopped: JSDynamicProperty('_hidesWhenStopped', false),

    setHidesWhenStopped: function(hidesWhenStopped){
        this._hidesWhenStopped = hidesWhenStopped;
        this.hidden = this._hidesWhenStopped && !this._isAnimating;
    },

    _t0: null,
    _f0: 0,
    _speed: 1,

    _spriteAnimationFrame: function(t){
        if (this._t0 === null){
            this._t0 = t;
            return;
        }
        var dt = t - this._t0;
        var frameNumber = (this._f0 + Math.floor(dt * this._spriteFrameCount * this._speed)) % this._spriteFrameCount;
        if (frameNumber !== this._currentFrameNumber){
            this._currentFrameNumber = frameNumber;
            var y = this._singleFrameHeight * frameNumber;
            this._imageLayer.bounds = JSRect(JSPoint(0, y), this._imageLayer.bounds.size);
        }
    },

    getIntrinsicSize: function(){
        if (this._spriteImage !== null){
            return JSSize(this._spriteImage.size.width, this._singleFrameHeight);
        }
        return UIActivityIndicatorView.$super.getIntrinsicSize.call(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Image

    _spriteImage: null,
    _spriteFrameCount: 0,
    _singleFrameHeight: 0,
    _currentFrameNumber: 0,
    _imageLayer: null,

    // -------------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,

    accessibilityRole: UIAccessibility.Role.activityIndicator

});

UIActivityIndicatorView.Style = {
    dark: 0,
    light: 1
};

var darkColor = JSColor.black;
var lightColor = JSColor.white;

var images = Object.create({}, {


    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    defaultSprite: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIActivityIndicatorViewDefaultSprite", this.bundle);
            Object.defineProperty(this, 'defaultSprite', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.defaultSprite;
        }
    },

});

})();