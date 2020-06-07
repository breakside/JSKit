// #import Foundation
// #import "UILayoutConstraint.js"
// #import "UILayoutDirection.js"
'use strict';

(function(){

var logger = JSLog("uikit", "layout");

JSClass("UILayoutResolver", JSObject, {

    initWithView: function(view){
        this._constraints = [];
        this._layoutFramesByItemId = {};
        this.setRootView(view);
    },

    frameForItem: function(item){
        var layoutFrame = this._layoutFramesByItemId[item.objectID];
        var frame = JSRect(item.layoutFrame);
        if (layoutFrame === null){
            return frame;
        }
        if (layoutFrame.minX == layoutFrame.maxX){
            frame.origin.x = layoutFrame.minX;
        }
        if (layoutFrame.minY == layoutFrame.maxY){
            frame.origin.y = layoutFrame.minY;
        }
        if (layoutFrame.minWidth == layoutFrame.maxWidth){
            frame.size.width = layoutFrame.minWidth;
        }
        if (layoutFrame.minHeight == layoutFrame.maxHeight){
            frame.size.height = layoutFrame.minHeight;
        }
        return frame;
    },

    needsSolve: true,

    solveIfNeeded: function(){
        if (!this.needsSolve){
            return;
        }
        this.solve();
        this.needsSolve = false;
    },

    setRootView: function(view){
        var layoutFrame = new LayoutResolverFrame();
        layoutFrame.minX = layoutFrame.maxX = view.position.x - view.anchorPoint.x * view.bounds.size.width;
        layoutFrame.minY = layoutFrame.maxY = view.position.y - view.anchorPoint.y * view.bounds.size.height;
        layoutFrame.minWidth = layoutFrame.maxWidth = view.bounds.size.width;
        layoutFrame.minHeight = layoutFrame.maxHeigh = view.bounds.size.height;
        this._layoutFramesByItemId[view.objectID] = layoutFrame;
        this.addView(view);
    },

    addView: function(view){       
        var i, l;
        var constraint;
        for (i = 0, l = view.constraints.length; i < l; ++i){
            constraint = view.constraints[i];
            this.addConstraint(constraint);
        }

        if (l > 0){
            var subview;
            for (i = 0, l = view.subviews.length; i < l; ++i){
                subview = view.subviews[i];
                this.addView(subview);
            }
        }
    },

    _constraints: null,

    addConstraint: function(constraint){
        this._constraints.push(constraint);
    },

    solve: function(){
        var required = [];
        var optional = [];
        var sorter = new JSBinarySearcher(optional, function(a, b){
            return b.priority - a.priority;
        });
        var constraint;
        var i, l;
        var index;
        for (i = 0, l = this._constraints.length; i < l; ++i){
            constraint = this._constraints[i];
            if (constraint.priority == UILayoutPriority.required){
                required.push(constraint);
            }else{
                index = sorter.insertionIndexForValue(constraint);
                optional.splice(index, 0, index);
            }
        }
        // FIXME: need to keep looping even after optional constraints have been solved
        // because they might affect required constraints
        var solved = this._solveConstraints(required);
        if (!solved){
            logger.warn("Could not solve all required constraints");
        }
        this._solveOptionalConstraints(optional);
    },

    _solveRequiredConstraints: function(queue){
        var i, l;
        var constraint;
        var changes = 0;
        var conflicts = 0;
        var result;
        do {
            changes = 0;
            for (i = queue.length - 1; i >= 0; --i){
                constraint = queue[i];
                result = this._solveRequiredContraint(
                    constraint.firstItem,
                    constraint.firstAttribute,
                    constraint.secondItem,
                    constraint.secondAttribute,
                    constraint.relation,
                    constraint.priority,
                    constraint.multiplier,
                    constraint.constant
                );
                switch (result){
                    case SolveConstraintResult.changed:
                        ++changes;
                        break;
                    case SolveConstraintResult.solved:
                        ++changes;
                        queue.splice(i, 1);
                        break;
                    case SolveConstraintResult.conflict:
                        ++conflicts;
                        queue.splice(i, 1);
                        logger.warn("Could not satisfy constraint %{public}", constraint.toString());
                        break;
                }
            }
        }while (changes > 0);
        return conflicts === 0;
    },

    _solveOptionalConstraints: function(queue){
        var constraint;
        for (var i = 0, l = queue.length; i < l; ++i){
            constraint = queue[i];
            this._solveOptionalConstraint(constraint);
        }
    },

    _layoutFrameForItem: function(item){
        var frame = this._layoutFramesByItemId[item.objectID];
        if (!frame){
            frame = new LayoutResolverFrame();
            this._layoutFramesByItemId[item.objectID] = frame;
        }
        return frame;
    },

    _solveRequiredContraint: function(firstItem, firstAttribute, secondItem, secondAttribute, relation, priority, multiplier, constant){
        var firstFrame = this._layoutFrameForItem(firstItem);
        var required = priority === UILayoutPriority.required;
        var value;
        if (secondItem !== null){
            value = constant;
        }else{
            var firstMin, firstMax;
            var secondMin, secondMax;
            switch (firstAttribute){
                case UILayoutAttribute.width:
                    firstMin = firstFrame.minWidth;
                    firstMax = firstFrame.maxWidth;
                    break;
                case UILayoutAttribute.height:
                    firstMin = firstFrame.minHeight;
                    firstMax = firstFrame.maxHeight;
                    break;
            }
            if (firstMin == firstMax){
                return this._solveRequiredContraint(secondItem, secondAttribute, firstItem, firstAttribute, UILayoutRelation.reverse(relation), priority, 1 / multiplier, -constant);
            }
            var secondFrame = this._layoutFrameForItem(secondItem);
            switch (secondAttribute){
                case UILayoutAttribute.width:
                    secondMin = secondFrame.minWidth;
                    secondMax = secondFrame.maxWidth;
                    break;
                case UILayoutAttribute.height:
                    secondMin = secondFrame.minHeight;
                    secondMax = secondFrame.maxHeight;
                    break;
            }
            if (secondMin != secondMax){
                return SolveConstraintResult.unchanged;
            }
            value = secondMin * multiplier + constant;
        }
        switch (firstAttribute){
            case UILayoutAttribute.width:
                switch (relation){
                    case UILayoutRelation.equal:
                        if (value >= firstFrame.minWidth && value <= firstFrame.maxWidth){
                            firstFrame.minWidth = firstFrame.maxWidth = value;
                            return SolveConstraintResult.solved;
                        }
                        return SolveConstraintResult.conflict;
                    case UILayoutRelation.lessThanOrEqual:
                        if (value < firstFrame.minWidth || value > firstFrame.maxWidth){
                            return SolveConstraintResult.conflict;
                        }
                        if (value < firstFrame.maxWidth){
                            firstFrame.maxWidth = value;
                            return SolveConstraintResult.changed;
                        }
                        return SolveConstraintResult.unchanged;
                    case UILayoutRelation.greaterThanOrEqual:
                        if (value < firstFrame.minWidth || value > firstFrame.maxWidth){
                            return SolveConstraintResult.conflict;
                        }
                        if (value > firstFrame.minWidth){
                            firstFrame.minWidth = value;
                            return SolveConstraintResult.changed;
                        }
                        return SolveConstraintResult.unchanged;
                }
                return SolveConstraintResult.unchanged;
            case UILayoutAttribute.height:
                switch (relation){
                    case UILayoutRelation.equal:
                        if (value >= firstFrame.minHeight && value <= firstFrame.maxHeight){
                            firstFrame.minHeight = firstFrame.maxHeight = value;
                            return SolveConstraintResult.solved;
                        }
                        return SolveConstraintResult.conflict;
                    case UILayoutRelation.lessThanOrEqual:
                        if (value < firstFrame.minHeight || value > firstFrame.maxHeight){
                            return SolveConstraintResult.conflict;
                        }
                        if (value < firstFrame.maxHeight){
                            firstFrame.maxHeight = value;
                            return SolveConstraintResult.changed;
                        }
                        return SolveConstraintResult.unchanged;
                    case UILayoutRelation.greaterThanOrEqual:
                        if (value < firstFrame.minHeight || value > firstFrame.maxHeight){
                            return SolveConstraintResult.conflict;
                        }
                        if (value > firstFrame.minHeight){
                            firstFrame.minHeight = value;
                            return SolveConstraintResult.changed;
                        }
                        return SolveConstraintResult.unchanged;
                }
                return SolveConstraintResult.unchanged;
        }
        return SolveConstraintResult.unchanged;
    },

    _solveOptionalContraint: function(constraint){
        var firstItem = constraint.firstItem;
        var secondItem = constraint.secondItem;
        var firstFrame = this._layoutFrameForItem(firstItem);
        var required = constraint.priority === UILayoutPriority.required;
        if (secondItem === null){
            var value = constraint.constant;
            switch (constraint.firstAttribute){
                case UILayoutAttribute.width:
                    switch (constraint.relation){
                        case UILayoutRelation.equal:
                            if (value >= firstFrame.minWidth && value <= firstFrame.maxWidth){
                                firstFrame.minWidth = firstFrame.maxWidth = value;
                                return SolveConstraintResult.solved;
                            }
                            if (value < firstFrame.minWidth && firstFrame.maxWidth > firstFrame.minWidth){
                                firstFrame.maxWidth = firstFrame.minWidth;
                                return SolveConstraintResult.partial;
                            }
                            if (value > firstFrame.maxWidth && firstFrame.minWidth < firstFrame.maxWidth){
                                firstFrame.minWidth = firstFrame.maxWidth;
                                return SolveConstraintResult.partial;
                            }
                            return SolveConstraintResult.unchanged;
                        case UILayoutRelation.lessThanOrEqual:
                            if (value >= firstFrame.minWidth && value <= firstFrame.maxWidth){
                                firstFrame.minWidth = firstFrame.maxWidth = value;
                                return SolveConstraintResult.solved;
                            }
                            if (value < firstFrame.minWidth && firstFrame.maxWidth > firstFrame.minWidth){
                                firstFrame.maxWidth = firstFrame.minWidth;
                                return SolveConstraintResult.partial;
                            }
                            if (value > firstFrame.maxWidth && firstFrame.minWidth < firstFrame.maxWidth){
                                firstFrame.minWidth = firstFrame.maxWidth;
                                return SolveConstraintResult.partial;
                            }
                            return SolveConstraintResult.unchanged;
                        case UILayoutRelation.greaterThanOrEqual:
                            if (value >= firstFrame.minWidth && value <= firstFrame.maxWidth){
                                firstFrame.minWidth = firstFrame.maxWidth = value;
                                return SolveConstraintResult.solved;
                            }
                            if (value < firstFrame.minWidth && firstFrame.maxWidth > firstFrame.minWidth){
                                firstFrame.maxWidth = firstFrame.minWidth;
                                return SolveConstraintResult.partial;
                            }
                            if (value > firstFrame.maxWidth && firstFrame.minWidth < firstFrame.maxWidth){
                                firstFrame.minWidth = firstFrame.maxWidth;
                                return SolveConstraintResult.partial;
                            }
                            return SolveConstraintResult.unchanged;
                    }
                    return SolveConstraintResult.unchanged;
                case UILayoutAttribute.height:
                    switch (constraint.relation){
                        case UILayoutRelation.equal:
                            if (value >= firstFrame.minHeight && value <= firstFrame.maxHeight){
                                firstFrame.minHeight = firstFrame.maxHeight = value;
                                return SolveConstraintResult.solved;
                            }
                            if (value < firstFrame.minHeight && firstFrame.maxHeight > firstFrame.minHeight){
                                firstFrame.maxHeight = firstFrame.minHeight;
                                return SolveConstraintResult.partial;
                            }
                            if (value > firstFrame.maxHeight && firstFrame.minHeight < firstFrame.maxHeight){
                                firstFrame.minHeight = firstFrame.maxHeight;
                                return SolveConstraintResult.partial;
                            }
                            return SolveConstraintResult.unchanged;
                        case UILayoutRelation.lessThanOrEqual:
                            if (value >= firstFrame.minHeight && value <= firstFrame.maxHeight){
                                firstFrame.minHeight = firstFrame.maxHeight = value;
                                return SolveConstraintResult.solved;
                            }
                            if (value < firstFrame.minHeight && firstFrame.maxHeight > firstFrame.minHeight){
                                firstFrame.maxHeight = firstFrame.minHeight;
                                return SolveConstraintResult.partial;
                            }
                            if (value > firstFrame.maxHeight && firstFrame.minHeight < firstFrame.maxHeight){
                                firstFrame.minHeight = firstFrame.maxHeight;
                                return SolveConstraintResult.partial;
                            }
                            return SolveConstraintResult.unchanged;
                        case UILayoutRelation.greaterThanOrEqual:
                            if (value >= firstFrame.minHeight && value <= firstFrame.maxHeight){
                                firstFrame.minHeight = firstFrame.maxHeight = value;
                                return SolveConstraintResult.solved;
                            }
                            if (value < firstFrame.minHeight && firstFrame.maxHeight > firstFrame.minHeight){
                                firstFrame.maxHeight = firstFrame.minHeight;
                                return SolveConstraintResult.partial;
                            }
                            if (value > firstFrame.maxHeight && firstFrame.minHeight < firstFrame.maxHeight){
                                firstFrame.minHeight = firstFrame.maxHeight;
                                return SolveConstraintResult.partial;
                            }
                            return SolveConstraintResult.unchanged;
                    }
                    return SolveConstraintResult.unchanged;
            }
            return SolveConstraintResult.unchanged;
        }
        // TODO:
        return SolveConstraintResult.unchanged;
    },

    _layoutFramesByItemId: null,

});

var ConflictingConstraintError = function(){
    if (this == undefined){
        return new ConflictingConstraintError();
    }
};

var LayoutResolverFrame = function(){
    if (this === undefined){
        return new LayoutResolverFrame();
    }
};

LayoutResolverFrame.prototye = {
    minX: Number.MIN_VALUE,
    maxX: Number.MAX_VALUE,
    minY: Number.MIN_VALUE,
    maxY: Number.MAX_VALUE,
    minWidth: 0,
    maxWidth: Number.MAX_VALUE,
    minHeight: 0,
    maxHeight: Number.MAX_VALUE
};

var SolveConstraintResult = {
    unchanged: 0,
    changed: 1,
    solved: 2,
    conflict: 3,
    partial: 4
};

})();


