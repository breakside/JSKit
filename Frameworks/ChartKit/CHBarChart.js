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
        this.defaultSeriesStyle = theme.barStyle;
    },

    barWidth: 0.67,
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
        var i, l;
        var j, k;
        k = this.categoryAxis.categories.length;
        var v;
        var x, y;
        var dx = rect.size.width / k;
        var w = dx * this.barWidth;
        var sw = w / this.series.length;
        var scale = rect.size.height / (this.valueAxis.maximumValue - this.valueAxis.minimumValue);
        var zeroY = -this.valueAxis.minimumValue * scale;
        var barRect;
        var barClipPath;
        var barBorderPath;
        var maskedBorders;
        var maskedCorners;
        var borderInsets;
        var cornerRadius = this.cornerRadius * sw / 2;
        for (i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            context.save();
            context.setFillColor(series.style.color);
            if (series.style.borderWidth > 0){
                context.setLineWidth(series.style.borderWidth);
                context.setStrokeColor(series.style.borderColor);
            }
            x = 0;
            for (j = 0; j < k; ++j){
                v = series.values[j];
                if (v !== null && v !== undefined){
                    context.save();
                    y = (v - this.valueAxis.minimumValue) * scale;
                    if (y >= zeroY){
                        barRect = JSRect(x + (dx - w) / 2 + i * sw, zeroY, sw, y - zeroY);
                        maskedBorders = CHSeriesBarStyle.Sides.pathSidesForPositiveBarSides(series.style.maskedBorders);
                        maskedCorners = CHSeriesBarStyle.Corners.pathCornersForPositiveBarCorners(this.maskedCorners);
                    }else{
                        barRect = JSRect(x + (dx - w) / 2 + i * sw, y, sw, zeroY - y);
                        maskedBorders = CHSeriesBarStyle.Sides.pathSidesForNegativeBarSides(series.style.maskedBorders);
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
                        if (series.style.borderWidth > 0){
                            borderInsets = JSInsets(series.style.borderWidth / 2);
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
                            barBorderPath.addRectWithSidesAndCorners(barRect.rectWithInsets(borderInsets), maskedBorders, maskedCorners, cornerRadius - series.style.borderWidth / 2);
                            context.addPath(barBorderPath);
                            context.strokePath();
                        }
                    }
                    context.restore();
                }
                x += dx;
            }
            context.restore();
        }
        context.restore();
    }

});
