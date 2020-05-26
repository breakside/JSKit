// #import Foundation
// #import "UILayoutConstraint.js"
'use strict';

(function(){

var logger = JSLog("uikit", "layout");

JSClass("UILayoutResolver", JSObject, {

    init: function(){
        this.requiredConstraints = [];
        this.optionalConstraints = [];
    },

    frameForItem: function(item){
    },

    updateFramesIfNeeded: function(){
    },

    requiredConstraints: null,
    optionalConstraints: null,

    addConstraint: function(constraint){
        if (constraint.priority == UILayoutPriority.required){
            this.requiredConstraints.push(constraint);
        }else{
            var searcher = JSBinarySearcher(this.optionalConstraints, function(a, b){
                return b.priority - a.priority;
            });
            var index = searcher.insertionIndexForValue(constraint);
            this.optionalConstraints.splice(index, 0, constraint);
        }
    },

});

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