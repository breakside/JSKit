// #import UIKit
// #import Testkit
/* global JSClass, TKTestSuite, UIPropertyAnimation, TKAssertEquals, TKAssertExactEquals, UILayer, TKAssertNull */
'use strict';

JSClass("UIPropertyAnimationTests", TKTestSuite, {

    testConstructor: function(){
        var animation = UIPropertyAnimation.initWithKeyPath('test');
        TKAssertEquals(animation.keyPath, 'test');
        animation = UIPropertyAnimation.initWithKeyPath('test.key.path');
        TKAssertEquals(animation.keyPath, 'test.key.path');
    },

    testLayer: function(){
        var layer = UILayer.init();
        var animation = UIPropertyAnimation.initWithKeyPath('frame');
        animation.layer = layer;
        TKAssertExactEquals(animation.layer, layer);
        TKAssertExactEquals(animation.updateContext, layer.presentation);
        TKAssertEquals(animation.updateProperty, 'frame');

        animation = UIPropertyAnimation.initWithKeyPath('frame.size.width');
        animation.layer = layer;
        TKAssertExactEquals(animation.layer, layer);
        TKAssertExactEquals(animation.updateContext, layer.presentation.frame.size);
        TKAssertEquals(animation.updateProperty, 'width');

        animation.layer = null;
        TKAssertNull(animation.layer);
        TKAssertNull(animation.updateContext);
        TKAssertNull(animation.updateProperty);
    }

});