// #import UIKit
// #import TestKit
// #import "MockWindowServer.js"
/* global JSClass, TKTestSuite, JSFont, JSPoint, UIApplication, UIRootWindow, UIViewPropertyAnimator, MockWindowServer, UIView, TKExpectation */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
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
        TKAssert(!animationsComplete);
    }

});