// var UILayoutVariable = function(){
//     if (this === undefined){
//         return new UILayoutVariable();
//     }
//     this.equalities = [];
// };

// UILayoutVariable.prototype = {

//     min: undefined,
//     max: undefined,
//     priority: 0,
//     isSolved: false,

//     equalities: null,

//     solve: function(){
//         if (this.isSolved){
//             return;
//         }
//         var unsolved = this.equalities.length;
//         var equality;
//         for (var i = 0, l = this.equalities.length; i < l; ++i){
//             equality = this.equalities[i];
//             if (!equality.isSolved){
//                 equality.solve();
//                 if (equality.isSolved){
//                     --unsolved;
//                     if (equality.priority > this.priority || (equality.min >= this.min && equality.max <= this.max)){
//                         this.min = equality.min;
//                         this.max = equality.max;
//                     }else{
//                         // TODO: indicate which constraints
//                         logger.warn("Conflicting constraints");
//                     }
//                 }
//             }else{
//                 --unsolved;
//             }
//         }
//         this.isSolved = unsolved === 0;
//     }
// };

// var UILayoutEquality = function(){
//     if (this === undefined){
//         return new UILayoutEquality();
//     }
//     this.stack = [];
// };

// UILayoutEquality.prototype = {

//     min: undefined,
//     max: undefined,
//     priority: 0,
//     relation: UILayoutRelation.equal,
//     a: 0,
//     b: 0,
//     multiplier: 1,

