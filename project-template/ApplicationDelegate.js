// #import "JSKit/JSKit.js"
// #import "UIKit/UIKit.js"

var ApplicationDelegate = JSObject.$extend({

    window: null,
    mainViewController: null,

    applicationDidFinishLaunching: function(){
        this.window = UIWindow.init();
        this.window.constraintBox = JSConstraintBox.Margin(0);
        this.window.displayIfNeeded();

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
            x = Math.round(Math.random() * (this.window.renderer.element.offsetWidth - size));
            y = Math.round(Math.random() * (this.window.renderer.element.offsetHeight - size));
            view = UIView.initWithFrame(JSRect(x, y, size, size));
            view.borderRadius = size / 2.0;
            view.borderWidth = 1.0;
            view.borderColor = white;
            view.backgroundColor = colors[i % colors.length];
            this.window.addSubview(view);
        }

        var applicationDelegate = this;
        document.body.addEventListener('click', function(e){
            var duration = e.shiftKey ? 10 : 0.25;
            UIView.animateWithDuration(duration, function animateCircles(){
                var view;
                var x, y, size;
                for (var i = Math.max(0, viewCount - 10); i < viewCount; i++){
                    view = applicationDelegate.window.subviews[i];
                    size = view.frame.size;
                    x = Math.round(Math.random() * (applicationDelegate.window.renderer.element.offsetWidth - size.width));
                    y = Math.round(Math.random() * (applicationDelegate.window.renderer.element.offsetHeight - size.height));
                    //y = view.frame.origin.y;
                    view.frame = JSRect(x, y, size.width, size.height);
                }
            });
        });
    }

}, 'ApplicationDelegate');