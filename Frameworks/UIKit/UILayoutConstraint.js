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

// #import Foundation
'use strict';

(function(){

var logger = JSLog("uikit", "layout");

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
    leading: 4,
    trailing: 5,
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

    initWithSpec: function(spec){
        UILayoutConstraint.$super.call.initWithSpec(this, spec);
        if (spec.containsKey('firstItem')){
            this.firstItem = spec.valueForKey("firstItem");
        }
        if (spec.containsKey('firstAttribute')){
            this.firstAttribute = spec.valueForKey("firstAttribute", UILayoutAttribute);
        }
        if (spec.containsKey('secondItem')){
            this.secondItem = spec.valueForKey("secondItem");
        }
        if (spec.containsKey('secondAttribute')){
            this.secondAttribute = spec.valueForKey("secondAttribute", UILayoutAttribute);
        }
        if (spec.containsKey('relation')){
            this.relation = spec.valueForKey("relation", UILayoutRelation);
        }
        if (spec.containsKey('multiplier')){
            this._multiplier = spec.valueForKey("multiplier");
        }
        if (spec.containsKey('constant')){
            this._constant = spec.valueForKey("constant");
        }
        if (spec.containsKey('priority')){
            this.priority = spec.valueForKey("priority", UILayoutPriority);
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
            throw new Error("UILayoutConstraint requires a notAnAttribute with a null secondItem");
        }
    },

    _attachToView: function(view){
        if (this._targetItem === null){
            return;
        }
        if (this.firstItem === '<self>'){
            this.firstItem = view;
        }
        if (this.secondItem === '<self>'){
            this.secondItem = view;
        }
        if (this.secondItem !== null){
            if (this.firstItem === this.secondItem.superview){
                this._targetItem = this.firstItem;
            }else if (this.secondItem === this.firstItem.superview){
                this._targetItem = this.secondItem;
            }else if (this.firstItem.superview === this.secondItem.superview){
                this._targetItem = this.firstItem.superview;
            }else{
                throw new Error("UILayoutConstraint requires firstItem and secondItem either superview/sublayer or siblings");
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

var UILayoutVariable = function(){
    if (this === undefined){
        return new UILayoutVariable();
    }
    this.equalities = [];
};

UILayoutVariable.prototype = {

    min: undefined,
    max: undefined,
    priority: 0,
    isSolved: false,

    equalities: null,

    solve: function(){
        if (this.isSolved){
            return;
        }
        var unsolved = this.equalities.length;
        var equality;
        for (var i = 0, l = this.equalities.length; i < l; ++i){
            equality = this.equalities[i];
            if (!equality.isSolved){
                equality.solve();
                if (equality.isSolved){
                    --unsolved;
                    if (equality.priority > this.priority || (equality.min >= this.min && equality.max <= this.max)){
                        this.min = equality.min;
                        this.max = equality.max;
                    }else{
                        // TODO: indicate which constraints
                        logger.warn("Conflicting constraints");
                    }
                }
            }else{
                --unsolved;
            }
        }
        this.isSolved = unsolved === 0;
    }
};

var UILayoutEquality = function(){
    if (this === undefined){
        return new UILayoutEquality();
    }
    this.stack = [];
};

UILayoutEquality.prototype = {

    min: undefined,
    max: undefined,
    priority: 0,
    relation: UILayoutRelation.equal,
    a: 0,
    b: 0,
    multiplier: 1,

    solve: function(){
    }

};

var UILayoutViewVariables = function(view){
    if (this === undefined){
        return new UILayoutViewVariables(view);
    }
    this.view = view;
    this.top = UILayoutVariable();
    // bottom - height
    this.left = UILayoutVariable();
    // right - width
    this.right = UILayoutVariable();
    // left + width
    this.bottom = UILayoutVariable();
    // top + height
    this.width = UILayoutVariable();
    this.height = UILayoutVariable();
    this.centerX = UILayoutVariable();
    // left + width / 2
    this.centerY = UILayoutVariable();
    // top + height / 2
    this.lastBaseline = UILayoutVariable();
    // bottom - view.lastBaselineOffsetFromBottom
    this.firstBaseline = UILayoutVariable();
    // top + view.lastBaselineOffsetFromBottom
    var constraint;
    for (var i = 0, l = view.constraints.length; i < l; ++i){
        constraint = view.constraints[i];
        this.addConstraint(constraint);
    }
};

UILayoutViewVariables.prototype = {

    updateView: function(){
        var position = JSPoint(this.view.position);
        var size = JSSize(this.view.bounds.size);

        this.view.position = position;
        this.view.size = size;
    },

    addConstraint: function(constraint){
        if (constraint.firstItem === this.view){
            if (constraint.secondItem === null){
                // TOOD: api for UILayoutEquality
                if (constraint.firstAttribute === UILayoutAttribute.left || constraint.firstAttribute === UILayoutAttribute.leading){
                }else if (constraint.firstAttribute === UILayoutAttribute.right || constraint.firstAttribute === UILayoutAttribute.trailing){
                }else if (constraint.firstAttribute === UILayoutAttribute.top){
                }else if (constraint.firstAttribute === UILayoutAttribute.bottom){
                }else if (constraint.firstAttribute === UILayoutAttribute.width){
                }else if (constraint.firstAttribute === UILayoutAttribute.height){
                }else if (constraint.firstAttribute === UILayoutAttribute.centerX){
                }else if (constraint.firstAttribute === UILayoutAttribute.centerY){
                }else if (constraint.firstAttribute === UILayoutAttribute.lastBaseline){
                }else if (constraint.firstAttribute === UILayoutAttribute.firstBaseline){
                }
            }else{
                // TODO: how to reference variables from other item
                if (constraint.firstAttribute === UILayoutAttribute.left || constraint.firstAttribute === UILayoutAttribute.leading){
                }else if (constraint.firstAttribute === UILayoutAttribute.right || constraint.firstAttribute === UILayoutAttribute.trailing){
                }else if (constraint.firstAttribute === UILayoutAttribute.top){
                }else if (constraint.firstAttribute === UILayoutAttribute.bottom){
                }else if (constraint.firstAttribute === UILayoutAttribute.width){
                }else if (constraint.firstAttribute === UILayoutAttribute.height){
                }else if (constraint.firstAttribute === UILayoutAttribute.centerX){
                }else if (constraint.firstAttribute === UILayoutAttribute.centerY){
                }else if (constraint.firstAttribute === UILayoutAttribute.lastBaseline){
                }else if (constraint.firstAttribute === UILayoutAttribute.firstBaseline){
                }
            }
        }else if (constraint.secondItem == this.view){
            if (constraint.secondItem === null){
                // TOOD: api for UILayoutEquality
                if (constraint.secondAttribute === UILayoutAttribute.left || constraint.secondAttribute === UILayoutAttribute.leading){
                }else if (constraint.secondAttribute === UILayoutAttribute.right || constraint.secondAttribute === UILayoutAttribute.trailing){
                }else if (constraint.secondAttribute === UILayoutAttribute.top){
                }else if (constraint.secondAttribute === UILayoutAttribute.bottom){
                }else if (constraint.secondAttribute === UILayoutAttribute.width){
                }else if (constraint.secondAttribute === UILayoutAttribute.height){
                }else if (constraint.secondAttribute === UILayoutAttribute.centerX){
                }else if (constraint.secondAttribute === UILayoutAttribute.centerY){
                }else if (constraint.secondAttribute === UILayoutAttribute.lastBaseline){
                }else if (constraint.secondAttribute === UILayoutAttribute.firstBaseline){
                }
            }else{
                // TODO: how to reference variables from other item
                if (constraint.secondAttribute === UILayoutAttribute.left || constraint.secondAttribute === UILayoutAttribute.leading){
                }else if (constraint.secondAttribute === UILayoutAttribute.right || constraint.secondAttribute === UILayoutAttribute.trailing){
                }else if (constraint.secondAttribute === UILayoutAttribute.top){
                }else if (constraint.secondAttribute === UILayoutAttribute.bottom){
                }else if (constraint.secondAttribute === UILayoutAttribute.width){
                }else if (constraint.secondAttribute === UILayoutAttribute.height){
                }else if (constraint.secondAttribute === UILayoutAttribute.centerX){
                }else if (constraint.secondAttribute === UILayoutAttribute.centerY){
                }else if (constraint.secondAttribute === UILayoutAttribute.lastBaseline){
                }else if (constraint.secondAttribute === UILayoutAttribute.firstBaseline){
                }
            }
        }
    }

};

JSClass("UILayoutResolver", JSObject, {

    init: function(){
        this.variables = [];
    },

    addView: function(view){
        var viewVariables = new UILayoutViewVariables(view);
        this.variables.push(viewVariables.top);
        this.variables.push(viewVariables.left);
        this.variables.push(viewVariables.right);
        this.variables.push(viewVariables.bottom);
        this.variables.push(viewVariables.width);
        this.variables.push(viewVariables.height);
        this.variables.push(viewVariables.centerX);
        this.variables.push(viewVariables.centerY);
        for (var i = 0, l = view.subviews.length; i < l; ++i){
            this.addView(view.subviews[i]);
        }
    },

    variables: null,

    solve: function(){
        var solved;
        var variable;
        do {
            solved = 0;
            for (var i = 0, l = this.variables.length; i < l; ++i){
                variable = this.variables[i];
                // TODO: partially solved variables
                if (!variable.isSolved){
                    variable.solve();
                    if (variable.isSolved){
                        ++solved;
                    }
                }
            }
        }while (solved > 0);
        if (solved < this.variables.length){
            logger.warn("Not enough constraints specified");
        }
        // TODO: check for conflicts
        // TODO: apply values to items
    }

});

})();