//     solve: function(){
//     }

// };

// var UILayoutViewVariables = function(view){
//     if (this === undefined){
//         return new UILayoutViewVariables(view);
//     }
//     this.view = view;
//     this.top = UILayoutVariable();
//     // bottom - height
//     this.left = UILayoutVariable();
//     // right - width
//     this.right = UILayoutVariable();
//     // left + width
//     this.bottom = UILayoutVariable();
//     // top + height
//     this.width = UILayoutVariable();
//     this.height = UILayoutVariable();
//     this.centerX = UILayoutVariable();
//     // left + width / 2
//     this.centerY = UILayoutVariable();
//     // top + height / 2
//     this.lastBaseline = UILayoutVariable();
//     // bottom - view.lastBaselineOffsetFromBottom
//     this.firstBaseline = UILayoutVariable();
//     // top + view.lastBaselineOffsetFromBottom
//     var constraint;
//     for (var i = 0, l = view.constraints.length; i < l; ++i){
//         constraint = view.constraints[i];
//         this.addConstraint(constraint);
//     }
// };

// UILayoutViewVariables.prototype = {

//     updateView: function(){
//         var position = JSPoint(this.view.position);
//         var size = JSSize(this.view.bounds.size);

//         this.view.position = position;
//         this.view.size = size;
//     },

