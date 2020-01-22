// #import UIKit
// #import TestKit
// #import "MockWindowServer.js"
'use strict';

JSClass("UIViewPropertyAnimatorTests", TKTestSuite, {

    setup: function(){
        this.windowServer = MockWindowServer.init();
        this.application = UIApplication.initWithWindowServer(this.windowServer);
    },

    teardown: function(){
        this.application.deinit();
        this.windowServer = null;
    },

    testStart: function(){
        var window = UIRootWindow.init();
        window.contentView = UIView.init();
        var view = UIView.init();
        view.position = JSPoint(0, 0);
        window.contentView.addSubview(view);
        window.makeKeyAndOrderFront();

        var animator = UIViewPropertyAnimator.initWithDuration(0.25);
        var animationsRun = false;
        var animationsComplete = false;
        animator.addAnimations(function(){
            view.position = JSPoint(100, 0);
            animationsRun = true;
        });
        animator.addCompletion(function(){
            animationsComplete = true;
        });
        TKAssert(!animationsRun);
        TKAssert(!animationsComplete);
        animator.start();
        TKAssert(animationsRun);
        this.windowServer.displayServer.updateDisplay(1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 0);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 80);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.25);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 100);
        TKAssertExactEquals(view.layer.animationCount, 0);
        TKAssert(animationsComplete);
    },

    testStop: function(){
        var window = UIRootWindow.init();
        window.contentView = UIView.init();
        var view = UIView.init();
        view.position = JSPoint(0, 0);
        window.contentView.addSubview(view);
        window.makeKeyAndOrderFront();

        var animator = UIViewPropertyAnimator.initWithDuration(0.25);
        var animationsRun = false;
        var animationsComplete = false;
        animator.addAnimations(function(){
            view.position = JSPoint(100, 0);
            animationsRun = true;
        });
        animator.addCompletion(function(){
            animationsComplete = true;
        });
        TKAssert(!animationsRun);
        TKAssert(!animationsComplete);
        animator.start();
        TKAssert(animationsRun);
        this.windowServer.displayServer.updateDisplay(1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 0);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 80);
        TKAssert(!animationsComplete);
        animator.stop();
        // .stop() should remove all animations and make the layer model match
        // the presenation at the stopping point.
        TKAssertExactEquals(view.layer.animationCount, 0);
        TKAssertFloatEquals(view.position.x, 80);
        TKAssertFloatEquals(view.layer.presentation.position.x, 80);
        TKAssert(!animationsComplete);
    },

    testPause: function(){
        var window = UIRootWindow.init();
        window.contentView = UIView.init();
        var view = UIView.init();
        view.position = JSPoint(0, 0);
        window.contentView.addSubview(view);
        window.makeKeyAndOrderFront();

        var animator = UIViewPropertyAnimator.initWithDuration(1);
        var animationsRun = false;
        var animationsComplete = false;
        animator.addAnimations(function(){
            view.position = JSPoint(100, 0);
            animationsRun = true;
        });
        animator.addCompletion(function(){
            animationsComplete = true;
        });
        TKAssert(!animationsRun);
        TKAssert(!animationsComplete);
        animator.start();
        TKAssert(animationsRun);
        this.windowServer.displayServer.updateDisplay(1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 0);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        animator.pause();
        this.windowServer.displayServer.updateDisplay(1.3);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.4);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.5);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.5);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        animator.resume();
        this.windowServer.displayServer.updateDisplay(2.6);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.7);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.8);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.9);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 50);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(3.0);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        TKAssert(!animationsComplete);
        animator.pause();
        this.windowServer.displayServer.updateDisplay(3.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(3.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(8.0);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        TKAssert(!animationsComplete);
        animator.resume();
        this.windowServer.displayServer.updateDisplay(8.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(8.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 70);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(8.3);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 80);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(8.4);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 90);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(8.5);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 100);
        TKAssert(animationsComplete);
    },

    testReverse: function(){
        var window = UIRootWindow.init();
        window.contentView = UIView.init();
        var view = UIView.init();
        view.position = JSPoint(0, 0);
        window.contentView.addSubview(view);
        window.makeKeyAndOrderFront();

        var animator = UIViewPropertyAnimator.initWithDuration(1);
        var animationsRun = false;
        var animationsComplete = false;
        animator.addAnimations(function(){
            view.position = JSPoint(100, 0);
            animationsRun = true;
        });
        animator.addCompletion(function(){
            animationsComplete = true;
        });
        TKAssert(!animationsRun);
        TKAssert(!animationsComplete);
        animator.start();
        TKAssert(animationsRun);
        this.windowServer.displayServer.updateDisplay(1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 0);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.3);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.4);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        animator.reverse();
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        this.windowServer.displayServer.updateDisplay(1.5);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.6);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.7);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.8);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.9);
        TKAssertExactEquals(view.layer.animationCount, 0);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 0);
        TKAssert(animationsComplete);


        view = UIView.init();
        view.position = JSPoint(0, 0);
        window.contentView.addSubview(view);

        animator = UIViewPropertyAnimator.initWithDuration(1);
        animationsRun = false;
        animationsComplete = false;
        animator.addAnimations(function(){
            view.position = JSPoint(100, 0);
            animationsRun = true;
        });
        animator.addCompletion(function(){
            animationsComplete = true;
        });
        TKAssert(!animationsRun);
        TKAssert(!animationsComplete);
        animator.start();
        TKAssert(animationsRun);
        this.windowServer.displayServer.updateDisplay(1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 0);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.3);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.4);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        animator.reverse();
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        this.windowServer.displayServer.updateDisplay(1.5);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.6);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.7);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.8);
        TKAssertFloatEquals(view.position.x, 0);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        TKAssert(!animationsComplete);
        animator.reverse();
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        this.windowServer.displayServer.updateDisplay(1.9);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.3);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 50);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.5);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 70);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.7);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 90);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.8);
        TKAssertExactEquals(view.layer.animationCount, 0);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 100);
        TKAssert(animationsComplete);
    },

    testPercentComplete: function(){
        var window = UIRootWindow.init();
        window.contentView = UIView.init();
        var view = UIView.init();
        view.position = JSPoint(0, 0);
        window.contentView.addSubview(view);
        window.makeKeyAndOrderFront();

        var animator = UIViewPropertyAnimator.initWithDuration(1);
        var animationsRun = false;
        var animationsComplete = false;
        animator.addAnimations(function(){
            view.position = JSPoint(100, 0);
            animationsRun = true;
        });
        animator.addCompletion(function(){
            animationsComplete = true;
        });
        TKAssert(!animationsRun);
        TKAssert(!animationsComplete);
        animator.start();
        TKAssert(animationsRun);
        this.windowServer.displayServer.updateDisplay(1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 0);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.1);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 10);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 20);
        TKAssert(!animationsComplete);
        animator.percentComplete = 0.6;
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        this.windowServer.displayServer.updateDisplay(1.3);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.4);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 70);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.5);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 80);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.6);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 90);
        TKAssert(!animationsComplete);
        animator.percentComplete = 0.3;
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        this.windowServer.displayServer.updateDisplay(1.7);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 30);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(1.8);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 40);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.0);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 60);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.2);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 80);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.3);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 90);
        TKAssert(!animationsComplete);
        this.windowServer.displayServer.updateDisplay(2.4);
        TKAssertExactEquals(view.layer.animationCount, 0);
        TKAssertFloatEquals(view.position.x, 100);
        TKAssertFloatEquals(view.layer.presentation.position.x, 100);
        TKAssert(animationsComplete);
    },

});