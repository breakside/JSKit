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

// #import "CHAreaChart.js"
// #import "CHSeriesStyle.js"
"use strict";

JSClass("CHStackedAreaChart", CHAreaChart, {
    
    initWithTheme: function(theme){
        CHStackedAreaChart.$super.initWithTheme.call(this, theme);
    },

    drawValuesInContext: function(context, rect){
        context.save();
        context.addRect(rect);
        context.clip();
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
        var dx = rect.size.width / (this.categoryAxis.categories.length - 1);
        var scale = rect.size.height / (this.valueAxis.maximumValue - this.valueAxis.minimumValue);
        var stacks = [];
        var y;
        var h;
        var x;
        var v;
        var valueIndex, valueCount;
        var seriesIndex, seriesCount;
        var drawingMode;
        for (valueIndex = 0, valueCount = this.categoryAxis.categories.length; valueIndex < valueCount; ++valueIndex){
            stacks.push(0);
            for (seriesIndex = 0, seriesCount = this.series.length; seriesIndex < seriesCount; ++seriesIndex){
                series = this.series[seriesIndex];
                v = series.values[valueIndex];
                if (CHChart.isValidNumericValue(v)){
                    stacks[valueIndex] += v;
                }
            }
        }
        x = 0;
        for (seriesIndex = this.series.length - 1; seriesIndex >= 0; --seriesIndex){
            series = this.series[seriesIndex];
            context.save();
            context.setFillColor(series.style.color);
            if (seriesIndex > 0){
                v = series.values[0];
                if (!CHChart.isValidNumericValue(v)){
                    v = 0;
                }
                y = ((stacks[0] - v) - this.valueAxis.minimumValue) * scale;
            }else{
                y = -this.valueAxis.minimumValue * scale;
            }
            context.moveToPoint(x, y);
            for (valueIndex = 0, valueCount = this.categoryAxis.categories.length; valueIndex < valueCount; ++valueIndex, x += dx){
                v = series.values[valueIndex];
                if (!CHChart.isValidNumericValue(v)){
                    v = 0;
                }
                y = (stacks[valueIndex] - this.valueAxis.minimumValue) * scale;
                context.addLineToPoint(x, y);
            }
            if (seriesIndex > 0){
                x -= dx;
                // > 0 condition is intentional because closePath will take care
                // of the final segment to the 0th index value
                for (valueIndex = this.categoryAxis.categories.length - 1; valueIndex > 0; --valueIndex, x -= dx){
                    v = series.values[valueIndex];
                    if (!CHChart.isValidNumericValue(v)){
                        v = 0;
                    }
                    y = ((stacks[valueIndex] - v) - this.valueAxis.minimumValue) * scale;
                    context.addLineToPoint(x, y);
                }
            }else{
                y = - this.valueAxis.minimumValue * scale;
                context.addLineToPoint(x - dx, y);
            }
            context.closePath();
            context.fillPath();
            context.restore();
            if (series.style.lineWidth > 0){
                context.save();
                if (series.style.lineColor !== null){
                    context.setStrokeColor(series.style.lineColor);
                }else{
                    context.setStrokeColor(series.style.color);
                }
                context.setLineWidth(series.style.lineWidth);
                context.setLineCap(series.style.lineCap);
                context.setLineJoin(series.style.lineJoin);
                if (series.style.lineDashLengths !== null){
                    context.setLineDash(0, series.style.lineDashLengths);
                }
                this.drawLineForValuesInContext(stacks, context, dx, scale);
                context.restore();
            }
            if (series.style.symbolPath !== null){
                drawingMode = JSContext.DrawingMode.stroke;
                context.save();
                if (series.style.symbolFillColor !== null){
                    drawingMode = JSContext.DrawingMode.fillStroke;
                    context.setFillColor(series.style.symbolFillColor);
                }
                if (series.style.symbolStrokeColor !== null){
                    context.setStrokeColor(series.style.symbolStrokeColor);
                }else if (series.style.lineColor !== null){
                    context.setStrokeColor(series.style.lineColor);
                }else{
                    context.setStrokeColor(series.color);
                }
                if (series.style.symbolLineWidth !== null){
                    context.setLineWidth(series.style.symbolLineWidth);
                }else{
                    context.setLineWidth(series.style.lineWidth);
                }
                this.drawSymbolsForValuesInContext(series.style.symbolPath, stacks, context, drawingMode, dx, scale);
                context.restore();
            }
            for (valueIndex = 0, valueCount = this.categoryAxis.categories.length; valueIndex < valueCount; ++valueIndex){
                v = series.values[valueIndex];
                if (!CHChart.isValidNumericValue(v)){
                    v = 0;
                }
                stacks[valueIndex] -= v;
            }
        }
        context.restore();
    },

});
