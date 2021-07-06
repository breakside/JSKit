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
        this.defaultSeriesStyle = theme.lineStyle.styleWithColor(null);
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
        var dx = rect.size.width / (this.categoryAxis.categories.length - 1);
        var scale = rect.size.height / (this.valueAxis.maximumValue - this.valueAxis.minimumValue);
        var path;
        var drawingMode;
        for (i = this.series.length - 1; i >= 0; --i){
            series = this.series[i];
            context.save();
            context.setStrokeColor(series.style.color);
            context.setLineWidth(series.style.lineWidth);
            context.setLineCap(series.style.lineCap);
            if (series.style.lineDashLengths !== null){
                context.setLineDash(0, series.style.lineDashLengths);
            }
            path = this.drawLineForValuesInContext(series.values, context, dx, scale);
            context.restore();
            if (series.style.symbolPath !== null){
                drawingMode = JSContext.DrawingMode.stroke;
                context.save();
                if (series.style.symbolFillColor !== null){
                    drawingMode = JSContext.DrawingMode.fillStroke;
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
                this.drawSymbolsForValuesInContext(series.style.symbolPath, series.values, context, drawingMode, dx, scale);
                context.restore();
            }
        }
        context.restore();
    },

    drawLineForValuesInContext: function(values, context, dx, scale){
        var x, y;
        x = 0;
        var v;
        for (var i = 0, l = values.length; i < l; ++i, x += dx){
            v = values[i];
            if (CHChart.isValidNumericValue(v)){
                y = (v - this.valueAxis.minimumValue) * scale;
                if (i === 0 || !CHChart.isValidNumericValue(values[i - 1])){
                    context.moveToPoint(x, y);
                }else{
                    context.addLineToPoint(x, y);
                }
            }
        }
        context.strokePath();
    },

    drawSymbolsForValuesInContext: function(symbolPath, values, context, drawingMode, dx, scale){
        var x, y;
        x = 0;
        var v;
        for (var i = 0, l = values.length; i < l; ++i, x += dx){
            v = values[i];
            if (CHChart.isValidNumericValue(v)){
                y = (v - this.valueAxis.minimumValue) * scale;
                context.save();
                context.translateBy(x, y);
                context.addPath(symbolPath);
                context.drawPath(drawingMode);
                context.restore();
            }
        }
    },

    drawSymbolForNameInLegendAtIndex: function(legend, index, context, rect){
        var series = this.series[index];
        context.save();
        context.setStrokeColor(series.style.color);
        context.setLineWidth(series.style.lineWidth);
        context.setLineCap(series.style.lineCap);
        if (series.style.lineDashLengths !== null){
            context.setLineDash(0, series.style.lineDashLengths);
        }
        context.moveToPoint(rect.origin.x, rect.origin.y + rect.size.height / 2);
        context.addLineToPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height / 2);
        context.strokePath();
        context.restore();
        if (series.style.symbolPath !== null){
            var drawingMode = JSContext.DrawingMode.stroke;
            context.save();
            if (series.style.symbolFillColor !== null){
                drawingMode = JSContext.DrawingMode.fillStroke;
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
            context.translateBy(rect.origin.x + rect.size.width / 2, rect.origin.y + rect.size.height / 2);
            context.addPath(series.style.symbolPath);
            context.drawPath(drawingMode);
            context.restore();
        }
    },

    widthOfSymbolsInLegend: function(legend, height){
        return height * 2;
    }

});