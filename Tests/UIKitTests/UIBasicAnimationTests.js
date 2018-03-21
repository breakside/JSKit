// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, UIBasicAnimation, TKAssert, TKAssertEquals, TKAssertExactEquals, TKAssertObjectEquals, UILayer, TKAssertFloatEquals, JSColor, JSSize, JSPoint, JSRect, JSAffineTransform */
'use strict';

JSClass("UIBasicAnimationTests", TKTestSuite, {

    testUpdateForTime: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('frame.size.width');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.frame.size.width = 0;
        layer.model.frame.size.width = 100;
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 0);
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 10);
        animation.updateForTime(500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 50);
        animation.updateForTime(1000);
        TKAssert(animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 50);
    },

    testInterpolateNull: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.backgroundColor = null;
        layer.model.backgroundColor = JSColor.blackColor();
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertExactEquals(layer.presentation.backgroundColor, null);

        layer = UILayer.init();
        animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.backgroundColor = JSColor.blackColor();
        layer.model.backgroundColor = null;
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.blackColor());
    },

    testInterpolateNumber: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('frame.size.width');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.frame.size.width = 0;
        layer.model.frame.size.width = 100;
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 0);
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 10);
        animation.updateForTime(500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 50);
        animation.updateForTime(1000);
        TKAssert(animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 50);
    },

    testInterpolatePoint: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('frame.origin');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.frame.origin = JSPoint(0, 0);
        layer.model.frame.origin = JSPoint(100, 200);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 0);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 0);
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 10);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 20);
        animation.updateForTime(200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 20);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 40);
        animation.updateForTime(900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 90);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 180);
    },

    testInterpolateSize: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('frame.size');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.frame.size = JSSize(0, 0);
        layer.model.frame.size = JSSize(100, 200);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 0);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 0);
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 10);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 20);
        animation.updateForTime(200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 20);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 40);
        animation.updateForTime(900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 90);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 180);
    },

    testInterpolateRect: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('frame');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.frame = JSRect(0, 0, 0, 0);
        layer.model.frame = JSRect(100, 200, 300, 400);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 0);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 0);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 0);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 0);
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 10);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 20);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 30);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 40);
        animation.updateForTime(200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 20);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 40);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 60);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 80);
        animation.updateForTime(900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.frame.origin.x, 90);
        TKAssertFloatEquals(layer.presentation.frame.origin.y, 180);
        TKAssertFloatEquals(layer.presentation.frame.size.width, 270);
        TKAssertFloatEquals(layer.presentation.frame.size.height, 360);
    },

    testInterpolateAffineTransform: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('transform');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.transform = JSAffineTransform.Identity;
        layer.model.transform = layer.model.transform.translatedBy(10, 20).scaledBy(3, 4);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 1);
        TKAssertFloatEquals(layer.presentation.transform.d, 1);
        TKAssertFloatEquals(layer.presentation.transform.tx, 0);
        TKAssertFloatEquals(layer.presentation.transform.ty, 0);
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 1.2);
        TKAssertFloatEquals(layer.presentation.transform.d, 1.3);
        TKAssertFloatEquals(layer.presentation.transform.tx, 1);
        TKAssertFloatEquals(layer.presentation.transform.ty, 2);
        animation.updateForTime(200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 1.4);
        TKAssertFloatEquals(layer.presentation.transform.d, 1.6);
        TKAssertFloatEquals(layer.presentation.transform.tx, 2);
        TKAssertFloatEquals(layer.presentation.transform.ty, 4);
        animation.updateForTime(900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 2.8);
        TKAssertFloatEquals(layer.presentation.transform.d, 3.7);
        TKAssertFloatEquals(layer.presentation.transform.tx, 9);
        TKAssertFloatEquals(layer.presentation.transform.ty, 18);
    },

    testInterpolate1Color: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.backgroundColor = JSColor.blackColor();
        layer.model.backgroundColor = JSColor.whiteColor();
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.blackColor());
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithWhite(0.1));
        animation.updateForTime(200);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithWhite(0.2));
        animation.updateForTime(900);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithWhite(0.9));
    },

    testInterpolate3Color: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.backgroundColor = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.0, 0.2, 0.4]);
        layer.model.backgroundColor = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.0, 0.2, 0.4]));
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.02, 0.24, 0.46]));
        animation.updateForTime(200);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.04, 0.28, 0.52]));
        animation.updateForTime(900);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.18, 0.56, 0.94]));
    },

    testInterpolate4Color: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1000;
        animation.fromValue = layer.model.backgroundColor = JSColor.initWithRGBA(0.0, 0.2, 0.4, 0.6);
        layer.model.backgroundColor = JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.0, 0.2, 0.4, 0.6));
        animation.updateForTime(100);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.02, 0.24, 0.46, 0.64));
        animation.updateForTime(200);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.04, 0.28, 0.52, 0.68));
        animation.updateForTime(900);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.18, 0.56, 0.94, 0.96));
    }

});