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
// #import "CHSeriesStyle.js"
"use strict";

JSClass("CHLineChart", CHCategoryChart, {
    
    initWithTheme: function(theme){
        CHLineChart.$super.initWithTheme.call(this, theme);
        this.defaultSeriesStyle = theme.lineStyle;
    },

    drawValuesInContext: function(context, rect){
        context.save();
        context.translateBy(rect.origin.x, rect.origin.y);
        if (this.valueAxis.direction === CHAxis.Direction.vertical){
            context.translateBy(0, rect.size.height);
            context.scaleBy(1, -1);
        }else{
            context.rotateByDegrees(90);
            context.scaleBy(1, -1);
            rect = JSRect(0, 0, rect.size.height, rect.size.width);
        }
        var series;
        var i, l;
        var j, k;
        k = this.categoryAxis.categories.length;
        var v;
        var vPrevious;
        var p = JSPoint.Zero;
        var x, y;
        var dx = rect.size.width / (k - 1);
        var scale = rect.size.height / (this.valueAxis.maximumValue - this.valueAxis.minimumValue);
        for (i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            context.save();
            context.setStrokeColor(series.style.color);
            context.setLineWidth(series.style.lineWidth);
            context.setLineCap(series.style.lineCap);
            context.beginPath();
            if (series.style.lineDashLengths !== null){
                context.setLineDash(0, series.style.lineDashLengths);
            }
            vPrevious = null;
            x = 0;
            for (j = 0; j < k; ++j){
                v = series.values[j];
                if (v !== null && v !== undefined){
                    y = (v - this.valueAxis.minimumValue) * scale;
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
            if (series.style.symbolPath !== null){
                context.save();
                if (series.style.symbolFillColor){
                    context.setFillColor(series.style.symbolFillColor);
                }
                if (series.style.symbolStrokeColor !== null){
                    context.setStrokeColor(series.style.symbolStrokeColor);
                }else{
                    context.setStrokeColor(series.style.color);
                }
                if (series.style.symbolLineWidth !== null){
                    context.setLineWidth(series.style.symbolLineWidth);
                }else{
                    context.setLineWidth(series.style.lineWidth);
                }
                x = 0;
                for (j = 0; j < k; ++j){
                    v = series.values[j];
                    if (v !== null && v !== undefined){
                        y = (v - this.valueAxis.minimumValue) * scale;
                        context.save();
                        context.translateBy(x, y);
                        context.addPath(series.style.symbolPath);
                        context.drawPath(series.style.symbolFillColor !== null ? JSContext.DrawingMode.fillStroke : JSContext.DrawingMode.stroke);
                        context.restore();
                    }
                    x += dx;
                }
                context.restore();
            }
        }
        context.restore();
    }

});