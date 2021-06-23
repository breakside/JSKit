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

// #import "CHCategoryChart.js"
"use strict";

JSClass("CHLineChart", CHCategoryChart, {

    drawValuesInContext: function(context, rect){
        var series;
        var i, l;
        var j, k;
        k = this.categoryAxis.categories.length;
        var v;
        var vPrevious;
        var p = JSPoint.Zero;
        var x0 = rect.origin.x;
        var x = x0;
        var dx = rect.size.width / (k - 1);
        var y;
        context.save();
        for (i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            context.save();
            context.setStrokeColor(series.color);
            context.setLineWidth(series.lineWidth);
            context.beginPath();
            if (series.dashLengths !== null){
                context.setLineDash(0, series.dashLengths);
            }
            vPrevious = null;
            x = x0;
            for (j = 0; j < k; ++j){
                v = series.values[j];
                if (v !== null && v !== undefined){
                    y = rect.origin.y + rect.size.height - (v - this.valueAxis.minimumValue) / (this.valueAxis.maximumValue - this.valueAxis.minimumValue) * rect.size.height;
                    if (vPrevious === null || vPrevious === undefined){
                        context.moveToPoint(x, y);
                    }else{
                        context.addLineToPoint(x, y);
                    }
                }
                vPrevious = v;
                x += dx;
            }
            context.strokePath();
            context.restore();
        }
        context.restore();
    }

});