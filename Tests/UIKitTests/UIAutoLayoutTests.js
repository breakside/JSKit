// #import UIKit
// #import TestKit
// #import "MockWindowServer.js"
'use strict';

JSClass("UIAutolayoutTests", TKTestSuite, {


    testSuperviewSubview: function(){
        // Fixed subview size, top/left anchor
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 600));
        var subview1 = UIView.init();
        superview.addSubview(subview1);
        subview1.leftAnchor.constraintEqualTo(superview.leftAnchor, 10).active = true;
        subview1.topAnchor.constraintEqualTo(superview.topAnchor, 20).active = true;
        subview1.widthAnchor.constantConstraint(30).active = true;
        subview1.heightAnchor.constantConstraint(40).active = true;
        superview.layoutIfNeeded();
        TKAssertFloatEquals(superview.frame.origin.x, 0);
        TKAssertFloatEquals(superview.frame.origin.y, 0);
        TKAssertFloatEquals(superview.frame.size.height, 500);
        TKAssertFloatEquals(superview.frame.size.width, 600);
        TKAssertFloatEquals(subview1.frame.origin.x, 10);
        TKAssertFloatEquals(subview1.frame.origin.y, 20);
        TKAssertFloatEquals(subview1.frame.size.height, 30);
        TKAssertFloatEquals(subview1.frame.size.width, 40);

        // Fixed subview size bottom/right anchor
        superview = UIView.initWithFrame(JSRect(0, 0, 500, 600));
        subview1 = UIView.init();
        superview.addSubview(subview1);
        subview1.rightAnchor.constraintEqualTo(superview.rightAnchor, 10).active = true;
        subview1.bottomAnchor.constraintEqualTo(superview.bottomAnchor, 20).active = true;
        subview1.widthAnchor.constantConstraint(30).active = true;
        subview1.heightAnchor.constantConstraint(40).active = true;
        superview.layoutIfNeeded();
        TKAssertFloatEquals(superview.frame.origin.x, 0);
        TKAssertFloatEquals(superview.frame.origin.y, 0);
        TKAssertFloatEquals(superview.frame.size.height, 500);
        TKAssertFloatEquals(superview.frame.size.width, 600);
        TKAssertFloatEquals(subview1.frame.origin.x, 460);
        TKAssertFloatEquals(subview1.frame.origin.y, 540);
        TKAssertFloatEquals(subview1.frame.size.height, 30);
        TKAssertFloatEquals(subview1.frame.size.width, 40);

        // Flexible subview size
        superview = UIView.initWithFrame(JSRect(0, 0, 500, 600));
        subview1 = UIView.init();
        superview.addSubview(subview1);
        subview1.leftAnchor.constraintEqualTo(superview.leftAnchor, 10).active = true;
        subview1.topAnchor.constraintEqualTo(superview.topAnchor, 20).active = true;
        subview1.rightAnchor.constraintEqualTo(superview.rightAnchor, 30).active = true;
        subview1.bottomAnchor.constraintEqualTo(superview.bottomAnchor, 40).active = true;
        superview.layoutIfNeeded();
        TKAssertFloatEquals(superview.frame.origin.x, 0);
        TKAssertFloatEquals(superview.frame.origin.y, 0);
        TKAssertFloatEquals(superview.frame.size.height, 500);
        TKAssertFloatEquals(superview.frame.size.width, 600);
        TKAssertFloatEquals(subview1.frame.origin.x, 10);
        TKAssertFloatEquals(subview1.frame.origin.y, 20);
        TKAssertFloatEquals(subview1.frame.size.height, 460);
        TKAssertFloatEquals(subview1.frame.size.width, 540);

        // Flexible superview size
        superview = UIView.initWithFrame(JSRect(0, 0, 500, 600));
        subview1 = UIView.init();
        superview.addSubview(subview1);
        subview1.leftAnchor.constraintEqualTo(superview.leftAnchor, 10).active = true;
        subview1.topAnchor.constraintEqualTo(superview.topAnchor, 20).active = true;
        subview1.rightAnchor.constraintEqualTo(superview.rightAnchor, 30).active = true;
        subview1.bottomAnchor.constraintEqualTo(superview.bottomAnchor, 40).active = true;
        subview1.widthAnchor.constantConstraint(50).active = true;
        subview1.heightAnchor.constantConstraint(60).active = true;
        superview.layoutIfNeeded();
        TKAssertFloatEquals(superview.frame.origin.x, 0);
        TKAssertFloatEquals(superview.frame.origin.y, 0);
        TKAssertFloatEquals(superview.frame.size.height, 90);
        TKAssertFloatEquals(superview.frame.size.width, 120);
        TKAssertFloatEquals(subview1.frame.origin.x, 10);
        TKAssertFloatEquals(subview1.frame.origin.y, 20);
        TKAssertFloatEquals(subview1.frame.size.height, 50);
        TKAssertFloatEquals(subview1.frame.size.width, 60);
    },

    testSiblingViews: function(){
    },

    testIntrinsicSize: function(){
    },

    testContentHugging: function(){
    },

    testContentCompressionResistance: function(){
    },

    testLayoutGuides: function(){
    },

    testLayoutMargins: function(){
    },

    testNonSiblingViews: function(){
    },

    testLessThanConstraints: function(){
    },

    testGreaterThanConstraints: function(){
    },

    testOptionalConstraints: function(){
    },

    testHiddenViews: function(){
    },

    testAddedViewTriggersLayout: function(){
    },

    testRemovedViewTriggersLayout: function(){
    },

    testManualLayoutSubviews: function(){
    },

    testConstraintOrderIrrelevance: function(){
    }

});