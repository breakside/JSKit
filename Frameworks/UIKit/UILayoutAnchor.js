// #import Foundation
// #import "UILayoutConstraint.js"
'use strict';

JSClass("UILayoutAnchor", JSObject, {

    item: null,
    attribute: null,
    constant: 0,
    type: 0,

    initWithItemAttribute: function(item, attribute, constant){
        if (constant === undefined){
            constant = 0;
        }
        this.item = item;
        this.attribute = attribute;
        this.constant = constant;
        this.type = UILayoutAnchor.Type.fromAttribute(attribute);
    },

    anchorOffsetBy: function(constant){
        return UILayoutAnchor.initWithItemAttribute(this.item, this.attribute, this.constant + constant);
    },

    constantConstraint: function(constant){
        return this._createConstraint(null, UILayoutRelation.equal, constant);
    },

    constraintEqualTo: function(otherAnchor, constant){
        if (constant === undefined){
            constant = 0;
        }
        return this._createConstraint(otherAnchor, UILayoutRelation.equal, constant);
    },

    constraintGreaterThanOrEqualTo: function(otherAnchor, constant){
        if (constant === undefined){
            constant = 0;
        }
        return this._createConstraint(otherAnchor, UILayoutRelation.greaterThanOrEqual, constant);
    },

    constraintLessThanOrEqualTo: function(otherAnchor, constant){
        if (constant === undefined){
            constant = 0;
        }
        return this._createConstraint(otherAnchor, UILayoutRelation.lessThanOrEqual, constant);
    },

    _createConstraint: function(otherAnchor, relation, constant){
        if (otherAnchor.type !== this.type){
            throw new Error("Cannot create constraint from anchors on two different types");
        }
        return UILayoutConstraint.initWithOptions({
            firstItem: this.item,
            firstAttribute: this.attribute,
            secondItem: otherAnchor.item,
            secondAttribute: otherAnchor.attribute,
            relation: relation,
            constant: this.contant + constant
        });
    }

});

UILayoutAnchor.Type = {
    x: 0,
    y: 1,
    dimension: 2,

    fromAttribute: function(attribute){
        switch (attribute){
            case UILayoutAttribute.left:
            case UILayoutAttribute.right:
            case UILayoutAttribute.leading:
            case UILayoutAttribute.trailing:
            case UILayoutAttribute.centerX:
                return UILayoutAnchor.Type.x;
            case UILayoutAttribute.top:
            case UILayoutAttribute.bottom:
            case UILayoutAttribute.centerY:
            case UILayoutAttribute.firstBaseline:
            case UILayoutAttribute.lastBaseline:
                return UILayoutAnchor.Type.y;
            case UILayoutAttribute.width:
            case UILayoutAttribute.height:
                return UILayoutAnchor.Type.dimension;
        }
        throw new Error("Cannot determine anchor type, unknown layout attribute");
    }
};