//     addConstraint: function(constraint){
//         if (constraint.firstItem === this.view){
//             if (constraint.secondItem === null){
//                 // TOOD: api for UILayoutEquality
//                 if (constraint.firstAttribute === UILayoutAttribute.left || constraint.firstAttribute === UILayoutAttribute.leading){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.right || constraint.firstAttribute === UILayoutAttribute.trailing){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.top){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.bottom){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.width){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.height){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.centerX){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.centerY){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.lastBaseline){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.firstBaseline){
//                 }
//             }else{
//                 // TODO: how to reference variables from other item
//                 if (constraint.firstAttribute === UILayoutAttribute.left || constraint.firstAttribute === UILayoutAttribute.leading){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.right || constraint.firstAttribute === UILayoutAttribute.trailing){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.top){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.bottom){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.width){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.height){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.centerX){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.centerY){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.lastBaseline){
//                 }else if (constraint.firstAttribute === UILayoutAttribute.firstBaseline){
//                 }
//             }
//         }else if (constraint.secondItem == this.view){
//             if (constraint.secondItem === null){
//                 // TOOD: api for UILayoutEquality
//                 if (constraint.secondAttribute === UILayoutAttribute.left || constraint.secondAttribute === UILayoutAttribute.leading){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.right || constraint.secondAttribute === UILayoutAttribute.trailing){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.top){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.bottom){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.width){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.height){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.centerX){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.centerY){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.lastBaseline){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.firstBaseline){
//                 }
//             }else{
//                 // TODO: how to reference variables from other item
//                 if (constraint.secondAttribute === UILayoutAttribute.left || constraint.secondAttribute === UILayoutAttribute.leading){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.right || constraint.secondAttribute === UILayoutAttribute.trailing){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.top){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.bottom){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.width){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.height){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.centerX){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.centerY){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.lastBaseline){
//                 }else if (constraint.secondAttribute === UILayoutAttribute.firstBaseline){
//                 }
//             }
//         }
//     }

