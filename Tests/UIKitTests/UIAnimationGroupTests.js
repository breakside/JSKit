// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, UIBasicAnimation, UIAnimationGroup, TKAssert, TKAssertEquals, TKAssertExactEquals, TKAssertObjectEquals, UILayer, TKAssertFloatEquals, JSColor, JSSize, JSPoint, JSRect, JSAffineTransform */
'use strict';

JSClass("UIAnimationGroupTests", TKTestSuite, {

    testUpdateForTime: function(){
        var layer = UILayer.init();
        var groupAnimation = UIAnimationGroup.init();
        var animation1 = UIBasicAnimation.initWithKeyPath('frame.size.width');
        var animation2 = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation1.duration = 1.000;
        animation1.fromValue = layer.model.frame.size.width = 0;
        layer.model.frame.size.width = 100;
        animation2.duration = 0.500;
        animation2.fromValue = layer.model.backgroundColor = JSColor.initWithRGBA(0.1, 0.2, 0.3, 0.4);
        groupAnimation.addAnimation(animation1);
        groupAnimation.addAnimation(animation2);
        groupAnimation.layer = layer;
        layer.model.backgroundColor = JSColor.initWithRGBA(0.2, 0.4, 0.6, 0.8);
        groupAnimation.updateForTime(0);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 0);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.1, 0.2, 0.3, 0.4));
        groupAnimation.updateForTime(0.100);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 10);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.12, 0.24, 0.36, 0.48));
        groupAnimation.updateForTime(0.400);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 40);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.18, 0.36, 0.54, 0.72));
        groupAnimation.updateForTime(0.900);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 90);
    },

    testIsComplete: function(){
        var layer = UILayer.init();
        var groupAnimation = UIAnimationGroup.init();
        var animation1 = UIBasicAnimation.initWithKeyPath('frame.size.width');
        var animation2 = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation1.duration = 1.000;
        animation1.fromValue = layer.model.frame.size.width = 0;
        layer.model.frame.size.width = 100;
        animation2.duration = 0.500;
        animation2.fromValue = layer.model.backgroundColor = JSColor.initWithRGBA(0.1, 0.2, 0.3, 0.4);
        groupAnimation.addAnimation(animation1);
        groupAnimation.addAnimation(animation2);
        groupAnimation.layer = layer;
        layer.model.backgroundColor = JSColor.initWithRGBA(0.2, 0.4, 0.6, 0.8);
        groupAnimation.updateForTime(0);
        TKAssert(!animation1.isComplete);
        TKAssert(!animation2.isComplete);
        TKAssert(!groupAnimation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 0);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.1, 0.2, 0.3, 0.4));
        groupAnimation.updateForTime(0.100);
        TKAssert(!animation1.isComplete);
        TKAssert(!animation2.isComplete);
        TKAssert(!groupAnimation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 10);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.12, 0.24, 0.36, 0.48));
        groupAnimation.updateForTime(0.400);
        TKAssert(!animation1.isComplete);
        TKAssert(!animation2.isComplete);
        TKAssert(!groupAnimation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 40);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.18, 0.36, 0.54, 0.72));
        groupAnimation.updateForTime(0.500);
        TKAssert(!animation1.isComplete);
        TKAssert(animation2.isComplete);
        TKAssert(!groupAnimation.isComplete);
        groupAnimation.updateForTime(0.900);
        TKAssert(!animation1.isComplete);
        TKAssert(animation2.isComplete);
        TKAssert(!groupAnimation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 90);
        groupAnimation.updateForTime(1.000);
        TKAssert(animation1.isComplete);
        TKAssert(animation2.isComplete);
        TKAssert(groupAnimation.isComplete);
    },

    testSetLayer: function(){
        var layer = UILayer.init();
        var groupAnimation = UIAnimationGroup.init();
        var animation1 = UIBasicAnimation.initWithKeyPath('frame.size.width');
        var animation2 = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation1.duration = 1.000;
        animation1.fromValue = layer.model.frame.size.width = 0;
        layer.model.frame.size.width = 100;
        animation2.duration = 0.500;
        animation2.fromValue = layer.model.backgroundColor = JSColor.initWithRGBA(0.1, 0.2, 0.3, 0.4);
        groupAnimation.addAnimation(animation1);
        groupAnimation.addAnimation(animation2);
        groupAnimation.layer = layer;
        TKAssertExactEquals(groupAnimation.layer, layer);
        TKAssertExactEquals(animation1.layer, layer);
        TKAssertExactEquals(animation2.layer, layer);


        layer = UILayer.init();
        groupAnimation = UIAnimationGroup.init();
        groupAnimation.layer = layer;
        animation1 = UIBasicAnimation.initWithKeyPath('frame.size.width');
        animation2 = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation1.duration = 1.000;
        animation1.fromValue = layer.model.frame.size.width = 0;
        layer.model.frame.size.width = 100;
        animation2.duration = 0.500;
        animation2.fromValue = layer.model.backgroundColor = JSColor.initWithRGBA(0.1, 0.2, 0.3, 0.4);
        groupAnimation.addAnimation(animation1);
        groupAnimation.addAnimation(animation2);
        TKAssertExactEquals(groupAnimation.layer, layer);
        TKAssertExactEquals(animation1.layer, layer);
        TKAssertExactEquals(animation2.layer, layer);
    }

});