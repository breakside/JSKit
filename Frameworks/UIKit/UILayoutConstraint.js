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
    },

    reverse: function(relation){
        switch (relation){
            case UILayoutRelation.equal: return UILayoutRelation.equal;
            case UILayoutRelation.lessThanOrEqual: return UILayoutRelation.greaterThanOrEqual;
            case UILayoutRelation.greaterThanOrEqual: return UILayoutRelation.lessThanOrEqual;
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
            case UILayoutAttribute.leading: return "leading";
            case UILayoutAttribute.trailing: return "trailing";
            case UILayoutAttribute.width: return "width";
            case UILayoutAttribute.height: return "height";
            case UILayoutAttribute.centerX: return "centerX";
            case UILayoutAttribute.centerY: return "centerY";
            case UILayoutAttribute.lastBaseline: return "lastBaseline";
            case UILayoutAttribute.firstBaseline: return "firstBaseline";
            case UILayoutAttribute.notAnAttribute: return "notAnAttribute";
        }
    },

    type: function(attribute){
        switch (attribute){
            case UILayoutAttribute.left: return "x";
            case UILayoutAttribute.right: return "x";
            case UILayoutAttribute.top: return "y";
            case UILayoutAttribute.bottom: return "y";
            case UILayoutAttribute.leading: return "x";
            case UILayoutAttribute.trailing: return "x";
            case UILayoutAttribute.width: return "dimension";
            case UILayoutAttribute.height: return "dimension";
            case UILayoutAttribute.centerX: return "x";
            case UILayoutAttribute.centerY: return "y";
            case UILayoutAttribute.lastBaseline: return "y";
            case UILayoutAttribute.firstBaseline: return "y";
            case UILayoutAttribute.notAnAttribute: return "";
        }
    },

    areCompatible: function(attribute1, attribute2){
        return UILayoutAttribute.type(attribute1) == UILayoutAttribute.type(attribute2);
    }
};

JSGlobalObject.UILayoutPriority = {
    required: 1000,
    defaultHigh: 750,
    defaultLow: 250
};

JSProtocol("UILayoutItem", JSProtocol, {

    layoutItemView: null,
    layoutItemSuperview: null,
    layoutFrame: null,

});

JSClass("UILayoutConstraint", JSObject, {
    firstItem: null,
    firstAttribute: UILayoutAttribute.notAnAttribute,
    relation: UILayoutRelation.equal,
    secondItem: null,
    secondAttribute: UILayoutAttribute.notAnAttribute,
    multiplier: JSDynamicProperty('_multiplier', 1),
    constant: JSDynamicProperty('_constant', 0),
    priority: JSDynamicProperty('_priority', UILayoutPriority.required),
    view: null,

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
        if (this.secondItem === null){
            if (this.secondAttribute !== UILayoutAttribute.notAnAttribute){
                throw new Error("UILayoutConstraint requires a notAnAttribute with a null secondItem");
            }
            if (this.firstAttribute !== UILayoutAttribute.width && this.firstAttribute !== UILayoutAttribute.height){
                throw new Error("UILayoutConstraint with firstAttribute=%s must reference a secondItem".sprintf(this.firstAttribute));
            }
        }else{
            if (this.secondAttribute === UILayoutAttribute.notAnAttribute){
                throw new Error("UILayoutConstraint requires a valid attribute with a non-null secondItem");
            }
            if (!UILayoutAttribute.areCompatible(this.firstAttribute, this.secondAttribute)){
                throw new Error("UILayoutConstraint attributes are not compatible: %s, %s".sprintf(this.firstAttribute, this.secondAttribute));
            }
            if (this.firstAttribute !== UILayoutAttribute.width && this.firstAttribute !== UILayoutAttribute.height){
                throw new Error("UILayoutConstraint with firstAttribute=%s must reference a secondItem other than itself".sprintf(this.firstAttribute));
            }
        }
    },

    setConstant: function(constant){
        this._constant = constant;
        if (this.view !== null){
            this.view.setNeedsLayout();
        }
    },

    setMultiplier: function(multiplier){
        this._multiplier = multiplier;
        if (this.view !== null){
            this.view.setNeedsLayout();
        }
    },

    setPriority: function(priority){
        this._priority = priority;
        if (this.view !== null){
            this.view.setNeedsLayout();
        }
    },

    setActive: function(active){
        if (this._isActive == active){
            return;
        }
        if (this.view === null){
            this.view = this.firstItem.layoutItemView;
            if (this.secondItem !== null){
                var secondView = this.secondItem.layoutItemView;
                if (secondView.isAncestorOf(this.view)){
                    this.view = secondView;
                }
            }
        }
        if (active){
            this.view.addConstraint(this);
        }else{
            this.view.removeConstraint(this);
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

})();