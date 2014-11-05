// #import "JSKit/JSKit.js"
// #import "UIKit/UIKit.js"
/* global JSClass, JSObject, UIWindow, JSColor, UIView, JSRect, UIBasicAnimation */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    window: null,
    mainViewController: null,

    applicationDidFinishLaunching: function(){
        this.window = UIWindow.init();
        this.window.makeKeyAndVisible();

        var viewCount = 1;

        var white = JSColor.whiteColor();
        var colors = [
            JSColor.initWithRGBA(255, 0, 0),
            JSColor.initWithRGBA(0, 128, 0),
            JSColor.initWithRGBA(0, 0, 225),
            JSColor.initWithRGBA(0, 0, 0),
            JSColor.initWithRGBA(255, 128, 128),
            JSColor.initWithRGBA(128, 0, 255)
        ];

        var view, x, y, size;
        for (var i = 0; i < viewCount; i++){
            size = Math.round(Math.random() * 100 + 20);
            x = Math.round(Math.random() * (this.window.frame.size.width - size));
            y = Math.round(Math.random() * (this.window.frame.size.height - size));
            view = UIView.initWithFrame(JSRect(x, y, size, size));
            view.borderRadius = size / 2.0;
            view.borderWidth = 1.0;
            view.borderColor = white;
            view.backgroundColor = colors[i % colors.length];
            this.window.contentView.addSubview(view);
        }

        var applicationDelegate = this;
        document.body.addEventListener('click', function(e){
            var duration = e.shiftKey ? 10 : 0.25;
            UIView.animateWithDuration(duration, function animateCircles(){
                var view;
                var x, y, size;
                var animation;
                for (var i = Math.max(0, viewCount - 10); i < viewCount; i++){
                    view = applicationDelegate.window.contentView.subviews[i];
                    size = view.frame.size;
                    x = Math.round(Math.random() * (applicationDelegate.window.contentView.frame.size.width - size.width));
                    y = Math.round(Math.random() * (applicationDelegate.window.contentView.frame.size.height - size.height));
                    animation = UIBasicAnimation.initWithKeyPath('frame.origin.x');
                    animation.fromValue = view.layer.frame.origin.x;
                    animation.toValue = x;
                    animation.duration = duration;
                    view.layer.addAnimationForKey(animation, 'frame.origin.y');
                    animation = UIBasicAnimation.initWithKeyPath('frame.origin.y');
                    animation.fromValue = view.layer.frame.origin.y;
                    animation.toValue = y;
                    animation.duration = duration;
                    view.layer.addAnimationForKey(animation, 'frame.origin.y');
                    //y = view.frame.origin.y;
                    view.frame = JSRect(x, y, size.width, size.height);
                }
            });
        });
    }

});