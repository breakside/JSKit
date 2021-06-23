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

JSClass("CHBarChart", CHCategoryChart, {
    
    initWithTheme: function(theme){
        CHBarChart.$super.initWithTheme.call(this, theme);
        this.categoryAxis.labelPosition = CHAxis.LabelPosition.betweenTickMarks;
    },

    barWidth: 0.67,

    drawValuesInContext: function(context, rect){
        // TODO: flipped axis, probably easiest to to coordinate transformations
        // FIXME: assumes 0 value is axis line
        var series;
        var i, l;
        var j, k;
        k = this.categoryAxis.categories.length;
        var v;
        var vPrevious;
        var p = JSPoint.Zero;
        var x0 = rect.origin.x;
        var x = x0;
        var dx = rect.size.width / (k);
        var y;
        var w = dx * this.barWidth;
        var sw = w / this.series.length;
        context.save();
        for (i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            context.save();
            context.setFillColor(series.color);
            vPrevious = null;
            x = x0;
            for (j = 0; j < k; ++j){
                context.beginPath();
                v = series.values[j];
                if (v !== null && v !== undefined){
                    y = rect.origin.y + rect.size.height - (v - this.valueAxis.minimumValue) / (this.valueAxis.maximumValue - this.valueAxis.minimumValue) * rect.size.height;
                    context.addRect(JSRect(x + (dx - w) / 2 + i * sw, y, sw, rect.origin.y + rect.size.height - y));
                }
                vPrevious = v;
                x += dx;
                context.fillPath();
            }
            context.restore();
        }
        context.restore();
    }

});