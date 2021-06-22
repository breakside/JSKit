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

    font: null,
    textColor: JSColor.black,
    series: null,
    indicatorPath: null,
    placement: 0,
    chartSpacing: 20,

    initWithSeries: function(series){
        this.series = series;
        this.font = JSFont.systemFontOfSize(JSFont.Size.normal);
        this.indicatorPath = JSPath.init();
        this.indicatorPath.addEllipseInRect(JSRect(0, 0, 1, 1));
        this.framesetter = JSTextFramesetter.init();
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
    },

    verticalSizeThatFitsSize: function(maxSize){
        var indicatorSize = Math.floor(this.font.ascender);
        var indicatorSpacing = Math.floor(this.font.lineHeight / 3);
        var width;
        var largestWidth = 0;
        var i, l;
        for (i = 0, l = this.series.length; i < l; ++i){
            width = this.font.widthOfString(this.series[i].name);
            if (width > largestWidth){
                largestWidth = width;
            }
        }
        var size = JSSize(this.chartSpacing + indicatorSize + indicatorSpacing + largestWidth, this.font.lineHeight * this.series.length);
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
            case CHLegend.Placement.below:
                this.drawHorizontallyInContext(context, rect);
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

    },

    drawVerticallyInContext: function(context, rect){
        var series;
        var indicatorSize = JSSize(Math.floor(this.font.ascender), Math.floor(this.font.ascender));
        var indicatorSpacing = Math.floor(this.font.lineHeight / 3);
        var indicatorPathSize = this.indicatorPath.boundingRect.size;
        var indicatorScale = JSPoint(indicatorSize.width / indicatorPathSize.width, indicatorSize.height / indicatorPathSize.height);
        var textFrame;
        var textRect = JSRect(indicatorSize.width + indicatorSpacing, 0, rect.size.width - indicatorSize.width - indicatorSpacing, 0);
        context.save();
        context.translateBy(rect.origin.x, rect.origin.y);
        for (var i = 0, l = this.series.length; i < l; ++i){
            series = this.series[i];
            context.save();
            context.setFillColor(series.color);
            context.translateBy(0, (this.font.lineHeight - indicatorSize.height) / 2);
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