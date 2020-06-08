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
        if (layoutFrame.minLeft == layoutFrame.maxLeft){
            frame.origin.x = layoutFrame.minLeft;
        }
        if (layoutFrame.minTop == layoutFrame.maxTop){
            frame.origin.y = layoutFrame.minTop;
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
        layoutFrame.minLeft = layoutFrame.maxLeft = view.position.x - view.anchorPoint.x * view.bounds.size.width;
        layoutFrame.minTop = layoutFrame.maxTop = view.position.y - view.anchorPoint.y * view.bounds.size.height;
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
        // We want to process higher priority constraints first.
        // - Sort the queue from low to high
        // - Iterate backwards, making it easier to remove queue items as we go
        // - Exhaust work on required constraints before attempting any optional constraints
        var queue = JSCopy(this.constraints);
        queue.sort(function(a, b){
            return a.priority - b.priority;
        });
        var i, l;
        var constraint;
        var required;
        var changes = 0;
        var conflicts = 0;
        var result;
        var remainingRequired = 0;
        for (l = queue.length - 1; i >= 0 && queue[i].priority === UILayoutPriority.required; --i){
            ++remainingRequired;
        }
        do {
            changes = 0;
            for (l = queue.length - 1; i >= 0; --i){
                constraint = queue[i];
                required = constraint.priority === UILayoutPriority.required;
                if (remainingRequired > 0 && !required && changes > 0){
                    break;
                }
                result = this._solveConstraint(constraint);
                switch (result){
                    case SolveConstraintResult.changed:
                        ++changes;
                        break;
                    case SolveConstraintResult.solved:
                        ++changes;
                        queue.splice(i, 1);
                        if (required){
                            --remainingRequired;
                        }
                        break;
                    case SolveConstraintResult.conflict:
                        ++conflicts;
                        queue.splice(i, 1);
                        if (required){
                            --remainingRequired;
                        }
                        logger.warn("Could not satisfy constraint %{public}", constraint.toString());
                        break;
                }
            }
        }while (changes > 0);
    },

    _layoutFrameForItem: function(item){
        var frame = this._layoutFramesByItemId[item.objectID];
        if (!frame){
            frame = new LayoutResolverFrame();
            var superview = item.layoutItemSuperview;
            frame.superframe = this._layoutFrameForItem(superview);
            this._layoutFramesByItemId[item.objectID] = frame;
        }
        return frame;
    },

    _solveContraint: function(constraint){
        var solver;
        var firstFrame = this._layoutFrameForItem(constraint.firstItem);
        var secondFrame = null;
        if (constraint.secondItem === null){
            solver = OneItemSolver[constraint.firstAttribute][constraint.relation];
        }else{
            secondFrame = this._layoutFrameForItem(constraint.secondItem);
            solver = TwoItemSolver[constraint.firstAttribute][constraint.relation][constraint.secondAttribute];
        }
        if (solver === undefined){
            return SolveConstraintResult.unchanged;
        }
        return solver(constraint.firstItem, firstFrame, constraint.secondItem, secondFrame, constraint.multiplier, constraint.constant, constraint.priority === UILayoutPriority.required);
    },

    _layoutFramesByItemId: null,

});

var OneItemSolver = {
    width: {
        "=": function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            return firstFrame.solveWidthEquals(0, 1, constant, required);
        },
        "<=": function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            return firstFrame.solveWidthLessThanOrEquals(0, 1, constant, required);
        },
        ">=": function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            return firstFrame.solveWidthGreaterThanOrEquals(0, 1, constant, required);
        }
    },

    height: {
        "=": function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            return firstFrame.solveHeightEquals(0, 1, constant, required);
        },
        "<=": function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            return firstFrame.solveHeightLessThanOrEquals(0, 1, constant, required);
        },
        ">=": function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            return firstFrame.solveHeightGreaterThanOrEquals(0, 1, constant, required);
        }
    }
};

