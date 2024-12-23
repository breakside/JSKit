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

// #import "CHBarChart.js"
// #import "CHSeriesStyle.js"
"use strict";

JSClass("CHStackedBarChart", CHBarChart, {
    
    initWithTheme: function(theme){
        CHStackedBarChart.$super.initWithTheme.call(this, theme);
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
        var dx = rect.size.width / this.categoryAxis.categories.length;
        var scale = rect.size.height / (this.valueAxis.maximumValue - this.valueAxis.minimumValue);
        var barWidth = dx * this.barWidth;
        var cornerRadius = this.cornerRadius * barWidth / 2;
        var zeroY = -this.valueAxis.minimumValue * scale;
        var stacks = [];
        var stack;
        var y = [0, 0];
        var h;
        var x;
        var v;
        var valueIndex, valueCount;
        var seriesIndex, seriesCount;
        var barRect;
        var borderInsets;
        var maskedBorders;
        var barBorderPath;
        var maskedCorners;
        var barClipPath;
        for (valueIndex = 0, valueCount = this.categoryAxis.categories.length; valueIndex < valueCount; ++valueIndex){
            stack = [0, 0];
            for (seriesIndex = 0, seriesCount = this.series.length; seriesIndex < seriesCount; ++seriesIndex){
                series = this.series[seriesIndex];
                v = series.values[valueIndex];
                if (CHChart.isValidNumericValue(v)){
                    if (v >= 0){
                        stack[1] += v;
                    }else{
                        stack[0] += v;
                    }
                }
            }
            stacks.push(stack);
        }
        x = 0;
        for (valueIndex = 0, valueCount = this.categoryAxis.categories.length; valueIndex < valueCount; ++valueIndex, x += dx){
            stack = stacks[valueIndex];
            context.save();
            if (cornerRadius > 0){
                if (stack[0] === 0){
                    maskedCorners = CHSeriesBarStyle.Corners.pathCornersForPositiveBarCorners(this.maskedCorners);
                }else if (stack[1] === 0){
                    maskedCorners = CHSeriesBarStyle.Corners.pathCornersForNegativeBarCorners(this.maskedCorners);
                }else{
                    maskedCorners = JSPath.Corners.none;
                    if ((this.maskedCorners & CHSeriesBarStyle.Corners.endLeading) === CHSeriesBarStyle.Corners.endLeading){
                        maskedCorners |= JSPath.Corners.minXmaxY | JSPath.Corners.minXminY;
                    }
                    if ((this.maskedCorners & CHSeriesBarStyle.Corners.endTrailing) === CHSeriesBarStyle.Corners.endTrailing){
                        maskedCorners |= JSPath.Corners.maxXmaxY | JSPath.Corners.maxXminY;
                    }
                }
                if (maskedCorners !== JSPath.Corners.none){
                    y[0] = (stack[0] - this.valueAxis.minimumValue) * scale;
                    y[1] = (stack[1] - this.valueAxis.minimumValue) * scale;
                    barClipPath = JSPath.init();
                    barClipPath.addRectWithSidesAndCorners(JSRect(x + (dx - barWidth) / 2, y[0], barWidth, y[1] - y[0]), JSPath.Sides.all, maskedCorners, cornerRadius);
                    context.addPath(barClipPath);
                    context.clip();
                }
            }
            y[0] = zeroY;
            y[1] = zeroY;
            for (seriesIndex = 0, seriesCount = this.series.length; seriesIndex < seriesCount; ++seriesIndex){
                series = this.series[seriesIndex];
                context.save();
                context.setFillColor(series.style.color);
                if (series.style.borderWidth > 0){
                    context.setLineWidth(series.style.borderWidth);
                    context.setStrokeColor(series.style.borderColor);
                }
                v = series.values[valueIndex];
                if (!CHChart.isValidNumericValue(v)){
                    v = 0;
                }
                h = v * scale;
                if (v >= 0){
                    barRect = JSRect(x + (dx - barWidth) / 2, y[1], barWidth, h);
                    maskedBorders = CHSeriesBarStyle.Sides.pathSidesForPositiveBarSides(series.style.maskedBorders);
                    y[1] += h;
                }else{
                    barRect = JSRect(x + (dx - barWidth) / 2, y[0] + h, barWidth, -h);
                    maskedBorders = CHSeriesBarStyle.Sides.pathSidesForNegativeBarSides(series.style.maskedBorders);
                    y[0] += h;
                }
                if (barRect.size.height > 0){
                    context.fillRect(barRect);
                    if (series.style.borderWidth > 0){
                        if (cornerRadius === 0){
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
                            barBorderPath.addRectWithSidesAndCorners(barRect.rectWithInsets(borderInsets), maskedBorders, JSPath.Corners.none, 0);
                            context.addPath(barBorderPath);
                            context.strokePath();
                        }else{
                            // TODO: border
                            // path could be a weird one that contains part, but
                            // not all of a the rounded corners   
                        }
                    }
                }
                context.restore();
            }
            context.restore();
        }
        context.restore();
    },

});
