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

JSClass("CHBarChart", CHCategoryChart, {
    
    initWithTheme: function(theme){
        CHBarChart.$super.initWithTheme.call(this, theme);
        this.categoryAxis.labelPosition = CHAxis.LabelPosition.betweenTickMarks;
        this.defaultSeriesStyle = theme.barStyle.styleWithColor(null);
    },

    barWidth: 0.65,
    maskedCorners: CHSeriesBarStyle.Corners.all,
    cornerRadius: 0,

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
        var dx = rect.size.width / this.categoryAxis.categories.length;
        var scale = rect.size.height / (this.valueAxis.maximumValue - this.valueAxis.minimumValue);
        for (var i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            context.save();
            context.setFillColor(series.style.color);
            if (series.style.borderWidth > 0){
                context.setLineWidth(series.style.borderWidth);
                context.setStrokeColor(series.style.borderColor);
            }
            this.drawBarsForValuesInContext(series.values, context, i, series.style, dx, scale);
            context.restore();
        }
        context.restore();
    },

    drawBarsForValuesInContext: function(values, context, seriesIndex, style, dx, scale){
        var categoryWidth = dx * this.barWidth;
        var barWidth = categoryWidth / this.series.length;
        var zeroY = -this.valueAxis.minimumValue * scale;
        var barRect;
        var barClipPath;
        var barBorderPath;
        var maskedBorders;
        var maskedCorners;
        var borderInsets;
        var cornerRadius = this.cornerRadius * barWidth / 2;
        var x, y;
        var v;
        x = 0;
        for (var i = 0, l = values.length; i < l; ++i, x += dx){
            v = values[i];
            if (CHChart.isValidNumericValue(v)){
                context.save();
                y = (v - this.valueAxis.minimumValue) * scale;
                if (v >= 0){
                    barRect = JSRect(x + (dx - categoryWidth) / 2 + seriesIndex * barWidth, zeroY, barWidth, y - zeroY);
                    maskedBorders = CHSeriesBarStyle.Sides.pathSidesForPositiveBarSides(style.maskedBorders);
                    maskedCorners = CHSeriesBarStyle.Corners.pathCornersForPositiveBarCorners(this.maskedCorners);
                }else{
                    barRect = JSRect(x + (dx - categoryWidth) / 2 + seriesIndex * barWidth, y, barWidth, zeroY - y);
                    maskedBorders = CHSeriesBarStyle.Sides.pathSidesForNegativeBarSides(style.maskedBorders);
                    maskedCorners = CHSeriesBarStyle.Corners.pathCornersForNegativeBarCorners(this.maskedCorners);
                }
                if (barRect.size.height > 0){
                    if (cornerRadius > 0 && maskedCorners !== JSPath.Corners.none){
                        barClipPath = JSPath.init();
                        barClipPath.addRectWithSidesAndCorners(barRect, JSPath.Sides.all, maskedCorners, cornerRadius);
                        context.addPath(barClipPath);
                        context.clip();
                    }
                    context.fillRect(barRect);
                    if (style.borderWidth > 0){
                        borderInsets = JSInsets(style.borderWidth / 2);
                        if ((maskedBorders & JSPath.Sides.minX) === 0){
                            borderInsets.left = 0;
                        }
                        if ((maskedBorders & JSPath.Sides.minY) === 0){
                            borderInsets.top = 0;
                        }
                        if ((maskedBorders & JSPath.Sides.maxX) === 0){
                            borderInsets.right = 0;
                        }
                        if ((maskedBorders & JSPath.Sides.maxY) === 0){
                            borderInsets.bottom = 0;
                        }
                        barBorderPath = JSPath.init();
                        barBorderPath.addRectWithSidesAndCorners(barRect.rectWithInsets(borderInsets), maskedBorders, maskedCorners, cornerRadius - style.borderWidth / 2);
                        context.addPath(barBorderPath);
                        context.strokePath();
                    }
                }
                context.restore();
            }
        }
    },

    drawSymbolForNameInLegendAtIndex: function(legend, index, context, rect){
        var series = this.series[index];
        context.setFillColor(series.style.color);
        context.addRect(rect);
        context.fillPath();
        if (series.style.borderWidth > 0){
            context.setStrokeColor(series.style.borderColor);
            context.setLineWidth(series.style.borderWidth);
            var borderInsets = JSInsets(series.style.borderWidth / 2);
            var maskedBorders = CHSeriesBarStyle.Sides.pathSidesForPositiveBarSides(series.style.maskedBorders);
            if ((maskedBorders & JSPath.Sides.minX) === 0){
                borderInsets.left = 0;
            }
            if ((maskedBorders & JSPath.Sides.minY) === 0){
                borderInsets.top = 0;
            }
            if ((maskedBorders & JSPath.Sides.maxX) === 0){
                borderInsets.right = 0;
            }
            if ((maskedBorders & JSPath.Sides.maxY) === 0){
                borderInsets.bottom = 0;
            }
            var barBorderPath = JSPath.init();
            barBorderPath.addRectWithSidesAndCorners(rect.rectWithInsets(borderInsets), maskedBorders, JSPath.Corners.all, 0);
            context.addPath(barBorderPath);
            context.strokePath();
        }
    }

});