var TwoItemSolver = {

    width: {
        "=": {
            width: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.width === undefined){
                    return firstFrame.solveWidthEquals(secondFrame.width, multiplier, constant, required);
                }
                return secondFrame.solveWidthEquals(firstFrame.width, 1 / multiplier, -constant / multiplier, required);
            },
            height: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.width === undefined){
                    return firstFrame.solveWidthEquals(secondFrame.height, multiplier, constant, required);
                }
                return secondFrame.solveHeightEquals(firstFrame.width, 1 / multiplier, -constant / multiplier, required);
            },
        },
        "<=": {
            width: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.width === undefined){
                    return firstFrame.solveWidthLessThanOrEquals(secondFrame.width, multiplier, constant, required);
                }
                return secondFrame.solveWidthGreaterThanOrEquals(firstFrame.width, 1 / multiplier, -constant / multiplier, required);
            },
            height: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.width === undefined){
                    return firstFrame.solveWidthLessThanOrEquals(secondFrame.height, multiplier, constant, required);
                }
                return secondFrame.solveHeightGreaterThanOrEquals(firstFrame.width, 1 / multiplier, -constant / multiplier, required);
            }
        },
        ">=": {
            width: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.width === undefined){
                    return firstFrame.solveWidthGreaterThanOrEquals(secondFrame.width, multiplier, constant, required);
                }
                return secondFrame.solveWidthLessThanOrEquals(firstFrame.width, 1 / multiplier, -constant / multiplier, required);
            },
            height: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.width === undefined){
                    return firstFrame.solveWidthGreaterThanOrEquals(secondFrame.height, multiplier, constant, required);
                }
                return secondFrame.solveHeightLessThanOrEquals(firstFrame.width, 1 / multiplier, -constant / multiplier, required);
            }
        }
    },

    height: {
        "=": {
            height: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.height === undefined){
                    return firstFrame.solveHeightEquals(secondFrame.height, multiplier, constant, required);
                }
                return secondFrame.solveHeightEquals(firstFrame.height, 1 / multiplier, -constant / multiplier, required);
            },
            width: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.height === undefined){
                    return firstFrame.solveHeightEquals(secondFrame.width, multiplier, constant, required);
                }
                return secondFrame.solveWidthEquals(firstFrame.height, 1 / multiplier, -constant / multiplier, required);
            },
        },
        "<=": {
            height: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.height === undefined){
                    return firstFrame.solveHeightLessThanOrEquals(secondFrame.height, multiplier, constant, required);
                }
                return secondFrame.solveHeightGreaterThanOrEquals(firstFrame.height, 1 / multiplier, -constant / multiplier, required);
            },
            width: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.height === undefined){
                    return firstFrame.solveHeightLessThanOrEquals(secondFrame.width, multiplier, constant, required);
                }
                return secondFrame.solveWidthGreaterThanOrEquals(firstFrame.height, 1 / multiplier, -constant / multiplier, required);
            }
        },
        ">=": {
            height: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.height === undefined){
                    return firstFrame.solveHeightGreaterThanOrEquals(secondFrame.height, multiplier, constant, required);
                }
                return secondFrame.solveHeightLessThanOrEquals(firstFrame.height, 1 / multiplier, -constant / multiplier, required);
            },
            width: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.height === undefined){
                    return firstFrame.solveHeightGreaterThanOrEquals(secondFrame.width, multiplier, constant, required);
                }
                return secondFrame.solveWidthLessThanOrEquals(firstFrame.height, 1 / multiplier, -constant / multiplier, required);
            }
        }
    },

    top: {
        "=": {
            top: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.top === undefined){
                    return firstFrame.solveTopEquals(secondFrame, 0, multiplier, constant, required);
                }
            },
            centerY: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.top === undefined && secondFrame.height !=- undefined){
                    return firstFrame.solveTopEquals(secondFrame, secondFrame.height / 2, multiplier, constant, required);
                }
            },
            bottom: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstFrame.top === undefined && secondFrame.height !=- undefined){
                    return firstFrame.solveTopEquals(secondFrame, secondFrame.height, multiplier, constant, required);
                }
            },
            firstBaseline: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            lastBaseline: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            }
        },
        "<=": {
            top: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerY: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            bottom: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            firstBaseline: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            lastBaseline: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            }
        },
        ">=": {
            top: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerY: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            bottom: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            firstBaseline: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            lastBaseline: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            }
        }
    },

    left: {
        "=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        "<=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        ">=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        }
    },

    right: {
        "=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        "<=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        ">=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (secondItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        }
    },

    leading: {
        "=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        "<=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["<="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["<="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["<="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["<="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right["<="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left["<="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        ">=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right[">="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left[">="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right[">="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left[">="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.right[">="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.left[">="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        }
    },

    trailing: {
        "=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        "<=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["<="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["<="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["<="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["<="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["<="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["<="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left["<="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right["<="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        },
        ">=": {
            left: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right[">="].left(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            centerX: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left[">="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right[">="].centerX(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            right: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right[">="].right(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            leading: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left[">="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right[">="].leading(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            },
            trailing: function(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required){
                if (firstItem.layoutItemView.layoutDirection == UILayoutDirection.rightToLeft){
                    return TwoItemSolver.left[">="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
                }
                return TwoItemSolver.right[">="].trailing(firstItem, firstFrame, secondItem, secondFrame, multiplier, constant, required);
            }
        }
    },

};

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
    minLeft: Number.MIN_VALUE,
    maxLeft: Number.MAX_VALUE,
    minTop: Number.MIN_VALUE,
    maxTop: Number.MAX_VALUE,
    minWidth: 0,
    maxWidth: Number.MAX_VALUE,
    minHeight: 0,
    maxHeight: Number.MAX_VALUE,

    superframe: null,

    _solvePropertyEquals: function(minPropertyName, maxPropertyName, base, multiplier, constant, required){
        // 1. If we don't have a well defined base value, we can't change anything
        if (base === undefined){
            return SolveConstraintResult.unchanged;
        }
        // 2. If the final value is within the allowed range, it is the solution
        var value = base * multiplier + constant;
        if (value >= this[minPropertyName] && value <= this[maxPropertyName]){
            this[minPropertyName] = this[maxPropertyName] = value;
            return SolveConstraintResult.solved;
        }
        // 3. If the final value is outside the allowed range
        //    and the constraint is required, it's a conflict
        if (required){
            return SolveConstraintResult.conflict;
        }
        // 4. If the constraint is optional, collapse the allowed range to
        //    pull the solution as close to the final value as possible.
        if (value < this[minPropertyName]){
            this[maxPropertyName] = this[minPropertyName];
            return SolveConstraintResult.solved;
        }
        this[minPropertyName] = this[maxPropertyName];
        return SolveConstraintResult.solved;
    },

    _solvePropertyLessThanOrEquals: function(minPropertyName, maxPropertyName, base, multiplier, constant, required){
        if (base === undefined){
            return SolveConstraintResult.unchanged;
        }
        var maxValue = base * multiplier + constant;
        if (maxValue >= this[maxPropertyName]){
            return SolveConstraintResult.unchanged;
        }
        if (maxValue > this[minPropertyName]){
            this[maxPropertyName] = maxValue;
            return SolveConstraintResult.changed;
        }
        if (maxValue == this[minPropertyName]){
            this[maxPropertyName] = maxValue;
            return SolveConstraintResult.solved;
        }
        if (required){
            return SolveConstraintResult.conflict;
        }
        this[maxPropertyName] = this[minPropertyName];
        return SolveConstraintResult.solved;
    },

    _solvePropertyGreaterThanOrEquals: function(minPropertyName, maxPropertyName, base, multiplier, constant, required){
        if (base === undefined){
            return SolveConstraintResult.unchanged;
        }
        var minValue = base * multiplier + constant;
        if (minValue <= this[minPropertyName]){
            return SolveConstraintResult.unchanged;
        }
        if (minValue < this[maxPropertyName]){
            this[minPropertyName] = minValue;
            return SolveConstraintResult.changed;
        }
        if (minValue == this[maxPropertyName]){
            this[minPropertyName] = minValue;
            return SolveConstraintResult.solved;
        }
        if (required){
            return SolveConstraintResult.conflict;
        }
        this[minPropertyName] = this[maxPropertyName];
        return SolveConstraintResult.solved;
    },

    solveWidthEquals: function(base, multiplier, constant, required){
        return this._solvePropertyEquals('minWidth', 'maxWidth', base, multiplier, constant, required);
    },

    solveWidthLessThanOrEquals: function(base, multiplier, constant, required){
        return this._solvePropertyLessThanOrEquals('minWidth', 'maxWidth', base, multiplier, constant, required);
    },

    solveWidthGreaterThanOrEquals: function(base, multiplier, constant, required){
        return this._solvePropertyGreaterThanOrEquals('minWidth', 'maxWidth', base, multiplier, constant, required);
    },

    solveHeightEquals: function(base, multiplier, constant, required){
        return this._solvePropertyEquals('minHeight', 'maxHeight', base, multiplier, constant, required);
    },

    solveHeightLessThanOrEquals: function(base, multiplier, constant, required){
        return this._solvePropertyLessThanOrEquals('minHeight', 'maxHeight', base, multiplier, constant, required);
    },

    solveHeightGreaterThanOrEquals: function(base, multiplier, constant, required){
        return this._solvePropertyGreaterThanOrEquals('minHeight', 'maxHeight', base, multiplier, constant, required);
    },

    solveTopEquals: function(referenceFrame, base, multiplier, constant, required){
        if (base === undefined){
            return SolveConstraintResult.unchanged;
        }
        if (this.superframe == referenceFrame){
            return this._solvePropertyEquals('minTop', 'maxTop', base, multiplier, constant, required);
        }
        if (referenceFrame.superframe == this){
            return this._solvePropertyEquals('minTop', 'maxTop', base, 1 / multiplier, -constant / multiplier, required);
        }
        if (this.superframe == referenceFrame.superframe){
            if (referenceFrame.top !== undefined){
                return this._solvePropertyEquals('minTop', 'maxTop', base + referenceFrame.top, multiplier, constant, required);
            }
        }
        // TODO: more distant relationships
        return SolveConstraintResult.unchanged;
    }
};

Object.defineProperties(LayoutResolverFrame.prototye, {
    top: {
        get: function LayoutResolverFrame_getTop(){
            if (this.minTop == this.maxTop){
                return this.minTop;
            }
            return undefined;
        }
    },
    left: {
        get: function LayoutResolverFrame_getLeft(){
            if (this.minLeft == this.maxLeft){
                return this.minLeft;
            }
            return undefined;
        }
    },
    width: {
        get: function LayoutResolverFrame_getWidth(){
            if (this.minWidth == this.maxWidth){
                return this.minWidth;
            }
            return undefined;
        }
    },
    height: {
        get: function LayoutResolverFrame_getHeight(){
            if (this.minHeight == this.maxHeight){
                return this.minHeight;
            }
            return undefined;
        }
    },
    bottom: {
        get: function LayoutResolverFrame_getBottom(){
            if (this.minTop == this.maxTop && this.minHeight == this.maxHeight){
                return this.minTop + this.minHeight;
            }
            return undefined;
        }
    },
    right: {
        get: function LayoutResolverFrame_getRight(){
            if (this.minLeft == this.maxLeft && this.minWidth == this.maxWidth){
                return this.minLeft + this.minWidth;
            }
            return undefined;
        }
    }
});

var SolveConstraintResult = {
    unchanged: 0,
    changed: 1,
    solved: 2,
    conflict: 3
};

})();