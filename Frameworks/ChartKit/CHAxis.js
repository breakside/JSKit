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

// #import Foundation
"use strict";

JSClass("CHAxis", JSObject, {

    initWithDirection: function(direction){
        this._direction = direction;
        this.lineWidth = 1;
        this.labelFont = JSFont.systemFontOfSize(JSFont.Size.normal);
    },

    direction: 0,
    name: null,
    lineWidth: 0,
    lineColor: JSColor.black,

    showsLabels: true,
    labelFont: null,
    labelAngle: 0,

    showsMajorTickMarks: false,
    majorTickMarkLength: 5,
    majorTickMarkWidth: 1,
    majorTickMarkColor: JSColor.black,

    showsMinorTickMarks: false,
    minorTickMarkLength: 3,
    minorTickMarkWidth: 1,
    minorTickMarkColor: JSColor.initWithWhite(0.4),

    sizeThatFits: function(){
        var size = JSSize.Zero;
        if (this._direction === CHAxis.Direction.horizontal){

        }else{
            
        }
        return size;
    },

    sizeOfLargestLabel: function(){
    },

    drawInContext: function(context, rect){
    }

});

CHAxis.Direction = {
    horizontal: 0,
    vertical: 1
};