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

JSClass("CHLegend", JSObject, {

    font: JSDynamicProperty("_font", null),
    textColor: JSColor.black,
    series: null,
    indicatorPath: null,
    indicatorSize: null,
    indicatorSpacing: 0,
    seriesSpacing: 0,
    placement: 0,
    chartSpacing: 0,

    initWithSeries: function(series){
        this.series = series;
        this.font = JSFont.systemFontOfSize(JSFont.Size.normal);
        this.indicatorPath = JSPath.init();
        this.indicatorPath.addRect(JSRect(0, 0, 1, 1));
        this.framesetter = JSTextFramesetter.init();
    },

    setFont: function(font){
        this._font = font;
        this.recalculateFontDerivedSizes();
    },

    recalculateFontDerivedSizes: function(){
        this.indicatorSize = JSSize(Math.floor(this.font.ascender), Math.floor(this.font.ascender));
        this.indicatorSpacing = Math.floor(this.font.lineHeight / 3);
        this.seriesSpacing = this.font.lineHeight;
        this.chartSpacing = Math.floor(this.font.lineHeight * 1.2);
    },

    sizeThatFitsSize: function(maxSize){
        switch (this.placement){
            case CHLegend.Placement.above:
            case CHLegend.Placement.below:
                return this.horizontalSizeThatFitsSize(maxSize);
            case CHLegend.Placement.left:
            case CHLegend.Placement.right:
                return this.verticalSizeThatFitsSize(maxSize);
            case CHLegend.Placement.none:
            default:
                return JSSize.Zero;
        }
    },

    horizontalSizeThatFitsSize: function(maxSize){
        var origin = JSPoint.Zero;
        var width;
        var largestWidth = 0;
        var i, l;
        for (i = 0, l = this.series.length; i < l; ++i){
            width = this.indicatorSize.width + this.indicatorSpacing + this.font.widthOfString(this.series[i].name);
            if (origin.x > 0 && origin.x + this.seriesSpacing + width > maxSize.width){
                origin.y += this.font.lineHeight;
                origin.x = 0;
            }else{
                width += this.seriesSpacing;
            }
            origin.x += width;
            if (origin.x > largestWidth){
                largestWidth = origin.x;
            }
        }
        var size = JSSize(largestWidth, origin.y + this.font.lineHeight + this.chartSpacing);
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        return size;
    },

    verticalSizeThatFitsSize: function(maxSize){
        var width;
        var largestWidth = 0;
        var i, l;
        for (i = 0, l = this.series.length; i < l; ++i){
            width = this.font.widthOfString(this.series[i].name);
            if (width > largestWidth){
                largestWidth = width;
            }
        }
        var size = JSSize(
            this.chartSpacing + this.indicatorSize.width + this.indicatorSpacing + largestWidth,
            this.font.lineHeight * this.series.length
        );
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        return size;
    },

    drawInContext: function(context, rect){
        switch (this.placement){
            case CHLegend.Placement.above:
                this.drawHorizontallyInContext(context, rect.rectWithInsets(0, 0, this.chartSpacing, 0));
                break;
            case CHLegend.Placement.below:
                this.drawHorizontallyInContext(context, rect.rectWithInsets(this.chartSpacing, 0, 0, 0));
                break;
            case CHLegend.Placement.left:
                this.drawVerticallyInContext(context, rect.rectWithInsets(0, 0, 0, this.chartSpacing));
                break;
            case CHLegend.Placement.right:
                this.drawVerticallyInContext(context, rect.rectWithInsets(0, this.chartSpacing, 0, 0));
                break;
            case CHLegend.Placement.none:
            default:
                break;
        }
    },

    drawHorizontallyInContext: function(context, rect){
        var series;
        var indicatorPathSize = this.indicatorPath.boundingRect.size;
        var indicatorScale = JSPoint(this.indicatorSize.width / indicatorPathSize.width, this.indicatorSize.height / indicatorPathSize.height);
        var textFrame;
        var width;
        var origin = JSPoint.Zero;
        context.save();
        context.translateBy(rect.origin.x, rect.origin.y);
        for (var i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            width = this.indicatorSize.width + this.indicatorSpacing + this.font.widthOfString(series.name);
            if (origin.x > 0){
                if (origin.x + this.seriesSpacing + width > rect.size.width){
                    origin.y += this.font.lineHeight;
                    origin.x = 0;
                }else{
                    origin.x += this.seriesSpacing;  
                }
            }
            context.save();
            context.translateBy(origin.x, origin.y);
            context.setFillColor(series.color);
            context.translateBy(0, (this.font.lineHeight - this.indicatorSize.height) / 2);
            context.scaleBy(indicatorScale.x, indicatorScale.y);
            context.addPath(this.indicatorPath);
            context.fillPath();
            context.restore();
            origin.x += this.indicatorSize.width + this.indicatorSpacing;
            this.framesetter.attributedString = JSAttributedString.initWithString(series.name, {
                font: this.font,
                textColor: this.textColor
            });
            textFrame = this.framesetter.createFrame(JSSize(rect.size.width - origin.x, 0), JSRange(0, series.name.length), 1);
            textFrame.drawInContextAtPoint(context, origin);
            origin.x += textFrame.usedSize.width;
        }
        context.restore();

    },

    drawVerticallyInContext: function(context, rect){
        var series;
        var indicatorPathSize = this.indicatorPath.boundingRect.size;
        var indicatorScale = JSPoint(this.indicatorSize.width / indicatorPathSize.width, this.indicatorSize.height / indicatorPathSize.height);
        var textFrame;
        var textRect = JSRect(this.indicatorSize.width + this.indicatorSpacing, 0, rect.size.width - this.indicatorSize.width - this.indicatorSpacing, 0);
        context.save();
        context.translateBy(rect.origin.x, rect.origin.y);
        for (var i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            context.save();
            context.setFillColor(series.color);
            context.translateBy(0, (this.font.lineHeight - this.indicatorSize.height) / 2);
            context.scaleBy(indicatorScale.x, indicatorScale.y);
            context.addPath(this.indicatorPath);
            context.fillPath();
            context.restore();
            this.framesetter.attributedString = JSAttributedString.initWithString(series.name, {
                font: this.font,
                textColor: this.textColor
            });
            textFrame = this.framesetter.createFrame(textRect.size, JSRange(0, series.name.length), 1);
            textFrame.drawInContextAtPoint(context, textRect.origin);
            context.translateBy(0, this.font.lineHeight);
        }
        context.restore();
    },

});

CHLegend.Placement = {
    none: 0,
    above: 1,
    below: 2,
    left: 3,
    right: 4
};