// };

// JSClass("UILayoutResolver", JSObject, {

//     init: function(){
//         this.variables = [];
//         this.framesByItemId = {};
//     },

//     framesByItemId: null,

//     frameForItem: function(item){
//         return this.framesByItemId[item.objectID];
//     },

//     updateFramesIfNeeded: function(){
//     },

//     addView: function(view){
//         var viewVariables = new UILayoutViewVariables(view);
//         this.variables.push(viewVariables.top);
//         this.variables.push(viewVariables.left);
//         this.variables.push(viewVariables.right);
//         this.variables.push(viewVariables.bottom);
//         this.variables.push(viewVariables.width);
//         this.variables.push(viewVariables.height);
//         this.variables.push(viewVariables.centerX);
//         this.variables.push(viewVariables.centerY);
//         for (var i = 0, l = view.subviews.length; i < l; ++i){
//             this.addView(view.subviews[i]);
//         }
//     },

//     variables: null,

//     solve: function(){
//         var solved;
//         var variable;
//         do {
//             solved = 0;
//             for (var i = 0, l = this.variables.length; i < l; ++i){
//                 variable = this.variables[i];
//                 // TODO: partially solved variables
//                 if (!variable.isSolved){
//                     variable.solve();
//                     if (variable.isSolved){
//                         ++solved;
//                     }
//                 }
//             }
//         }while (solved > 0);
//         if (solved < this.variables.length){
//             logger.warn("Not enough constraints specified");
//         }
//         // TODO: check for conflicts
//         // TODO: apply values to items
//     }
// });