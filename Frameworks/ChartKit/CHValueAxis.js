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

JSClass("CHValueAxis", CHAxis, {

    minimumValue: 0,
    maximumValue: 1,
    numberOfMajorSteps: 4,
    numberOfMinorSteps: 0,
    valueFormatter: null,
    adjustsToFit: false,
    allowsTruncation: false,

    initWithStyle: function(style){
        CHValueAxis.$super.initWithStyle.call(this, style);
        this.valueFormatter = JSNumberFormatter.init();
        this.valueFormatter.format = "#,##0";
    },

    _minimumSeenValue: Number.MAX_VALUE,
    _maximumSeenValue: -Number.MAX_VALUE,

    updateRangeForValues: function(values){
        if (values.length === 0){
            return;
        }
        var value;
        for (var i = 0, l = values.length; i < l; ++i){
            value = values[i];
            if (value < this._minimumSeenValue){
                this._minimumSeenValue = value;
            }
            if (value > this._maximumSeenValue){
                this._maximumSeenValue = value;
            }
        }
        var max = this._maximumSeenValue;
        var min = this._minimumSeenValue;
        if (this.allowsValueAxisTruncation){
            if (max < 0){
                max = 0;
            }else if (min > 0){
                min = 0;
            }
        }
        var d = max - min;
    },

    getMajorPositions: function(x0, x1){
        var dx = (x1 - x0) / this.numberOfMajorSteps;
        var positions = [x0];
        var x = x0 + dx;
        for (var i = 1; i < this.numberOfMajorSteps; ++i, x += dx){
            positions.push(x);
        }
        positions.push(x1);
        return positions;
    },

    getMinorPositions: function(x0, x1){
        if (this.numberOfMinorSteps < 2){
            return [];
        }
        var positions = [];
        var majorPositions = this.getMajorPositions(x0, x1);
        var dx = (x1 - x0) / this.numberOfMajorSteps / this.numberOfMinorSteps;
        var x;
        for (var i = 0, l = majorPositions.length; i < l; ++i){
            x = majorPositions[i] + dx;
            for (var j = 0; j < this.numberOfMinorSteps - 1; ++j, x += dx){
                positions.push(x);
            }
        }
        return positions;
    },

    getMajorLabels: function(){
        var dv = (this.maximumValue - this.minimumValue) / this.numberOfMajorSteps;
        var labels = [this.valueFormatter.stringFromNumber(this.minimumValue)];
        var v = this.minimumValue + dv;
        for (var i = 1; i < this.numberOfMajorSteps; ++i, v += dv){
            labels.push(this.valueFormatter.stringFromNumber(v));
        }
        labels.push(this.valueFormatter.stringFromNumber(this.maximumValue));
        return labels;
    },

});