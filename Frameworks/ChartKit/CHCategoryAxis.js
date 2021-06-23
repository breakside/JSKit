// Copyright 2021 Breakside Inc.
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

// #import "CHAxis.js"
"use strict";

JSClass("CHCategoryAxis", CHAxis, {

    init: function(){
        CHCategoryAxis.$super.init.call(this);
        this.categories = [];
    },

    categories: null,

    sizeOfLargestLabel: function(){
        return JSSize(0, this.labelFont.lineHeight);
    },

    getMajorPositions: function(x0, x1){
        var steps = this.categories.length;
        if (this.labelPosition !== CHAxis.LabelPosition.betweenTickMarks){
            steps -= 1;
        }
        var dx = (x1 - x0) / steps;
        var positions = [x0];
        var x = x0 + dx;
        for (var i = 1; i < steps; ++i, x += dx){
            positions.push(x);
        }
        positions.push(x1);
        return positions;
    },

    getMajorLabels: function(){
        return this.categories;
    }


});