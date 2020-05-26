// #import TestKit
// #import UIKit
'use strict';

JSClass("UILayoutAnchorTests", TKTestSuite, {

    testInitWithItemAttribute: function(){
        var view = UIView.init();
        var anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.left);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.left);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.x);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.right);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.right);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.x);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.leading);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.leading);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.x);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.trailing);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.trailing);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.x);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.centerX);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.x);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.top);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.top);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.y);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.bottom);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.bottom);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.y);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.centerY);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.centerY);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.y);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.firstBaseline);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.firstBaseline);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.y);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.lastBaseline);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.lastBaseline);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.y);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.width);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.width);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.dimension);

        anchor = UILayoutAnchor.initWithItemAttribute(view, UILayoutAttribute.height);
        TKAssertExactEquals(anchor.item, view);
        TKAssertExactEquals(anchor.attribute, UILayoutAttribute.height);
        TKAssertExactEquals(anchor.type, UILayoutAnchor.Type.dimension);
    },

    testConstraintEqualTo: function(){
        var view1 = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view2 = UIView.init();
        view1.addSubview(view2);

        var anchor1 = UILayoutAnchor.initWithItemAttribute(view1, UILayoutAttribute.centerX);
        var anchor2 = UILayoutAnchor.initWithItemAttribute(view2, UILayoutAttribute.left);

        var constraint = anchor1.constraintEqualTo(anchor2);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.equal);
        TKAssertExactEquals(constraint.constant, 0);

        constraint = anchor1.constraintEqualTo(anchor2, 10);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.equal);
        TKAssertExactEquals(constraint.constant, 10);

        constraint = anchor1.constraintEqualTo(anchor2, -12);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.equal);
        TKAssertExactEquals(constraint.constant, -12);

        constraint = anchor2.constraintEqualTo(anchor1, 10);
        TKAssertExactEquals(constraint.firstItem, view2);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.secondItem, view1);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.equal);
        TKAssertExactEquals(constraint.constant, 10);
    },

    testConstraintGreaterThanOrEqualTo: function(){
        var view1 = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view2 = UIView.init();
        view1.addSubview(view2);

        var anchor1 = UILayoutAnchor.initWithItemAttribute(view1, UILayoutAttribute.centerX);
        var anchor2 = UILayoutAnchor.initWithItemAttribute(view2, UILayoutAttribute.left);

        var constraint = anchor1.constraintGreaterThanOrEqualTo(anchor2);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.greaterThanOrEqual);
        TKAssertExactEquals(constraint.constant, 0);

        constraint = anchor1.constraintGreaterThanOrEqualTo(anchor2, 10);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.greaterThanOrEqual);
        TKAssertExactEquals(constraint.constant, 10);

        constraint = anchor1.constraintGreaterThanOrEqualTo(anchor2, -12);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.greaterThanOrEqual);
        TKAssertExactEquals(constraint.constant, -12);

        constraint = anchor2.constraintGreaterThanOrEqualTo(anchor1, 10);
        TKAssertExactEquals(constraint.firstItem, view2);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.secondItem, view1);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.greaterThanOrEqual);
        TKAssertExactEquals(constraint.constant, 10);
    },

    testConstraintLessThanOrEqualTo: function(){
        var view1 = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view2 = UIView.init();
        view1.addSubview(view2);

        var anchor1 = UILayoutAnchor.initWithItemAttribute(view1, UILayoutAttribute.centerX);
        var anchor2 = UILayoutAnchor.initWithItemAttribute(view2, UILayoutAttribute.left);

        var constraint = anchor1.constraintLessThanOrEqualTo(anchor2);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.lessThanOrEqual);
        TKAssertExactEquals(constraint.constant, 0);

        constraint = anchor1.constraintLessThanOrEqualTo(anchor2, 10);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.lessThanOrEqual);
        TKAssertExactEquals(constraint.constant, 10);

        constraint = anchor1.constraintLessThanOrEqualTo(anchor2, -12);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.secondItem, view2);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.lessThanOrEqual);
        TKAssertExactEquals(constraint.constant, -12);

        constraint = anchor2.constraintLessThanOrEqualTo(anchor1, 10);
        TKAssertExactEquals(constraint.firstItem, view2);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);
        TKAssertExactEquals(constraint.secondItem, view1);
        TKAssertExactEquals(constraint.secondAttribute, UILayoutAttribute.centerX);
        TKAssertExactEquals(constraint.relation, UILayoutRelation.lessThanOrEqual);
        TKAssertExactEquals(constraint.constant, 10);
    }

});