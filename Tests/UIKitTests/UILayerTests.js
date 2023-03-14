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

// #import UIKit
// #import TestKit
// #import UIKitTesting
'use strict';

JSClass("UILayerTests", TKTestSuite, {

    windowServer: null,

    setup: function(){
        this.windowServer = UIMockWindowServer.init();
    },

    teardown: function(){
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
        TKAssertEquals(layer2.sublayerIndex, 0);
        layer1.addSublayer(layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.sublayerIndex, 0);
        TKAssertEquals(layer3.sublayerIndex, 1);
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
        TKAssertEquals(layer2.sublayerIndex, 0);
        layer1.insertSublayerAtIndex(layer3, 0);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertExactEquals(layer1.sublayers[1], layer2);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.sublayerIndex, 1);
        TKAssertEquals(layer3.sublayerIndex, 0);
        layer1.insertSublayerAtIndex(layer2, 0);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.sublayerIndex, 0);
        TKAssertEquals(layer3.sublayerIndex, 1);
    },

    testInsertSublayerBeforeSibling: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        TKAssertThrows(function(){
            layer1.insertSublayerBelowSibling(layer3, layer2);
        });
        layer1.addSublayer(layer2);
        var inserted = layer1.insertSublayerBelowSibling(layer3, layer2);
        TKAssertExactEquals(inserted, layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertExactEquals(layer1.sublayers[1], layer2);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.sublayerIndex, 1);
        TKAssertEquals(layer3.sublayerIndex, 0);
    },

    testInsertSublayerAfterSibling: function(){
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer3 = UILayer.init();
        TKAssertThrows(function(){
            layer1.insertSublayerAboveSibling(layer3, layer2);
        });
        layer1.addSublayer(layer2);
        var inserted = layer1.insertSublayerAboveSibling(layer3, layer2);
        TKAssertExactEquals(inserted, layer3);
        TKAssertEquals(layer1.sublayers.length, 2);
        TKAssertExactEquals(layer1.sublayers[0], layer2);
        TKAssertExactEquals(layer1.sublayers[1], layer3);
        TKAssertExactEquals(layer2.superlayer, layer1);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer2.sublayerIndex, 0);
        TKAssertEquals(layer3.sublayerIndex, 1);
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
        TKAssertEquals(layer2.sublayerIndex, 0);
        TKAssertEquals(layer3.sublayerIndex, 1);
        layer1.removeSublayer(layer2);
        TKAssertEquals(layer1.sublayers.length, 1);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertNull(layer2.superlayer);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer3.sublayerIndex, 0);
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
        TKAssertEquals(layer2.sublayerIndex, 0);
        TKAssertEquals(layer3.sublayerIndex, 1);
        layer2.removeFromSuperlayer();
        TKAssertEquals(layer1.sublayers.length, 1);
        TKAssertExactEquals(layer1.sublayers[0], layer3);
        TKAssertNull(layer2.superlayer);
        TKAssertExactEquals(layer3.superlayer, layer1);
        TKAssertEquals(layer3.sublayerIndex, 0);
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
        TKAssertEquals(layer2.sublayerIndex, 0);
        TKAssertEquals(layer3.sublayerIndex, 1);
        layer1.removeAllSublayers();
        TKAssertEquals(layer1.sublayers.length, 0);
        TKAssertNull(layer2.superlayer);
        TKAssertNull(layer3.superlayer);
    },

    testConvertPointToLayer: function(){
        var point;
        var layer1 = UILayer.init();
        var layer1_1 = UILayer.init();
        var layer1_1_1 = UILayer.init();
        var layer1_2 = UILayer.init();
        var layer1_2_1 = UILayer.init();
        var layer2 = UILayer.init();
        var layer2_1 = UILayer.init();

        layer1.addSublayer(layer1_1);
        layer1_1.addSublayer(layer1_1_1);
        layer1.addSublayer(layer1_2);
        layer1_2.addSublayer(layer1_2_1);
        layer2.addSublayer(layer2_1);

        layer1.frame = JSRect(0, 0, 800, 600);
        layer1_1.frame = JSRect(10, 20, 100, 100);
        layer1_1_1.frame = JSRect(1, 2, 3, 4);
        layer1_2.frame = JSRect(120, 15, 200, 200);
        layer1_2_1.frame = JSRect(6, 7, 50, 40);
        layer2.frame = JSRect(300, 400, 50, 50);
        layer2_1.frame = JSRect(-5, -6, 20, 30);

        // superlayer to sublayer
        point = layer1.convertPointToLayer(JSPoint(5, 6), layer1_1);
        TKAssertEquals(point.x, -5);
        TKAssertEquals(point.y, -14);
        point = layer1.convertPointToLayer(JSPoint(50, 60), layer1_1);
        TKAssertEquals(point.x, 40);
        TKAssertEquals(point.y, 40);
        point = layer1.convertPointToLayer(JSPoint(500, 600), layer1_1);
        TKAssertEquals(point.x, 490);
        TKAssertEquals(point.y, 580);

        // sublayer to superlayer
        point = layer1_1.convertPointToLayer(JSPoint(5, 6), layer1);
        TKAssertEquals(point.x, 15);
        TKAssertEquals(point.y, 26);
        point = layer1_1.convertPointToLayer(JSPoint(-5, -6), layer1);
        TKAssertEquals(point.x, 5);
        TKAssertEquals(point.y, 14);
        point = layer1_1.convertPointToLayer(JSPoint(500, 600), layer1);
        TKAssertEquals(point.x, 510);
        TKAssertEquals(point.y, 620);

        // grandparent to grandchild
        point = layer1.convertPointToLayer(JSPoint(5, 6), layer1_2_1);
        TKAssertEquals(point.x, -121);
        TKAssertEquals(point.y, -16);
        point = layer1.convertPointToLayer(JSPoint(150, 60), layer1_2_1);
        TKAssertEquals(point.x, 24);
        TKAssertEquals(point.y, 38);
        point = layer1.convertPointToLayer(JSPoint(500, 600), layer1_2_1);
        TKAssertEquals(point.x, 374);
        TKAssertEquals(point.y, 578);

        // grandchild to grandparent
        point = layer1_2_1.convertPointToLayer(JSPoint(5, 6), layer1);
        TKAssertEquals(point.x, 131);
        TKAssertEquals(point.y, 28);
        point = layer1_2_1.convertPointToLayer(JSPoint(-5, -6), layer1);
        TKAssertEquals(point.x, 121);
        TKAssertEquals(point.y, 16);
        point = layer1_2_1.convertPointToLayer(JSPoint(500, 600), layer1);
        TKAssertEquals(point.x, 626);
        TKAssertEquals(point.y, 622);

        // sibling to sibling
        point = layer1_1.convertPointToLayer(JSPoint(5, 6), layer1_2);
        TKAssertEquals(point.x, -105);
        TKAssertEquals(point.y, 11);
        point = layer1_1.convertPointToLayer(JSPoint(-5, -6), layer1_2);
        TKAssertEquals(point.x, -115);
        TKAssertEquals(point.y, -1);
        point = layer1_1.convertPointToLayer(JSPoint(500, 600), layer1_2);
        TKAssertEquals(point.x, 390);
        TKAssertEquals(point.y, 605);

        // aunt to neice
        point = layer1_1.convertPointToLayer(JSPoint(5, 6), layer1_2_1);
        TKAssertEquals(point.x, -111);
        TKAssertEquals(point.y, 4);
        point = layer1_1.convertPointToLayer(JSPoint(-5, -6), layer1_2_1);
        TKAssertEquals(point.x, -121);
        TKAssertEquals(point.y, -8);
        point = layer1_1.convertPointToLayer(JSPoint(500, 600), layer1_2_1);
        TKAssertEquals(point.x, 384);
        TKAssertEquals(point.y, 598);

        // neice to aunt
        point = layer1_2_1.convertPointToLayer(JSPoint(5, 6), layer1_1);
        TKAssertEquals(point.x, 121);
        TKAssertEquals(point.y, 8);
        point = layer1_2_1.convertPointToLayer(JSPoint(-5, -6), layer1_1);
        TKAssertEquals(point.x, 111);
        TKAssertEquals(point.y, -4);
        point = layer1_2_1.convertPointToLayer(JSPoint(500, 600), layer1_1);
        TKAssertEquals(point.x, 616);
        TKAssertEquals(point.y, 602);

        // cousin to cousin
        point = layer1_2_1.convertPointToLayer(JSPoint(5, 6), layer1_1_1);
        TKAssertEquals(point.x, 120);
        TKAssertEquals(point.y, 6);
        point = layer1_2_1.convertPointToLayer(JSPoint(-5, -6), layer1_1_1);
        TKAssertEquals(point.x, 110);
        TKAssertEquals(point.y, -6);
        point = layer1_2_1.convertPointToLayer(JSPoint(500, 600), layer1_1_1);
        TKAssertEquals(point.x, 615);
        TKAssertEquals(point.y, 600);

        // root to other root
        point = layer1.convertPointToLayer(JSPoint(5, 6), layer2);
        TKAssertEquals(point.x, -295);
        TKAssertEquals(point.y, -394);
        point = layer1.convertPointToLayer(JSPoint(-5, -6), layer2);
        TKAssertEquals(point.x, -305);
        TKAssertEquals(point.y, -406);
        point = layer1.convertPointToLayer(JSPoint(500, 600), layer2);
        TKAssertEquals(point.x, 200);
        TKAssertEquals(point.y, 200);

        // root to other root child
        point = layer2.convertPointToLayer(JSPoint(5, 6), layer1_1);
        TKAssertEquals(point.x, 295);
        TKAssertEquals(point.y, 386);
        point = layer2.convertPointToLayer(JSPoint(-5, -6), layer1_1);
        TKAssertEquals(point.x, 285);
        TKAssertEquals(point.y, 374);
        point = layer2.convertPointToLayer(JSPoint(500, 600), layer1_1);
        TKAssertEquals(point.x, 790);
        TKAssertEquals(point.y, 980);

        // root child to other root
        point = layer2_1.convertPointToLayer(JSPoint(5, 6), layer1);
        TKAssertEquals(point.x, 300);
        TKAssertEquals(point.y, 400);
        point = layer2_1.convertPointToLayer(JSPoint(-5, -6), layer1);
        TKAssertEquals(point.x, 290);
        TKAssertEquals(point.y, 388);
        point = layer2_1.convertPointToLayer(JSPoint(500, 600), layer1);
        TKAssertEquals(point.x, 795);
        TKAssertEquals(point.y, 994);

        // root child to other root child
        point = layer1_1.convertPointToLayer(JSPoint(5, 6), layer2_1);
        TKAssertEquals(point.x, -280);
        TKAssertEquals(point.y, -368);
        point = layer1_1.convertPointToLayer(JSPoint(-5, -6), layer2_1);
        TKAssertEquals(point.x, -290);
        TKAssertEquals(point.y, -380);
        point = layer1_1.convertPointToLayer(JSPoint(500, 600), layer2_1);
        TKAssertEquals(point.x, 215);
        TKAssertEquals(point.y, 226);
    },

    testConvertPointToLayerScrolled: function(){
        var grandparent = UILayer.init();
        var superlayer = UILayer.init();
        var layer = UILayer.init();
        grandparent.addSublayer(superlayer);
        superlayer.addSublayer(layer);

        grandparent.bounds = JSRect(0, 0, 200, 200);
        superlayer.frame = JSRect(3, 4, 100, 100);
        layer.frame = JSRect(10, 20, 30, 40);

        var point = layer.convertPointToLayer(JSPoint(1, 2), superlayer);
        TKAssertFloatEquals(point.x, 11);
        TKAssertFloatEquals(point.y, 22);
        point = layer.convertPointToLayer(JSPoint(1, 2), grandparent);
        TKAssertFloatEquals(point.x, 14);
        TKAssertFloatEquals(point.y, 26);
        point = layer.convertPointFromLayer(JSPoint(11, 22), superlayer);
        TKAssertFloatEquals(point.x, 1);
        TKAssertFloatEquals(point.y, 2);
        point = layer.convertPointFromLayer(JSPoint(15, 27), grandparent);
        TKAssertFloatEquals(point.x, 2);
        TKAssertFloatEquals(point.y, 3);

        superlayer.bounds = JSRect(5, 7, 100, 100);
        point = layer.convertPointToLayer(JSPoint(1, 2), superlayer);
        TKAssertFloatEquals(point.x, 11);
        TKAssertFloatEquals(point.y, 22);
        point = layer.convertPointToLayer(JSPoint(1, 2), grandparent);
        TKAssertFloatEquals(point.x, 9);
        TKAssertFloatEquals(point.y, 19);
        point = layer.convertPointFromLayer(JSPoint(11, 22), superlayer);
        TKAssertFloatEquals(point.x, 1);
        TKAssertFloatEquals(point.y, 2);
        point = layer.convertPointFromLayer(JSPoint(10, 20), grandparent);
        TKAssertFloatEquals(point.x, 2);
        TKAssertFloatEquals(point.y, 3);
    },

    testConvertPointToLayerTransformed: function(){
        var grandparent = UILayer.init();
        var superlayer = UILayer.init();
        var layer = UILayer.init();
        grandparent.addSublayer(superlayer);
        superlayer.addSublayer(layer);

        grandparent.bounds = JSRect(0, 0, 200, 200);
        superlayer.frame = JSRect(3, 4, 100, 100);
        superlayer.transform = JSAffineTransform.Translated(12, 34);
        layer.frame = JSRect(10, 20, 30, 40);
        layer.transform = JSAffineTransform.Scaled(2, 3); // center at 25,40; 2x origin at -5,-20

        var point = layer.convertPointToLayer(JSPoint(1, 2), superlayer);
        TKAssertFloatEquals(point.x, -3);
        TKAssertFloatEquals(point.y, -14);
        point = layer.convertPointToLayer(JSPoint(1, 2), grandparent);
        TKAssertFloatEquals(point.x, 12);
        TKAssertFloatEquals(point.y, 24);
        point = layer.convertPointFromLayer(JSPoint(-3, -14), superlayer);
        TKAssertFloatEquals(point.x, 1);
        TKAssertFloatEquals(point.y, 2);
        point = layer.convertPointFromLayer(JSPoint(14, 27), grandparent);
        TKAssertFloatEquals(point.x, 2);
        TKAssertFloatEquals(point.y, 3);

        superlayer.bounds = JSRect(5, 7, 100, 100);
        point = layer.convertPointToLayer(JSPoint(1, 2), superlayer);
        TKAssertFloatEquals(point.x, -3);
        TKAssertFloatEquals(point.y, -14);
        point = layer.convertPointToLayer(JSPoint(1, 2), grandparent);
        TKAssertFloatEquals(point.x, 7);
        TKAssertFloatEquals(point.y, 17);
        point = layer.convertPointFromLayer(JSPoint(-3, -14), superlayer);
        TKAssertFloatEquals(point.x, 1);
        TKAssertFloatEquals(point.y, 2);
        point = layer.convertPointFromLayer(JSPoint(9, 20), grandparent);
        TKAssertFloatEquals(point.x, 2);
        TKAssertFloatEquals(point.y, 3);
    },

    testHitTest: function(){
        var layer = UILayer.init();
        layer.bounds = JSRect(0, 0, 100, 100);
        var hit = layer.hitTest(JSPoint(0, 0));
        TKAssertExactEquals(hit, layer);
        hit = layer.hitTest(JSPoint(99.9, 99.9));
        TKAssertExactEquals(hit, layer);
        hit = layer.hitTest(JSPoint(100, 99.9));
        TKAssertExactEquals(hit, null);
        hit = layer.hitTest(JSPoint(99.0, 100));
        TKAssertExactEquals(hit, null);
        hit = layer.hitTest(JSPoint(0, -0.1));
        TKAssertExactEquals(hit, null);
        hit = layer.hitTest(JSPoint(-0.1, 0));
        TKAssertExactEquals(hit, null);

        var sublayer1 = UILayer.init();
        sublayer1.frame = JSRect(10, 10, 50, 50);
        var sublayer2 = UILayer.init();
        sublayer2.frame = JSRect(40, 40, 50, 50);
        layer.addSublayer(sublayer1);
        layer.addSublayer(sublayer2);
        hit = layer.hitTest(JSPoint(9, 9));
        TKAssertExactEquals(hit, layer);
        hit = layer.hitTest(JSPoint(90, 90));
        TKAssertExactEquals(hit, layer);
        hit = layer.hitTest(JSPoint(10, 10));
        TKAssertExactEquals(hit, sublayer1);
        hit = layer.hitTest(JSPoint(39, 39));
        TKAssertExactEquals(hit, sublayer1);
        hit = layer.hitTest(JSPoint(40, 40));
        TKAssertExactEquals(hit, sublayer2);
        hit = layer.hitTest(JSPoint(89, 89));
        TKAssertExactEquals(hit, sublayer2);

        sublayer1.zIndex = 1;
        hit = layer.hitTest(JSPoint(40, 40));
        TKAssertExactEquals(hit, sublayer1);
        hit = layer.hitTest(JSPoint(59, 59));
        TKAssertExactEquals(hit, sublayer1);
        hit = layer.hitTest(JSPoint(60, 60));
        TKAssertExactEquals(hit, sublayer2);

        sublayer1.zIndex = 0;
        hit = layer.hitTest(JSPoint(40, 40));
        TKAssertExactEquals(hit, sublayer2);
        hit = layer.hitTest(JSPoint(59, 59));
        TKAssertExactEquals(hit, sublayer2);
        hit = layer.hitTest(JSPoint(60, 60));
        TKAssertExactEquals(hit, sublayer2);
    },

    // TODO: point/rect conversions with rotated transformations
    // TODO: animations
    // TODO: layout & display (maybe some of this goes in UIDisplayServerTests?)
    // TODO: JSContext.drawLayerProperties (extension method defined by UILayer)

});