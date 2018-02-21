// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
// #import "MockWindowServer.js"
/* global JSClass, TKTestSuite, UILayer, MockWindowServer, TKAssert, TKAssertEquals, TKAssertExactEquals, TKAssertNull, TKAssertThrows, TKAssertFloatEquals, TKAssertObjectEquals, JSRect, JSPoint, JSSize, JSColor, JSAffineTransform, JSConstraintBox */
'use strict';

JSClass("UILayerTests", TKTestSuite, {

    windowServer: null,

    setup: function(){
        this.windowServer = MockWindowServer.init();
    },

    tearDown: function(){
        this.windowServer = null;
    },

    testInitialState: function(){
        var layer = UILayer.init();
        TKAssertObjectEquals(layer.frame, JSRect.Zero);
        TKAssertObjectEquals(layer.bounds, JSRect.Zero);
        TKAssertObjectEquals(layer.position, JSPoint.Zero);
        TKAssertObjectEquals(layer.anchorPoint, JSPoint.UnitCenter);
        TKAssertObjectEquals(layer.transform, JSAffineTransform.Identity);
        TKAssert(!layer.hidden);
        TKAssertFloatEquals(layer.alpha, 1.0);
        TKAssertNull(layer.backgroundColor);
        TKAssertFloatEquals(layer.borderWidth, 0.0);
        TKAssertNull(layer.borderColor);
        TKAssertFloatEquals(layer.cornerRadius, 0.0);
    },

    testFrameUpdatesBounds: function(){
        var layer = UILayer.init();
        layer.frame = JSRect(100, 200, 500, 600);
        TKAssertFloatEquals(layer.bounds.origin.x, 0);
        TKAssertFloatEquals(layer.bounds.origin.y, 0);
        TKAssertFloatEquals(layer.bounds.size.width, 500);
        TKAssertFloatEquals(layer.bounds.size.height, 600);
    },

    testFrameUpdatesPosition: function(){
        var layer = UILayer.init();
        layer.frame = JSRect(100, 200, 500, 600);
        TKAssertFloatEquals(layer.position.x, 350);
        TKAssertFloatEquals(layer.position.y, 500);
    },

    testBoundsUpdatesFrame: function(){
        var layer = UILayer.init();
        layer.bounds = JSRect(100, 200, 500, 600);
        TKAssertFloatEquals(layer.frame.origin.x, 0);
        TKAssertFloatEquals(layer.frame.origin.y, 0);
        TKAssertFloatEquals(layer.frame.size.width, 500);
        TKAssertFloatEquals(layer.frame.size.height, 600);
    },

    testBoundsUpdatesPosition: function(){
        var layer = UILayer.init();
        layer.bounds = JSRect(100, 200, 500, 600);
        TKAssertFloatEquals(layer.position.x, 250);
        TKAssertFloatEquals(layer.position.y, 300);
    },

    testAnchorPointUpdatesFrame: function(){
        var layer = UILayer.init();
        layer.frame = JSRect(100, 200, 500, 600);
        TKAssertFloatEquals(layer.position.x, 350);
        TKAssertFloatEquals(layer.position.y, 500);
        layer.anchorPoint = JSPoint.Zero;
        TKAssertFloatEquals(layer.position.x, 350);
        TKAssertFloatEquals(layer.position.y, 500);
        TKAssertFloatEquals(layer.frame.origin.x, 350);
        TKAssertFloatEquals(layer.frame.origin.y, 500);
        TKAssertFloatEquals(layer.frame.size.width, 500);
        TKAssertFloatEquals(layer.frame.size.height, 600);
    },

    testTransformUpdatesFrame: function(){
        var layer = UILayer.init();
        layer.frame = JSRect(100, 200, 500, 600);
        layer.transform = layer.transform.rotatedByDegrees(90);
        TKAssertFloatEquals(layer.frame.origin.x, 50);
        TKAssertFloatEquals(layer.frame.origin.y, 250);
        TKAssertFloatEquals(layer.frame.size.width, 600);
        TKAssertFloatEquals(layer.frame.size.height, 500);
    },

    testAddSublayer: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        TKAssertEquals(layer1.sublayers.length, 0);
        TKAssertNull(layer2.superlayer);
        var inserted = layer1.addSublayer(layer2);
        TKAssertExactEquals(inserted, layer2);
        TKAssertEquals(layer1.sublayers.length, 1);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        layer1.addSublayer(layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        TKAssertEquals(layer3.level, 1);
    },

    testInsertSublayerAtIndex: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        TKAssertEquals(layer1.sublayers.length, 0);
        TKAssertNull(layer2.superlayer);
        var inserted = layer1.insertSublayerAtIndex(layer2, 0);
        TKAssertExactEquals(inserted, layer2);
        TKAssertEquals(layer1.sublayers.length, 1);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        layer1.insertSublayerAtIndex(layer3, 0);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertExactEquals(layer1.sublayers[1], layer2);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 1);
        TKAssertEquals(layer3.level, 0);
        layer1.insertSublayerAtIndex(layer2, 0);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        TKAssertEquals(layer3.level, 1);
    },

    testInsertSublayerBeforeSibling: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        TKAssertThrows(function(){
            layer1.insertSublayerBeforeSibling(layer3, layer2);
        });
        layer1.addSublayer(layer2);
        var inserted = layer1.insertSublayerBeforeSibling(layer3, layer2);
        TKAssertExactEquals(inserted, layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertExactEquals(layer1.sublayers[1], layer2);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 1);
        TKAssertEquals(layer3.level, 0);
    },

    testInsertSublayerAfterSibling: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        TKAssertThrows(function(){
            layer1.insertSublayerAfterSibling(layer3, layer2);
        });
        layer1.addSublayer(layer2);
        var inserted = layer1.insertSublayerAfterSibling(layer3, layer2);
        TKAssertExactEquals(inserted, layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        TKAssertEquals(layer3.level, 1);
    },

    testRemoveSublayer: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        layer1.addSublayer(layer2);
        layer1.addSublayer(layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        TKAssertEquals(layer3.level, 1);
        layer1.removeSublayer(layer2);
        TKAssertEquals(layer1.sublayers.length, 1);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertNull(layer2.superlayer);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer3.level, 0);
    },

    testRemoveFromSuperlayer: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        layer1.addSublayer(layer2);
        layer1.addSublayer(layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        TKAssertEquals(layer3.level, 1);
        layer2.removeFromSuperlayer();
        TKAssertEquals(layer1.sublayers.length, 1);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertNull(layer2.superlayer);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer3.level, 0);
    },

    testRemoveAllSublayers: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        layer1.addSublayer(layer2);
        layer1.addSublayer(layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.level, 0);
        TKAssertEquals(layer3.level, 1);
        layer1.removeAllSublayers();
        TKAssertEquals(layer1.sublayers.length, 0);
        TKAssertNull(layer2.superlayer);
        TKAssertNull(layer3.superlayer);
    },

    testFrameForConstraintBoxInBounds: function(){
        var bounds = JSRect(10, 20, 300, 400);

        var box = JSConstraintBox.Size(40, 50);
        var frame = UILayer.FrameForConstraintBoxInBounds(box, bounds);
        TKAssertFloatEquals(frame.origin.x, 130);
        TKAssertFloatEquals(frame.origin.y, 175);
        TKAssertFloatEquals(frame.size.width, 40);
        TKAssertFloatEquals(frame.size.height, 50);

        box = JSConstraintBox.Margin(1,2,3,4);
        frame = UILayer.FrameForConstraintBoxInBounds(box, bounds);
        TKAssertFloatEquals(frame.origin.x, 4);
        TKAssertFloatEquals(frame.origin.y, 1);
        TKAssertFloatEquals(frame.size.width, 294);
        TKAssertFloatEquals(frame.size.height, 396);

        box = JSConstraintBox({top: 1, left: 2, width: 50});
        frame = UILayer.FrameForConstraintBoxInBounds(box, bounds);
        TKAssertFloatEquals(frame.origin.x, 2);
        TKAssertFloatEquals(frame.origin.y, 1);
        TKAssertFloatEquals(frame.size.width, 50);
        TKAssertFloatEquals(frame.size.height, 0);

        box = JSConstraintBox({top: 1, left: 2, height: 50});
        frame = UILayer.FrameForConstraintBoxInBounds(box, bounds);
        TKAssertFloatEquals(frame.origin.x, 2);
        TKAssertFloatEquals(frame.origin.y, 1);
        TKAssertFloatEquals(frame.size.width, 0);
        TKAssertFloatEquals(frame.size.height, 50);

        box = JSConstraintBox({bottom: 1, right: 2, height: 50, width: 30});
        frame = UILayer.FrameForConstraintBoxInBounds(box, bounds);
        TKAssertFloatEquals(frame.origin.x, 268);
        TKAssertFloatEquals(frame.origin.y, 349);
        TKAssertFloatEquals(frame.size.width, 30);
        TKAssertFloatEquals(frame.size.height, 50);
    },

    // TODO: point/rect conversions
    // TODO: hit testing
    // TODO: animations
    // TODO: layout & display (maybe some of this goes in UIDisplayServerTests?)
    // TODO: JSContext.drawLayerProperties (extension method defined by UILayer)

});