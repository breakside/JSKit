// #import Foundation
/* global JSGlobalObject, JSClass, JSObject, JSDynamicProperty, UILayoutConstraint, UILayoutRelation, UILayoutAttribute, UILayoutPriority */
'use strict';

(function(){

JSGlobalObject.UILayoutRelation = {
    equal: "=",
    lessThanOrEqual: "<=",
    greaterThanOrEqual: ">=",

    toString: function(relation){
        switch (relation){
            case UILayoutRelation.equal: return "=";
            case UILayoutRelation.lessThanOrEqual: return "<=";
            case UILayoutRelation.greaterThanOrEqual: return ">=";
        }
    }
};

JSGlobalObject.UILayoutAttribute = {
    left: 0,
    right: 1,
    top: 2,
    bottom: 3,
    // leading: 4,
    // trailing: 5,
    width: 6,
    height: 7,
    centerX: 8,
    centerY: 9,
    lastBaseline: 10,
    firstBaseline: 11,
    notAnAttribute: 12,

    toString: function(attribute){
        switch (attribute){
            case UILayoutAttribute.left: return "left";
            case UILayoutAttribute.right: return "right";
            case UILayoutAttribute.top: return "top";
            case UILayoutAttribute.bottom: return "bottom";
            case UILayoutAttribute.width: return "width";
            case UILayoutAttribute.height: return "height";
            case UILayoutAttribute.centerX: return "centerX";
            case UILayoutAttribute.centerY: return "centerY";
            case UILayoutAttribute.lastBaseline: return "lastBaseline";
            case UILayoutAttribute.firstBaseline: return "firstBaseline";
            case UILayoutAttribute.notAnAttribute: return "notAnAttribute";
        }
    }
};

JSGlobalObject.UILayoutPriority = {
    required: 1000,
    defaultHigh: 750,
    defaultLow: 250
};

JSClass("UILayoutConstraint", JSObject, {
    firstItem: null,
    firstAttribute: UILayoutAttribute.notAnAttribute,
    relation: UILayoutRelation.equal,
    secondItem: null,
    secondAttribute: UILayoutAttribute.notAnAttribute,
    multiplier: JSDynamicProperty('_multiplier', 1),
    constant: JSDynamicProperty('_constant', 0),
    priority: UILayoutPriority.required,

    _targetItem: null,
    active: JSDynamicProperty('_isActive', false, 'isActive'),

    initWithOptions: function(options){
        if (options.firstItem !== undefined){
            this.firstItem = options.firstItem;
        }
        if (options.firstAttribute !== undefined){
            this.firstAttribute = options.firstAttribute;
        }
        if (options.relation !== undefined){
            this.relation = options.relation;
        }
        if (options.secondItem !== undefined){
            this.secondItem = options.secondItem;
        }
        if (options.secondAttribute !== undefined){
            this.secondAttribute = options.secondAttribute;
        }
        if (options.multiplier !== undefined){
            this._multiplier = options.multiplier;
        }
        if (options.constant !== undefined){
            this._constant = options.constant;
        }
        if (options.priority !== undefined){
            this.priority = options.priority;
        }
        this._commonConstraintInit();
    },

    initWithSpec: function(spec, values){
        UILayoutConstraint.$super.call.initWithSpec(this, spec, values);
        if ('firstItem' in values){
            this.firstItem = spec.resolvedValue(values.firstItem);
        }
        if ('firstAttribute' in values){
            this.firstAttribute = spec.resolvedValue(values.firstAttribute);
        }
        if ('secondItem' in values){
            this.secondItem = spec.resolvedValue(values.secondItem);
        }
        if ('secondAttribute' in values){
            this.secondAttribute = spec.resolvedValue(values.secondAttribute);
        }
        if ('relation' in values){
            this.relation = spec.resolvedValue(values.relation);
        }
        if ('multiplier' in values){
            this._multiplier = spec.resolvedValue(values.multiplier);
        }
        if ('constant' in values){
            this._constant = spec.resolvedValue(values.constant);
        }
        if ('priority' in values){
            this.priority = spec.resolvedValue(values.priority);
        }
        this._commonConstraintInit();
    },

    _commonConstraintInit: function(){
        if (this.firstItem === null){
            throw new Error("UILayoutConstraint requires a firstItem");
        }
        if (this.firstAttribute === UILayoutAttribute.notAnAttribute){
            throw new Error("UILayoutConstraint requires a firstAttribute");
        }
        if (this.secondItem !== null && this.secondAttribute === UILayoutAttribute.notAnAttribute){
            throw new Error("UILayoutConstraint requires a valid attribute with a non-null secondItem");
        }
        if (this.secondItem === null && this.secondAttribute !== UILayoutAttribute.notAnAttribute){
            throw new Error("UILayoutConstraint requires a nonAnAttribute with a null secondItem");
        }
        if (this.secondItem !== null){
            if (this.firstItem === this.secondItem.superlayer){
                this._targetItem = this.firstItem;
            }else if (this.secondItem === this.firstItem.superlayer){
                this._targetItem = this.secondItem;
            }else if (this.firstItem.superlayer === this.secondItem.superlayer){
                this._targetItem = this.firstItem.superlayer;
            }else{
                throw new Error("UILayoutConstraint requires firstItem and secondItem either superlayer/sublayer or siblings");
            }
        }else{
            this._targetItem = this.firstItem;
        }
    },

    setConstant: function(constant){
        this._constant = constant;
        this._targetItem.setNeedsLayout();
    },

    setMultiplier: function(multiplier){
        this._multiplier = multiplier;
        this._targetItem.setNeedsLayout();
    },

    setActive: function(active){
        if (this._isActive == active){
            return;
        }
        if (active){
            this._targetItem.addConstraint(this);
        }else{
            this._targetItem.removeConstraint(this);
        }
    },

    toString: function(){
        if (this.secondItem === null){
            return "%s.%s %s %s".sprintf(this.firstItem, UILayoutAttribute.toString(this.firstAttribute), UILayoutRelation.toString(this.relation), this.constant);
        }
        if (this.multiplier == 1){
            if (this.constant === 0){
                return "%s.%s %s %s.%s".sprintf(this.firstItem, UILayoutAttribute.toString(this.firstAttribute), UILayoutRelation.toString(this.relation), this.secondItem, UILayoutAttribute.toString(this.secondAttribute));
            }
            if (this.constant < 0){
                return "%s.%s %s %s.%s - %s".sprintf(this.firstItem, UILayoutAttribute.toString(this.firstAttribute), UILayoutRelation.toString(this.relation), this.secondItem, UILayoutAttribute.toString(this.secondAttribute), -this.constant);
            }
            return "%s.%s %s %s.%s + %s".sprintf(this.firstItem, UILayoutAttribute.toString(this.firstAttribute), UILayoutRelation.toString(this.relation), this.secondItem, UILayoutAttribute.toString(this.secondAttribute), this.constant);
        }
        if (this.constant === 0){
            return "%s.%s %s %s.%s * %s".sprintf(this.firstItem, UILayoutAttribute.toString(this.firstAttribute), UILayoutRelation.toString(this.relation), this.secondItem, UILayoutAttribute.toString(this.secondAttribute), this.multiplier);
        }
        if (this.constant < 0){
            return "%s.%s %s %s.%s * %s - %s".sprintf(this.firstItem, UILayoutAttribute.toString(this.firstAttribute), UILayoutRelation.toString(this.relation), this.secondItem, UILayoutAttribute.toString(this.secondAttribute), this.multiplier, -this.constant);
        }
        return "%s.%s %s %s.%s * %s + %s".sprintf(this.firstItem, UILayoutAttribute.toString(this.firstAttribute), UILayoutRelation.toString(this.relation), this.secondItem, UILayoutAttribute.toString(this.secondAttribute), this.multiplier, this.constant);
    }

});


var UILayoutFrame = function(){
    if (this === undefined){
        return new UILayoutFrame();
    }
};

UILayoutFrame.prototype = {
    minX: undefined,
    maxX: undefined,
    minY: undefined,
    maxY: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    minHeight: undefined,
    maxHeight: undefined
};


JSClass("UILayoutRun", JSObject, {

    framesByItemID: null,
    superview: null,

    initWithSuperview: function(superview, fixedWidth, fixedHeight){
        this.superview = superview;
        this.framesByItemID = {};
        var frame = this.framesByItemID[superview.objectID] = new UILayoutFrame();
        frame.minX = frame.maxX = 0;
        frame.minY = frame.maxY = 0;
        frame.minWidth = frame.maxWidth = fixedWidth;
        frame.minHeight = frame.maxHeight = fixedHeight;
    },

});

})();